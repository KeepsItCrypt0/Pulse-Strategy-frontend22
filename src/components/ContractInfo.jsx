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

  // Truncate address to 0x1234...ABCD format
  const truncateAddress = (address) => {
    if (!address || typeof address !== "string" || address.length < 10) return "Not available";
    return `0x${address.slice(2, 6)}...${address.slice(-4)}`;
  };

  // Check if address is zero address
  const isZeroAddress = (address) => {
    return address === "0x0000000000000000000000000000000000000000";
  };

  const fromUnits = (balance, decimals) => {
    try {
      if (!balance || balance === "0") return "0";
      const balanceStr = typeof balance === "bigint" ? balance.toString() : balance.toString();
      if (decimals === 18) {
        return web3.utils.fromWei(balanceStr, "ether");
      }
      if (decimals === 8) {
        const balanceNum = Number(balanceStr) / 100000000;
        if (isNaN(balanceNum)) throw new Error("Invalid number after division");
        return balanceNum.toFixed(8).replace(/\.?0+$/, "");
      }
      return web3.utils.fromWei(balanceStr, "ether");
    } catch (err) {
      console.error("Error converting balance:", { balance, decimals, error: err.message });
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
      console.log("Total Supply:", { raw: totalSupply, formatted: fromUnits(totalSupply, 18) });

      let bondAddresses = contractData.bondAddresses;
      let metrics = contractData.metrics;
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
          contractMetrics,
        ] = await Promise.all([
          contract.methods.getBondAddresses().call(),
          contract.methods.getContractBalances().call(),
          contract.methods.getContractMetrics().call(),
        ]);

        console.log("PLSTR Data:", { bondAddrs, balances, metrics: contractMetrics });

        bondAddresses = {
          hBOND: bondAddrs.hBOND || "",
          pBOND: bondAddrs.pBOND || "",
          iBOND: bondAddrs.iBOND || "",
          xBOND: bondAddrs.xBOND || "",
        };

        metrics = {
          plsxBalance: fromUnits(balances.contractPLSXBalance || "0", tokenDecimals.PLSX),
          plsBalance: fromUnits(balances.contractPLSBalance || "0", tokenDecimals.PLS),
          incBalance: fromUnits(balances.contractINCBalance || "0", tokenDecimals.INC),
          hexBalance: fromUnits(balances.contractHEXBalance || "0", tokenDecimals.HEX),
          totalMintedShares: fromUnits(contractMetrics.totalMintedShares || "0", 18),
          totalBurned: fromUnits(contractMetrics.totalBurned || "0", 18),
          pendingPLSTRhBOND: fromUnits(contractMetrics.pendingPLSTRhBOND || "0", 18),
          pendingPLSTRpBOND: fromUnits(contractMetrics.pendingPLSTRpBOND || "0", 18),
          pendingPLSTRiBOND: fromUnits(contractMetrics.pendingPLSTRiBOND || "0", 18),
          pendingPLSTRxBOND: fromUnits(contractMetrics.pendingPLSTRxBOND || "0", 18),
        };

        // Total Deposits and Issuance Event Count removed previously
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
        metrics,
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

      console.log("Contract data set:", { contractSymbol, totalSupply, bondMetrics, metrics });
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
              <h3 className="text-lg font-medium mt-4">Contract Balances</h3>
              <p className="text-gray-600">PLSX Balance: <span className="text-purple-600">{formatNumber(contractData.metrics.plsxBalance)} PLSX</span></p>
              <p className="text-gray-600">PLS Balance: <span className="text-purple-600">{formatNumber(contractData.metrics.plsBalance)} PLS</span></p>
              <p className="text-gray-600">INC Balance: <span className="text-purple-600">{formatNumber(contractData.metrics.incBalance)} INC</span></p>
              <p className="text-gray-600">HEX Balance: <span className="text-purple-600">{formatNumber(contractData.metrics.hexBalance)} HEX</span></p>
              <div className="mt-6"></div>
              <h3 className="text-lg font-medium mt-4">Contract Metrics</h3>
              <p className="text-gray-600">Total Supply: <span className="text-purple-600">{formatNumber(contractData.totalSupply)} PLSTR</span></p>
              <p className="text-gray-600">Total Burned: <span className="text-purple-600">{formatNumber(contractData.metrics.totalBurned)} PLSTR</span></p>
              <h3 className="text-lg font-medium mt-4">Bond Addresses</h3>
              {Object.entries(contractData.bondAddresses).map(([bond, address]) => (
                <p key={bond} className="text-gray-600">
                  {bond}:{" "}
                  <span className="text-purple-600">
                    {address && !isZeroAddress(address) ? (
                      <a
                        href={`https://kekxplorer.avecdra.pro/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline cursor-pointer"
                      >
                        {truncateAddress(address)}
                      </a>
                    ) : (
                      "Not available"
                    )}
                  </span>
                </p>
              ))}
              {console.log("PLSTR UI rendered:", {
                contractBalances: {
                  plsxBalance: contractData.metrics.plsxBalance,
                  plsBalance: contractData.metrics.plsBalance,
                  incBalance: contractData.metrics.incBalance,
                  hexBalance: contractData.metrics.hexBalance,
                  totalSupply: contractData.totalSupply,
                },
              })}
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mt-4">Contract Details</h3>
              <p className="text-gray-600">Total Deposits: <span className="text-purple-600">{formatNumber(contractData.bondMetrics.totalSupply)} {contractSymbol}</span></p>
              <p className="text-gray-600">{tokenSymbol} Balance: <span className="text-purple-600">{formatNumber(contractData.bondMetrics.tokenBalance)} {tokenSymbol}</span></p>
              <p className="text-gray-600">Total Burned: <span className="text-purple-600">{formatNumber(contractData.bondMetrics.totalBurned)} {contractSymbol}</span></p>
              <p className="text-gray-600">Remaining Issuance: <span className="text-purple-600">{formatIssuancePeriod(contractData.bondMetrics.remainingIssuancePeriod)}</span></p>
              {contractData.pairAddress && !isZeroAddress(contractData.pairAddress) && (
                <p className="text-gray-600">
                  Pair Address:{" "}
                  <span className="text-purple-600">
                    <a
                      href={`https://kekxplorer.avecdra.pro/address/${contractData.pairAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline cursor-pointer"
                    >
                      {truncateAddress(contractData.pairAddress)}
                    </a>
                  </span>
                </p>
              )}
              {contractData.pairAddress && isZeroAddress(contractData.pairAddress) && (
                <p className="text-gray-600">
                  Pair Address: <span className="text-purple-600">Not available</span>
                </p>
              )}
              <h3 className="text-lg font-medium mt-4">Contract Health</h3>
              <p className="text-gray-600">{tokenSymbol} Backing Ratio: <span className="text-purple-600">{formatNumber(contractData.contractHealth.tokenBackingRatio)}</span></p>
              <p className="text-gray-600">Controller Share Percentage: <span className="text-purple-600">{formatNumber(contractData.contractHealth.controllerSharePercentage)}</span></p>
              <p className="text-gray-600">Total {tokenSymbol} from Swaps: <span className="text-purple-600">{formatNumber(contractData.totalTokenFromSwaps)} {tokenSymbol}</span></p>
              {console.log("Bond UI rendered:", {
                contractSymbol,
                pairAddress: contractData.pairAddress,
                tokenBalance: contractData.bondMetrics.tokenBalance,
              })}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ContractInfo;
