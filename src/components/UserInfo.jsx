import { useState, useEffect } from "react";
import { getTokenContract, formatNumber, networks } from "../web3";

const UserInfo = ({ contract, account, web3, network }) => {
  const [shareBalance, setShareBalance] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [redeemableTokens, setRedeemableTokens] = useState("0");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // For initial data fetch
  const [error, setError] = useState("");
  const { tokenName, shareName } = networks[network] || { tokenName: "Token", shareName: "Share" }; // Fallback values

  const fetchInfo = async () => {
    try {
      setLoading(true);
      setError("");
      if (!contract || !web3 || !account || !/^[0x][0-9a-fA-F]{40}$/.test(account)) {
        throw new Error("Contract, Web3, or invalid account not initialized");
      }

      const shareBal = await contract.methods.balanceOf(account).call();
      const tokenContract = await getTokenContract(web3, network);
      const tokenBal = await tokenContract.methods.balanceOf(account).call();
      const redeemMethod = network === "ethereum" ? "getRedeemableStakedPLS" : "getRedeemablePLSX";
      if (!contract.methods[redeemMethod]) {
        throw new Error(`Method ${redeemMethod} not found in contract ABI`);
      }
      const redeemable = await contract.methods[redeemMethod](shareBal).call();

      setShareBalance(formatNumber(web3.utils.fromWei(shareBal || "0", "ether")));
      setTokenBalance(formatNumber(web3.utils.fromWei(tokenBal || "0", "ether")));
      setRedeemableTokens(formatNumber(web3.utils.fromWei(redeemable || "0", "ether")));
      console.log("User info fetched:", {
        shareBalance: shareBal,
        tokenBalance: tokenBal,
        redeemable,
      });
    } catch (err) {
      console.error("Failed to fetch user info:", err);
      setError(
        `Failed to load user data: ${
          err.message.includes("call revert") || err.message.includes("invalid opcode")
            ? "Method not found or ABI mismatch"
            : err.message || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && account && network) {
      fetchInfo();
      const interval = setInterval(fetchInfo, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [contract, web3, account, network]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card mt-4">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">User Information</h2>
      {initialLoading || loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setTimeout(fetchInfo, 1000)} // Small delay to avoid spamming
            className="mt-2 text-purple-300 hover:text-purple-400"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <p>
            <strong>{shareName} Balance:</strong> {formatNumber(shareBalance)} {shareName}
          </p>
          <p>
            <strong>{tokenName} Balance:</strong> {formatNumber(tokenBalance)} {tokenName}
          </p>
          <p>
            <strong>Redeemable {tokenName}:</strong> {formatNumber(redeemableTokens)} {tokenName}
          </p>
        </>
      )}
    </div>
  );
};

export default UserInfo;
