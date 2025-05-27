import { useState, useEffect } from "react";
import { getTokenContract, formatNumber, networks } from "./utils/format.js";

const PulseStrategyAdminPanel = ({ web3, contract, account }) => {
  const [mintAmount, setMintAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recoverAmount, setRecoverAmount] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [nextMintTime, setNextMintTime] = useState("Not loaded");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const { tokenName, shareName } = networks["ethereum"] || { tokenName: "vPLS", shareName: "PLSTR" };

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      setError("");
      if (!contract || !web3 || !account || !/^[0x][0-9a-fA-F]{40}$/.test(account)) {
        throw new Error("Contract, Web3, or invalid account not initialized");
      }

      const owner = await contract.methods.owner().call();
      if (account.toLowerCase() !== owner.toLowerCase()) {
        throw new Error("Only the contract owner can access this panel");
      }

      const nextMint = await contract.methods.nextMintTimestamp().call();
      setNextMintTime(formatDate(Number(nextMint) * 1000));
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      setError(
        `Failed to load admin data: ${
          err.message.includes("call revert") || err.message.includes("invalid opcode")
            ? "Method not found or ABI mismatch"
            : err.message || "Unknown error"
        }`
      );
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && account) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, web3, account]);

  const handleMint = async () => {
    setLoading(true);
    setError("");
    try {
      const amountNum = Number(mintAmount);
      if (amountNum <= 0) throw new Error("Amount must be greater than 0");
      const amountWei = web3.utils.toWei(mintAmount, "ether");
      await contract.methods.mintPLSTR(amountWei).send({ from: account });
      alert(`${shareName} minted successfully!`);
      setMintAmount("");
      await fetchData();
    } catch (err) {
      let errorMessage = `Error minting ${shareName}: ${err.message || "Unknown error"}`;
      if (err.message.includes("NotAuthorized")) errorMessage = "Only the owner can mint";
      setError(errorMessage);
      console.error("Mint error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setLoading(true);
    setError("");
    try {
      const amountNum = Number(depositAmount);
      if (amountNum <= 0) throw new Error("Amount must be greater than 0");
      const amountWei = web3.utils.toWei(depositAmount, "ether");
      await contract.methods.depositvPLS(amountWei).send({ from: account });
      alert(`${tokenName} deposited successfully!`);
      setDepositAmount("");
      await fetchData();
    } catch (err) {
      let errorMessage = `Error depositing ${tokenName}: ${err.message || "Unknown error"}`;
      if (err.message.includes("NotAuthorized")) errorMessage = "Only the owner can deposit";
      setError(errorMessage);
      console.error("Deposit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverTokens = async () => {
    setLoading(true);
    setError("");
    try {
      if (!web3.utils.isAddress(tokenAddress) || !web3.utils.isAddress(recipientAddress)) {
        throw new Error("Invalid token or recipient address");
      }
      const amountWei = web3.utils.toWei(recoverAmount, "ether");
      await contract.methods.recoverTokens(tokenAddress, recipientAddress, amountWei).send({ from: account });
      alert("Tokens recovered successfully!");
      setTokenAddress("");
      setRecipientAddress("");
      setRecoverAmount("");
      await fetchData();
    } catch (err) {
      let errorMessage = `Error recovering tokens: ${err.message || "Unknown error"}`;
      if (err.message.includes("NotAuthorized")) errorMessage = "Only the owner can recover tokens";
      setError(errorMessage);
      console.error("Recover tokens error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    setLoading(true);
    setError("");
    try {
      if (!web3.utils.isAddress(newOwnerAddress)) throw new Error("Invalid new owner address");
      await contract.methods.transferOwnership(newOwnerAddress).send({ from: account });
      alert("Ownership transferred successfully!");
      setNewOwnerAddress("");
      await fetchData();
    } catch (err) {
      let errorMessage = `Error transferring ownership: ${err.message || "Unknown error"}`;
      if (err.message.includes("NotAuthorized")) errorMessage = "Only the owner can transfer ownership";
      setError(errorMessage);
      console.error("Transfer ownership error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Admin Panel</h2>
      {initialLoading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button onClick={fetchData} className="mt-2 text-purple-300 hover:text-purple-400">
            Retry
          </button>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-2"><strong>Next Mint Available:</strong> {nextMintTime}</p>
          <div className="mb-4">
            <input
              type="text"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder={`Amount to mint (${shareName})`}
              className="w-full p-2 border rounded-lg mb-2"
            />
            <button onClick={handleMint} disabled={loading || !mintAmount} className="btn-primary">
              {loading ? "Processing..." : `Mint ${shareName}`}
            </button>
          </div>
          <div className="mb-4">
            <input
              type="text"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder={`Amount to deposit (${tokenName})`}
              className="w-full p-2 border rounded-lg mb-2"
            />
            <button onClick={handleDeposit} disabled={loading || !depositAmount} className="btn-primary">
              {loading ? "Processing..." : `Deposit ${tokenName}`}
            </button>
          </div>
          <div className="mb-4">
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="Token address"
              className="w-full p-2 border rounded-lg mb-2"
            />
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Recipient address"
              className="w-full p-2 border rounded-lg mb-2"
            />
            <input
              type="text"
              value={recoverAmount}
              onChange={(e) => setRecoverAmount(e.target.value)}
              placeholder="Amount to recover"
              className="w-full p-2 border rounded-lg mb-2"
            />
            <button onClick={handleRecoverTokens} disabled={loading || !tokenAddress || !recipientAddress || !recoverAmount} className="btn-primary">
              {loading ? "Processing..." : "Recover Tokens"}
            </button>
          </div>
          <div>
            <input
              type="text"
              value={newOwnerAddress}
              onChange={(e) => setNewOwnerAddress(e.target.value)}
              placeholder="New owner address"
              className="w-full p-2 border rounded-lg mb-2"
            />
            <button onClick={handleTransferOwnership} disabled={loading || !newOwnerAddress} className="btn-primary">
              {loading ? "Processing..." : "Transfer Ownership"}
            </button>
          </div>
        </>
      )}
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
};

export default PulseStrategyAdminPanel;
