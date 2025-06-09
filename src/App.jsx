import { useState, useEffect } from "react";
import Web3 from "web3";
import ConnectWallet from "./ConnectWallet.jsx";
import ContractInfo from "./ContractInfo.jsx";
import UserInfo from "./UserInfo.jsx";
import IssueShares from "./IssueShares.jsx";
import RedeemShares from "./RedeemShares.jsx";
import SwapBurn from "./SwapBurn.jsx";
import ClaimPLSTR from "./ClaimPLSTR.jsx";
import AdminPanel from "./AdminPanel.jsx";
import { tokenAddresses, PLSTR_ABI, pBOND_ABI, xBOND_ABI, iBOND_ABI, hBOND_ABI } from "./web3";

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractSymbol, setContractSymbol] = useState("PLSTR");

  const contractABIs = {
    PLSTR: PLSTR_ABI,
    pBOND: pBOND_ABI,
    xBOND: xBOND_ABI,
    iBOND: iBOND_ABI,
    hBOND: hBOND_ABI,
  };

  const handleConnect = async (provider) => {
    try {
      const web3Instance = new Web3(provider);
      const accounts = await web3Instance.eth.getAccounts();
      const chain = await web3Instance.eth.getChainId();
      setWeb3(web3Instance);
      setAccount(accounts[0]);
      setChainId(Number(chain));
      console.log("Wallet connected:", { account: accounts[0], chainId: chain });
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      alert("Failed to connect wallet: " + err.message);
    }
  };

  useEffect(() => {
    if (web3 && chainId === 369 && contractSymbol) {
      const contractAddress = tokenAddresses[369][contractSymbol];
      const contractABI = contractABIs[contractSymbol];
      if (contractAddress && contractABI) {
        const contractInstance = new web3.eth.Contract(contractABI, contractAddress);
        setContract(contractInstance);
        console.log("Contract initialized:", { contractSymbol, contractAddress });
      }
    }
  }, [web3, chainId, contractSymbol]);

  if (!web3 || !account || chainId !== 369) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="card bg-white bg-opacity-90 p-8">
          <h1 className="text-2xl font-bold mb-4 text-purple-600">PulseStar DApp</h1>
          <ConnectWallet onConnect={handleConnect} />
          {chainId && chainId !== 369 && (
            <p className="text-red-600 mt-4">Please connect to PulseChain (chainId 369)</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white text-center">PulseStar DApp</h1>
        <div className="mb-4">
          <label className="text-white mr-2">Select Contract:</label>
          <select
            value={contractSymbol}
            onChange={(e) => setContractSymbol(e.target.value)}
            className="p-2 border rounded-lg"
          >
            {["PLSTR", "pBOND", "xBOND", "iBOND", "hBOND"].map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ContractInfo contract={contract} web3={web3} chainId={chainId} contractSymbol={contractSymbol} />
          <UserInfo contract={contract} account={account} web3={web3} chainId={chainId} contractSymbol={contractSymbol} />
          {contractSymbol === "PLSTR" ? (
            <>
              <IssueShares contract={contract} account={account} web3={web3} chainId={chainId} contractSymbol={contractSymbol} />
              <RedeemShares contract={contract} account={account} web3={web3} chainId={chainId} contractSymbol={contractSymbol} />
              <ClaimPLSTR contract={contract} account={account} web3={web3} chainId={chainId} contractSymbol={contractSymbol} />
              <AdminPanel contract={contract} account={account} web3={web3} chainId={chainId} contractSymbol={contractSymbol} />
            </>
          ) : (
            <>
              <IssueShares contract={contract} account={account} web3={web3} chainId={chainId} contractSymbol={contractSymbol} />
              <RedeemShares contract={contract} account={account} web3={web3} chainId={chainId} contractSymbol={contractSymbol} />
              <SwapBurn contract={contract} account={account} web3={web3} chainId={chainId} contractSymbol={contractSymbol} />
              <AdminPanel contract={contract} account={account} web3={web3} chainId={chainId} contractSymbol={contractSymbol} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
