import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Search,
  Key,
  ArrowRight,
  Fingerprint,
  Scale,
  Cpu,
  FileCheck2,
  Terminal,
  ExternalLink,
  FileText,
  Boxes,
  Eye,
  Award
} from "lucide-react";
import { CONTRACT_ADDRESS } from "../utils/contract";
import "./LandingPage.css";

function LandingPage({ onSelectCreator, onSelectViewer, onSelectVerifier }) {
  const [activeTab, setActiveTab] = useState("hash");

  return (
    <div className="lp">
      {/* ── Background Architectural Grid ── */}
      <div className="lp-grid-bg" />
      <div className="lp-ambient-glow" />

      {/* ── Top Navigation Bar ── */}
      <header className="lp-nav">
        <div className="lp-nav__inner">
          <div className="lp-nav__brand">
            <div className="lp-nav__logo-box">
              <ShieldCheck className="lp-nav__logo-icon" size={20} />
            </div>
            <div className="lp-nav__brand-info">
              <span className="lp-nav__brand-name">IP VAULT</span>
              <span className="lp-nav__brand-badge">PROTOCOL v2.0</span>
            </div>
          </div>

          <nav className="lp-nav__links">
            <a href="#architecture" className="lp-nav__link">Architecture</a>
            <a href="#standards" className="lp-nav__link">Legal Framework</a>
            <a href="#how-it-works" className="lp-nav__link">Protocol Flow</a>
          </nav>

          <div className="lp-nav__actions">
            <button
              className="lp-nav__btn lp-nav__btn--ghost"
              onClick={onSelectVerifier}
              id="nav-verifier-btn"
            >
              <Search size={15} />
              <span>Public Verifier</span>
            </button>
            <button
              className="lp-nav__btn lp-nav__btn--ghost"
              onClick={onSelectViewer}
              id="nav-viewer-btn"
            >
              <Key size={15} />
              <span>Access Key</span>
            </button>
            <button
              className="lp-nav__btn lp-nav__btn--primary"
              onClick={onSelectCreator}
              id="nav-creator-btn"
            >
              <span>Launch App</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          HERO SECTION — INSTITUTIONAL PROVENANCE
      ══════════════════════════════════════════════════ */}
      <section className="lp-hero">
        <div className="lp-container">
          {/* Status Chip */}
          <div className="lp-hero__pill">
            <span className="lp-hero__pulse-dot" />
            <span className="lp-hero__pill-label">Ethereum Sepolia Consensus</span>
            <span className="lp-hero__pill-sep">·</span>
            <span className="lp-hero__pill-ref">Contract: {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}</span>
          </div>

          {/* Headline */}
          <h1 className="lp-hero__title">
            Cryptographic IP Infrastructure
            <span className="lp-hero__title-sub">
              Proof of Prior Art & Zero-Knowledge Trade Secret Notarization
            </span>
          </h1>

          <p className="lp-hero__lead">
            Mathematically anchor patent disclosures, confidential trade secrets, and source code to the Ethereum blockchain.
            Hardware AES-256-GCM encryption, block consensus legal timestamping, and Story Protocol programmable licensing.
          </p>

          {/* Action CTAs */}
          <div className="lp-hero__cta-group">
            <button
              className="lp-btn lp-btn--emerald"
              onClick={onSelectCreator}
              id="hero-creator-btn"
            >
              <ShieldCheck size={18} />
              <span>Notarize & Protect IP</span>
              <ArrowRight size={16} />
            </button>
            <button
              className="lp-btn lp-btn--outline"
              onClick={onSelectVerifier}
              id="hero-verifier-btn"
            >
              <Search size={18} />
              <span>Verify Any Document (Wallet-Free)</span>
            </button>
            <button
              className="lp-btn lp-btn--ghost"
              onClick={onSelectViewer}
              id="hero-viewer-btn"
            >
              <Key size={18} />
              <span>Enter Access Key</span>
            </button>
          </div>

          {/* ── Interactive Protocol Proof Simulator ── */}
          <div className="lp-terminal">
            <div className="lp-terminal__header">
              <div className="lp-terminal__dots">
                <span className="dot dot--red" />
                <span className="dot dot--yellow" />
                <span className="dot dot--green" />
              </div>
              <div className="lp-terminal__network">
                <Terminal size={13} />
                <span>sepolia.ethereum.org · RPC 11155111 · Web Crypto Subtle (FIPS 180-4)</span>
              </div>
              <div className="lp-terminal__tabs">
                <button
                  className={`term-tab ${activeTab === "hash" ? "active" : ""}`}
                  onClick={() => setActiveTab("hash")}
                >
                  SHA-256 Digest
                </button>
                <button
                  className={`term-tab ${activeTab === "zk" ? "active" : ""}`}
                  onClick={() => setActiveTab("zk")}
                >
                  AES-256-GCM Enclave
                </button>
                <button
                  className={`term-tab ${activeTab === "license" ? "active" : ""}`}
                  onClick={() => setActiveTab("license")}
                >
                  Story Protocol PIL
                </button>
              </div>
            </div>

            <div className="lp-terminal__body">
              {activeTab === "hash" && (
                <div className="term-content">
                  <div className="term-line">
                    <span className="term-prompt">$</span>
                    <span className="term-cmd">ipvault notarize --algo SHA-256 --input "autonomous_ai_model_v2.weights"</span>
                  </div>
                  <div className="term-log term-log--muted">Hardware Web Crypto acceleration initialized in RAM sandbox...</div>
                  <div className="term-grid">
                    <div className="term-cell">
                      <span className="term-cell-title">256-Bit Cryptographic Fingerprint</span>
                      <code className="term-hash">0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</code>
                    </div>
                    <div className="term-cell">
                      <span className="term-cell-title">Evidentiary Blockchain Proof</span>
                      <span className="term-proof">✓ Block #7,921,804 · Timestamp Consensus 2026-10-29T21:00:00Z</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "zk" && (
                <div className="term-content">
                  <div className="term-line">
                    <span className="term-prompt">$</span>
                    <span className="term-cmd">ipvault encrypt --mode zero-knowledge --cipher AES-256-GCM --iv 96bit</span>
                  </div>
                  <div className="term-log term-log--muted">Secret key generated via crypto.getRandomValues(). Plaintext never touches network.</div>
                  <div className="term-grid">
                    <div className="term-cell">
                      <span className="term-cell-title">Confidentiality Guarantee</span>
                      <span className="term-badge term-badge--emerald">US DTSA 18 U.S.C. § 1836 Trade Secret Protective Standard</span>
                    </div>
                    <div className="term-cell">
                      <span className="term-cell-title">Decentralized Storage Reference</span>
                      <code className="term-hash">ipfs://QmTALWmwcojAxdJxJK4gyNBbnWtUPT7c4fwSpWzwQUPXR5</code>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "license" && (
                <div className="term-content">
                  <div className="term-line">
                    <span className="term-prompt">$</span>
                    <span className="term-cmd">ipvault protocol --set-terms PIL_COMMERCIAL_REMIX --royalty 500bps</span>
                  </div>
                  <div className="term-log term-log--muted">Deploying Story Protocol Programmable IP Licensing terms to on-chain registry...</div>
                  <div className="term-grid">
                    <div className="term-cell">
                      <span className="term-cell-title">License Framework</span>
                      <span className="term-proof">Commercialization Permitted · 5.0% Revenue Royalty Share</span>
                    </div>
                    <div className="term-cell">
                      <span className="term-cell-title">Smart Contract Method</span>
                      <code className="term-hash">IPVaultProtocol.registerIPRecord(bytes32, string, IPCategory, LicenseTerms)</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          EVIDENTIARY STANDARDS & COMPLIANCE BAR
      ══════════════════════════════════════════════════ */}
      <section className="lp-standards" id="standards">
        <div className="lp-container">
          <div className="lp-standards__label">
            <span>AUDITED EVIDENTIARY & CRYPTOGRAPHIC FRAMEWORKS</span>
          </div>
          <div className="lp-standards__grid">
            <div className="lp-standards__item">
              <Scale size={20} className="std-icon" />
              <div className="std-info">
                <strong>US DTSA § 1836</strong>
                <span>Defend Trade Secrets Act</span>
              </div>
            </div>
            <div className="lp-standards__item">
              <Award size={20} className="std-icon" />
              <div className="std-info">
                <strong>EU Directive 2016/943</strong>
                <span>Trade Secret Protection</span>
              </div>
            </div>
            <div className="lp-standards__item">
              <FileCheck2 size={20} className="std-icon" />
              <div className="std-info">
                <strong>WIPO Prior Art</strong>
                <span>Defensive Publication Standard</span>
              </div>
            </div>
            <div className="lp-standards__item">
              <Cpu size={20} className="std-icon" />
              <div className="std-info">
                <strong>FIPS 180-4 / 197</strong>
                <span>Hardware Web Crypto API</span>
              </div>
            </div>
            <div className="lp-standards__item">
              <Boxes size={20} className="std-icon" />
              <div className="std-info">
                <strong>ERC-721 EVM</strong>
                <span>Ethereum Consensus Registry</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BENTO GRID ARCHITECTURE (BERNSTEIN + STORY MODEL)
      ══════════════════════════════════════════════════ */}
      <section className="lp-bento" id="architecture">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-tag">PROTOCOL ARCHITECTURE</span>
            <h2 className="lp-section-heading">Engineered for Legal & Technical Rigor</h2>
            <p className="lp-section-sub">
              Designed after Bernstein.io notarization certificates and Story Protocol programmable IP licensing.
            </p>
          </div>

          <div className="lp-bento__grid">
            {/* Bento Card 1: Zero-Knowledge Encryption (Span 2) */}
            <div className="lp-bento__card lp-bento__card--hero">
              <div className="lp-bento__icon-box">
                <Lock size={22} className="bento-icon" />
              </div>
              <div className="lp-bento__badge">Zero-Knowledge Architecture</div>
              <h3 className="lp-bento__title">Client-Side AES-256-GCM Hardware Encryption</h3>
              <p className="lp-bento__desc">
                Confidential trade secrets, source code, and unpublished patent disclosures are encrypted locally
                inside the browser's Web Crypto hardware sandbox before transmission. No unencrypted plaintext ever
                touches IPFS, pinning services, or our servers.
              </p>
              <div className="lp-bento__schematic">
                <div className="sch-step">
                  <span className="sch-step__title">Local File</span>
                  <span className="sch-step__sub">Plaintext in RAM</span>
                </div>
                <span className="sch-arrow">→</span>
                <div className="sch-step sch-step--active">
                  <span className="sch-step__title">Web Crypto API</span>
                  <span className="sch-step__sub">AES-GCM-256 + 96b IV</span>
                </div>
                <span className="sch-arrow">→</span>
                <div className="sch-step">
                  <span className="sch-step__title">IPFS Storage</span>
                  <span className="sch-step__sub">Ciphertext Payload</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Public Drag-and-Drop Verifier */}
            <div className="lp-bento__card">
              <div className="lp-bento__icon-box">
                <Fingerprint size={22} className="bento-icon" />
              </div>
              <div className="lp-bento__badge">Wallet-Free Verification</div>
              <h3 className="lp-bento__title">Public Prior Art Verifier</h3>
              <p className="lp-bento__desc">
                Patent examiners, legal counsel, and venture investors can drag & drop any document to compute
                its cryptographic hash in-browser and prove exact date of existence on Ethereum with zero crypto required.
              </p>
              <button className="lp-bento__link" onClick={onSelectVerifier}>
                <span>Launch Public Verifier</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Bento Card 3: Bernstein Notarization Certificate */}
            <div className="lp-bento__card">
              <div className="lp-bento__icon-box">
                <FileText size={22} className="bento-icon" />
              </div>
              <div className="lp-bento__badge">Evidentiary Attestation</div>
              <h3 className="lp-bento__title">Bernstein-Style Notarization Certificates</h3>
              <p className="lp-bento__desc">
                Generate high-resolution Certificate of Prior Art documents complete with dynamic QR codes,
                on-chain block height seals, legal declarations, and printable A4 PDF export styling.
              </p>
              <div className="lp-bento__tags">
                <span className="mini-tag">Official Seal</span>
                <span className="mini-tag">Dynamic QR</span>
                <span className="mini-tag">A4 PDF Print</span>
              </div>
            </div>

            {/* Bento Card 4: Story Protocol Licensing (Span 2) */}
            <div className="lp-bento__card lp-bento__card--wide">
              <div className="lp-bento__icon-box">
                <Scale size={22} className="bento-icon" />
              </div>
              <div className="lp-bento__badge">Story Protocol PIL Standard</div>
              <h3 className="lp-bento__title">Programmable Licensing & On-Chain Royalty Terms</h3>
              <p className="lp-bento__desc">
                Move beyond static copyright notices. Protocol v2 binds programmable legal licenses directly
                to smart contract tokens—enforcing commercial derivative permissions, basis-point royalties,
                or defensive open innovation terms directly on the EVM.
              </p>
              <div className="lp-bento__pills">
                <span className="pill-item">🚫 All Rights Reserved</span>
                <span className="pill-item">🏛️ Open Innovation</span>
                <span className="pill-item">💼 Commercial Royalty Terms</span>
                <span className="pill-item">🌐 CC-BY 4.0</span>
              </div>
            </div>

            {/* Bento Card 5: In-Memory VDR Document Viewer */}
            <div className="lp-bento__card">
              <div className="lp-bento__icon-box">
                <Eye size={22} className="bento-icon" />
              </div>
              <div className="lp-bento__badge">Virtual Data Room</div>
              <h3 className="lp-bento__title">Encrypted In-Memory Viewer</h3>
              <p className="lp-bento__desc">
                Authorized partners decrypt assets on-the-fly in browser RAM. Embedded document viewing for
                PDFs, source code, and media without risking local malware or antivirus download intercepts.
              </p>
              <button className="lp-bento__link" onClick={onSelectViewer}>
                <span>Enter Protected Viewer</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS — PROTOCOL WORKFLOW
      ══════════════════════════════════════════════════ */}
      <section className="lp-workflow" id="how-it-works">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-tag">OPERATIONAL FLOW</span>
            <h2 className="lp-section-heading">Three-Step Cryptographic Attestation</h2>
          </div>

          <div className="lp-workflow__steps">
            <div className="workflow-step">
              <div className="workflow-step__num">01</div>
              <div className="workflow-step__content">
                <h4 className="workflow-step__title">Local Fingerprint & Hardware Encryption</h4>
                <p className="workflow-step__desc">
                  Your browser computes a 256-bit SHA-256 digest in microseconds. For trade secrets, Web Crypto
                  generates an AES-256-GCM symmetric key and encrypts the payload before upload.
                </p>
              </div>
            </div>

            <div className="workflow-step">
              <div className="workflow-step__num">02</div>
              <div className="workflow-step__content">
                <h4 className="workflow-step__title">Ethereum Consensus Anchoring</h4>
                <p className="workflow-step__desc">
                  The SHA-256 fingerprint, IP category, and licensing terms are minted as an ERC-721 record on Ethereum
                  Sepolia, binding the asset permanently to block height consensus.
                </p>
              </div>
            </div>

            <div className="workflow-step">
              <div className="workflow-step__num">03</div>
              <div className="workflow-step__content">
                <h4 className="workflow-step__title">Prior Art Certification & Distribution</h4>
                <p className="workflow-step__desc">
                  Issue tamper-evident cryptographic access keys to authorized partners, or generate official
                  Bernstein legal certificates for court admissibility and patent preemption.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FINAL INSTITUTIONAL CALLOUT & FOOTER
      ══════════════════════════════════════════════════ */}
      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta__box">
            <div className="lp-cta__content">
              <span className="lp-cta__tag">INSTITUTIONAL DEPLOYMENT</span>
              <h2 className="lp-cta__title">Start Notarizing Intellectual Property Today</h2>
              <p className="lp-cta__desc">
                Connect your Ethereum wallet to establish immutable prior art, certify trade secrets,
                and enforce commercial licensing on decentralized infrastructure.
              </p>
              <div className="lp-cta__actions">
                <button
                  className="lp-btn lp-btn--emerald"
                  onClick={onSelectCreator}
                  id="cta-creator-btn"
                >
                  <ShieldCheck size={18} />
                  <span>Launch Creator Dashboard</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  className="lp-btn lp-btn--outline"
                  onClick={onSelectVerifier}
                  id="cta-verifier-btn"
                >
                  <Search size={18} />
                  <span>Open Public Verifier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Minimal Technical Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer__inner">
            <div className="lp-footer__col">
              <div className="lp-footer__brand">
                <ShieldCheck size={18} className="footer-logo" />
                <span className="footer-name">IP VAULT PROTOCOL</span>
              </div>
              <p className="lp-footer__copy">
                Decentralized intellectual property notarization, trade secret protection, and programmable licensing.
              </p>
            </div>

            <div className="lp-footer__col lp-footer__col--specs">
              <span className="spec-label">REGISTRY CONTRACT</span>
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="spec-link"
              >
                <code>{CONTRACT_ADDRESS}</code>
                <ExternalLink size={12} />
              </a>
              <span className="spec-network">Ethereum Sepolia · Chain ID 11155111 · Web3 ERC-721</span>
            </div>
          </div>

          <div className="lp-footer__bottom">
            <span>© 2026 IP Vault Protocol. Architectural benchmark inspired by Bernstein.io & Story Protocol.</span>
            <span>Evidentiary compliance with US DTSA 18 U.S.C. § 1836 & EU Directive 2016/943.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
