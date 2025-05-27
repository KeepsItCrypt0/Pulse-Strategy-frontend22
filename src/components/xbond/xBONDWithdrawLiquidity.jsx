import { useState } from "react";
import { formatNumber } from "../../format";

const xBONDWithdrawLiquidity = ({ web3, contract, account, network }) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;
    try {
      setError("");
      setSuccess("");
      const amountInWei = web3.utils.toWei(amount, "ether");
      await contract.methods.withdrawLiquidityAndReinvest(amountInWei).send({ from: account });
      setSuccess(`Successfully withdrew and reinvested ${amount} ${network.tokenName}`);
      setAmount("");
    } catch (err) {
      console.error("Withdraw liquidity and reinvest failed:", err);
      setError(err.message || "Failed to withdraw liquidity and reinvest. Check contract methods or balance.");
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
          Withdraw Liquidity & Reinvest
        </button>
        {error && <p className="text-red-400">{error}</p>}
        {success && <p className="text-green-400">{success}</p>}
      </form>
    </div>
  );
};

export default xBONDWithdrawLiquidity;
