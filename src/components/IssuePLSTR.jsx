import { useState, useEffect } from "react";
import { getTokenContract, formatNumber, networks } from "../web3";

const IssuePLSTR = ({ web3, contract, account, network }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [estimatedShares, setEstimatedShares] = useState("0");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { tokenName, contractName, shareName } = networks[network];
  const MIN_ISSUE_AMOUNT = network === "ethereum" ? 1000 : 10;
  const MIN_INITIAL_LIQUIDITY = network === "pulsechain" ? 10 : 0;

  const fetchBalance = async () => {
    try {
      setError("");
      const tokenContract = await getTokenContract(web3, network);
      const balance = await tokenContract.methods.balanceOf(account).call();
      if (balance === undefined || balance === null) {
        throw new Error(`Invalid ${tokenName} balance response`);
      }
      setTokenBalance(web3.utils.fromWei(balance, "ether"));
      console.log(`${tokenName} balance fetched:`, { balance });
    } catch (err) {
      console.error(`Failed to fetch ${tokenName} balance:`, err);
      setError(`Failed to load ${tokenName} balance: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (web3 && account) fetchBalance();
  }, [web3, account, network]);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        if (amount && Number(amount) > 0) {
          const amountWei = web3.utils.toWei(amount, "ether");
          const result = await contract.methods.calculateSharesReceived(amountWei).call();
          if (!result || !result.shares || !result.totalFee) {
            throw new Error("Invalid shares calculation response");
          }
          setEstimatedShares(web3.utils.fromWei(result.shares, "ether"));
          setEstimatedFee(web3.utils.fromWei(result.totalFee, "ether"));
          console.log(`Estimated ${shareName} fetched:`, { amount, shares: result.shares, fee: result.totalFee });
        } else {
          setEstimatedShares("0");
          setEstimatedFee("0");
        }
      } catch (err) {
        console.error(`Failed to fetch estimated ${shareName}:`, err);
        setError(`Failed to estimate shares: ${err.message || "Unknown error"}`);
      }
    };
    if (contract && web3) fetchEstimate();
  }, [contract, web3, amount, network]);

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^-?\d*\.?\d*$/.test(rawValue)) {
      setAmount(rawValue);
      if (rawValue === "" || isNaN(rawValue)) {
        setDisplayAmount("");
      } else {
        setDisplayAmount(
          new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 18,
            minimumFractionDigits: 0,
          }).format(rawValue)
        );
      }
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
      const tokenContract = await getTokenContract(web3, network);
      const amountWei = web3.utils.toWei(amount, "ether");
      await tokenContract.methods
        .approve(contract._address, amountWei)
        .send({ from: account });
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert(`${shareName} issued successfully!`);
      setAmount("");
      setDisplayAmount("");
      fetchBalance();
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
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Issue {shareName}</h2>
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
      <button
        onClick={handleIssue}
        disabled={loading || !amount || Number(amount) < MIN_ISSUE_AMOUNT}
        className="btn-primary"
      >
        {loading ? "Processing..." : `Issue ${shareName}`}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default IssuePLSTR;
