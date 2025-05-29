// src/components/LiquidityActions.jsx
import { useState, useEffect } from "react";

const LiquidityActions = ({ web3, contract, account, chainId }) => {
  const [timeUntilNextWithdrawal, setTimeUntilNextWithdrawal] = useState(0);
  const [error, setError] = useState("");
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [loadingSwap, setLoadingSwap] = useState(false);

  useEffect(() => {
    const fetchTimeUntil = async () => {
      if (!web3 || !contract || chainId !== 369) return;
      try {
        const time = await contract?.methods?.getTimeUntilNextWithdrawal()?.call();
        setTimeUntilNextWithdrawal(Number(time));
      } catch (err) {
        console.error("Error fetching withdrawal time:", err);
      }
    };
    fetchTimeUntil();
    const interval = setInterval(fetchTimeUntil, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [web3, contract, chainId]);

  const handleWithdrawLiquidity = async () => {
    if (!web3 || !contract || !account || chainId !== 369) return;
    setError("");
    setLoadingWithdraw(true);
    try {
      await contract?.methods?.withdrawLiquidityAndReinvest()?.send({ from: account });
    } catch (err) {
      console.error("Withdraw liquidity error:", err);
      let errorMessage = "Failed to withdraw and reinvest liquidity.";
      if (err?.message?.includes("PoolNotInitialized")) {
        errorMessage = "Pool not initialized.";
      } else if (err?.message?.includes("WithdrawalPeriodNotElapsed")) {
        errorMessage = `Withdrawal not available for ${Math?.ceil(timeUntilNextWithdrawal / 86400)} days.`;
      } else if (err?.message?.includes("InsufficientLiquidity")) {
        errorMessage = "Insufficient liquidity to withdraw.";
      } else if (err?.message?.includes("ZeroAddress")) {
        errorMessage = "Invalid pool address.";
      }
      setError(errorMessage);
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const handleSwapXBONDToPLSX = async () => {
    if (!web3 || !contract || !account || chainId !== 369) return;
    setError("");
    setLoadingSwap(true);
    try {
      await contract?.methods?.swapAccumulatedXBONDToPLSX()?.send({ from: account });
    } catch (err) {
      console.error("Swap error:", err);
      let errorMessage = "Failed to swap xBOND to PLSX.";
      if (err?.message?.includes("PoolNotInitialized")) {
        errorMessage = "Pool not initialized.";
      } else if (err?.message?.includes("ZeroAmount")) {
        errorMessage = "No xBOND available to swap.";
      } else if (err?.message?.includes("SwapFailed")) {
        errorMessage = "Swap failed. Try again later.";
      } else if (err?.message?.includes("InsufficientSwapOutput")) {
        errorMessage = "Swap output too low.";
      } else if (err?.message?.includes("ZeroAddress")) {
        errorMessage = "Invalid pool address.";
      }
      setError(errorMessage);
    } finally {
      setLoadingSwap(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === 0) return "Available now";
    const days = Math?.floor(seconds / 86400);
    const hours = Math?.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4">Liquidity Actions (xBOND)</h2>
      <div className="mb-4">
        <p className="text-gray-600">
          Next Withdrawal: {formatTime(timeUntilNextWithdrawal)}
        </p>
      </div>
      <button
        onClick={handleWithdrawLiquidity}
        disabled={loadingWithdraw || chainId !== 369 || timeUntilNextWithdrawal > 0}
        className="btn-primary w-full mb-4"
      >
        {loadingWithdraw ? "Processing..." : "Withdraw & Reinvest Liquidity"}
      </button>
      <button
        onClick={handleSwapXBONDToPLSX}
        disabled={loadingSwap || chainId !== 369}
        className="btn-primary w-full"
      >
        {loadingSwap ? "Processing..." : "Swap xBOND to PLSX"}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default LiquidityActions;
