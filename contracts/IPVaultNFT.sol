// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

/**
 * @title IPVaultNFT
 * @dev ERC-721 NFT contract for IP Vault.
 *      Each minted token represents an IP record with metadata stored on IPFS.
 *      Token URI = IPFS CID pointing to a JSON metadata file.
 *
 *      Metadata JSON format (pinned to IPFS via Pinata):
 *      {
 *        "name": "filename.pdf",
 *        "description": "My important document",
 *        "fileCID": "QmXyz...",       // the actual file on IPFS
 *        "type": "IP_VAULT_METADATA_V1"
 *      }
 */
contract IPVaultNFT is ERC721Enumerable, ERC721URIStorage {
    uint256 private _nextTokenId;

    // Event emitted when a new IP record is minted
    event IPRecordMinted(address indexed owner, uint256 indexed tokenId, string metadataCID);

    constructor() ERC721("IP Vault NFT", "IPVN") {}

    /**
     * @dev Mint a new IP record NFT.
     * @param metadataCID The IPFS CID of the metadata JSON file.
     * @return tokenId The ID of the newly minted token.
     */
    function mintIPRecord(string memory metadataCID) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataCID);
        emit IPRecordMinted(msg.sender, tokenId, metadataCID);
        return tokenId;
    }

    /**
     * @dev Get all token IDs owned by an address.
     * @param owner The wallet address to query.
     * @return An array of token IDs owned by the address.
     */
    function getTokensByOwner(address owner) public view returns (uint256[] memory) {
        uint256 count = balanceOf(owner);
        uint256[] memory tokens = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokens;
    }

    // ========== Required Overrides ==========
    // Solidity requires us to explicitly resolve conflicts between
    // ERC721Enumerable and ERC721URIStorage since both extend ERC721.

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
