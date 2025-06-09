import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const ContractInfo = ({ contract, web3, chainId, contractSymbol }) => {
  const [contractData, setContractData] = useState({
    name: "",
    symbol: "",
    decimals: 18,
    totalSupply: "0",
    bondAddresses: { hBOND: "", pBOND: "", iBOND: "", xBOND: "" },
    balances: { plstr: "0", plsx: "0", pls: "0", inc: "0", hex: "0" },
    metrics: {
      totalSupply: "0",
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
    totalBurned: "0",
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
  const [error, setError] = useState("");

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
      ratioField: "amount",
      healthField: "incBackingRatio",
      reserveField: "balanceOf",
      swapsField: "balanceOf",
    },
    hBOND: {
      token: "HEX",
      balanceField: "hexBalance",
      bondField: "hBONDBalance",
      metricsField: "contractHEXBalance",
      ratioField: "hex",
      healthField: "hexBackingRatio",
      reserveField: "balanceOf",
      swapsField: "balanceOf",
    },
  };

  const fetchContractData = async () => {
    if (!contract || !web3 || chainId !== "369") return;
    try {
      setLoading(true);
      setError("");
      const config = bondConfig[contractSymbol] || bondConfig.pBOND;
      const [
        name,
        symbol,
        decimals,
        totalSupply,
        bondAddresses,
        contractBalances,
        contractMetrics,
        issuanceEventCount,
        totalBurned,
        totalDeposits,
        bondMetrics,
        bondBalances,
        pairAddress,
        contractHealth,
        controllerToken,
        balanceRatio,
        totalTokenFromSwaps,
      ] = await Promise.all([
        contract.methods.name().call(),
        contract.methods.symbol().call(),
        contract.methods.decimals().call(),
        contract.methods.totalSupply().call(),
        contractSymbol === "PLSTR" ? contractBalances.getBondAddresses().call() : Promise.resolve(null),
        contractSymbol === "PLSTR" ? contractBalances.getContractBalances().call() : Promise.resolve(null),
        contractSymbol === "PLSTR" ? contractMetrics.getContractMetrics().map() : Promise.resolve(null),
        contractSymbol === "PLSTR" ? issuanceContract.getIssuanceEventCount().call() : Promise.resolve("0"),
        contractSymbol === "PLSTR" ? totalBurn.getTotalBurned().call() : Promise.resolve("0"),
        contractSymbol === "PLSTR" ? totalDeposit.getTotalDeposits().call() : Promise.resolve(null),
        contractSymbol !== "PLSTR" ? contractMetrics.getBondMetrics().map() : Promise.resolve(null),
        contractSymbol !== "PLSTR" ? contractBalances.getBondBalances().call() : Promise.resolve(null),
        contractSymbol !== "PLSTR" ? balanceRatio.getPairAddress().call() : Promise.resolve(""),
        contractSymbol !== "PLSTR" ? contractHealth.getContractHealth().map() : Promise.resolve(null),
        contractSymbol !== "PLSTR" ? controllerToken[config.reserveField]().call() : Promise.resolve("0"),
        contractSymbol !== "PLSTR" ? balanceRatio.getContractBalanceRatio().call() : Promise.resolve(null),
        contractSymbol !== "PLSTR" ? totalTokenFromSwaps[config.swapsField]().call() : Promise.resolve("0"),
      ]);

      setContractData({
        name,
        symbol,
        decimals,
        totalSupply: web3.utils.fromWei(totalSupply, "ether"),
        bondAddresses: bondAddresses
          ? { hBOND: bondAddresses.hBOND, pBOND: bondAddresses.pBOND, iBOND: bondAddresses.iBOND, xBOND: bondAddresses.xBOND }
          : contractData.bondAddresses,
        balances: contractBalances
          ? {
              plstr: web3.utils.fromWei(contractBalances.plstrBalance, "ether"),
              plsx: web3.utils.fromWei(contractBalances.plsxBalance, "ether"),
              pls: web3.utils.fromWei(contractBalances.plsBalance, "ether"),
              inc: web3.utils.fromWei(contractBalances.incBalance, "ether"),
              hex: web3.utils.fromWei(contractBalances.hexBalance, "ether"), // Fixed: HEX uses 18 decimals
            }
          : contractData.contractBalances,
        metrics: contractMetrics
          ? {
              totalSupply: web3.utils.fromWei(totalSupply, "ether"),
              plsxBalance: web3.utils.fromWei(contractMetrics.contractPLSXBalance, "ether"),
              plsBalance: web3.utils.fromWei(contractMetrics.contractPLSBalance, "ether"),
              incBalance: web3.utils.fromWei(contractMetrics.contractINCBalance, "ether"),
              hexBalance: web3.utils.fromWei(hexBalance, "ether"), // Fixed: HEX uses  totalSupply: decimals,
  metrics: decimals,
              totalMintedShares: web3.utils.fromWei(totalMintedShares, "ether"),
              totalBurned: web3.utils.fromWei(totalBurned, "ether"),
              pendingPLSTRhBOND: web3.utils.fromWei(pendingPLSTRhBOND, "ether"),
              pendingPLSTRpBOND: web3.utils.fromWei(pendingPLSTRpBOND, "ether"),
              pendingPLSTRiBOND: web3.utils.fromWei(pendingPLSTRiBOND, "ether"),
              pendingPLSTRxBOND: web3.utils.fromWei(pendingPLSTRxBOND, "ether"),
            }
          : contractData.metrics,
        issuanceEventCount,
        totalBurned: web3.utils.fromWei(totalBurned, "ether"),
        totalDeposits: totalDeposits
          ? {
              plsx: web3.utils.fromWei(totalDeposits.totalPlsx, "ether"),
              pls: web3.utils.fromWei(totalDeposits.totalPls, "ether"),
              inc: web3.utils.fromWei(totalDeposits.totalInc, "ether"),
              hex: web3.utils.fromWei(totalDeposits.totalHex, "ether"), // Fixed: HEX uses 18 decimals
            }
          : contractData.totalDeposits,
        bondMetrics: bondMetrics
          ? {
              totalSupply: web3.utils.fromWei(bondMetrics.currentTotalSupply, "ether"),
              tokenBalance: web3.utils.fromWei(bondMetrics[config.metricsField], "ether"),
              totalMintedShares: web3.utils.fromWei(bondMetrics.totalMintedShares, "ether"),
              totalBurned: web3.utils.fromWei(bondMetrics.totalBurned, "ether"),
              remainingIssuancePeriod: bondMetrics.remainingIssuancePeriod.toString(),
            }
          : contractData.bondMetrics,
        bondBalances: bondBalances
          ? {
              bond: web3.utils.fromWei(bondBalances[config.bondField], "ether"),
              token: web3.utils.fromWei(bondBalances[config.balanceField], "ether"),
            }
          : contractData.bondBalances,
        pairAddress,
        contractHealth: contractHealth
          ? {
              tokenBackingRatio: web3.utils.fromWei(contractHealth[config.healthField], "ether"),
              controllerSharePercentage: web3.utils.fromWei(contractHealth.controllerSharePercentage, "ether"),
            }
          : contractData.contractHealth,
        controllerToken: web3.utils.fromWei(controllerToken, "ether"),
        balanceRatio: balanceRatio
          ? {
              tokenAmount: web3.utils.fromWei(balanceRatio[config.ratioField], "ether"),
              bondAmount: web3.utils.fromWei(balanceRatio[`${contractSymbol.toLowerCase()}Amount`], "ether"),
            }
          : contractData.balanceRatio,
        totalTokenFromSwaps: web3.utils.fromWei(totalTokenFromSwaps, "ether"),
      });
      console.log("Contract data fetched:", { contractSymbol, name, symbol, totalSupply });
    } catch (err) {
      console.error("Failed to fetch contract data:", err);
      setError(`Failed to load contract data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && chainId === 369) fetchContractData();
  }, [contract, web3, chainId, contractSymbol]);

  if (chainId !== 369) return null;

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
          <p className="text-gray-600">Name: <span className="text-purple-600">{contractData.name}</span></p>
          <p className="text-gray-600">Symbol: <span className="text-purple-600">{contractData.symbol}</span></p>
          <p className="text-gray-600">Decimals: <span className="text-purple-600">{contractData.decimals}</span></p>
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
              <p className="text-gray-600">Pair Address: <span className="text-purple-600">{contractData.pairAddress}</span></p>
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
