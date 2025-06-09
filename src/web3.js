import Web3 from "web3";

// Contract addresses
export const contractAddresses = {
  369: {
    pBOND: "0x8fA1B65b6a9f18243652b98b46a2F7D01cF82BfB", // pBOND
    iBOND: "0x2F6D3f8ede786f77e00B8047c2bE9C9Ce0034155", // iBOND
    xBOND: "0xFE280c2333BBC2fFb6FfCeb3A003b795C3A77810", // xBOND
    hBOND: "0x4Db135351804a3935b49eeB7DD6AeDd3ac32469E", // hBOND
    PLSTR: "0xDF81C7f777A508C5EBDee1626D03D66576DCA2b4", // PLSTR
  },
};

// Token addresses
export const tokenAddresses = {
  369: {
    PLS: "0xA1077a294dDE1B09bB078844df40758a5D0f9a27", // PLS
    INC: "0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d", // INC
    PLSX: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab", // PLSX
    HEX: "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39", // HEX
  },
};

// Minimal ERC20 ABI for token interactions (approve, allowance, balanceOf)
const ERC20_MINIMAL_ABI = [
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
];

// Token ABIs (using minimal ERC20 ABI for all tokens)
export const plsABI = ERC20_MINIMAL_ABI;
export const incABI = ERC20_MINIMAL_ABI;
export const plsxABI = ERC20_MINIMAL_ABI;
export const hexABI = ERC20_MINIMAL_ABI;

// Contract ABIs
export const pBOND_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "BelowMinimumTransferAmount",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "allowance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSpender",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientContractBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientFee",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientInitialLiquidity",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "IssuancePeriodEnded",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NoPBONDToBurn",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "PairNotSet",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			}
		],
		"name": "SafeERC20FailedOperation",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "SwapFailed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAddress",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAmount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "ContractpBONDBurned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "pair",
				"type": "address"
			}
		],
		"name": "PairAddressSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "feeToContract",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "feeToRecipient",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "sharesToRecipient",
				"type": "uint256"
			}
		],
		"name": "SharesIssued",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "redeemer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "pls",
				"type": "uint256"
			}
		],
		"name": "SharesRedeemed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountAfterTax",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "plsReceived",
				"type": "uint256"
			}
		],
		"name": "TransferTaxApplied",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "pBONDAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "plsReceived",
				"type": "uint256"
			}
		],
		"name": "pBONDSwapped",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "burnContractpBOND",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalanceRatio",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "plsAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "pBONDAmount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalances",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "pBONDBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "plsBalance",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractHealth",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "plsBackingRatio",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "controllerSharePercentage",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractMetrics",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "currentTotalSupply",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "contractPLSBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalMintedShares",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalBurned",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "remainingIssuancePeriod",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getIssuanceStatus",
		"outputs": [
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "timeRemaining",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPLSReserveContributions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "estimatedControllerPLS",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPairAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shareAmount",
				"type": "uint256"
			}
		],
		"name": "getRedeemablePLS",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalBurned",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalPlsFromSwaps",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "plsAmount",
				"type": "uint256"
			}
		],
		"name": "issueShares",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shareAmount",
				"type": "uint256"
			}
		],
		"name": "redeemShares",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "pair",
				"type": "address"
			}
		],
		"name": "setPairAddress",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "swapAccumulatedpBONDToPLS",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

export const iBOND_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "BelowMinimumTransferAmount",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "allowance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSpender",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientContractBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientFee",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientInitialLiquidity",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "IssuancePeriodEnded",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NoIBONDToBurn",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "PairNotSet",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			}
		],
		"name": "SafeERC20FailedOperation",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "SwapFailed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAddress",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAmount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "ContractiBONDBurned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "pair",
				"type": "address"
			}
		],
		"name": "PairAddressSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "feeToContract",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "feeToRecipient",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "sharesToRecipient",
				"type": "uint256"
			}
		],
		"name": "SharesIssued",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "redeemer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "inc",
				"type": "uint256"
			}
		],
		"name": "SharesRedeemed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountAfterTax",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "incReceived",
				"type": "uint256"
			}
		],
		"name": "TransferTaxApplied",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "iBONDAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "incReceived",
				"type": "uint256"
			}
		],
		"name": "iBONDSwapped",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "burnContractiBOND",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalanceRatio",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "incAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "iBONDAmount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalances",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "iBONDBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "incBalance",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractHealth",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "incBackingRatio",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "controllerSharePercentage",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractMetrics",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "currentTotalSupply",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "contractINCBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalMintedShares",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalBurned",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "remainingIssuancePeriod",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getINCReserveContributions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "estimatedControllerINC",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getIssuanceStatus",
		"outputs": [
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "timeRemaining",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPairAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shareAmount",
				"type": "uint256"
			}
		],
		"name": "getRedeemableINC",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalBurned",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalIncFromSwaps",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "incAmount",
				"type": "uint256"
			}
		],
		"name": "issueShares",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shareAmount",
				"type": "uint256"
			}
		],
		"name": "redeemShares",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "pair",
				"type": "address"
			}
		],
		"name": "setPairAddress",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "swapAccumulatediBONDToINC",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

