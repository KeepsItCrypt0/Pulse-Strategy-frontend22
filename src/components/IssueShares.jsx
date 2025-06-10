import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { tokenAddresses, plsABI, incABI, plsxABI, hexABI } from "../web3";

const IssueShares = ({ web3, contract, account, chainId, contractSymbol }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState(""); // Formatted for display
  const [selectedToken, setSelectedToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Updated state for PLSTR deposits, issuance count, and pending PLSTR
  const [depositsData, setDepositsData] = useState({
    totalDeposits: { plsx: "0", pls: "0", inc: "0", hex: "0" },
    issuanceEventCount: "0",
    pendingPLSTR: { hBOND: "0", pBOND: "0", iBOND: "0", xBOND: "0" },
  });
  const [depositsLoading, setDepositsLoading] = useState(true);

  // Null checks for props
  if (!web3 || !contract || !account || !chainId || !contractSymbol) {
    console.warn("IssueShares: Missing required props", { web3, contract, account, chainId, contractSymbol });
    return <div className="text-gray-600 p-6">Loading contract data...</div>;
  }

  const tokenConfig = {
    PLSTR: [
      { symbol: "PLSX", address: tokenAddresses[369].PLSX, decimals: 18, abi: plsxABI },
      { symbol: "PLS", address: tokenAddresses[369].PLS, decimals: 18, abi: plsABI },
      { symbol: "INC", address: tokenAddresses[369].INC, decimals: 18, abi: incABI },
      { symbol: "HEX", address: tokenAddresses[369].HEX, decimals: 8, abi: hexABI },
    ],
    pBOND: [{ symbol: "PLS", address: tokenAddresses[369].PLS, decimals: 18, abi: plsABI }],
    xBOND: [{ symbol: "PLSX", address: tokenAddresses[369].PLSX, decimals: 18, abi: plsxABI }],
    iBOND: [{ symbol: "INC", address: tokenAddresses[369].INC, decimals: 18, abi: incABI }],
    hBOND: [{ symbol: "HEX", address: tokenAddresses[369].HEX, decimals: 8, abi: hexABI }],
  };

  const isPLSTR = contractSymbol === "PLSTR";
  const tokens = tokenConfig[contractSymbol] || [];
  const defaultToken = tokens[0]?.symbol || "";

  // Token decimals for deposits
  const tokenDecimals = {
    PLS: 18,
    PLSX: 18,
    INC: 18,
    HEX: 8,
  };

  // Convert balance to human-readable units (from ContractInfo.jsx)
  const fromUnits = (balance, decimals) => {
    try {
      if (!balance || balance === "0") return "0";
      const balanceStr = typeof balance === "bigint" ? balance.toString() : balance.toString();
      if (decimals === 18) {
        return web3.utils.fromWei(balanceStr, "ether");
      }
      if (decimals === 8) {
        const balanceNum = Number(balanceStr) / 100000000;
        if (isNaN(balanceNum)) throw new Error("Invalid number after division");
        return balanceNum.toFixed(8).replace(/\.?0+$/, "");
      }
      return web3.utils.fromWei(balanceStr, "ether");
    } catch (err) {
      console.error("Error converting balance:", { balance, decimals, error: err.message });
      return "0";
    }
  };

  // Fetch deposits, issuance count, and pending PLSTR for PLSTR
  const fetchDepositsData = async () => {
    if (!contract || !web3 || chainId !== 369 || !isPLSTR) return;
    try {
      setDepositsLoading(true);
      const [deposits, eventCount, contractMetrics] = await Promise.all([
        contract.methods.getTotalDeposits().call(),
        contract.methods.getIssuanceEventCount().call(),
        contract.methods.getContractMetrics().call(),
      ]);

      console.log("PLSTR Deposits Data:", { deposits, eventCount, contractMetrics });

      const totalDeposits = {
        plsx: fromUnits(deposits.totalPlsx || "0", tokenDecimals.PLSX),
        pls: fromUnits(deposits.totalPls || "0", tokenDecimals.PLS),
        inc: fromUnits(deposits.totalInc || "0", tokenDecimals.INC),
        hex: fromUnits(deposits.totalHex || "0", tokenDecimals.HEX),
      };

      const pendingPLSTR = {
        hBOND: fromUnits(contractMetrics.pendingPLSTRhBOND || "0", 18),
        pBOND: fromUnits(contractMetrics.pendingPLSTRpBOND || "0", 18),
        iBOND: fromUnits(contractMetrics.pendingPLSTRiBOND || "0", 18),
        xBOND: fromUnits(contractMetrics.pendingPLSTRxBOND || "0", 18),
      };

      setDepositsData({
        totalDeposits,
        issuanceEventCount: eventCount.toString(),
        pendingPLSTR,
      });
    } catch (err) {
      console.error("Error fetching deposits data:", err);
      setError(`Failed to load PLSTR deposits data: ${err.message}`);
    } finally {
      setDepositsLoading(false);
    }
  };

  useEffect(() => {
    if (isPLSTR) {
      fetchDepositsData();
    }
    console.log("IssueShares: Setting selectedToken", { contractSymbol, isPLSTR, defaultToken });
    setSelectedToken(isPLSTR ? "" : defaultToken);
    return () => {
      console.log("IssueShares: Cleanup useEffect", { contractSymbol });
    };
  }, [contractSymbol, isPLSTR, defaultToken, contract, web3, chainId]);

  if (chainId !== 369) {
    console.log("IssueShares: Invalid chainId", { chainId });
    return <div className="text-gray-600 p-6">Please connect to PulseChain</div>;
  }

  if (!tokens.length && !isPLSTR) {
    console.error("IssueShares: Invalid token config", { contractSymbol });
    return <div className="text-red-600 p-6">Error: Invalid contract configuration</div>;
  }

  // Convert amount to token's native units
  const toTokenUnits = (amount, decimals) => {
    try {
      if (!amount || Number(amount) <= 0) return "0";
      if (decimals === 18) {
        return web3.utils.toWei(amount, "ether");
      }
      if (decimals === 8) {
        const amountBN = web3.utils.toWei(amount, "ether");
        return (BigInt(amountBN) / BigInt(10000000000)).toString(); // 10^10 to adjust to 10^8
      }
      return web3.utils.toWei(amount, "ether");
    } catch (err) {
      console.error("Error converting amount to token units:", { amount, decimals, error: err.message });
      return "0";
    }
  };

  // Format input value with commas
  const formatInputValue = (value) => {
    if (!value) return "";
    const num = Number(amount.replace(/,/g, ""));
    if (isNaN(num)) return value;

    return new Intl.NumberFormat("en-US", {
      num,
      maximumFractionDigits: 8, // Support decimals for HEX
      amount: value,
      minimumFractionDigits: 0,
    });
  };

  // Handle input change
  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, ""); // Remove commas
    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      setAmount(rawValue);
      setDisplayAmount(formatInputValue(rawValue));
    }
  };

  const handleIssueShares = async () => {
    if (!amount || Number(amount) <= 0 || (isPLSTR && !selectedToken)) {
      setError(isPLSTR ? "Please enter a valid amount and select a token" : "Please enter a valid amount");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = tokens.find((t) => t.symbol === (isPLSTR ? selectedToken : defaultToken));
      if (!token) throw new Error("Invalid token selected");
      const tokenAmount = toTokenUnits(amount, token.decimals);
      console.log("Token amount calculated:", { token: token.symbol, amount, tokenAmount, decimals: token.decimals });
      if (tokenAmount === "0") throw new Error("Invalid token amount");
      const tokenContract = new web3.eth.Contract(token.abi, token.address);
      const allowance = await tokenContract.methods.allowance(account, contract.options.address).call();
      if (BigInt(allowance) < BigInt(tokenAmount)) {
        await tokenContract.methods.approve(contract.options.address, tokenAmount).send({ from: account });
        console.log("Token approved:", { token: token.symbol, tokenAmount });
      }
      const issueMethod = "issueShares";
      if (!contract.methods[issueMethod]) {
        throw new Error(`Method ${issueMethod} not found in ${contractSymbol} contract`);
      }
      if (isPLSTR) {
        await contract.methods[issueMethod](token.address, tokenAmount).send({ from: account });
      } else {
        await contract.methods[issueMethod](tokenAmount).send({ from: account });
      }
      alert(`Successfully issued ${contractSymbol} shares with ${amount} ${token.symbol}!`);
      setAmount("");
      setDisplayAmount("");
      if (isPLSTR) setSelectedToken("");
      console.log("Shares issued:", { contractSymbol, token: token.symbol, tokenAmount });
    } catch (err) {
      setError(`Error issuing shares: ${err.message}`);
      console.error("Issue shares error:", err);
    } finally {
      setLoading(false);
    }
  };

  const estimatedShares = amount ? (isPLSTR ? Number(amount) : Number(amount) * 0.955).toFixed(6) : "0";
  const feeAmount = amount && !isPLSTR ? (Number(amount) * 0.045).toFixed(6) : "0";

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">{isPLSTR ? "Shares Issued" : `Issue ${contractSymbol} Shares`}</h2>
      {isPLSTR ? (
        <>
          {depositsLoading ? (
            <p className="text-gray-600">Loading deposits data...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <>
              <h3 className="text-lg font-medium mt-4">Total Deposits</h3>
              {Object.entries(depositsData.totalDeposits).map(([token, amount]) => (
                <p key={token} className="text-gray-600">{token.toUpperCase()}: <span className="text-purple-600">{formatNumber(amount)} {token.toUpperCase()}</span></p>
              ))}
              <p className="text-gray-600">Issuance Event Count: <span className="text-purple-600">{depositsData.issuanceEventCount}</span></p>
              <h3 className="text-lg font-medium mt-4">Pending PLSTR</h3>
              {Object.entries(depositsData.pendingPLSTR).map(([bond, value]) => (
                <p key={bond} className="text-gray-600">Pending PLSTR ({bond}): <span className="text-purple-600">{formatNumber(value)} PLSTR</span></p>
              ))}
              {console.log("PLSTR Shares Issued UI rendered:", {
                totalDeposits: depositsData.totalDeposits,
                issuanceEventCount: depositsData.issuanceEventCount,
                pendingPLSTR: depositsData.pendingPLSTR,
              })}
            </>
          )}
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="text-gray-600">Token</label>
            <input
              type="text"
              value={defaultToken}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-100"
            />
          </div>
          <div className="mb-4">
            <label className="text-gray-600">Amount ({defaultToken})</label>
            <input
              type="text"
              value={displayAmount}
              onChange={handleAmountChange}
              placeholder={`Enter ${defaultToken} amount`}
              className="w-full p-2 border rounded-lg"
              disabled={loading}
            />
            <p className="text-gray-600 mt-2">
              Estimated {contractSymbol} Shares (after 4.5% fee):{" "}
              <span className="text-purple-600">{formatNumber(estimatedShares)}</span>
            </p>
            <p className="text-gray-600 mt-1">
              Fee (4.5%): <span className="text-purple-600">{formatNumber(feeAmount)} {defaultToken}</span>
            </p>
          </div>
          <button
            onClick={handleIssueShares}
            disabled={loading || !amount || Number(amount) <= 0}
            className="btn-primary"
          >
            {loading ? "Processing..." : `Issue Shares with ${defaultToken}`}
          </button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </>
      )}
    </div>
  );
};

export default IssueShares;
