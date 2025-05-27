import { useState, useEffect } from "react";
import { getWeb3 } from "../../web3";
import { formatNumber, formatDate } from "../../format";

const PulseStrategyRedeemPLSTR = ({ contract, account, web3 }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRedeemShares = async () => {
    setLoading(true);
    setError("");
    try {
      if (!contract || !account || !web3) throw new Error("Contract or account not initialized");
      if (!contract.methods.redeemShares) throw new Error("Method redeemShares not found in contract ABI");
      const amountNum = web3.utils.toWei(amount, "ether");
      if (Number(amount) <= 0) throw new Error("Amount must be greater than 0");
      await contract.methods.redeemShares(amountNum).send({ from: account });
      alert("Shares redeemed successfully!");
      setAmount("");
    } catch (err) {
      console.error("Redeem shares error:", err);
      let errorMessage = "Error redeeming shares: Unknown error";
      if (err.message.includes("InsufficientBalance")) errorMessage = "Insufficient PLSTR balance";
      else if (err.message.includes("BelowMinimumShareAmount")) errorMessage = "Amount below minimum threshold";
      else if (err.message) errorMessage = `Error redeeming shares: ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!contract || !account || !web3) return null;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Redeem PLSTR</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter PLSTR amount"
        className="w-full p-2 mb-4 border rounded"
      />
      <button
        onClick={handleRedeemShares}
        disabled={loading || !amount || Number(amount) <= 0}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Redeem Shares"}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default PulseStrategyRedeemPLSTR;
