import { useState } from "react";
import { formatNumber } from "../../format";

const PulseStrategyRedeemPLSTR = ({ contract, account, web3 }) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;
    try {
      setError("");
      setSuccess("");
      const amountInWei = web3.utils.toWei(amount, "ether");
      await contract.methods.redeem(amountInWei).send({ from: account });
      setSuccess(`Successfully redeemed ${amount} PLSTR`);
      setAmount("");
    } catch (err) {
      console.error("Redeem PLSTR failed:", err);
      setError(err.message || "Failed to redeem PLSTR. Check your balance.");
    }
  };

  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-semibold text-purple-600">Redeem PLSTR</h2>
      <form onSubmit={handleRedeem} className="space-y-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in PLSTR"
          className="w-full p-2 border rounded"
          disabled={!contract || !account}
        />
        <button type="submit" className="btn-primary w-full" disabled={!contract || !account}>
          Redeem PLSTR
        </button>
        {error && <p className="text-red-400">{error}</p>}
        {success && <p className="text-green-400">{success}</p>}
      </form>
    </div>
  );
};

export default PulseStrategyRedeemPLSTR;
