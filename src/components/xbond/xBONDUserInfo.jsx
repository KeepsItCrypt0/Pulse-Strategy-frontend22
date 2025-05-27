import { useState, useEffect } from "react";
import { formatNumber, networks } from "../../web3";

const xBONDUserInfo = ({ contract, account, web3 }) => {
  const [shareBalance, setShareBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setError("");
        setLoading(true);
        if (!contract || !account || !web3) {
          throw new Error("Contract, account, or Web3 not initialized");
        }
        if (!contract.methods.getUserShareInfo) {
          throw new Error("Method getUserShareInfo not found in contract ABI");
        }
        const info = await contract.methods.getUserShareInfo(account).call();
        setShareBalance(Number(info.shareBalance));
      } catch (err) {
        console.error("Failed to fetch user info:", err);
        setError(
          `Failed to load user info: ${
            err.message.includes("call revert") || err.message.includes("invalid opcode")
              ? "Method not found or ABI mismatch"
              : err.message || "Unknown error"
          }`
        );
        setShareBalance(null);
      } finally {
        setLoading(false);
      }
    };

    if (contract && account && web3) {
      fetchUserInfo();
      const interval = setInterval(fetchUserInfo, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, account, web3]);

  if (!contract || !account || !web3) return null;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">User Info</h2>
      {loading ? (
        <p className="text-gray-600 mb-4">Loading...</p>
      ) : error ? (
        <p className="text-red-400 mb-4">{error}</p>
      ) : (
        <p className="text-gray-600 mb-4">
          xBOND Balance: {formatNumber(shareBalance || 0)}
        </p>
      )}
    </div>
  );
};

export default xBONDUserInfo;
