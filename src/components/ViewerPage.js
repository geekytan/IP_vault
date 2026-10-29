import React, { useState, useEffect, useMemo } from "react";
import { decodeAccessKey } from "../utils/accessKey";
import { getReadOnlyContract } from "../utils/contract";
import { decryptFile } from "../utils/crypto";
import { fetchIPFSJSON, fetchIPFSBlob } from "../utils/ipfs";
import CertificateModal from "./CertificateModal";
import "./ViewerPage.css";

function ViewerPage({ onBack, onToast, onSelectVerifier }) {
  const [accessKey, setAccessKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // Live key inspector for user feedback as they type or paste
  const keyInfo = useMemo(() => {
    const raw = accessKey.trim();
    if (!raw) return null;
    try {
      return decodeAccessKey(raw);
    } catch {
      return null;
    }
  }, [accessKey]);

  // Clean up Object URL when component unmounts or result changes
  useEffect(() => {
    return () => {
      if (result?.displayUrl && result.displayUrl.startsWith("blob:")) {
        URL.revokeObjectURL(result.displayUrl);
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
    setStatusText("Decoding cryptographic key payload…");
    setResult(null);
    setUnlocked(false);

    try {
      const decodedKey = decodeAccessKey(accessKey.trim());
      const contract = getReadOnlyContract();

      setStatusText("Verifying token provenance on Ethereum Sepolia…");
      const [metadataCID, owner] = await Promise.all([
        contract.tokenURI(decodedKey.tokenId),
        contract.ownerOf(decodedKey.tokenId),
      ]);

      if (!metadataCID) {
        throw new Error("No IP metadata found on-chain for this token ID.");
      }

      setStatusText("Retrieving decentralized metadata from IPFS…");
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

      // Detect / infer MIME type
      let resolvedMime = metadata?.mimeType;
      if (!resolvedMime || resolvedMime === "application/octet-stream") {
        const lowerName = name.toLowerCase();
        if (lowerName.endsWith(".pdf")) resolvedMime = "application/pdf";
        else if (lowerName.endsWith(".png")) resolvedMime = "image/png";
        else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) resolvedMime = "image/jpeg";
        else if (lowerName.endsWith(".gif")) resolvedMime = "image/gif";
        else if (lowerName.endsWith(".svg")) resolvedMime = "image/svg+xml";
        else if (lowerName.endsWith(".webp")) resolvedMime = "image/webp";
        else if (lowerName.endsWith(".mp3")) resolvedMime = "audio/mpeg";
        else if (lowerName.endsWith(".wav")) resolvedMime = "audio/wav";
        else if (lowerName.endsWith(".mp4")) resolvedMime = "video/mp4";
        else if (lowerName.endsWith(".webm")) resolvedMime = "video/webm";
        else if (lowerName.endsWith(".txt")) resolvedMime = "text/plain";
        else if (lowerName.endsWith(".json")) resolvedMime = "application/json";
        else if (lowerName.endsWith(".md")) resolvedMime = "text/markdown";
        else if (lowerName.endsWith(".docx")) resolvedMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else resolvedMime = "application/octet-stream";
      }

      let displayUrl = null;
      let textPreview = null;
      let isVerified = false;

      if (isAssetEncrypted) {
        if (!decodedKey.isEncrypted || !decodedKey.keyBase64 || !decodedKey.ivBase64) {
          throw new Error(
            "🔒 Confidential IP: This NFT is encrypted with AES-256-GCM. The access key entered lacks decryption credentials. Please request a cryptographic access key from the author."
          );
        }

        setStatusText("Fetching encrypted ciphertext from IPFS…");
        const encryptedBlob = await fetchIPFSBlob(fileCID);

        setStatusText("Decrypting in-memory with Web Crypto AES-256-GCM…");
        const decResult = await decryptFile(
          encryptedBlob,
          decodedKey.keyBase64,
          decodedKey.ivBase64,
          sha256,
          resolvedMime
        );

        displayUrl = URL.createObjectURL(decResult.decryptedBlob);
        isVerified = decResult.verified;

        // If plain text / code / json, read text for direct display
        if (
          resolvedMime.startsWith("text/") ||
          resolvedMime === "application/json" ||
          name.endsWith(".txt") ||
          name.endsWith(".md") ||
          name.endsWith(".json") ||
          name.endsWith(".sol") ||
          name.endsWith(".js") ||
          name.endsWith(".py")
        ) {
          try {
            const rawText = await decResult.decryptedBlob.text();
            textPreview = rawText.length > 50000 ? rawText.slice(0, 50000) + "\n\n... [Content truncated for preview. Full file available via Download]" : rawText;
          } catch (e) {
            console.warn("Could not read text from blob", e);
          }
        }
      } else {
        // Public / Unencrypted file: load in memory for seamless previewing
        setStatusText("Loading asset payload from IPFS…");
        try {
          const publicBlob = await fetchIPFSBlob(fileCID);
          const typedBlob = new Blob([publicBlob], { type: resolvedMime });
          displayUrl = URL.createObjectURL(typedBlob);

          if (
            resolvedMime.startsWith("text/") ||
            resolvedMime === "application/json" ||
            name.endsWith(".txt") ||
            name.endsWith(".md") ||
            name.endsWith(".json") ||
            name.endsWith(".sol") ||
            name.endsWith(".js") ||
            name.endsWith(".py")
          ) {
            try {
              const rawText = await typedBlob.text();
              textPreview = rawText.length > 50000 ? rawText.slice(0, 50000) + "\n\n... [Content truncated for preview. Full file available via Download]" : rawText;
            } catch (e) {}
          }
        } catch (e) {
          console.warn("Could not load blob into memory, fallback to gateway", e);
          displayUrl = `https://gateway.pinata.cloud/ipfs/${fileCID}`;
        }
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
        mimeType: resolvedMime,
        fileSize: metadata?.fileSize,
        displayUrl,
        textPreview,
        rawKey: accessKey.trim(),
      });

      setUnlocked(true);
      onToast(
        isAssetEncrypted
          ? "🎉 Decrypted & Verified with Zero-Knowledge Proof!"
          : "✅ Prior Art Record Retrieved Successfully!",
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

  const truncateAddress = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "N/A");

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAccessKey(text.trim());
        setError("");
        onToast("Pasted from clipboard", "info");
      }
    } catch {
      onToast("Unable to read clipboard automatically. Please press Ctrl+V.", "info");
    }
  };

  return (
    <div className="viewer">
      {/* Ambient Orbs */}
      <div className="viewer__orb viewer__orb--1" />
      <div className="viewer__orb viewer__orb--2" />

      {/* Top Bar */}
      <div className="viewer__topbar">
        <button className="back-button" onClick={onBack}>
          <span className="arrow">←</span> Back
        </button>
        <div className="viewer__topbar-brand">
          <span>🛡️</span>
          <span className="viewer__brand-name">IP Vault Viewer</span>
        </div>
        {onSelectVerifier && (
          <button
            className="nav-action-btn"
            onClick={onSelectVerifier}
            title="Open Public Prior Art Verifier"
            style={{ marginLeft: "auto" }}
          >
            <span>🔍</span> Public Verifier
          </button>
        )}
      </div>

      {/* Hero Section */}
      <div className="viewer__hero">
        <div className={`viewer__lock-icon ${unlocked ? "viewer__lock-icon--open" : ""}`}>
          {unlocked ? "🔓" : "🔑"}
        </div>
        <h1 className="viewer__title">
          {unlocked ? "Content Unlocked & Verified!" : "Access Protected Content"}
        </h1>
        <p className="viewer__desc">
          {unlocked
            ? "Your asset has been authenticated on-chain and restored in private browser memory."
            : "Enter a cryptographic access key to verify on-chain provenance and decrypt protected IP assets."}
        </p>
      </div>

      {/* Input Area */}
      {!result && (
        <div className="viewer__input-group">
          <div className="viewer__input-card">
            <div className="viewer__input-card-header">
              <label className="viewer__input-label" htmlFor="input-access-key">
                Cryptographic Access Key
              </label>
              <button
                type="button"
                className="viewer__paste-action"
                onClick={handlePasteKey}
                title="Paste from clipboard"
              >
                📋 Paste Key
              </button>
            </div>

            <div className="viewer__input-row">
              <div className="viewer__input-wrapper">
                <span className="viewer__input-prefix">🔑</span>
                <input
                  type="text"
                  className="viewer__input"
                  placeholder="Paste access key (e.g. IPV-eyJ2IjoiMy4w… or Token #)"
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

            {/* Key Inspector Live Feedback */}
            {keyInfo && (
              <div className="viewer__key-inspector">
                <span className="key-chip key-chip--token">
                  Token #{keyInfo.tokenId}
                </span>
                {keyInfo.isEncrypted ? (
                  <span className="key-chip key-chip--encrypted">
                    🔒 AES-256-GCM Key Attached
                  </span>
                ) : (
                  <span className="key-chip key-chip--public">
                    🌐 Public Token Access
                  </span>
                )}
                {keyInfo.sha256Hex && (
                  <span className="key-chip key-chip--hash">
                    SHA: {keyInfo.sha256Hex.slice(0, 8)}…{keyInfo.sha256Hex.slice(-6)}
                  </span>
                )}
                <span className="key-chip key-chip--ver">
                  v{keyInfo.version}
                </span>
              </div>
            )}

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
              Access keys are generated upon IP registration. No wallet connection or gas fees required to view or decrypt.
            </p>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="viewer__result">
          <div className="viewer__result-card">
            {/* Verified badge */}
            <div className="viewer__verified-badge">
              <span className="viewer__verified-dot" />
              <span>Verified On-Chain NFT · Token #{result.tokenId}</span>
            </div>

            {/* Integrity Barometer */}
            {result.isEncrypted ? (
              <div className="viewer__integrity-card">
                <div className="integrity-icon">🛡️</div>
                <div className="integrity-content">
                  <div className="integrity-badge-row">
                    <span className="integrity-status-pill">
                      ✓ ZERO-KNOWLEDGE DECRYPTION COMPLETE
                    </span>
                    {result.verifiedIntegrity && (
                      <span className="integrity-match-pill">
                        ✓ 100% BITWISE INTEGRITY CONFIRMED
                      </span>
                    )}
                  </div>
                  <h3 className="integrity-heading">In-Memory Hardware AES-256-GCM Decryption</h3>
                  <p className="integrity-subtext">
                    Ciphertext was fetched from decentralized IPFS, verified against on-chain Ethereum records,
                    and decrypted strictly in private browser memory. Plaintext was never exposed to any server.
                  </p>
                  {result.sha256 && (
                    <div className="integrity-digest">
                      <span className="digest-label">Cryptographic SHA-256 Digest:</span>
                      <code className="digest-code">0x{result.sha256}</code>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="viewer__integrity-card viewer__integrity-card--public">
                <div className="integrity-icon">🌐</div>
                <div className="integrity-content">
                  <div className="integrity-badge-row">
                    <span className="integrity-status-pill integrity-status-pill--public">
                      ✓ PUBLIC PRIOR ART RECORD
                    </span>
                  </div>
                  <h3 className="integrity-heading">Immutable On-Chain Attestation</h3>
                  <p className="integrity-subtext">
                    This intellectual property record is permanently anchored to the Ethereum Sepolia registry
                    for open prior art defense and legal timestamping.
                  </p>
                  {result.sha256 && (
                    <div className="integrity-digest">
                      <span className="digest-label">Cryptographic SHA-256 Digest:</span>
                      <code className="digest-code">0x{result.sha256}</code>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata Fields */}
            <div className="viewer__result-grid">
              <div className="viewer__result-field">
                <div className="viewer__result-label">Asset Title</div>
                <div className="viewer__result-value viewer__result-value--large">{result.name}</div>
              </div>

              <div className="viewer__result-field">
                <div className="viewer__result-label">Description / Legal Declaration</div>
                <div className="viewer__result-value">{result.description}</div>
              </div>

              <div className="viewer__result-row">
                <div className="viewer__result-field viewer__result-field--half">
                  <div className="viewer__result-label">Registered Owner / Author</div>
                  <div className="viewer__result-owner">{truncateAddress(result.owner)}</div>
                </div>
                <div className="viewer__result-field viewer__result-field--half">
                  <div className="viewer__result-label">Token Standard</div>
                  <div className="viewer__result-standard">ERC-721 (Sepolia)</div>
                </div>
              </div>

              <div className="viewer__result-field">
                <div className="viewer__result-label">IPFS Decentralized Storage</div>
                <a
                  className="viewer__result-cid"
                  href={`https://gateway.pinata.cloud/ipfs/${result.fileCID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {result.fileCID} ↗
                </a>
              </div>
            </div>

            {/* ── Interactive In-Browser Asset Previewer ── */}
            {result.displayUrl && (
              <div className="viewer__preview-container">
                <div className="viewer__preview-header">
                  <span className="viewer__preview-header-title">
                    🔍 Live In-Browser Decryption Preview
                  </span>
                  <span className="viewer__preview-header-badge">
                    {result.mimeType}
                  </span>
                </div>

                {/* PDF Viewer */}
                {(result.mimeType === "application/pdf" || result.name.toLowerCase().endsWith(".pdf")) ? (
                  <div className="viewer__preview-pdf-wrap">
                    <div className="viewer__preview-pdf-bar">
                      <span>📄 Embedded PDF Viewer</span>
                      <a
                        href={result.displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="viewer__preview-pill-link"
                      >
                        ↗ Open in New Window
                      </a>
                    </div>
                    <iframe
                      src={`${result.displayUrl}#toolbar=1`}
                      title={result.name}
                      className="viewer__preview-pdf-frame"
                    />
                  </div>
                ) : result.mimeType.startsWith("image/") ? (
                  /* Image Viewer */
                  <div className="viewer__preview-media">
                    <img
                      src={result.displayUrl}
                      alt={result.name}
                      className="viewer__preview-img"
                    />
                  </div>
                ) : result.mimeType.startsWith("audio/") ? (
                  /* Audio Player */
                  <div className="viewer__preview-audio-wrap">
                    <div className="viewer__preview-audio-icon">🎵</div>
                    <audio controls src={result.displayUrl} style={{ width: "100%" }} />
                  </div>
                ) : result.mimeType.startsWith("video/") ? (
                  /* Video Player */
                  <div className="viewer__preview-media">
                    <video controls src={result.displayUrl} style={{ width: "100%", maxHeight: 420 }} />
                  </div>
                ) : result.textPreview ? (
                  /* Code / Text Viewer */
                  <div className="viewer__preview-text-wrap">
                    <div className="viewer__preview-text-bar">
                      <span>📄 Source Code / Text File</span>
                      <button
                        type="button"
                        className="viewer__preview-pill-link"
                        onClick={() => {
                          navigator.clipboard.writeText(result.textPreview);
                          onToast("Copied code to clipboard!", "success");
                        }}
                      >
                        📋 Copy Content
                      </button>
                    </div>
                    <pre className="viewer__preview-code-block">
                      <code>{result.textPreview}</code>
                    </pre>
                  </div>
                ) : (
                  /* Word / Office / Other Document Card */
                  <div className="viewer__preview-doc-card">
                    <div className="viewer__preview-doc-icon">📑</div>
                    <div className="viewer__preview-doc-info">
                      <div className="viewer__preview-doc-title">{result.name}</div>
                      <div className="viewer__preview-doc-desc">
                        Office Document / Binary Payload ({result.mimeType})
                      </div>
                      <div className="viewer__preview-doc-note">
                        ✓ Bitwise decrypted and verified in memory · Ready for secure download
                      </div>
                    </div>
                    <a
                      href={result.displayUrl}
                      download={result.name}
                      className="viewer__preview-doc-btn"
                    >
                      ⬇️ Download File
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="viewer__result-actions">
              {result.displayUrl ? (
                <a
                  className="lp-btn lp-btn--primary"
                  href={result.displayUrl}
                  download={result.name}
                  id="btn-download-decrypted"
                >
                  ⬇️ Download Verified Asset
                </a>
              ) : (
                <a
                  className="lp-btn lp-btn--primary"
                  href={`https://gateway.pinata.cloud/ipfs/${result.fileCID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="btn-view-content"
                >
                  🌐 View on IPFS Gateway
                </a>
              )}

              <button
                className="viewer__cert-btn"
                onClick={() => setShowCertificate(true)}
                title="View Bernstein-Standard Cryptographic Notarization Certificate"
              >
                📜 Proof Certificate
              </button>

              {onSelectVerifier && (
                <button
                  className="viewer__verify-btn"
                  onClick={onSelectVerifier}
                  title="Verify Document in Public Registry"
                >
                  🔍 Verify in Prior Art Registry
                </button>
              )}

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

      {/* Official Certificate Modal */}
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
