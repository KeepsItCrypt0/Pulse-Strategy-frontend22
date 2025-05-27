import { useState, useEffect } from "react";
import { getTokenContract, formatNumber, networks } from "./utils/format.js";

const xBONDIssue = ({ web3, contract, account }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [estimatedShares, setEstimatedShares] = useState("0");
  const [userTokenBalance, setUserTokenBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const { tokenName, shareName } = networks["pulsechain"] || { tokenName: "PLSX", shareName: "xBOND" };

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      setError("");
      if (!contract || !web3 || !account || !/^[0x][0-9a-fA-F]{40}$/.test(account)) {
        throw new Error("Contract, Web3, or invalid account not initialized");
      }

      const tokenContract = await getTokenContract(web3, "pulsechain");
      const balance = await tokenContract.methods.balanceOf(account).call();
      setUserTokenBalance(formatNumber(web3.utils.fromWei(balance || "0", "ether")));

      if (amount && Number(amount) > 0) {
        const amountWei = web3.utils.toWei(amount, "ether");
        const shares = await contract.methods.calculateSharesReceived(amountWei).call();
        setEstimatedShares(formatNumber(web3.utils.fromWei(shares || "0", "ether")));
      } else {
        setEstimatedShares("0");
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(
        `Failed to load data: ${
          err.message.includes("call revert") || err.message.includes("invalid opcode")
            ? "Method not found or ABI mismatch"
            : err.message || "Unknown error"
        }`
      );
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && account) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, web3, account, amount]);

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^-?\d*\.?\d*$/.test(rawValue)) {
      setAmount(rawValue);
      setDisplayAmount(
        rawValue === "" || isNaN(rawValue)
          ? ""
          : new Intl.NumberFormat("en-US", { maximumFractionDigits: 18, minimumFractionDigits: 0 }).format(rawValue)
      );
    }
  };

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const amountNum = Number(amount);
      if (amountNum <= 0) throw new Error("Amount must be greater than 0");
      if (amountNum > Number(userTokenBalance)) throw new Error(`Amount exceeds ${tokenName} balance`);
      const amountWei = web3.utils.toWei(amount, "ether");
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert(`${shareName} issued successfully!`);
      setAmount("");
      setDisplayAmount("");
      await fetchData();
    } catch (err) {
      let errorMessage = `Error issuing ${shareName}: ${err.message || "Unknown error"}`;
      if (err.message.includes("InsufficientBalance")) errorMessage = `Insufficient ${tokenName} balance`;
      else if (err.message.includes("IssuancePeriodEnded")) errorMessage = "Issuance period has ended";
      setError(errorMessage);
      console.error("Issue shares error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Issue {shareName}</h2>
      {initialLoading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button onClick={fetchData} className="mt-2 text-purple-300 hover:text-purple-400">
            Retry
          </button>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-2">Estimated {shareName} Receivable: {estimatedShares} {shareName}</p>
          <p className="text-gray-600 mb-2">User {tokenName} Balance: {userTokenBalance} {tokenName}</p>
          <input
            type="text"
            value={displayAmount}
            onChange={handleAmountChange}
            placeholder={`Enter ${tokenName} amount`}
            className="w-full p-2 border rounded-lg mb-4"
          />
          <button
            onClick={handleIssue}
            disabled={loading || !amount || Number(amount) <= 0 || Number(amount) > Number(userTokenBalance)}
            className="btn-primary"
          >
            {loading ? "Processing..." : `Issue ${shareName}`}
          </button>
        </>
      )}
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
};

export default xBONDIssue;
