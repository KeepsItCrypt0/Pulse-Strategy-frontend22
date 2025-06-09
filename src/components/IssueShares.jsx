import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { tokenAddresses, plsABI, incABI, plsxABI, hexABI } from "../web3";

const IssueShares = ({ web3, contract, account, chainId, contractSymbol }) => {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  if (!tokens.length) {
    console.error("IssueShares: Invalid token config", { contractSymbol });
    return <div className="text-red-600 p-6">Error: Invalid contract configuration</div>;
  }

  // Convert amount to token's native units based on decimals
  const toTokenUnits = (amount, decimals) => {
    try {
      if (!amount || Number(amount) <= 0) return "0";
      if (decimals === 18) {
        return web3.utils.toWei(amount, "ether");
      }
      if (decimals === 8) {
        const amountBN = web3.utils.toBN(web3.utils.toWei(amount, "ether"));
        const divisor = web3.utils.toBN("10000000000"); // 10^10 to adjust from 10^18 to 10^8
        return amountBN.div(divisor).toString();
      }
      return web3.utils.toWei(amount, "ether");
    } catch (err) {
      console.error("Error converting amount to token units:", { amount, decimals, err });
      return "0";
    }
  };

  useEffect(() => {
    console.log("IssueShares: Setting selectedToken", { contractSymbol, isPLSTR, defaultToken });
    setSelectedToken(isPLSTR ? "" : defaultToken);
    return () => {
      console.log("IssueShares: Cleanup useEffect", { contractSymbol });
    };
  }, [contractSymbol, isPLSTR, defaultToken]);

  if (chainId !== 369) {
    console.log("IssueShares: Invalid chainId", { chainId });
    return <div className="text-gray-600 p-6">Please connect to PulseChain</div>;
  }

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
      if (web3.utils.toBN(allowance).lt(web3.utils.toBN(tokenAmount))) {
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
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Issue {contractSymbol} Shares</h2>
      {isPLSTR ? (
        <div className="mb-4">
          <label className="text-gray-600">Select Token</label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full p-2 border rounded-lg"
            disabled={loading}
          >
            <option value="">Select a token</option>
            {tokens.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-4">
          <label className="text-gray-600">Token</label>
          <input
            type="text"
            value={defaultToken}
            readOnly
            className="w-full p-2 border rounded-lg bg-gray-100"
          />
        </div>
      )}
      <div className="mb-4">
        <label className="text-gray-600">Amount ({isPLSTR ? selectedToken || "Token" : defaultToken})</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter ${isPLSTR ? selectedToken || "token" : defaultToken} amount`}
          className="w-full p-2 border rounded-lg"
          disabled={loading}
        />
        <p className="text-gray-600 mt-2">
          Estimated {contractSymbol} Shares{!isPLSTR ? " (after 4.5% fee)" : ""}:{" "}
          <span className="text-purple-600">{formatNumber(estimatedShares)}</span>
        </p>
        {!isPLSTR && (
          <p className="text-gray-600 mt-1">
            Fee (4.5%): <span className="text-purple-600">{formatNumber(feeAmount)} {defaultToken}</span>
          </p>
        )}
      </div>
      <button
        onClick={handleIssueShares}
        disabled={loading || !amount || Number(amount) <= 0 || (isPLSTR && !selectedToken)}
        className="btn-primary"
      >
        {loading ? "Processing..." : `Issue Shares with ${isPLSTR ? selectedToken || "Token" : defaultToken}`}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default IssueShares;
