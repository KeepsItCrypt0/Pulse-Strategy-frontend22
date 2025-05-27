import { useState, useEffect } from "react";
import { formatNumber, networks } from "../web3";

const RedeemPLSTR = ({ contract, account, web3, network }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [shareBalance, setShareBalance] = useState("0");
  const [estimatedTokens, setEstimatedTokens] = useState("0");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // For initial data fetch
  const [error, setError] = useState("");
  const { tokenName, shareName } = networks[network] || { tokenName: "Token", shareName: "Share" }; // Fallback values

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      setError("");
      if (!contract || !web3 || !account) {
        throw new Error("Contract, Web3, or account not initialized");
      }

      const balance = await contract.methods.balanceOf(account).call();
      if (balance === undefined || balance === null) {
        throw new Error(`Invalid ${shareName} balance response`);
      }
      setShareBalance(formatNumber(web3.utils.fromWei(balance, "ether")));
      console.log(`${shareName} balance fetched:`, { balance });

      if (amount && Number(amount) > 0) {
        const amountWei = web3.utils.toWei(amount, "ether");
        const redeemMethod = network === "ethereum" ? "getRedeemableStakedPLS" : "getRedeemablePLSX";
        if (!contract.methods[redeemMethod]) {
          throw new Error(`Method ${redeemMethod} not found in contract ABI`);
        }
        const redeemable = await contract.methods[redeemMethod](amountWei).call();
        if (redeemable === undefined || redeemable === null) {
          throw new Error(`Invalid redeemable ${tokenName} response`);
        }
        setEstimatedTokens(formatNumber(web3.utils.fromWei(redeemable, "ether")));
        console.log(`Estimated ${tokenName} fetched:`, { amount, redeemable });
      } else {
        setEstimatedTokens("0");
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
    if (contract && web3 && account && network) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [contract, web3, account, network, amount]); // Added amount to dependencies

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

  const handleRedeem = async () => {
    setLoading(true);
    setError("");
    try {
      const amountNum = Number(amount);
      if (amountNum <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      const amountWei = web3.utils.toWei(amount, "ether");
      await contract.methods.redeemShares(amountWei).send({ from: account });
      alert(`${shareName} redeemed successfully!`);
      setAmount("");
      setDisplayAmount("");
      await fetchData(); // Refresh data after redemption
      console.log(`${shareName} redeemed:`, { amountWei });
    } catch (err) {
      let errorMessage = `Error redeeming ${shareName}: ${err.message || "Unknown error"}`;
      if (err.message.includes("InsufficientBalance")) {
        errorMessage = `Insufficient ${shareName} balance`;
      } else if (err.message.includes("ZeroSupply")) {
        errorMessage = `No ${shareName} shares exist`;
      } else if (err.message.includes("InsufficientContractBalance")) {
        errorMessage = `Contract has insufficient ${tokenName} balance`;
      }
      setError(errorMessage);
      console.error(`Redeem ${shareName} error:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Redeem {shareName}</h2>
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
        <>
          <p className="text-gray-600 mb-2">
            Your {shareName} Balance: {formatNumber(shareBalance)} {shareName}
          </p>
          <p className="text-gray-600 mb-2">
            Estimated {tokenName} Receivable: {formatNumber(estimatedTokens)} {tokenName}
          </p>
          <input
            type="text"
            value={displayAmount}
            onChange={handleAmountChange}
            placeholder={`Enter ${shareName} amount`}
            className="w-full p-2 border rounded-lg mb-4"
          />
          <button
            onClick={handleRedeem}
            disabled={loading || initialLoading || !amount || Number(amount) <= 0 || Number(amount) > Number(shareBalance)}
            className="btn-primary"
          >
            {loading ? "Processing..." : `Redeem ${shareName}`}
          </button>
        </>
      )}
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
};

export default RedeemPLSTR;
