import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import WalletConnect from "./WalletConnect";
import { getContract } from "../utils/contract";
import { generateAccessKey } from "../utils/accessKey";
import "./OwnerDashboard.css";

function OwnerDashboard({ onBack, onToast }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [cid, setCid] = useState("");
  const [description, setDescription] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState(() => {
    const saved = localStorage.getItem("archived_tokens");
    return saved ? JSON.parse(saved) : [];
  });

  // Derive mint step

  useEffect(() => {
    localStorage.setItem("archived_tokens", JSON.stringify(archivedIds));
  }, [archivedIds]);

  const handleArchive = (tokenId) => {
    if (window.confirm("Archive this NFT? It will be hidden from the active list.")) {
      setArchivedIds([...archivedIds, tokenId]);
      onToast("NFT moved to Archive", "info");
    }
  };

  const handleUnarchive = (tokenId) => {
    setArchivedIds(archivedIds.filter((id) => id !== tokenId));
    onToast("NFT restored to Active", "success");
  };

  // ---- Pinata IPFS Upload ----
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploading(true);
    onToast("Uploading file to IPFS via Pinata…", "info");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        },
        body: formData,
      });

      const resData = await res.json();
      if (resData.IpfsHash) {
        setCid(resData.IpfsHash);
        onToast("File pinned! Add a description and mint.", "success");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Pinata error:", error);
      onToast("IPFS upload failed.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Wallet Connection ----
  const connectWallet = async () => {
    if (!window.ethereum) {
      onToast("Please install MetaMask to continue!", "error");
      return;
    }

    setIsConnecting(true);
    try {
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
    setTokens([]);
    onToast("Wallet disconnected", "info");
  };

  // ---- Fetch Tokens ----
  const fetchTokens = useCallback(async () => {
    if (!contract || !account) return;

    try {
      const tokenIds = await contract.getTokensByOwner(account);
      const tokenData = await Promise.all(
        tokenIds.map(async (id) => {
          const tokenId = Number(id);
          const metadataCID = await contract.tokenURI(tokenId);

          let metadata = null;
          try {
            const res = await fetch(`https://ipfs.io/ipfs/${metadataCID}`);
            const data = await res.json();
            if (data.fileCID || data.type === "IP_VAULT_METADATA_V1") {
              metadata = data;
            }
          } catch (e) {}

          return { tokenId, metadataCID, metadata };
        })
      );

      setTokens(tokenData);
    } catch (error) {
      console.error(error);
      onToast("Failed to fetch NFTs", "error");
    }
  }, [contract, account, onToast]);

  useEffect(() => {
    if (contract && account) {
      fetchTokens();
    }
  }, [contract, account, fetchTokens]);

  // ---- Mint NFT ----
  const mintNFT = async () => {
    if (!contract) return onToast("Connect wallet first", "error");
    if (!cid.trim()) return onToast("Upload a file or enter CID first", "error");

    setIsMinting(true);
    try {
      const metadata = {
        fileCID: cid,
        description: description || "No description provided",
        name: selectedFile ? selectedFile.name : "Manual Entry",
        type: "IP_VAULT_METADATA_V1",
      };

      onToast("Pinning metadata to IPFS…", "info");
      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        },
        body: JSON.stringify(metadata),
      });

      const metaDataJSON = await res.json();
      const finalHash = metaDataJSON.IpfsHash;

      onToast("Minting NFT on blockchain…", "info");
      const tx = await contract.mintIPRecord(finalHash);
      await tx.wait();

      onToast("🎉 NFT Minted Successfully!", "success");
      setCid("");
      setDescription("");
      setSelectedFile(null);
      await fetchTokens();
    } catch (error) {
      console.error(error);
      onToast("Minting failed", "error");
    } finally {
      setIsMinting(false);
    }
  };

  // ---- Generate Access Key ----
  const handleGenerateKey = async (tokenId) => {
    const key = generateAccessKey(tokenId);
    try {
      await navigator.clipboard.writeText(key);
      setCopiedIndex(tokenId);
      onToast("Access key copied to clipboard!", "success");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = key;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedIndex(tokenId);
      onToast("Access key copied!", "success");
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // ---- Transfer NFT ----
  const handleTransfer = async (tokenId) => {
    const toAddress = prompt("Enter the wallet address to transfer this NFT to:");
    if (!toAddress) return;

    if (!ethers.isAddress(toAddress)) {
      onToast("Invalid wallet address", "error");
      return;
    }

    try {
      onToast("Transferring NFT…", "info");
      const tx = await contract.transferFrom(account, toAddress, tokenId);
      await tx.wait();
      onToast("NFT transferred successfully! 🚀", "success");
      await fetchTokens();
    } catch (error) {
      console.error(error);
      onToast("Transfer failed", "error");
    }
  };

  // ─── NOT CONNECTED ────────────────────────────────
  if (!account) {
    return (
      <div className="dashboard">
        <div className="dashboard__orb dashboard__orb--1" />
        <div className="dashboard__orb dashboard__orb--2" />
        <div className="dashboard__inner">
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
          </div>
          <div className="dashboard__wallet-prompt">
            <span className="dashboard__wallet-prompt-icon">🦊</span>
            <h2 className="dashboard__wallet-prompt-title">Connect Your Wallet</h2>
            <p className="dashboard__wallet-prompt-desc">
              Connect your MetaMask wallet to start minting your creative work as NFTs
              on the Ethereum blockchain and generating secure access keys.
            </p>
            <WalletConnect
              account={null}
              isLoading={isConnecting}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── CONNECTED DASHBOARD ──────────────────────────
  const activeTokens = tokens.filter((t) => !archivedIds.includes(t.tokenId));
  const archivedTokens = tokens.filter((t) => archivedIds.includes(t.tokenId));
  const displayTokens = showArchived ? archivedTokens : activeTokens;

  return (
    <div className="dashboard">
      <div className="dashboard__orb dashboard__orb--1" />
      <div className="dashboard__orb dashboard__orb--2" />
      <div className="dashboard__inner">

        {/* ── Top Bar ── */}
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

        {/* ── Stats ── */}
        <div className="dashboard__stats">
          <div className="stat-card stat-card--blue">
            <div className="stat-card__label">Total NFTs</div>
            <div className="stat-card__value stat-card__value--blue">{tokens.length}</div>
          </div>
          <div className="stat-card stat-card--emerald">
            <div className="stat-card__label">Active</div>
            <div className="stat-card__value stat-card__value--emerald">{activeTokens.length}</div>
          </div>
          <div className="stat-card stat-card--violet">
            <div className="stat-card__label">Token Standard</div>
            <div className="stat-card__value stat-card__value--violet" style={{ fontSize: "1.1rem" }}>ERC-721</div>
          </div>
          <div className="stat-card stat-card--cyan">
            <div className="stat-card__label">Network</div>
            <div className="stat-card__value stat-card__value--cyan">Sepolia</div>
          </div>
        </div>

        {/* ── Upload & Mint ── */}
        <div className="dashboard__upload">
          {/* Step progress */}
          <div className="dashboard__steps">
            <div className={`dashboard__step ${cid || selectedFile ? "dashboard__step--done" : "dashboard__step--active"}`}>
              <div className="dashboard__step-num">{cid || selectedFile ? "✓" : "1"}</div>
              <span className="dashboard__step-label">Upload File</span>
            </div>
            <div className="dashboard__step-sep" />
            <div className={`dashboard__step ${cid && !isMinting ? "dashboard__step--active" : cid && isMinting ? "dashboard__step--done" : ""}`}>
              <div className="dashboard__step-num">2</div>
              <span className="dashboard__step-label">Add Details</span>
            </div>
            <div className="dashboard__step-sep" />
            <div className={`dashboard__step ${isMinting ? "dashboard__step--active" : ""}`}>
              <div className="dashboard__step-num">3</div>
              <span className="dashboard__step-label">Mint NFT</span>
            </div>
          </div>

          <h3 className="dashboard__section-title">🎨 Mint New IP NFT</h3>
          <p className="dashboard__section-desc">
            Upload your creative work to IPFS and mint it as a permanent, transferable ERC-721 NFT on the blockchain.
          </p>

          {/* Dropzone */}
          <div className="dashboard__dropzone">
            <input
              type="file"
              id="file-upload"
              className="dashboard__file-input"
              onChange={handleFileUpload}
              disabled={isUploading || isMinting}
            />
            <label
              htmlFor="file-upload"
              className={`dashboard__dropzone-label ${isUploading ? "loading" : ""}`}
            >
              {isUploading ? (
                <>
                  <span className="btn-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                  <span className="upload-text">Uploading to IPFS…</span>
                </>
              ) : selectedFile ? (
                <>
                  <span className="upload-icon">📎</span>
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-name-size">
                    {(selectedFile.size / 1024).toFixed(1)} KB · File pinned ✓
                  </span>
                </>
              ) : (
                <>
                  <span className="upload-icon">📁</span>
                  <span className="upload-text">Click to Upload or Drag & Drop</span>
                  <span className="upload-sub">Supports all file types · Pinned via Pinata</span>
                </>
              )}
            </label>
          </div>

          <div className="dashboard__divider">or enter CID manually</div>

          <div className="dashboard__upload-row">
            <input
              type="text"
              className="dashboard__input"
              placeholder="IPFS CID (auto-fills on upload)"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
              disabled={isMinting || isUploading}
              id="input-cid"
            />
          </div>

          <div className="dashboard__upload-row" style={{ marginTop: 12 }}>
            <textarea
              className="dashboard__input dashboard__textarea"
              placeholder="Write a brief description about this file…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isMinting || isUploading}
              rows={3}
              id="input-description"
            />
          </div>

          <div className="dashboard__mint-row">
            <button
              className="dashboard__store-btn dashboard__store-btn--mint"
              onClick={mintNFT}
              disabled={isMinting || isUploading || !cid.trim()}
              id="btn-mint-nft"
            >
              {isMinting ? (
                <>
                  <span className="btn-spinner" />
                  Minting…
                </>
              ) : (
                "🎨 Mint as NFT"
              )}
            </button>
          </div>
        </div>

        {/* ── Records ── */}
        <div className="dashboard__records">
          <div className="dashboard__records-header">
            <div className="dashboard__tabs">
              <button
                className={`dashboard__tab ${!showArchived ? "active" : ""}`}
                onClick={() => setShowArchived(false)}
                id="tab-active"
              >
                Active <span>{activeTokens.length}</span>
              </button>
              <button
                className={`dashboard__tab ${showArchived ? "active" : ""}`}
                onClick={() => setShowArchived(true)}
                id="tab-archived"
              >
                Archived <span>{archivedTokens.length}</span>
              </button>
            </div>
            <button className="dashboard__refresh-btn" onClick={fetchTokens} id="btn-refresh">
              🔄 Refresh
            </button>
          </div>

          {tokens.length === 0 ? (
            <div className="dashboard__empty">
              <span className="dashboard__empty-icon">📦</span>
              <p className="dashboard__empty-text">No NFTs minted yet</p>
              <p className="dashboard__empty-sub">Upload a file above and mint your first IP NFT</p>
            </div>
          ) : displayTokens.length === 0 ? (
            <div className="dashboard__empty">
              <span className="dashboard__empty-icon">{showArchived ? "📂" : "✨"}</span>
              <p className="dashboard__empty-text">
                {showArchived ? "No archived NFTs" : "All active NFTs shown"}
              </p>
            </div>
          ) : (
            [...displayTokens].reverse().map((token) => {
              const name = token.metadata?.name || `Token #${token.tokenId}`;
              const desc = token.metadata?.description || "No description stored";
              const fileCID = token.metadata?.fileCID || token.metadataCID;
              const isCopied = copiedIndex === token.tokenId;

              return (
                <div
                  className={`record-card ${showArchived ? "record-card--archived" : ""}`}
                  key={token.tokenId}
                >
                  <div className="record-card__stripe" />
                  <div className="record-card__body">
                    <div className="record-card__top">
                      <div className="record-card__main">
                        <span className="record-card__index">#{token.tokenId}</span>
                        <div className="record-card__info">
                          <div className="record-card__name">{name}</div>
                          <div className="record-card__description">{desc}</div>
                          <div className="record-card__cid-label">File CID</div>
                          <a
                            className="record-card__cid"
                            href={`https://ipfs.io/ipfs/${fileCID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {fileCID}
                          </a>
                        </div>
                      </div>
                      <button
                        className="record-card__archive-btn"
                        onClick={() =>
                          showArchived
                            ? handleUnarchive(token.tokenId)
                            : handleArchive(token.tokenId)
                        }
                        title={showArchived ? "Restore NFT" : "Archive NFT"}
                      >
                        {showArchived ? "♻️" : "🗑️"}
                      </button>
                    </div>

                    <div className="record-card__bottom">
                      <div className="record-card__nft-badge">
                        🏷️ ERC-721 · Token #{token.tokenId}
                      </div>
                      <div className="record-card__actions">
                        <a
                          className="record-card__action-btn record-card__action-btn--ipfs"
                          href={`https://ipfs.io/ipfs/${fileCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          🌐 IPFS
                        </a>
                        <button
                          className="record-card__action-btn record-card__action-btn--transfer"
                          onClick={() => handleTransfer(token.tokenId)}
                          title="Transfer NFT to another wallet"
                        >
                          📤 Transfer
                        </button>
                        <button
                          className={`record-card__action-btn record-card__action-btn--key ${isCopied ? "record-card__action-btn--key-copied" : ""}`}
                          onClick={() => handleGenerateKey(token.tokenId)}
                          id={`btn-key-${token.tokenId}`}
                        >
                          {isCopied ? "✓ Copied!" : "🔑 Key"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
