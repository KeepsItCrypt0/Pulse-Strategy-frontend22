import { useState, useEffect } from "react";
import { getWeb3 } from "../../web3";
import { formatNumber, formatDate } from "../../format";

const PulseStrategyAdminPanel = ({ web3, contract, account }) => {
  const [amount, setAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMintShares = async () => {
    setLoading(true);
    setError("");
    try {
      if (!contract || !account || !web3) throw new Error("Contract or account not initialized");
      if (!contract.methods.mintShares) throw new Error("Method mintShares not found in contract ABI");
      const amountNum = web3.utils.toWei(amount, "ether");
      if (Number(amount) <= 0) throw new Error("Amount must be greater than 0");
      await contract.methods.mintShares(amountNum).send({ from: account });
      alert("Shares minted successfully!");
      setAmount("");
    } catch (err) {
      console.error("Mint shares error:", err);
      let errorMessage = "Error minting shares: Unknown error";
      if (err.message.includes("NotStrategyController")) errorMessage = "Only the strategy controller can mint shares";
      else if (err.message.includes("MintingLimitExceeded")) errorMessage = "Minting limit exceeded";
      else if (err.message) errorMessage = `Error minting shares: ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositStakedPLS = async () => {
    setLoading(true);
    setError("");
    try {
      if (!contract || !account || !web3) throw new Error("Contract or account not initialized");
      if (!contract.methods.depositStakedPLS) throw new Error("Method depositStakedPLS not found in contract ABI");
      const amountNum = web3.utils.toWei(amount, "ether");
      if (Number(amount) <= 0) throw new Error("Amount must be greater than 0");
      await contract.methods.depositStakedPLS(amountNum).send({ from: account });
      alert("Staked PLS deposited successfully!");
      setAmount("");
    } catch (err) {
      console.error("Deposit staked PLS error:", err);
      let errorMessage = "Error depositing staked PLS: Unknown error";
      if (err.message.includes("NotStrategyController")) errorMessage = "Only the strategy controller can deposit";
      else if (err.message) errorMessage = `Error depositing staked PLS: ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverTokens = async () => {
    setLoading(true);
    setError("");
    try {
      if (!contract || !account || !web3) throw new Error("Contract or account not initialized");
      if (!contract.methods.recoverTokens) throw new Error("Method recoverTokens not found in contract ABI");
      if (!web3.utils.isAddress(tokenAddress)) throw new Error("Invalid token address");
      await contract.methods.recoverTokens(tokenAddress, account, web3.utils.toWei(amount, "ether")).send({ from: account });
      alert("Tokens recovered successfully!");
      setAmount("");
      setTokenAddress("");
    } catch (err) {
      console.error("Recover tokens error:", err);
      let errorMessage = "Error recovering tokens: Unknown error";
      if (err.message.includes("CannotRecoverVPLS")) errorMessage = "Cannot recover vPLS";
      else if (err.message.includes("NotStrategyController")) errorMessage = "Only the strategy controller can recover tokens";
      else if (err.message) errorMessage = `Error recovering tokens: ${err.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!contract || !account || !web3) return null;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Admin Panel</h2>
      <div className="mb-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full p-2 mb-2 border rounded"
        />
        <button
          onClick={handleMintShares}
          disabled={loading || !amount || Number(amount) <= 0}
          className="btn-primary mr-2"
        >
          {loading ? "Processing..." : "Mint Shares"}
        </button>
        <button
          onClick={handleDepositStakedPLS}
          disabled={loading || !amount || Number(amount) <= 0}
          className="btn-primary"
        >
          {loading ? "Processing..." : "Deposit Staked PLS"}
        </button>
      </div>
      <div>
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="Enter token address"
          className="w-full p-2 mb-2 border rounded"
        />
        <button
          onClick={handleRecoverTokens}
          disabled={loading || !amount || Number(amount) <= 0 || !tokenAddress}
          className="btn-primary"
        >
          {loading ? "Processing..." : "Recover Tokens"}
        </button>
      </div>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default PulseStrategyAdminPanel;
