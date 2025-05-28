// src/App.jsx
import { useState, useEffect } from "react";
import { getWeb3, getContract, getAccount, switchNetwork } from "./web3";
import UserInfo from "./components/UserInfo";
import IssueShares from "./components/IssueShares";
import RedeemShares from "./components/RedeemShares";
import AdminPanel from "./components/AdminPanel";
import Footer from "./components/Footer";

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initializeWeb3 = async () => {
    setLoading(true);
    setError("");
    try {
      const web3Instance = await getWeb3();
      if (!web3Instance) throw new Error("Failed to initialize Web3");
      setWeb3(web3Instance);

      const account = await getAccount(web3Instance);
      if (!account) throw new Error("No account found");
      setAccount(account);

      const chainIdNum = Number(await web3Instance.eth.getChainId());
      setChainId(chainIdNum);

      const contractInstance = await getContract(web3Instance);
      if (!contractInstance) throw new Error("Failed to initialize contract");
      setContract(contractInstance);

      console.log("App initialized:", { chainId: chainIdNum, account, contractAddress: contractInstance.options.address });
    } catch (err) {
      console.error("Initialization error:", err);
      setError(`Failed to connect: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    await initializeWeb3();
  };

  const handleSwitchNetwork = async (targetChainId) => {
    if (!web3 || chainId === targetChainId) return;
    try {
      setLoading(true);
      setError("");
      await switchNetwork(web3, targetChainId);
      const newChainId = Number(await web3.eth.getChainId());
      if (newChainId !== targetChainId) throw new Error("Network switch failed");
      setChainId(newChainId);
      const contractInstance = await getContract(web3);
      if (!contractInstance) throw new Error("Failed to initialize contract");
      setContract(contractInstance);
      console.log("Network switched:", { newChainId, contractAddress: contractInstance.options.address });
    } catch (err) {
      console.error("Network switch error:", err);
      setError(`Failed to switch network: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        setAccount(accounts[0] || null);
        if (accounts[0]) await initializeWeb3();
        console.log("Accounts changed:", { account: accounts[0] });
      });
      window.ethereum.on("chainChanged", async () => {
        await initializeWeb3();
        console.log("Chain changed, reinitialized");
      });
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-600">
          PulseStrategy
        </h1>
        {!web3 || !account || !contract || !chainId ? (
          <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">
              Connect your wallet to interact with {chainId === 1 ? "PLSTR" : "xBOND"}.
            </p>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
            {error && <p className="text-red-400 mt-4">{error}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <button
                onClick={() => handleSwitchNetwork(1)}
                className={`btn-primary mb-4 ${chainId === 1 ? "bg-purple-700" : ""}`}
              >
                Switch to Ethereum (PLSTR)
              </button>
              <button
                onClick={() => handleSwitchNetwork(369)}
                className={`btn-primary mb-4 ${chainId === 369 ? "bg-purple-700" : ""}`}
              >
                Switch to PulseChain (xBOND)
              </button>
              <UserInfo contract={contract} account={account} web3={web3} chainId={chainId} />
            </div>
            <div>
              <IssueShares web3={web3} contract={contract} account={account} chainId={chainId} />
              <RedeemShares contract={contract} account={account} web3={web3} chainId={chainId} />
              <AdminPanel contract={contract} account={account} web3={web3} chainId={chainId} />
            </div>
          </div>
        )}
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </div>
      <Footer chainId={chainId} />
    </div>
  );
};

export default App;
