import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const ContractInfo = ({ contract, web3, chainId, contractSymbol }) => {
  const [contractData, setContractData] = useState({
    totalSupply: "0",
    bondAddresses: { hBOND: "", pBOND: "", iBOND: "", xBOND: "" },
    balances: { plstr: "0", plsx: "0", pls: "0", inc: "0", hex: "0" },
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
    bondBalances: { bond: "0", token: "0" },
    pairAddress: "",
    contractHealth: { tokenBackingRatio: "0", controllerSharePercentage: "0" },
    controllerToken: "0",
    balanceRatio: { tokenAmount: "0", bondAmount: "0" },
    totalTokenFromSwaps: "0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bondConfig = {
    pBOND: {
      token: "PLS",
      balanceField: "plsBalance",
      bondField: "pBONDBalance",
      metricsField: "contractPLSBalance",
      ratioField: "plsAmount",
      healthField: "plsBackingRatio",
      reserveField: "getPLSReserveContributions",
      swapsField: "getTotalPlsFromSwaps",
    },
    xBOND: {
      token: "PLSX",
      balanceField: "plsxBalance",
      bondField: "xBONDBalance",
      metricsField: "contractPLSXBalance",
      ratioField: "plsxAmount",
      healthField: "plsxBackingRatio",
      reserveField: "getPLSXReserveContributions",
      swapsField: "getTotalPlsxFromSwaps",
    },
    iBOND: {
      token: "INC",
      balanceField: "incBalance",
      bondField: "iBONDBalance",
      metricsField: "contractINCBalance",
      ratioField: "incAmount",
      healthField: "incBackingRatio",
      reserveField: "getINCReserveContributions",
      swapsField: "getTotalIncFromSwaps",
    },
    hBOND: {
      token: "HEX",
      balanceField: "hexBalance",
      bondField: "hBONDBalance",
      metricsField: "contractHEXBalance",
      ratioField: "hexAmount",
      healthField: "hexBackingRatio",
      reserveField: "getHEXReserveContributions",
      swapsField: "getTotalHexFromSwaps",
    },
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
      let contractBalances = contractData.balances;
      let contractMetrics = contractData.metrics;
      let issuanceEventCount = "0";
      let totalDeposits = contractData.totalDeposits;
      let bondMetrics = contractData.bondMetrics;
      let bondBalances = contractData.bondBalances;
      let pairAddress = "";
      let contractHealth = contractData.contractHealth;
      let controllerToken = "0";
      let balanceRatio = contractData.balanceRatio;
      let totalTokenFromSwaps = "0";

      if (isPLSTR) {
        // PLSTR-specific data
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
          hBOND: bondAddrs.hBOND,
          pBOND: bondAddrs.pBOND,
          iBOND: bondAddrs.iBOND,
          xBOND: bondAddrs.xBOND,
        };

        contractBalances = {
          plstr: web3.utils.fromWei(balances.plstrBalance || "0", "ether"),
          plsx: web3.utils.fromWei(balances.plsxBalance || "0", "ether"),
          pls: web3.utils.fromWei(balances.plsBalance || "0", "ether"),
          inc: web3.utils.fromWei(balances.incBalance || "0", "ether"),
          hex: web3.utils.fromWei(balances.hexBalance || "0", "ether"),
        };

        contractMetrics = {
          plsxBalance: web3.utils.fromWei(metrics.contractPLSXBalance || "0", "ether"),
          plsBalance: web3.utils.fromWei(metrics.contractPLSBalance || "0", "ether"),
          incBalance: web3.utils.fromWei(metrics.contractINCBalance || "0", "ether"),
          hexBalance: web3.utils.fromWei(metrics.contractHEXBalance || "0", "ether"),
          totalMintedShares: web3.utils.fromWei(metrics.totalMintedShares || "0", "ether"),
          totalBurned: web3.utils.fromWei(metrics.totalBurned || "0", "ether"),
          pendingPLSTRhBOND: web3.utils.fromWei(metrics.pendingPLSTRhBOND || "0", "ether"),
          pendingPLSTRpBOND: web3.utils.fromWei(metrics.pendingPLSTRpBOND || "0", "ether"),
          pendingPLSTRiBOND: web3.utils.fromWei(metrics.pendingPLSTRiBOND || "0", "ether"),
          pendingPLSTRxBOND: web3.utils.fromWei(metrics.pendingPLSTRxBOND || "0", "ether"),
        };

        issuanceEventCount = eventCount.toString();

        totalDeposits = {
          plsx: web3.utils.fromWei(deposits.totalPlsx || "0", "ether"),
          pls: web3.utils.fromWei(deposits.totalPls || "0", "ether"),
          inc: web3.utils.fromWei(deposits.totalInc || "0", "ether"),
          hex: web3.utils.fromWei(deposits.totalHex || "0", "ether"),
        };
      } else {
        // Bond contract data (hBOND, pBOND, iBOND, xBOND)
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
        const balanceRatios = contract.methods.getContractBalanceRatio
          ? await contract.methods.getContractBalanceRatio().call().catch(() => ({}))
          : {};
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
          balanceRatios,
          swaps,
        });

        bondMetrics = {
          totalSupply: web3.utils.fromWei(metrics.currentTotalSupply || "0", "ether"),
          tokenBalance: web3.utils.fromWei(metrics[config.metricsField] || "0", "ether"),
          totalMintedShares: web3.utils.fromWei(metrics.totalMintedShares || "0", "ether"),
          totalBurned: web3.utils.fromWei(metrics.totalBurned || "0", "ether"),
          remainingIssuancePeriod: (metrics.remainingIssuancePeriod || "0").toString(),
        };

        bondBalances = {
          bond: web3.utils.fromWei(balances[config.bondField] || "0", "ether"),
          token: web3.utils.fromWei(balances[config.balanceField] || "0", "ether"),
        };

        pairAddress = pairAddr;

        contractHealth = {
          tokenBackingRatio: web3.utils.fromWei(health[config.healthField] || "0", "ether"),
          controllerSharePercentage: web3.utils.fromWei(health.controllerSharePercentage || "0", "ether"),
        };

        controllerToken = web3.utils.fromWei(controllerReserve || "ether", "0");

        balanceRatio = {
          tokenAmount: web3.utils.fromWei(balanceRatios[config.ratioField] || "0", "ether"),
          bondAmount: web3.utils.fromWei(
            balanceRatios[`${contractSymbol.toLowerCase()}Amount`] || "0",
            "ether"
          ),
        };

        totalTokenFromSwaps = web3.utils.fromWei(swaps || "0", "ether");
      }

      setContractData({
        totalSupply: web3.utils.fromWei(totalSupply, "ether"),
        bondAddresses,
        balances: contractBalances,
        metrics: contractMetrics,
        issuanceEventCount,
        totalDeposits,
        bondMetrics,
        bondBalances,
        pairAddress,
        contractHealth,
        controllerToken,
        balanceRatio,
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
          <p className="text-gray-600">Total Supply: <span className="text-purple-600">{formatNumber(contractData.totalSupply)} {contractSymbol}</span></p>
          {contractSymbol === "PLSTR" ? (
            <>
              <h3 className="text-lg font-medium mt-4">Bond Addresses</h3>
              {Object.entries(contractData.bondAddresses).map(([bond, address]) => (
                <p key={bond} className="text-gray-600">{bond}: <span className="text-purple-600">{address}</span></p>
              ))}
              <h3 className="text-lg font-medium mt-4">Contract Balances</h3>
              {Object.entries(contractData.balances).map(([token, balance]) => (
                <p key={token} className="text-gray-600">{token.toUpperCase()}: <span className="text-purple-600">{formatNumber(balance)} {token.toUpperCase()}</span></p>
              ))}
              <h3 className="text-lg font-medium mt-4">Contract Metrics</h3>
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
              <h3 className="text-lg font-medium mt-4">Contract Balances</h3>
              <p className="text-gray-600">{contractSymbol}: <span className="text-purple-600">{formatNumber(contractData.bondBalances.bond)} {contractSymbol}</span></p>
              <p className="text-gray-600">{tokenSymbol}: <span className="text-purple-600">{formatNumber(contractData.bondBalances.token)} {tokenSymbol}</span></p>
              <h3 className="text-lg font-medium mt-4">Contract Metrics</h3>
              <p className="text-gray-600">Total Minted Shares: <span className="text-purple-600">{formatNumber(contractData.bondMetrics.totalMintedShares)} {contractSymbol}</span></p>
              <p className="text-gray-600">Total Burned: <span className="text-purple-600">{formatNumber(contractData.bondMetrics.totalBurned)} {contractSymbol}</span></p>
              <p className="text-gray-600">Remaining Issuance Period: <span className="text-purple-600">{formatNumber(contractData.bondMetrics.remainingIssuancePeriod)} seconds</span></p>
              {contractData.pairAddress && (
                <p className="text-gray-600">Pair Address: <span className="text-purple-600">{contractData.pairAddress}</span></p>
              )}
              <h3 className="text-lg font-medium mt-4">Contract Health</h3>
              <p className="text-gray-600">{tokenSymbol} Backing Ratio: <span className="text-purple-600">{formatNumber(contractData.contractHealth.tokenBackingRatio)}</span></p>
              <p className="text-gray-600">Controller Share Percentage: <span className="text-purple-600">{formatNumber(contractData.contractHealth.controllerSharePercentage)}</span></p>
              <p className="text-gray-600">Estimated Controller {tokenSymbol}: <span className="text-purple-600">{formatNumber(contractData.controllerToken)} {tokenSymbol}</span></p>
              <h3 className="text-lg font-medium mt-4">Balance Ratio</h3>
              <p className="text-gray-600">{tokenSymbol} Amount: <span className="text-purple-600">{formatNumber(contractData.balanceRatio.tokenAmount)} {tokenSymbol}</span></p>
              <p className="text-gray-600">{contractSymbol} Amount: <span className="text-purple-600">{formatNumber(contractData.balanceRatio.bondAmount)} {contractSymbol}</span></p>
              <p className="text-gray-600">Total {tokenSymbol} from Swaps: <span className="text-purple-600">{formatNumber(contractData.totalTokenFromSwaps)} {tokenSymbol}</span></p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ContractInfo;
