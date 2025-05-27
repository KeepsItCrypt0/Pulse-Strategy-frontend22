import { useState, useEffect } from "react";
import { networks } from "../web3";

const ConnectWallet = ({ account, web3, network, onConnect }) => {
  const [isConnected, setIsConnected] = useState(!!account);
  const [error, setError] = useState("");
  const { chainName } = networks[network] || { chainName: "Unknown Network" };

  const connectWallet = async () => {
    try {
      setError(""); // Clear previous error
      if (!window.ethereum) {
        throw new Error("No crypto wallet found. Please install MetaMask.");
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      if (!accounts[0]) {
        throw new Error("No accounts available. Please connect MetaMask.");
      }
      setIsConnected(true);
      console.log("Wallet connected:", accounts[0]);
      if (onConnect) onConnect(accounts[0]); // Notify parent to update web3/account

      const networkId = await web3.eth.net.getId();
      const expectedNetworkId = network === "ethereum" ? 1 : 369;
      if (Number(networkId) !== expectedNetworkId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${expectedNetworkId.toString(16)}` }],
          });
          setError("");
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${expectedNetworkId.toString(16)}`,
                  chainName: chainName,
                  rpcUrls: [networks[network].rpcUrl],
                  nativeCurrency: networks[network].nativeCurrency,
                  blockExplorerUrls: [networks[network].blockExplorerUrls[0]],
                },
              ],
            });
          } else {
            setError(`Please switch to ${chainName} (chainId: ${expectedNetworkId}) in MetaMask.`);
          }
        }
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
  }, [account, network, chainName, onConnect]);

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
          <button onClick={() => setIsConnected(false)} className="text-red-500 mt-2">
            Disconnect
          </button>
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
