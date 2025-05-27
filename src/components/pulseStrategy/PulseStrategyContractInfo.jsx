import { useState, useEffect } from "react";
import { formatNumber } from "../../format";
import { networks } from "../../web3";

const PulseStrategyContractInfo = ({ contract, web3 }) => {
  const [totalSupply, setTotalSupply] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (contract && web3) {
        try {
          const supply = await contract.methods.totalSupply().call();
          setTotalSupply(supply);
        } catch (error) {
          console.error("Failed to fetch contract info:", error);
        }
      }
    };
    fetchData();
  }, [contract, web3]);

  const network = networks.ethereum;
  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-semibold text-purple-600">Contract Info</h2>
      <p>Total Supply: {totalSupply !== null ? formatNumber(totalSupply / 10 ** 18) : "Loading..."} {network.tokenName}</p>
      <p>Contract Address: {network.contractAddress}</p>
      <p>Network: {network.chainName}</p>
    </div>
  );
};

export default PulseStrategyContractInfo;
