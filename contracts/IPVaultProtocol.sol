// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

/**
 * @title IPVaultProtocol (v2.0)
 * @notice Enterprise-grade Decentralized Intellectual Property Protocol & Cryptographic Registry.
 *         Architected after Bernstein.io and Story Protocol standards.
 *
 * @dev Key Innovations:
 *   1. On-Chain Cryptographic Integrity Anchor:
 *      Stores 256-bit SHA-256 content hashes directly in contract storage (bytes32).
 *      Enables O(1) instant on-chain Prior Art verification without IPFS roundtrips.
 *   2. Immutable Block Consensus Timestamps:
 *      Enforces legal timestamping anchored by Ethereum block consensus for US DTSA & EU 2016/943 evidentiary proof.
 *   3. Granular IP Categorization:
 *      Classifies assets across Patents, Trade Secrets, Copyrights, Software Code, Scientific Data, and CAD Designs.
 *   4. Programmable Licensing & Commercial Terms:
 *      On-chain licensing metadata inspired by Story Protocol's Programmable IP License (PIL).
 */
contract IPVaultProtocol is ERC721Enumerable, ERC721URIStorage {

    // ─────────────────────────────────────────────
    // ENUMS & DATA STRUCTURES
    // ─────────────────────────────────────────────

    enum IPCategory {
        Unspecified,        // 0: General IP Asset
        PatentPriorArt,     // 1: Patent disclosures, technical inventions, schematics
        TradeSecret,        // 2: Zero-knowledge confidential know-how, formulas
        CopyrightCreative,  // 3: Literary, artistic works, media, whitepapers
        SoftwareSourceCode, // 4: Cryptographic proof of source code authorship
        ScientificData,     // 5: Lab datasets, clinical trials, empirical observations
        DesignTrademark     // 6: Brand identity, industrial CAD models, UI/UX
    }

    enum LicenseType {
        AllRightsReserved,       // 0: Strict proprietary ownership, no unauthorized reuse
        OpenInnovation,          // 1: Academic & non-commercial research permitted
        CommercialPermitted,     // 2: Commercial reuse allowed under royalty conditions
        CreativeCommonsBy,       // 3: CC-BY 4.0 Standard Attribution
        ExclusiveCommercial,     // 4: Exclusive commercial exploitation rights
        PublicDomainDefensive    // 5: Defensive publication into the public domain
    }

    struct LicenseTerms {
        LicenseType licenseType;
        uint16 royaltyBps;                  // Basis points (e.g. 250 = 2.5%, 1000 = 10%)
        bool allowCommercialDerivatives;
        string licenseURI;                  // IPFS URI to legal contractual terms
    }

    struct IPRecord {
        uint256 tokenId;
        address creator;
        bytes32 contentHash;                // SHA-256 digest of original asset
        string metadataURI;                 // IPFS CID containing metadata JSON
        uint64 registrationTimestamp;       // Block timestamp (Unix seconds)
        uint64 blockNumber;                 // Ethereum block number
        IPCategory category;
        LicenseTerms licensing;
        bool isEncrypted;                   // True if zero-knowledge encrypted (AES-256-GCM)
    }

    // ─────────────────────────────────────────────
    // STATE VARIABLES
    // ─────────────────────────────────────────────

    uint256 private _nextTokenId;

    // Token ID => Complete On-Chain IP Record
    mapping(uint256 => IPRecord) private _records;

    // SHA-256 Digest => Token ID (for O(1) instant prior art verification)
    mapping(bytes32 => uint256) private _hashToTokenId;

    // SHA-256 Digest => Existence flag
    mapping(bytes32 => bool) private _isHashRegistered;

    // ─────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────

    event IPRecordRegistered(
        uint256 indexed tokenId,
        address indexed creator,
        bytes32 indexed contentHash,
        IPCategory category,
        uint64 timestamp,
        bool isEncrypted
    );

    event LicenseTermsUpdated(
        uint256 indexed tokenId,
        LicenseType licenseType,
        uint16 royaltyBps,
        bool allowCommercialDerivatives,
        string licenseURI
    );

    // ─────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() ERC721("IP Vault Protocol", "IPVP") {}

    // ─────────────────────────────────────────────
    // CORE MINTING & REGISTRATION
    // ─────────────────────────────────────────────

    /**
     * @notice Registers and mints an intellectual property record with on-chain cryptographic proof.
     * @param contentHash The 32-byte SHA-256 digest of the original file (e.g. bytes32(0x...)).
     * @param metadataCID The IPFS CID pointing to the asset's decentralized metadata JSON.
     * @param category The IP categorization (Patent, Trade Secret, Copyright, etc.).
     * @param licensing The initial licensing and royalty terms.
     * @param isEncrypted Whether client-side AES-256-GCM encryption was applied.
     * @return tokenId The newly assigned sequential token ID.
     */
    function registerIPRecord(
        bytes32 contentHash,
        string calldata metadataCID,
        IPCategory category,
        LicenseTerms calldata licensing,
        bool isEncrypted
    ) external returns (uint256) {
        require(contentHash != bytes32(0), "IPVault: contentHash cannot be zero");
        require(bytes(metadataCID).length > 0, "IPVault: metadataCID cannot be empty");
        require(!_isHashRegistered[contentHash], "IPVault: Content hash already registered in prior art registry");

        uint256 tokenId = _nextTokenId++;

        // Mint ERC-721 token to sender
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataCID);

        // Store full on-chain record
        _records[tokenId] = IPRecord({
            tokenId: tokenId,
            creator: msg.sender,
            contentHash: contentHash,
            metadataURI: metadataCID,
            registrationTimestamp: uint64(block.timestamp),
            blockNumber: uint64(block.number),
            category: category,
            licensing: licensing,
            isEncrypted: isEncrypted
        });

        // Index hash for O(1) reverse lookup
        _hashToTokenId[contentHash] = tokenId;
        _isHashRegistered[contentHash] = true;

        emit IPRecordRegistered(
            tokenId,
            msg.sender,
            contentHash,
            category,
            uint64(block.timestamp),
            isEncrypted
        );

        return tokenId;
    }

    /**
     * @notice Backward-compatible minting helper matching v1 interface.
     * @param metadataCID The IPFS CID of the metadata JSON.
     * @return tokenId The newly minted token ID.
     */
    function mintIPRecord(string memory metadataCID) public returns (uint256) {
        LicenseTerms memory defaultLicense = LicenseTerms({
            licenseType: LicenseType.AllRightsReserved,
            royaltyBps: 0,
            allowCommercialDerivatives: false,
            licenseURI: ""
        });

        bytes32 syntheticHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, metadataCID));

        return this.registerIPRecord(
            syntheticHash,
            metadataCID,
            IPCategory.Unspecified,
            defaultLicense,
            false
        );
    }

    // ─────────────────────────────────────────────
    // PRIOR ART & INTEGRITY VERIFICATION
    // ─────────────────────────────────────────────

    /**
     * @notice O(1) Instant Prior Art verification on-chain.
     * @param contentHash The 32-byte SHA-256 fingerprint of the file.
     * @return isRegistered True if this exact file exists in the registry.
     * @return tokenId The matching ERC-721 token ID.
     * @return creator The original registering author address.
     * @return registrationTimestamp The exact block timestamp of registration.
     * @return category The categorized legal domain of the IP.
     */
    function verifyPriorArt(bytes32 contentHash) external view returns (
        bool isRegistered,
        uint256 tokenId,
        address creator,
        uint64 registrationTimestamp,
        IPCategory category
    ) {
        if (!_isHashRegistered[contentHash]) {
            return (false, 0, address(0), 0, IPCategory.Unspecified);
        }

        uint256 tId = _hashToTokenId[contentHash];
        IPRecord storage rec = _records[tId];

        return (
            true,
            rec.tokenId,
            rec.creator,
            rec.registrationTimestamp,
            rec.category
        );
    }

    /**
     * @notice Checks if a cryptographic SHA-256 hash has already been registered.
     */
    function isHashRegistered(bytes32 contentHash) external view returns (bool) {
        return _isHashRegistered[contentHash];
    }

    /**
     * @notice Retrieves the token ID for a registered SHA-256 content hash.
     */
    function getTokenByHash(bytes32 contentHash) external view returns (uint256) {
        require(_isHashRegistered[contentHash], "IPVault: Hash not registered");
        return _hashToTokenId[contentHash];
    }

    /**
     * @notice Retrieves the full on-chain IP record.
     */
    function getIPRecord(uint256 tokenId) external view returns (IPRecord memory) {
        require(_ownerOf(tokenId) != address(0), "IPVault: Nonexistent token");
        return _records[tokenId];
    }

    // ─────────────────────────────────────────────
    // LICENSING MANAGEMENT
    // ─────────────────────────────────────────────

    /**
     * @notice Updates commercial terms and licensing for an intellectual property asset.
     *         Callable only by current token owner or authorized operator.
     */
    function updateLicenseTerms(uint256 tokenId, LicenseTerms calldata newLicensing) external {
        address tokenOwner = ownerOf(tokenId);
        require(
            msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender) || getApproved(tokenId) == msg.sender,
            "IPVault: Caller is not owner nor authorized"
        );

        _records[tokenId].licensing = newLicensing;

        emit LicenseTermsUpdated(
            tokenId,
            newLicensing.licenseType,
            newLicensing.royaltyBps,
            newLicensing.allowCommercialDerivatives,
            newLicensing.licenseURI
        );
    }

    // ─────────────────────────────────────────────
    // OWNER QUERIES
    // ─────────────────────────────────────────────

    /**
     * @notice Get all token IDs owned by an address.
     */
    function getTokensByOwner(address owner) public view returns (uint256[] memory) {
        uint256 count = balanceOf(owner);
        uint256[] memory tokens = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokens;
    }

    // ─────────────────────────────────────────────
    // REQUIRED OVERRIDES
    // ─────────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Enumerable, ERC721)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Enumerable, ERC721)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage, ERC721)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

