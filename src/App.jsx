import { useState, useEffect } from "react";
import { getWeb3, getContract, switchNetwork, networks } from "./web3";
import PulseStrategyContractInfo from "./components/pulseStrategy/PulseStrategyContractInfo.jsx";
import PulseStrategyIssuePLSTR from "./components/pulseStrategy/PulseStrategyIssuePLSTR.jsx";
import PulseStrategyUserInfo from "./components/pulseStrategy/PulseStrategyUserInfo.jsx";
import PulseStrategyRedeemPLSTR from "./components/pulseStrategy/PulseStrategyRedeemPLSTR.jsx";
import PulseStrategyAdminPanel from "./components/pulseStrategy/PulseStrategyAdminPanel.jsx";
import xBONDContractInfo from "./components/xbond/xBONDContractInfo.jsx";
import xBONDIssue from "./components/xbond/xBONDIssue.jsx";
import xBONDUserInfo from "./components/xbond/xBONDUserInfo.jsx";
import xBONDRedeem from "./components/xbond/xBONDRedeem.jsx";
import xBONDWithdrawLiquidity from "./components/xbond/xBONDWithdrawLiquidity.jsx";
import "./index.css";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isController, setIsController] = useState(false);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const [walletError, setWalletError] = useState("");

  const initializeWeb3 = async (selectedNetwork) => {
    try {
      setNetworkError("");
      setWalletError("");
      setLoading(true);
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask and try again.");
      }
      const web3Instance = await getWeb3();
      setWeb3(web3Instance);
      await switchNetwork(selectedNetwork);
      const contractInstance = await getContract(web3Instance, selectedNetwork);
      setContract(contractInstance);
      const accounts = await web3Instance.eth.getAccounts();
      if (!accounts[0]) throw new Error("No accounts available. Please connect MetaMask.");
      setAccount(accounts[0]);
      let controller = false;
      if (selectedNetwork === "ethereum") {
        try {
          const owner = await contractInstance.methods.owner().call();
          controller = accounts[0].toLowerCase() === owner.toLowerCase();
        } catch (error) {
          console.error("Failed to check owner:", error);
        }
      }
      setIsController(controller);
      setNetwork(selectedNetwork);
    } catch (error) {
      console.error("Web3 initialization failed:", error);
      let errorMessage = `Failed to initialize ${selectedNetwork}: ${error.message}`;
      if (error.message.includes("Failed to switch")) {
        errorMessage += ". Please switch manually in MetaMask.";
      }
      setNetworkError(errorMessage);
      setWeb3(null);
      setContract(null);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async (selectedNetwork) => {
    try {
      setWalletError("");
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask.");
      }
      const web3Instance = await getWeb3();
      const accounts = await web3Instance.eth.request({ method: "eth_requestAccounts" });
      if (!accounts[0]) throw new Error("No accounts found. Please unlock MetaMask.");
      await initializeWeb3(selectedNetwork);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setWalletError(err.message || "Failed to connect wallet. Ensure MetaMask is installed and unlocked.");
    }
  };

  useEffect(() => {
    const handleNetworkChange = (chainId) => {
      const chainIdHex = `0x${Number(chainId).toString(16)}`;
      if (network && networks[network].chainId !== chainIdHex) {
        setNetworkError(`Network changed to unexpected chain (${chainIdHex}). Please switch to ${network}.`);
        setWeb3(null);
        setContract(null);
        setAccount(null);
      }
    };
    if (web3?.currentProvider?.on) {
      web3.currentProvider.on("chainChanged", handleNetworkChange);
      return () => web3.currentProvider.removeListener("chainChanged", handleNetworkChange);
    }
  }, [web3, network]);

  const handleRetry = () => {
    if (network) {
      initializeWeb3(network);
    }
  };

  const { tokenName, shareName } = network && networks[network] ? networks[network] : { tokenName: "", shareName: "" };

  console.log("App state:", { web3, contract, account, network, networkError, loading });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 max-w-2xl w-full card">
        <h1 className="text-2xl font-bold mb-4 text-purple-600">{shareName || "Strategy"} Strategy</h1>
        <div className="mb-4">
          <button
            onClick={() => handleConnectWallet("ethereum")}
            disabled={loading || (network === "ethereum" && account)}
            className="btn-primary mr-2"
          >
            {loading && network === "ethereum" ? "Connecting..." : "Connect Wallet (Ethereum)"}
          </button>
          <button
            onClick={() => handleConnectWallet("pulsechain")}
            disabled={loading || (network === "pulsechain" && account)}
            className="btn-primary"
          >
            {loading && network === "pulsechain" ? "Connecting..." : "Connect Wallet (PulseChain)"}
          </button>
        </div>
        {account && (
          <div className="mb-4">
            <p className="text-gray-600">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          </div>
        )}
        {walletError && <p className="text-red-400 mb-4">{walletError}</p>}
        <div className="mb-4">
          <button
            onClick={() => initializeWeb3("ethereum")}
            disabled={loading || network === "ethereum"}
            className="btn-primary mr-2"
          >
            {loading && network === "ethereum" ? "Switching..." : "Switch to Ethereum"}
          </button>
          <button
            onClick={() => initializeWeb3("pulsechain")}
            disabled={loading || network === "pulsechain"}
            className="btn-primary"
          >
            {loading && network === "pulsechain" ? "Switching..." : "Switch to PulseChain"}
          </button>
        </div>
        {networkError && (
          <div className="mb-4">
            <p className="text-red-400">{networkError}</p>
            <button onClick={handleRetry} className="mt-2 text-purple-300 hover:text-purple-400">
              Retry
            </button>
          </div>
        )}
        {loading && !networkError && <p className="text-gray-600 mb-4">Loading...</p>}
        {!account && !loading && !networkError && !walletError && (
          <p className="text-gray-600 mb-4">Please connect your wallet to continue.</p>
        )}
        {account && contract && network && !networkError && !loading && (
          <>
            {network === "ethereum" ? (
              <>
                <PulseStrategyContractInfo contract={contract} web3={web3} />
                <PulseStrategyIssuePLSTR web3={web3} contract={contract} account={account} />
                <PulseStrategyUserInfo contract={contract} account={account} web3={web3} />
                <PulseStrategyRedeemPLSTR contract={contract} account={account} web3={web3} />
                {isController && <PulseStrategyAdminPanel web3={web3} contract={contract} account={account} />}
              </>
            ) : (
              <>
                <xBONDContractInfo contract={contract} web3={web3} />
                <xBONDIssue web3={web3} contract={contract} account={account} />
                <xBONDUserInfo contract={contract} account={account} web3={web3} />
                <xBONDRedeem contract={contract} account={account} web3={web3} />
                <xBONDWithdrawLiquidity web3={web3} contract={contract} account={account} network={network} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
