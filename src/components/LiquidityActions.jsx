// src/components/LiquidityActions.jsx
import { useState, useEffect } from "react";
import { formatDate } from "../utils/format";

const LiquidityActions = ({ contract, account, web3, chainId }) => {
  const [nextWithdrawal, setNextWithdrawal] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWithdrawalInfo = async () => {
    try {
      setError("");
      if (!contract) throw new Error("Contract not initialized");
      const timeUntilNext = await contract.methods.getTimeUntilNextWithdrawal().call();
      setNextWithdrawal(timeUntilNext);
      console.log("Next withdrawal time fetched:", timeUntilNext);
    } catch (err) {
      console.error("Failed to fetch withdrawal info:", err);
      setError(`Failed to load withdrawal info: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (contract && account && web3 && chainId === 369) {
      fetchWithdrawalInfo();
    }
  }, [contract, account, web3, chainId]);

  const handleWithdrawLiquidity = async () => {
    setLoading(true);
    setError("");
    try {
      await contract.methods.withdrawLiquidityAndReinvest().send({ from: account });
      alert("Liquidity withdrawn and reinvested successfully!");
      fetchWithdrawalInfo();
      console.log("Liquidity withdrawn and reinvested");
    } catch (err) {
      setError(`Error withdrawing liquidity: ${err.message || "Unknown error"}`);
      console.error("Withdraw liquidity error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (chainId !== 369) return null; // Only show on PulseChain

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Liquidity Actions</h2>
      <p className="text-gray-600 mb-4">
        Next Withdrawal Available: {formatDate(Number(nextWithdrawal) + Math.floor(Date.now() / 1000))}
      </p>
      <button
        onClick={handleWithdrawLiquidity}
        disabled={loading || Number(nextWithdrawal) > 0}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Withdraw Liquidity & Reinvest"}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default LiquidityActions;
