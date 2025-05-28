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
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState("Unknown");

  const updateNetwork = async (web3Instance) => {
    const id = await web3Instance.eth.getChainId();
    setChainId(id);
    setNetworkName(id === 1 ? "Ethereum" : id === 369 ? "PulseChain" : "Unknown");
  };

  useEffect(() => {
    const init = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);
        if (web3Instance) {
          const accounts = await getAccount(web3Instance);
          setAccount(accounts);
          const contractInstance = await getContract(web3Instance);
          setContract(contractInstance);
          await updateNetwork(web3Instance);
          if (contractInstance && accounts) {
            const owner = await contractInstance.methods[
              chainId === 1 ? "owner" : "getLPTokenHolder"
            ]().call();
            setIsController(accounts?.toLowerCase() === owner.toLowerCase());
            console.log("App initialized:", { account: accounts, owner, chainId });
          }
        }
      } catch (error) {
        console.error("Web3 initialization failed:", error);
      }
    };
    init();
  }, [chainId]);

  const handleNetworkChange = async (e) => {
    if (web3) {
      await switchNetwork(web3, Number(e.target.value));
      await updateNetwork(web3);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center p-4">
      <header className="w-full max-w-4xl bg-white bg-opacity-90 shadow-lg rounded-lg p-6 mb-6 card">
        <h1 className="text-3xl font-bold text-center text-purple-600">
          {chainId === 1 ? "PulseStrategy" : "xBOND"}
        </h1>
        <p className="text-center text-gray-600 mt-2">
          Interact with the {chainId === 1 ? "PLSTR" : "xBOND"} contract on {networkName}
        </p>
        <div className="mt-4">
          <label className="text-gray-600 mr-2">Select Network:</label>
          <select
            value={chainId || ""}
            onChange={handleNetworkChange}
            className="p-2 border rounded-lg"
          >
            <option value="1">Ethereum (PLSTR)</option>
            <option value="369">PulseChain (xBOND)</option>
          </select>
        </div>
        <ConnectWallet
          account={account}
          web3={web3}
          contractAddress={contractAddresses[chainId] || ""}
          chainId={chainId}
        />
      </header>
      <main className="w-full max-w-4xl space-y-6">
        {account && contract && chainId ? (
          <>
            <ContractInfo contract={contract} web3={web3} chainId={chainId} />
            <UserInfo contract={contract} account={account} web3={web3} chainId={chainId} />
            <IssueShares web3={contract} contract={contract} account={account} chainId={chainId} />
            <RedeemShares contract={contract} account={account} web3={web3} chainId={chainId} />
            {chainId === 369 && (
              <LiquidityActions
                contract={contract}
                account={account}
                web3={web3}
                chainId={chainId}
              />
            )}
            {chainId === 1 && isController && (
              <AdminPanel
                web3={web3}
                contract={contract}
                account={account}
                chainId={chainId}
              />
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
