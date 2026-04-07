import React from "react";
import "./WalletConnect.css";

function WalletConnect({ account, isLoading, onConnect, onDisconnect }) {
  if (isLoading) {
    return (
      <button className="wallet-btn wallet-btn--loading" disabled>
        <span className="wallet-btn__spinner" />
        Connecting…
      </button>
    );
  }

  if (account) {
    const truncated = `${account.slice(0, 6)}…${account.slice(-4)}`;
    return (
      <button
        className="wallet-btn wallet-btn--connected"
        onClick={onDisconnect}
        title="Click to disconnect"
        id="btn-disconnect-wallet"
      >
        <span className="wallet-btn__dot" />
        <span className="wallet-btn__address">{truncated}</span>
        <span className="wallet-btn__disconnect">✕</span>
      </button>
    );
  }

  return (
    <button
      className="wallet-btn wallet-btn--connect"
      onClick={onConnect}
      id="btn-connect-wallet"
    >
      🦊 Connect Wallet
    </button>
  );
}

export default WalletConnect;
