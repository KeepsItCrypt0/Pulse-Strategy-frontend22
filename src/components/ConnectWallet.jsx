// src/components/ConnectWallet.jsx
import { useState, useEffect } from "react";
import EthereumProvider from "@walletconnect/ethereum-provider";
import Web3 from "web3";

const ConnectWallet = ({ account, web3, contractAddress, chainId, setWeb3, setAccount, setChainId }) => {
  const [connecting, setConnecting] = useState(false);
  const [connectionType, setConnectionType] = useState(null); // Track MetaMask or WalletConnect

  // Initialize WalletConnect provider
  const initWalletConnect = async () => {
    try {
      const provider = await EthereumProvider.init({
        projectId: "dfa53b26ebcaa8d274b2a7f6ddc66cb0", // Your provided WalletConnect Project ID
        chains: [1, 369], // Supported chain IDs (Ethereum and PulseChain)
        showQrModal: true, // Show QR code for mobile wallet connection
        methods: ["eth_sendTransaction", "eth_sign", "personal_sign", "eth_requestAccounts"],
        events: ["chainChanged", "accountsChanged"],
      });
      return provider;
    } catch (error) {
      console.error("Failed to initialize WalletConnect:", error);
      return null;
    }
  };

  // Connect via MetaMask
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      console.error("MetaMask not detected");
      return false;
    }
    setConnecting(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Instance = new Web3(window.ethereum);
      const accounts = await web3Instance.eth.getAccounts();
      const chainIdNum = Number(await web3Instance.eth.getChainId());
      setWeb3(web3Instance);
      setAccount(accounts[0]);
      setChainId(chainIdNum);
      setConnectionType("MetaMask");
      return true;
    } catch (error) {
      console.error("MetaMask connection failed:", error);
      return false;
    } finally {
      setConnecting(false);
    }
  };

  // Connect via WalletConnect
  const connectWalletConnect = async () => {
    setConnecting(true);
    try {
      const provider = await initWalletConnect();
      if (!provider) throw new Error("WalletConnect initialization failed");
      await provider.enable(); // Connect and show QR code
      const web3Instance = new Web3(provider);
      const accounts = await web3Instance.eth.getAccounts();
      const chainIdNum = Number(await web3Instance.eth.getChainId());
      setWeb3(web3Instance);
      setAccount(accounts[0]);
      setChainId(chainIdNum);
      setConnectionType("WalletConnect");
      // Listen for WalletConnect events
      provider.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || null);
      });
      provider.on("chainChanged", (newChainId) => {
        setChainId(Number(newChainId));
      });
      provider.on("disconnect", () => {
        setAccount(null);
        setChainId(null);
        setConnectionType(null);
      });
      return true;
    } catch (error) {
      console.error("WalletConnect connection failed:", error);
      return false;
    } finally {
      setConnecting(false);
    }
  };

  // Handle account and chain changes for MetaMask
  useEffect(() => {
    if (connectionType === "MetaMask" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        setAccount(accounts[0] || null);
      };
      const handleChainChanged = (newChainId) => {
        setChainId(Number(newChainId));
        window.location.reload(); // Reload to ensure contract compatibility
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [connectionType, setAccount, setChainId]);

  const explorerUrl = chainId === 1 ? "https://etherscan.io" : "https://scan.pulsechain.com";

  return (
    <div className="mt-4 text-center">
      <h2 className="text-lg font-semibold text-gray-800">Wallet Connection</h2>
      {account ? (
        <>
          <p className="text-gray-600">
            Connected: {account.slice(0, 6)}...{account.slice(-4)} ({connectionType})
          </p>
          <p className="text-gray-600">
            {chainId === 1 ? "PLSTR" : "xBOND"} Contract:{" "}
            <a
              href={`${explorerUrl}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-300 hover:text-red-300 truncate inline-block max-w-[200px]"
              title={contractAddress}
            >
              {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
            </a>
          </p>
        </>
      ) : (
        <div className="flex justify-center gap-4 mt-2">
          <button
            onClick={connectMetaMask}
            disabled={connecting || !window.ethereum}
            className="btn-primary"
          >
            {connecting && connectionType === "MetaMask" ? "Connecting..." : "Connect MetaMask"}
          </button>
          <button
            onClick={connectWalletConnect}
            disabled={connecting}
            className="btn-primary"
          >
            {connecting && connectionType === "WalletConnect" ? "Connecting..." : "Connect WalletConnect"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
