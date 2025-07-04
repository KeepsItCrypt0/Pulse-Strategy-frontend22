import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const SwapBurn = ({ web3, contract, account, chainId, contractSymbol }) => {
  const [accumulatedBalance, setAccumulatedBalance] = useState({ bond: "0", token: "0" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Token decimals
  const tokenDecimals = {
    PLS: 18,
    PLSX: 18,
    INC: 18,
    HEX: 8,
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
      swap: "swapAccumulatedpBONDToPLS",
      burn: "burnContractpBOND",
      token: "PLS",
      balanceField: "plsBalance",
      bondField: "pBONDBalance",
    },
    xBOND: {
      swap: "swapAccumulatedxBONDToPLSX",
      burn: "burnContractxBOND",
      token: "PLSX",
      balanceField: "plsxBalance",
      bondField: "xBONDBalance",
    },
    iBOND: {
      swap: "swapAccumulatediBONDToINC",
      burn: "burnContractiBOND",
      token: "INC",
      balanceField: "incBalance",
      bondField: "iBONDBalance",
    },
    hBOND: {
      swap: "swapAccumulatedhBONDToHEX",
      burn: "burnContracthBOND",
      token: "HEX",
      balanceField: "hexBalance",
      bondField: "hBONDBalance",
    },
  };

  const fetchAccumulatedBalance = async () => {
    if (!web3 || !contract || chainId !== 369) return;
    try {
      setError("");
      if (!contract.methods.getContractBalances) {
        throw new Error(`getContractBalances method not found in ${contractSymbol} contract`);
      }
      const config = bondConfig[contractSymbol];
      const balances = await contract.methods.getContractBalances().call();
      const bondBalanceField = config?.bondField;
      const tokenBalanceField = config?.balanceField;

      let bondBalance, tokenBalance;
      if (typeof balances[bondBalanceField] !== "undefined" && typeof balances[tokenBalanceField] !== "undefined") {
        bondBalance = balances[bondBalanceField];
        tokenBalance = balances[tokenBalanceField];
      } else if (balances[0] && balances[1]) {
        bondBalance = balances[0];
        tokenBalance = balances[1];
        console.warn(`Using indexed access for ${contractSymbol} balances:`, balances);
      } else {
        throw new Error(`Balance fields ${bondBalanceField} or ${tokenBalanceField} not found in getContractBalances output`);
      }

      setAccumulatedBalance({
        bond: fromUnits(bondBalance, 18),
        token: fromUnits(tokenBalance, tokenDecimals[config.token]),
      });
      console.log("Accumulated balances fetched:", {
        contractSymbol,
        bondBalance: bondBalanceField,
        tokenBalance: tokenBalanceField,
        balances,
      });
    } catch (err) {
      console.error("Failed to fetch accumulated balances:", err);
      setError(`Failed to load balances: ${err.message}`);
    }
  };

  useEffect(() => {
    if (web3 && contract && chainId === 369) fetchAccumulatedBalance();
  }, [web3, contract, chainId, contractSymbol]);

  const handleSwap = async () => {
    setLoading(true);
    setError("");
    try {
      const swapFunction = bondConfig[contractSymbol]?.swap;
      if (!swapFunction || !contract.methods[swapFunction]) {
        throw new Error(`Swap function ${swapFunction} not found in ${contractSymbol} contract`);
      }
      await contract.methods[swapFunction]().send({ from: account });
      alert(`Swapped accumulated ${contractSymbol} to ${bondConfig[contractSymbol].token} successfully!`);
      fetchAccumulatedBalance();
      console.log("Swap executed:", { contractSymbol, swapFunction });
    } catch (err) {
      setError(`Error swapping tokens: ${err.message}`);
      console.error("Swap error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBurn = async () => {
    if (!window.confirm(`Are you sure you want to burn accumulated ${contractSymbol}? This is irreversible.`)) return;
    setLoading(true);
    setError("");
    try {
      const burnFunction = bondConfig[contractSymbol]?.burn;
      if (!burnFunction || !contract.methods[burnFunction]) {
        throw new Error(`Burn function ${burnFunction} not found in ${contractSymbol} contract`);
      }
      await contract.methods[burnFunction]().send({ from: account });
      alert(`Burned accumulated ${contractSymbol} successfully!`);
      fetchAccumulatedBalance();
      console.log("Burn executed:", { contractSymbol, burnFunction });
    } catch (err) {
      setError(`Error burning tokens: ${err.message}`);
      console.error("Burn error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (chainId !== 369 || contractSymbol === "PLSTR") return null;

  const tokenSymbol = bondConfig[contractSymbol]?.token || "PLS";

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Swap or Burn {contractSymbol}</h2>
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Accumulated {contractSymbol}: <span className="text-purple-600">{formatNumber(accumulatedBalance.bond)} {contractSymbol}</span>
        </p>
        <h3 className="text-lg font-medium mb-2">Swap Accumulated Tokens</h3>
        <button
          onClick={handleSwap}
          disabled={loading || Number(accumulatedBalance.bond) <= 0}
          className="btn-primary mr-2"
        >
          {loading ? "Processing..." : `Swap ${contractSymbol} to ${tokenSymbol}`}
        </button>
        <h3 className="text-lg font-medium mt-4 mb-2">Burn Accumulated Tokens</h3>
        <button
          onClick={handleBurn}
          disabled={loading || Number(accumulatedBalance.bond) <= 0}
          className="btn-primary bg-red-600 hover:bg-red-700"
        >
          {loading ? "Processing..." : `Burn ${contractSymbol}`}
        </button>
      </div>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default SwapBurn;
