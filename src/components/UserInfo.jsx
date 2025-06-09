import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { contractAddresses, tokenAddresses, plsABI, incABI, plsxABI, hexABI } from "../web3";

const UserInfo = ({ contract, account, web3, chainId, contractSymbol }) => {
  const [userData, setUserData] = useState({
    balance: "0", // Bond or PLSTR balance
    redeemableToken: "0", // Redeemable token for bonds
    plsBalance: "0",
    plsxBalance: "0",
    incBalance: "0",
    hexBalance: "0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Token decimals
  const tokenDecimals = {
    PLS: 18, // WPLS
    PLSX: 18,
    INC: 18,
    HEX: 8,
  };

  // Convert balance based on token decimals
  const fromUnits = (balance, decimals) => {
    try {
      return web3.utils.fromWei(balance, decimals === 18 ? "ether" : decimals === 8 ? "gwei" : "ether");
    } catch (err) {
      console.error("Error converting balance:", err);
      return "0";
    }
  };

  const bondConfig = {
    pBOND: { token: "PLS", redeemFunction: "getRedeemablePLS", tokenBalanceField: "plsBalance" },
    xBOND: { token: "PLSX", redeemFunction: "getRedeemablePLSX", tokenBalanceField: "plsxBalance" },
    iBOND: { token: "INC", redeemFunction: "getRedeemableINC", tokenBalanceField: "incBalance" },
    hBOND: { token: "HEX", redeemFunction: "getRedeemableHEX", tokenBalanceField: "hexBalance" },
  };

  const fetchUserData = async () => {
    if (!web3 || !contract || !account || chainId !== 369) {
      console.warn("Invalid setup:", { web3: !!web3, contract: !!contract, account, chainId });
      return;
    }
    try {
      setLoading(true);
      setError("");

      // Fetch contract balance (PLSTR or bond)
      const balance = await contract.methods.balanceOf(account).call().catch((err) => {
        console.error("Failed to fetch contract balance:", err);
        return "0";
      });
      const balanceInEther = fromUnits(balance, contractSymbol === "HEX" ? 8 : 18);

      // Initialize user data
      let data = {
        balance: balanceInEther,
        redeemableToken: "0",
        plsBalance: "0",
        plsxBalance: "0",
        incBalance: "0",
        hexBalance: "0",
      };

      // Fetch redeemable token for bond contracts
      const config = bondConfig[contractSymbol] || bondConfig.pBOND;
      if (contractSymbol !== "PLSTR" && balance > 0) {
        const redeemable = await contract.methods[config.redeemFunction](balance).call().catch((err) => {
          console.error(`Failed to fetch redeemable ${config.token}:`, err);
          return "0";
        });
        data.redeemableToken = fromUnits(redeemable, tokenDecimals[config.token]);
      }

      // Fetch token balances
      const tokenAddrs = tokenAddresses[369] || {};
      console.log("Token addresses:", tokenAddrs);

      // WPLS balance
      if (tokenAddrs.PLS) {
        const plsContract = new web3.eth.Contract(plsABI, tokenAddrs.PLS);
        try {
          const plsBalance = await plsContract.methods.balanceOf(account).call();
          data.plsBalance = fromUnits(plsBalance, tokenDecimals.PLS);
          console.log("WPLS balance fetched:", { address: tokenAddrs.PLS, balance: data.plsBalance });
        } catch (err) {
          console.error("Failed to fetch WPLS balance:", err);
          data.plsBalance = "0";
        }
      } else {
        console.warn("WPLS address not found in tokenAddresses[369]");
      }

      // PLSX balance
      if (tokenAddrs.PLSX) {
        const plsxContract = new web3.eth.Contract(plsxABI, tokenAddrs.PLSX);
        try {
          const plsxBalance = await plsxContract.methods.balanceOf(account).call();
          data.plsxBalance = fromUnits(plsxBalance, tokenDecimals.PLSX);
          console.log("PLSX balance fetched:", { address: tokenAddrs.PLSX, balance: data.plsxBalance });
        } catch (err) {
          console.error("Failed to fetch PLSX balance:", err);
          data.plsxBalance = "0";
        }
      } else {
        console.warn("PLSX address not found in tokenAddresses[369]");
      }

      // INC balance
      if (tokenAddrs.INC) {
        const incContract = new web3.eth.Contract(incABI, tokenAddrs.INC);
        try {
          const incBalance = await incContract.methods.balanceOf(account).call();
          data.incBalance = fromUnits(incBalance, tokenDecimals.INC);
          console.log("INC balance fetched:", { address: tokenAddrs.INC, balance: data.incBalance });
        } catch (err) {
          console.error("Failed to fetch INC balance:", err);
          data.incBalance = "0";
        }
      } else {
        console.warn("INC address not found in tokenAddresses[369]");
      }

      // HEX balance
      if (tokenAddrs.HEX) {
        const hexContract = new web3.eth.Contract(hexABI, tokenAddrs.HEX);
        try {
          const hexBalance = await hexContract.methods.balanceOf(account).call();
          data.hexBalance = fromUnits(hexBalance, tokenDecimals.HEX);
          console.log("HEX balance fetched:", { address: tokenAddrs.HEX, balance: data.hexBalance });
        } catch (err) {
          console.error("Failed to fetch HEX balance:", err);
          data.hexBalance = "0";
        }
      } else {
        console.warn("HEX address not found in tokenAddresses[369]");
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
