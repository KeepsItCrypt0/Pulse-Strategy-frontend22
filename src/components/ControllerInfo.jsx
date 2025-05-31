import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const ControllerInfo = ({ contract, web3, chainId }) => {
  const [info, setInfo] = useState({
    strategy: "0x0",
    xBondBalance: "0",
    estimatedStrategyPLSX: "0",
    strategySharePercentage: "0",
  });
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

      let newInfo = {
        strategy: "0x0",
        xBondBalance: "0",
        estimatedStrategyPLSX: "0",
        strategySharePercentage: "0",
      };

      if (chainId === 1) {
        // PLSTR: Use owner for Strategy (though not rendered)
        const strategy = await contract.methods.owner().call();
        newInfo.strategy = strategy || "0x0";
      } else if (chainId === 369) {
        // xBOND: Use getStrategyController, getStrategyControllerHoldings, getPLSXReserveContributions, and getContractHealth
        const strategy = await contract.methods.getStrategyController().call();
        const { xBondBalance } = await contract.methods.getStrategyControllerHoldings().call();
        const { estimatedControllerPLSX } = await contract.methods.getPLSXReserveContributions().call();
        const { controllerSharePercentage } = await contract.methods.getContractHealth().call();
        console.log("Raw xBondBalance (Wei):", xBondBalance);
        console.log("Raw estimatedControllerPLSX (Wei):", estimatedControllerPLSX);
        console.log("Raw controllerSharePercentage:", controllerSharePercentage);
        newInfo = {
          ...newInfo,
          strategy: strategy || "0x0",
          xBondBalance: web3.utils.fromWei(xBondBalance || "0", "ether"),
          estimatedStrategyPLSX: web3.utils.fromWei(estimatedControllerPLSX || "0", "ether"),
          strategySharePercentage: (Number(controllerSharePercentage || "0") / 1e18).toString(), // Try 10^18 scaling
        };
      }

      setInfo(newInfo);
      console.log("Strategy info fetched:", newInfo);
    } catch (error) {
      console.error("Failed to fetch Strategy info:", error);
      setError(`Failed to load Strategy data: ${error.message || "Contract execution failed"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && chainId) fetchInfo();
  }, [contract, web3, chainId]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Strategy Information</h2>
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
            <strong>Strategy Address:</strong>{" "}
            <a
              href={`https://scan.pulsechain.com/address/${info.strategy}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              {info.strategy.slice(0, 6)}...{info.strategy.slice(-4)}
            </a>
          </p>
          {chainId === 369 && (
            <>
              <p className="text-gray-600">
                <strong>Strategy xBOND Balance:</strong>{" "}
                {formatNumber(info.xBondBalance)} xBOND
              </p>
              <p className="text-gray-600">
                <strong>PLSX Added by Strategy:</strong>{" "}
                {formatNumber(info.estimatedStrategyPLSX)} PLSX
              </p>
              <p className="text-gray-600">
                <strong>Strategy Share Percentage:</strong>{" "}
                {Number.isInteger(Number(info.strategySharePercentage))
                  ? `${formatNumber(info.strategySharePercentage)}%`
                  : `${formatNumber(Number(info.strategySharePercentage).toFixed(2))}%`}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ControllerInfo;
