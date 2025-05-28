// src/components/IssueShares.jsx
import { useState, useEffect } from "react";
import { getTokenContract } from "../web3";
import { formatNumber } from "../utils/format";

const IssueShares = ({ web3, contract, account, chainId }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [estimatedShares, setEstimatedShares] = useState("0");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFirstIssuance, setIsFirstIssuance] = useState(false);
  const MIN_ISSUE_AMOUNT = 1;
  const FEE_PERCENTAGE = 0.005; // 0.5% fee for PLSTR
  const FALLBACK_GAS_LIMIT = chainId === 369 && isFirstIssuance ? 5000000 : 3500000; // Higher for first xBOND issuance

  const checkPoolExists = async () => {
    if (!contract || !chainId) return;
    try {
      const poolAddress = await contract.methods.getPoolAddress().call();
      setIsFirstIssuance(poolAddress === "0x0000000000000000000000000000000000000000");
      console.log("Pool check:", { poolAddress, isFirstIssuance: poolAddress === "0x0000000000000000000000000000000000000000" });
    } catch (err) {
      console.error("Failed to check pool:", err);
      setError("Failed to verify pool status. Assuming first issuance for safety.");
      setIsFirstIssuance(true);
    }
  };

  const fetchBalance = async () => {
    if (!web3 || !account || !chainId) {
      console.error("Missing dependencies:", { web3, account, chainId });
      setError("Please ensure your wallet is connected and network selected.");
      return;
    }
    try {
      setError("");
      const tokenContract = await getTokenContract(web3);
      if (!tokenContract) throw new Error("Failed to initialize token contract");
      const balance = await tokenContract.methods.balanceOf(account).call();
      setTokenBalance(web3.utils.fromWei(balance, "ether"));
      console.log(`${chainId === 1 ? "vPLS" : "PLSX"} balance:`, balance.toString());
    } catch (err) {
      console.error(`Failed to fetch ${chainId === 1 ? "vPLS" : "PLSX"} balance:`, err);
      setError(`Failed to load balance: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (web3 && account && chainId) {
      fetchBalance();
      checkPoolExists();
    }
  }, [web3, account, chainId]);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        if (amount && Number(amount) > 0 && contract && web3) {
          const amountNum = Number(amount);
          if (isNaN(amountNum) || amountNum < MIN_ISSUE_AMOUNT) {
            throw new Error(`Amount must be at least ${MIN_ISSUE_AMOUNT} ${chainId === 1 ? "vPLS" : "PLSX"}`);
          }
          const amountWei = web3.utils.toWei(amount, "ether");
          let shares, fee;
          if (chainId === 1) {
            const result = await contract.methods.calculateSharesReceived(amountWei).call({ from: account });
            shares = (typeof result === "object" ? result[0] : result).toString();
            fee = (amountNum * FEE_PERCENTAGE).toWei("ether");
          } else {
            const result = await contract.methods.calculateSharesReceived(amountWei).call({ from: account });
            [shares, fee] = result;
          }
          setEstimatedShares(web3.utils.fromWei(shares, "ether"));
          setEstimatedFee(web3.utils.fromWei(fee, "ether"));
          console.log("Estimated shares:", { amount, shares, fee, chainId });
        } else {
          setEstimatedShares("0");
          setEstimatedFee("0");
        }
      } catch (err) {
        console.error("Failed to fetch estimate:", err);
        setError(`Failed to estimate shares: ${err.message || "Contract error"}`);
      }
    };
    if (contract && web3 && chainId && account) fetchEstimate();
  }, [contract, web3, amount, chainId, account]);

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      const numValue = rawValue === "" ? "" : Number(rawValue);
      setAmount(rawValue);
      setDisplayAmount(rawValue ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 18 }).format(numValue) : "");
    }
  };

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const amountNum = Number(amount);
      if (amountNum < MIN_ISSUE_AMOUNT) {
        throw new Error(`Amount must be at least ${MIN_ISSUE_AMOUNT} ${chainId === 1 ? "vPLS" : "PLSX"}`);
      }
      const tokenContract = await getTokenContract(web3);
      if (!tokenContract) throw new Error("Failed to initialize token contract");
      const amountWei = web3.utils.toWei(amount, "ether");

      // Approve token
      console.log("Approving:", { amountWei, contractAddress: contract.options.address });
      await tokenContract.methods
        .approve(contract.options.address, amountWei)
        .send({ from: account })
        .on("transactionHash", (hash) => console.log("Approval tx:", hash));

      // Estimate gas
      let gasLimit = FALLBACK_GAS_LIMIT;
      try {
        gasLimit = await contract.methods.issueShares(amountWei).estimateGas({ from: account });
        gasLimit = Math.floor(gasLimit * 1.2); // 20% buffer
        console.log("Gas estimated:", { gasLimit });
      } catch (gasErr) {
        console.warn("Gas estimation failed, using fallback:", { error: gasErr.message, fallback: gasLimit });
        setError(
          `Gas estimation failed. Using ${gasLimit.toLocaleString()} gas limit. ${
            isFirstIssuance ? "First issuance requires high gas for pool creation." : ""
          } Please confirm the transaction.`
        );
      }

      // Issue shares
      console.log("Issuing shares:", { amountWei, gasLimit });
      await contract.methods
        .issueShares(amountWei)
        .send({ from: account, gas: gasLimit })
        .on("transactionHash", (hash) => console.log("Issue tx:", hash));

      alert(`${chainId === 1 ? "PLSTR" : "xBOND"} issued successfully!`);
      setAmount("");
      setDisplayAmount("");
      fetchBalance();
      checkPoolExists();
    } catch (err) {
      console.error("Issue error:", err);
      let errorMsg = `Error issuing ${chainId === 1 ? "PLSTR" : "xBOND"}: ${err.message || "Unknown error"}`;
      if (err.code === 4001) errorMsg = "Transaction rejected by user";
      else if (err.message.includes("revert")) {
        try {
          const tx = await web3.eth.getTransaction(err.transactionHash);
          const code = await web3.eth.call(tx, tx.blockNumber);
          errorMsg += ` Revert reason: ${web3.utils.hexToAscii(code).replace(/[^\x20-\x7E]/g, '')}`;
        } catch (revertErr) {
          console.error("Failed to fetch revert reason:", revertErr);
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">
        Issue {chainId === 1 ? "PLSTR" : "xBOND"}
      </h2>
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Estimated Fee: <span className="text-purple-600">{formatNumber(estimatedFee)} {chainId === 1 ? "vPLS" : "PLSX"}</span>
          {chainId === 1 && <span className="text-sm text-gray-500 ml-2">(0.5% fee applied)</span>}
        </p>
        <p className="text-gray-600 mb-2">
          Estimated {chainId === 1 ? "PLSTR" : "xBOND"} Receivable: <span className="text-purple-600">{formatNumber(estimatedShares)} {chainId === 1 ? "PLSTR" : "xBOND"}</span>
        </p>
        <input
          type="text"
          value={displayAmount}
          onChange={handleAmountChange}
          placeholder={`Enter ${chainId === 1 ? "vPLS" : "PLSX"} amount`}
          className="w-full p-2 border rounded-lg"
        />
        <p className="text-sm text-gray-600 mt-1">
          Minimum <span className="text-purple-600 font-medium">{MIN_ISSUE_AMOUNT} {chainId === 1 ? "vPLS" : "PLSX"}</span>
        </p>
        <p className="text-gray-600 mt-1">
          User {chainId === 1 ? "vPLS" : "PLSX"} Balance: <span className="text-purple-600">{formatNumber(tokenBalance)} {chainId === 1 ? "vPLS" : "PLSX"}</span>
        </p>
        {isFirstIssuance && (
          <p className="text-yellow-600 mt-2 text-sm">
            Warning: First issuance creates a liquidity pool, requiring higher gas (up to 5,000,000).
          </p>
        )}
      </div>
      <button
        onClick={handleIssue}
        disabled={loading || !amount || Number(amount) < MIN_ISSUE_AMOUNT}
        className="btn-primary"
      >
        {loading ? "Processing..." : `Issue ${chainId === 1 ? "PLSTR" : "xBOND"}`}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default IssueShares;
