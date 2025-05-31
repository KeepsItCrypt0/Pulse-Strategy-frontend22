import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const ControllerInfo = ({ contract, web3, chainId }) => {
  const [info, setInfo] = useState({
    strategyController: "0x0",
    xBondBalance: "0",
    estimatedControllerPLSX: "0",
    controllerSharePercentage: "0",
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
        strategyController: "0x0",
        xBondBalance: "0",
        estimatedControllerPLSX: "0",
        controllerSharePercentage: "0",
      };

      if (chainId === 1) {
        // PLSTR: Use owner for StrategyController
        const strategyController = await contract.methods.owner().call();
        newInfo.strategyController = strategyController || "0x0";
      } else if (chainId === 369) {
        // xBOND: Use getStrategyController, getStrategyControllerHoldings, getPLSXReserveContributions, and getContractHealth
        const strategyController = await contract.methods.getStrategyController().call();
        const { xBondBalance } = await contract.methods.getStrategyControllerHoldings().call();
        const { estimatedControllerPLSX } = await contract.methods.getPLSXReserveContributions().call();
        const { controllerSharePercentage } = await contract.methods.getContractHealth().call();
        newInfo = {
          ...newInfo,
          strategyController: strategyController || "0x0",
          xBondBalance: web3.utils.fromWei(xBondBalance || "0", "ether"),
          estimatedControllerPLSX: web3.utils.fromWei(estimatedControllerPLSX || "0", "ether"),
          controllerSharePercentage: (Number(controllerSharePercentage || "0") / 100).toString(), // Assuming scaled by 100, e.g., 1000 = 10.00%
        };
      }

      setInfo(newInfo);
      console.log("StrategyController info fetched:", newInfo);
    } catch (error) {
      console.error("Failed to fetch StrategyController info:", error);
      setError(`Failed to load StrategyController data: ${error.message || "Contract execution failed"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && chainId) fetchInfo();
  }, [contract, web3, chainId]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">StrategyController Information</h2>
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
            <strong>StrategyController Address:</strong>{" "}
            {info.strategyController.slice(0, 6)}...{info.strategyController.slice(-4)}
          </p>
          {chainId === 369 && (
            <>
              <p className="text-gray-600">
                <strong>StrategyController xBOND Balance:</strong>{" "}
                {formatNumber(info.xBondBalance)} xBOND
              </p>
              <p className="text-gray-600">
                <strong>PLSX Added by StrategyController:</strong>{" "}
                {formatNumber(info.estimatedControllerPLSX)} PLSX
              </p>
              <p className="text-gray-600">
                <strong>StrategyController Share Percentage:</strong>{" "}
                {formatNumber(info.controllerSharePercentage)}%
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ControllerInfo;
