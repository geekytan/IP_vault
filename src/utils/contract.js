import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0x79D213bE1810FcBC5F3a118B0461680FA15cB1Bf";

export const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_ipfsHash",
        type: "string",
      },
    ],
    name: "storeHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getMyRecords",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "ipfsHash",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct IPVault.Record[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "records",
    outputs: [
      {
        internalType: "string",
        name: "ipfsHash",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

/**
 * Returns a contract instance connected to a signer (for write operations)
 */
export function getContract(signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Returns a read-only contract instance using a reliable public Sepolia provider
 */
export function getReadOnlyContract() {
  // Try to use window.ethereum if available (no login required for read calls)
  // Otherwise fallback to a reliable public RPC
  let provider;
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
  } else {
    // Using a more reliable public endpoint (Ankr)
    provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
  }
  
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}
