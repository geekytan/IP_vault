import React, { useEffect, useRef } from "react";
import "./LandingPage.css";

function LandingPage({ onSelectCreator, onSelectViewer, onSelectVerifier }) {
  const heroRef = useRef(null);

  // Parallax orbs on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      const orbs = document.querySelectorAll(".lp-orb");
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      orbs.forEach((orb, i) => {
        const factor = (i + 1) * 12;
        orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="lp">
      {/* ── Background ── */}
      <div className="lp-bg">
        <div className="lp-orb lp-orb--1" />
        <div className="lp-orb lp-orb--2" />
        <div className="lp-orb lp-orb--3" />
        <div className="lp-stars">
          {[...Array(60)].map((_, i) => (
            <span key={i} className="lp-star" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
            }} />
          ))}
        </div>
      </div>

      {/* ════════════════════════════════
          SECTION 1 — HERO
      ════════════════════════════════ */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero__inner">
          {/* Badge */}
          <div className="lp-hero__badge">
            <span className="lp-hero__badge-dot" />
            Live on Sepolia Testnet
          </div>

          {/* Shield Icon */}
          <div className="lp-hero__shield-wrap">
            <div className="lp-hero__shield-ring lp-hero__shield-ring--1" />
            <div className="lp-hero__shield-ring lp-hero__shield-ring--2" />
            <div className="lp-hero__shield-icon">🛡️</div>
          </div>

          {/* Headline */}
          <h1 className="lp-hero__title">
            <span className="lp-hero__title-line">Protect Your</span>
            <span className="lp-hero__title-gradient">Intellectual Property</span>
            <span className="lp-hero__title-line">as NFTs</span>
          </h1>

          <p className="lp-hero__desc">
            Upload your creative work to IPFS, mint it as an ERC-721 NFT on the Ethereum
            blockchain, and share secure access keys — all in minutes.
          </p>

          {/* CTA Buttons */}
          <div className="lp-hero__ctas">
            <button
              className="lp-btn lp-btn--primary"
              onClick={onSelectCreator}
              id="hero-creator-btn"
            >
              <span className="lp-btn__icon">🎨</span>
              Launch Creator App
              <span className="lp-btn__arrow">→</span>
            </button>
            <button
              className="lp-btn lp-btn--secondary"
              onClick={onSelectViewer}
              id="hero-viewer-btn"
            >
              <span className="lp-btn__icon">🔑</span>
              I Have an Access Key
            </button>
            <button
              className="lp-btn lp-btn--emerald"
              onClick={onSelectVerifier}
              id="hero-verifier-btn"
            >
              <span className="lp-btn__icon">🔍</span>
              Verify Any Document
            </button>
          </div>

          {/* Tech badges */}
          <div className="lp-hero__tech">
            {["Ethereum", "IPFS", "ERC-721", "Pinata"].map((t) => (
              <span key={t} className="lp-hero__tech-badge">{t}</span>
            ))}
          </div>

          {/* Scroll hint */}
          <div className="lp-scroll-hint">
            <div className="lp-scroll-hint__mouse">
              <div className="lp-scroll-hint__wheel" />
            </div>
            <span>Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          SECTION 2 — HOW IT WORKS
      ════════════════════════════════ */}
      <section className="lp-how" id="how-it-works">
        <div className="lp-container">
          <div className="lp-section-label">How It Works</div>
          <h2 className="lp-section-title">Three steps to secure your IP</h2>
          <p className="lp-section-desc">
            From upload to blockchain-verified ownership in under a minute.
          </p>

          <div className="lp-steps">
            {/* Step 1 */}
            <div className="lp-step" id="step-1">
              <div className="lp-step__num">01</div>
              <div className="lp-step__icon-wrap lp-step__icon-wrap--blue">
                <span className="lp-step__icon">📁</span>
              </div>
              <h3 className="lp-step__title">Upload to IPFS</h3>
              <p className="lp-step__desc">
                Drop your file and we'll pin it to IPFS via Pinata. You get a permanent,
                content-addressed CID that can never be altered.
              </p>
            </div>

            <div className="lp-step-connector">
              <div className="lp-step-connector__line" />
              <div className="lp-step-connector__dot" />
            </div>

            {/* Step 2 */}
            <div className="lp-step" id="step-2">
              <div className="lp-step__num">02</div>
              <div className="lp-step__icon-wrap lp-step__icon-wrap--violet">
                <span className="lp-step__icon">🎨</span>
              </div>
              <h3 className="lp-step__title">Mint as NFT</h3>
              <p className="lp-step__desc">
                Mint an ERC-721 NFT with your IPFS metadata on-chain. Your content is
                now a proven, transferable digital asset on Ethereum.
              </p>
            </div>

            <div className="lp-step-connector">
              <div className="lp-step-connector__line" />
              <div className="lp-step-connector__dot" />
            </div>

            {/* Step 3 */}
            <div className="lp-step" id="step-3">
              <div className="lp-step__num">03</div>
              <div className="lp-step__icon-wrap lp-step__icon-wrap--cyan">
                <span className="lp-step__icon">🔑</span>
              </div>
              <h3 className="lp-step__title">Share Access Key</h3>
              <p className="lp-step__desc">
                Generate a shareable access key for any client or collaborator. They can
                view your content without needing a wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          SECTION 3 — FEATURES
      ════════════════════════════════ */}
      <section className="lp-features" id="features">
        <div className="lp-container">
          <div className="lp-section-label">Why IP Vault</div>
          <h2 className="lp-section-title">Everything you need to protect your work</h2>

          <div className="lp-features__grid">
            {[
              {
                icon: "🌐",
                color: "blue",
                title: "Decentralized Storage",
                desc: "Your content is stored on IPFS — no central server, no single point of failure.",
              },
              {
                icon: "🏷️",
                color: "violet",
                title: "ERC-721 NFTs",
                desc: "Industry-standard tokens give you provable, on-chain ownership recognized globally.",
              },
              {
                icon: "🔐",
                color: "cyan",
                title: "Access Key System",
                desc: "Share without exposing. Generate single-use keys for authorized viewers.",
              },
              {
                icon: "⛓️",
                color: "emerald",
                title: "Ethereum Backed",
                desc: "Every mint is a permanent blockchain transaction — immutable and transparent.",
              },
              {
                icon: "🔒",
                color: "rose",
                title: "Tamper-Proof",
                desc: "CIDs are cryptographic hashes. Any modification changes the hash, exposing tampering.",
              },
              {
                icon: "📤",
                color: "amber",
                title: "Transferable Ownership",
                desc: "Send your NFT to any wallet address, transferring IP rights in a single transaction.",
              },
            ].map((f) => (
              <div key={f.title} className={`lp-feature-card lp-feature-card--${f.color}`}>
                <div className={`lp-feature-card__icon-wrap lp-feature-card__icon-wrap--${f.color}`}>
                  <span className="lp-feature-card__icon">{f.icon}</span>
                </div>
                <h3 className="lp-feature-card__title">{f.title}</h3>
                <p className="lp-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          SECTION 4 — STATS BAR
      ════════════════════════════════ */}
      <section className="lp-stats" id="stats">
        <div className="lp-container">
          <div className="lp-stats__grid">
            {[
              { value: "ERC-721", label: "Token Standard", color: "blue" },
              { value: "IPFS", label: "Decentralized Storage", color: "violet" },
              { value: "Pinata", label: "IPFS Pinning Service", color: "cyan" },
              { value: "Sepolia", label: "Ethereum Testnet", color: "emerald" },
            ].map((s) => (
              <div key={s.label} className="lp-stat-item">
                <div className={`lp-stat-item__value lp-stat-item__value--${s.color}`}>
                  {s.value}
                </div>
                <div className="lp-stat-item__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          SECTION 5 — CTA + FOOTER
      ════════════════════════════════ */}
      <section className="lp-cta" id="cta">
        <div className="lp-container">
          <div className="lp-cta__card">
            <div className="lp-cta__orb lp-cta__orb--1" />
            <div className="lp-cta__orb lp-cta__orb--2" />
            <div className="lp-cta__icon">🛡️</div>
            <h2 className="lp-cta__title">Ready to protect your intellectual property?</h2>
            <p className="lp-cta__desc">
              Connect your MetaMask wallet and start minting your creative work as NFTs today.
            </p>
            <div className="lp-cta__btns">
              <button
                className="lp-btn lp-btn--primary lp-btn--large"
                onClick={onSelectCreator}
                id="cta-creator-btn"
              >
                <span>🎨</span> Start as Creator
              </button>
              <button
                className="lp-btn lp-btn--ghost"
                onClick={onSelectViewer}
                id="cta-viewer-btn"
              >
                <span>🔑</span> Enter Access Key
              </button>
              <button
                className="lp-btn lp-btn--emerald"
                onClick={onSelectVerifier}
                id="cta-verifier-btn"
              >
                <span>🔍</span> Verify Any File
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="lp-footer">
          <div className="lp-footer__brand">
            <span className="lp-footer__logo">🛡️</span>
            <span className="lp-footer__name">IP Vault</span>
          </div>
          <p className="lp-footer__desc">
            Decentralized intellectual property protection on Ethereum.
          </p>
          <div className="lp-footer__badges">
            {["Ethereum", "IPFS", "Pinata", "Solidity", "ERC-721"].map((b) => (
              <span key={b} className="lp-footer__badge">{b}</span>
            ))}
          </div>
          <p className="lp-footer__legal">
            Built for educational purposes · Sepolia Testnet · No real assets
          </p>
        </footer>
      </section>
    </div>
  );
}

export default LandingPage;
