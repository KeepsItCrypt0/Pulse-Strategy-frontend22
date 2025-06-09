import { useState } from "react";

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
    return <div className="text-gray-600 p-6">Please connect to PulseChain</div>;
  }

  const handleSetPairAddress = async () => {
    if (!pairAddress) {
      setError("Please enter a valid pair address");
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
      setError("Please enter all bond addresses");
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
      console.log("Bond addresses set:", { bondAddresses });
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
      {contractSymbol !== "PLSTR" ? (
        <>
          <h3 className="text-lg font-medium mb-2">Set Pair Address</h3>
          <div className="mb-4">
            <input
              type="text"
              value={pairAddress}
              onChange={(e) => setPairAddress(e.target.value)}
              placeholder="Enter pair address"
              className="w-full p-2 border rounded-lg"
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
                className="w-full p-2 border rounded-lg"
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
