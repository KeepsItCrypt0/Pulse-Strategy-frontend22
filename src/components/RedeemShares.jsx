import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

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

  const fetchUserData = async () => {
    if (!web3 || !contract || !account || chainId !== 369) return;
    try {
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
      const shareAmount = web3.utils.toWei(amount, "ether");
      const assets = await contract.methods.getRedeemableAssets(shareAmount).call();
      setRedeemableAssets({
        plsx: web3.utils.fromWei(assets.plsxAmount, "ether"),
        pls: web3.utils.fromWei(assets.plsAmount, "ether"),
        inc: web3.utils.fromWei(assets.incAmount, "ether"),
        hex: web3.utils.fromWei(assets.hexAmount, "ether"),
      });
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
      await contract.methods.redeemShares(shareAmount).send({ from: account });
      alert(
        `Successfully redeemed ${amount} ${contractSymbol} for ${formatNumber(redeemableAssets.plsx)} PLSX, ${formatNumber(
          redeemableAssets.pls
        )} PLS, ${formatNumber(redeemableAssets.inc)} INC, ${formatNumber(redeemableAssets.hex)} HEX!`
      );
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

  if (chainId !== 369) return null; // Removed contractSymbol !== "PLSTR"

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
        <p className="text-gray-600 mt-2">
          Redeemable PLSX: <span className="text-purple-600">{formatNumber(redeemableAssets.plsx)} PLSX</span>
        </p>
        <p className="text-gray-600">
          Redeemable PLS: <span className="text-purple-600">{formatNumber(redeemableAssets.pls)} PLS</span>
        </p>
        <p className="text-gray-600">
          Redeemable INC: <span className="text-purple-600">{formatNumber(redeemableAssets.inc)} INC</span>
        </p>
        <p className="text-gray-600">
          Redeemable HEX: <span className="text-purple-600">{formatNumber(redeemableAssets.hex)} HEX</span>
        </p>
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
