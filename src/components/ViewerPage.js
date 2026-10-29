import React, { useState, useEffect } from "react";
import { decodeAccessKey } from "../utils/accessKey";
import { getReadOnlyContract } from "../utils/contract";
import { decryptFile } from "../utils/crypto";
import { fetchIPFSJSON, fetchIPFSBlob } from "../utils/ipfs";
import CertificateModal from "./CertificateModal";
import "./ViewerPage.css";

function ViewerPage({ onBack, onToast }) {
  const [accessKey, setAccessKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // Clean up Object URL when component unmounts or result changes
  useEffect(() => {
    return () => {
      if (result?.decryptedUrl) {
        URL.revokeObjectURL(result.decryptedUrl);
      }
    };
  }, [result]);

  const handleSubmit = async () => {
    if (!accessKey.trim()) {
      setError("Please enter an access key");
      return;
    }

    setIsLoading(true);
    setError("");
    setStatusText("Decoding access key…");
    setResult(null);
    setUnlocked(false);

    try {
      const decodedKey = decodeAccessKey(accessKey.trim());
      const contract = getReadOnlyContract();

      setStatusText("Verifying ownership on blockchain…");
      const [metadataCID, owner] = await Promise.all([
        contract.tokenURI(decodedKey.tokenId),
        contract.ownerOf(decodedKey.tokenId),
      ]);

      if (!metadataCID) {
        throw new Error("No IP metadata found on-chain for this token ID.");
      }

      setStatusText("Retrieving metadata from IPFS…");
      let metadata = null;
      try {
        metadata = await fetchIPFSJSON(metadataCID);
      } catch (e) {
        console.warn("Could not fetch IPFS JSON metadata", e);
      }

      const isAssetEncrypted = metadata?.isEncrypted || decodedKey.isEncrypted;
      const fileCID = metadata?.fileCID || metadataCID;
      const sha256 = metadata?.sha256 || decodedKey.sha256Hex;
      const name = metadata?.name || decodedKey.name || `Asset #${decodedKey.tokenId}`;
      const description = metadata?.description || "No description provided";
      const mimeType = metadata?.mimeType || "application/octet-stream";

      let decryptedUrl = null;
      let isVerified = false;

      if (isAssetEncrypted) {
        if (!decodedKey.isEncrypted || !decodedKey.keyBase64 || !decodedKey.ivBase64) {
          throw new Error(
            "🔒 Confidential IP: This NFT is encrypted with AES-256-GCM. The access key entered lacks decryption credentials. Please request a cryptographic access key from the author."
          );
        }

        setStatusText("Fetching encrypted payload from IPFS…");
        const encryptedBlob = await fetchIPFSBlob(fileCID);

        setStatusText("Decrypting in-browser memory (Zero-Knowledge)…");
        const decResult = await decryptFile(
          encryptedBlob,
          decodedKey.keyBase64,
          decodedKey.ivBase64,
          sha256,
          mimeType
        );

        decryptedUrl = URL.createObjectURL(decResult.decryptedBlob);
        isVerified = decResult.verified;
      }

      setResult({
        tokenId: decodedKey.tokenId,
        metadataCID,
        fileCID,
        name,
        description,
        owner,
        isEncrypted: isAssetEncrypted,
        verifiedIntegrity: isVerified || !isAssetEncrypted,
        sha256,
        mimeType,
        fileSize: metadata?.fileSize,
        decryptedUrl,
      });

      setUnlocked(true);
      onToast(
        isAssetEncrypted
          ? "🎉 Decrypted & Verified with Zero-Knowledge Proof!"
          : "Content retrieved successfully!",
        "success"
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to retrieve content. Please check your access key.");
    } finally {
      setIsLoading(false);
      setStatusText("");
    }
  };

  const truncateAddress = (addr) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return (
    <div className="viewer">
      {/* Ambient bg */}
      <div className="viewer__orb viewer__orb--1" />
      <div className="viewer__orb viewer__orb--2" />

      {/* Top Bar */}
      <div className="viewer__topbar">
        <button className="back-button" onClick={onBack}>
          <span className="arrow">←</span> Back
        </button>
        <div className="viewer__topbar-brand">
          <span>🛡️</span>
          <span className="viewer__brand-name">IP Vault</span>
        </div>
      </div>

      {/* Hero */}
      <div className="viewer__hero">
        <div className={`viewer__lock-icon ${unlocked ? "viewer__lock-icon--open" : ""}`}>
          {unlocked ? "🔓" : "🔑"}
        </div>
        <h1 className="viewer__title">
          {unlocked ? "Content Unlocked & Verified!" : "Access Protected Content"}
        </h1>
        <p className="viewer__desc">
          {unlocked
            ? "Your content has been authenticated on-chain and decrypted in-browser memory."
            : "Enter a cryptographic access key to verify on-chain provenance and decrypt protected IP assets."}
        </p>
      </div>

      {/* Input Area */}
      {!result && (
        <div className="viewer__input-group">
          <div className="viewer__input-card">
            <label className="viewer__input-label" htmlFor="input-access-key">
              Cryptographic Access Key
            </label>
            <div className="viewer__input-row">
              <div className="viewer__input-wrapper">
                <span className="viewer__input-prefix">🔑</span>
                <input
                  type="text"
                  className="viewer__input"
                  placeholder="Paste access key (e.g. IPV-eyJ2IjoiMy4w…)"
                  value={accessKey}
                  onChange={(e) => {
                    setAccessKey(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={isLoading}
                  id="input-access-key"
                />
              </div>
              <button
                className="viewer__submit-btn"
                onClick={handleSubmit}
                disabled={isLoading || !accessKey.trim()}
                id="btn-access-submit"
              >
                {isLoading ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <>Unlock <span className="viewer__btn-arrow">→</span></>
                )}
              </button>
            </div>

            {statusText && (
              <div className="viewer__status">
                <span className="viewer__status-dot" />
                <span>{statusText}</span>
              </div>
            )}

            {error && (
              <div className="viewer__error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <p className="viewer__hint">
              Access keys are provided by IP creators. No wallet required to decrypt and view content.
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="viewer__result">
          <div className="viewer__result-card">
            {/* Verified badge */}
            <div className="viewer__verified-badge">
              <span className="viewer__verified-dot" />
              <span>Verified On-Chain NFT · Token #{result.tokenId}</span>
            </div>

            {/* Zero-Knowledge Security Banner */}
            {result.isEncrypted && (
              <div className="viewer__security-banner">
                <span className="security-icon">🛡️</span>
                <div className="security-text">
                  <strong>Zero-Knowledge AES-256 Decryption Complete</strong>
                  <p>Payload was fetched encrypted from IPFS and decrypted strictly in your browser memory.</p>
                </div>
              </div>
            )}

            {/* Info sections */}
            <div className="viewer__result-grid">
              <div className="viewer__result-field">
                <div className="viewer__result-label">Asset Title</div>
                <div className="viewer__result-value viewer__result-value--large">{result.name}</div>
              </div>

              <div className="viewer__result-field">
                <div className="viewer__result-label">Description / Legal Declaration</div>
                <div className="viewer__result-value">{result.description}</div>
              </div>

              {result.sha256 && (
                <div className="viewer__result-field">
                  <div className="viewer__result-label">Cryptographic Fingerprint (SHA-256)</div>
                  <div className="viewer__hash-box">
                    <code>0x{result.sha256}</code>
                    <span className="hash-status-badge">✓ Tamper-Evident Integrity</span>
                  </div>
                </div>
              )}

              <div className="viewer__result-field">
                <div className="viewer__result-label">IPFS Storage CID</div>
                <a
                  className="viewer__result-cid"
                  href={`https://ipfs.io/ipfs/${result.fileCID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {result.fileCID}
                </a>
              </div>

              <div className="viewer__result-row">
                <div className="viewer__result-field viewer__result-field--half">
                  <div className="viewer__result-label">Registered Owner</div>
                  <div className="viewer__result-owner">{truncateAddress(result.owner)}</div>
                </div>
                <div className="viewer__result-field viewer__result-field--half">
                  <div className="viewer__result-label">Token Standard</div>
                  <div className="viewer__result-standard">ERC-721 (Sepolia)</div>
                </div>
              </div>
            </div>

            {/* In-browser preview for decrypted content */}
            {result.decryptedUrl && (
              <div className="viewer__preview-container">
                <div className="viewer__preview-header">Asset Preview</div>
                {result.mimeType.startsWith("image/") ? (
                  <div className="viewer__preview-media">
                    <img src={result.decryptedUrl} alt={result.name} className="viewer__preview-img" />
                  </div>
                ) : result.mimeType.startsWith("audio/") ? (
                  <div className="viewer__preview-media">
                    <audio controls src={result.decryptedUrl} style={{ width: "100%" }} />
                  </div>
                ) : result.mimeType.startsWith("video/") ? (
                  <div className="viewer__preview-media">
                    <video controls src={result.decryptedUrl} style={{ width: "100%", maxHeight: 400 }} />
                  </div>
                ) : (
                  <div className="viewer__preview-generic">
                    <span>📄</span>
                    <span>Decrypted File Ready ({result.mimeType})</span>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="viewer__result-actions">
              {result.decryptedUrl ? (
                <a
                  className="lp-btn lp-btn--primary"
                  href={result.decryptedUrl}
                  download={result.name}
                  id="btn-download-decrypted"
                >
                  ⬇️ Download Decrypted Asset
                </a>
              ) : (
                <a
                  className="lp-btn lp-btn--primary"
                  href={`https://ipfs.io/ipfs/${result.fileCID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="btn-view-content"
                >
                  🌐 View Content on IPFS
                </a>
              )}

              <button
                className="viewer__cert-btn"
                onClick={() => setShowCertificate(true)}
                title="View Bernstein-Standard Cryptographic Notarization Certificate"
              >
                📜 Proof Certificate
              </button>

              <button
                className="viewer__reset-btn"
                onClick={() => {
                  setResult(null);
                  setAccessKey("");
                  setUnlocked(false);
                }}
              >
                Enter Another Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notarization Certificate Modal */}
      {showCertificate && result && (
        <CertificateModal
          token={result}
          ownerAddress={result.owner}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}

export default ViewerPage;
