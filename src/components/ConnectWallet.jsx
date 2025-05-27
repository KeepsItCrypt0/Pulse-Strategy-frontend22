import { useState, useEffect } from "react";
import { networks } from "../web3";

const ConnectWallet = ({ account, web3, network }) => {
  const [isConnected, setIsConnected] = useState(!!account);
  const [error, setError] = useState("");
  const { chainName } = networks[network] || { chainName: "Unknown Network" }; // Fallback value

  const connectWallet = async () => {
    try {
      setError("");
      if (!window.ethereum) {
        throw new Error("No crypto wallet found. Please install MetaMask.");
      }
      // Request accounts
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      if (!accounts[0]) {
        throw new Error("No accounts available. Please connect MetaMask.");
      }
      setIsConnected(true);
      console.log("Wallet connected:", accounts[0]);

      // Validate network (optional enhancement)
      const networkId = await web3.eth.net.getId();
      const expectedNetworkId = network === "ethereum" ? 1 : 369;
      if (Number(networkId) !== expectedNetworkId) {
        setError(`Please switch to ${chainName} (chainId: ${expectedNetworkId}) in MetaMask.`);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      let errorMessage = "Connection failed: Unknown error";
      if (err.code === 4001) {
        errorMessage = "Connection failed: User rejected the request.";
      } else if (err.message) {
        errorMessage = `Connection failed: ${err.message}`;
      }
      setError(errorMessage);
    }
  };

  useEffect(() => {
    setIsConnected(!!account);

    const handleAccountsChanged = (accounts) => {
      setIsConnected(!!accounts[0]);
      console.log("Accounts changed:", accounts);
      if (!accounts[0]) {
        setError("Wallet disconnected. Please reconnect.");
      }
    };

    const handleChainChanged = (chainId) => {
      console.log("Chain changed:", chainId);
      const networkId = Number(chainId);
      const expectedNetworkId = network === "ethereum" ? 1 : 369;
      if (networkId !== expectedNetworkId) {
        setError(`Network mismatch: Please switch to ${chainName} (chainId: ${expectedNetworkId}).`);
      } else {
        setError("");
      }
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account, network, chainName]);

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
