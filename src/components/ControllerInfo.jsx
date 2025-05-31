import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const ControllerInfo = ({ contract, web3, chainId }) => {
  const [info, setInfo] = useState({
    controller: "0x0",
    xBondBalance: "0",
    estimatedControllerPLSX: "0",
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
        controller: "0x0",
        xBondBalance: "0",
        estimatedControllerPLSX: "0",
      };

      if (chainId === 1) {
        // PLSTR: Use owner for controller
        const controller = await contract.methods.owner().call();
        newInfo.controller = controller || "0x0";
      } else if (chainId === 369) {
        // xBOND: Use getStrategyController, getStrategyControllerHoldings, and getPLSXReserveContributions
        const controller = await contract.methods.getStrategyController().call();
        const { xBondBalance } = await contract.methods.getStrategyControllerHoldings().call();
        const { estimatedControllerPLSX } = await contract.methods.getPLSXReserveContributions().call();
        newInfo = {
          ...newInfo,
          controller: controller || "0x0",
          xBondBalance: web3.utils.fromWei(xBondBalance || "0", "ether"),
          estimatedControllerPLSX: web3.utils.fromWei(estimatedControllerPLSX || "0", "ether"),
        };
      }

      setInfo(newInfo);
      console.log("Controller info fetched:", newInfo);
    } catch (error) {
      console`)
      console.error("Failed to fetch controller info:", error);
      setError(`Failed to load controller data: ${error.message || "Contract execution failed"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && chainId) fetchInfo();
  }, [contract, web3, chainId]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Controller Information</h2>
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
            <strong>Controller Address:</strong>{" "}
            {info.controller.slice(0, 6)}...{info.controller.slice(-4)}
          </p>
          {chainId === 369 && (
            <>
              <p className="text-gray-600">
                <strong>Controller xBOND Balance:</strong>{" "}
                {formatNumber(info.xBondBalance)} xBOND
              </p>
              <p className="text-gray-600">
                <strong>Estimated Controller PLSX Contribution:</strong>{" "}
                {formatNumber(info.estimatedControllerPLSX)} PLSX
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ControllerInfo;
