import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { tokenAddresses, plsABI, plsxABI, incABI, hexABI } from "../web3";

const ContractInfo = ({ contract, web3, chainId, contractSymbol }) => {
  const [contractData, setContractData] = useState({
    name: "",
    symbol: "",
    decimals: 18,
    totalSupply: "0",
    bondAddresses: { hBOND: "", pBOND: "", iBOND: "", xBOND: "" },
    balances: { plstr: "0", plsx: "0", pls: "0", inc: "0", hex: "0" },
    pairAddress: "",
    tokenBalance: "0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bondConfig = {
    pBOND: { token: "PLS", abi: plsABI, address: tokenAddresses[369]?.PLS },
    xBOND: { token: "PLSX", abi: plsxABI, address: tokenAddresses[369]?.PLSX },
    iBOND: { token: "INC", abi: incABI, address: tokenAddresses[369]?.INC },
    hBOND: { token: "HEX", abi: hexABI, address: tokenAddresses[369]?.HEX },
  };

  const fetchContractData = async () => {
    if (!contract || !web3 || chainId !== 369) {
      setError("Invalid contract, web3, or chain ID");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");

      const config = bondConfig[contractSymbol] || bondConfig.pBOND;

      // Common ERC20 methods
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.methods.name().call().catch(() => ""),
        contract.methods.symbol().call().catch(() => contractSymbol),
        contract.methods.decimals().call().catch(() => 18),
        contract.methods.totalSupply().call().catch(() => "0"),
      ]);

      let bondAddresses = contractData.bondAddresses;
      let balances = contractData.balances;
      let pairAddress = "";
      let tokenBalance = "0";

      if (contractSymbol === "PLSTR") {
        // PLSTR-specific methods (adjust method names based on your contract)
        bondAddresses = await contract.methods.getBondAddresses().call().catch(() => ({
          hBOND: "", pBOND: "", iBOND: "", xBOND: "",
        }));

        // Fetch PLSTR contract balances for tokens
        const tokenContracts = {
          plsx: new web3.eth.Contract(plsxABI, tokenAddresses[369]?.PLSX),
          pls: new web3.eth.Contract(plsABI, tokenAddresses[369]?.PLS),
          inc: new web3.eth.Contract(incABI, tokenAddresses[369]?.INC),
          hex: new web3.eth.Contract(hexABI, tokenAddresses[369]?.HEX),
        };

        const balancePromises = Object.entries(tokenContracts).map(async ([token, tokenContract]) => {
          if (tokenContract && tokenAddresses[369]?.[token.toUpperCase()]) {
            const balance = await tokenContract.methods
              .balanceOf(contract.options.address)
              .call()
              .catch(() => "0");
            return [token, web3.utils.fromWei(balance, "ether")];
          }
          return [token, "0"];
        });

        const balanceResults = await Promise.all(balancePromises);
        balances = Object.fromEntries(balanceResults);
        balances.plstr = web3.utils.fromWei(totalSupply, "ether");
      } else {
        // Bond-specific methods
        pairAddress = await contract.methods.getPairAddress().call().catch(() => "");
        const tokenContract = new web3.eth.Contract(config.abi, config.address);
        tokenBalance = await tokenContract.methods
          .balanceOf(contract.options.address)
          .call()
          .catch(() => "0");
        tokenBalance = web3.utils.fromWei(tokenBalance, "ether");
      }

      setContractData({
        name,
        symbol,
        decimals,
        totalSupply: web3.utils.fromWei(totalSupply, "ether"),
        bondAddresses,
        balances,
        pairAddress,
        tokenBalance,
      });

      console.log("Contract data fetched:", {
        contractSymbol,
        name,
        symbol,
        totalSupply,
        bondAddresses,
        balances,
        pairAddress,
        tokenBalance,
      });
    } catch (err) {
      console.error("Failed to fetch contract data:", err);
      setError(`Failed to load contract data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("ContractInfo useEffect:", { contractSymbol, chainId, hasContract: !!contract, hasWeb3: !!web3 });
    if (contract && web3 && chainId === 369) fetchContractData();
  }, [contract, web3, chainId, contractSymbol]);

  if (chainId !== 369) {
    console.log("ContractInfo: Invalid chainId", { chainId });
    return null;
  }

  const tokenSymbol = bondConfig[contractSymbol]?.token || "PLS";

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">{contractSymbol} Contract Info</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <p className="text-gray-600">Name: <span className="text-purple-600">{contractData.name || "N/A"}</span></p>
          <p className="text-gray-600">Symbol: <span className="text-purple-600">{contractData.symbol}</span></p>
          <p className="text-gray-600">Decimals: <span className="text-purple-600">{contractData.decimals}</span></p>
          <p className="text-gray-600">
            Total Supply: <span className="text-purple-600">{formatNumber(contractData.totalSupply)} {contractSymbol}</span>
          </p>
          {contractSymbol === "PLSTR" ? (
            <>
              <h3 className="text-lg font-medium mt-4">Bond Addresses</h3>
              {Object.entries(contractData.bondAddresses).map(([bond, address]) => (
                <p key={bond} className="text-gray-600">
                  {bond}: <span className="text-purple-600">{address || "N/A"}</span>
                </p>
              ))}
              <h3 className="text-lg font-medium mt-4">Contract Balances</h3>
              {Object.entries(contractData.balances).map(([token, balance]) => (
                <p key={token} className="text-gray-600">
                  {token.toUpperCase()}: <span className="text-purple-600">{formatNumber(balance)} {token.toUpperCase()}</span>
                </p>
              ))}
            </>
          ) : (
            <>
              <p className="text-gray-600">
                {tokenSymbol} Balance: <span className="text-purple-600">{formatNumber(contractData.tokenBalance)} {tokenSymbol}</span>
              </p>
              <p className="text-gray-600">
                Pair Address: <span className="text-purple-600">{contractData.pairAddress || "N/A"}</span>
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ContractInfo;
