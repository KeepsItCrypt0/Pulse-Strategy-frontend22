import { useState } from "react";
import { formatNumber } from "../../format";

const PulseStrategyAdminPanel = ({ web3, contract, account }) => {
  const [newOwner, setNewOwner] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;
    try {
      setError("");
      setSuccess("");
      await contract.methods.transferOwnership(newOwner).send({ from: account });
      setSuccess(`Ownership transferred to ${newOwner}`);
      setNewOwner("");
    } catch (err) {
      console.error("Transfer ownership failed:", err);
      setError(err.message || "Failed to transfer ownership.");
    }
  };

  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-semibold text-purple-600">Admin Panel</h2>
      <form onSubmit={handleTransferOwnership} className="space-y-4">
        <input
          type="text"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          placeholder="New Owner Address"
          className="w-full p-2 border rounded"
          disabled={!contract || !account}
        />
        <button type="submit" className="btn-primary w-full" disabled={!contract || !account}>
          Transfer Ownership
        </button>
        {error && <p className="text-red-400">{error}</p>}
        {success && <p className="text-green-400">{success}</p>}
      </form>
    </div>
  );
};

export default PulseStrategyAdminPanel;
