import { useState, useEffect } from "react";
import { getWeb3 } from "../../web3";
import { formatNumber, formatDate } from "../../format";

const xBONDWithdrawLiquidity = ({ web3, contract, account, network }) => {
  const [timeUntilWithdrawal, setTimeUntilWithdrawal] = useState(null);
  const [withdrawalCountdown, setWithdrawalCountdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const { shareName, tokenName } = networks[network] || { shareName: "Share", tokenName: "Token" };

  const fetchWithdrawalTime = async () => {
    try {
      setError("");
      setInitialLoading(true);
      if (!contract || !web3) {
        throw new Error("Contract or Web3 not initialized");
      }
      if (!contract.methods.getTimeUntilNextWithdrawal) {
        throw new Error("Method getTimeUntilNextWithdrawal not found in contract ABI");
      }
      const withdrawalTime = await contract.methods.getTimeUntilNextWithdrawal().call();
      console.log("Withdrawal time fetched:", { withdrawalTime });
      setTimeUntilWithdrawal(withdrawalTime ? Number(withdrawalTime) : 0);
    } catch (err) {
      console.error("Failed to fetch withdrawal time:", err);
      setError(
        `Failed to load withdrawal time: ${
          err.message.includes("call revert") || err.message.includes("invalid opcode")
            ? "Method not found or ABI mismatch"
            : err.message || "Unknown error"
        }`
      );
      setTimeUntilWithdrawal(null);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && network === "pulsechain") {
      fetchWithdrawalTime();
      const interval = setInterval(fetchWithdrawalTime, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, web3, network]);

  useEffect(() => {
    const updateWithdrawalCountdown = () => {
      if (timeUntilWithdrawal === null || timeUntilWithdrawal === 0) {
        setWithdrawalCountdown(timeUntilWithdrawal === 0 ? "Ready" : "N/A");
        return;
      }
      const seconds = timeUntilWithdrawal;
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      setWithdrawalCountdown(`${days}d ${hours}h ${minutes}m ${secs}s`);
    };
    updateWithdrawalCountdown();
    const interval = setInterval(updateWithdrawalCountdown, 1000);
    return () => clearInterval(interval);
  }, [timeUntilWithdrawal]);

  const handleWithdrawLiquidity = async () => {
    setLoading(true);
    setError("");
    try {
      if (!contract || !account) throw new Error("Contract or account not initialized");
      if (!contract.methods.withdrawLiquidityAndReinvest) {
        throw new Error("Method withdrawLiquidityAndReinvest not found in contract ABI");
      }
      await contract.methods.withdrawLiquidityAndReinvest().send({ from: account });
      alert("Liquidity withdrawn and reinvested successfully!");
      await fetchWithdrawalTime();
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
      } else if (err.message.includes("NotOwner")) {
        errorMessage = "Only the contract owner can withdraw liquidity";
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
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Withdraw Liquidity & Reinvest</h2>
      <p className="text-gray-600 mb-4">
        Withdraw 12.5% of LP tokens every 90 days, swap {shareName} to {tokenName}, and reinvest.
      </p>
      {initialLoading ? (
        <p className="text-gray-600 mb-4">Loading withdrawal time...</p>
      ) : error ? (
        <div>
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchWithdrawalTime} className="text-purple-300 hover:text-purple-400">
            Retry
          </button>
        </div>
      ) : (
        <p className="text-gray-600 mb-4">
          <strong>Next Withdrawal Available:</strong> {withdrawalCountdown}
        </p>
      )}
      <button
        onClick={handleWithdrawLiquidity}
        disabled={loading || initialLoading || timeUntilWithdrawal === null || timeUntilWithdrawal > 0}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Withdraw & Reinvest"}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default xBONDWithdrawLiquidity;
