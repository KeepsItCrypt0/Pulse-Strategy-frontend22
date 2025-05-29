// src/components/AdminPanel.jsx
import { useState, useEffect } from "react";
import { getTokenContract } from "../web3";
import { formatNumber } from "../utils/format";

const AdminPanel = ({ web3, contract, account, chainId }) => {
  const [mintAmount, setMintAmount] = useState("");
  const [displayMintAmount, setDisplayMintAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [displayDepositAmount, setDisplayDepositAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recoverAmount, setRecoverAmount] = useState("");
  const [displayRecoverAmount, setDisplayRecoverAmount] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [plsxAmount, setPlsxAmount] = useState("");
  const [displayPlsxAmount, setDisplayPlsxAmount] = useState("");
  const [isXBONDCreator, setIsXBONDCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mintCountdown, setMintCountdown] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState("0");

  const fetchMintInfo = async () => {
    try {
      setError("");
      if (!contract) throw new Error("Contract not initialized");
      const info = await contract.methods.getContractInfo().call();
      setRemainingSeconds(info.remainingIssuancePeriod || "0");
      console.log("remainingIssuancePeriod:", info.remainingIssuancePeriod);
    } catch (err) {
      console.error("Failed to fetch mint info:", err);
      setError(`Failed to load mint info: ${err.message || "Unknown error"}`);
      setRemainingSeconds("0");
    }
  };

  const checkXBONDCreator = async () => {
    try {
      if (!contract || !account || chainId !== 369) return;
      const creator = await contract.methods._creator().call();
      setIsXBONDCreator(account?.toLowerCase() === creator?.toLowerCase());
      console.log("xBOND creator check:", { account, creator, isCreator: isXBONDCreator });
    } catch (err) {
      console.error("Failed to check xBOND creator:", err);
      setIsXBONDCreator(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && chainId === 1) fetchMintInfo();
    if (contract && web3 && chainId === 369) checkXBONDCreator();
  }, [contract, web3, chainId, account]);

  useEffect(() => {
    const updateCountdown = () => {
      const seconds = Number(remainingSeconds);
      if (seconds <= 0) {
        setMintCountdown("Issuance Period Ended or Data Unavailable");
        return;
      }
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      setMintCountdown(`${days}d ${hours}h ${minutes}m ${secs}s`);
    };
    if (chainId === 1) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [remainingSeconds, chainId]);

  const handleNumericInputChange = (e, setRaw, setDisplay) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^-?\d*\.?\d*$/.test(rawValue)) {
      setRaw(rawValue);
      if (rawValue === "" || isNaN(rawValue)) {
        setDisplay("");
      } else {
        setDisplay(
          new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 18,
            minimumFractionDigits: 0,
          }).format(rawValue)
        );
      }
    }
  };

  const handleMint = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(mintAmount, "ether");
      await contract.methods.mintShares(amountWei).send({ from: account });
      alert("PLSTR minted successfully!");
      setMintAmount("");
      setDisplayMintAmount("");
      fetchMintInfo();
      console.log("PLSTR minted:", { amountWei });
    } catch (err) {
      setError(`Error minting PLSTR: ${err.message || "Unknown error"}`);
      console.error("Mint error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(depositAmount, "ether");
      await contract.methods.depositStakedPLS(amountWei).send({ from: account });
      alert("vPLS deposited successfully!");
      setDepositAmount("");
      setDisplayDepositAmount("");
      console.log("vPLS deposited:", { amountWei });
    } catch (err) {
      setError(`Error depositing vPLS: ${err.message || "Unknown error"}`);
      console.error("Deposit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(recoverAmount, "ether");
      await contract.methods
        .recoverTokens(tokenAddress, recipientAddress, amountWei)
        .send({ from: account });
      alert("Tokens recovered successfully!");
      setTokenAddress("");
      setRecipientAddress("");
      setRecoverAmount("");
      setDisplayRecoverAmount("");
      console.log("Tokens recovered:", { tokenAddress, recipientAddress, amountWei });
    } catch (err) {
      setError(`Error recovering tokens: ${err.message || "Unknown error"}`);
      console.error("Recover error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    setLoading(true);
    setError("");
    try {
      await contract.methods.transferOwnership(newOwner).send({ from: account });
      alert("Ownership transferred successfully!");
      setNewOwner("");
      console.log("Ownership transferred:", { newOwner });
    } catch (err) {
      setError(`Error transferring ownership: ${err.message || "Unknown error"}`);
      console.error("Transfer ownership error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializePool = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(plsxAmount, "ether");
      const plsxContract = await getTokenContract(web3);
      if (!plsxContract) throw new Error("Failed to initialize PLSX contract");
      await plsxContract.methods
        .approve(contract.options.address, amountWei)
        .send({ from: account });
      await contract.methods.initializePool(amountWei).send({ from: account });
      alert("xBOND pool initialized successfully!");
      setPlsxAmount("");
      setDisplayPlsxAmount("");
      console.log("xBOND pool initialized:", { amountWei });
    } catch (err) {
      let errorMessage = `Error initializing xBOND pool: ${err.message || "Unknown error"}`;
      if (err.message.includes("PoolAlreadyExists")) {
        errorMessage = "Pool already initialized.";
      } else if (err.message.includes("InsufficientInitialLiquidity")) {
        errorMessage = "Amount too low. Minimum is 10 PLSX.";
      } else if (err.message.includes("InsufficientAllowance")) {
        errorMessage = "Insufficient PLSX allowance.";
      } else if (err.message.includes("ZeroAmount")) {
        errorMessage = "Enter a valid amount.";
      } else if (err.message.includes("PoolCreationFailed")) {
        errorMessage = "Failed to create pool.";
      } else if (err.message.includes("NotCreator")) {
        errorMessage = "Only the creator can initialize the pool.";
      }
      setError(errorMessage);
      console.error("Initialize pool error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (chainId !== 1 && (chainId !== 369 || !isXBONDCreator)) return null;

  return (
    <div className="bg-white bg-opacity-90 rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-gray-600">
        {chainId === 1 ? "PLSTR Admin Panel" : "xBOND Creator Panel"}
      </h2>
      {chainId === 1 && (
        <>
          <p className="text-gray-600 mb-4">Next Mint In: {mintCountdown}</p>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Mint PLSTR</h3>
            <input
              type="text"
              value={displayMintAmount}
              onChange={(e) => handleNumericInputChange(e, setMintAmount, setDisplayMintAmount)}
              placeholder="Amount to mint"
              className="w-full p-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              onClick={handleMint}
              disabled={loading || !mintAmount}
              className="btn-primary w-full"
            >
              {loading ? "Processing..." : "Mint PLSTR"}
            </button>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Deposit vPLS</h3>
            <input
              type="text"
              value={displayDepositAmount}
              onChange={(e) => handleNumericInputChange(e, setDepositAmount, setDisplayDepositAmount)}
              placeholder="Amount to deposit"
              className="w-full p-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              onClick={handleDeposit}
              disabled={loading || !depositAmount}
              className="btn-primary w-full"
            >
              {loading ? "Processing..." : "Deposit vPLS"}
            </button>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Recover Tokens</h3>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="Token address"
              className="w-full p-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Recipient address"
              className="w-full p-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <input
              type="text"
              value={displayRecoverAmount}
              onChange={(e) => handleNumericInputChange(e, setRecoverAmount, setDisplayRecoverAmount)}
              placeholder="Amount to recover"
              className="w-full p-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              onClick={handleRecover}
              disabled={loading || !tokenAddress || !recipientAddress || !recoverAmount}
              className="btn-primary w-full"
            >
              {loading ? "Processing..." : "Recover Tokens"}
            </button>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Transfer Ownership</h3>
            <input
              type="text"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              placeholder="New owner address"
              className="w-full p-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              onClick={handleTransferOwnership}
              disabled={loading || !newOwner}
              className="btn-primary w-full"
            >
              {loading ? "Processing..." : "Transfer Ownership"}
            </button>
          </div>
        </>
      )}
      {chainId === 369 && isXBONDCreator && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Initialize xBOND Pool</h3>
          <input
            type="text"
            value={displayPlsxAmount}
            onChange={(e) => handleNumericInputChange(e, setPlsxAmount, setDisplayPlsxAmount)}
            placeholder="PLSX amount (min 10)"
            className="w-full p-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <button
            onClick={handleInitializePool}
            disabled={loading || !plsxAmount || Number(plsxAmount) < 10}
            className="btn-primary w-full"
          >
            {loading ? "Processing..." : "Initialize Pool"}
          </button>
        </div>
      )}
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default AdminPanel;
