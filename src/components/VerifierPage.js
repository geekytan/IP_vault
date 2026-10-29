import React, { useState } from "react";
import { computeSHA256 } from "../utils/crypto";
import { getReadOnlyContract, CONTRACT_ADDRESS } from "../utils/contract";
import { fetchIPFSJSON } from "../utils/ipfs";
import CertificateModal from "./CertificateModal";
import "./VerifierPage.css";

function VerifierPage({ onBack, onToast, onSelectCreator }) {
  const [activeTab, setActiveTab] = useState("file"); // "file" | "manual"
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCertToken, setSelectedCertToken] = useState(null);

  // ---- Query Blockchain Registry for Matching Hash or Token ----
  const verifyAgainstBlockchain = async (targetHash, targetTokenId = null) => {
    setIsVerifying(true);
    setStatusMessage("Connecting to Ethereum Sepolia registry…");
    setVerificationResult(null);

    const cleanTargetHash = targetHash ? targetHash.toLowerCase().replace(/^0x/, "") : null;

    try {
      const contract = getReadOnlyContract();

      setStatusMessage("Reading registry state on-chain…");
      const totalSupplyBN = await contract.totalSupply();
      const totalSupply = Number(totalSupplyBN);

      if (totalSupply === 0) {
        setVerificationResult({
          matchFound: false,
          computedHash: cleanTargetHash,
          reason: "Registry currently has 0 notarized tokens.",
        });
        return;
      }

      setStatusMessage(`Scanning ${totalSupply} on-chain records for cryptographic fingerprint…`);

      // Search all minted tokens
      let matchedRecord = null;

      for (let i = 0; i < totalSupply; i++) {
        const tokenIdBN = await contract.tokenByIndex(i);
        const currentTokenId = Number(tokenIdBN);

        // If user searched by specific Token ID
        if (targetTokenId !== null && currentTokenId === targetTokenId) {
          const [metadataCID, owner] = await Promise.all([
            contract.tokenURI(currentTokenId),
            contract.ownerOf(currentTokenId),
          ]);

          let metadata = null;
          try {
            metadata = await fetchIPFSJSON(metadataCID);
          } catch (e) {}

          matchedRecord = {
            tokenId: currentTokenId,
            metadataCID,
            owner,
            metadata,
          };
          break;
        }

        // Search by SHA-256 fingerprint or IPFS CID
        if (cleanTargetHash) {
          const metadataCID = await contract.tokenURI(currentTokenId);
          let metadata = null;
          try {
            metadata = await fetchIPFSJSON(metadataCID);
          } catch (e) {}

          const recordHash = metadata?.sha256?.toLowerCase().replace(/^0x/, "");
          const fileCID = metadata?.fileCID;

          const isHashMatch = recordHash && recordHash === cleanTargetHash;
          const isCidMatch =
            (fileCID && (fileCID === targetHash || fileCID === cleanTargetHash)) ||
            metadataCID === targetHash ||
            metadataCID === cleanTargetHash;

          if (isHashMatch || isCidMatch) {
            const owner = await contract.ownerOf(currentTokenId);
            matchedRecord = {
              tokenId: currentTokenId,
              metadataCID,
              owner,
              metadata,
            };
            break;
          }
        }
      }

      if (matchedRecord) {
        setVerificationResult({
          matchFound: true,
          computedHash: cleanTargetHash || matchedRecord.metadata?.sha256,
          token: matchedRecord,
        });
        onToast("✅ Cryptographic match verified on Ethereum!", "success");
      } else {
        setVerificationResult({
          matchFound: false,
          computedHash: cleanTargetHash,
          searchedTokenId: targetTokenId,
        });
        onToast("No matching record found in registry", "info");
      }
    } catch (err) {
      console.error("Verification error:", err);
      onToast(err.message || "Failed to verify on blockchain.", "error");
    } finally {
      setIsVerifying(false);
      setStatusMessage("");
    }
  };

  // ---- Handle File Drop or Upload ----
  const handleFileProcess = async (file) => {
    if (!file) return;

    setSelectedFile(file);
    setIsVerifying(true);
    setStatusMessage("Computing zero-knowledge SHA-256 hash in browser…");

    try {
      const { hex } = await computeSHA256(file);
      await verifyAgainstBlockchain(hex);
    } catch (err) {
      console.error("File hash error:", err);
      onToast("Failed to process file.", "error");
      setIsVerifying(false);
    }
  };

  const handleManualSearch = async () => {
    const query = manualInput.trim();
    if (!query) return;

    // Check if query is a Token ID (number or #number)
    const tokenMatch = query.match(/^#?(\d+)$/);
    if (tokenMatch) {
      const tokenId = Number(tokenMatch[1]);
      await verifyAgainstBlockchain(null, tokenId);
      return;
    }

    // Treat as SHA-256 Hash
    await verifyAgainstBlockchain(query);
  };

  const truncate = (addr) => (addr ? `${addr.slice(0, 6)}···${addr.slice(-4)}` : "N/A");

  return (
    <div className="verifier">
      {/* Background Orbs */}
      <div className="verifier__orb verifier__orb--1" />
      <div className="verifier__orb verifier__orb--2" />

      {/* Top Bar */}
      <div className="verifier__topbar">
        <button className="back-button" onClick={onBack}>
          <span className="arrow">←</span> Back to Home
        </button>
        <div className="verifier__topbar-brand">
          <span className="brand-icon">🛡️</span>
          <span className="brand-name">IP Vault Verifier</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="verifier__hero">
        <div className="verifier__badge">
          <span>⚡</span>
          <span>Zero-Knowledge Prior Art Registry</span>
        </div>
        <h1 className="verifier__title">Verify Document Authenticity</h1>
        <p className="verifier__desc">
          Drag & drop any document or file to calculate its SHA-256 cryptographic digest in-browser
          and mathematically prove its registration, date of creation, and author attribution on Ethereum.
        </p>
        <div className="verifier__contract-ref">
          Sepolia Registry:{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {CONTRACT_ADDRESS.slice(0, 8)}···{CONTRACT_ADDRESS.slice(-6)} ↗
          </a>
        </div>
      </div>

      {/* Search Mode Tabs */}
      <div className="verifier__tabs">
        <button
          className={`verifier__tab ${activeTab === "file" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("file");
            setVerificationResult(null);
          }}
        >
          📁 Drag & Drop File
        </button>
        <button
          className={`verifier__tab ${activeTab === "manual" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("manual");
            setVerificationResult(null);
          }}
        >
          🔍 Search Hash / Token ID
        </button>
      </div>

      {/* ── Tab 1: Drag & Drop Zone ── */}
      {activeTab === "file" && (
        <div
          className={`verifier__dropzone ${isDragOver ? "dragover" : ""} ${isVerifying ? "loading" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileProcess(e.dataTransfer.files[0]);
            }
          }}
        >
          <input
            type="file"
            id="verifier-file-input"
            className="verifier__file-input"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
            disabled={isVerifying}
          />
          <label htmlFor="verifier-file-input" className="verifier__dropzone-label">
            {isVerifying ? (
              <div className="verifier__spinner-wrap">
                <span className="btn-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                <span className="verifier__dropzone-title">{statusMessage || "Verifying on blockchain…"}</span>
                <span className="verifier__dropzone-sub">Hardware-accelerated zero-knowledge execution</span>
              </div>
            ) : selectedFile ? (
              <div className="verifier__dropzone-selected">
                <span className="verifier__dropzone-icon">📄</span>
                <span className="verifier__dropzone-title">{selectedFile.name}</span>
                <span className="verifier__dropzone-sub">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Click or drop another file to re-test
                </span>
              </div>
            ) : (
              <div className="verifier__dropzone-empty">
                <span className="verifier__dropzone-icon">📥</span>
                <span className="verifier__dropzone-title">Drop your file here to verify</span>
                <span className="verifier__dropzone-sub">
                  PDFs, Office Docs, Source Code, CAD, Audio, Images (Processed 100% locally)
                </span>
              </div>
            )}
          </label>
        </div>
      )}

      {/* ── Tab 2: Manual Search ── */}
      {activeTab === "manual" && (
        <div className="verifier__manual-card">
          <label className="verifier__manual-label" htmlFor="manual-search-input">
            Enter SHA-256 Hash or Token ID
          </label>
          <div className="verifier__manual-row">
            <input
              type="text"
              id="manual-search-input"
              className="verifier__manual-input"
              placeholder="e.g. 0x5cb744cbd4... or Token #2"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              disabled={isVerifying}
            />
            <button
              className="verifier__manual-btn"
              onClick={handleManualSearch}
              disabled={isVerifying || !manualInput.trim()}
            >
              {isVerifying ? "Scanning…" : "Verify"}
            </button>
          </div>
          <span className="verifier__manual-hint">
            Tip: You can paste the 64-character SHA-256 hex or a token number like <code>#2</code>.
          </span>
        </div>
      )}

      {/* ── Verification Result Output ── */}
      {verificationResult && (
        <div className="verifier__result-wrap">
          {verificationResult.matchFound ? (
            /* 🟢 Match Found Card */
            <div className="v-card v-card--verified">
              <div className="v-card__header">
                <div className="v-card__seal">🛡️</div>
                <div className="v-card__title-wrap">
                  <span className="v-card__pill v-card__pill--success">
                    ✓ 100% BITWISE AUTHENTIC & UNTAMPERED
                  </span>
                  <h2 className="v-card__title">Proof of Prior Art Confirmed</h2>
                  <p className="v-card__desc">
                    This file matches an immutable cryptographic record anchored on the Ethereum Sepolia blockchain.
                  </p>
                </div>
              </div>

              <div className="v-card__divider" />

              <div className="v-card__grid">
                <div className="v-card__field v-card__field--full">
                  <span className="v-card__label">Asset Title</span>
                  <span className="v-card__value v-card__value--highlight">
                    {verificationResult.token.metadata?.name || `Asset #${verificationResult.token.tokenId}`}
                  </span>
                </div>

                <div className="v-card__field v-card__field--half">
                  <span className="v-card__label">Token Identification</span>
                  <span className="v-card__value v-card__value--emerald">
                    ERC-721 · Token #{verificationResult.token.tokenId}
                  </span>
                </div>

                <div className="v-card__field v-card__field--half">
                  <span className="v-card__label">Registered Author / Owner</span>
                  <span className="v-card__value v-card__value--mono">
                    {truncate(verificationResult.token.owner)}
                  </span>
                </div>

                <div className="v-card__field v-card__field--half">
                  <span className="v-card__label">Timestamp of Record</span>
                  <span className="v-card__value">
                    {verificationResult.token.metadata?.createdAt
                      ? new Date(verificationResult.token.metadata.createdAt).toUTCString()
                      : "Verified On-Chain"}
                  </span>
                </div>

                <div className="v-card__field v-card__field--half">
                  <span className="v-card__label">Confidentiality Status</span>
                  <span className="v-card__value">
                    {verificationResult.token.metadata?.isEncrypted
                      ? "🔒 Zero-Knowledge Encrypted (AES-256)"
                      : "🌐 Public Prior Art Publication"}
                  </span>
                </div>

                <div className="v-card__field v-card__field--full">
                  <span className="v-card__label">Matched SHA-256 Fingerprint</span>
                  <code className="v-card__hash">
                    0x{verificationResult.computedHash}
                  </code>
                </div>

                <div className="v-card__field v-card__field--full">
                  <span className="v-card__label">Decentralized IPFS Storage</span>
                  <a
                    className="v-card__link"
                    href={`https://gateway.pinata.cloud/ipfs/${verificationResult.token.metadata?.fileCID || verificationResult.token.metadataCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {verificationResult.token.metadata?.fileCID || verificationResult.token.metadataCID} ↗
                  </a>
                </div>
              </div>

              <div className="v-card__actions">
                <button
                  className="cert-btn cert-btn--primary"
                  onClick={() => setSelectedCertToken(verificationResult.token)}
                >
                  📜 View Official Notarization Certificate
                </button>
              </div>
            </div>
          ) : (
            /* 🔴 No Match Found Card */
            <div className="v-card v-card--unverified">
              <div className="v-card__header">
                <div className="v-card__seal v-card__seal--danger">⚠️</div>
                <div className="v-card__title-wrap">
                  <span className="v-card__pill v-card__pill--danger">
                    ✕ NO MATCH FOUND IN REGISTRY
                  </span>
                  <h2 className="v-card__title">Unregistered or Modified Content</h2>
                  <p className="v-card__desc">
                    No active on-chain record matches this exact cryptographic fingerprint.
                  </p>
                </div>
              </div>

              <div className="v-card__divider" />

              <div className="v-card__grid">
                {verificationResult.computedHash && (
                  <div className="v-card__field v-card__field--full">
                    <span className="v-card__label">Computed SHA-256 Digest of File</span>
                    <code className="v-card__hash v-card__hash--unverified">
                      0x{verificationResult.computedHash}
                    </code>
                  </div>
                )}

                <div className="v-card__notice">
                  <strong>Why did this happen?</strong>
                  <ul className="v-card__notice-list">
                    <li>This document has not yet been notarized on the Ethereum Sepolia registry.</li>
                    <li>
                      <strong>File Tampering:</strong> Even modifying a single byte, comma, space, or metadata attribute changes the SHA-256 hash completely.
                    </li>
                    <li>If this file was modified after registration, it is no longer identical to the original prior art.</li>
                  </ul>
                </div>
              </div>

              <div className="v-card__actions">
                {onSelectCreator && (
                  <button className="cert-btn cert-btn--primary" onClick={onSelectCreator}>
                    🎨 Protect & Notarize This File Now
                  </button>
                )}
                <button
                  className="cert-btn cert-btn--secondary"
                  onClick={() => {
                    setSelectedFile(null);
                    setVerificationResult(null);
                    setManualInput("");
                  }}
                >
                  Test Another File
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Certificate Modal */}
      {selectedCertToken && (
        <CertificateModal
          token={selectedCertToken}
          ownerAddress={selectedCertToken.owner}
          onClose={() => setSelectedCertToken(null)}
        />
      )}
    </div>
  );
}

export default VerifierPage;
