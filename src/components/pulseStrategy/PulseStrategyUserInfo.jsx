import { useState, useEffect } from "react";
import { formatNumber } from "../../format";

const PulseStrategyUserInfo = ({ contract, account, web3 }) => {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (contract && account && web3) {
        try {
          const balanceWei = await contract.methods.balanceOf(account).call();
          setBalance(balanceWei);
        } catch (error) {
          console.error("Failed to fetch user info:", error);
        }
      }
    };
    fetchData();
  }, [contract, account, web3]);

  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-semibold text-purple-600">User Info</h2>
      <p>Balance: {balance !== null ? formatNumber(balance / 10 ** 18) : "Loading..."} PLSTR</p>
    </div>
  );
};

export default PulseStrategyUserInfo;
