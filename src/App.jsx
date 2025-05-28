// src/App.jsx
import { useState, useEffect } from "react";
import ConnectWallet from "./components/ConnectWallet";
import ContractInfo from "./components/ContractInfo";
import IssueShares from "./components/IssueShares";
import RedeemShares from "./components/RedeemShares";
import AdminPanel from "./components/AdminPanel";
import UserInfo from "./components/UserInfo";
import LiquidityActions from "./components/LiquidityActions";
import { getWeb3, getContract, getAccount, contractAddresses, switchNetwork } from "./web3";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isController, setIsController] = useState(false);
  const [chainId, setChainId] = useState(369); // Default to PulseChain
  const [networkName, setNetworkName] = useState("PulseChain"); // Default to PulseChain
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateNetwork = async (web3Instance) => {
    try {
      if (!web3Instance) throw new Error("Web3 not initialized");
      const id = Number(await web3Instance.eth.getChainId());
      setChainId(id);
      setNetworkName(id === 1 ? "Ethereum" : id === 369 ? "PulseChain" : "Unknown Network");
      console.log("Network updated:", { chainId: id, networkName });
    } catch (err) {
      console.error("Failed to update network:", err);
      setError("Failed to detect network. Please ensure your wallet is connected.");
    }
  };

  const initializeApp = async () => {
    setLoading(true);
    setError("");
    try {
      const web3Instance = await getWeb3();
      if (!web3Instance) {
        console.log("Web3 not initialized, using default PulseChain display");
        setLoading(false);
        return;
      }
      setWeb3(web3Instance);

      await updateNetwork(web3Instance);

      const accounts = await getAccount(web3Instance);
      setAccount(accounts);

      const contractInstance = await getContract(web3Instance);
      if (!contractInstance) {
        throw new Error("Failed to initialize contract");
      }
      setContract(contractInstance);

      if (contractInstance && accounts && chainId === 1) {
        // Only check controller for PLSTR (Ethereum)
        try {
          if (!contractInstance.methods.owner) {
            throw new Error("owner method not found in PLSTR contract");
          }
          const owner = await contractInstance.methods.owner().call();
          const isOwner = accounts?.toLowerCase() === owner?.toLowerCase();
          setIsController(isOwner);
          console.log("Controller check (PLSTR):", {
            account: accounts,
            owner,
            isController: isOwner,
            chainId,
            contractAddress: contractInstance._address,
            contractMethods: Object.keys(contractInstance.methods),
          });
        } catch (err) {
          console.error("Failed to fetch controller:", err);
          setIsController(false);
          setError(`Failed to verify controller: ${err.message || "Unknown error"}`);
        }
      } else if (chainId === 369) {
        // No controller check for xBOND
        setIsController(false);
        console.log("Skipped controller check for xBOND:", { chainId, account: accounts });
      }
    } catch (error) {
      console.error("App initialization failed:", error);
      setError(`Initialization failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeApp();

    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        console.log("Chain changed, reinitializing...");
        initializeApp();
      });
      window.ethereum.on("accountsChanged", (accounts) => {
        console.log("Accounts changed:", accounts);
        setAccount(accounts[0] || null);
        initializeApp();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("chainChanged");
        window.ethereum.removeAllListeners("accountsChanged");
      }
    };
  }, []);

  const handleNetworkChange = async (e) => {
    if (web3) {
      try {
        await switchNetwork(web3, Number(e.target.value));
        await initializeApp();
      } catch (err) {
        console.error("Network switch failed:", err);
        setError(`Failed to switch network: ${err.message || "Unknown error"}`);
      }
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center p-4">
      <header className="w-full max-w-4xl bg-white bg-opacity-90 shadow-lg rounded-lg p-6 mb-6 card">
        <h1 className="text-3xl font-bold text-center text-purple-600">
          {chainId === 1 ? "PulseStrategy" : "xBOND"}
        </h1>
        <p className="text-center text-gray-600 mt-2">
          {account
            ? `Interact with the ${chainId === 1 ? "PLSTR" : "xBOND"} contract on ${networkName}`
            : `Connect your wallet to interact with the ${chainId === 1 ? "PLSTR" : "xBOND"} contract`}
        </p>
        <div className="mt-4">
          <label className="text-gray-600 mr-2">Select Network:</label>
          <select
            value={chainId || ""}
            onChange={handleNetworkChange}
            className="p-2 border rounded-lg"
            disabled={!web3}
          >
            <option value="1">Ethereum (PLSTR)</option>
            <option value="369">PulseChain (xBOND)</option>
          </select>
        </div>
        {account && (
          <p className="text-center text-gray-600 mt-2">
            Wallet: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        )}
        <ConnectWallet
          account={account}
          web3={web3}
          contractAddress={contractAddresses[chainId] || ""}
          chainId={chainId}
        />
        {!account && (
          <p className="text-center text-gray-600 mt-4">
            Recommended: Use MetaMask for the best experience. OneKey may have compatibility issues.
          </p>
        )}
      </header>
      <main className="w-full max-w-4xl space-y-6">
        {loading ? (
          <p className="text-center text-white">Loading...</p>
        ) : error ? (
          <>
            <p className="text-center text-red-400">{error}</p>
            {account && chainId && (
              <>
                <ContractInfo contract={contract} web3={web3} chainId={chainId} />
                <UserInfo contract={contract} account={account} web3={web3} chainId={chainId} />
                <IssueShares web3={web3} contract={contract} account={account} chainId={chainId} />
                <RedeemShares contract={contract} account={account} web3={web3} chainId={chainId} />
                {chainId === 369 && (
                  <LiquidityActions contract={contract} account={account} web3={web3} chainId={chainId} />
                )}
                {chainId === 1 && isController && (
                  <AdminPanel web3={web3} contract={contract} account={account} chainId={chainId} />
                )}
              </>
            )}
          </>
        ) : account && chainId ? (
          <>
            <ContractInfo contract={contract} web3={web3} chainId={chainId} />
            <UserInfo contract={contract} account={account} web3={web3} chainId={chainId} />
            <IssueShares web3={web3} contract={contract} account={account} chainId={chainId} />
            <RedeemShares contract={contract} account={account} web3={web3} chainId={chainId} />
            {chainId === 369 && (
              <LiquidityActions contract={contract} account={account} web3={web3} chainId={chainId} />
            )}
            {chainId === 1 && isController && (
              <AdminPanel web3={web3} contract={contract} account={account} chainId={chainId} />
            )}
          </>
        ) : (
          <p className="text-center text-white">Please connect your wallet to interact with the contract.</p>
        )}
      </main>
    </div>
  );
}

export default App;
