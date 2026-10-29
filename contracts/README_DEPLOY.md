# 🚀 IPVaultProtocol (v2.0) — Deployment Guide

This directory contains the upgraded, enterprise-grade smart contract:
- **`contracts/IPVaultProtocol.sol`**: An on-chain intellectual property notarization and licensing protocol inspired by **Bernstein.io** and **Story Protocol**.

---

## 🌟 What's New in Protocol v2?

| Feature | v1 (`IPVaultNFT.sol`) | v2 (`IPVaultProtocol.sol`) |
| :--- | :--- | :--- |
| **Integrity Anchor** | Off-chain IPFS only | **On-Chain 256-bit SHA-256 (`bytes32`)** |
| **Prior Art Lookup** | $O(N)$ scan via tokenURI | **$O(1)$ Instant on-chain `verifyPriorArt(hash)`** |
| **Legal Timestamps** | Off-chain string | **Ethereum Consensus Block Timestamps (`uint64`)** |
| **IP Legal Categories** | None | **Patent, Trade Secret, Copyright, Software, Data, Design** |
| **Programmable Licensing** | None | **Story Protocol PIL (All Rights Reserved, Open Innovation, Commercial Royalty)** |
| **Backward Compatibility** | Standard ERC-721 | **Full backward compatibility with v1 `mintIPRecord()`** |

---

## 🛠️ Option 1: Quick Deployment via Remix IDE (Recommended & Free)

1. Open **[Remix IDE](https://remix.ethereum.org)** in your browser.
2. In the File Explorer pane on the left, click **Create New File** and name it `IPVaultProtocol.sol`.
3. Copy and paste the entire contents of [`contracts/IPVaultProtocol.sol`](./IPVaultProtocol.sol) into Remix.
4. On the left navigation bar, switch to the **Solidity Compiler** tab:
   - **Compiler Version:** `0.8.20` (or `0.8.28`)
   - Click **Compile IPVaultProtocol.sol**.
   *(Remix automatically resolves OpenZeppelin v5 imports from npm/GitHub).*
5. Switch to the **Deploy & Run Transactions** tab:
   - **Environment:** Select `Injected Provider - MetaMask`.
   - Make sure your MetaMask is switched to the **Sepolia testnet**.
   - Under **Contract**, select `IPVaultProtocol - contracts/IPVaultProtocol.sol`.
   - Click **Deploy** (Orange button).
6. Confirm the transaction in MetaMask (costs testnet SepoliaETH).
7. Once confirmed, copy your newly deployed contract address from the *"Deployed Contracts"* pane at the bottom!

---

## 🔄 Pointing the Frontend to Your New Protocol Address

Open `src/utils/contract.js` and update line 6 with your new contract address:

```javascript
// src/utils/contract.js
export const CONTRACT_ADDRESS = "0xYOUR_NEW_DEPLOYED_ADDRESS_HERE";
```

The frontend will immediately unlock:
- Direct on-chain SHA-256 registration.
- $O(1)$ sub-second prior art checks.
- On-chain legal IP category filtering.
- Commercial royalty and licensing enforcement.

