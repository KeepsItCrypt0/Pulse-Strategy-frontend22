import { useState, useEffect } from "react";
import { getWeb3 } from "../../web3";
import { formatNumber, formatDate } from "../../format";

const PulseStrategyIssuePLSTR = ({ web3, contract, account }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenContract, setTokenContract] = useState(null);

  const handleIssueShares = async () => {
    setLoading(true);
    setError("");
    try {
      if (!contract || !account || !web3) throw new Error("Contract or account not initialized");
      if (!contract.methods.issueShares) throw new Error("Method issueShares not found in contract ABI");
      const amountNum = web3.utils.toWei(amount, "ether");
      if (Number(amount) <= 0) throw new Error("Amount must be greater than 0");
      const token = await getTokenContract(web3, "ethereum");
      setTokenContract(token);
      await token.methods.approve(contract.options.address, amountNum).send({ from: account });
      await contract.methods.issueShares(amountNum).send({ from: account });
      alert("Shares issued successfully!");
      setAmount("");
    } catch (err) {
      console.error("Issue shares error:", err);
      let errorMessage = "Error issuing shares: Unknown error";
      if (err.message.includes("BelowMinimumShareAmount")) errorMessage = "Amount below minimum share threshold";
      else if (err.message.includes("InsufficientBalance")) errorMessage = "Insufficient vPLS balance";
      else if (err.message.includes("IssuancePeriodEnded")) errorMessage = "Issuance period has ended";
      else if (err.message) errorMessage = `Error issuing shares: ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!contract || !account || !web3) return null;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Issue PLSTR</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter vPLS amount"
        className="w-full p-2 mb-4 border rounded"
      />
      <button
        onClick={handleIssueShares}
        disabled={loading || !amount || Number(amount) <= 0}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Issue Shares"}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default PulseStrategyIssuePLSTR;
