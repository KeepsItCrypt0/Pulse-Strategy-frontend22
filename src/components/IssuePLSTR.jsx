import { useState, useEffect } from "react";
import { getTokenContract, formatNumber, networks } from "../web3";

const IssuePLSTR = ({ web3, contract, account, network }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [estimatedShares, setEstimatedShares] = useState("0");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // For initial data fetch
  const [error, setError] = useState("");
  const { tokenName, contractName, shareName } = networks[network] || { tokenName: "Token", contractName: "Contract", shareName: "Share" }; // Fallback values
  const MIN_ISSUE_AMOUNT = network === "ethereum" ? 1000 : 10;
  const MIN_INITIAL_LIQUIDITY = network === "pulsechain" ? 10 : 0;

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      setError("");
      if (!web3 || !account) {
        throw new Error("Web3 or account not initialized");
      }
      const tokenContract = await getTokenContract(web3, network);
      const balance = await tokenContract.methods.balanceOf(account).call();
      if (balance === undefined || balance === null) {
        throw new Error(`Invalid ${tokenName} balance response`);
      }
      setTokenBalance(formatNumber(web3.utils.fromWei(balance, "ether")));
      console.log(`${tokenName} balance fetched:`, { balance });

      if (contract && amount && Number(amount) > 0) {
        const amountWei = web3.utils.toWei(amount, "ether");
        if (!contract.methods.calculateSharesReceived) {
          throw new Error("Method calculateSharesReceived not found in contract ABI");
        }
        const result = await contract.methods.calculateSharesReceived(amountWei).call();
        if (!result || !result.shares || !result.totalFee) {
          throw new Error("Invalid shares calculation response");
        }
        setEstimatedShares(formatNumber(web3.utils.fromWei(result.shares, "ether")));
        setEstimatedFee(formatNumber(web3.utils.fromWei(result.totalFee, "ether")));
        console.log(`Estimated ${shareName} fetched:`, { amount, shares: result.shares, fee: result.totalFee });
      } else {
        setEstimatedShares("0");
        setEstimatedFee("0");
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(
        `Failed to load data: ${
          err.message.includes("call revert") || err.message.includes("invalid opcode")
            ? "Method not found or ABI mismatch"
            : err.message || "Unknown error"
        }`
      );
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (web3 && account && network) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [web3, account, network, amount, contract]); // Added amount and contract to dependencies

  const handleAmountChange = (e) => {
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
    }
  };

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const amountNum = Number(amount);
      if (amountNum < MIN_ISSUE_AMOUNT) {
        throw new Error(`Amount must be at least ${MIN_ISSUE_AMOUNT} ${tokenName}`);
      }
      if (network === "pulsechain" && amountNum < MIN_INITIAL_LIQUIDITY) {
        throw new Error(`Initial deposit must be at least ${MIN_INITIAL_LIQUIDITY} ${tokenName}`);
      }
      if (!contract || !web3) throw new Error("Contract or Web3 not initialized");
      const tokenContract = await getTokenContract(web3, network);
      const amountWei = web3.utils.toWei(amount, "ether");
      const contractAddress = contract.options.address; // Use contract.options.address for reliability
      await tokenContract.methods
        .approve(contractAddress, amountWei)
        .send({ from: account });
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert(`${shareName} issued successfully!`);
      setAmount("");
      setDisplayAmount("");
      await fetchData(); // Refresh data after issuance
      console.log(`${shareName} issued:`, { amountWei });
    } catch (err) {
      let errorMessage = `Error issuing ${shareName}: ${err.message || "Unknown error"}`;
      if (err.message.includes("IssuancePeriodEnded")) {
        errorMessage = `Issuance period has ended (ended after 120 days)`;
      } else if (err.message.includes("InsufficientInitialLiquidity")) {
        errorMessage = `Initial deposit must be at least ${MIN_INITIAL_LIQUIDITY} ${tokenName}`;
      } else if (err.message.includes("BelowMinimumShareAmount")) {
        errorMessage = `Shares received must be at least ${MIN_ISSUE_AMOUNT} ${shareName}`;
      } else if (err.message.includes("InsufficientAllowance")) {
        errorMessage = `Insufficient ${tokenName} allowance for contract`;
      } else if (err.message.includes("InsufficientFee")) {
        errorMessage = `Fee amount is too low`;
      }
      setError(errorMessage);
      console.error(`Issue ${shareName} error:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Issue {shareName}</h2>
      {initialLoading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button onClick={fetchData} className="mt-2 text-purple-300 hover:text-purple-400">
            Retry
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Estimated Fee: <span className="text-purple-600">{formatNumber(estimatedFee)} {tokenName}</span>
          </p>
          <p className="text-gray-600 mb-2">
            Estimated {shareName} Receivable:{" "}
            <span className="text-purple-600">{formatNumber(estimatedShares)} {shareName}</span>
          </p>
          <input
            type="text"
            value={displayAmount}
            onChange={handleAmountChange}
            placeholder={`Enter ${tokenName} amount`}
            className="w-full p-2 border rounded-lg"
          />
          <p className="text-sm text-gray-600 mt-1">
            Minimum: <span className="text-purple-600 font-medium">{MIN_ISSUE_AMOUNT} {tokenName}</span>
            {network === "pulsechain" && (
              <span>
                {" (Initial deposit: "}
                <span className="text-purple-600 font-medium">{MIN_INITIAL_LIQUIDITY} {tokenName}</span>)
              </span>
            )}
          </p>
          <p className="text-gray-600 mt-1">
            User {tokenName} Balance: <span className="text-purple-600">{formatNumber(tokenBalance)} {tokenName}</span>
          </p>
        </div>
      )}
      <button
        onClick={handleIssue}
        disabled={loading || initialLoading || !amount || Number(amount) < MIN_ISSUE_AMOUNT || Number(amount) > Number(tokenBalance)}
        className="btn-primary"
      >
        {loading ? "Processing..." : `Issue ${shareName}`}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default IssuePLSTR;
