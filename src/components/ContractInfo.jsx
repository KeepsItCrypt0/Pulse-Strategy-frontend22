import { useState, useEffect } from "react";
import { formatNumber, formatDate, networks } from "../web3";

const ContractInfo = ({ contract, web3, network }) => {
  const [info, setInfo] = useState({ balance: "0", issuancePeriod: "Not loaded", totalIssued: "0" });
  const [backingRatio, setBackingRatio] = useState("1 to 1");
  const [countdown, setCountdown] = useState("");
  const [poolInfo, setPoolInfo] = useState({ poolAddress: "0x0", xBONDAmount: "0", plsxAmount: "0" });
  const [poolDepthRatio, setPoolDepthRatio] = useState("0");
  const [heldLPTokens, setHeldLPTokens] = useState("0");
  const [timeUntilWithdrawal, setTimeUntilWithdrawal] = useState("0");
  const [totalBurned, setTotalBurned] = useState("0");
  const [totalPLSXTaxed, setTotalPLSXTaxed] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { tokenName, contractName, shareName, blockExplorerUrls } =
    networks[network] || { tokenName: "Token", contractName: "Contract", shareName: "Share", blockExplorerUrls: [""] };

  const fetchInfo = async (retryCount = 0) => {
    const maxRetries = 3;
    try {
      setLoading(true);
      setError("");
      if (!contract || !web3) throw new Error("Contract or Web3 not initialized");

      const result = await contract.methods.getContractInfo().call();
      if (!result || !result.contractBalance || result.remainingIssuancePeriod === undefined) {
        throw new Error("Invalid contract info response from getContractInfo");
      }

      const ratioMethod = network === "ethereum" ? "getVPLSBackingRatio" : "getPLSXBackingRatio";
      if (!contract.methods[ratioMethod]) {
        throw new Error(`Method ${ratioMethod} not found in contract ABI`);
      }
      const ratio = await contract.methods[ratioMethod]().call();
      const totalIssued = await contract.methods.totalSupply().call();

      setInfo({
        balance: formatNumber(web3.utils.fromWei(result.contractBalance || "0", "ether")),
        issuancePeriod: result.remainingIssuancePeriod === "0" ? "Ended" : result.remainingIssuancePeriod,
        totalIssued: formatNumber(web3.utils.fromWei(totalIssued || "0", "ether")),
      });
      setBackingRatio(formatNumber(web3.utils.fromWei(ratio || "0", "ether"), true));

      if (network === "pulsechain") {
        const poolMethods = [
          "getPoolAddress",
          "getPoolLiquidity",
          "getPoolDepthRatio",
          "getHeldLPTokens",
          "getTimeUntilNextWithdrawal",
          "getTotalBurned",
          "getTotalPLSXTaxed",
        ];
        for (const method of poolMethods) {
          if (!contract.methods[method]) {
            console.warn(`Method ${method} not found in contract ABI, using defaults`);
            setPoolInfo({ poolAddress: "0x0", xBONDAmount: "0", plsxAmount: "0" });
            setPoolDepthRatio("0");
            setHeldLPTokens("0");
            setTimeUntilWithdrawal("0");
            setTotalBurned("0");
            setTotalPLSXTaxed("0");
            return;
          }
        }

        const poolAddress = await contract.methods.getPoolAddress().call();
        const poolLiquidity = await contract.methods.getPoolLiquidity().call();
        const depthRatio = await contract.methods.getPoolDepthRatio().call();
        const lpTokens = await contract.methods.getHeldLPTokens().call();
        const withdrawalTime = await contract.methods.getTimeUntilNextWithdrawal().call();
        const burned = await contract.methods.getTotalBurned().call();
        const taxed = await contract.methods.getTotalPLSXTaxed().call();

        setPoolInfo({
          poolAddress: poolAddress || "0x0",
          xBONDAmount: formatNumber(web3.utils.fromWei(poolLiquidity.xBONDAmount || "0", "ether")),
          plsxAmount: formatNumber(web3.utils.fromWei(poolLiquidity.plsxAmount || "0", "ether")),
        });
        setPoolDepthRatio(formatNumber(web3.utils.fromWei(depthRatio || "0", "ether")));
        setHeldLPTokens(formatNumber(web3.utils.fromWei(lpTokens || "0", "ether")));
        setTimeUntilWithdrawal(withdrawalTime || "0");
        setTotalBurned(formatNumber(web3.utils.fromWei(burned || "0", "ether")));
        setTotalPLSXTaxed(formatNumber(web3.utils.fromWei(taxed || "0", "ether")));
      }
    } catch (error) {
      console.error("Failed to fetch contract info:", error);
      if (retryCount < maxRetries) {
        setError(`Retrying... (Attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return fetchInfo(retryCount + 1);
      }
      setError(
        `Failed to load contract data: ${
          error.message.includes("call revert") || error.message.includes("invalid opcode")
            ? `Method ${error.message.split(" ")[0]} not found or ABI mismatch`
            : error.message || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && network) {
      fetchInfo();
      const interval = setInterval(fetchInfo, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, web3, network]);

  useEffect(() => {
    const updateCountdown = () => {
      const seconds = Number(info.issuancePeriod);
      if (isNaN(seconds) || seconds <= 0) {
        setCountdown(info.issuancePeriod === "Ended" ? "Ended" : "Not set");
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
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Contract Information</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button onClick={fetchInfo} className="mt-2 text-purple-300 hover:text-purple-400">
            Retry
          </button>
        </div>
      ) : (
        <>
          <p>
            <strong>Contract Balance:</strong> {formatNumber(info.balance)} {tokenName}
          </p>
          <p>
            <strong>Total {shareName} Issued:</strong> {formatNumber(info.totalIssued)} {shareName}
          </p>
          <p>
            <strong>Issuance Period Countdown:</strong> {countdown}
          </p>
          <p>
            <strong>{tokenName} Backing Ratio:</strong> {backingRatio}
          </p>
          {network === "pulsechain" && poolInfo.poolAddress !== "0x0" && (
            <>
              <p>
                <strong>Liquidity Pool Address:</strong>{" "}
                <a
                  href={`${blockExplorerUrls[0]}/address/${poolInfo.poolAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-300 hover:text-red-300"
                >
                  {poolInfo.poolAddress.slice(0, 6)}...{poolInfo.poolAddress.slice(-4)}
                </a>
              </p>
              <p>
                <strong>Pool {shareName} Balance:</strong> {formatNumber(poolInfo.xBONDAmount)} {shareName}
              </p>
              <p>
                <strong>Pool {tokenName} Balance:</strong> {formatNumber(poolInfo.plsxAmount)} {tokenName}
              </p>
              <p>
                <strong>Pool Depth Ratio (PLSX per LP):</strong> {formatNumber(poolDepthRatio)} {tokenName}
              </p>
              <p>
                <strong>Held LP Tokens:</strong> {formatNumber(heldLPTokens)} LP
              </p>
              <p>
                <strong>Time Until Next Withdrawal:</strong>{" "}
                {timeUntilWithdrawal === "0" ? "Ready" : formatDate(Number(timeUntilWithdrawal) * 1000)}
              </p>
              <p>
                <strong>Total {shareName} Burned:</strong> {formatNumber(totalBurned)} {shareName}
              </p>
              <p>
                <strong>Total {tokenName} Taxed:</strong> {formatNumber(totalPLSXTaxed)} {tokenName}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ContractInfo;
