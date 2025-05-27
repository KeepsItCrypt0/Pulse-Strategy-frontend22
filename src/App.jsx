import { useState, useEffect } from "react";
import { getWeb3, getContract, switchNetwork, networks, formatNumber, formatDate } from "./web3";
import AdminPanel from "./components/AdminPanel";
import "./App.css";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isController, setIsController] = useState(false);
  const [contractInfo, setContractInfo] = useState(null);
  const [shareBalance, setShareBalance] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
  const [redeemable, setRedeemable] = useState("0");
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [sharesReceived, setSharesReceived] = useState("0");
  const [fee, setFee] = useState("0");
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const { tokenName, shareName } = network ? networks[network] : { tokenName: "", shareName: "" };

  const initializeWeb3 = async (selectedNetwork) => {
    try {
      setNetworkError("");
      const web3Instance = await getWeb3();
      if (!web3Instance) {
        setNetworkError("No web3 provider detected");
        return;
      }
      setWeb3(web3Instance);
      const networkId = await web3Instance.eth.net.getId();
      console.log("Current network ID:", networkId, "Expected:", selectedNetwork === "ethereum" ? 1 : 369);
      const expectedNetworkId = selectedNetwork === "ethereum" ? 1 : 369;
      if (Number(networkId) !== expectedNetworkId) {
        console.log(`Attempting to switch to ${selectedNetwork} (chainId: ${networks[selectedNetwork].chainId})`);
        await switchNetwork(selectedNetwork);
      }
      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);
      const contractInstance = await getContract(web3Instance);
      if (!contractInstance) {
        setNetworkError("Failed to initialize contract: Contract not found");
        return;
      }
      setContract(contractInstance);
      if (selectedNetwork === "ethereum") {
        const owner = await contractInstance.methods.owner().call();
        setIsController(accounts[0]?.toLowerCase() === owner.toLowerCase());
      } else {
        setIsController(false);
      }
      setNetwork(selectedNetwork);
      console.log("App initialized:", { account: accounts[0], network: selectedNetwork, networkId });
    } catch (error) {
      console.error("Web3 initialization failed:", error);
      setNetworkError(`Failed to initialize: ${error.message}`);
    }
  };

  const fetchContractData = async () => {
    if (!contract || !web3 || !account) return;
    try {
      const info = await contract.methods.getContractInfo().call();
      const balance = await contract.methods.balanceOf(account).call();
      const supply = await contract.methods.totalSupply().call();
      let redeemableAmount = "0";
      if (network === "ethereum") {
        redeemableAmount = await contract.methods.getRedeemableStakedPLS(account, balance).call();
      } else {
        redeemableAmount = await contract.methods.getRedeemablePLSX(balance).call();
      }
      setContractInfo({
        balance: formatNumber(web3.utils.fromWei(info.contractBalance, "ether")),
        issuancePeriod: info.remainingIssuancePeriod
          ? formatDate(Number(info.remainingIssuancePeriod))
          : "Ended",
      });
      setShareBalance(formatNumber(web3.utils.fromWei(balance, "ether")));
      setTotalSupply(formatNumber(web3.utils.fromWei(supply, "ether")));
      setRedeemable(formatNumber(web3.utils.fromWei(redeemableAmount, "ether")));
      console.log("Contract data fetched:", { balance, supply, redeemableAmount });
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
      setNetworkError(`Failed to fetch data: ${error.message}`);
    }
  };

  useEffect(() => {
    if (contract && web3 && account) {
      fetchContractData();
      const interval = setInterval(fetchContractData, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, web3, account]);

  const handleNetworkSwitch = async (selectedNetwork) => {
    setLoading(true);
    await initializeWeb3(selectedNetwork);
    setLoading(false);
  };

  const handleNumericInputChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^-?\d*\.?\d*$/.test(rawValue)) {
      setAmount(rawValue);
      setDisplayAmount(
        rawValue === "" || isNaN(rawValue)
          ? ""
          : new Intl.NumberFormat("en-US", {
              maximumFractionDigits: 18,
              minimumFractionDigits: 0,
            }).format(rawValue)
      );
      if (contract && rawValue !== "" && !isNaN(rawValue)) {
        contract.methods
          .calculateSharesReceived(web3.utils.toWei(rawValue, "ether"))
          .call()
          .then((result) => {
            setSharesReceived(formatNumber(web3.utils.fromWei(result.shares, "ether")));
            setFee(formatNumber(web3.utils.fromWei(result.totalFee || result.fee, "ether")));
          })
          .catch((error) => {
            console.error("Calculate shares error:", error);
            setSharesReceived("0");
            setFee("0");
          });
      } else {
        setSharesReceived("0");
        setFee("0");
      }
    }
  };

  const handleBuyShares = async () => {
    setLoading(true);
    setNetworkError("");
    try {
      const amountWei = web3.utils.toWei(amount, "ether");
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert(`${shareName} shares purchased successfully!`);
      setAmount("");
      setDisplayAmount("");
      setSharesReceived("0");
      setFee("0");
      await fetchContractData();
      console.log("Shares purchased:", { amountWei });
    } catch (error) {
      console.error("Buy shares error:", error);
      setNetworkError(`Error purchasing shares: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemShares = async () => {
    setLoading(true);
    setNetworkError("");
    try {
      const amountWei = web3.utils.toWei(amount, "ether");
      await contract.methods.redeemShares(amountWei).send({ from: account });
      alert(`${shareName} shares redeemed successfully!`);
      setAmount("");
      setDisplayAmount("");
      await fetchContractData();
      console.log("Shares redeemed:", { amountWei });
    } catch (error) {
      console.error("Redeem shares error:", error);
      setNetworkError(`Error redeeming shares: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 max-w-2xl w-full card">
        <h1 className="text-2xl font-bold mb-4 text-purple-600">{shareName} Strategy</h1>
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
        {account && contractInfo && (
          <>
            <div className="mb-4">
              <p>Account: {account.slice(0, 6)}...{account.slice(-4)}</p>
              <p>Contract Balance: {contractInfo.balance} {tokenName}</p>
              <p>Issuance Period: {contractInfo.issuancePeriod}</p>
              <p>Your {shareName} Balance: {shareBalance}</p>
              <p>Total {shareName} Supply: {totalSupply}</p>
              <p>Redeemable {tokenName}: {redeemable}</p>
            </div>
            <div className="mb-4">
              <input
                type="text"
                value={displayAmount}
                onChange={handleNumericInputChange}
                placeholder="Amount"
                className="w-full p-2 border rounded-lg mb-2"
              />
              <p>Shares Received: {sharesReceived}</p>
              <p>Fee: {fee} {tokenName}</p>
              <button
                onClick={handleBuyShares}
                disabled={loading || !amount || amount === "0"}
                className="btn-primary mr-2"
              >
                {loading ? "Processing..." : `Buy ${shareName} Shares`}
              </button>
              <button
                onClick={handleRedeemShares}
                disabled={loading || !amount || amount === "0"}
                className="btn-primary"
              >
                {loading ? "Processing..." : `Redeem ${shareName} Shares`}
              </button>
            </div>
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