export const xBOND_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "BelowMinimumTransferAmount",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "allowance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSpender",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientContractBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientFee",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientInitialLiquidity",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "IssuancePeriodEnded",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NoXBONDToBurn",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "PairNotSet",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			}
		],
		"name": "SafeERC20FailedOperation",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "SwapFailed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAddress",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAmount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "ContractxBONDBurned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "pair",
				"type": "address"
			}
		],
		"name": "PairAddressSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "feeToContract",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "feeToRecipient",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "sharesToRecipient",
				"type": "uint256"
			}
		],
		"name": "SharesIssued",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "redeemer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "plsx",
				"type": "uint256"
			}
		],
		"name": "SharesRedeemed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountAfterTax",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "plsxReceived",
				"type": "uint256"
			}
		],
		"name": "TransferTaxApplied",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "xBONDAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "plsxReceived",
				"type": "uint256"
			}
		],
		"name": "xBONDSwapped",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "burnContractxBOND",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalanceRatio",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "plsxAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "xBONDAmount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalances",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "xBONDBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "plsxBalance",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractHealth",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "plsxBackingRatio",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "controllerSharePercentage",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractMetrics",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "currentTotalSupply",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "contractPLSXBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalMintedShares",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalBurned",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "remainingIssuancePeriod",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getIssuanceStatus",
		"outputs": [
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "timeRemaining",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPLSXReserveContributions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "estimatedControllerPLSX",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPairAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shareAmount",
				"type": "uint256"
			}
		],
		"name": "getRedeemablePLSX",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalBurned",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalPlsxFromSwaps",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "plsxAmount",
				"type": "uint256"
			}
		],
		"name": "issueShares",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shareAmount",
				"type": "uint256"
			}
		],
		"name": "redeemShares",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "pair",
				"type": "address"
			}
		],
		"name": "setPairAddress",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "swapAccumulatedxBONDToPLSX",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

export const hBOND_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "BelowMinimumTransferAmount",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "allowance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSpender",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientContractBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientFee",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientInitialLiquidity",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "IssuancePeriodEnded",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NoHBONDToBurn",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "PairNotSet",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			}
		],
		"name": "SafeERC20FailedOperation",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "SwapFailed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAddress",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAmount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "ContracthBONDBurned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "pair",
				"type": "address"
			}
		],
		"name": "PairAddressSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "feeToContract",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "feeToRecipient",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "sharesToRecipient",
				"type": "uint256"
			}
		],
		"name": "SharesIssued",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "redeemer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "hexAmount",
				"type": "uint256"
			}
		],
		"name": "SharesRedeemed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountAfterTax",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "hexReceived",
				"type": "uint256"
			}
		],
		"name": "TransferTaxApplied",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "caller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "hBONDAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "hexReceived",
				"type": "uint256"
			}
		],
		"name": "hBONDSwapped",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "burnContracthBOND",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalanceRatio",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "hexAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hBONDAmount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalances",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "hBONDBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hexBalance",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractHealth",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "hexBackingRatio",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "controllerSharePercentage",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractMetrics",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "currentTotalSupply",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "contractHEXBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalMintedShares",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalBurned",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "remainingIssuancePeriod",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getHEXReserveContributions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "estimatedControllerHEX",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getIssuanceStatus",
		"outputs": [
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "timeRemaining",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPairAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shareAmount",
				"type": "uint256"
			}
		],
		"name": "getRedeemableHEX",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalBurned",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalHexFromSwaps",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "hexAmount",
				"type": "uint256"
			}
		],
		"name": "issueShares",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shareAmount",
				"type": "uint256"
			}
		],
		"name": "redeemShares",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "pair",
				"type": "address"
			}
		],
		"name": "setPairAddress",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "swapAccumulatedhBONDToHEX",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

