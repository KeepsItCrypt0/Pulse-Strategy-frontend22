// src/components/ContractInfo.jsx
import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const ContractInfo = ({ contract, web3, chainId }) => {
  const [info, setInfo] = useState({ plsxBalance: "0", issuancePeriod: "0", totalIssued: "0", totalBurned: "0" });
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

      const totalIssued = await contract.methods.totalSupply().call();
      let newInfo = {
        plsxBalance: "0",
        issuancePeriod: "0",
        totalIssued: web3.utils.fromWei(totalIssued || "0", "ether"),
        totalBurned: "0",
      };

      if (chainId === 369) {
        const balances = await contract.methods.getContractBalances().call();
        const issuanceStatus = await contract.methods.getIssuanceStatus().call();
        const totalBurned = await contract.methods.getTotalBurned().call();
        newInfo = {
          ...newInfo,
          plsxBalance: web3.utils.fromWei(balances.plsxBalance || "0", "ether"),
          issuancePeriod: issuanceStatus.timeRemaining || "0",
          totalBurned: web3.utils.fromWei(totalBurned || "0", "ether"),
        };
      }

      setInfo(newInfo);
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
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchInfo}
            className="mt-2 text-purple-300 hover:text-red-300 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <p className="text-gray-600">
            <strong>Contract Balance:</strong>{" "}
            {formatNumber(info.plsxBalance)} {chainId === 1 ? "vPLS" : "PLSX"}
          </p>
          <p className="text-gray-600">
            <strong>Total {chainId === 1 ? "PLSTR" : "xBOND"} Issued:</strong>{" "}
            {formatNumber(info.totalIssued)} {chainId === 1 ? "PLSTR" : "xBOND"}
          </p>
          <p className="text-gray-600">
            <strong>Issuance Period Countdown:</strong> {countdown}
          </p>
          {chainId === 369 && (
            <p className="text-gray-600">
              <strong>Total Burned:</strong> {formatNumber(info.totalBurned)} xBOND
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ContractInfo;
