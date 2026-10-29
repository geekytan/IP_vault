import React from "react";
import { Wallet, ArrowLeftRight, X } from "lucide-react";
import "./WalletConnect.css";

function WalletConnect({ account, isLoading, onConnect, onDisconnect, onSwitchAccount }) {
  const truncate = (addr) => `${addr.slice(0, 6)}···${addr.slice(-4)}`;

  if (account) {
    return (
      <div className="wc wc--connected">
        <div className="wc__status-dot" />
        <span className="wc__address">{truncate(account)}</span>
        {onSwitchAccount && (
          <button
            className="wc__switch-btn"
            onClick={onSwitchAccount}
            title="Switch MetaMask Account"
          >
            <ArrowLeftRight size={12} />
            <span>Switch</span>
          </button>
        )}
        <button
          className="wc__disconnect-btn"
          onClick={onDisconnect}
          title="Disconnect wallet"
        >
          <X size={13} />
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
          <Wallet size={16} />
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
}

export default WalletConnect;
