// src/components/LiquidityActions.jsx
import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const LiquidityActions = ({ contract, account, web3, chainId }) => {
  const [xBONDAmount, setXBONDAmount] = useState("0");
  const [lpTokenAmount, setLpTokenAmount] = useState("0");
  const [poolAddress, setPoolAddress] = useState("");
  const [poolXBONDAmount, setPoolXBONDAmount] = useState("0");
  const [poolPlsxAmount, setPoolPlsxAmount] = useState("0");
  const [poolDepthRatio, setPoolDepthRatio] = useState("0");
  const [initAmount, setInitAmount] = useState("");
  const [displayInitAmount, setDisplayInitAmount] = useState("");
  const [nextWithdrawalTime, setNextWithdrawalTime] = useState(0);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [loadingSwap, setLoadingSwap] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
  const [error, setError] = useState("");

  const PLSX_ADDRESS = "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab";
  const PULSEX_FACTORY = "0x29eA7545DEf87022BAdc76323F373EA1e707C523";
  const CONTROLLER_ADDRESS = "0x6aaE8556C69b795b561CB75ca83aF6187d2F0AF5";
  const MIN_INIT_AMOUNT = 10;
  const WITHDRAWAL_PERIOD = 90 * 24 * 60 * 60; // 90 days in seconds
  const BLOCK_RANGE = 1_000_000; // Last 1M blocks for event fetching

  // PLSX contract instance
  const plsxContract = web3 && new web3.eth.Contract(
    [
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
      },
      {
        constant: false,
        inputs: [
          { name: "_spender", type: "address" },
          { name: "_value", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "success", type: "bool" }],
        type: "function",
      },
    ],
    PLSX_ADDRESS
  );

  const fetchInfo = async () => {
    try {
      setError("");
      if (!contract || !web3 || !account) {
        throw new Error("Contract, Web3, or account not initialized");
      }

      // Fetch contract balances
      try {
        const balances = await contract.methods.getContractBalances().call();
        setXBONDAmount(web3.utils.fromWei(balances[0]?.toString() || "0", "ether"));
        setLpTokenAmount(web3.utils.fromWei(balances[2]?.toString() || "0", "ether"));
      } catch (err) {
        console.error("Failed to fetch contract balances:", err);
        setError("Failed to fetch contract balances");
      }

      // Fetch pool address via PulseX Factory
      let pairAddr = "0x0000000000000000000000000000000000000000";
      try {
        const factoryContract = new web3.eth.Contract(
          [
            {
              inputs: [
                { internalType: "address", name: "tokenA", type: "address" },
                { internalType: "address", name: "tokenB", type: "address" },
              ],
              name: "getPair",
              outputs: [{ internalType: "address", name: "pair", type: "address" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          PULSEX_FACTORY
        );
        const xBONDAddress = contract._address;
        const token0 = xBONDAddress < PLSX_ADDRESS ? xBONDAddress : PLSX_ADDRESS;
        const token1 = xBONDAddress < PLSX_ADDRESS ? PLSX_ADDRESS : xBONDAddress;
        pairAddr = await factoryContract.methods.getPair(token0, token1).call();
        setPoolAddress(pairAddr);
      } catch (err) {
        console.error("Failed to fetch pool address:", err);
        setError("Failed to fetch pool address");
      }

      // Fetch pool reserves
      if (pairAddr !== "0x0000000000000000000000000000000000000000") {
        try {
          const pairContract = new web3.eth.Contract(
            [
              {
                inputs: [],
                name: "getReserves",
                outputs: [
                  { internalType: "uint112", name: "reserve0", type: "uint112" },
                  { internalType: "uint112", name: "reserve1", type: "uint112" },
                  { internalType: "uint32", name: "blockTimestampLast", type: "uint32" },
                ],
                stateMutability: "view",
                type: "function",
              },
              {
                inputs: [],
                name: "token0",
                outputs: [{ internalType: "address", name: "", type: "address" }],
                stateMutability: "view",
                type: "function",
              },
            ],
            pairAddr
          );
          const { reserve0, reserve1 } = await pairContract.methods.getReserves().call();
          const token0Addr = await pairContract.methods.token0().call();
          const isXBONDToken0 = token0Addr.toLowerCase() === xBONDAddress.toLowerCase();
          const xBONDAmt = isXBONDToken0 ? reserve0 : reserve1;
          const plsxAmt = isXBONDToken0 ? reserve1 : reserve0;
          setPoolXBONDAmount(web3.utils.fromWei(xBONDAmt?.toString() || "0", "ether"));
          setPoolPlsxAmount(web3.utils.fromWei(plsxAmt?.toString() || "0", "ether"));
          const xBONDAmtNum = parseFloat(web3.utils.fromWei(xBONDAmt?.toString() || "0", "ether"));
          const plsxAmtNum = parseFloat(web3.utils.fromWei(plsxAmt?.toString() || "0", "ether"));
          const ratio = xBONDAmtNum > 0 ? plsxAmtNum / xBONDAmtNum : 0;
          setPoolDepthRatio(formatNumber(ratio));
        } catch (err) {
          console.error("Failed to fetch pool reserves:", err);
          setError("Failed to fetch pool reserves");
        }
      }

      // Fetch latest LiquidityWithdrawn event
      try {
        const latestBlock = await web3.eth.getBlockNumber();
        const fromBlock = Math.max(0, Number(latestBlock.toString()) - BLOCK_RANGE);
        const filter = contract.filters?.LiquidityWithdrawn(account);
        if (!filter) {
          throw new Error("Failed to create LiquidityWithdrawn filter");
        }
        const events = await contract.queryFilter(filter, fromBlock, "latest");
        const lastEvent = events[events.length - 1];
        const lastTimestamp = lastEvent ? Number(lastEvent.args?.timestamp?.toString() || 0) : 0;
        setNextWithdrawalTime(lastTimestamp ? lastTimestamp + WITHDRAWAL_PERIOD : 0);
        console.log("LiquidityWithdrawn events:", events);
      } catch (err) {
        console.error("Failed to fetch LiquidityWithdrawn events:", err);
        setError("Failed to fetch withdrawal events");
      }

      console.log("Fetched info:", {
        xBONDAmount,
        lpTokenAmount,
        poolAddress: pairAddr,
        poolXBONDAmount,
        poolPlsxAmount,
        poolDepthRatio,
        nextWithdrawalTime,
      });
    } catch (err) {
      console.error("Failed to fetch info:", err);
      setError(`Failed to load data: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (contract && account && web3 && chainId === 369) {
      fetchInfo();
    }
  }, [contract, account, web3, chainId]);

  const handleWithdrawLiquidity = async () => {
    setLoadingWithdraw(true);
    setError("");
    try {
      if (!contract) throw new Error("Contract not initialized");
      await contract.methods.withdrawLiquidity().send({ from: account });
      alert("Liquidity withdrawn successfully!");
      fetchInfo();
      console.log("Liquidity withdrawn");
    } catch (err) {
      let errorMessage = `Error withdrawing liquidity: ${err.message || "Unknown error"}`;
      if (err.message.includes("InsufficientLiquidity")) {
        errorMessage = "Insufficient liquidity to withdraw.";
      } else if (err.message.includes("WithdrawalPeriodNotElapsed")) {
        errorMessage = "Withdrawal not available yet (90-day period).";
      }
      setError(errorMessage);
      console.error("Withdraw liquidity error:", err);
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const handleSwapXBONDToPLSX = async () => {
    setLoadingSwap(true);
    setError("");
    try {
      if (!contract) throw new Error("Contract not initialized");
      await contract.methods.swapAccumulatedxBONDToPLSX().send({ from: account });
      alert("xBOND swapped to PLSX successfully!");
      fetchInfo();
      console.log("xBOND swapped to PLSX");
    } catch (err) {
      let errorMessage = `Error swapping xBOND to PLSX: ${err.message || "Unknown error"}`;
      if (err.message.includes("ZeroAmount")) {
        errorMessage = "No xBOND available to swap.";
      } else if (err.message.includes("InsufficientLiquidity")) {
        errorMessage = "Swap output too low.";
      }
      setError(errorMessage);
      console.error("Swap error:", err);
    } finally {
      setLoadingSwap(false);
    }
  };

  const handleInitAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, "");
    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      setInitAmount(rawValue);
      setDisplayInitAmount(
        rawValue === ""
          ? ""
          : new Intl.NumberFormat("en-US", {
              maximumFractionDigits: 18,
              minimumFractionDigits: 0,
            }).format(Number(rawValue))
      );
    }
  };

  const handleInitializePool = async () => {
    setLoadingInit(true);
    setError("");
    try {
      if (!contract || !plsxContract) throw new Error("Contract or PLSX contract not initialized");
      const amountNum = Number(initAmount);
      if (amountNum < MIN_INIT_AMOUNT) {
        throw new Error(`Amount must be at least ${MIN_INIT_AMOUNT} PLSX`);
      }
      const amountWei = web3.utils.toWei(initAmount, "ether");
      await plsxContract.methods
        .approve(contract._address, amountWei)
        .send({ from: account });
      await contract.methods.initializePool(amountWei).send({ from: account });
      alert("Pool initialized successfully!");
      setInitAmount("");
      setDisplayInitAmount("");
      fetchInfo();
      console.log("Pool initialized:", { amountWei });
    } catch (err) {
      let errorMessage = `Error initializing pool: ${err.message || "Unknown error"}`;
      if (err.message.includes("InsufficientAllowance")) {
        errorMessage = "Insufficient PLSX allowance.";
      } else if (err.message.includes("InsufficientInitialLiquidity")) {
        errorMessage = `Amount must be at least ${MIN_INIT_AMOUNT} PLSX.`;
      }
      setError(errorMessage);
      console.error("Initialize pool error:", err);
    } finally {
      setLoadingInit(false);
    }
  };

  const getWithdrawalStatus = () => {
    if (!nextWithdrawalTime) return "No withdrawals yet";
    const now = Math.floor(Date.now() / 1000);
    if (now >= nextWithdrawalTime) return "Withdrawal Available";
    const secondsLeft = nextWithdrawalTime - now;
    const days = Math.floor(secondsLeft / 86400);
    const hours = Math.floor((secondsLeft % 86400) / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    return `Next Withdrawal in ${days}d ${hours}h ${minutes}m`;
  };

  if (chainId !== 369) return null;

  const isController = account?.toLowerCase() === CONTROLLER_ADDRESS.toLowerCase();

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Liquidity Actions</h2>
      {isController && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Initialize Pool</h3>
          <input
            type="text"
            value={displayInitAmount}
            onChange={handleInitAmountChange}
            placeholder="Enter PLSX amount"
            className="w-full p-2 border rounded-lg mb-2"
          />
          <p className="text-sm text-gray-600 mb-2">
            Minimum <span className="text-purple-600">{MIN_INIT_AMOUNT} PLSX</span>
          </p>
          <button
            onClick={handleInitializePool}
            disabled={loadingInit || !initAmount || Number(initAmount) < MIN_INIT_AMOUNT || !contract}
            className="btn-primary w-full"
          >
            {loadingInit ? "Processing..." : "Initialize Pool"}
          </button>
        </div>
      )}
      <div className="mb-4">
        <p className="text-gray-600 mb-1">
          <strong>Withdrawal Status:</strong> {getWithdrawalStatus()}
        </p>
        <p className="text-gray-600 mb-1">
          <strong>Pool Address:</strong>{" "}
          {poolAddress === "0x0000000000000000000000000000000000000000" ? (
            "Not initialized"
          ) : (
            <a
              href={`https://scan.pulsechain.com/address/${poolAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              {poolAddress.slice(0, 6)}...{poolAddress.slice(-4)}
            </a>
          )}
        </p>
        <p className="text-gray-600 mb-1">
          <strong>Pool xBOND Amount:</strong> {formatNumber(poolXBONDAmount)} xBOND
        </p>
        <p className="text-gray-600 mb-1">
          <strong>Pool PLSX Amount:</strong> {formatNumber(poolPlsxAmount)} PLSX
        </p>
        <p className="text-gray-600 mb-1">
          <strong>Pool Depth Ratio:</strong> {poolDepthRatio} PLSX/xBOND
        </p>
        <p className="text-gray-600 mb-2">
          <strong>Held LP Tokens:</strong> {formatNumber(lpTokenAmount)} LP
        </p>
        <button
          onClick={handleWithdrawLiquidity}
          disabled={loadingWithdraw || (nextWithdrawalTime > 0 && Math.floor(Date.now() / 1000) < nextWithdrawalTime) || !contract}
          className="btn-primary w-full"
          title={nextWithdrawalTime > 0 && Math.floor(Date.now() / 1000) < nextWithdrawalTime ? "Withdrawal not available yet" : !contract ? "Contract not initialized" : ""}
        >
          {loadingWithdraw ? "Processing..." : "Withdraw Liquidity"}
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleSwapXBONDToPLSX}
          disabled={loadingSwap || Number(xBONDAmount) <= 0 || !contract}
          className="btn-primary w-full"
          title={Number(xBONDAmount) <= 0 ? "No xBOND available to swap" : !contract ? "Contract not initialized" : ""}
        >
          {loadingSwap ? "Processing..." : "Swap xBOND to PLSX"}
        </button>
        <p className="text-gray-600">
          <strong>Available:</strong> {formatNumber(xBONDAmount)} xBOND
        </p>
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default LiquidityActions;
