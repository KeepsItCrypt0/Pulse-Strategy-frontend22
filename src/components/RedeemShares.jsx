import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { tokenAddresses, plsABI, incABI, plsxABI, hexABI } from "../web3";

const RedeemShares = ({ contract, account, web3, chainId, contractSymbol }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState(""); // Formatted for display
  const [redeemableAssets, setRedeemableAssets] = useState({
    plsx: "0",
    pls: "0",
    inc: "0",
    hex: "0",
  });
  const [userBalance, setUserBalance] = useState("0");
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

  const tokenConfig = {
    pBOND: { symbol: "PLS", address: tokenAddresses[369].PLS, redeemMethod: "getRedeemablePLS", abi: plsABI },
    xBOND: { symbol: "PLSX", address: tokenAddresses[369].PLSX, redeemMethod: "getRedeemablePLSX", abi: plsxABI },
    iBOND: { symbol: "INC", address: tokenAddresses[369].INC, redeemMethod: "getRedeemableINC", abi: incABI },
    hBOND: { symbol: "HEX", address: tokenAddresses[369].HEX, redeemMethod: "getRedeemableHEX", abi: hexABI },
    PLSTR: [
      { symbol: "PLSX", address: tokenAddresses[369].PLSX, abi: plsxABI },
      { symbol: "PLS", address: tokenAddresses[369].PLS, abi: plsABI },
      { symbol: "INC", address: tokenAddresses[369].INC, abi: incABI },
      { symbol: "HEX", address: tokenAddresses[369].HEX, abi: hexABI },
    ],
  };

  const isPLSTR = contractSymbol === "PLSTR";
  const tokens = isPLSTR ? tokenConfig.PLSTR : [tokenConfig[contractSymbol]];

  // Format input value with commas
  const formatInputValue = (value) => {
    if (!value) return "";
    const num = Number(value.replace(/,/g, ""));
    if (isNaN(num)) return value; // Allow partial input
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 8, // Support decimals for shares
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Handle input change
  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, ""); // Strip commas
    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      setAmount(rawValue);
      setDisplayAmount(formatInputValue(rawValue));
    }
  };

  const fetchUserData = async () => {
    if (!web3 || !contract || !account || chainId !== 369) return;
    try {
      if (!contract.methods.balanceOf) {
        throw new Error(`balanceOf method not found in ${contractSymbol} contract`);
      }
      const balance = await contract.methods.balanceOf(account).call();
      setUserBalance(fromUnits(balance, 18));
      console.log("User balance fetched:", { contractSymbol, balance, formatted: fromUnits(balance, 18) });
    } catch (err) {
      console.error("Failed to fetch user balance:", err);
      setError(`Failed to load balance: ${err.message}`);
    }
  };

  const fetchRedeemableAssets = async () => {
    if (!web3 || !contract || !amount || Number(amount) <= 0 || chainId !== 369) {
      setRedeemableAssets({ plsx: "0", pls: "0", inc: "0", hex: "0" });
      return;
    }
    try {
      const shareAmount = web3.utils.toWei(amount, "ether");
      let assets = { plsx: "0", pls: "0", inc: "0", hex: "0" };

      if (isPLSTR) {
        if (!contract.methods.getRedeemableAssets) {
          throw new Error(`getRedeemableAssets method not found in PLSTR contract`);
        }
        const [plsx, pls, inc, hex] = await contract.methods.getRedeemableAssets(shareAmount).call();
        assets = {
          plsx: fromUnits(plsx, tokenDecimals.PLSX),
          pls: fromUnits(pls, tokenDecimals.PLS),
          inc: fromUnits(inc, tokenDecimals.INC),
          hex: fromUnits(hex, tokenDecimals.HEX),
        };
      } else {
        const token = tokens[0];
        if (!contract.methods[token.redeemMethod]) {
          throw new Error(`${token.redeemMethod} method not found in ${contractSymbol} contract`);
        }
        const redeemable = await contract.methods[token.redeemMethod](shareAmount).call();
        assets[token.symbol.toLowerCase()] = fromUnits(redeemable, tokenDecimals[token.symbol]);
      }

      setRedeemableAssets(assets);
      console.log("Redeemable assets fetched:", { contractSymbol, assets, shareAmount });
    } catch (err) {
      console.error("Failed to fetch redeemable assets:", err);
      setError(`Failed to load redeemable assets: ${err.message}`);
    }
  };

  useEffect(() => {
    if (web3 && contract && account && chainId === 369) fetchUserData();
  }, [web3, contract, account, chainId, contractSymbol]);

  useEffect(() => {
    if (web3 && contract && amount && chainId === 369) fetchRedeemableAssets();
    else setRedeemableAssets({ plsx: "0", pls: "0", inc: "0", hex: "0" });
  }, [amount, web3, contract, chainId, contractSymbol]);

  const handleRedeemShares = async () => {
    if (!amount || Number(amount) <= 0 || Number(amount) > Number(userBalance)) {
      setError("Please enter a valid amount within your balance");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const shareAmount = web3.utils.toWei(amount, "ether");
      const redeemMethod = "redeemShares";
      if (!contract.methods[redeemMethod]) {
        throw new Error(`Method ${redeemMethod} not found in ${contractSymbol} contract`);
      }
      await contract.methods[redeemMethod](shareAmount).send({ from: account });
      const redemptionMessage = isPLSTR
        ? `Successfully redeemed ${amount} ${contractSymbol} for ${formatNumber(redeemableAssets.plsx)} PLSX, ${formatNumber(
            redeemableAssets.pls
          )} PLS, ${formatNumber(redeemableAssets.inc)} INC, ${formatNumber(redeemableAssets.hex)} HEX!`
        : `Successfully redeemed ${amount} ${contractSymbol} for ${formatNumber(redeemableAssets[tokens[0].symbol.toLowerCase()])} ${
            tokens[0].symbol
          }!`;
      alert(redemptionMessage);
      setAmount("");
      setDisplayAmount(""); // Reset formatted input
      setRedeemableAssets({ plsx: "0", pls: "0", inc: "0", hex: "0" });
      fetchUserData();
      console.log("Shares redeemed:", { contractSymbol, shareAmount });
    } catch (err) {
      setError(`Error redeeming shares: ${err.message}`);
      console.error("Redeem shares error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (chainId !== 369) return null;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Redeem {contractSymbol} Shares</h2>
      <p className="text-gray-600 mb-2">
        Your {contractSymbol} Balance: <span className="text-purple-600">{formatNumber(userBalance)} {contractSymbol}</span>
      </p>
      <div className="mb-4">
        <label className="text-gray-600">Amount ({contractSymbol})</label>
        <input
          type="text"
          value={displayAmount}
          onChange={handleAmountChange}
          placeholder={`Enter ${contractSymbol} amount`}
          className="w-full p-2 border rounded-lg"
          disabled={loading}
        />
        {tokens.map((token) => (
          <p key={token.symbol} className="text-gray-600 mt-2">
            Redeemable {token.symbol}:{" "}
            <span className="text-purple-600">{formatNumber(redeemableAssets[token.symbol.toLowerCase()])} {token.symbol}</span>
          </p>
        ))}
      </div>
      <button
        onClick={handleRedeemShares}
        disabled={loading || !amount || Number(amount) <= 0 || Number(amount) > Number(userBalance)}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Redeem Shares"}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default RedeemShares;
