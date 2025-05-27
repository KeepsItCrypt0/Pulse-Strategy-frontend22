import { useState, useEffect } from "react";
import { formatNumber, formatDate,} from "./utils/format";
const PulseStrategyContractInfo = ({ contract, web3 }) => {
  const [info, setInfo] = useState({ balance: "0", issuancePeriod: "Not loaded", totalIssued: "0" });
  const [backingRatio, setBackingRatio] = useState("1 to 1");
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { tokenName, shareName, blockExplorerUrls } = networks["ethereum"] || { tokenName: "vPLS", shareName: "PLSTR", blockExplorerUrls: [""] };

  const fetchInfo = async (retryCount = 0) => {
    const maxRetries = 3;
    try {
      setLoading(true);
      setError("");
      if (!contract || !web3) throw new Error("Contract or Web3 not initialized");

      const result = await contract.methods.getContractInfo().call();
      if (!result || !result.contractBalance || result.remainingIssuancePeriod === undefined) {
        throw new Error("Invalid contract info response from getContractInfo");
      }

      if (!contract.methods.getVPLSBackingRatio) {
        throw new Error("Method getVPLSBackingRatio not found in contract ABI");
      }
      const ratio = await contract.methods.getVPLSBackingRatio().call();
      const totalIssued = await contract.methods.totalSupply().call();

      setInfo({
        balance: formatNumber(web3.utils.fromWei(result.contractBalance || "0", "ether")),
        issuancePeriod: result.remainingIssuancePeriod === "0" ? "Ended" : result.remainingIssuancePeriod,
        totalIssued: formatNumber(web3.utils.fromWei(totalIssued || "0", "ether")),
      });
      setBackingRatio(formatNumber(web3.utils.fromWei(ratio || "0", "ether"), true));
    } catch (error) {
      console.error("Failed to fetch contract info:", error);
      if (retryCount < maxRetries) {
        setError(`Retrying... (Attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchInfo(retryCount + 1);
      }
      setError(
        `Failed to load contract data: ${
          error.message.includes("call revert") || error.message.includes("invalid opcode")
            ? "Method not found or ABI mismatch"
            : error.message || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3) {
      fetchInfo();
      const interval = setInterval(fetchInfo, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, web3]);

  useEffect(() => {
    const updateCountdown = () => {
      const seconds = Number(info.issuancePeriod);
      if (isNaN(seconds) || seconds <= 0) {
        setCountdown(info.issuancePeriod === "Ended" ? "Ended" : "Not set");
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
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Contract Information</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button onClick={fetchInfo} className="mt-2 text-purple-300 hover:text-purple-400">
            Retry
          </button>
        </div>
      ) : (
        <>
          <p>
            <strong>Contract Balance:</strong> {formatNumber(info.balance)} {tokenName}
          </p>
          <p>
            <strong>Total {shareName} Issued:</strong> {formatNumber(info.totalIssued)} {shareName}
          </p>
          <p>
            <strong>Issuance Period Countdown:</strong> {countdown}
          </p>
          <p>
            <strong>{tokenName} Backing Ratio:</strong> {backingRatio}
          </p>
        </>
      )}
    </div>
  );
};

export default PulseStrategyContractInfo;
