import { useState, useEffect } from "react";
import { getWeb3, getContract, switchNetwork, networks, formatNumber, formatDate } from "./web3";
import AdminPanel from "./components/AdminPanel.jsx";
import ConnectWallet from "./components/ConnectWallet.jsx";
import ContractInfo from "./components/ContractInfo.jsx";
import IssuePLSTR from "./components/IssuePLSTR.jsx";
import UserInfo from "./components/UserInfo.jsx";
import WithdrawLiquidity from "./components/WithdrawLiquidity.jsx";
import RedeemPLSTR from "./components/RedeemPLSTR.jsx";
import "./index.css";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isController, setIsController] = useState(false);
  const [contractInfo, setContractInfo] = useState({
    balance: "0",
    issuancePeriod: "Loading...",
  });
  const [shareBalance, setShareBalance] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
  const [redeemable, setRedeemable] = useState("0");
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const { tokenName, shareName } = network ? networks[network] : { tokenName: "", shareName: "" };

  const initializeWeb3 = async (selectedNetwork) => {
    try {
      setNetworkError("");
      setLoading(true);
      const web3Instance = await getWeb3();
      if (!web3Instance) {
        throw new Error("No web3 provider detected");
      }
      setWeb3(web3Instance);
      const networkId = await web3Instance.eth.net.getId();
      const expectedNetworkId = selectedNetwork === "ethereum" ? 1 : 369;
      console.log("initializeWeb3:", { networkId, expectedNetworkId, selectedNetwork });
      if (Number(networkId) !== expectedNetworkId) {
        console.log(`Switching to ${selectedNetwork} (chainId: ${networks[selectedNetwork].chainId})`);
        await switchNetwork(selectedNetwork);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Small delay to ensure network switch
        const newNetworkId = await web3Instance.eth.net.getId();
        if (Number(newNetworkId) !== expectedNetworkId) {
          throw new Error(`Failed to switch to ${selectedNetwork} (expected ${expectedNetworkId}, got ${newNetworkId})`);
        }
      }
      const accounts = await web3Instance.eth.getAccounts();
      if (!accounts[0]) {
        throw new Error("No accounts available. Please connect MetaMask.");
      }
      setAccount(accounts[0]);
      const contractInstance = await getContract(web3Instance, selectedNetwork);
      if (!contractInstance) {
        throw new Error("Failed to initialize contract");
      }
      setContract(contractInstance);
      let controller = false;
      if (selectedNetwork === "ethereum") {
        try {
          const owner = await contractInstance.methods.owner().call();
          controller = accounts[0]?.toLowerCase() === owner.toLowerCase();
        } catch (error) {
          console.error("Failed to check owner:", error);
        }
      }
      setIsController(controller);
      setNetwork(selectedNetwork);
      console.log("App initialized:", { account: accounts[0], network: selectedNetwork, networkId, isController: controller });
    } catch (error) {
      console.error("Web3 initialization failed:", error);
      let errorMessage = `Failed to initialize ${selectedNetwork}: ${error.message}`;
      if (error.message.includes("call revert") || error.message.includes("invalid opcode")) {
        errorMessage = `Failed to initialize ${selectedNetwork}: Contract method not found or ABI mismatch`;
      }
      setNetworkError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractData = async () => {
    if (!contract || !web3 || !account) {
      console.log("fetchContractData: Missing dependencies", { contract, web3, account });
      return;
    }
    try {
      setLoading(true);
      console.log("Fetching contract data for network:", network);
      const info = await contract.methods.getContractInfo().call();
      console.log("getContractInfo:", info);
      const balance = await contract.methods.balanceOf(account).call();
      console.log("balanceOf:", balance);
      const supply = await contract.methods.totalSupply().call();
      console.log("totalSupply:", supply);
      let redeemableAmount = "0";
      try {
        if (network === "ethereum") {
          redeemableAmount = await contract.methods.getRedeemableStakedPLS(account, balance).call();
        } else {
          redeemableAmount = await contract.methods.getRedeemablePLSX(balance).call();
        }
        console.log("Redeemable amount:", redeemableAmount);
      } catch (error) {
        console.error("Failed to fetch redeemable amount:", error);
        redeemableAmount = "0";
      }
      setContractInfo({
        balance: formatNumber(web3.utils.fromWei(info.contractBalance || "0", "ether")),
        issuancePeriod: info.remainingIssuancePeriod ? formatDate(Number(info.remainingIssuancePeriod)) : "Ended",
      });
      setShareBalance(formatNumber(web3.utils.fromWei(balance || "0", "ether")));
      setTotalSupply(formatNumber(web3.utils.fromWei(supply || "0", "ether")));
      setRedeemable(formatNumber(web3.utils.fromWei(redeemableAmount, "ether")));
      console.log("Contract data set:", { contractBalance: info.contractBalance, balance, supply, redeemableAmount });
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
      let errorMessage = `Failed to fetch data: ${error.message}`;
      if (error.message.includes("call revert") || error.message.includes("invalid opcode")) {
        errorMessage = "Failed to fetch data: Contract method not found or ABI mismatch";
      }
      setNetworkError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && account) {
      fetchContractData();
      const interval = setInterval(fetchContractData, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, web3, account, network]);

  const handleNetworkSwitch = async (selectedNetwork) => {
    setLoading(true);
    setNetworkError("");
    await initializeWeb3(selectedNetwork);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 max-w-2xl w-full card">
        <h1 className="text-2xl font-bold mb-4 text-purple-600">{shareName} Strategy</h1>
        <ConnectWallet account={account} web3={web3} network={network} />
        <div className="mb-4">
          <button
            onClick={() => handleNetworkSwitch("ethereum")}
            disabled={loading || network === "ethereum"}
            className="btn-primary mr-2"
          >
            {loading && network === "ethereum" ? "Switching..." : "Switch to Ethereum"}
          </button>
          <button
            onClick={() => handleNetworkSwitch("pulsechain")}
            disabled={loading || network === "pulsechain"}
            className="btn-primary"
          >
            {loading && network === "pulsechain" ? "Switching..." : "Switch to PulseChain"}
          </button>
        </div>
        {networkError && <p className="text-red-400 mb-4">{networkError}</p>}
        {account && contractInfo ? (
          <>
            <ContractInfo contract={contract} web3={web3} network={network} />
            <div className="mb-4">
              <p>Account: {account.slice(0, 6)}...{account.slice(-4)}</p>
              <p>Contract Balance: {contractInfo.balance} {tokenName}</p>
              <p>Issuance Period: {contractInfo.issuancePeriod}</p>
              <p>Your {shareName} Balance: {shareBalance}</p>
              <p>Total {shareName} Supply: {totalSupply}</p>
              <p>Redeemable {tokenName}: {redeemable}</p>
            </div>
            <IssuePLSTR web3={web3} contract={contract} account={account} network={network} />
            <UserInfo contract={contract} account={account} web3={web3} network={network} />
            {network === "pulsechain" && <WithdrawLiquidity web3={web3} contract={contract} account={account} network={network} />}
            <RedeemPLSTR contract={contract} account={account} web3={web3} network={network} />
            {isController && network === "ethereum" && (
              <AdminPanel web3={web3} contract={contract} account={account} network={network} />
            )}
          </>
        ) : (
          <p>Loading contract data...</p>
        )}
      </div>
    </div>
  );
}

export default App;
