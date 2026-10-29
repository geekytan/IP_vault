# IP VAULT FRONTEND - PROJECT INFORMATION FOR ACADEMIC REPORT

**Important Note:** Use this document together with the reference report (Mahi_Kulkarni_SEM_Report.docx) to generate a comprehensive academic project report for the IP Vault Frontend following the same structure, depth, and formatting of the reference.

---

## 1. PROJECT OVERVIEW

### 1.1 Project Title
**IP Vault: A Blockchain-based Intellectual Property Protection and Access Control System**

### 1.2 Academic Context
- **Course:** Software Engineering & Modeling (SEM)
- **Institution:** AISSMS IOIT, Department of Computer Engineering
- **Year:** S.Y. BTech Engineering (2024-25)
- **Type:** Mini Project Report
- **Duration:** ~4-6 months estimated

### 1.3 Project Summary
IP Vault is a decentralized web application that enables creators to protect their intellectual property by minting it as ERC-721 NFTs on the Ethereum blockchain. The system allows creators to:
- Upload creative work to IPFS (decentralized storage)
- Mint work as Non-Fungible Tokens (NFTs)
- Generate secure access keys
- Share content with viewers
- Manage and transfer IP ownership

Viewers can access shared content using access keys without requiring a blockchain wallet, while the ownership is cryptographically verified on-chain.

---

## 2. PROJECT OBJECTIVES

### 2.1 Primary Objectives
1. **Decentralized IP Protection:** Provide immutable proof of ownership and creation date on blockchain
2. **Easy Access Control:** Enable creators to share IP securely with selective viewers via access keys
3. **No Wallet Requirement for Viewers:** Allow viewers to access content without blockchain knowledge or wallet setup
4. **Seamless Integration:** Combine IPFS storage with blockchain ownership to create a complete Web3 solution
5. **User-Friendly Interface:** Create an intuitive UI for both creators and viewers

### 2.2 Secondary Objectives
- Support ownership transfer of IP
- Track IP history on blockchain
- Provide visual feedback and real-time notifications
- Enable offline-first experience with local storage
- Ensure responsive design across devices

---

## 3. KEY FEATURES

### 3.1 For Creators (Owner Dashboard)
1. **Wallet Connection**
   - MetaMask integration
   - Automatic Sepolia testnet switching
   - Display truncated wallet address
   - One-click disconnect

2. **File Management**
   - Upload files to IPFS via Pinata API
   - Add metadata (description) for each file
   - View upload progress and status notifications

3. **NFT Minting**
   - Mint ERC-721 NFTs in a single transaction
   - Generate metadata automatically
   - Store metadata on IPFS
   - Real-time minting status feedback

4. **Access Key Generation**
   - Generate shareable access keys for each NFT
   - Base64-encoded keys containing token ID
   - One-click copy to clipboard
   - Permanent across page reloads

5. **NFT Management**
   - View all owned NFTs with metadata
   - Transfer NFT ownership to other addresses
   - Archive/unarchive NFTs locally
   - Track NFT history

### 3.2 For Viewers (Viewer Page)
1. **Access Key Input**
   - Paste access key to unlock content
   - Automatic validation and decoding

2. **On-Chain Verification**
   - Verify NFT ownership on blockchain
   - Confirm current owner address
   - Check authenticity of access

3. **Content Display**
   - Show NFT name and description
   - Display original creator/owner address
   - Provide IPFS gateway link
   - Direct access to content

4. **User-Friendly Interface**
   - Locked/unlocked visual states
   - Clear call-to-action buttons
   - No wallet connection required

### 3.3 Additional Features
1. **Toast Notifications:** Real-time feedback for all user actions (success, error, info)
2. **Responsive Design:** Works on desktop and tablets (mobile-optimized later)
3. **Local Storage Persistence:** Remembers archived items and user preferences
4. **Error Handling:** Comprehensive error messages and retry mechanisms
5. **Loading States:** Visual feedback during uploads, minting, and blockchain queries

