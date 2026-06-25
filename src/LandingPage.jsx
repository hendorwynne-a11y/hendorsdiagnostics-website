import React from "react";
import { LOGO_DATA_URL } from "./brandAssets.js";

const SCANS = [
  { icon: "🤰", name: "Obstetric", desc: "All trimesters: growth, anatomy, Doppler studies" },
  { icon: "🫀", name: "Abdominal", desc: "Liver, gallbladder, pancreas, spleen, aorta" },
  { icon: "🫘", name: "Renal / KUB", desc: "Kidneys, ureters, bladder assessment" },
  { icon: "🦋", name: "Thyroid", desc: "Nodule characterisation and volume assessment" },
  { icon: "🫁", name: "Pelvic", desc: "Uterus, ovaries, pouch of Douglas" },
  { icon: "🔬", name: "Soft Tissue / MSK", desc: "Breast, hernia, DVT, carotid, scrotal" },
];

export default function LandingPage({ onStaffLogin }) {
  return (
    <div className="lp-root">
      {/* ── NAV ── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-brand">
            <img src={LOGO_DATA_URL} alt="Hendors Diagnostics" className="lp-logo" />
            <span className="lp-brand-name">Hendors Diagnostics</span>
          </div>
          <nav className="lp-links">
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <p className="lp-eyebrow">Medical Sonographer · George, South Africa</p>
          <h1 className="lp-h1">
            Ultrasound done<br />
            <em>with precision.</em>
          </h1>
          <p className="lp-subhead">
            HD1.0 reporting standards. Same-day results.<br />
            Trusted by referring doctors across the Garden Route.
          </p>
          <div className="lp-cta-row">
            <a
              href="https://wa.me/27727636282?text=Hello%2C%20I%20would%20like%20to%20book%20an%20ultrasound%20scan."
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn-primary"
            >
              📅 Book via WhatsApp
            </a>
            <a href="#services" className="lp-btn-ghost">See all scans ↓</a>
          </div>
        </div>
        <div className="lp-hero-accent" aria-hidden="true">
          <div className="lp-pulse-ring" />
          <div className="lp-pulse-ring lp-pulse-ring--2" />
          <div className="lp-pulse-ring lp-pulse-ring--3" />
          <img src={LOGO_DATA_URL} alt="" className="lp-hero-logo-bg" />
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="lp-trust-bar">
        <span>✓ HPCSA Registered &mdash; DR 0092673</span>
        <span className="lp-trust-sep">·</span>
        <span>✓ 15+ years experience</span>
        <span className="lp-trust-sep">·</span>
        <span>✓ Structured HD1.0 reports</span>
        <span className="lp-trust-sep">·</span>
        <span>✓ Same-day turnaround</span>
      </div>

      {/* ── SERVICES ── */}
      <section className="lp-services" id="services">
        <div className="lp-section-inner">
          <p className="lp-section-eyebrow">What we scan</p>
          <h2 className="lp-h2">Comprehensive ultrasound services</h2>
          <div className="lp-scan-grid">
            {SCANS.map((s) => (
              <div key={s.name} className="lp-scan-card">
                <span className="lp-scan-icon">{s.icon}</span>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="lp-book-cta">
            <a
              href="https://wa.me/27727636282?text=Hello%2C%20I%20would%20like%20to%20book%20an%20ultrasound%20scan."
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn-primary"
            >
              Book your scan →
            </a>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="lp-about" id="about">
        <div className="lp-section-inner lp-about-inner">
          <div className="lp-about-text">
            <p className="lp-section-eyebrow">Who we are</p>
            <h2 className="lp-h2">Hendor L. Wynne</h2>
            <p className="lp-body">
              Qualified medical sonographer with over 15 years of diagnostic
              imaging experience. Hendors Diagnostics was founded on the belief
              that every patient deserves a thorough, clearly written report —
              not a checkbox exercise.
            </p>
            <p className="lp-body">
              Every scan is performed and reported by Hendor personally, using
              the structured HD1.0 methodology developed to ensure consistency
              and clinical usefulness for referring doctors.
            </p>
            <p className="lp-credential">HPCSA Registration DR 0092673</p>
          </div>
          <div className="lp-about-badge">
            <img src={LOGO_DATA_URL} alt="Hendors Diagnostics" className="lp-about-logo" />
            <p className="lp-about-tagline">HD1.0 Reporting Standard</p>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="lp-contact" id="contact">
        <div className="lp-section-inner">
          <p className="lp-section-eyebrow">Find us</p>
          <h2 className="lp-h2">Visit or get in touch</h2>
          <div className="lp-contact-grid">
            <div className="lp-contact-card">
              <span className="lp-contact-icon">📍</span>
              <h3>Address</h3>
              <p>69 Meade Street<br />George Central<br />George 6529</p>
            </div>
            <div className="lp-contact-card">
              <span className="lp-contact-icon">📞</span>
              <h3>Phone</h3>
              <p>
                <a href="tel:+27727636282">072 763 6282</a><br />
                <a href="tel:+27814882066">081 488 2066</a>
              </p>
            </div>
            <div className="lp-contact-card">
              <span className="lp-contact-icon">✉️</span>
              <h3>Email</h3>
              <p>
                <a href="mailto:reception.hendors@gmail.com">
                  reception.hendors@gmail.com
                </a>
              </p>
            </div>
            <div className="lp-contact-card lp-contact-card--wa">
              <span className="lp-contact-icon">💬</span>
              <h3>WhatsApp booking</h3>
              <a
                href="https://wa.me/27727636282?text=Hello%2C%20I%20would%20like%20to%20book%20an%20ultrasound%20scan."
                target="_blank"
                rel="noopener noreferrer"
                className="lp-btn-primary lp-btn-sm"
              >
                Open WhatsApp →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src={LOGO_DATA_URL} alt="Hendors Diagnostics" className="lp-footer-logo" />
            <span>Hendors Diagnostics</span>
          </div>
          <p className="lp-footer-copy">
            © {new Date().getFullYear()} Hendors Diagnostics · Hendor L. Wynne · HPCSA DR 0092673
          </p>
          {/* Small, unobtrusive staff link */}
          <button className="lp-staff-link" onClick={onStaffLogin}>
            Staff login
          </button>
        </div>
      </footer>

      <style>{`
        /* ── LANDING PAGE STYLES ── */
        .lp-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f1f35;
          background: #f8fafd;
          min-height: 100vh;
        }

        /* NAV */
        .lp-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(30,58,95,0.10);
        }
        .lp-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lp-logo {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          object-fit: cover;
        }
        .lp-brand-name {
          font-weight: 700;
          font-size: 15px;
          color: #0a1628;
          letter-spacing: -0.02em;
        }
        .lp-links {
          display: flex;
          gap: 28px;
        }
        .lp-links a {
          text-decoration: none;
          color: #3a5575;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.15s;
        }
        .lp-links a:hover { color: #2d9cdb; }

        /* HERO */
        .lp-hero {
          min-height: 88vh;
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 55%, #0d2a4a 100%);
          position: relative;
          overflow: hidden;
          padding: 80px 24px;
        }
        .lp-hero-inner {
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          position: relative;
          z-index: 2;
        }
        .lp-eyebrow {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2d9cdb;
          margin-bottom: 18px;
        }
        .lp-h1 {
          font-size: clamp(2.4rem, 5vw, 3.8rem);
          font-weight: 800;
          line-height: 1.08;
          color: #ffffff;
          letter-spacing: -0.03em;
          margin-bottom: 22px;
        }
        .lp-h1 em {
          font-style: normal;
          color: #2d9cdb;
        }
        .lp-subhead {
          font-size: 1.05rem;
          color: rgba(255,255,255,0.72);
          line-height: 1.65;
          max-width: 520px;
          margin-bottom: 36px;
        }
        .lp-cta-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .lp-btn-primary {
          display: inline-block;
          background: #2d9cdb;
          color: #fff;
          text-decoration: none;
          padding: 14px 26px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          transition: background 0.2s, transform 0.1s;
          border: none;
          cursor: pointer;
        }
        .lp-btn-primary:hover {
          background: #1e8bc3;
          transform: translateY(-1px);
        }
        .lp-btn-ghost {
          display: inline-block;
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          padding: 14px 26px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.18);
          transition: background 0.2s;
        }
        .lp-btn-ghost:hover { background: rgba(255,255,255,0.18); }

        /* Hero accent */
        .lp-hero-accent {
          position: absolute;
          right: 80px;
          top: 50%;
          transform: translateY(-50%);
          width: 320px;
          height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .lp-pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(45,156,219,0.25);
          animation: lpPulse 3s ease-in-out infinite;
        }
        .lp-pulse-ring { width: 220px; height: 220px; }
        .lp-pulse-ring--2 { width: 280px; height: 280px; animation-delay: 0.8s; }
        .lp-pulse-ring--3 { width: 340px; height: 340px; animation-delay: 1.6s; }
        @keyframes lpPulse {
          0%,100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.04); }
        }
        .lp-hero-logo-bg {
          width: 140px;
          height: 140px;
          border-radius: 32px;
          object-fit: cover;
          opacity: 0.22;
          position: absolute;
        }
        @media(max-width: 768px) {
          .lp-hero-accent { display: none; }
        }

        /* TRUST BAR */
        .lp-trust-bar {
          background: #0a1628;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          font-weight: 500;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          letter-spacing: 0.01em;
        }
        .lp-trust-sep { opacity: 0.3; }

        /* SERVICES */
        .lp-services {
          padding: 96px 24px;
          background: #f8fafd;
        }
        .lp-section-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .lp-section-eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #2d9cdb;
          margin-bottom: 10px;
        }
        .lp-h2 {
          font-size: clamp(1.7rem, 3vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #0a1628;
          margin-bottom: 48px;
        }
        .lp-scan-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }
        .lp-scan-card {
          background: #fff;
          border: 1px solid rgba(30,58,95,0.08);
          border-radius: 16px;
          padding: 28px;
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .lp-scan-card:hover {
          box-shadow: 0 8px 32px rgba(10,22,40,0.10);
          transform: translateY(-2px);
        }
        .lp-scan-icon {
          font-size: 26px;
          display: block;
          margin-bottom: 14px;
        }
        .lp-scan-card h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0a1628;
          margin-bottom: 8px;
        }
        .lp-scan-card p {
          font-size: 13.5px;
          color: #5a7290;
          line-height: 1.55;
        }
        .lp-book-cta {
          text-align: center;
        }

        /* ABOUT */
        .lp-about {
          background: linear-gradient(160deg, #0a1628 0%, #1e3a5f 100%);
          padding: 96px 24px;
        }
        .lp-about-inner {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 64px;
          align-items: center;
        }
        @media(max-width: 700px) {
          .lp-about-inner { grid-template-columns: 1fr; }
        }
        .lp-about .lp-section-eyebrow { color: #2d9cdb; }
        .lp-about .lp-h2 { color: #fff; }
        .lp-body {
          font-size: 15px;
          color: rgba(255,255,255,0.72);
          line-height: 1.7;
          margin-bottom: 16px;
        }
        .lp-credential {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          font-weight: 500;
          letter-spacing: 0.04em;
          margin-top: 24px;
        }
        .lp-about-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .lp-about-logo {
          width: 120px;
          height: 120px;
          border-radius: 26px;
          object-fit: cover;
          opacity: 0.85;
          border: 2px solid rgba(45,156,219,0.3);
        }
        .lp-about-tagline {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
        }

        /* CONTACT */
        .lp-contact {
          padding: 96px 24px;
          background: #f8fafd;
        }
        .lp-contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .lp-contact-card {
          background: #fff;
          border: 1px solid rgba(30,58,95,0.08);
          border-radius: 16px;
          padding: 28px;
        }
        .lp-contact-card--wa {
          border-color: rgba(45,156,219,0.25);
          background: #eef7fd;
        }
        .lp-contact-icon {
          font-size: 24px;
          display: block;
          margin-bottom: 14px;
        }
        .lp-contact-card h3 {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #5a7290;
          margin-bottom: 10px;
        }
        .lp-contact-card p {
          font-size: 14.5px;
          color: #0a1628;
          line-height: 1.65;
        }
        .lp-contact-card a {
          color: #2d9cdb;
          text-decoration: none;
        }
        .lp-contact-card a:hover { text-decoration: underline; }
        .lp-btn-sm {
          padding: 10px 18px;
          font-size: 14px;
        }

        /* FOOTER */
        .lp-footer {
          background: #0a1628;
          padding: 32px 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .lp-footer-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .lp-footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          font-weight: 600;
        }
        .lp-footer-logo {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          object-fit: cover;
          opacity: 0.7;
        }
        .lp-footer-copy {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
        }
        .lp-staff-link {
          background: none;
          border: none;
          color: rgba(255,255,255,0.2);
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
        }
        .lp-staff-link:hover {
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.06);
        }
      `}</style>
    </div>
  );
}
