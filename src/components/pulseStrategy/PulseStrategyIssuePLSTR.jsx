import { useState } from "react";
import { formatNumber } from "../../format";

const PulseStrategyIssuePLSTR = ({ web3, contract, account }) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;
    try {
      setError("");
      setSuccess("");
      const amountInWei = web3.utils.toWei(amount, "ether");
      await contract.methods.stake(amountInWei).send({ from: account });
      setSuccess(`Successfully issued ${amount} ${contract.tokenName}`);
      setAmount("");
    } catch (err) {
      console.error("Issue PLSTR failed:", err);
      setError(err.message || "Failed to issue PLSTR. Check your balance and approval.");
    }
  };

  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-semibold text-purple-600">Issue PLSTR</h2>
      <form onSubmit={handleIssue} className="space-y-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in ETH"
          className="w-full p-2 border rounded"
          disabled={!contract || !account}
        />
        <button type="submit" className="btn-primary w-full" disabled={!contract || !account}>
          Issue PLSTR
        </button>
        {error && <p className="text-red-400">{error}</p>}
        {success && <p className="text-green-400">{success}</p>}
      </form>
    </div>
  );
};

export default PulseStrategyIssuePLSTR;
