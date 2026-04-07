import React from "react";
import "./WalletConnect.css";

function WalletConnect({ account, isLoading, onConnect, onDisconnect }) {
  const truncate = (addr) => `${addr.slice(0, 6)}···${addr.slice(-4)}`;

  if (account) {
    return (
      <div className="wc wc--connected">
        <div className="wc__status-dot" />
        <span className="wc__address">{truncate(account)}</span>
        <button
          className="wc__disconnect-btn"
          onClick={onDisconnect}
          title="Disconnect wallet"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      className={`wc wc--connect-btn ${isLoading ? "wc--loading" : ""}`}
      onClick={onConnect}
      disabled={isLoading}
      id="btn-connect-wallet"
    >
      {isLoading ? (
        <>
          <span className="btn-spinner" />
          <span>Connecting…</span>
        </>
      ) : (
        <>
          <span className="wc__metamask-icon">🦊</span>
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
}

export default WalletConnect;
