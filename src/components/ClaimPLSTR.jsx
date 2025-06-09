import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { tokenAddresses } from "../web3";

const ClaimPLSTR = ({ contract, account, web3, chainId, contractSymbol }) => {
  const [selectedBond, setSelectedBond] = useState("");
  const [pendingPLSTR, setPendingPLSTR] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bondOptions = [
    { symbol: "pBOND", address: tokenAddresses[369].pBOND },
    { symbol: "xBOND", address: tokenAddresses[369].xBOND },
    { symbol: "iBOND", address: tokenAddresses[369].iBOND },
    { symbol: "hBOND", address: tokenAddresses[369].hBOND },
  ];

  const fetchPendingPLSTR = async () => {
    if (!web3 || !contract || !account || !selectedBond || chainId !== 369) return;
    try {
      const bondAddress = bondOptions.find((b) => b.symbol === selectedBond)?.address;
      if (!bondAddress) throw new Error("Invalid bond selected");
      const pending = await contract.methods.getPendingPLSTR(bondAddress, account).call();
      setPendingPLSTR(web3.utils.fromWei(pending, "ether"));
      console.log("Pending PLSTR fetched:", { bond: selectedBond, pending });
    } catch (err) {
      console.error("Failed to fetch pending PLSTR:", err);
      setError(`Failed to load pending PLSTR: ${err.message}`);
    }
  };

  useEffect(() => {
    if (web3 && contract && account && selectedBond && chainId === 369) fetchPendingPLSTR();
  }, [web3, contract, account, selectedBond, chainId]);

  const handleClaim = async () => {
    if (!selectedBond) {
      setError("Please select a bond");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const bondAddress = bondOptions.find((b) => b.symbol === selectedBond)?.address;
      if (!bondAddress) throw new Error("Invalid bond selected");
      await contract.methods.claimAllPLSTR(bondAddress).send({ from: account });
      alert(`Successfully claimed ${pendingPLSTR} PLSTR for ${selectedBond}!`);
      setPendingPLSTR("0");
      fetchPendingPLSTR();
      console.log("PLSTR claimed:", { bond: selectedBond, bondAddress });
    } catch (err) {
      setError(`Error claiming PLSTR: ${err.message}`);
      console.error("Claim PLSTR error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (chainId !== 369 || contractSymbol !== "PLSTR") return null;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Claim PLSTR</h2>
      <div className="mb-4">
        <label className="text-gray-600">Select Bond</label>
        <select
          value={selectedBond}
          onChange={(e) => setSelectedBond(e.target.value)}
          className="w-full p-2 border rounded-lg"
          disabled={loading}
        >
          <option value="">Select a bond</option>
          {bondOptions.map((bond) => (
            <option key={bond.symbol} value={bond.symbol}>
              {bond.symbol}
            </option>
          ))}
        </select>
      </div>
      {selectedBond && (
        <p className="text-gray-600 mb-2">
          Pending PLSTR for {selectedBond}: <span className="text-purple-600">{formatNumber(pendingPLSTR)} PLSTR</span>
        </p>
      )}
      <button
        onClick={handleClaim}
        disabled={loading || !selectedBond || Number(pendingPLSTR) <= 0}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Claim PLSTR"}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default ClaimPLSTR;
