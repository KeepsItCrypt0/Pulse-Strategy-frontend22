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
  const MIN_ISSUE_AMOUNT = 1;
  const FEE_PERCENTAGE = 0.005; // 0.5% fee for PLSTR
  const FALLBACK_GAS_LIMIT = 3500000; // Fallback for xBOND

  const fetchBalance = async () => {
    if (!web3 || !account || !chainId) {
      console.error("Missing dependencies for fetching balance:", { web3, account, chainId });
      setError("Please ensure your wallet is connected and network is selected.");
      return;
    }
    try {
      setError("");
      const tokenContract = await getTokenContract(web3);
      if (!tokenContract) throw new Error("Failed to initialize token contract");
      const balance = await tokenContract.methods.balanceOf(account).call();
      const balanceStr = balance.toString();
      setTokenBalance(web3.utils.fromWei(balanceStr, "ether"));
      console.log(`${chainId === 1 ? "vPLS" : "PLSX"} balance fetched:`, { balance: balanceStr });
    } catch (err) {
      console.error(`Failed to fetch ${chainId === 1 ? "vPLS" : "PLSX"} balance:`, err);
      setError(`Failed to load ${chainId === 1 ? "vPLS" : "PLSX"} balance: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (web3 && account && chainId) fetchBalance();
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
            shares = (typeof result === "object" && result !== null
              ? (result[0] || result.shares || result)
              : result
            ).toString();
            fee = (amountNum * FEE_PERCENTAGE).toString();
            fee = web3.utils.toWei(fee, "ether");
          } else {
            const result = await contract.methods.calculateSharesReceived(amountWei).call({ from: account });
            if (Array.isArray(result) && result.length === 2) {
              [shares, fee] = result;
            } else if (result && typeof result === "object") {
              shares = (result.shares || result[0] || "0").toString();
              fee = (result.fee || result[1] || "0").toString();
            } else {
              throw new Error(`Invalid response from calculateSharesReceived: ${String(result)}`);
            }
          }
          if (!/^\d+$/.test(shares) || !/^\d+$/.test(fee)) {
            throw new Error(`Invalid number format: shares=${shares}, fee=${fee}`);
          }
          setEstimatedShares(web3.utils.fromWei(shares, "ether"));
          setEstimatedFee(web3.utils.fromWei(fee, "ether"));
          console.log("Estimated shares fetched:", { amount, shares, fee, chainId });
        } else {
          setEstimatedShares("0");
          setEstimatedFee("0");
        }
      } catch (err) {
        console.error("Failed to fetch estimated shares:", err);
        setError(`Failed to fetch estimated shares: ${err.message || "Contract execution failed"}`);
      }
    };
    if (contract && web3 && chainId && account) fetchEstimate();
  }, [contract, web3, amount, chainId, account]);

  const handleAmountChange = (e) => {
    const rawValue = String(e.target.value).replace(/,/g, "");
    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      try {
        const numValue = rawValue === "" ? "" : Number(rawValue);
        if (rawValue !== "" && (isNaN(numValue) || numValue < 0)) {
          console.warn("Invalid input ignored:", rawValue);
          return;
        }
        setAmount(rawValue);
        setDisplayAmount(
          rawValue === ""
            ? ""
            : new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 18,
                minimumFractionDigits: 0,
              }).format(numValue)
        );
      } catch (err) {
        console.error("Input processing error:", err);
      }
    } else {
      console.warn("Invalid input format:", rawValue);
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

      // Estimate gas for issueShares
      let gasLimit = FALLBACK_GAS_LIMIT;
      try {
        gasLimit = await contract.methods.issueShares(amountWei).estimateGas({ from: account });
        gasLimit = Math.floor(gasLimit * 1.2); // 20% buffer
        console.log("Gas estimated:", { gasLimit });
      } catch (gasErr) {
        console.warn("Gas estimation failed, using fallback:", { error: gasErr.message, fallback: FALLBACK_GAS_LIMIT });
        setError("Gas estimation failed. Using a fallback gas limit of 3,500,000. Please confirm the transaction.");
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
    } catch (err) {
      console.error("Issue error:", err);
      let errorMsg = `Error issuing ${chainId === 1 ? "PLSTR" : "xBOND"}: ${err.message || "Unknown error"}`;
      if (err.code === 4001) {
        errorMsg = "Transaction rejected by user";
      } else if (err.message.includes("revert")) {
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
