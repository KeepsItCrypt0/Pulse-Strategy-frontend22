import { useState, useEffect } from "react";
import { formatNumber, formatDate } from "../utils/format";

const ContractInfo = ({ contract, web3 }) => {
  const [info, setInfo] = useState({ balance: "0", issuancePeriod: "0", totalIssued: "0" });
  const [backingRatio, setBackingRatio] = useState("1 to 1");
  const [lastMint, setLastMint] = useState({ date: null, amount: null });
  const [lastDeposit, setLastDeposit] = useState({ date: null, amount: null });
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInfo = async () => {
    try {
      setLoading(true);
      setError("");
      if (!contract || !web3) throw new Error("Contract or Web3 not initialized");

      // Fetch contract info
      const result = await contract.methods.getContractInfo().call();
      if (!result || !result.contractBalance || !result.remainingIssuancePeriod) {
        throw new Error("Invalid contract info response");
      }
      const ratio = await contract.methods.getVPLSBackingRatio().call();
      const totalIssued = await contract.methods.totalSupply().call();
      const ratioDecimal = web3.utils.fromWei(ratio || "0", "ether");

      setInfo({
        balance: web3.utils.fromWei(result.contractBalance || "0", "ether"),
        issuancePeriod: result.remainingIssuancePeriod || "0",
        totalIssued: web3.utils.fromWei(totalIssued || "0", "ether"),
      });
      setBackingRatio(formatNumber(ratioDecimal, true));

      // Get the latest block number and calculate fromBlock (max 9,999 blocks)
      const latestBlock = await web3.eth.getBlockNumber();
      // Convert latestBlock to BigInt if it isn't already, and calculate fromBlock
      const latestBlockBigInt = BigInt(latestBlock);
      const fromBlockBigInt = latestBlockBigInt - BigInt(9999);
      // Ensure fromBlock is at least 0 and convert back to number for Web3.js
      const fromBlock = Number(fromBlockBigInt < 0n ? 0n : fromBlockBigInt);

      // Fetch SharesMinted and StakedPLSDeposited events
      const mintEvents = await contract.getPastEvents("SharesMinted", {
        fromBlock,
        toBlock: "latest",
      });
      const depositEvents = await contract.getPastEvents("StakedPLSDeposited", {
        fromBlock,
        toBlock: "latest",
      });

      // Get the most recent SharesMinted event
      if (mintEvents.length > 0) {
        const latestMint = mintEvents[mintEvents.length - 1];
        setLastMint({
          date: latestMint.returnValues.timestamp,
          amount: web3.utils.fromWei(latestMint.returnValues.amount || "0", "ether"),
        });
      } else {
        setLastMint({ date: null, amount: null });
      }

      // Get the most recent StakedPLSDeposited event
      if (depositEvents.length > 0) {
        const latestDeposit = depositEvents[depositEvents.length - 1];
        setLastDeposit({
          date: latestDeposit.returnValues.timestamp,
          amount: web3.utils.fromWei(latestDeposit.returnValues.amount || "0", "ether"),
        });
      } else {
        setLastDeposit({ date: null, amount: null });
      }

      console.log("Contract info fetched:", {
        balance: result.contractBalance,
        period: result.remainingIssuancePeriod,
        totalIssued,
        ratioRaw: ratio,
        ratioDecimal,
        lastMint,
        lastDeposit,
        fromBlock,
        latestBlock,
      });
    } catch (error) {
      console.error("Failed to fetch contract info:", error);
      setError(`Failed to load contract data: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3) fetchInfo();
  }, [contract, web3]);

  useEffect(() => {
    const updateCountdown = () => {
      const seconds = Number(info.issuancePeriod);
      if (seconds <= 0) {
        setCountdown("Issuance period ended");
        return;
      }
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      setCountdown(`${days}d ${hours}h ${minutes}m ${secs}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [info.issuancePeriod]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Contract Information</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setTimeout(fetchInfo, 2000)}
            className="mt-2 text-purple-300 hover:text-purple-400"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <p>
            <strong>Contract Balance:</strong> {formatNumber(info.balance)} vPLS
          </p>
          <p>
            <strong>Total PLSTR Issued:</strong> {formatNumber(info.totalIssued)} PLSTR
          </p>
          <p>
            <strong>Issuance Period Countdown:</strong> {countdown}
          </p>
          <p>
            <strong>VPLS Backing Ratio:</strong> {backingRatio}
          </p>
          <p>
            <strong>StrategyController recent Mint Date:</strong>{" "}
            {lastMint.date ? formatDate(lastMint.date) : "N/A"}
          </p>
          <p>
            <strong>StrategyController recent Mint Amount:</strong>{" "}
            {lastMint.amount ? `${formatNumber(lastMint.amount)} PLSTR` : "N/A"}
          </p>
          <p>
            <strong>StrategyController recent Deposit Date:</strong>{" "}
            {lastDeposit.date ? formatDate(lastDeposit.date) : "N/A"}
          </p>
          <p>
            <strong>StrategyController recent Deposit Amount:</strong>{" "}
            {lastDeposit.amount ? `${formatNumber(lastDeposit.amount)} vPLS` : "N/A"}
          </p>
        </>
      )}
    </div>
  );
};

export default ContractInfo;
