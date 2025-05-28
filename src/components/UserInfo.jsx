// src/components/UserInfo.jsx
import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const UserInfo = ({ contract, account, web3, chainId }) => {
  const [shareBalance, setShareBalance] = useState("0");
  const [redeemableToken, setRedeemableToken] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInfo = async () => {
    try {
      setLoading(true);
      setError("");
      const balance = await contract.methods.balanceOf(account).call();
      const redeemable = await contract.methods[
        chainId === 1 ? "getRedeemableStakedPLS" : "getRedeemablePLSX"
      ](chainId === 1 ? [account, balance] : balance).call();
      setShareBalance(web3.utils.fromWei(balance, "ether"));
      setRedeemableToken(web3.utils.fromWei(redeemable, "ether"));
      console.log("User info fetched:", { shareBalance: balance, redeemableToken: redeemable });
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      setError(`Failed to load user data: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && account && web3 && chainId) fetchInfo();
  }, [contract, account, web3, chainId]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Your Information</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setTimeout(fetchInfo, 2000)}
            className="mt-2 text-purple-300 hover:text-pink-400"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <p>
            <strong>{chainId === 1 ? "PLSTR" : "xBOND"} Balance:</strong>{" "}
            {formatNumber(shareBalance)} {chainId === 1 ? "PLSTR" : "xBOND"}
          </p>
          <p>
            <strong>Redeemable {chainId === 1 ? "vPLS" : "PLSX"}:</strong>{" "}
            {formatNumber(redeemableToken)} {chainId === 1 ? "vPLS" : "PLSX"}
          </p>
        </>
      )}
    </div>
  );
};

export default UserInfo;
