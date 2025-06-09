import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format.js";
import { contractAddresses, tokenAddresses, plsABI, incABI, plsxABI, hexABI, PLSTR_ABI } from "../web3.js";

const UserInfo = ({ contract, account, web3, chainId, contractSymbol }) => {
  const [userData, setUserData] = useState({
    balance: "0", // Bond or PLSTR balance
    redeemableToken: "0", // Redeemable token for bonds
    plstrBalance: "0",
    plsBalance: "0",
    plsxBalance: "0",
    incBalance: "0",
    hexBalance: "0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bondConfig = {
    pBOND: { token: "PLS", redeemFunction: "getRedeemablePLS", balanceField: "plsBalance" },
    xBOND: { token: "PLS", redeemFunction: "getRedeemablePLS", tokenBalanceField: "plsxBalance" },
    iBOND: { token: "INC", redeemFunction: "getRedeemableINC", balanceField: "balanceBalance" },
    hBOND: { token: "HEX", redeemFunction: "getRedeemableHex", balanceField: "balanceBalance" },
  };

  const fetchUserData = async () => {
    if (!web3 || !contract || !account || chainId !== 369) return;
    try {
      setLoading(true);
      setError("");

      // Fetch contract balance (PLSTR or bond)
      const balance = await contract.methods.balanceOf(account).call().catch(() => "0");
      const balanceInEther = web3.utils.fromWei(balance || "0", "ether");

      // Initialize user data
      let data = {
        balance: balanceInEther,
        redeemableToken: "0",
        plstrBalance: "0",
        plsBalance: "0",
        plsxBalance: "0",
        incBalance: "0",
        hexBalance: "0",
      };

      // Fetch redeemable token for bond contracts
      const config = bondConfig[contractSymbol] || bondConfig.pBOND;
      if (contractSymbol !== "PLSTR" && balance > "0") {
        const redeemable = await contract.methods[config.redeemFunction](balance).call().catch(() => "0");
        data.redeemableToken = web3.utils.fromWei(redeemable || "0", "ether");
      }

      // Fetch token balances
      const tokenAddrs = tokenAddresses[369] || {};
      const contractAddrs = contractAddresses[369] || {};

      // PLSTR balance (use contractAddresses for PLSTR)
      if (contractAddrs.PLSTR) {
        const plstrContract = new web3.eth.Contract(PLSTR_ABI, contractAddrs.PLSTR);
        const plstrBalance = await plstrContract.methods.balanceOf(account).call().catch(() => "0");
        data.plstrBalance = web3.utils.fromWei(plstrBalance || "0", "ether");
      }

      // WPLS balance
      if (tokenAddrs.PLS) {
        const plsContract = new web3.eth.Contract(plsABI, tokenAddrs.PLS);
        const plsBalance = await plsContract.methods.balanceOf(account).call().catch(() => "0");
        data.plsBalance = web3.utils.fromWei(plsBalance || "0", "ether");
      }

      // PLSX balance
      if (tokenAddrs.PLSX) {
        const plsxContract = new web3.eth.Contract(plsxABI, tokenAddrs.PLSX);
        const plsxBalance = await plsxContract.methods.balanceOf(account).call().catch(() => "0");
        data.plsxBalance = web3.utils.fromWei(plsxBalance || "0", "ether");
      }

      // INC balance
      if (tokenAddrs.INC) {
        const incContract = new web3.eth.Contract(incABI, tokenAddrs.INC);
        const incBalance = await incContract.methods.balanceOf(account).call().catch(() => "0");
        data.incBalance = web3.utils.fromWei(incBalance || "0", "ether");
      }

      // HEX balance
      if (tokenAddrs.HEX) {
        const hexContract = new web3.eth.Contract(hexABI, tokenAddrs.HEX);
        const hexBalance = await hexContract.methods.balanceOf(account).call().catch(() => "0");
        data.hexBalance = web3.utils.fromWei(hexBalance || "0", "ether");
      }

      setUserData(data);
      console.log("User data fetched:", { contractSymbol, ...data });
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

  if (chainId !== 369) {
    return (
      <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
        <p className="text-red-600">Please connect to PulseChain (chain ID 369)</p>
      </div>
    );
  }

  const config = bondConfig[contractSymbol] || bondConfig.pBOND;
  const tokenSymbol = config.token || "PLS";
  const tokenBalance = userData[config.tokenBalanceField] || "0";

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
          {contractSymbol !== "PLSTR" && (
            <>
              <p className="text-gray-600">Redeemable {tokenSymbol}: <span className="text-purple-600">{formatNumber(userData.redeemableToken)} {tokenSymbol}</span></p>
              <p className="text-gray-600">{tokenSymbol} Balance: <span className="text-purple-600">{formatNumber(tokenBalance)} {tokenSymbol}</span></p>
            </>
          )}
          {contractSymbol === "PLSTR" && (
            <>
              <p className="text-gray-600">PLSTR Balance: <span className="text-purple-600">{formatNumber(userData.plstrBalance)} PLSTR</span></p>
              <p className="text-gray-600">WPLS Balance: <span className="text-purple-600">{formatNumber(userData.plsBalance)} WPLS</span></p>
              <p className="text-gray-600">PLSX Balance: <span className="text-purple-600">{formatNumber(userData.plsxBalance)} PLSX</span></p>
              <p className="text-gray-600">INC Balance: <span className="text-purple-600">{formatNumber(userData.incBalance)} INC</span></p>
              <p className="text-gray-600">HEX Balance: <span className="text-purple-600">{formatNumber(userData.hexBalance)} HEX</span></p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UserInfo;
