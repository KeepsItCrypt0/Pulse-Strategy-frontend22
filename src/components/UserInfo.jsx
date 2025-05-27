import { useState, useEffect } from "react";
import { getTokenContract, formatNumber, networks } from "../web3";

const UserInfo = ({ contract, account, web3, network }) => {
  const [shareBalance, setShareBalance] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [redeemableTokens, setRedeemableTokens] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { tokenName, shareName } = networks[network];

  const fetchInfo = async () => {
    try {
      setLoading(true);
      setError("");
      if (!contract || !web3 || !account) {
        throw new Error("Contract, Web3, or account not initialized");
      }

      const shareBal = await contract.methods.balanceOf(account).call();
      const tokenContract = await getTokenContract(web3, network);
      const tokenBal = await tokenContract.methods.balanceOf(account).call();
      const redeemMethod = network === "ethereum" ? "getRedeemableStakedPLS" : "getRedeemablePLSX";
      const redeemable = await contract.methods[redeemMethod](shareBal).call();

      setShareBalance(web3.utils.fromWei(shareBal || "0", "ether"));
      setTokenBalance(web3.utils.fromWei(tokenBal || "0", "ether"));
      setRedeemableTokens(web3.utils.fromWei(redeemable || "0", "ether"));
      console.log("User info fetched:", {
        shareBalance: shareBal,
        tokenBalance: tokenBal,
        redeemable,
      });
    } catch (err) {
      console.error("Failed to fetch user info:", err);
      setError(`Failed to load user data: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && account) fetchInfo();
  }, [contract, web3, account, network]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">User Information</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setTimeout(fetchInfo, 2000)}
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
