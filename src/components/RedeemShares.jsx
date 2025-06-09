import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { tokenAddresses, ERC20_ABI } from "../web3";

const RedeemShares = ({ contract, account, web3, chainId, contractSymbol }) => {
  const [amount, setAmount] = useState("");
  const [redeemableAssets, setRedeemableAssets] = useState({
    plsx: "0",
    pls: "0",
    inc: "0",
    hex: "0",
  });
  const [userBalance, setUserBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tokenConfig = {
    pBOND: { symbol: "PLS", address: tokenAddresses[369].PLS },
    xBOND: { symbol: "PLSX", address: tokenAddresses[369].PLSX },
    iBOND: { symbol: "INC", address: tokenAddresses[369].INC },
    hBOND: { symbol: "HEX", address: tokenAddresses[369].HEX },
    PLSTR: [
      { symbol: "PLSX", address: tokenAddresses[369].PLSX },
      { symbol: "PLS", address: tokenAddresses[369].PLS },
      { symbol: "INC", address: tokenAddresses[369].INC },
      { symbol: "HEX", address: tokenAddresses[369].HEX },
    ],
  };

  const isPLSTR = contractSymbol === "PLSTR";
  const tokens = isPLSTR ? tokenConfig.PLSTR : [tokenConfig[contractSymbol]];

  const fetchUserData = async () => {
    if (!web3 || !contract || !account || chainId !== 369) return;
    try {
      if (!contract.methods.balanceOf) {
        throw new Error(`balanceOf method not found in ${contractSymbol} contract`);
      }
      const balance = await contract.methods.balanceOf(account).call();
      setUserBalance(web3.utils.fromWei(balance, "ether"));
      console.log("User balance fetched:", { contractSymbol, balance });
    } catch (err) {
      console.error("Failed to fetch user balance:", err);
      setError(`Failed to load balance: ${err.message}`);
    }
  };

  const fetchRedeemableAssets = async () => {
    if (!web3 || !contract || !amount || Number(amount) <= 0 || chainId !== 369) return;
    try {
      if (!contract.methods.totalSupply) {
        throw new Error(`totalSupply method not found in ${contractSymbol} contract`);
      }
      const shareAmount = web3.utils.toWei(amount, "ether");
      const totalSupply = await contract.methods.totalSupply().call();
      if (Number(totalSupply) === 0) {
        setRedeemableAssets({ plsx: "0", pls: "0", inc: "0", hex: "0" });
        return;
      }

      const assets = { plsx: "0", pls: "0", inc: "0", hex: "0" };
      for (const token of tokens) {
        const tokenContract = new web3.eth.Contract(ERC20_ABI, token.address);
        const tokenBalance = await tokenContract.methods.balanceOf(contract.options.address).call();
        const redeemableAmount = web3.utils.toBN(tokenBalance).mul(web3.utils.toBN(shareAmount)).div(web3.utils.toBN(totalSupply));
        assets[token.symbol.toLowerCase()] = web3.utils.fromWei(redeemableAmount, "ether");
      }

      setRedeemableAssets(assets);
      console.log("Redeemable assets fetched:", { contractSymbol, assets });
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
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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