---

## 4. TECHNOLOGY STACK

### 4.1 Frontend Framework
- **React 19.2.4** - UI component library with hooks API
- **React DOM 19.2.4** - React rendering for web
- **React Scripts 5.0.1** - Create React App build tooling

### 4.2 Web3 & Blockchain Integration
- **ethers.js v6.16.0** - Ethereum library for Web3 interaction
- **MetaMask** - Wallet provider and transaction signer
- **Ethereum Sepolia Testnet** - Testing network (chainId: 0xaa36a7)
- **Smart Contract:** ERC-721 (NonFungibleToken) on Sepolia

### 4.3 Storage & Backend
- **IPFS (Pinata)** - Decentralized file storage and pinning service
- **Pinata API** - Upload files to IPFS
- **Sepolia RPC:** https://rpc.ankr.com/eth_sepolia (fallback provider)

### 4.4 Smart Contract Details
- **Contract Name:** IPVaultNFT
- **Contract Address:** 0x9Ca928Af256F13586436fc5BC57fB74953594Ed1 (on Sepolia)
- **Standard:** ERC-721 + ERC-721URIStorage + ERC-721Enumerable
- **Key Functions:**
  - `mintIPRecord(string metadataCID)` - Mint NFT with metadata
  - `getTokensByOwner(address owner)` - Retrieve owner's NFTs
  - `tokenURI(uint256 tokenId)` - Get metadata IPFS link
  - `ownerOf(uint256 tokenId)` - Get current owner
  - `transferFrom(address from, address to, uint256 tokenId)` - Transfer NFT

### 4.5 Development Tools
- **Node.js & npm** - Package management
- **Create React App** - Project scaffolding
- **Jest & React Testing Library** - Testing frameworks
- **ESLint** - Code quality

---

## 5. SYSTEM ARCHITECTURE

### 5.1 High-Level Architecture
```
Frontend (React)
    ↓
MetaMask Wallet
    ↓
Ethereum Sepolia (Smart Contract)
    ↓
IPFS/Pinata (File Storage)
```

### 5.2 Application Pages & Components

**1. Landing Page (LandingPage.js)**
- Hero section with animated background
- Project overview and "How It Works" section
- Parallax animations with mouse tracking
- Call-to-action buttons for Creator and Viewer roles
- Visual design: Tech badges, animated stars, gradient backgrounds

**2. Owner Dashboard (OwnerDashboard.js)**
- Header with wallet connection status
- File upload section with Pinata integration
- Metadata input form
- NFT minting interface with progress tracking
- Owned NFTs list displaying:
  - NFT metadata (name, description)
  - IPFS hash link
  - Transfer and archive options
- Access key generation and copy functionality
- Real-time toast notifications

**3. Viewer Page (ViewerPage.js)**
- Access key input field
- Unlock button with validation
- Content display section (when unlocked):
  - NFT metadata
  - Current owner address
  - IPFS link to view content
- Locked/unlocked UI states
- Back to landing button

**4. Wallet Connect (WalletConnect.js)**
- MetaMask connection button
- Display connected wallet address (truncated)
- Disconnect functionality

### 5.3 Utilities

**contract.js**
- `getContract(signer)` - Get contract instance for writing (requires signer)
- `getReadOnlyContract()` - Get contract instance for reading (no signer needed)
- Full ABI definition
- Fallback RPC provider setup

**accessKey.js**
- `generateAccessKey(tokenId)` - Encode tokenId to Base64 JSON
- `decodeAccessKey(key)` - Decode and validate access key
- Format: `btoa(JSON.stringify({t: tokenId, v: 2}))`

---

## 6. DATA FLOW & WORKFLOWS

