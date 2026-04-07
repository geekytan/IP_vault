import React from "react";
import "./LandingPage.css";

function LandingPage({ onSelectCreator, onSelectViewer }) {
  return (
    <div className="landing">
      {/* Ambient Orbs */}
      <div className="landing__orb landing__orb--1" />
      <div className="landing__orb landing__orb--2" />
      <div className="landing__orb landing__orb--3" />

      {/* Header */}
      <header className="landing__header">
        <span className="landing__icon" role="img" aria-label="shield">
          🛡️
        </span>
        <h1 className="landing__title">IP Vault</h1>
        <p className="landing__subtitle">
          Protect your intellectual property on the blockchain. Store, manage,
          and share access to your creative work — decentralized and secure.
        </p>
      </header>

      {/* Workflow Selection Cards */}
      <div className="landing__cards">
        {/* Creator Card */}
        <div
          className="landing__card landing__card--creator"
          onClick={onSelectCreator}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelectCreator()}
          id="card-creator"
        >
          <span className="landing__card-icon" role="img" aria-label="artist">
            🎨
          </span>
          <h2 className="landing__card-title">I'm a Creator</h2>
          <p className="landing__card-desc">
            Connect your wallet to upload and register your media on the
            blockchain. Generate access keys to share with others.
          </p>
          <span className="landing__card-action">
            Connect Wallet <span>→</span>
          </span>
        </div>

        {/* Viewer Card */}
        <div
          className="landing__card landing__card--viewer"
          onClick={onSelectViewer}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelectViewer()}
          id="card-viewer"
        >
          <span className="landing__card-icon" role="img" aria-label="key">
            🔑
          </span>
          <h2 className="landing__card-title">I Have an Access Key</h2>
          <p className="landing__card-desc">
            Enter the access key shared by a content creator to securely view
            their protected media.
          </p>
          <span className="landing__card-action">
            Enter Key <span>→</span>
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing__footer">
        <p className="landing__footer-text">
          Powered by <span>Ethereum</span> &amp; <span>IPFS</span> — Secured
          on Sepolia Testnet
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
