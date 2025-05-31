import { useState, useEffect } from "react";
import Web3 from "web3";
import ContractInfo from "./components/ContractInfo";
import IssueShares from "./components/IssueShares";

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initWeb3 = async () => {
    try {
      setLoading(true);
      setError("");

      if (!window.ethereum) {
        setError("MetaMask is not installed. Please install it to use this app.");
        setLoading(false);
        return;
      }

      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        setError("No accounts found. Please connect MetaMask.");
        setLoading(false);
        return;
      }
      setAccount(accounts[0]);

      const chainIdNum = Number(await window.ethereum.request({ method: "eth_chainId" }));
      setChainId(chainIdNum);

      let contractAddress, contractABI;
      if (chainIdNum === 1) {
        contractAddress = "0x123..."; // PLSTR contract address
        contractABI = []; // PLSTR ABI
      } else if (chainIdNum === 369) {
        contractAddress = "0x456..."; // xBOND contract address
        contractABI = []; // xBOND ABI
      } else {
        setError("Unsupported network. Please switch to Ethereum (1) or PulseChain (369).");
        setLoading(false);
        return;
      }

      const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
      setContract(contractInstance);

      window.ethereum.on("accountsChanged", (newAccounts) => {
        setAccount(newAccounts[0] || null);
      });

      window.ethereum.on("chainChanged", (newChainId) => {
        window.location.reload();
      });

      console.log("Web3 initialized:", { chainId: chainIdNum, account: accounts[0] });
    } catch (err) {
      console.error("Web3 initialization failed:", err);
      setError(`Failed to initialize: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initWeb3();
  }, []);

  if (loading) return <div className="text-center mt-10 text-gray-600">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-700">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-600">
          {chainId === 1 ? "PLSTR" : "xBOND"} Dashboard
        </h1>
        <div className="grid grid-cols-1 gap-6">
          <ContractInfo contract={contract} web3={web3} chainId={chainId} />
          <IssueShares
            contract={contract}
            web3={web3}
            chainId={chainId}
            account={account}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