### 6.1 Creator Workflow (NFT Minting)
1. Creator connects MetaMask wallet → Auto-switch to Sepolia
2. Creator uploads file via file input → File sent to Pinata API
3. Pinata stores file → Returns file CID (Content Identifier)
4. Creator enters metadata (description) → App prepares metadata JSON
5. App uploads metadata JSON to Pinata → Returns metadata CID
6. Creator clicks "Mint NFT" → App calls smart contract `mintIPRecord(metadataCID)`
7. MetaMask opens for transaction approval
8. Transaction confirmed → NFT minted on blockchain
9. Success notification → NFT appears in Creator's list
10. Creator generates access key → Shares with viewer

### 6.2 Viewer Workflow (Accessing Content)
1. Viewer receives access key from creator
2. Viewer pastes access key in ViewerPage → Key decoded to extract tokenId
3. App queries smart contract `ownerOf(tokenId)` → Confirms ownership on-chain
4. App fetches metadata from IPFS using `tokenURI(tokenId)`
5. Metadata displayed with creator address and IPFS link
6. Viewer clicks IPFS link → Views content on IPFS gateway

### 6.3 Transfer Workflow
1. Creator navigates to owned NFT
2. Clicks transfer button → Enters recipient address
3. App calls `transferFrom(creator, recipient, tokenId)`
4. MetaMask prompts transaction
5. Transaction confirmed → Ownership transferred on-chain
6. NFT no longer appears in creator's dashboard

---

## 7. FUNCTIONAL REQUIREMENTS (SRS Format)

### 7.1 User Authentication & Wallet Management
- **REQ-1.1** User shall connect MetaMask wallet to access creator features
- **REQ-1.2** System shall automatically switch user's network to Sepolia testnet
- **REQ-1.3** System shall display connected wallet address (truncated format)
- **REQ-1.4** User shall be able to disconnect wallet at any time
- **REQ-1.5** System shall persist wallet connection state across page reloads

### 7.2 File Upload & Storage
- **REQ-2.1** Creator shall upload files up to [size limit] to IPFS via Pinata
- **REQ-2.2** System shall validate file type and size before upload
- **REQ-2.3** System shall display upload progress percentage
- **REQ-2.4** System shall handle upload errors gracefully with retry option
- **REQ-2.5** System shall store file CID for display and reference

### 7.3 NFT Minting
- **REQ-3.1** Creator shall mint NFT by providing file and metadata
- **REQ-3.2** System shall generate metadata JSON and store on IPFS
- **REQ-3.3** System shall call smart contract mintIPRecord function
- **REQ-3.4** System shall display transaction status in real-time
- **REQ-3.5** System shall show success/error notification upon completion
- **REQ-3.6** System shall display minted NFT in creator's owned list

### 7.4 Access Key Generation
- **REQ-4.1** System shall generate Base64-encoded access key for each NFT
- **REQ-4.2** Access key shall contain tokenId and version number
- **REQ-4.3** User shall copy access key to clipboard with one click
- **REQ-4.4** Access key shall be persistent and shareable

### 7.5 Content Access & Verification
- **REQ-5.1** Viewer shall input access key without wallet requirement
- **REQ-5.2** System shall decode and validate access key format
- **REQ-5.3** System shall verify NFT ownership on-chain
- **REQ-5.4** System shall fetch and display NFT metadata from IPFS
- **REQ-5.5** System shall show current owner address
- **REQ-5.6** System shall provide IPFS gateway link to access content

### 7.6 NFT Transfer
- **REQ-6.1** Creator shall transfer NFT to another address
- **REQ-6.2** System shall validate recipient address format
- **REQ-6.3** System shall call smart contract transferFrom function
- **REQ-6.4** System shall update NFT ownership on blockchain

### 7.7 Local Storage & Persistence
- **REQ-7.1** System shall store archived NFT token IDs in localStorage
- **REQ-7.2** System shall restore archived state on page reload
- **REQ-7.3** System shall maintain user preferences (theme, etc.)

