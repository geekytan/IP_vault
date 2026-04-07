import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import WalletConnect from "./WalletConnect";
import { getContract } from "../utils/contract";
import { generateAccessKey } from "../utils/accessKey";
import "./OwnerDashboard.css";

function OwnerDashboard({ onBack, onToast }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [records, setRecords] = useState([]);
  const [cid, setCid] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // ---- Wallet Connection ----
  const connectWallet = async () => {
    if (!window.ethereum) {
      onToast("Please install MetaMask to continue!", "error");
      return;
    }

    setIsConnecting(true);
    try {
      // Switch to Sepolia
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
    setRecords([]);
    onToast("Wallet disconnected", "info");
  };

  // ---- Fetch Records ----
  const fetchRecords = useCallback(async () => {
    if (!contract) return;

    try {
      const data = await contract.getMyRecords();
      setRecords(data);
    } catch (error) {
      console.error(error);
      onToast("Failed to fetch records", "error");
    }
  }, [contract, onToast]);

  useEffect(() => {
    if (contract) {
      fetchRecords();
    }
  }, [contract, fetchRecords]);

  // ---- Store CID ----
  const storeData = async () => {
    if (!contract) {
      onToast("Connect wallet first", "error");
      return;
    }
    if (!cid.trim()) {
      onToast("Please enter a CID", "error");
      return;
    }

    setIsStoring(true);
    try {
      const tx = await contract.storeHash(cid.trim());
      onToast("Transaction submitted — waiting for confirmation…", "info");
      await tx.wait();
      onToast("CID stored on blockchain! 🎉", "success");
      setCid("");
      await fetchRecords();
    } catch (error) {
      console.error(error);
      onToast("Transaction failed", "error");
    } finally {
      setIsStoring(false);
    }
  };

  // ---- Generate Access Key ----
  const handleGenerateKey = async (index) => {
    const key = generateAccessKey(account, index);
    try {
      await navigator.clipboard.writeText(key);
      setCopiedIndex(index);
      onToast("Access key copied to clipboard!", "success");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = key;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedIndex(index);
      onToast("Access key copied!", "success");
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // ---- Format Timestamp ----
  const formatTime = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---- If wallet not connected ----
  if (!account) {
    return (
      <div className="dashboard">
        <div className="dashboard__topbar">
          <button className="back-button" onClick={onBack}>
            <span className="arrow">←</span> Back
          </button>
        </div>
        <div className="dashboard__wallet-prompt">
          <span className="dashboard__wallet-prompt-icon">🦊</span>
          <h2 className="dashboard__wallet-prompt-title">
            Connect Your Wallet
          </h2>
          <p className="dashboard__wallet-prompt-desc">
            Connect your MetaMask wallet to start storing your content on the
            blockchain and generating access keys.
          </p>
          <WalletConnect
            account={null}
            isLoading={isConnecting}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />
        </div>
      </div>
    );
  }

  // ---- Connected Dashboard ----
  return (
    <div className="dashboard">
      {/* Top Bar */}
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

      {/* Stats */}
      <div className="dashboard__stats">
        <div className="stat-card">
          <div className="stat-card__label">Total Records</div>
          <div className="stat-card__value stat-card__value--blue">
            {records.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Network</div>
          <div className="stat-card__value stat-card__value--violet">
            Sepolia
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Last Upload</div>
          <div className="stat-card__value stat-card__value--cyan" style={{ fontSize: '1rem' }}>
            {records.length > 0
              ? formatTime(records[records.length - 1].timestamp)
              : "—"}
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="dashboard__upload">
        <h3 className="dashboard__section-title">
          📤 Store New Content
        </h3>
        <p className="dashboard__section-desc">
          Enter your IPFS CID to register it on the blockchain with a
          tamper-proof timestamp.
        </p>
        <div className="dashboard__upload-row">
          <input
            type="text"
            className="dashboard__input"
            placeholder="Enter IPFS CID (e.g. QmXoypiz...)"
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && storeData()}
            disabled={isStoring}
            id="input-cid"
          />
          <button
            className="dashboard__store-btn"
            onClick={storeData}
            disabled={isStoring || !cid.trim()}
            id="btn-store-cid"
          >
            {isStoring ? (
              <>
                <span className="btn-spinner" /> Storing…
              </>
            ) : (
              "Store on Chain"
            )}
          </button>
        </div>
      </div>

      {/* Records */}
      <div className="dashboard__records">
        <div className="dashboard__records-header">
          <h3 className="dashboard__section-title">📋 My Records</h3>
          <button
            className="dashboard__refresh-btn"
            onClick={fetchRecords}
            id="btn-refresh-records"
          >
            🔄 Refresh
          </button>
        </div>

        {records.length === 0 ? (
          <div className="dashboard__empty">
            <span className="dashboard__empty-icon">📦</span>
            <p className="dashboard__empty-text">No records yet</p>
            <p className="dashboard__empty-sub">
              Store your first CID above to get started
            </p>
          </div>
        ) : (
          records.map((record, index) => (
            <div className="record-card" key={index}>
              <div className="record-card__top">
                <span className="record-card__index">#{index + 1}</span>
                <div className="record-card__cid-group">
                  <div className="record-card__label">IPFS CID</div>
                  <a
                    className="record-card__cid"
                    href={`https://ipfs.io/ipfs/${record.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {record.ipfsHash}
                  </a>
                </div>
              </div>
              <div className="record-card__bottom">
                <span className="record-card__time">
                  🕐 {formatTime(record.timestamp)}
                </span>
                <button
                  className={`record-card__key-btn ${
                    copiedIndex === index ? "record-card__key-btn--copied" : ""
                  }`}
                  onClick={() => handleGenerateKey(index)}
                  id={`btn-key-${index}`}
                >
                  {copiedIndex === index ? (
                    <>✓ Copied!</>
                  ) : (
                    <>🔑 Generate Key</>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
