import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const ContractInfo = ({ contract, web3, chainId, contractSymbol }) => {
  const [contractData, setContractData] = useState({
    totalSupply: "0",
    bondAddresses: { hBOND: "", pBOND: "", iBOND: "", xBOND: "" },
    metrics: {
      plsxBalance: "0",
      plsBalance: "0",
      incBalance: "0",
      hexBalance: "0",
      totalMintedShares: "0",
      totalBurned: "0",
      pendingPLSTRhBOND: "0",
      pendingPLSTRpBOND: "0",
      pendingPLSTRiBOND: "0",
      pendingPLSTRxBOND: "0",
    },
    issuanceEventCount: "0",
    totalDeposits: { plsx: "0", pls: "0", inc: "0", hex: "0" },
    bondMetrics: {
      totalSupply: "0",
      tokenBalance: "0",
      totalMintedShares: "0",
      totalBurned: "0",
      remainingIssuancePeriod: "0",
    },
    hBONDBalance: "0",
    hexBalance: "0",
    pairAddress: "",
    contractHealth: { tokenBackingRatio: "0", controllerSharePercentage: "0" },
    controllerToken: "0",
    totalTokenFromSwaps: "0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Token decimals
  const tokenDecimals = {
    PLS: 18,
    PLSX: 18,
    INC: 18,
    HEX: 8,
  };

  // Convert balance based on token decimals
  const fromUnits = (balance, decimals) => {
    try {
      return web3.utils.fromWei(balance, decimals === 18 ? "ether" : decimals === 8 ? "gwei" : "ether");
    } catch (err) {
      console.error("Error converting balance:", err);
      return "0";
    }
  };

  const bondConfig = {
    pBOND: {
      token: "PLS",
      balanceField: "plsBalance",
      bondField: "pBONDBalance",
      metricsField: "contractPLSBalance",
      healthField: "plsBackingRatio",
      reserveField: "getPLSReserveContributions",
      swapsField: "getTotalPlsFromSwaps",
    },
    xBOND: {
      token: "PLSX",
      balanceField: "plsxBalance",
      bondField: "xBONDBalance",
      metricsField: "contractPLSXBalance",
      healthField: "plsxBackingRatio",
      reserveField: "getPLSXReserveContributions",
      swapsField: "getTotalPlsxFromSwaps",
    },
    iBOND: {
      token: "INC",
      balanceField: "incBalance",
      bondField: "iBONDBalance",
      metricsField: "contractINCBalance",
      healthField: "incBackingRatio",
      reserveField: "getINCReserveContributions",
      swapsField: "getTotalIncFromSwaps",
    },
    hBOND: {
      token: "HEX",
      balanceField: "hexBalance",
      bondField: "hBONDBalance",
      metricsField: "contractHEXBalance",
      healthField: "hexBackingRatio",
      reserveField: "getHEXReserveContributions",
      swapsField: "getTotalHexFromSwaps",
    },
  };

  const formatIssuancePeriod = (seconds) => {
    const numSeconds = Number(seconds) || 0;
    if (numSeconds === 0) return "0 minutes";
    const days = Math.floor(numSeconds / 86400);
    const hours = Math.floor((numSeconds % 86400) / 3600);
    const minutes = Math.floor((numSeconds % 3600) / 60);
    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
    return parts.join(", ");
  };

  const fetchContractData = async () => {
    if (!contract || !web3 || chainId !== 369) return;
    try {
      setLoading(true);
      setError(null);

      const config = bondConfig[contractSymbol] || bondConfig.pBOND;
      const isPLSTR = contractSymbol === "PLSTR";

      // Basic contract data
      const totalSupply = await contract.methods.totalSupply().call();
      console.log("Total Supply:", totalSupply);

      let bondAddresses = contractData.bondAddresses;
      let contractMetrics = contractData.metrics;
      let issuanceEventCount = "0";
      let totalDeposits = contractData.totalDeposits;
      let bondMetrics = contractData.bondMetrics;
      let hBONDBalance = contractData.hBONDBalance;
      let hexBalance = contractData.hexBalance;
      let pairAddress = "";
      let contractHealth = contractData.contractHealth;
      let controllerToken = "0";
      let totalTokenFromSwaps = "0";

      if (isPLSTR) {
        const [
          bondAddrs,
          balances,
          metrics,
          eventCount,
          deposits,
        ] = await Promise.all([
          contract.methods.getBondAddresses().call(),
          contract.methods.getContractBalances().call(),
          contract.methods.getContractMetrics().call(),
          contract.methods.getIssuanceEventCount().call(),
          contract.methods.getTotalDeposits().call(),
        ]);

        console.log("PLSTR Data:", { bondAddrs, balances, metrics, eventCount, deposits });

        bondAddresses = {
          hBOND: bondAddrs.hBOND || "",
          pBOND: bondAddrs.pBOND || "",
          iBOND: bondAddrs.iBOND || "",
          xBOND: bondAddrs.xBOND || "",
        };

        contractMetrics = {
          plsxBalance: fromUnits(metrics.contractPLSXBalance || "0", tokenDecimals.PLSX),
          plsBalance: fromUnits(metrics.contractPLSBalance || "0", tokenDecimals.PLS),
          incBalance: fromUnits(metrics.contractINCBalance || "0", tokenDecimals.INC),
          hexBalance: fromUnits(metrics.contractHEXBalance || "0", tokenDecimals.HEX),
          totalMintedShares: fromUnits(metrics.totalMintedShares || "0", 18),
          totalBurned: fromUnits(metrics.totalBurned || "0", 18),
          pendingPLSTRhBOND: fromUnits(metrics.pendingPLSTRhBOND || "0", 18),
          pendingPLSTRpBOND: fromUnits(metrics.pendingPLSTRpBOND || "0", 18),
          pendingPLSTRiBOND: fromUnits(metrics.pendingPLSTRiBOND || "0", 18),
          pendingPLSTRxBOND: fromUnits(metrics.pendingPLSTRxBOND || "0", 18),
        };

        issuanceEventCount = eventCount.toString();

        totalDeposits = {
          plsx: fromUnits(deposits.totalPlsx || "0", tokenDecimals.PLSX),
          pls: fromUnits(deposits.totalPls || "0", tokenDecimals.PLS),
          inc: fromUnits(deposits.totalInc || "0", tokenDecimals.INC),
          hex: fromUnits(deposits.totalHex || "0", tokenDecimals.HEX),
        };
      } else {
        const metrics = await contract.methods.getContractMetrics().call().catch(() => ({}));
        const balances = await contract.methods.getContractBalances().call().catch(() => ({}));
        const pairAddr = contract.methods.getPairAddress
          ? await contract.methods.getPairAddress().call().catch(() => "")
          : "";
        const health = contract.methods.getContractHealth
          ? await contract.methods.getContractHealth().call().catch(() => ({}))
          : {};
        const controllerReserve = contract.methods[config.reserveField]
          ? await contract.methods[config.reserveField]().call().catch(() => "0")
          : "0";
        const swaps = contract.methods[config.swapsField]
          ? await contract.methods[config.swapsField]().call().catch(() => "0")
          : "0";

        console.log("Bond Data:", {
          contractSymbol,
          metrics,
          balances,
          pairAddr,
          health,
          controllerReserve,
          swaps,
        });

        bondMetrics = {
          totalSupply: fromUnits(metrics.currentTotalSupply || "0", 18),
          tokenBalance: fromUnits(metrics[config.metricsField] || "0", tokenDecimals[config.token]),
          totalMintedShares: fromUnits(metrics.totalMintedShares || "0", 18),
          totalBurned: fromUnits(metrics.totalBurned || "0", 18),
          remainingIssuancePeriod: (metrics.remainingIssuancePeriod || "0").toString(),
        };

        if (contractSymbol === "hBOND") {
          hBONDBalance = fromUnits(balances[config.bondField] || "0", 18);
          hexBalance = fromUnits(balances[config.balanceField] || "0", tokenDecimals.HEX);
        }

        pairAddress = pairAddr;

        contractHealth = {
          tokenBackingRatio: fromUnits(health[config.healthField] || "0", 18),
          controllerSharePercentage: fromUnits(health.controllerSharePercentage || "0", 18),
        };

        controllerToken = fromUnits(controllerReserve || "0", tokenDecimals[config.token]);

        totalTokenFromSwaps = fromUnits(swaps || "0", tokenDecimals[config.token]);
      }

      setContractData({
        totalSupply: fromUnits(totalSupply || "0", 18),
        bondAddresses,
        metrics: contractMetrics,
        issuanceEventCount,
        totalDeposits,
        bondMetrics,
        hBONDBalance,
        hexBalance,
        pairAddress,
        contractHealth,
        controllerToken,
        totalTokenFromSwaps,
      });

      console.log("Contract data set:", { contractSymbol, totalSupply });
    } catch (err) {
      console.error("Error fetching contract data:", err);
      setError(`Failed to load ${contractSymbol} data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && chainId === 369) {
      fetchContractData();
    }
  }, [contract, web3, chainId, contractSymbol]);

  if (chainId !== 369) {
    return (
      <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
        <p className="text-red-600">Please connect to PulseChain (chain ID 369)</p>
      </div>
    );
  }

  const tokenSymbol = bondConfig[contractSymbol]?.token || "PLS";

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">{contractSymbol} Contract Info</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          {contractSymbol === "PLSTR" ? (
            <>
              <h3 className="text-lg font-medium mt-4">Bond Addresses</h3>
              {Object.entries(contractData.bondAddresses).map(([bond, address]) => (
                <p key={bond} className="text-gray-600">{bond}: <span className="text-purple-600">{address || "Not available"}</span></p>
              ))}
              <h3 className="text-lg font-medium mt-4">Contract Metrics</h3>
              <p className="text-gray-600">Total Supply: <span className="text-purple-600">{formatNumber(contractData.totalSupply)} PLSTR</span></p>
              <p className="text-gray-600">Total Minted Shares: <span className="text-purple-600">{formatNumber(contractData.metrics.totalMintedShares)} PLSTR</span></p>
              <p className="text-gray-600">Total Burned: <span className="text-purple-600">{formatNumber(contractData.metrics.totalBurned)} PLSTR</span></p>
              {Object.entries(contractData.metrics)
                .filter(([key]) => key.startsWith("pendingPLSTR"))
                .map(([key, value]) => (
                  <p key={key} className="text-gray-600">Pending PLSTR ({key.replace("pendingPLSTR", "")}): <span className="text-purple-600">{formatNumber(value)} PLSTR</span></p>
                ))}
              <h3 className="text-lg font-medium mt-4">Total Deposits</h3>
              {Object.entries(contractData.totalDeposits).map(([token, amount]) => (
                <p key={token} className="text-gray-600">{token.toUpperCase()}: <span className="text-purple-600">{formatNumber(amount)} {token.toUpperCase()}</span></p>
              ))}
              <p className="text-gray-600">Issuance Event Count: <span className="text-purple-600">{contractData.issuanceEventCount}</span></p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mt-4">Contract Metrics</h3>
              <p className="text-gray-600">Total Supply: <span className="text-purple-600">{formatNumber(contractData.bondMetrics.totalSupply)} {contractSymbol}</span></p>
              <p className="text-gray-600">Total Minted Shares: <span className="text-purple-600">{formatNumber(contractData.bondMetrics.totalMintedShares)} {contractSymbol}</span></p>
              <p className="text-gray-600">Total Burned: <span className="text-purple-600">{formatNumber(contractData.bondMetrics.totalBurned)} {contractSymbol}</span></p>
              <p className="text-gray-600">Remaining Issuance Period: <span className="text-purple-600">{formatIssuancePeriod(contractData.bondMetrics.remainingIssuancePeriod)}</span></p>
              {contractData.pairAddress && (
                <p className="text-gray-600">Pair Address: <span className="text-purple-600">{contractData.pairAddress}</span></p>
              )}
              <h3 className="text-lg font-medium mt-4">Contract Health</h3>
              <p className="text-gray-600">{tokenSymbol} Backing Ratio: <span className="text-purple-600">{formatNumber(contractData.contractHealth.tokenBackingRatio, true)}</span></p>
              <p className="text-gray-600">Controller Share Percentage: <span className="text-purple-600">{formatNumber(contractData.contractHealth.controllerSharePercentage)}</span></p>
              <p className="text-gray-600">Estimated Controller {tokenSymbol}: <span className="text-purple-600">{formatNumber(contractData.controllerToken)} {tokenSymbol}</span></p>
              <p className="text-gray-600">Total {tokenSymbol} from Swaps: <span className="text-purple-600">{formatNumber(contractData.totalTokenFromSwaps)} {tokenSymbol}</span></p>
              {contractSymbol === "hBOND" && (
                <>
                  <p className="text-gray-600">hBOND Balance: <span className="text-purple-600">{formatNumber(contractData.hBONDBalance)} hBOND</span></p>
                  <p className="text-gray-600">HEX Balance: <span className="text-purple-600">{formatNumber(contractData.hexBalance)} HEX</span></p>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ContractInfo;
