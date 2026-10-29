import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  UploadCloud,
  Lock,
  FileText,
  Key,
  Download,
  Search,
  Scale,
  Check,
  Archive,
  ExternalLink,
  Boxes,
  Layers,
  ArrowRightLeft,
  Fingerprint,
  FileCheck2,
  HardDrive
} from "lucide-react";
import WalletConnect from "./WalletConnect";
import { getContract, IP_CATEGORIES, LICENSE_TYPES } from "../utils/contract";
import { generateAccessKey, saveLocalAssetKey, getLocalAssetKey } from "../utils/accessKey";
import { computeSHA256, encryptFile } from "../utils/crypto";
import { fetchIPFSJSON, fetchIPFSBlob, pinFileToPinata, pinJSONToPinata } from "../utils/ipfs";
import CertificateModal from "./CertificateModal";
import "./OwnerDashboard.css";

function OwnerDashboard({ onBack, onToast, onSelectVerifier }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [cid, setCid] = useState("");
  const [description, setDescription] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [isEncryptedMode, setIsEncryptedMode] = useState(true);
  const [stagedEncryptionKeys, setStagedEncryptionKeys] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedCertToken, setSelectedCertToken] = useState(null);
  const [category, setCategory] = useState(1); // 1 = PatentPriorArt
  const [licenseType, setLicenseType] = useState(0); // 0 = AllRightsReserved
  const [royaltyPercent, setRoyaltyPercent] = useState("5.0");
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState(() => {
    const saved = localStorage.getItem("archived_tokens");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("archived_tokens", JSON.stringify(archivedIds));
  }, [archivedIds]);

  const handleArchive = (tokenId) => {
    if (window.confirm("Archive this record? It will be filed in the archival registry.")) {
      setArchivedIds([...archivedIds, tokenId]);
      onToast("Record archived", "info");
    }
  };

  const handleUnarchive = (tokenId) => {
    setArchivedIds(archivedIds.filter((id) => id !== tokenId));
    onToast("Record restored to active registry", "success");
  };

  // ---- Handle Local File Selection & SHA-256 Fingerprinting ----
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setCid("");
    setStagedEncryptionKeys(null);

    try {
      const { hex } = await computeSHA256(file);
      setFileHash(hex);
      onToast("SHA-256 fingerprint generated in browser memory", "info");
    } catch (err) {
      console.error("SHA-256 calculation failed", err);
      onToast("Failed to compute SHA-256 fingerprint", "error");
    }
  };

  // ---- Upload to IPFS (with optional client-side encryption) ----
  const handleUploadToIPFS = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      let uploadFile;

      if (isEncryptedMode) {
        onToast("Encrypting payload with AES-256-GCM in browser…", "info");
        const encResult = await encryptFile(selectedFile);
        uploadFile = new File(
          [encResult.encryptedBlob],
          `encrypted_${selectedFile.name}.bin`,
          { type: "application/octet-stream" }
        );

        setStagedEncryptionKeys({
          keyBase64: encResult.keyBase64,
          ivBase64: encResult.ivBase64,
          sha256Hex: encResult.sha256Hex,
          name: selectedFile.name,
        });
      } else {
        uploadFile = selectedFile;
        setStagedEncryptionKeys(null);
      }

      onToast("Pinning payload to decentralized IPFS…", "info");
      const pinnedCid = await pinFileToPinata(uploadFile);
      setCid(pinnedCid);

      onToast(
        isEncryptedMode
          ? "Encrypted ciphertext pinned! Ready to notarize on-chain."
          : "Payload pinned to IPFS! Ready to notarize on-chain.",
        "success"
      );
    } catch (error) {
      console.error("IPFS upload error:", error);
      onToast(error.message || "IPFS upload failed.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Wallet Connection ----
  const connectWallet = async () => {
    if (!window.ethereum) {
      onToast("MetaMask not detected. Please install MetaMask.", "error");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      setAccount(accounts[0]);
      const ipContract = getContract(signer);
      setContract(ipContract);

      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        onToast("Switched wallet to Ethereum Sepolia", "info");
      } else {
        onToast("Wallet authenticated on Sepolia", "success");
      }
    } catch (error) {
      console.error(error);
      onToast(error.message || "Failed to authenticate wallet", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchAccount = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        setAccount(accounts[0]);
        setContract(getContract(signer));
        onToast(`Switched active wallet to ${accounts[0].slice(0, 6)}···${accounts[0].slice(-4)}`, "success");
      }
    } catch (error) {
      console.error("Error switching account:", error);
    }
  };

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setContract(null);
    setTokens([]);
    onToast("Wallet disconnected", "info");
  }, [onToast]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            setContract(getContract(signer));
            onToast(`Active account switched to ${accounts[0].slice(0, 6)}···${accounts[0].slice(-4)}`, "info");
          } catch (e) {
            console.error("Error updating signer on account change:", e);
          }
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [account, disconnectWallet, onToast]);

  // ---- Fetch Tokens Owned by Account ----
  const fetchTokens = useCallback(async () => {
    if (!contract || !account) return;

    try {
      const tokenIds = await contract.getTokensByOwner(account);

      const tokenData = await Promise.all(
        tokenIds.map(async (tokenIdBN) => {
          const tokenId = Number(tokenIdBN);
          const metadataCID = await contract.tokenURI(tokenId);

          let metadata = null;
          try {
            metadata = await fetchIPFSJSON(metadataCID);
          } catch (e) {
            console.warn(`Could not fetch metadata for token ${tokenId}`, e);
          }

          return {
            tokenId,
            metadataCID,
            metadata,
          };
        })
      );

      setTokens(tokenData);
    } catch (error) {
      console.error(error);
      onToast("Failed to fetch on-chain records", "error");
    }
  }, [contract, account, onToast]);

  useEffect(() => {
    if (contract && account) {
      fetchTokens();
    }
  }, [contract, account, fetchTokens]);

  // ---- Mint & Notarize Record ----
  const mintNFT = async () => {
    if (!contract) return onToast("Authenticate wallet first", "error");
    if (!cid.trim()) return onToast("Upload a file or enter IPFS CID first", "error");

    setIsMinting(true);
    try {
      const selectedCategoryObj = IP_CATEGORIES.find((c) => c.id === Number(category));
      const selectedLicenseObj = LICENSE_TYPES.find((l) => l.id === Number(licenseType));

      const metadata = {
        name: selectedFile ? selectedFile.name : "Manual Entry",
        description: description || "No formal description provided",
        fileCID: cid,
        sha256: fileHash || null,
        category: Number(category),
        categoryName: selectedCategoryObj?.label || "General Intellectual Property",
        licensing: {
          licenseType: Number(licenseType),
          licenseName: selectedLicenseObj?.label || "All Rights Reserved",
          royaltyPercent: Number(licenseType) === 2 ? Number(royaltyPercent || 0) : 0,
        },
        isEncrypted: isEncryptedMode,
        encryptionAlgorithm: isEncryptedMode ? "AES-GCM-256" : "None",
        fileSize: selectedFile ? selectedFile.size : null,
        mimeType: selectedFile ? selectedFile.type : null,
        createdAt: new Date().toISOString(),
        type: "IP_VAULT_METADATA_V2",
      };

      onToast("Pinning metadata to decentralized IPFS…", "info");
      const finalHash = await pinJSONToPinata(metadata);

      onToast("Submitting consensus transaction to Ethereum Sepolia…", "info");

      let tx;
      if (typeof contract.registerIPRecord === "function" && fileHash) {
        try {
          const hashBytes32 = fileHash.startsWith("0x") ? fileHash : `0x${fileHash}`;
          const licensingTuple = [
            Number(licenseType),
            Math.round(Number(royaltyPercent || 0) * 100),
            Number(licenseType) === 2 || Number(licenseType) === 3,
            "",
          ];
          tx = await contract.registerIPRecord(
            hashBytes32,
            finalHash,
            Number(category),
            licensingTuple,
            isEncryptedMode
          );
        } catch (v2Err) {
          console.warn("registerIPRecord fallback to mintIPRecord:", v2Err);
          tx = await contract.mintIPRecord(finalHash);
        }
      } else {
        tx = await contract.mintIPRecord(finalHash);
      }

      const receipt = await tx.wait();

      // Extract minted token ID from logs
      let mintedTokenId = null;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && (parsed.name === "IPRecordMinted" || parsed.name === "IPRecordRegistered" || parsed.name === "Transfer")) {
              mintedTokenId = Number(parsed.args.tokenId);
              break;
            }
          } catch (e) {}
        }
      }

      if (isEncryptedMode && stagedEncryptionKeys && mintedTokenId !== null) {
        saveLocalAssetKey(mintedTokenId, {
          keyBase64: stagedEncryptionKeys.keyBase64,
          ivBase64: stagedEncryptionKeys.ivBase64,
          sha256Hex: stagedEncryptionKeys.sha256Hex || fileHash,
          name: selectedFile ? selectedFile.name : `Token #${mintedTokenId}`,
        });
      }

      onToast(
        mintedTokenId !== null
          ? `Record #${mintedTokenId} Notarized on Ethereum!`
          : "IP Record Successfully Anchored on-chain!",
        "success"
      );

      setCid("");
      setDescription("");
      setSelectedFile(null);
      setFileHash("");
      setStagedEncryptionKeys(null);
      await fetchTokens();
    } catch (error) {
      console.error("Minting error:", error);
      onToast(error.message || "Minting transaction failed", "error");
    } finally {
      setIsMinting(false);
    }
  };

  // ---- Generate Cryptographic Access Key ----
  const handleGenerateKey = async (tokenId) => {
    const localKey = getLocalAssetKey(tokenId);
    const token = tokens.find((t) => t.tokenId === tokenId);

    let key;
    if (localKey && localKey.keyBase64) {
      key = generateAccessKey({
        tokenId,
        keyBase64: localKey.keyBase64,
        ivBase64: localKey.ivBase64,
        sha256Hex: localKey.sha256Hex,
        name: localKey.name || token?.metadata?.name,
      });
      onToast("Cryptographic access key copied to clipboard", "success");
    } else {
      key = generateAccessKey({
        tokenId,
        sha256Hex: token?.metadata?.sha256 || null,
        name: token?.metadata?.name || null,
      });
      onToast("Access key copied to clipboard", "info");
    }

    try {
      await navigator.clipboard.writeText(key);
      setCopiedIndex(tokenId);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = key;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedIndex(tokenId);
      setTimeout(() => setCopiedIndex(null), 2500);
    }
  };

  // ---- In-Memory Direct Safe Download ----
  const handleSafeDownload = async (fileCID, fileName) => {
    onToast("Fetching file safely into memory…", "info");
    try {
      const blob = await fetchIPFSBlob(fileCID);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `asset_${fileCID.slice(0, 10)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onToast("Download complete", "success");
    } catch (e) {
      console.error(e);
      window.open(`https://gateway.pinata.cloud/ipfs/${fileCID}`, "_blank");
    }
  };

  // ---- Transfer NFT ----
  const handleTransfer = async (tokenId) => {
    const toAddress = prompt("Enter recipient Ethereum address:");
    if (!toAddress) return;

    if (!ethers.isAddress(toAddress)) {
      onToast("Invalid Ethereum address", "error");
      return;
    }

    try {
      onToast("Submitting transfer transaction…", "info");
      const tx = await contract.transferFrom(account, toAddress, tokenId);
      await tx.wait();
      onToast("Ownership rights transferred successfully", "success");
      await fetchTokens();
    } catch (error) {
      console.error(error);
      onToast(error.message || "Transfer failed", "error");
    }
  };

  // ─── NOT CONNECTED VIEW ────────────────────────────────
  if (!account) {
    return (
      <div className="dashboard">
        <div className="dashboard__grid-bg" />
        <div className="dashboard__inner">
          <div className="dashboard__topbar">
            <div className="dashboard__topbar-left">
              <button className="back-button" onClick={onBack}>
                <ArrowLeft size={15} />
                <span>Home</span>
              </button>
              <div className="dashboard__brand">
                <ShieldCheck size={18} className="brand-icon" />
                <span className="brand-name">IP VAULT</span>
                <span className="brand-sub">CREATOR STUDIO</span>
              </div>
            </div>
            {onSelectVerifier && (
              <button className="nav-action-btn" onClick={onSelectVerifier}>
                <Search size={14} />
                <span>Public Verifier</span>
              </button>
            )}
          </div>

          <div className="dashboard__wallet-prompt">
            <div className="prompt-icon-box">
              <ShieldCheck size={36} />
            </div>
            <h2 className="dashboard__wallet-prompt-title">Authenticate Creator Identity</h2>
            <p className="dashboard__wallet-prompt-desc">
              Connect your Ethereum wallet to establish immutable prior art, encrypt confidential assets
              with Web Crypto hardware acceleration, and mint verified ERC-721 records.
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
  const encryptedCount = tokens.filter((t) => t.metadata?.isEncrypted).length;

  return (
    <div className="dashboard">
      <div className="dashboard__grid-bg" />
      <div className="dashboard__inner">

        {/* ── Top Bar ── */}
        <div className="dashboard__topbar">
          <div className="dashboard__topbar-left">
            <button className="back-button" onClick={onBack}>
              <ArrowLeft size={15} />
              <span>Home</span>
            </button>
            <div className="dashboard__brand">
              <ShieldCheck size={18} className="brand-icon" />
              <span className="brand-name">IP VAULT</span>
              <span className="brand-sub">CREATOR LEDGER</span>
            </div>
            {onSelectVerifier && (
              <button className="nav-action-btn" onClick={onSelectVerifier} title="Open Public Prior Art Verifier">
                <Search size={14} />
                <span>Public Verifier</span>
              </button>
            )}
          </div>
          <WalletConnect
            account={account}
            isLoading={isConnecting}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            onSwitchAccount={switchAccount}
          />
        </div>

        {/* ── Metric Stats Row ── */}
        <div className="dashboard__metrics">
          <div className="metric-box">
            <span className="metric-label">TOTAL REGISTERED</span>
            <div className="metric-value">{tokens.length}</div>
            <span className="metric-sub">ERC-721 Records</span>
          </div>
          <div className="metric-box metric-box--emerald">
            <span className="metric-label">ACTIVE PROVENANCE</span>
            <div className="metric-value text-emerald">{activeTokens.length}</div>
            <span className="metric-sub">Protected Assets</span>
          </div>
          <div className="metric-box metric-box--purple">
            <span className="metric-label">ZERO-KNOWLEDGE ENCRYPTED</span>
            <div className="metric-value text-purple">{encryptedCount}</div>
            <span className="metric-sub">AES-256-GCM Enclaves</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">ARCHIVED RECORDS</span>
            <div className="metric-value">{archivedTokens.length}</div>
            <span className="metric-sub">Cold Storage</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            NOTARIZATION STUDIO PANEL
        ══════════════════════════════════════════════════ */}
        <div className="studio-panel">
          <div className="studio-panel__header">
            <div className="studio-panel__title-box">
              <ShieldCheck size={18} className="text-emerald" />
              <h3 className="studio-panel__title">Notarize New Intellectual Property</h3>
            </div>
            <span className="studio-panel__tag">Sepolia Registry v2.0</span>
          </div>

          <div className="studio-panel__body">
            {/* File Dropzone */}
            <div className="studio-dropzone">
              <input
                type="file"
                id="studio-file-input"
                className="studio-dropzone__input"
                onChange={handleFileChange}
                disabled={isUploading || isMinting}
              />
              <label htmlFor="studio-file-input" className="studio-dropzone__label">
                <UploadCloud size={32} className="dropzone-icon" />
                <span className="dropzone-title">
                  {selectedFile ? selectedFile.name : "Select or drag file to calculate SHA-256 fingerprint"}
                </span>
                <span className="dropzone-sub">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB · Web Crypto Subtle (FIPS 180-4)`
                    : "Patents, Trade Secrets, Datasets, Source Code, CAD (Computed in local RAM)"}
                </span>
              </label>
            </div>

            {/* SHA-256 Fingerprint Display */}
            {fileHash && (
              <div className="studio-fingerprint">
                <div className="fingerprint-header">
                  <Fingerprint size={15} className="text-emerald" />
                  <span className="fingerprint-label">SHA-256 Cryptographic Checksum</span>
                  <span className="fingerprint-status">✓ Computed Locally</span>
                </div>
                <code className="fingerprint-code">0x{fileHash}</code>
              </div>
            )}

            {/* Encryption Mode Switch */}
            {selectedFile && (
              <div className="studio-security-card">
                <label className="security-toggle">
                  <input
                    type="checkbox"
                    checked={isEncryptedMode}
                    onChange={(e) => setIsEncryptedMode(e.target.checked)}
                    disabled={isUploading || isMinting}
                  />
                  <span className="toggle-slider" />
                  <div className="toggle-info">
                    <span className="toggle-heading">Zero-Knowledge Client-Side Encryption (AES-256-GCM)</span>
                    <span className="toggle-desc">
                      Protects trade secrets and unpublished disclosures. Encrypts in RAM before IPFS upload.
                    </span>
                  </div>
                </label>

                {!cid && (
                  <button
                    type="button"
                    className="studio-btn studio-btn--outline"
                    onClick={handleUploadToIPFS}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <span className="btn-spinner" />
                        <span>{isEncryptedMode ? "Encrypting & Pinning…" : "Pinning to IPFS…"}</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        <span>{isEncryptedMode ? "Encrypt & Pin Payload to IPFS" : "Pin Payload to IPFS"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Decentralized Storage CID Input */}
            <div className="studio-row">
              <label className="studio-label">Decentralized Storage Reference (IPFS CID)</label>
              <div className="studio-input-wrap">
                <HardDrive size={15} className="input-icon" />
                <input
                  type="text"
                  className="studio-input"
                  placeholder="Qm... or bafy... (auto-fills upon local encryption)"
                  value={cid}
                  onChange={(e) => setCid(e.target.value)}
                  disabled={isMinting || isUploading}
                />
              </div>
            </div>

            {/* Legal Description */}
            <div className="studio-row">
              <label className="studio-label">Evidentiary / Legal Description</label>
              <textarea
                className="studio-textarea"
                placeholder="Enter formal title, patent claim summary, or trade secret scope declaration…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isMinting || isUploading}
                rows={2}
              />
            </div>

            {/* Legal IP Category & Story Protocol Licensing */}
            <div className="studio-grid-2">
              <div className="studio-row">
                <label className="studio-label">
                  <Scale size={14} className="text-emerald" />
                  <span>Legal IP Category</span>
                </label>
                <select
                  className="studio-select"
                  value={category}
                  onChange={(e) => setCategory(Number(e.target.value))}
                  disabled={isMinting || isUploading}
                >
                  {IP_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="studio-row">
                <label className="studio-label">
                  <FileCheck2 size={14} className="text-emerald" />
                  <span>Commercial Licensing Terms</span>
                </label>
                <select
                  className="studio-select"
                  value={licenseType}
                  onChange={(e) => setLicenseType(Number(e.target.value))}
                  disabled={isMinting || isUploading}
                >
                  {LICENSE_TYPES.map((lic) => (
                    <option key={lic.id} value={lic.id}>
                      {lic.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Royalty Share */}
            {Number(licenseType) === 2 && (
              <div className="studio-royalty-box">
                <label className="studio-label">Revenue Royalty Share (%):</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  className="studio-input studio-input--compact"
                  value={royaltyPercent}
                  onChange={(e) => setRoyaltyPercent(e.target.value)}
                  disabled={isMinting || isUploading}
                />
                <span className="studio-royalty-note">Percentage royalty payable on commercial derivative usage</span>
              </div>
            )}

            {/* Mint Action Button */}
            <div className="studio-actions">
              <button
                className="studio-btn studio-btn--mint"
                onClick={mintNFT}
                disabled={isMinting || isUploading || !cid.trim()}
              >
                {isMinting ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Anchoring to Ethereum Consensus…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Notarize & Mint ERC-721 Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            ON-CHAIN IP RECORDS LEDGER (LINEAR / STRIPE STYLE)
        ══════════════════════════════════════════════════ */}
        <div className="ledger-section">
          <div className="ledger-header">
            <div className="ledger-tabs">
              <button
                className={`ledger-tab ${!showArchived ? "active" : ""}`}
                onClick={() => setShowArchived(false)}
              >
                Active Registry <span>{activeTokens.length}</span>
              </button>
              <button
                className={`ledger-tab ${showArchived ? "active" : ""}`}
                onClick={() => setShowArchived(true)}
              >
                Archived Records <span>{archivedTokens.length}</span>
              </button>
            </div>

            <div className="ledger-controls">
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                  onClick={() => setViewMode("table")}
                  title="Table Ledger View"
                >
                  <Layers size={14} />
                </button>
                <button
                  className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Bento Card View"
                >
                  <Boxes size={14} />
                </button>
              </div>

              <button className="ledger-refresh-btn" onClick={fetchTokens} title="Sync with blockchain">
                <RefreshCw size={14} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Empty State */}
          {tokens.length === 0 ? (
            <div className="ledger-empty">
              <ShieldCheck size={36} className="empty-icon" />
              <h4 className="empty-title">No Intellectual Property Records Found</h4>
              <p className="empty-sub">Upload and notarize an asset above to establish your first cryptographic record.</p>
            </div>
          ) : displayTokens.length === 0 ? (
            <div className="ledger-empty">
              <Archive size={36} className="empty-icon" />
              <h4 className="empty-title">{showArchived ? "No Archived Records" : "All Active Records Displayed"}</h4>
            </div>
          ) : viewMode === "table" ? (
            /* ── High-Density Data Table (Linear Style) ── */
            <div className="ledger-table-wrap">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>TOKEN</th>
                    <th>ASSET / TITLE</th>
                    <th>CATEGORY</th>
                    <th>SHA-256 CHECKSUM</th>
                    <th>LICENSING TERMS</th>
                    <th>STORAGE</th>
                    <th className="th-actions">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {[...displayTokens].reverse().map((token) => {
                    const name = token.metadata?.name || `Asset #${token.tokenId}`;
                    const desc = token.metadata?.description;
                    const fileCID = token.metadata?.fileCID || token.metadataCID;
                    const sha256 = token.metadata?.sha256;
                    const isEncrypted = token.metadata?.isEncrypted;
                    const categoryName = token.metadata?.categoryName || "General IP";
                    const licenseName = token.metadata?.licensing?.licenseName || "All Rights Reserved";
                    const royaltyShare = token.metadata?.licensing?.royaltyPercent;

                    return (
                      <tr key={token.tokenId}>
                        <td>
                          <span className="token-id-badge">#{token.tokenId}</span>
                        </td>
                        <td>
                          <div className="table-asset">
                            <span className="table-asset-name">{name}</span>
                            {desc && <span className="table-asset-desc">{desc}</span>}
                          </div>
                        </td>
                        <td>
                          <span className="table-category-pill">{categoryName}</span>
                        </td>
                        <td>
                          {sha256 ? (
                            <code className="table-hash" title={`0x${sha256}`}>
                              0x{sha256.slice(0, 8)}…{sha256.slice(-6)}
                            </code>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="table-licensing">
                            <span>{licenseName}</span>
                            {royaltyShare > 0 && <span className="table-royalty">({royaltyShare}%)</span>}
                          </div>
                        </td>
                        <td>
                          <div className="table-storage">
                            {isEncrypted ? (
                              <span className="status-chip status-chip--encrypted">
                                <Lock size={11} /> AES-256
                              </span>
                            ) : (
                              <span className="status-chip status-chip--public">
                                Public
                              </span>
                            )}
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${fileCID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-cid-link"
                              title="Inspect on IPFS Gateway"
                            >
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-icon-btn action-icon-btn--cert"
                              onClick={() => setSelectedCertToken(token)}
                              title="Official Bernstein Certificate"
                            >
                              <FileText size={14} />
                            </button>
                            <button
                              className="action-icon-btn"
                              onClick={() => handleGenerateKey(token.tokenId)}
                              title="Copy Access Key"
                            >
                              {copiedIndex === token.tokenId ? <Check size={14} className="text-emerald" /> : <Key size={14} />}
                            </button>
                            <button
                              className="action-icon-btn"
                              onClick={() => handleSafeDownload(fileCID, name)}
                              title="Download File into RAM"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              className="action-icon-btn"
                              onClick={() => handleTransfer(token.tokenId)}
                              title="Transfer Ownership"
                            >
                              <ArrowRightLeft size={14} />
                            </button>
                            {showArchived ? (
                              <button
                                className="action-icon-btn"
                                onClick={() => handleUnarchive(token.tokenId)}
                                title="Restore Record"
                              >
                                <RefreshCw size={14} />
                              </button>
                            ) : (
                              <button
                                className="action-icon-btn action-icon-btn--archive"
                                onClick={() => handleArchive(token.tokenId)}
                                title="Archive Record"
                              >
                                <Archive size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── Bento Card Grid View ── */
            <div className="ledger-grid">
              {[...displayTokens].reverse().map((token) => {
                const name = token.metadata?.name || `Asset #${token.tokenId}`;
                const desc = token.metadata?.description || "No formal description stored.";
                const fileCID = token.metadata?.fileCID || token.metadataCID;
                const sha256 = token.metadata?.sha256;
                const isEncrypted = token.metadata?.isEncrypted;
                const categoryName = token.metadata?.categoryName || "General IP";
                const licenseName = token.metadata?.licensing?.licenseName || "All Rights Reserved";
                const royaltyShare = token.metadata?.licensing?.royaltyPercent;

                return (
                  <div className="record-bento-card" key={token.tokenId}>
                    <div className="bento-card-top">
                      <span className="token-id-badge">Token #{token.tokenId}</span>
                      <span className="table-category-pill">{categoryName}</span>
                    </div>

                    <h4 className="bento-card-title">{name}</h4>
                    <p className="bento-card-desc">{desc}</p>

                    {sha256 && (
                      <div className="bento-card-hash">
                        <Fingerprint size={13} className="text-emerald" />
                        <code>0x{sha256.slice(0, 10)}…{sha256.slice(-8)}</code>
                      </div>
                    )}

                    <div className="bento-card-licensing">
                      <Scale size={13} />
                      <span>{licenseName} {royaltyShare > 0 ? `(${royaltyShare}% Royalty)` : ""}</span>
                    </div>

                    <div className="bento-card-footer">
                      <div className="bento-card-status">
                        {isEncrypted ? (
                          <span className="status-chip status-chip--encrypted">
                            <Lock size={11} /> Zero-Knowledge
                          </span>
                        ) : (
                          <span className="status-chip status-chip--public">
                            Public
                          </span>
                        )}
                      </div>

                      <div className="bento-card-actions">
                        <button
                          className="action-icon-btn action-icon-btn--cert"
                          onClick={() => setSelectedCertToken(token)}
                          title="Official Notarization Certificate"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          className="action-icon-btn"
                          onClick={() => handleGenerateKey(token.tokenId)}
                          title="Generate Access Key"
                        >
                          {copiedIndex === token.tokenId ? <Check size={14} className="text-emerald" /> : <Key size={14} />}
                        </button>
                        <button
                          className="action-icon-btn"
                          onClick={() => handleSafeDownload(fileCID, name)}
                          title="Download Asset"
                        >
                          <Download size={14} />
                        </button>
                        {showArchived ? (
                          <button
                            className="action-icon-btn"
                            onClick={() => handleUnarchive(token.tokenId)}
                            title="Restore"
                          >
                            <RefreshCw size={14} />
                          </button>
                        ) : (
                          <button
                            className="action-icon-btn action-icon-btn--archive"
                            onClick={() => handleArchive(token.tokenId)}
                            title="Archive"
                          >
                            <Archive size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Official Certificate Modal */}
        {selectedCertToken && (
          <CertificateModal
            token={selectedCertToken}
            ownerAddress={account}
            onClose={() => setSelectedCertToken(null)}
          />
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
