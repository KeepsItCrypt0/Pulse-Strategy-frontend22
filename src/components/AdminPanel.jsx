import { useState, useEffect } from "react";
import { getTokenContract, formatNumber, formatDate, networks } from "../web3";

const AdminPanel = ({ web3, contract, account, network }) => {
  const [mintAmount, setMintAmount] = useState("");
  const [displayMintAmount, setDisplayMintAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [displayDepositAmount, setDisplayDepositAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recoverAmount, setRecoverAmount] = useState("");
  const [displayRecoverAmount, setDisplayRecoverAmount] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // For initial data fetch
  const [error, setError] = useState("");
  const [mintCountdown, setMintCountdown] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState("0");
  const { tokenName, shareName } = networks[network] || { tokenName: "Token", shareName: "Share" }; // Fallback values

  const fetchMintInfo = async () => {
    try {
      setInitialLoading(true);
      setError("");
      if (!contract || !web3) throw new Error("Contract or Web3 not initialized");

      const result = await contract.methods.getOwnerMintInfo().call();
      const nextMintTime = result.nextMintTime || "0";
      const info = await contract.methods.getContractInfo().call();
      const issuancePeriod = info.remainingIssuancePeriod || "0";

      const currentTime = Math.floor(Date.now() / 1000);
      if (Number(issuancePeriod) > 0) {
        setRemainingSeconds(issuancePeriod);
      } else if (Number(nextMintTime) > currentTime) {
        setRemainingSeconds(nextMintTime - currentTime);
      } else {
        setRemainingSeconds("0");
      }

      console.log("Mint info fetched:", { nextMintTime, issuancePeriod });
    } catch (err) {
      console.error("Failed to fetch mint info:", err);
      setError(
        `Failed to load mint info: ${
          err.message.includes("call revert") || err.message.includes("invalid opcode")
            ? "Method not found or ABI mismatch"
            : err.message || "Unknown error"
        }`
      );
      setRemainingSeconds("0");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && network === "ethereum") {
      fetchMintInfo();
      const interval = setInterval(fetchMintInfo, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [contract, web3, network]);

  useEffect(() => {
    const updateCountdown = () => {
      const seconds = Number(remainingSeconds);
      if (isNaN(seconds) || seconds <= 0) {
        setMintCountdown("Ready to mint");
        return;
      }
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      setMintCountdown(`${days}d ${hours}h ${minutes}m ${secs}s`);
    };
    if (network === "ethereum") {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [remainingSeconds, network]);

  const handleNumericInputChange = (e, setRaw, setDisplay) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^-?\d*\.?\d*$/.test(rawValue)) {
      setRaw(rawValue);
      setDisplay(
        rawValue === "" || isNaN(rawValue)
          ? ""
          : new Intl.NumberFormat("en-US", {
              maximumFractionDigits: 18,
              minimumFractionDigits: 0,
            }).format(rawValue)
      );
    }
  };

  const handleAddressInputChange = (e, setAddress) => {
    const value = e.target.value.trim();
    if (/^0x[a-fA-F0-9]{40}$/.test(value)) {
      setAddress(value);
    } else {
      setAddress(value); // Allow partial input, but transaction will fail if invalid
    }
  };

  const handleMint = async () => {
    setLoading(true);
    setError("");
    try {
      if (!contract || !account) throw new Error("Contract or account not initialized");
      const amountWei = web3.utils.toWei(mintAmount, "ether");
      await contract.methods.mintShares(amountWei).send({ from: account });
      alert(`${shareName} minted successfully!`);
      setMintAmount("");
      setDisplayMintAmount("");
      await fetchMintInfo();
      console.log(`${shareName} minted:`, { amountWei });
    } catch (err) {
      let errorMessage = `Error minting ${shareName}: ${err.message || "Unknown error"}`;
      if (err.message.includes("NotOwner")) {
        errorMessage = "Only the contract owner can mint shares.";
      } else if (err.message.includes("MintPeriodEnded")) {
        errorMessage = "Minting period has ended.";
      }
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
      if (!contract || !account) throw new Error("Contract or account not initialized");
      const amountWei = web3.utils.toWei(depositAmount, "ether");
      const tokenContract = await getTokenContract(web3, network);
      await tokenContract.methods
        .approve(contract.options.address, amountWei) // Use contract.options.address
        .send({ from: account });
      await contract.methods.depositStakedPLS(amountWei).send({ from: account });
      alert(`${tokenName} deposited successfully!`);
      setDepositAmount("");
      setDisplayDepositAmount("");
      console.log(`${tokenName} deposited:`, { amountWei });
    } catch (err) {
      let errorMessage = `Error depositing ${tokenName}: ${err.message || "Unknown error"}`;
      if (err.message.includes("NotOwner")) {
        errorMessage = "Only the contract owner can deposit tokens.";
      } else if (err.message.includes("InsufficientAllowance")) {
        errorMessage = "Insufficient token allowance for contract.";
      }
      setError(errorMessage);
      console.error("Deposit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    setLoading(true);
    setError("");
    try {
      if (!contract || !account) throw new Error("Contract or account not initialized");
      if (!/^[0x][0-9a-fA-F]{40}$/.test(tokenAddress) || !/^[0x][0-9a-fA-F]{40}$/.test(recipientAddress)) {
        throw new Error("Invalid token or recipient address.");
      }
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
      let errorMessage = `Error recovering tokens: ${err.message || "Unknown error"}`;
      if (err.message.includes("NotOwner")) {
        errorMessage = "Only the contract owner can recover tokens.";
      } else if (err.message.includes("InvalidAddress")) {
        errorMessage = "Invalid token or recipient address.";
      }
      setError(errorMessage);
      console.error("Recover error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    setLoading(true);
    setError("");
    try {
      if (!contract || !account) throw new Error("Contract or account not initialized");
      if (!/^[0x][0-9a-fA-F]{40}$/.test(newOwner)) {
        throw new Error("Invalid new owner address.");
      }
      await contract.methods.transferOwnership(newOwner).send({ from: account });
      alert("Ownership transferred successfully!");
      setNewOwner("");
      console.log("Ownership transferred:", { newOwner });
    } catch (err) {
      let errorMessage = `Error transferring ownership: ${err.message || "Unknown error"}`;
      if (err.message.includes("NotOwner")) {
        errorMessage = "Only the contract owner can transfer ownership.";
      } else if (err.message.includes("InvalidAddress")) {
        errorMessage = "Invalid new owner address.";
      }
      setError(errorMessage);
      console.error("Transfer ownership error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (network !== "ethereum") return null;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Admin Panel</h2>
      {initialLoading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button onClick={fetchMintInfo} className="mt-2 text-purple-300 hover:text-purple-400">
            Retry
          </button>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">Next Mint In: {mintCountdown}</p>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Mint {shareName}</h3>
            <input
              type="text"
              value={displayMintAmount}
              onChange={(e) => handleNumericInputChange(e, setMintAmount, setDisplayMintAmount)}
              placeholder="Amount to mint"
              className="w-full p-2 border rounded-lg mb-2"
            />
            <button
              onClick={handleMint}
              disabled={loading || !mintAmount || Number(mintAmount) <= 0}
              className="btn-primary"
            >
              {loading ? "Processing..." : `Mint ${shareName}`}
            </button>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Deposit {tokenName}</h3>
            <input
              type="text"
              value={displayDepositAmount}
              onChange={(e) => handleNumericInputChange(e, setDepositAmount, setDisplayDepositAmount)}
              placeholder="Amount to deposit"
              className="w-full p-2 border rounded-lg mb-2"
            />
            <button
              onClick={handleDeposit}
              disabled={loading || !depositAmount || Number(depositAmount) <= 0}
              className="btn-primary"
            >
              {loading ? "Processing..." : `Deposit ${tokenName}`}
            </button>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Recover Tokens</h3>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => handleAddressInputChange(e, setTokenAddress)}
              placeholder="Token address"
              className="w-full p-2 border rounded-lg mb-2"
            />
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => handleAddressInputChange(e, setRecipientAddress)}
              placeholder="Recipient address"
              className="w-full p-2 border rounded-lg mb-2"
            />
            <input
              type="text"
              value={displayRecoverAmount}
              onChange={(e) => handleNumericInputChange(e, setRecoverAmount, setDisplayRecoverAmount)}
              placeholder="Amount to recover"
              className="w-full p-2 border rounded-lg mb-2"
            />
            <button
              onClick={handleRecover}
              disabled={loading || !tokenAddress || !recipientAddress || !recoverAmount || Number(recoverAmount) <= 0}
              className="btn-primary"
            >
              {loading ? "Processing..." : "Recover Tokens"}
            </button>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Transfer Ownership</h3>
            <input
              type="text"
              value={newOwner}
              onChange={(e) => handleAddressInputChange(e, setNewOwner)}
              placeholder="New owner address"
              className="w-full p-2 border rounded-lg mb-2"
            />
            <button
              onClick={handleTransferOwnership}
              disabled={loading || !newOwner}
              className="btn-primary"
            >
              {loading ? "Processing..." : "Transfer Ownership"}
            </button>
          </div>
        </>
      )}
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default AdminPanel;
