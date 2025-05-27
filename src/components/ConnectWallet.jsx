import { useState, useEffect } from "react";
import { networks } from "../web3";

const ConnectWallet = ({ account, web3, network }) => {
  const [isConnected, setIsConnected] = useState(!!account);
  const [error, setError] = useState("");
  const { chainName } = networks[network];

  const connectWallet = async () => {
    try {
      setError("");
      if (!window.ethereum) {
        throw new Error("No crypto wallet found. Please install MetaMask.");
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      setIsConnected(!!accounts[0]);
      console.log("Wallet connected:", accounts[0]);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError(`Connection failed: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    setIsConnected(!!account);
    const handleAccountsChanged = (accounts) => {
      setIsConnected(!!accounts[0]);
      console.log("Accounts changed:", accounts);
    };
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    }
  }, [account]);

  return (
    <div className="mt-6 text-center">
      {isConnected ? (
        <div>
          <p className="text-gray-600">
            Connected to {chainName} as{" "}
            <span className="text-purple-600">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </p>
        </div>
      ) : (
        <button onClick={connectWallet} className="btn-primary">
          Connect Wallet
        </button>
      )}
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default ConnectWallet;
