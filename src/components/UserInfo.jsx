import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { tokenAddresses, plsABI, incABI, plsxABI, hexABI } from "../web3";

const UserInfo = ({ contract, account, web3, chainId, contractSymbol }) => {
  const [userData, setUserData] = useState({
    balance: "0",
    redeemableToken: "0",
    plsBalance: "0",
    plsxBalance: "0",
    incBalance: "0",
    hexBalance: "0",
    pBondClaimable: "0", // Added for PLSTR claimable amounts
    xBondClaimable: "0",
    iBondClaimable: "0",
    hBondClaimable: "0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tokenDecimals = {
    PLS: 18,
    PLSX: 18,
    INC: 18,
    HEX: 8,
    PLSTR: 18, // Added for PLSTR decimals
  };

  const fromUnits = (balance, decimals) => {
    try {
      if (!balance || balance === "0") return "0";
      // Convert BigInt or string to string
      const balanceStr = typeof balance === "bigint" ? balance.toString() : balance.toString();
      if (decimals === 18) {
        return web3.utils.fromWei(balanceStr, "ether");
      }
      if (decimals === 8) {
        // Divide by 10^8
        const balanceNum = Number(balanceStr) / 100000000;
        if (isNaN(balanceNum)) throw new Error("Invalid number after division");
        return balanceNum.toFixed(8).replace(/\.?0+$/, "");
      }
      return web3.utils.fromWei(balanceStr, "ether");
    } catch (err) {
      console.error("Error converting balance:", { balance, decimals, error: err.message });
      return "0";
    }
  };

  const bondConfig = {
    pBOND: { token: "PLS", redeemMethod: "getRedeemablePLS", balanceField: "plsBalance" },
    xBOND: { token: "PLSX", redeemMethod: "getRedeemablePLSX", balanceField: "plsxBalance" },
    iBOND: { token: "INC", redeemMethod: "getRedeemableINC", balanceField: "incBalance" },
    hBOND: { token: "HEX", redeemMethod: "getRedeemableHEX", balanceField: "hexBalance" },
  };

  const fetchUserData = async () => {
    if (!web3 || !contract || !account || chainId !== 369) {
      console.warn("Invalid setup:", { web3: !!web3, contract: !!contract, account, chainId });
      return;
    }
    try {
      setLoading(true);
      setError("");

      const balance = await contract.methods.balanceOf(account).call().catch((err) => {
        console.error(`Failed to fetch ${contractSymbol} balance:`, err);
        return "0";
      });
      console.log("Raw contract balance:", { contractSymbol, rawBalance: balance, type: typeof balance });

      let data = {
        balance: fromUnits(balance, 18),
        redeemableToken: "0",
        plsBalance: "0",
        plsxBalance: "0",
        incBalance: "0",
        hexBalance: "0",
        pBondClaimable: "0",
        xBondClaimable: "0",
        iBondClaimable: "0",
        hBondClaimable: "0",
      };

      const config = bondConfig[contractSymbol] || bondConfig.pBOND;
      if (contractSymbol !== "PLSTR" && balance !== "0") {
        const redeemable = await contract.methods[config.redeemMethod](balance).call().catch((err) => {
          console.error(`Failed to fetch redeemable ${config.token}:`, err);
          return "0";
        });
        console.log("Raw redeemable balance:", { token: config.token, rawBalance: redeemable });
        data.redeemableToken = fromUnits(redeemable, tokenDecimals[config.token]);
      }

      const tokenAddrs = tokenAddresses[369] || {};
      console.log("Token addresses:", tokenAddrs);

      if (contractSymbol !== "PLSTR") {
        // Fetch token balances only for non-PLSTR contracts
        if (tokenAddrs.PLS) {
          const plsContract = new web3.eth.Contract(plsABI, tokenAddrs.PLS);
          try {
            const plsBalance = await plsContract.methods.balanceOf(account).call();
            console.log("Raw WPLS balance:", { address: tokenAddrs.PLS, rawBalance: plsBalance, type: typeof plsBalance });
            data.plsBalance = fromUnits(plsBalance, tokenDecimals.PLS);
            console.log("WPLS balance fetched:", { address: tokenAddrs.PLS, balance: data.plsBalance });
          } catch (err) {
            console.error("Failed to fetch WPLS balance:", err);
            data.plsBalance = "0";
          }
        }

        if (tokenAddrs.PLSX) {
          const plsxContract = new web3.eth.Contract(plsxABI, tokenAddrs.PLSX);
          try {
            const plsxBalance = await plsxContract.methods.balanceOf(account).call();
            console.log("Raw PLSX balance:", { address: tokenAddrs.PLSX, rawBalance: plsxBalance, type: typeof plsBalance });
            data.plsxBalance = fromUnits(plsxBalance, tokenDecimals.PLSX);
            console.log("PLSX balance fetched:", { address: tokenAddrs.PLSX, balance: data.plsxBalance });
          } catch (err) {
            console.error("Failed to fetch PLSX balance:", err);
            data.plsxBalance = "0";
          }
        }

        if (tokenAddrs.INC) {
          const incContract = new web3.eth.Contract(incABI, tokenAddrs.INC);
          try {
            const incBalance = await incContract.methods.balanceOf(account).call();
            console.log("Raw INC balance:", { address: tokenAddrs.INC, rawBalance: incBalance, type: typeof incBalance });
            data.incBalance = fromUnits(incBalance, tokenDecimals.INC);
            console.log("INC balance fetched:", { address: tokenAddrs.INC, balance: data.incBalance });
          } catch (err) {
            console.error("Failed to fetch INC balance:", err);
            data.incBalance = "0";
          }
        }

        if (tokenAddrs.HEX) {
          const hexContract = new web3.eth.Contract(hexABI, tokenAddrs.HEX);
          try {
            const hexBalance = await hexContract.methods.balanceOf(account).call();
            console.log("Raw HEX balance:", { address: tokenAddrs.HEX, rawBalance: hexBalance, type: typeof hexBalance });
            data.hexBalance = fromUnits(hexBalance, tokenDecimals.HEX);
            console.log("HEX balance fetched:", { address: tokenAddrs.HEX, balance: data.hexBalance });
          } catch (err) {
            console.error("Failed to fetch HEX balance:", err);
            data.hexBalance = "0";
          }
        }
      } else {
        // Fetch claimable PLSTR for each bond
        const bondAddresses = {
          pBOND: tokenAddrs.pBOND,
          xBOND: tokenAddrs.xBOND,
          iBOND: tokenAddrs.iBOND,
          hBOND: tokenAddrs.hBOND,
        };

        for (const [bondSymbol, bondAddress] of Object.entries(bondAddresses)) {
          if (bondAddress) {
            try {
              const claimablePLSTR = await contract.methods.getPendingPLSTR(bondAddress, account).call();
              console.log(`Raw claimable PLSTR for ${bondSymbol}:`, { bondAddress, rawBalance: claimablePLSTR, type: typeof claimablePLSTR });
              data[`${bondSymbol.toLowerCase()}Claimable`] = fromUnits(claimablePLSTR, tokenDecimals.PLSTR);
              console.log(`Claimable PLSTR fetched for ${bondSymbol}:`, { bondAddress, balance: data[`${bondSymbol.toLowerCase()}Claimable`] });
            } catch (err) {
              console.error(`Failed to fetch claimable PLSTR for ${bondSymbol}:`, err);
              data[`${bondSymbol.toLowerCase()}Claimable`] = "0";
            }
          }
        }
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
  const tokenBalance = userData[config.balanceField] || "0";

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
              <p className="text-gray-600">Claimable PLSTR from pBOND: <span className="text-purple-600">{formatNumber(userData.pBondClaimable)} PLSTR</span></p>
              <p className="text-gray-600">Claimable PLSTR from xBOND: <span className="text-purple-600">{formatNumber(userData.xBondClaimable)} PLSTR</span></p>
              <p className="text-gray-600">Claimable PLSTR from iBOND: <span className="text-purple-600">{formatNumber(userData.iBondClaimable)} PLSTR</span></p>
              <p className="text-gray-600">Claimable PLSTR from hBOND: <span className="text-purple-600">{formatNumber(userData.hBondClaimable)} PLSTR</span></p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UserInfo;
