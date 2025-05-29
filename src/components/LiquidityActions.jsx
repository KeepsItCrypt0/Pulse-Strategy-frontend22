// src/components/LiquidityActions.jsx
import { useState, useEffect } from "react";
import { formatDate } from "../utils/format";

const LiquidityActions = ({ contract, account, web3, chainId }) => {
  const [nextWithdrawal, setNextWithdrawal] = useState("0");
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [loadingSwap, setLoadingSwap] = useState(false);
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
    setLoadingWithdraw(true);
    setError("");
    try {
      await contract.methods.withdrawLiquidityAndReinvest().send({ from: account });
      alert("Liquidity withdrawn and reinvested successfully!");
      fetchWithdrawalInfo();
      console.log("Liquidity withdrawn and reinvested");
    } catch (err) {
      let errorMessage = `Error withdrawing liquidity: ${err.message || "Unknown error"}`;
      if (err.message.includes("PoolNotInitialized")) {
        errorMessage = "Pool not initialized.";
      } else if (err.message.includes("WithdrawalPeriodNotElapsed")) {
        errorMessage = `Withdrawal not available for ${Math.ceil(Number(nextWithdrawal) / 86400)} days.`;
      } else if (err.message.includes("InsufficientLiquidity")) {
        errorMessage = "Insufficient liquidity to withdraw.";
      } else if (err.message.includes("ZeroAddress")) {
        errorMessage = "Invalid pool address.";
      }
      setError(errorMessage);
      console.error("Withdraw liquidity error:", err);
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const handleSwapXBONDToPLSX = async () => {
    setLoadingSwap(true);
    setError("");
    try {
      await contract.methods.swapAccumulatedXBONDToPLSX().send({ from: account });
      alert("xBOND swapped to PLSX successfully!");
      console.log("xBOND swapped to PLSX");
    } catch (err) {
      let errorMessage = `Error swapping xBOND to PLSX: ${err.message || "Unknown error"}`;
      if (err.message.includes("PoolNotInitialized")) {
        errorMessage = "Pool not initialized.";
      } else if (err.message.includes("ZeroAmount")) {
        errorMessage = "No xBOND available to swap.";
      } else if (err.message.includes("SwapFailed")) {
        errorMessage = "Swap failed. Try again later.";
      } else if (err.message.includes("InsufficientSwapOutput")) {
        errorMessage = "Swap output too low.";
      } else if (err.message.includes("ZeroAddress")) {
        errorMessage = "Invalid pool address.";
      }
      setError(errorMessage);
      console.error("Swap error:", err);
    } finally {
      setLoadingSwap(false);
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
        disabled={loadingWithdraw || Number(nextWithdrawal) > 0}
        className="btn-primary mb-4 w-full"
      >
        {loadingWithdraw ? "Processing..." : "Withdraw Liquidity & Reinvest"}
      </button>
      <button
        onClick={handleSwapXBONDToPLSX}
        disabled={loadingSwap}
        className="btn-primary w-full"
      >
        {loadingSwap ? "Processing..." : "Swap xBOND to PLSX"}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default LiquidityActions;
