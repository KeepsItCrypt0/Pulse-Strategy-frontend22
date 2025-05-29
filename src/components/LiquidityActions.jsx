// src/components/LiquidityActions.jsx
import { useState, useEffect } from "react";
import { formatDate, formatNumber } from "../utils/format";

const LiquidityActions = ({ contract, account, web3, chainId }) => {
  const [nextWithdrawal, setNextWithdrawal] = useState("0");
  const [xBONDAmount, setXBONDAmount] = useState("0");
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [loadingSwap, setLoadingSwap] = useState(false);
  const [error, setError] = useState("");

  const fetchInfo = async () => {
    try {
      setError("");
      if (!contract) throw new Error("Contract not initialized");
      const timeUntilNext = await contract.methods.getTimeUntilNextWithdrawal().call();
      const xBOND = await contract.methods.getContractXBOND().call();
      setNextWithdrawal(timeUntilNext);
      setXBONDAmount(web3.utils.fromWei(xBOND || "0", "ether"));
      console.log("Fetched info:", { timeUntilNext, xBOND });
    } catch (err) {
      console.error("Failed to fetch info:", err);
      setError(`Failed to load data: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (contract && account && web3 && chainId === 369) {
      fetchInfo();
    }
  }, [contract, account, web3, chainId]);

  const handleWithdrawLiquidity = async () => {
    setLoadingWithdraw(true);
    setError("");
    try {
      await contract.methods.withdrawLiquidityAndReinvest().send({ from: account });
      alert("Liquidity withdrawn and reinvested successfully!");
      fetchInfo();
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
      fetchInfo();
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
      <p className="text-gray-600 mb-2">
        Next Withdrawal Available: {formatDate(Number(nextWithdrawal) + Math.floor(Date.now() / 1000))}
      </p>
      <p className="text-gray-600 mb-4">
        xBOND Available to Swap: {formatNumber(xBONDAmount)} xBOND
      </p>
      <button
        onClick={handleWithdrawLiquidity}
        disabled={loadingWithdraw || Number(nextWithdrawal) > 0}
        className="btn-primary mb-4 w-full"
        title={Number(nextWithdrawal) > 0 ? "Withdrawal not yet available" : ""}
      >
        {loadingWithdraw ? "Processing..." : "Withdraw Liquidity & Reinvest"}
      </button>
      <button
        onClick={handleSwapXBONDToPLSX}
        disabled={loadingSwap || Number(xBONDAmount) <= 0}
        className="btn-primary w-full"
        title={Number(xBONDAmount) <= 0 ? "No xBOND available to swap" : ""}
      >
        {loadingSwap ? "Processing..." : "Swap xBOND to PLSX"}
      </button>
      {error && <p className="text-red-700 mt-4">{error}</p>}
    </div>
  );
};

export default LiquidityActions;
