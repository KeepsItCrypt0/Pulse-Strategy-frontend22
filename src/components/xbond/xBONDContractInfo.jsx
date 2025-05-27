import { useState, useEffect } from "react";
import { getWeb3 } from "../../web3";
import { formatNumber, formatDate } from "../../format";

const xBONDContractInfo = ({ contract, web3 }) => {
  const [contractBalance, setContractBalance] = useState(null);
  const [remainingIssuancePeriod, setRemainingIssuancePeriod] = useState(null);
  const [plsxBackingRatio, setPLSXBackingRatio] = useState(null);
  const [poolLiquidity, setPoolLiquidity] = useState({ xBONDAmount: 0, plsxAmount: 0 });
  const [poolDepthRatio, setPoolDepthRatio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContractInfo = async () => {
      try {
        setError("");
        setLoading(true);
        if (!contract || !web3) {
          throw new Error("Contract or Web3 not initialized");
        }
        if (!contract.methods.getContractInfo) {
          throw new Error("Method getContractInfo not found in contract ABI");
        }
        const [balance, remainingPeriod] = await contract.methods.getContractInfo().call();
        const ratio = await contract.methods.getPLSXBackingRatio().call();
        const [xBONDAmount, plsxAmount] = await contract.methods.getPoolLiquidity().call();
        const depthRatio = await contract.methods.getPoolDepthRatio().call();
        setContractBalance(Number(balance));
        setRemainingIssuancePeriod(Number(remainingPeriod));
        setPLSXBackingRatio(Number(ratio));
        setPoolLiquidity({ xBONDAmount: Number(xBONDAmount), plsxAmount: Number(plsxAmount) });
        setPoolDepthRatio(Number(depthRatio));
      } catch (err) {
        console.error("Failed to fetch contract info:", err);
        setError(
          `Failed to load contract info: ${
            err.message.includes("call revert") || err.message.includes("invalid opcode")
              ? "Method not found or ABI mismatch"
              : err.message || "Unknown error"
          }`
        );
        setContractBalance(null);
        setRemainingIssuancePeriod(null);
        setPLSXBackingRatio(null);
        setPoolLiquidity({ xBONDAmount: 0, plsxAmount: 0 });
        setPoolDepthRatio(null);
      } finally {
        setLoading(false);
      }
    };

    if (contract && web3) {
      fetchContractInfo();
      const interval = setInterval(fetchContractInfo, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, web3]);

  if (!contract || !web3) return null;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Contract Info</h2>
      {loading ? (
        <p className="text-gray-600 mb-4">Loading...</p>
      ) : error ? (
        <p className="text-red-400 mb-4">{error}</p>
      ) : (
        <>
          <p className="text-gray-600 mb-2">
            Contract Balance: {formatNumber(contractBalance || 0)} PLSX
          </p>
          <p className="text-gray-600 mb-2">
            Remaining Issuance Period: {remainingIssuancePeriod !== null
              ? `${formatNumber(remainingIssuancePeriod / 60 / 60, true)} hours`
              : "N/A"}
          </p>
          <p className="text-gray-600 mb-2">
            PLSX Backing Ratio: {plsxBackingRatio !== null ? formatNumber(plsxBackingRatio, true) : "N/A"}
          </p>
          <p className="text-gray-600 mb-2">
            Pool Liquidity: {formatNumber(poolLiquidity.xBONDAmount)} xBOND / {formatNumber(poolLiquidity.plsxAmount)} PLSX
          </p>
          <p className="text-gray-600 mb-2">
            Pool Depth Ratio: {poolDepthRatio !== null ? formatNumber(poolDepthRatio, true) : "N/A"}
          </p>
        </>
      )}
    </div>
  );
};

export default xBONDContractInfo;
