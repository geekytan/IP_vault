import React, { useState } from "react";
import { decodeAccessKey } from "../utils/accessKey";
import { getReadOnlyContract } from "../utils/contract";
import "./ViewerPage.css";

function ViewerPage({ onBack, onToast }) {
  const [accessKey, setAccessKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  const handleSubmit = async () => {
    if (!accessKey.trim()) {
      setError("Please enter an access key");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);
    setUnlocked(false);

    try {
      const { tokenId } = decodeAccessKey(accessKey.trim());
      const contract = getReadOnlyContract();

      const [metadataCID, owner] = await Promise.all([
        contract.tokenURI(tokenId),
        contract.ownerOf(tokenId),
      ]);

      if (!metadataCID) {
        setError("No content found for this access key.");
        return;
      }

      let metadata = null;
      try {
        const res = await fetch(`https://ipfs.io/ipfs/${metadataCID}`);
        metadata = await res.json();
      } catch (e) {}

      setResult({
        tokenId,
        metadataCID,
        fileCID: metadata?.fileCID || metadataCID,
        name: metadata?.name || `Token #${tokenId}`,
        description: metadata?.description || "No description available",
        owner,
      });

      setUnlocked(true);
      onToast("Content retrieved successfully!", "success");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to retrieve content. Please check your access key.");
    } finally {
      setIsLoading(false);
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
          {unlocked ? "Content Unlocked!" : "Access Protected Content"}
        </h1>
        <p className="viewer__desc">
          {unlocked
            ? "Your NFT-backed content has been verified on-chain."
            : "Enter the access key shared by the content creator to view their protected NFT media."}
        </p>
      </div>

      {/* Input Area */}
      {!result && (
        <div className="viewer__input-group">
          <div className="viewer__input-card">
            <label className="viewer__input-label" htmlFor="input-access-key">
              Access Key
            </label>
            <div className="viewer__input-row">
              <div className="viewer__input-wrapper">
                <span className="viewer__input-prefix">🔑</span>
                <input
                  type="text"
                  className="viewer__input"
                  placeholder="Paste your access key here…"
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

            {error && (
              <div className="viewer__error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <p className="viewer__hint">
              Access keys are provided by NFT owners. No wallet required to view content.
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
              <span>Verified NFT · Token #{result.tokenId}</span>
            </div>

            {/* Info sections */}
            <div className="viewer__result-grid">
              <div className="viewer__result-field">
                <div className="viewer__result-label">Title</div>
                <div className="viewer__result-value viewer__result-value--large">{result.name}</div>
              </div>

              <div className="viewer__result-field">
                <div className="viewer__result-label">Description</div>
                <div className="viewer__result-value">{result.description}</div>
              </div>

              <div className="viewer__result-field">
                <div className="viewer__result-label">IPFS Content Hash</div>
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
                  <div className="viewer__result-label">Current Owner</div>
                  <div className="viewer__result-owner">{truncateAddress(result.owner)}</div>
                </div>
                <div className="viewer__result-field viewer__result-field--half">
                  <div className="viewer__result-label">Token Standard</div>
                  <div className="viewer__result-standard">ERC-721</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="viewer__result-actions">
              <a
                className="lp-btn lp-btn--primary"
                href={`https://ipfs.io/ipfs/${result.fileCID}`}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-view-content"
              >
                🌐 View Content on IPFS
              </a>
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
    </div>
  );
}

export default ViewerPage;
