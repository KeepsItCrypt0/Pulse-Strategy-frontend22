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
    issuancePeriod: "Not loaded",
  });
  const [shareBalance, setShareBalance] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
  const [redeemable, setRedeemable] = useState("0");
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const { tokenName, shareName } = network ? networks[network] : { tokenName: "", shareName: "" };

  const initializeWeb3 = async (selectedNetwork, retryCount = 0) => {
    const maxRetries = 3;
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
      if (Number(networkId) !== expectedNetworkId) {
        await switchNetwork(selectedNetwork);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newNetworkId = await web3Instance.eth.net.getId();
        if (Number(newNetworkId) !== expectedNetworkId && retryCount < maxRetries) {
          return initializeWeb3(selectedNetwork, retryCount + 1);
        } else if (Number(newNetworkId) !== expectedNetworkId) {
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
    } catch (error) {
      console.error("Web3 initialization failed:", error);
      let errorMessage = `Failed to initialize ${selectedNetwork}: ${error.message}`;
      if (error.message.includes("call revert") || error.message.includes("invalid opcode")) {
        errorMessage = `Failed to initialize ${selectedNetwork}: Contract method not found or ABI mismatch`;
      } else if (error.message.includes("Failed to switch")) {
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

  const fetchContractData = async () => {
    if (!contract || !web3 || !account) {
      console.log("fetchContractData: Missing dependencies", { contract, web3, account });
      return;
    }
    try {
      setDataLoading(true);
      const info = await contract.methods.getContractInfo().call();
      const balance = await contract.methods.balanceOf(account).call();
      const supply = await contract.methods.totalSupply().call();
      let redeemableAmount = "0";
      try {
        if (network === "ethereum") {
          redeemableAmount = await contract.methods.getRedeemableStakedPLS(account, balance).call();
        } else {
          redeemableAmount = await contract.methods.getRedeemablePLSX(balance).call();
        }
      } catch (error) {
        console.error("Failed to fetch redeemable amount:", error);
        redeemableAmount = "0";
      }
      setContractInfo({
        balance: formatNumber(web3.utils.fromWei(info.contractBalance || "0", "ether")),
        issuancePeriod: info.remainingIssuancePeriod
          ? formatDate(Number(info.remainingIssuancePeriod))
          : "Not set",
      });
      setShareBalance(formatNumber(web3.utils.fromWei(balance || "0", "ether")));
      setTotalSupply(formatNumber(web3.utils.fromWei(supply || "0", "ether")));
      setRedeemable(formatNumber(web3.utils.fromWei(redeemableAmount, "ether")));
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
      let errorMessage = `Failed to fetch data: ${error.message}`;
      if (error.message.includes("call revert") || error.message.includes("invalid opcode")) {
        errorMessage = "Failed to fetch data: Contract method not found or ABI mismatch";
      }
      setNetworkError(errorMessage);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && account) {
      fetchContractData();
      const interval = setInterval(fetchContractData, 30000);
      return () => clearInterval(interval);
    } else if (network) {
      fetchContractData(); // Attempt to fetch if network is set but other deps are missing
    }
  }, [contract, web3, account, network]);

  useEffect(() => {
    const handleNetworkChange = (chainId) => {
      const chainIdNum = Number(chainId);
      if (network && networks[network].chainId !== chainIdNum) {
        setNetworkError(`Network changed to unexpected chain (${chainIdNum}). Please switch to ${network}.`);
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

  const handleNetworkSwitch = async (selectedNetwork) => {
    setLoading(true);
    setNetworkError("");
    await initializeWeb3(selectedNetwork);
    if (web3 && contract && account) {
      fetchContractData();
    }
  };

  const handleRetry = () => {
    if (network) {
      initializeWeb3(network);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 max-w-2xl w-full card">
        <h1 className="text-2xl font-bold mb-4 text-purple-600">{shareName} Strategy</h1>
        <ConnectWallet account={account} web3={web3} network={network} onConnect={initializeWeb3} />
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
        {networkError && (
          <div className="mb-4">
            <p className="text-red-400">{networkError}</p>
            <button onClick={handleRetry} className="mt-2 text-purple-300 hover:text-purple-400">
              Retry
            </button>
          </div>
        )}
        {(loading || dataLoading) && !networkError && <p className="text-gray-600 mb-4">Loading...</p>}
        {account && contract && network && !networkError && (
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
        )}
      </div>
    </div>
  );
}

export default App;
