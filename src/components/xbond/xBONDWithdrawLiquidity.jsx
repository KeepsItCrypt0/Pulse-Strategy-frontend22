import { useState } from "react";
import { formatNumber } from "../../format";

const xBONDWithdrawLiquidity = ({ web3, contract, account, network }) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Note: This is a placeholder. The xBOND contract might not have a withdrawLiquidity function.
  // Adjust based on your contract's actual methods.
  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;
    try {
      setError("");
      setSuccess("");
      const amountInWei = web3.utils.toWei(amount, "ether");
      // Replace with actual method if available (e.g., withdraw or custom liquidity function)
      await contract.methods.withdraw(amountInWei).send({ from: account });
      setSuccess(`Successfully withdrew ${amount} ${network.tokenName}`);
      setAmount("");
    } catch (err) {
      console.error("Withdraw liquidity failed:", err);
      setError(err.message || "Failed to withdraw liquidity. Check contract methods.");
    }
  };

  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-semibold text-purple-600">Withdraw Liquidity</h2>
      <form onSubmit={handleWithdraw} className="space-y-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in PLSX"
          className="w-full p-2 border rounded"
          disabled={!contract || !account}
        />
        <button type="submit" className="btn-primary w-full" disabled={!contract || !account}>
          Withdraw Liquidity
        </button>
        {error && <p className="text-red-400">{error}</p>}
        {success && <p className="text-green-400">{success}</p>}
      </form>
    </div>
  );
};

export default xBONDWithdrawLiquidity;
