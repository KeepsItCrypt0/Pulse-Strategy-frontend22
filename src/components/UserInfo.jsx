// src/components/UserInfo.jsx
import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const UserInfo = ({ contract, account, web3, chainId }) => {
  const [shareBalance, setShareBalance] = useState("0");
  const [redeemableToken, setRedeemableToken] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInfo = async () => {
    if (!contract || !account || !web3 || !chainId) {
      setError("Contract, account, or Web3 not initialized");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");

      // Fetch balance
      const balance = await contract.methods.balanceOf(account).call();
      const balanceStr = balance.toString(); // Convert BigInt to string
      const balanceEther = web3.utils.fromWei(balanceStr, "ether");

      // Fetch redeemable tokens
      let redeemable;
      if (chainId === 1) {
        // PLSTR: getRedeemableStakedPLS takes address and share amount
        redeemable = await contract.methods.getRedeemableStakedPLS(account, balanceStr).call();
      } else {
        // xBOND: getRedeemablePLSX takes balance
        redeemable = await contract.getRedeemablePLSX(balanceStr).call();
      }
      const redeemableStr = redeemable.toString(); // Convert BigInt to string
      const redeemableEther = web3.utils.fromWei(redeemableStr, "ether");

      setShareBalance(balanceEther);
      setRedeemableToken(redeemableEther);
      console.log("User info fetched:", {
        shareBalance: balanceEther,
        redeemableToken: redeemableEther,
        chainId,
        account,
      });
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      setError(`Failed to load user data: ${error.message || "Contract execution failed"}`);
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
            onClick={fetchInfo}
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
