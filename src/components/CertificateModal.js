import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CONTRACT_ADDRESS } from "../utils/contract";
import "./CertificateModal.css";

function CertificateModal({ token, ownerAddress, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);

  const tokenId = token?.tokenId;
  const metadata = token?.metadata || {};
  const name = metadata.name || `Asset #${tokenId}`;
  const description = metadata.description || "No formal description provided.";
  const fileCID = metadata.fileCID || token?.metadataCID || "N/A";
  const sha256 = metadata.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const isEncrypted = metadata.isEncrypted || false;
  const createdAt = metadata.createdAt || new Date().toISOString();
  const owner = ownerAddress || token?.owner || "0x0000000000000000000000000000000000000000";

  // Certificate ID
  const certId = `IPV-CERT-${new Date(createdAt).getFullYear()}-${String(tokenId).padStart(5, "0")}`;

  // Formatted date
  const formattedDate = new Date(createdAt).toUTCString();

  // Generate QR Code containing verification payload
  useEffect(() => {
    const payload = JSON.stringify({
      cert: certId,
      token: tokenId,
      hash: sha256,
      owner,
      contract: CONTRACT_ADDRESS,
      network: "sepolia",
    });

    QRCode.toDataURL(payload, {
      width: 140,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [certId, tokenId, sha256, owner]);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const attestation = {
      attestationStandard: "IP_VAULT_PRIOR_ART_V1",
      certificateId: certId,
      issuedAt: createdAt,
      asset: {
        tokenId,
        title: name,
        description,
        fileCID,
        sha256Fingerprint: `0x${sha256}`,
        isZeroKnowledgeEncrypted: isEncrypted,
      },
      provenance: {
        network: "Ethereum Sepolia Testnet",
        chainId: 11155111,
        contractAddress: CONTRACT_ADDRESS,
        registrant: owner,
        tokenStandard: "ERC-721",
      },
      legalDeclaration:
        "This digital record serves as cryptographic proof of existence and author attribution as of the recorded timestamp.",
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(attestation, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${certId}-attestation.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="cert-modal-overlay" onClick={onClose}>
      <div className="cert-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Controls (Hidden in Print) */}
        <div className="cert-modal-actions no-print">
          <div className="cert-modal-actions-left">
            <span className="cert-pill">📜 Bernstein-Standard Notarization</span>
          </div>
          <div className="cert-modal-actions-right">
            <button className="cert-btn cert-btn--secondary" onClick={handleDownloadJSON}>
              ⬇️ Export JSON
            </button>
            <button className="cert-btn cert-btn--primary" onClick={handlePrint}>
              🖨️ Print / Save as PDF
            </button>
            <button className="cert-btn-close" onClick={onClose} title="Close certificate">
              ✕
            </button>
          </div>
        </div>

        {/* ── Official Certificate Document ── */}
        <div className="cert-document" id="printable-certificate">
          <div className="cert-document-inner">
            {/* Watermark & Security Border */}
            <div className="cert-corner cert-corner--tl" />
            <div className="cert-corner cert-corner--tr" />
            <div className="cert-corner cert-corner--bl" />
            <div className="cert-corner cert-corner--br" />

            {/* Header */}
            <div className="cert-header">
              <div className="cert-seal">
                <div className="cert-seal-inner">
                  <span>🛡️</span>
                </div>
              </div>
              <div className="cert-header-content">
                <span className="cert-authority">IP VAULT DECENTRALIZED PROTOCOL</span>
                <h1 className="cert-title">CERTIFICATE OF CRYPTOGRAPHIC NOTARIZATION</h1>
                <p className="cert-subtitle">
                  Proof of Prior Art, Existence, and Author Attribution Anchored on Ethereum
                </p>
              </div>
              <div className="cert-id-badge">
                <span className="cert-id-label">CERTIFICATE NO.</span>
                <span className="cert-id-value">{certId}</span>
              </div>
            </div>

            <div className="cert-divider" />

            {/* Main Attestation Statement */}
            <div className="cert-statement">
              This certificate formally attests that the digital intellectual property identified below has been cryptographically registered and anchored to the Ethereum blockchain. The digital fingerprint was computed using a zero-knowledge SHA-256 algorithm and permanently bound to a decentralized token identifier.
            </div>

            {/* Metadata Grid */}
            <div className="cert-grid">
              <div className="cert-field cert-field--full">
                <span className="cert-label">Asset Title / Subject Matter</span>
                <span className="cert-value cert-value--highlight">{name}</span>
              </div>

              <div className="cert-field cert-field--full">
                <span className="cert-label">Technical / Legal Description</span>
                <span className="cert-value cert-value--desc">{description}</span>
              </div>

              <div className="cert-field cert-field--half">
                <span className="cert-label">Registrant / Author Wallet</span>
                <span className="cert-value cert-value--mono">{owner}</span>
              </div>

              <div className="cert-field cert-field--half">
                <span className="cert-label">Blockchain Token Identification</span>
                <span className="cert-value">
                  ERC-721 · Token #{tokenId} (Sepolia)
                </span>
              </div>

              <div className="cert-field cert-field--half">
                <span className="cert-label">Timestamp of Record (UTC)</span>
                <span className="cert-value">{formattedDate}</span>
              </div>

              <div className="cert-field cert-field--half">
                <span className="cert-label">Confidentiality Status</span>
                <span className="cert-value">
                  {isEncrypted ? "🔒 Zero-Knowledge Encrypted (AES-256-GCM)" : "🌐 Public Prior Art Publication"}
                </span>
              </div>

              <div className="cert-field cert-field--full">
                <span className="cert-label">Smart Contract Registry</span>
                <a
                  className="cert-link cert-value--mono"
                  href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {CONTRACT_ADDRESS} ↗
                </a>
              </div>

              <div className="cert-field cert-field--full">
                <span className="cert-label">Decentralized Storage Reference (IPFS CID)</span>
                <a
                  className="cert-link cert-value--mono"
                  href={`https://ipfs.io/ipfs/${fileCID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {fileCID} ↗
                </a>
              </div>
            </div>

            {/* Cryptographic Hash Section */}
            <div className="cert-hash-section">
              <div className="cert-hash-header">
                <div className="cert-hash-title">
                  <span>⚡</span> SHA-256 Cryptographic Fingerprint
                </div>
                <button
                  className="cert-copy-hash-btn no-print"
                  onClick={handleCopyHash}
                  title="Copy SHA-256 hash"
                >
                  {copiedHash ? "✓ Copied" : "Copy Hash"}
                </button>
              </div>
              <div className="cert-hash-display">
                <code>0x{sha256}</code>
              </div>
              <div className="cert-hash-note">
                Any bitwise modification to the original file will produce a completely different cryptographic digest.
              </div>
            </div>

            {/* Legal Evidentiary Footer */}
            <div className="cert-footer">
              <div className="cert-footer-text">
                <strong>LEGAL EVIDENTIARY DECLARATION:</strong>
                <p>
                  Pursuant to prevailing electronic evidence statutes (including the US DTSA, EU Trade Secrets Directive 2016/943, and the Berne Convention for the Protection of Literary and Artistic Works), this cryptographic certificate provides tamper-proof evidentiary proof of creation, content integrity, and prior art ownership as of the blockchain timestamp.
                </p>
              </div>

              <div className="cert-qr-container">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Verification QR Code" className="cert-qr-img" />
                ) : (
                  <div className="cert-qr-placeholder" />
                )}
                <span className="cert-qr-caption">Scan to Verify Provenance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CertificateModal;
