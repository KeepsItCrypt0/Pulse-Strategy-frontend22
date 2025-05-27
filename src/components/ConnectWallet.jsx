import { useState, useEffect } from "react";
import { getWeb3 } from "../web3";
import { formatNumber, formatDate } from "../format";

const ConnectWallet = ({ account, web3, network, onConnect, loading }) => {
  const [error, setError] = useState("");

  const handleConnect = async () => {
    try {
      setError("");
      if (loading) return;
      const web3Instance = await getWeb3();
      const accounts = await web3Instance.eth.getAccounts();
      if (!accounts[0]) throw new Error("No accounts found. Please unlock MetaMask.");
      onConnect();
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError(err.message || "Failed to connect wallet. Ensure MetaMask is installed and unlocked.");
    }
  };

  useEffect(() => {
    if (web3 && account) {
      setError("");
    }
  }, [web3, account]);

  if (account) {
    return (
      <div className="mb-4">
        <p className="text-gray-600">
          Connected: {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <button onClick={handleConnect} disabled={loading} className="btn-primary">
        {loading ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
};

export default ConnectWallet;
