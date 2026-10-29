import { ethers } from "ethers";

// =============================================
// ⚠️  UPDATE THIS after deploying IPVaultNFT.sol
// =============================================
export const CONTRACT_ADDRESS = "0x9Ca928Af256F13586436fc5BC57fB74953594Ed1";

export const CONTRACT_ABI = [
  // mintIPRecord(string metadataCID) → uint256 (v1 compatibility)
  {
    inputs: [{ internalType: "string", name: "metadataCID", type: "string" }],
    name: "mintIPRecord",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // registerIPRecord (v2 protocol)
  {
    inputs: [
      { internalType: "bytes32", name: "contentHash", type: "bytes32" },
      { internalType: "string", name: "metadataCID", type: "string" },
      { internalType: "uint8", name: "category", type: "uint8" },
      {
        components: [
          { internalType: "uint8", name: "licenseType", type: "uint8" },
          { internalType: "uint16", name: "royaltyBps", type: "uint16" },
          { internalType: "bool", name: "allowCommercialDerivatives", type: "bool" },
          { internalType: "string", name: "licenseURI", type: "string" },
        ],
        internalType: "struct IPVaultProtocol.LicenseTerms",
        name: "licensing",
        type: "tuple",
      },
      { internalType: "bool", name: "isEncrypted", type: "bool" },
    ],
    name: "registerIPRecord",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // verifyPriorArt (v2 protocol)
  {
    inputs: [{ internalType: "bytes32", name: "contentHash", type: "bytes32" }],
    name: "verifyPriorArt",
    outputs: [
      { internalType: "bool", name: "isRegistered", type: "bool" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint64", name: "registrationTimestamp", type: "uint64" },
      { internalType: "uint8", name: "category", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // isHashRegistered(bytes32) → bool
  {
    inputs: [{ internalType: "bytes32", name: "contentHash", type: "bytes32" }],
    name: "isHashRegistered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // getTokenByHash(bytes32) → uint256
  {
    inputs: [{ internalType: "bytes32", name: "contentHash", type: "bytes32" }],
    name: "getTokenByHash",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getTokensByOwner(address) → uint256[]
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "getTokensByOwner",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  // tokenURI(uint256 tokenId) → string
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  // ownerOf(uint256 tokenId) → address
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // balanceOf(address) → uint256
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // totalSupply() → uint256
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // tokenByIndex(uint256) → uint256
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "tokenByIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // transferFrom(address from, address to, uint256 tokenId)
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Event: IPRecordMinted
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "string", name: "metadataCID", type: "string" },
    ],
    name: "IPRecordMinted",
    type: "event",
  },
  // Event: IPRecordRegistered (v2)
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: true, internalType: "bytes32", name: "contentHash", type: "bytes32" },
      { indexed: false, internalType: "uint8", name: "category", type: "uint8" },
      { indexed: false, internalType: "uint64", name: "timestamp", type: "uint64" },
      { indexed: false, internalType: "bool", name: "isEncrypted", type: "bool" },
    ],
    name: "IPRecordRegistered",
    type: "event",
  },
];

export const IP_CATEGORIES = [
  { id: 1, key: "PatentPriorArt", label: "🔬 Patent & Technical Invention", desc: "Novel apparatus, algorithms, or technical design disclosures" },
  { id: 2, key: "TradeSecret", label: "🔒 Confidential Know-How & Formula", desc: "Proprietary trade secrets protected via zero-knowledge proofs" },
  { id: 3, key: "CopyrightCreative", label: "🎨 Creative, Media & Literary Work", desc: "Written compositions, whitepapers, artwork, multimedia" },
  { id: 4, key: "SoftwareSourceCode", label: "💻 Software & Protocol Source Code", desc: "Smart contracts, repositories, and computational logic" },
  { id: 5, key: "ScientificData", label: "📊 Research Dataset & Empirical Proof", desc: "Laboratory records, empirical data, experimental results" },
  { id: 6, key: "DesignTrademark", label: "📐 Industrial Design & Trademark", desc: "CAD designs, industrial architecture, brand identity assets" },
];

export const LICENSE_TYPES = [
  { id: 0, key: "AllRightsReserved", label: "🚫 All Rights Reserved (Strict Proprietary)", desc: "No commercial reuse or distribution permitted" },
  { id: 1, key: "OpenInnovation", label: "🏛️ Open Innovation (Academic & Non-Commercial)", desc: "Free academic and non-commercial research reproduction" },
  { id: 2, key: "CommercialPermitted", label: "💼 Commercialization Permitted (Royalty-Bearing)", desc: "Commercial exploitation permitted with stipulated royalty" },
  { id: 3, key: "CreativeCommonsBy", label: "🌐 Creative Commons (CC-BY 4.0 Attribution)", desc: "Free reuse and derivatives with mandatory attribution" },
  { id: 5, key: "PublicDomainDefensive", label: "🛡️ Defensive Publication (Public Domain)", desc: "Open publication to preempt rival patent claims" },
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
  try {
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  } catch (err) {
    if (typeof window !== "undefined" && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }
    throw err;
  }
}
