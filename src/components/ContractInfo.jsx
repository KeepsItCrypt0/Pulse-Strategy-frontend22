// src/components/ContractInfo.jsx
import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const ContractInfo = ({ contract, web3, chainId }) => {
  const [info, setInfo] = useState({ balance: "0", issuancePeriod: "0", totalIssued: "0" });
  const [backingRatio, setBackingRatio] = useState("1 to 1");
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInfo = async () => {
    if (!contract || !web3 || !chainId) {
      setError("Contract or Web3 not initialized");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");

      const result = await contract.methods.getContractInfo().call();
      const totalIssued = await contract.methods.totalSupply().call();
      const ratio = await contract.methods[
        chainId === 1 ? "getVPLSBackingRatio" : "getPLSXBackingRatio"
      ]().call();
      const ratioDecimal = web3.utils.fromWei(ratio || "0", "ether");

      const newInfo = {
        balance: web3.utils.fromWei(result.contractBalance || "0", "ether"),
        issuancePeriod: result.remainingIssuancePeriod || "0",
        totalIssued: web3.utils.fromWei(totalIssued || "0", "ether"),
      };

      if (chainId === 369) {
        try {
          const poolAddress = await contract.methods.getPoolAddress().call();
          const poolLiquidity = await contract.methods.getPoolLiquidity().call();
          const poolDepthRatio = await contract.methods.getPoolDepthRatio().call();
          newInfo.poolAddress = poolAddress;
          newInfo.xBONDAmount = web3.utils.fromWei(poolLiquidity.xBONDAmount || "0", "ether");
          newInfo.plsxAmount = web3.utils.fromWei(poolLiquidity.plsxAmount || "0", "ether");
          newInfo.poolDepthRatio = web3.utils.fromWei(poolDepthRatio || "0", "ether");
        } catch (poolError) {
          console.warn("Failed to fetch pool info:", poolError);
        }
      }

      setInfo(newInfo);
      setBackingRatio(formatNumber(ratioDecimal, true));
      console.log("Contract info fetched:", newInfo);
    } catch (error) {
      console.error("Failed to fetch contract info:", error);
      setError(`Failed to load contract data: ${error.message || "Contract execution failed"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && chainId) fetchInfo();
  }, [contract, web3, chainId]);

  useEffect(() => {
    const updateCountdown = () => {
      const seconds = Number(info.issuancePeriod);
      if (seconds <= 0) {
        setCountdown("Issuance period ended");
        return;
      }
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      setCountdown(`${days}d ${hours}h ${minutes}m ${secs}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [info.issuancePeriod]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Contract Information</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchInfo}
            className="mt-2 text-purple-300 hover:text-purple-400"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <p>
            <strong>Contract Balance:</strong>{" "}
            {formatNumber(info.balance)} {chainId === 1 ? "vPLS" : "PLSX"}
          </p>
          <p>
            <strong>Total {chainId === 1 ? "PLSTR" : "xBOND"} Issued:</strong>{" "}
            {formatNumber(info.totalIssued)} {chainId === 1 ? "PLSTR" : "xBOND"}
          </p>
          <p>
            <strong>Issuance Period Countdown:</strong> {countdown}
          </p>
          <p>
            <strong>{chainId === 1 ? "vPLS" : "PLSX"} Backing Ratio:</strong> {backingRatio}
          </p>
          {chainId === 369 && info.poolAddress && (
            <>
              <p>
                <strong>Pool Address:</strong>{" "}
                <a
                  href={`https://scan.pulsechain.com/address/${info.poolAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-300 hover:text-red-300"
                >
                  {info.poolAddress.slice(0, 6)}...{info.poolAddress.slice(-4)}
                </a>
              </p>
              <p>
                <strong>Pool xBOND Amount:</strong> {formatNumber(info.xBONDAmount)} xBOND
              </p>
              <p>
                <strong>Pool PLSX Amount:</strong> {formatNumber(info.plsxAmount)} PLSX
              </p>
              <p>
                <strong>Pool Depth Ratio:</strong> {formatNumber(info.poolDepthRatio)} PLSX per LP
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ContractInfo;
