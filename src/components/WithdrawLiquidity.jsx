import { useState, useEffect } from "react";
import { formatDate, networks } from "../web3";

const WithdrawLiquidity = ({ web3, contract, account, network }) => {
  const [timeUntilWithdrawal, setTimeUntilWithdrawal] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { shareName, tokenName } = networks[network];

  const fetchWithdrawalTime = async () => {
    try {
      setError("");
      if (!contract || !web3) throw new Error("Contract or Web3 not initialized");
      const withdrawalTime = await contract.methods.getTimeUntilNextWithdrawal().call();
      setTimeUntilWithdrawal(withdrawalTime || "0");
      console.log("Withdrawal time fetched:", { withdrawalTime });
    } catch (err) {
      console.error("Failed to fetch withdrawal time:", err);
      setError(`Failed to load withdrawal time: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (contract && web3 && network === "pulsechain") fetchWithdrawalTime();
  }, [contract, web3, network]);

  const handleWithdrawLiquidity = async () => {
    setLoading(true);
    setError("");
    try {
      await contract.methods.withdrawLiquidityAndReinvest().send({ from: account });
      alert("Liquidity withdrawn and reinvested successfully!");
      fetchWithdrawalTime();
      console.log("Liquidity withdrawn and reinvested");
    } catch (err) {
      let errorMessage = "Error withdrawing liquidity: Unknown error";
      if (err.message.includes("WithdrawalPeriodNotElapsed")) {
        errorMessage = "90-day withdrawal period has not elapsed";
      } else if (err.message.includes("NoPoolCreated")) {
        errorMessage = "Liquidity pool not created";
      } else if (err.message.includes("InsufficientLiquidity")) {
        errorMessage = "Insufficient LP tokens to withdraw";
      } else if (err.message.includes("SwapFailed")) {
        errorMessage = "Token swap failed";
      } else if (err.message) {
        errorMessage = `Error withdrawing liquidity: ${err.message}`;
      }
      setError(errorMessage);
      console.error("Withdraw liquidity error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (network !== "pulsechain") return null;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Withdraw Liquidity & Reinvest</h2>
      <p className="text-gray-600 mb-4">
        Withdraw 12.5% of LP tokens every 90 days, swap {shareName} to {tokenName}, and reinvest.
      </p>
      <p className="text-gray-600 mb-4">
        <strong>Next Withdrawal Available:</strong>{" "}
        {timeUntilWithdrawal === "0" ? "Ready" : formatDate(Number(timeUntilWithdrawal))}
      </p>
      <button
        onClick={handleWithdrawLiquidity}
        disabled={loading || timeUntilWithdrawal !== "0"}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Withdraw & Reinvest"}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default WithdrawLiquidity;