### 7.8 User Interface & Notifications
- **REQ-8.1** System shall display toast notifications for all actions
- **REQ-8.2** Notifications shall include success, error, and info states
- **REQ-8.3** System shall auto-dismiss notifications after 3 seconds
- **REQ-8.4** System shall show loading states during async operations

---

## 8. NON-FUNCTIONAL REQUIREMENTS

### 8.1 Performance
- Page load time: < 3 seconds
- File upload: Progress displayed every 1-2 seconds
- NFT minting: Transaction status updated in real-time
- Metadata fetch from IPFS: < 5 seconds

### 8.2 Security
- HTTPS enforcement for all data transmission
- MetaMask wallet signing for transaction authorization
- No private keys stored in browser
- Secure Pinata API key management via environment variables
- Token IDs tied to on-chain verification

### 8.3 Scalability
- Support for multiple NFTs per creator
- Unlimited viewers per access key
- Compatible with multiple blockchain networks (future enhancement)

### 8.4 Reliability
- Fallback RPC provider for blockchain queries
- Error messages guide user remediation
- Retry mechanisms for failed uploads or transactions
- Graceful degradation on network errors

### 8.5 Usability
- Intuitive navigation between creator and viewer roles
- Clear visual feedback for all interactions
- Helpful error messages
- Responsive design for desktop and tablet
- Accessible color scheme and font sizes

### 8.6 Maintainability
- Modular component structure
- Reusable utility functions
- Clear code organization
- Environment-based configuration

---

## 9. SOFTWARE DEVELOPMENT MODEL

**Suggested Model: Agile/Iterative Development with Prototype Approach**

### Phases:
1. **Planning & Requirements:** Define features, user roles, and technical stack
2. **Design:** System architecture, component structure, data flow diagrams
3. **Development:** Build components incrementally, integrate blockchain features
4. **Testing:** Unit testing, integration testing, user acceptance testing
5. **Deployment:** Deploy frontend to hosting, configure contract on testnet
6. **Maintenance:** Monitor, fix bugs, plan enhancements

---

## 10. PROJECT TEAM & ROLES

- **Developer:** [Your Name - Student]
- **Supervisor/Guide:** [Dr. Name - if specified]
- **Department:** Computer Engineering, AISSMS IOIT

---

## 11. FILE STRUCTURE

```
ip-vault-frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── LandingPage.js         (Hero page with role selection)
│   │   ├── LandingPage.css
│   │   ├── OwnerDashboard.js      (Creator interface)
│   │   ├── OwnerDashboard.css
│   │   ├── ViewerPage.js          (Viewer interface)
│   │   ├── ViewerPage.css
│   │   ├── WalletConnect.js       (Wallet UI component)
│   │   └── WalletConnect.css
│   ├── utils/
│   │   ├── contract.js           (Smart contract interaction)
│   │   └── accessKey.js          (Access key encoding/decoding)
│   ├── App.js                     (Main app routing & state)
│   ├── App.css
│   ├── index.js                   (React entry point)
│   ├── index.css
│   └── setupTests.js
├── contracts/
│   └── IPVaultNFT.sol             (ERC-721 smart contract)
├── package.json                   (Dependencies & scripts)
├── README.md                      (Project setup guide)
└── .env                           (Environment variables)
```

---

## 12. KEY TECHNICAL DECISIONS

1. **React Hooks over Class Components:** Modern functional programming approach with useState, useCallback
2. **ethers.js v6:** Latest version for better performance and security
3. **IPFS/Pinata:** Decentralized storage to prevent data loss and ensure immutability
4. **Client-side state management:** Simple setState for app routing and notifications
5. **Local storage:** Used for archiving NFTs and user preferences (no backend database)
6. **Sepolia testnet:** Safe testing environment without real ETH costs

---

## 13. ASSUMPTIONS & CONSTRAINTS

### Assumptions
- Users have MetaMask wallet installed and basic blockchain knowledge (creators)
- Users have stable internet connection
- IPFS/Pinata service is available
- Ethereum Sepolia testnet is operational

