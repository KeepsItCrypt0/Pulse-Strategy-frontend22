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

  const fetchBalance = async () => {
    if (!web3 || !account || !chainId) {
      setError("Please ensure your wallet is connected and network is selected.");
      return;
    }
    try {
      setError("");
      const tokenContract = await getTokenContract(web3);
      if (!tokenContract) throw new Error("Failed to initialize token contract");
      const balance = await tokenContract.methods.balanceOf(account).call();
      setTokenBalance(web3.utils.fromWei(balance.toString(), "ether"));
      console.log(`${chainId === 1 ? "vPLS" : "PLSX"} balance fetched:`, balance.toString());
    } catch (err) {
      console.error(`Failed to fetch ${chainId === 1 ? "vPLS" : "PLSX"} balance:`, err);
      setError(`Failed to load balance: ${err.message || "Unknown error"}`);
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
            shares = (typeof result === "object" ? (result[0] || result.shares || result) : result).toString();
            fee = (amountNum * FEE_PERCENTAGE).toString();
            fee = web3.utils.toWei(fee, "ether");
          } else {
            const result = await contract.methods.calculateSharesReceived(amountWei).call({ from: account });
            [shares, fee] = Array.isArray(result) ? result : [result.shares || result[0], result.fee || null];
            if (!/^\d+$/.test(shares)) {
              throw new Error(`Invalid shares format: ${shares}`);
            }
            fee = fee && /^\d+$/.test(fee) ? fee : "0";
          }
          setEstimatedShares(web3.utils.fromWei(shares, "ether"));
          setEstimatedFee(web3.utils.fromWei(fee.toString(), "ether"));
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
        if (rawValue !== "" && (isNaN(numValue) || numValue < 0)) return;
        setAmount(rawValue);
        setDisplayAmount(rawValue === "" ? "" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 18 }).format(numValue));
      } catch (err) {
        console.error("Input processing error:", err);
      }
    }
  };

  const estimateGasWithRetry = async (method, options, retries = 5) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Estimating gas attempt ${i + 1}:`, {
          methodName: method?._method?.name || "undefined",
          options,
          paramTypes: { amountWei: typeof options.amountWei },
        });
        const gas = await method.estimateGas(options);
        return Math.floor(gas * 1.3); // 30% buffer
      } catch (err) {
        lastError = err;
        console.warn(`Gas estimation attempt ${i + 1} failed:`, err.message);
        if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw lastError;
  };

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const amountNum = Number(amount);
      if (amountNum < MIN_ISSUE_AMOUNT) {
        throw new Error(`Amount must be at least ${MIN_ISSUE_AMOUNT} ${chainId === 1 ? "vPLS" : "PLSX"}`);
      }
      if (!contract || !contract.methods || !contract.methods.issueShares) {
        throw new Error("Contract or issueShares method is not initialized");
      }
      const tokenContract = await getTokenContract(web3);
      if (!tokenContract) throw new Error("Failed to initialize token contract");
      const amountWei = web3.utils.toWei(amount, "ether").toString(); // Ensure string

      // Approve PLSX
      const approveGas = await estimateGasWithRetry(
        tokenContract.methods.approve(contract.options.address, amountWei),
        { from: account }
      );
      await tokenContract.methods
        .approve(contract.options.address, amountWei)
        .send({ from: account, gas: approveGas, gasPrice: web3.utils.toWei("100", "gwei") });

      // Issue shares
      const isFirstIssuance = chainId === 369 && !(await contract.methods.pair().call());
      const gasLimit = isFirstIssuance ? 3_000_000 : 500_000;
      const issueGas = await estimateGasWithRetry(
        contract.methods.issueShares(amountWei),
        { from: account, gas: gasLimit },
        5
      );
      await contract.methods
        .issueShares(amountWei)
        .send({ from: account, gas: issueGas, gasPrice: web3.utils.toWei("100", "gwei") });
      
      alert(`${chainId === 1 ? "PLSTR" : "xBOND"} issued successfully!`);
      setAmount("");
      setDisplayAmount("");
      fetchBalance();
      console.log(`${chainId === 1 ? "PLSTR" : "xBOND"} issued:`, { amountWei });
    } catch (err) {
      console.error("Issue shares error:", err);
      setError(`Error issuing ${chainId === 1 ? "PLSTR" : "xBOND"}: ${err.message || "Unknown error"}`);
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
          Estimated {chainId === 1 ? "PLSTR" : "xBOND"} Receivable: <span className="text-purple-600">{formatNumber(estimatedShares)}</span>
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
          User {chainId === 1 ? "vPLS" : "PLSX"} Balance: <span className="text-purple-600">{formatNumber(tokenBalance)}</span>
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
