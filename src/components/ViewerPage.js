import React, { useState } from "react";
import { decodeAccessKey } from "../utils/accessKey";
import { getReadOnlyContract } from "../utils/contract";
import "./ViewerPage.css";

function ViewerPage({ onBack, onToast }) {
  const [accessKey, setAccessKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!accessKey.trim()) {
      setError("Please enter an access key");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      // Decode the access key
      const { owner, index } = decodeAccessKey(accessKey.trim());

      // Fetch the record from the blockchain (read-only, no wallet needed)
      const contract = getReadOnlyContract();
      const record = await contract.records(owner, index);

      if (!record.ipfsHash || record.ipfsHash === "") {
        setError("No content found for this access key. It may be invalid or expired.");
        return;
      }

      setResult({
        ipfsHash: record.ipfsHash,
        timestamp: Number(record.timestamp),
        owner: owner,
      });

      onToast("Content retrieved successfully!", "success");
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Failed to retrieve content. Please check your access key."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateAddress = (addr) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return (
    <div className="viewer">
      {/* Top Bar */}
      <div className="viewer__topbar">
        <button className="back-button" onClick={onBack}>
          <span className="arrow">←</span> Back
        </button>
      </div>

      {/* Hero */}
      <div className="viewer__hero">
        <span className="viewer__hero-icon">🔑</span>
        <h1 className="viewer__hero-title">Access Content</h1>
        <p className="viewer__hero-desc">
          Enter the access key you received from the content creator to view
          their protected media.
        </p>
      </div>

      {/* Input */}
      <div className="viewer__input-group">
        <div className="viewer__input-wrapper">
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
          <button
            className="viewer__submit-btn"
            onClick={handleSubmit}
            disabled={isLoading || !accessKey.trim()}
            id="btn-access-submit"
          >
            {isLoading ? (
              <>
                <span className="btn-spinner" /> Loading…
              </>
            ) : (
              "Unlock →"
            )}
          </button>
        </div>

        {error && (
          <div className="viewer__error">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="viewer__result">
          <div className="viewer__result-card">
            <div className="viewer__result-badge">
              <span className="viewer__result-badge-dot" />
              Verified on Blockchain
            </div>

            <div className="viewer__result-section">
              <div className="viewer__result-label">IPFS Content Hash</div>
              <a
                className="viewer__result-cid"
                href={`https://ipfs.io/ipfs/${result.ipfsHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {result.ipfsHash}
              </a>
            </div>

            <div className="viewer__result-section">
              <div className="viewer__result-label">Registered On</div>
              <div className="viewer__result-time">
                {formatTime(result.timestamp)}
              </div>
            </div>

            <div className="viewer__result-section">
              <div className="viewer__result-label">Content Owner</div>
              <div className="viewer__result-owner">
                {truncateAddress(result.owner)}
              </div>
            </div>

            <a
              className="viewer__content-link"
              href={`https://ipfs.io/ipfs/${result.ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              🌐 View Content on IPFS
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewerPage;
