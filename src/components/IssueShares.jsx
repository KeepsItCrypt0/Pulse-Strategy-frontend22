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
          const result = await contract.methods.calculateSharesReceived(amountWei).call({ from: account });
          console.log("calculateSharesReceived response:", {
            result,
            resultType: typeof result,
            resultKeys: result && typeof result === "object" ? Object.keys(result) : [],
            amountWei,
          });
          let shares, fee;
          if (chainId === 1) {
            // PLSTR: single uint256
            shares = typeof result === "object" && result !== null
              ? (result[0] || result.shares || result).toString()
              : result.toString();
            fee = "0";
          } else {
            // xBOND: [shares, fee]
            if (Array.isArray(result) && result.length === 2) {
              [shares, fee] = result;
            } else if (result && typeof result === "object") {
              shares = (result.shares || result[0] || "0").toString();
              fee = (result.fee || result[1] || "0").toString();
            } else {
              throw new Error(`Invalid response from calculateSharesReceived: ${String(result)}`);
            }
          }
          // Validate numeric format
          if (!/^\d+$/.test(shares) || !/^\d+$/.test(fee)) {
            throw new Error(`Invalid number format: shares=${shares}, fee=${fee}`);
          }
          setEstimatedShares(web3.utils.fromWei(shares, "ether"));
          setEstimatedFee(web3.utils.fromWei(fee, "ether"));
          console.log("Estimated shares fetched:", { amount, shares, fee });
        } else {
          setEstimatedShares("0");
          setEstimatedFee("0");
        }
      } catch (err) {
        console.error("Failed to fetch estimated shares:", err);
        setError(`Failed to fetch estimated shares: ${err.message || "Contract execution failed"}`);
      }
    };
    if (contract && web3 && chainId) fetchEstimate();
  }, [contract, web3, amount, chainId]);

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
      await tokenContract.methods
        .approve(contract.options.address, amountWei)
        .send({ from: account });
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert(`${chainId === 1 ? "PLSTR" : "xBOND"} issued successfully!`);
      setAmount("");
      setDisplayAmount("");
      fetchBalance();
      console.log(`${chainId === 1 ? "PLSTR" : "xBOND"} issued:`, { amountWei });
    } catch (err) {
      setError(`Error issuing ${chainId === 1 ? "PLSTR" : "xBOND"}: ${err.message || "Unknown error"}`);
      console.error("Issue shares error:", err);
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
