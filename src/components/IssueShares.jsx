import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { tokenAddresses } from "../web3";

const IssueShares = ({ web3, contract, account, chainId, contractSymbol }) => {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tokenOptions = [
    { symbol: "PLSX", address: tokenAddresses[369].PLSX, decimals: "ether" },
    { symbol: "PLS", address: tokenAddresses[369].PLS, decimals: "ether" },
    { symbol: "INC", address: tokenAddresses[369].INC, decimals: "ether" },
    { symbol: "HEX", address: tokenAddresses[369].HEX, decimals: "ether" },
  ];

  const handleIssueShares = async () => {
    if (!amount || Number(amount) <= 0 || !selectedToken) {
      setError("Please enter a valid amount and select a token");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = tokenOptions.find((t) => t.symbol === selectedToken);
      if (!token) throw new Error("Invalid token selected");
      const tokenAmount = web3.utils.toWei(amount, token.decimals);
      const tokenContract = new web3.eth.Contract(ERC20_ABI, token.address); // Define ERC20_ABI
      const allowance = await tokenContract.methods.allowance(account, contract.options.address).call();
      if (web3.utils.toBN(allowance).lt(web3.utils.toBN(tokenAmount))) {
        await tokenContract.methods.approve(contract.options.address, tokenAmount).send({ from: account });
        console.log("Token approved:", { token: selectedToken, tokenAmount });
      }
      await contract.methods.issueShares(token.address, tokenAmount).send({ from: account });
      alert(`Successfully issued ${contractSymbol} shares with ${amount} ${selectedToken}!`);
      setAmount("");
      console.log("Shares issued:", { contractSymbol, token: selectedToken, tokenAmount });
    } catch (err) {
      setError(`Error issuing shares: ${err.message}`);
      console.error("Issue shares error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (chainId !== 369) return null; // Removed contractSymbol !== "PLSTR"

  const estimatedShares = amount ? (Number(amount) * 0.955).toFixed(6) : "0"; // 4.5% fee

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Issue {contractSymbol} Shares</h2>
      <div className="mb-4">
        <label className="text-gray-600">Select Token</label>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          className="w-full p-2 border rounded-lg"
          disabled={loading}
        >
          <option value="">Select a token</option>
          {tokenOptions.map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.symbol}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="text-gray-600">Amount ({selectedToken || "Token"})</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter ${selectedToken || "token"} amount`}
          className="w-full p-2 border rounded-lg"
          disabled={loading}
        />
        <p className="text-gray-600 mt-2">
          Estimated {contractSymbol} Shares (after 4.5% fee):{" "}
          <span className="text-purple-600">{formatNumber(estimatedShares)}</span>
        </p>
      </div>
      <button
        onClick={handleIssueShares}
        disabled={loading || !amount || Number(amount) <= 0 || !selectedToken}
        className="btn-primary"
      >
        {loading ? "Processing..." : `Issue Shares with ${selectedToken || "Token"}`}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

// Minimal ERC-20 ABI for approve and allowance
const ERC20_ABI = [
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

export default IssueShares;