export const PLSTR_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "BondNotSet",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "allowance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "balance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "needed",
				"type": "uint256"
			}
		],
		"name": "ERC20InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "approver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "ERC20InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "ERC20InvalidSpender",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientContractBalance",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NoPendingPLSTR",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotController",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			}
		],
		"name": "SafeERC20FailedOperation",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAddress",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ZeroAmount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "bond",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "bondType",
				"type": "string"
			}
		],
		"name": "BondAddressSet",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "bond",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "holder",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "eventId",
				"type": "uint256"
			}
		],
		"name": "PLSTRClaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "controller",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "bond",
				"type": "address"
			}
		],
		"name": "SharesIssued",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "redeemer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "shares",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "plsx",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "pls",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "inc",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "hexAmount",
				"type": "uint256"
			}
		],
		"name": "SharesRedeemed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "bond",
				"type": "address"
			}
		],
		"name": "claimAllPLSTR",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getBondAddresses",
		"outputs": [
			{
				"internalType": "address",
				"name": "hBOND",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "pBOND",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "iBOND",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "xBOND",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalances",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "plstrBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "plsxBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "plsBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "incBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hexBalance",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractMetrics",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "currentTotalSupply",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "contractPLSXBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "contractPLSBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "contractINCBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "contractHEXBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalMintedShares",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalBurned",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "pendingPLSTRhBOND",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "pendingPLSTRpBOND",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "pendingPLSTRiBOND",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "pendingPLSTRxBOND",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getIssuanceEventCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "bond",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "holder",
				"type": "address"
			}
		],
		"name": "getPendingPLSTR",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "claimablePLSTR",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shareAmount",
				"type": "uint256"
			}
		],
		"name": "getRedeemableAssets",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "plsxAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "plsAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "incAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "hexAmount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalBurned",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalDeposits",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalPlsx",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalPls",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalInc",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalHex",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "issueShares",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "shareAmount",
				"type": "uint256"
			}
		],
		"name": "redeemShares",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "hBOND",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "pBOND",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "iBOND",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "xBOND",
				"type": "address"
			}
		],
		"name": "setBondAddresses",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

// Network configurations
export const networkConfigs = {
  369: {
    chainId: "0x171",
    chainName: "PulseChain",
    rpcUrls: ["https://pulsechain-rpc.publicnode.com"],
    nativeCurrency: { name: "Pulse", symbol: "PLS", decimals: 18 },
    blockExplorerUrls: ["https://otter.pulsechain.com"],
  },
};

export const getWeb3 = async () => {
  if (window.ethereum) {
    try {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("Web3 initialized:", {
        provider: "window.ethereum",
        version: web3.version,
      });
      return web3;
    } catch (error) {
      console.error("Failed to initialize Web3 with provider:", error);
      return null;
    }
  } else if (window.web3) {
    const web3 = new Web3(window.web3.currentProvider);
    console.log("Web3 initialized with legacy provider:", {
      provider: "window.web3",
      version: web3.version,
    });
    return web3;
  } else {
    console.error("No Web3 provider detected");
    return null;
  }
};

export const getContract = async (web3, contractSymbol = "pBOND") => {
  if (!web3) {
    console.error("Web3 is not initialized");
    return null;
  }
  try {
    const chainId = Number(await web3.eth.getChainId());
    if (chainId !== 369) {
      console.error("Only PulseChain (chainId 369) is supported, got:", chainId);
      return null;
    }
    const contractAddress = contractAddresses[369][contractSymbol];
    if (!contractAddress) {
      console.error(`No address found for contract ${contractSymbol} on PulseChain`);
      return null;
    }
    const abi =
      contractSymbol === "pBOND"
        ? pBOND_ABI
        : contractSymbol === "xBOND"
        ? xBOND_ABI
        : contractSymbol === "iBOND"
        ? iBOND_ABI
        : contractSymbol === "hBOND"
        ? hBOND_ABI
        : PLSTR_ABI;
    const contract = new web3.eth.Contract(abi, contractAddress);
    console.log("Contract initialized:", {
      chainId,
      contractAddress,
      contractSymbol,
      abi: abi.slice(0, 2),
    });
    return contract;
  } catch (error) {
    console.error("Failed to initialize contract:", error);
    return null;
  }
};

export const getTokenContract = async (web3, tokenSymbol = "PLS") => {
  if (!web3) {
    console.error("Web3 is not initialized");
    return null;
  }
  try {
    const chainId = Number(await web3.eth.getChainId());
    if (chainId !== 369) {
      console.error("Only PulseChain (chainId 369) is supported, got:", chainId);
      return null;
    }
    const tokenAddress = tokenAddresses[369][tokenSymbol];
    if (!tokenAddress) {
      console.error(`No address found for token ${tokenSymbol} on PulseChain`);
      return null;
    }
    const abi =
      tokenSymbol === "PLS"
        ? plsABI
        : tokenSymbol === "INC"
        ? incABI
        : tokenSymbol === "PLSX"
        ? plsxABI
        : hexABI;
    const tokenContract = new web3.eth.Contract(abi, tokenAddress);
    console.log("Token contract initialized:", {
      chainId,
      tokenAddress,
      tokenSymbol,
      abi: abi.slice(0, 2),
    });
    return tokenContract;
  } catch (error) {
    console.error("Failed to initialize token contract:", error);
    return null;
  }
};

export const getAccount = async (web3) => {
  if (!web3) {
    console.error("Web3 is not initialized");
    return null;
  }
  try {
    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      console.warn("No accounts available");
      return null;
    }
    console.log("Account fetched:", accounts[0]);
    return accounts[0];
  } catch (error) {
    console.error("Failed to fetch account:", error);
    return null;
  }
};
