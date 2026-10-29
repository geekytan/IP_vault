import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import WalletConnect from "./WalletConnect";
import { getContract } from "../utils/contract";
import { generateAccessKey, saveLocalAssetKey, getLocalAssetKey } from "../utils/accessKey";
import { computeSHA256, encryptFile } from "../utils/crypto";
import { fetchIPFSJSON } from "../utils/ipfs";
import CertificateModal from "./CertificateModal";
import "./OwnerDashboard.css";

function OwnerDashboard({ onBack, onToast }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [cid, setCid] = useState("");
  const [description, setDescription] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [isEncryptedMode, setIsEncryptedMode] = useState(true);
  const [stagedEncryptionKeys, setStagedEncryptionKeys] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedCertToken, setSelectedCertToken] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState(() => {
    const saved = localStorage.getItem("archived_tokens");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("archived_tokens", JSON.stringify(archivedIds));
  }, [archivedIds]);

  const handleArchive = (tokenId) => {
    if (window.confirm("Archive this NFT? It will be hidden from the active list.")) {
      setArchivedIds([...archivedIds, tokenId]);
      onToast("NFT moved to Archive", "info");
    }
  };

  const handleUnarchive = (tokenId) => {
    setArchivedIds(archivedIds.filter((id) => id !== tokenId));
    onToast("NFT restored to Active", "success");
  };

  // ---- Handle File Selection & Immediate SHA-256 Fingerprint ----
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setCid("");
    setStagedEncryptionKeys(null);

    try {
      // Calculate cryptographic SHA-256 fingerprint in-browser
      onToast("Computing zero-knowledge SHA-256 digest…", "info");
      const { hex } = await computeSHA256(file);
      setFileHash(hex);
      onToast("Fingerprint computed! Ready to encrypt & upload.", "success");
    } catch (err) {
      console.error("Hash calculation error:", err);
      onToast("Failed to compute file fingerprint", "error");
    }
  };

  // ---- Encrypt & Upload to IPFS ----
  const handleUploadToIPFS = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      let uploadFile;

      if (isEncryptedMode) {
        onToast("🔒 Encrypting file with AES-256-GCM in browser…", "info");
        const encResult = await encryptFile(selectedFile);
        uploadFile = new File(
          [encResult.encryptedBlob],
          `encrypted_${selectedFile.name}.bin`,
          { type: "application/octet-stream" }
        );

        setStagedEncryptionKeys({
          keyBase64: encResult.keyBase64,
          ivBase64: encResult.ivBase64,
          sha256Hex: encResult.sha256Hex,
          name: selectedFile.name,
        });
      } else {
        uploadFile = selectedFile;
        setStagedEncryptionKeys(null);
      }

      onToast("Pinning payload to IPFS via Pinata…", "info");
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        },
        body: formData,
      });

      const resData = await res.json();
      if (resData.IpfsHash) {
        setCid(resData.IpfsHash);
        onToast(
          isEncryptedMode
            ? "🛡️ Encrypted ciphertext pinned! Ready to mint."
            : "File pinned! Ready to mint.",
          "success"
        );
      } else {
        throw new Error("Upload failed: No IPFS hash returned");
      }
    } catch (error) {
      console.error("IPFS upload error:", error);
      onToast("IPFS upload failed. Please verify Pinata credentials.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Wallet Connection ----
  const connectWallet = async () => {
    if (!window.ethereum) {
      onToast("Please install MetaMask to continue!", "error");
      return;
    }

    setIsConnecting(true);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = getContract(signer);

      setContract(contractInstance);
      setAccount(accounts[0]);
      onToast("Wallet connected successfully!", "success");
    } catch (error) {
      console.error(error);
      onToast("Failed to connect wallet", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setTokens([]);
    onToast("Wallet disconnected", "info");
  };

  // ---- Fetch Tokens ----
  const fetchTokens = useCallback(async () => {
    if (!contract || !account) return;

    try {
      const tokenIds = await contract.getTokensByOwner(account);
      const tokenData = await Promise.all(
        tokenIds.map(async (id) => {
          const tokenId = Number(id);
          const metadataCID = await contract.tokenURI(tokenId);

          let metadata = null;
          try {
            metadata = await fetchIPFSJSON(metadataCID);
          } catch (e) {
            console.warn(`Could not fetch metadata for token #${tokenId}`, e);
          }

          const localKey = getLocalAssetKey(tokenId);

          return { tokenId, metadataCID, metadata, hasLocalKey: Boolean(localKey) };
        })
      );

      setTokens(tokenData);
    } catch (error) {
      console.error(error);
      onToast("Failed to fetch NFTs", "error");
    }
  }, [contract, account, onToast]);

  useEffect(() => {
    if (contract && account) {
      fetchTokens();
    }
  }, [contract, account, fetchTokens]);

  // ---- Mint NFT ----
  const mintNFT = async () => {
    if (!contract) return onToast("Connect wallet first", "error");
    if (!cid.trim()) return onToast("Upload a file or enter CID first", "error");

    setIsMinting(true);
    try {
      const metadata = {
        name: selectedFile ? selectedFile.name : "Manual Entry",
        description: description || "No description provided",
        fileCID: cid,
        sha256: fileHash || null,
        isEncrypted: isEncryptedMode,
        encryptionAlgorithm: isEncryptedMode ? "AES-GCM-256" : "None",
        fileSize: selectedFile ? selectedFile.size : null,
        mimeType: selectedFile ? selectedFile.type : null,
        createdAt: new Date().toISOString(),
        type: "IP_VAULT_METADATA_V2",
      };

      onToast("Pinning metadata to IPFS…", "info");
      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        },
        body: JSON.stringify(metadata),
      });

      const metaDataJSON = await res.json();
      const finalHash = metaDataJSON.IpfsHash;

      onToast("Minting NFT on blockchain…", "info");
      const tx = await contract.mintIPRecord(finalHash);
      const receipt = await tx.wait();

      // Extract minted token ID from transaction logs
      let mintedTokenId = null;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && (parsed.name === "IPRecordMinted" || parsed.name === "Transfer")) {
              mintedTokenId = Number(parsed.args.tokenId);
              break;
            }
          } catch (e) {}
        }
      }

      // Persist client-side decryption key securely in creator's browser
      if (isEncryptedMode && stagedEncryptionKeys && mintedTokenId !== null) {
        saveLocalAssetKey(mintedTokenId, {
          keyBase64: stagedEncryptionKeys.keyBase64,
          ivBase64: stagedEncryptionKeys.ivBase64,
          sha256Hex: stagedEncryptionKeys.sha256Hex || fileHash,
          name: selectedFile ? selectedFile.name : `Token #${mintedTokenId}`,
        });
      }

      onToast(
        mintedTokenId !== null
          ? `🎉 Token #${mintedTokenId} Minted Successfully!`
          : "🎉 NFT Minted Successfully!",
        "success"
      );

      setCid("");
      setDescription("");
      setSelectedFile(null);
      setFileHash("");
      setStagedEncryptionKeys(null);
      await fetchTokens();
    } catch (error) {
      console.error(error);
      onToast("Minting failed", "error");
    } finally {
      setIsMinting(false);
    }
  };

  // ---- Generate Cryptographic Access Key ----
  const handleGenerateKey = async (tokenId) => {
    const localKey = getLocalAssetKey(tokenId);
    const token = tokens.find((t) => t.tokenId === tokenId);

    let key;
    if (localKey && localKey.keyBase64) {
      key = generateAccessKey({
        tokenId,
        keyBase64: localKey.keyBase64,
        ivBase64: localKey.ivBase64,
        sha256Hex: localKey.sha256Hex,
        name: localKey.name || token?.metadata?.name,
      });
      onToast("🔒 Cryptographic Decryption Key copied to clipboard!", "success");
    } else {
      key = generateAccessKey({
        tokenId,
        sha256Hex: token?.metadata?.sha256 || null,
        name: token?.metadata?.name || null,
      });
      onToast("Access key copied!", "info");
    }

    try {
      await navigator.clipboard.writeText(key);
      setCopiedIndex(tokenId);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = key;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedIndex(tokenId);
      setTimeout(() => setCopiedIndex(null), 2500);
    }
  };

  // ---- Transfer NFT ----
  const handleTransfer = async (tokenId) => {
    const toAddress = prompt("Enter the wallet address to transfer this NFT to:");
    if (!toAddress) return;

    if (!ethers.isAddress(toAddress)) {
      onToast("Invalid wallet address", "error");
      return;
    }

    try {
      onToast("Transferring NFT…", "info");
      const tx = await contract.transferFrom(account, toAddress, tokenId);
      await tx.wait();
      onToast("NFT transferred successfully! 🚀", "success");
      await fetchTokens();
    } catch (error) {
      console.error(error);
      onToast("Transfer failed", "error");
    }
  };

  // ─── NOT CONNECTED ────────────────────────────────
  if (!account) {
    return (
      <div className="dashboard">
        <div className="dashboard__orb dashboard__orb--1" />
        <div className="dashboard__orb dashboard__orb--2" />
        <div className="dashboard__inner">
          <div className="dashboard__topbar">
            <div className="dashboard__topbar-left">
              <button className="back-button" onClick={onBack}>
                <span className="arrow">←</span> Back
              </button>
              <div className="dashboard__brand">
                <span className="dashboard__brand-icon">🛡️</span>
                <span className="dashboard__brand-name">IP Vault</span>
              </div>
            </div>
          </div>
          <div className="dashboard__wallet-prompt">
            <span className="dashboard__wallet-prompt-icon">🦊</span>
            <h2 className="dashboard__wallet-prompt-title">Connect Your Wallet</h2>
            <p className="dashboard__wallet-prompt-desc">
              Connect your MetaMask wallet to notarize intellectual property, encrypt confidential assets,
              and mint verifiable ERC-721 records on the Ethereum blockchain.
            </p>
            <WalletConnect
              account={null}
              isLoading={isConnecting}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── CONNECTED DASHBOARD ──────────────────────────
  const activeTokens = tokens.filter((t) => !archivedIds.includes(t.tokenId));
  const archivedTokens = tokens.filter((t) => archivedIds.includes(t.tokenId));
  const displayTokens = showArchived ? archivedTokens : activeTokens;

  return (
    <div className="dashboard">
      <div className="dashboard__orb dashboard__orb--1" />
      <div className="dashboard__orb dashboard__orb--2" />
      <div className="dashboard__inner">

        {/* ── Top Bar ── */}
        <div className="dashboard__topbar">
          <div className="dashboard__topbar-left">
            <button className="back-button" onClick={onBack}>
              <span className="arrow">←</span> Back
            </button>
            <div className="dashboard__brand">
              <span className="dashboard__brand-icon">🛡️</span>
              <span className="dashboard__brand-name">IP Vault</span>
            </div>
          </div>
          <WalletConnect
            account={account}
            isLoading={isConnecting}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />
        </div>

        {/* ── Stats ── */}
        <div className="dashboard__stats">
          <div className="stat-card stat-card--blue">
            <div className="stat-card__label">Total NFTs</div>
            <div className="stat-card__value stat-card__value--blue">{tokens.length}</div>
          </div>
          <div className="stat-card stat-card--emerald">
            <div className="stat-card__label">Active</div>
            <div className="stat-card__value stat-card__value--emerald">{activeTokens.length}</div>
          </div>
          <div className="stat-card stat-card--violet">
            <div className="stat-card__label">Encryption Standard</div>
            <div className="stat-card__value stat-card__value--violet" style={{ fontSize: "1.05rem" }}>AES-256-GCM</div>
          </div>
          <div className="stat-card stat-card--cyan">
            <div className="stat-card__label">Network</div>
            <div className="stat-card__value stat-card__value--cyan">Sepolia</div>
          </div>
        </div>

        {/* ── Upload & Mint ── */}
        <div className="dashboard__upload">
          {/* Step progress */}
          <div className="dashboard__steps">
            <div className={`dashboard__step ${cid || selectedFile ? "dashboard__step--done" : "dashboard__step--active"}`}>
              <div className="dashboard__step-num">{cid || selectedFile ? "✓" : "1"}</div>
              <span className="dashboard__step-label">Select & Hash</span>
            </div>
            <div className="dashboard__step-sep" />
            <div className={`dashboard__step ${cid && !isMinting ? "dashboard__step--active" : cid && isMinting ? "dashboard__step--done" : ""}`}>
              <div className="dashboard__step-num">2</div>
              <span className="dashboard__step-label">Encrypt & Pin</span>
            </div>
            <div className="dashboard__step-sep" />
            <div className={`dashboard__step ${isMinting ? "dashboard__step--active" : ""}`}>
              <div className="dashboard__step-num">3</div>
              <span className="dashboard__step-label">Mint NFT</span>
            </div>
          </div>

          <h3 className="dashboard__section-title">🎨 Notarize & Mint IP NFT</h3>
          <p className="dashboard__section-desc">
            Protect your intellectual property with zero-knowledge SHA-256 fingerprinting,
            optional client-side AES-256 encryption, and immutable ERC-721 blockchain notarization.
          </p>

          {/* Dropzone */}
          <div className="dashboard__dropzone">
            <input
              type="file"
              id="file-upload"
              className="dashboard__file-input"
              onChange={handleFileChange}
              disabled={isUploading || isMinting}
            />
            <label
              htmlFor="file-upload"
              className={`dashboard__dropzone-label ${isUploading ? "loading" : ""}`}
            >
              {selectedFile ? (
                <>
                  <span className="upload-icon">📄</span>
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-name-size">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Ready to Encrypt
                  </span>
                </>
              ) : (
                <>
                  <span className="upload-icon">📁</span>
                  <span className="upload-text">Click to Select or Drag & Drop File</span>
                  <span className="upload-sub">PDFs, Code, Research, Media, Schematics · Hardware-Accelerated Hashing</span>
                </>
              )}
            </label>
          </div>

          {/* Real-time Cryptographic Fingerprint Badge */}
          {fileHash && (
            <div className="dashboard__crypto-panel">
              <div className="crypto-badge">
                <span className="crypto-badge__icon">⚡</span>
                <span className="crypto-badge__label">SHA-256 Fingerprint:</span>
                <code className="crypto-badge__hash" title={`0x${fileHash}`}>
                  0x{fileHash.slice(0, 16)}…{fileHash.slice(-12)}
                </code>
              </div>

              {/* Zero-Knowledge Confidentiality Toggle */}
              <div className="dashboard__security-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={isEncryptedMode}
                    onChange={(e) => setIsEncryptedMode(e.target.checked)}
                    disabled={isUploading || isMinting}
                  />
                  <span className="toggle-custom" />
                  <span className="toggle-text">
                    <strong>Zero-Knowledge AES-256-GCM Encryption</strong>
                    <small>Encrypt in browser before IPFS (Confidential / Trade Secrets)</small>
                  </span>
                </label>
              </div>

              {/* Upload & Encrypt Action Button */}
              {!cid && (
                <button
                  type="button"
                  className="dashboard__store-btn"
                  style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
                  onClick={handleUploadToIPFS}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <span className="btn-spinner" />
                      {isEncryptedMode ? "Encrypting & Pinning…" : "Pinning to IPFS…"}
                    </>
                  ) : (
                    <>
                      {isEncryptedMode ? "🔒 Encrypt & Pin to IPFS" : "🌐 Pin Plaintext to IPFS"}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="dashboard__divider">or enter existing IPFS CID</div>

          <div className="dashboard__upload-row">
            <input
              type="text"
              className="dashboard__input"
              placeholder="IPFS CID (auto-fills on upload)"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
              disabled={isMinting || isUploading}
              id="input-cid"
            />
          </div>

          <div className="dashboard__upload-row" style={{ marginTop: 12 }}>
            <textarea
              className="dashboard__input dashboard__textarea"
              placeholder="Write a brief legal/technical description of this IP asset…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isMinting || isUploading}
              rows={3}
              id="input-description"
            />
          </div>

          <div className="dashboard__mint-row">
            <button
              className="dashboard__store-btn dashboard__store-btn--mint"
              onClick={mintNFT}
              disabled={isMinting || isUploading || !cid.trim()}
              id="btn-mint-nft"
            >
              {isMinting ? (
                <>
                  <span className="btn-spinner" />
                  Minting on Blockchain…
                </>
              ) : (
                "🛡️ Notarize & Mint NFT"
              )}
            </button>
          </div>
        </div>

        {/* ── Records ── */}
        <div className="dashboard__records">
          <div className="dashboard__records-header">
            <div className="dashboard__tabs">
              <button
                className={`dashboard__tab ${!showArchived ? "active" : ""}`}
                onClick={() => setShowArchived(false)}
                id="tab-active"
              >
                Active <span>{activeTokens.length}</span>
              </button>
              <button
                className={`dashboard__tab ${showArchived ? "active" : ""}`}
                onClick={() => setShowArchived(true)}
                id="tab-archived"
              >
                Archived <span>{archivedTokens.length}</span>
              </button>
            </div>
            <button className="dashboard__refresh-btn" onClick={fetchTokens} id="btn-refresh">
              🔄 Refresh
            </button>
          </div>

          {tokens.length === 0 ? (
            <div className="dashboard__empty">
              <span className="dashboard__empty-icon">📦</span>
              <p className="dashboard__empty-text">No NFTs notarized yet</p>
              <p className="dashboard__empty-sub">Upload an asset above to create your first cryptographic IP record</p>
            </div>
          ) : displayTokens.length === 0 ? (
            <div className="dashboard__empty">
              <span className="dashboard__empty-icon">{showArchived ? "📂" : "✨"}</span>
              <p className="dashboard__empty-text">
                {showArchived ? "No archived NFTs" : "All active NFTs shown"}
              </p>
            </div>
          ) : (
            [...displayTokens].reverse().map((token) => {
              const name = token.metadata?.name || `Token #${token.tokenId}`;
              const desc = token.metadata?.description || "No description stored";
              const fileCID = token.metadata?.fileCID || token.metadataCID;
              const sha256 = token.metadata?.sha256;
              const isEncrypted = token.metadata?.isEncrypted;
              const isCopied = copiedIndex === token.tokenId;

              return (
                <div
                  className={`record-card ${showArchived ? "record-card--archived" : ""}`}
                  key={token.tokenId}
                >
                  <div className="record-card__stripe" />
                  <div className="record-card__body">
                    <div className="record-card__top">
                      <div className="record-card__main">
                        <span className="record-card__index">#{token.tokenId}</span>
                        <div className="record-card__info">
                          <div className="record-card__name-row">
                            <span className="record-card__name">{name}</span>
                            {isEncrypted ? (
                              <span className="badge badge--encrypted" title="Encrypted with client-side AES-256-GCM">
                                🔒 AES-256 Encrypted
                              </span>
                            ) : (
                              <span className="badge badge--public" title="Public IPFS record">
                                🌐 Public
                              </span>
                            )}
                          </div>
                          <div className="record-card__description">{desc}</div>

                          {sha256 && (
                            <div className="record-card__hash-row">
                              <span className="hash-label">SHA-256:</span>
                              <code className="hash-val" title={`0x${sha256}`}>
                                0x{sha256.slice(0, 10)}…{sha256.slice(-8)}
                              </code>
                            </div>
                          )}

                          <div className="record-card__cid-label">IPFS CID</div>
                          <a
                            className="record-card__cid"
                            href={`https://ipfs.io/ipfs/${fileCID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {fileCID}
                          </a>
                        </div>
                      </div>
                      <button
                        className="record-card__archive-btn"
                        onClick={() =>
                          showArchived
                            ? handleUnarchive(token.tokenId)
                            : handleArchive(token.tokenId)
                        }
                        title={showArchived ? "Restore NFT" : "Archive NFT"}
                      >
                        {showArchived ? "♻️" : "🗑️"}
                      </button>
                    </div>

                    <div className="record-card__bottom">
                      <div className="record-card__nft-badge">
                        🏷️ ERC-721 · Token #{token.tokenId}
                      </div>
                      <div className="record-card__actions">
                        <a
                          className="record-card__action-btn record-card__action-btn--ipfs"
                          href={`https://ipfs.io/ipfs/${fileCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          🌐 IPFS
                        </a>
                        <button
                          className="record-card__action-btn record-card__action-btn--transfer"
                          onClick={() => handleTransfer(token.tokenId)}
                          title="Transfer NFT to another wallet"
                        >
                          📤 Transfer
                        </button>
                        <button
                          className="record-card__action-btn record-card__action-btn--cert"
                          onClick={() => setSelectedCertToken(token)}
                          title="View official Notarization Certificate"
                        >
                          📜 Certificate
                        </button>
                        <button
                          className={`record-card__action-btn record-card__action-btn--key ${isCopied ? "record-card__action-btn--key-copied" : ""}`}
                          onClick={() => handleGenerateKey(token.tokenId)}
                          id={`btn-key-${token.tokenId}`}
                          title="Generate & copy cryptographic access key"
                        >
                          {isCopied ? "✓ Copied!" : "🔑 Key"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Certificate Modal */}
        {selectedCertToken && (
          <CertificateModal
            token={selectedCertToken}
            ownerAddress={account}
            onClose={() => setSelectedCertToken(null)}
          />
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