### Constraints
- Viewers do not require wallet (access is off-chain permission-based)
- Limited to Sepolia testnet (not production mainnet)
- No backend database (only blockchain + IPFS)
- No built-in user authentication (wallet-based access only)
- Static resource links (no dynamic API fetching of content list)

---

## 14. REFERENCES & STANDARDS

- **ERC-721 Standard:** Non-Fungible Token specification (Solidity)
- **IPFS Documentation:** InterPlanetary File System
- **ethers.js Documentation:** Ethereum library for JavaScript
- **React Documentation:** Component-based UI framework
- **MetaMask Documentation:** Wallet provider

---

## 15. TESTING CONSIDERATIONS

### Black Box Testing (User Perspective)
- Test creator workflow: upload → mint → generate key
- Test viewer workflow: paste key → verify → view content
- Test error handling: invalid inputs, network failures
- Test wallet connection/disconnection
- Test transfer functionality
- Test notifications for all actions

### White Box Testing (Code Level)
- Unit tests for utility functions (generateAccessKey, decodeAccessKey)
- Unit tests for contract interactions
- Component integration tests
- Error case coverage
- Local storage persistence tests

### Test Coverage Target
- Aim for 70%+ code coverage
- Focus on critical paths (minting, access verification)
- Edge case handling (expired keys, unauthorized access)

---

## 16. FUTURE ENHANCEMENTS

1. **Multi-chain support:** Deploy on Ethereum mainnet, Polygon, other chains
2. **Backend database:** Store user profiles, transaction history
3. **Advanced permissions:** Time-limited access, revokable access keys
4. **NFT marketplace:** Buy/sell IP NFTs in-app
5. **Analytics dashboard:** View access statistics, creation dates
6. **Mobile app:** Native iOS/Android support
7. **Advanced search:** Filter NFTs by type, date, creator
8. **Royalty system:** Distribute royalties on secondary sales
9. **DAO governance:** Community voting on platform changes
10. **Integration with other platforms:** OpenSea, Rarible listing

---

## 17. DELIVERABLES FOR REPORT

When generating the report using the reference structure, include:

1. **Certificate:** Project completion and supervision details
2. **Index:** Table of contents with page numbers
3. **Chapter 1 - Introduction:** Project title, objectives, features (1.1-1.4), development model
4. **Chapter 2 - SRS:** Purpose, scope, interfaces, detailed requirements, non-functional requirements
5. **Chapter 3 - Design & Architecture:** Data center architecture, DFD levels (0, 1, 2), call & return architecture
6. **Chapter 4 - UML Diagrams:** Use case, class, sequence, collaboration, activity, component, deployment diagrams
7. **Chapter 5 - Software Metrics:** Function Point Analysis (FPA) calculation, COCOMO cost estimation, effort estimation
8. **Chapter 6 - Software Testing:** Black box test cases with expected outputs, white box test code snippets, code coverage report, UI screenshots
9. **Appendices:** Glossary, TBD list, cost estimation reference tables

---

## 18. HOW TO USE THIS DOCUMENT WITH CLAUDE

### Step 1: Prepare Materials
- This file (PROJECT_INFO_FOR_REPORT.md)
- Reference report (Mahi_Kulkarni_SEM_Report.docx)

### Step 2: Prompt Claude
"Using this project information and the reference report as a template, generate a comprehensive academic project report for IP Vault Frontend following the exact same structure, depth, and formatting. Adapt all content from the reference (Introduction, SRS, Architecture, UML, Metrics, Testing, Appendices) to fit the IP Vault blockchain project. Ensure academic tone, proper numbering, and similar level of detail."

### Step 3: Customize the Output
- Update student name, date, institution details
- Add institution logo if needed
- Insert screenshots of UI when testing section is completed
- Replace or create UML diagrams as needed

---

**End of Project Information Document**

