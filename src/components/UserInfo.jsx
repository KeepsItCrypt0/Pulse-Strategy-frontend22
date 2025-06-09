import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const UserInfo = ({ contract, account, web3, chainId, contractSymbol }) => {
  const [userData, setUserData] = useState({
    balance: "0",
    redeemableToken: "0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bondConfig = {
    pBOND: { token: "PLS", redeemFunction: "getRedeemablePLS" },
    xBOND: { token: "PLSX", redeemFunction: "getRedeemablePLSX" },
    iBOND: { token: "INC", redeemFunction: "getRedeemableINC" },
    hBOND: { token: "HEX", redeemFunction: "getRedeemableHEX" },
  };

  const fetchUserData = async () => {
    if (!web3 || !contract || !account || chainId !== 369) return;
    try {
      setLoading(true);
      setError("");
      const balance = await contract.methods.balanceOf(account).call();
      const config = bondConfig[contractSymbol] || bondConfig.pBOND;
      const redeemable = balance > 0 ? await contract.methods[config.redeemFunction](balance).call() : "0";
      setUserData({
        balance: web3.utils.fromWei(balance, "ether"),
        redeemableToken: web3.utils.fromWei(redeemable, "ether"),
      });
      console.log("User data fetched:", { contractSymbol, balance, redeemable });
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setError(`Failed to load user data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (web3 && contract && account && chainId === 369) fetchUserData();
  }, [web3, contract, account, chainId, contractSymbol]);

  if (chainId !== 369 || contractSymbol === "PLSTR") return null;

  const tokenSymbol = bondConfig[contractSymbol]?.token || "PLS";

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">{contractSymbol} User Info</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <p className="text-gray-600">Balance: <span className="text-purple-600">{formatNumber(userData.balance)} {contractSymbol}</span></p>
          <p className="text-gray-600">Redeemable {tokenSymbol}: <span className="text-purple-600">{formatNumber(userData.redeemableToken)} {tokenSymbol}</span></p>
        </>
      )}
    </div>
  );
};

export default UserInfo;
