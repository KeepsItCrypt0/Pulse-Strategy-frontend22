import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { tokenAddresses, plsABI, incABI, plsxABI, hexABI } from "../web3";

const AdminIssueShares = ({ web3, contract, account, chainId, contractSymbol }) => {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Null checks for props
  if (!web3 || !contract || !account || !chainId || !contractSymbol) {
    console.warn("AdminIssueShares: Missing required props", { web3, contract, account, chainId, contractSymbol });
    return <div className="text-gray-600 p-6">Loading contract data...</div>;
  }

  // Only render for PLSTR
  if (contractSymbol !== "PLSTR") {
    console.log("AdminIssueShares: Skipped rendering for non-PLSTR contract", { contractSymbol });
    return null;
  }

  const tokenConfig = {
    PLSTR: [
      { symbol: "PLSX", address: tokenAddresses[369].PLSX, decimals: "ether", abi: plsxABI },
      { symbol: "PLS", address: tokenAddresses[369].PLS, decimals: "ether", abi: plsABI },
      { symbol: "INC", address: tokenAddresses[369].INC, decimals: "ether", abi: incABI },
      { symbol: "HEX", address: tokenAddresses[369].HEX, decimals: "ether", abi: hexABI },
    ],
  };

  const tokens = tokenConfig[contractSymbol] || [];

  if (!tokens.length) {
    console.error("AdminIssueShares: Invalid token config", { contractSymbol });
    return <div className="text-red-600 p-6">Error: Invalid contract configuration</div>;
  }

  if (chainId !== 369) {
    console.log("AdminIssueShares: Invalid chainId", { chainId });
    return <div className="text-gray-600 p-6">Please connect to a supported network.</div>;
  }

  const handleIssueShares = async () => {
    if (!amount || Number(amount) <= 0 || !selectedToken) {
      setError("Please enter a valid amount and select a token.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = tokens.find((t) => t.symbol === selectedToken);
      if (!token) throw new Error("Invalid token selected");
      const tokenAmount = web3.utils.toWei(amount, token.decimals);
      const tokenContract = new web3.eth.Contract(token.abi, token.address);
      const allowance = await tokenContract.methods.allowance(account, contract.options.address).call();
      if (web3.utils.toBN(allowance).lt(web3.utils.toBN(tokenAmount))) {
        await tokenContract.methods.approve(contract.options.address, tokenAmount).send({ from: account });
        console.log("Token approved:", { token: token.symbol, amount: tokenAmount });
      }
      const issueMethod = "issueShares";
      if (!contract.methods[issueMethod]) {
        throw new Error(`Method ${issueMethod} not found in ${contractSymbol}`);
      }
      await contract.methods[issueMethod](token.address, tokenAmount).send({ from: account });
      alert(`Successfully issued ${contractSymbol} shares with ${amount} ${token.symbol}!`);
      setAmount("");
      setSelectedToken("");
      console.log("Shares issued:", { contractSymbol, token: token.symbol, amount: tokenAmount });
    } catch (err) {
      setError(`Error issuing shares: ${err.message}`);
      console.error("Issue shares error:", err);
    } finally {
      setLoading(false);
    }
  };

  const estimatedFees = amount ? Number(amount).toFixed(6) : "0";

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2 text-purple-600">Issue Shares</h3>
      <div className="mb-4">
        <label className="text-gray-600">Select Token</label>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          className="w-full p-1 border rounded"
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
      <div className="mb-4">
        <label className="text-gray-600">Amount ({selectedToken || "token"})</label>{" "}
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter amount (${selectedToken || "token"})`}
          className="input-field"
          disabled={loading}
        />
        <p className="text-gray-500 mt-1">
          Estimated {contractSymbol}: {formatNumber(estimatedFees)}
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

const AdminPanel = ({ contract, account, web3, chainId, contractSymbol }) => {
  const [pairAddress, setPairAddress] = useState("");
  const [bondAddresses, setBondAddresses] = useState({
    hBOND: "",
    pBOND: "",
    iBOND: "",
    xBOND: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Null checks for props
  if (!web3 || !contract || !account || !chainId || !contractSymbol) {
    console.warn("AdminPanel: Missing required props", { web3, contract, account, chainId, contractSymbol });
    return <div className="text-gray-600 p-6">Loading contract data...</div>;
  }

  if (chainId !== 369) {
    console.log("AdminPanel: Invalid chainId", { chainId });
    return <div className="text-gray-600 p-6">Please connect to a supported network.</div>;
  }

  const handleSetPairAddress = async () => {
    if (!pairAddress) {
      setError("Please enter a valid pair address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await contract.methods.setPairAddress(pairAddress).send({ from: account });
      alert("Pair address set successfully!");
      setPairAddress("");
      console.log("Pair address set:", { contractSymbol, pairAddress });
    } catch (err) {
      setError(`Error setting pair address: ${err.message}`);
      console.error("Set pair address error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetBondAddresses = async () => {
    if (Object.values(bondAddresses).some((addr) => !addr)) {
      setError("Please enter all bond addresses.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await contract.methods
        .setBondAddresses(bondAddresses.hBOND, bondAddresses.pBOND, bondAddresses.iBOND, bondAddresses.xBOND)
        .send({ from: account });
      alert("Bond addresses set successfully!");
      setBondAddresses({ hBOND: "", pBOND: "", iBOND: "", xBOND: "" });
      console.log("Bond addresses set:", { contractSymbol, bondAddresses });
    } catch (err) {
      setError(`Error setting bond addresses: ${err.message}`);
      console.error("Set bond addresses error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Admin Panel - {contractSymbol}</h2>
      {contractSymbol === "PLSTR" && (
        <AdminIssueShares
          web3={web3}
          contract={contract}
          account={account}
          chainId={chainId}
          contractSymbol={contractSymbol}
        />
      )}
      {contractSymbol !== "PLSTR" ? (
        <>
          <h3 className="text-lg font-medium mb-2">Set Pair Address</h3>
          <div className="mb-4">
            <input
              type="text"
              value={pairAddress}
              onChange={(e) => setPairAddress(e.target.value)}
              placeholder="Enter pair address"
              className="w-full p-1 border rounded"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleSetPairAddress}
            disabled={loading || !pairAddress}
            className="btn-primary"
          >
            {loading ? "Processing..." : "Set Pair Address"}
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium mb-2">Set Bond Addresses</h3>
          {Object.keys(bondAddresses).map((bond) => (
            <div key={bond} className="mb-4">
              <label className="text-gray-600">{bond}</label>
              <input
                type="text"
                value={bondAddresses[bond]}
                onChange={(e) =>
                  setBondAddresses({ ...bondAddresses, [bond]: e.target.value })
                }
                placeholder={`Enter ${bond} address`}
                className="w-full p-1 border rounded"
                disabled={loading}
              />
            </div>
          ))}
          <button
            onClick={handleSetBondAddresses}
            disabled={loading || Object.values(bondAddresses).some((addr) => !addr)}
            className="btn-primary"
          >
            {loading ? "Processing..." : "Set Bond Addresses"}
          </button>
        </>
      )}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default AdminPanel;
