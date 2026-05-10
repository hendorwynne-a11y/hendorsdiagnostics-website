import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const services = [
    "General Ultrasound",
    "Vascular Doppler",
    "Breast Ultrasound",
    "Pregnancy Ultrasound",
    "Outreach Services",
  ];

  return (
    <div className="site">
      <nav className="nav">
        <div className="brand brand-banner">
          <img
            src="/images/hd-banner.png"
            alt="Hendors Diagnostics"
            className="header-banner"
          />
        </div>

        <button className="menuBtn" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <div className={menuOpen ? "links open" : "links"}>
          <a href="#services">Services</a>
          <a href="#pricing">Prices</a>
          <a href="#patients">Patients</a>
          <a href="#doctors">Doctors</a>
          <a href="#v16">V16</a>
          <a href="#contact">Contact</a>
          <a href="#booking" className="cta">Book a scan</a>
        </div>
      </nav>

      <section className="hero">
        <div className="heroText">
          <span className="badge">✦ Next-generation diagnostic imaging platform</span>
          <h1>Future-ready imaging, intelligent workflow and precision reporting.</h1>
          <p>
            Hendors Diagnostics combines patient-focused ultrasound services with
            a secure V16 reporting ecosystem for faster intake, consistent HD Style
            reports and smarter practice management.
          </p>

          <div className="actions">
            <a href="#booking" className="button-link">Request appointment</a>
            <a href="#patients" className="button-link ghost">Scan preparation</a>
          </div>
        </div>

        <div className="panel">
          <span className="small">Hendor V16 Workflow</span>
          <h2>One intelligent practice system behind the website.</h2>
          <p>
            Public website for patients. Protected V16 area for staff reporting,
            intake, billing and document export.
          </p>

          <div className="miniGrid">
            <div>IN<br /><small>Patient intake</small></div>
            <div>HD<br /><small>HD reporting</small></div>
            <div>SC<br /><small>Secure access</small></div>
          </div>
        </div>
      </section>

      <section id="services" className="section">
        <h2>Imaging services</h2>
        <p>A clean service list for patients and referring doctors.</p>

        <div className="cards">
          {services.map((service) => (
            <div className="card" key={service}>
              <div className="icon">US</div>
              <h3>{service}</h3>
              <p>
                Professional diagnostic imaging service with clear workflow and
                structured reporting support.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="section pricing-section">
        <h2>Cash Patient Pricing</h2>
        <p>
          Estimated cash prices are listed below to help patients prepare before
          their visit. Prices may vary depending on the clinical request and final
          scan performed.
        </p>

        <div className="pricing-grid">
          <div className="price-card"><span>Abdominal Ultrasound</span><strong>R1300</strong></div>
          <div className="price-card"><span>Pelvic Ultrasound Trans-abdominal</span><strong>R980</strong></div>
          <div className="price-card"><span>Pelvic Ultrasound Transvaginal</span><strong>R900</strong></div>
          <div className="price-card"><span>Pelvic Ultrasound Combined</span><strong>R1400</strong></div>
          <div className="price-card"><span>Pregnancy Ultrasound</span><strong>R900</strong></div>
          <div className="price-card"><span>Breast Ultrasound</span><strong>R950</strong></div>
          <div className="price-card"><span>Kidneys & Bladder</span><strong>R950</strong></div>
          <div className="price-card"><span>Thyroid Ultrasound</span><strong>R950</strong></div>
          <div className="price-card"><span>Scrotal Ultrasound</span><strong>R950</strong></div>
          <div className="price-card"><span>Soft Tissue / Lump</span><strong>R950</strong></div>
          <div className="price-card"><span>Hernia Ultrasound</span><strong>R950</strong></div>
          <div className="price-card"><span>DVT Doppler</span><strong>R950</strong></div>
          <div className="price-card"><span>Carotid Doppler</span><strong>R1600</strong></div>
          <div className="price-card"><span>Other</span><strong>On request</strong></div>
        </div>

        <p className="pricing-note">
          Medical aid patients are billed according to applicable medical aid rules
          and authorisation requirements where relevant.
        </p>
      </section>

      <section id="patients" className="section split">
        <div className="card big">
          <h2>For patients</h2>
          <p>Everything patients need before arriving at the rooms.</p>
          <ul>
            <li>Bring referral letter, ID, medical aid card and previous imaging.</li>
            <li>Arrive early enough for reception to confirm your details.</li>
            <li>Check whether your scan needs fasting or a full bladder.</li>
            <li>Reports are sent to the referring doctor according to workflow.</li>
          </ul>
        </div>

        <div className="card big glow">
          <h2>Scan preparation</h2>
          <ul>
            <li>Abdominal ultrasound: fast for 6 hours if possible.</li>
            <li>Pelvic ultrasound: arrive with a comfortably full bladder.</li>
            <li>Breast, thyroid, scrotal and soft tissue: usually no prep.</li>
            <li>Doppler ultrasound: confirm preparation when booking.</li>
          </ul>
        </div>
      </section>

      <section id="doctors" className="section">
        <h2>For referring doctors</h2>
        <p>
          Referral uploads, urgent contact pathways, report delivery and secure
          V16 doctor access can be added here.
        </p>
      </section>

      <section id="v16" className="section v16">
        <h2>Hendor V16 inside the website</h2>
        <p>
          Staff use a protected login to open reporting, patient intake, doctor
          database, billing summaries and PDF/DOCX export.
        </p>
        <button>Staff login</button>
      </section>

      <section id="contact" className="section contact">
        <div className="contact-grid">
          <div className="contact-card">
            <h3>George Practice</h3>
            <p>69 Meade Street</p>
            <p>George</p>

            <a
              className="map-button"
              href="https://www.google.com/maps/search/?api=1&query=69+Meade+Street+George"
              target="_blank"
              rel="noreferrer"
            >
              Open George Map
            </a>

            <p><strong>Practice:</strong> 072 763 6282</p>
            <p><strong>WhatsApp:</strong> 068 104 2455</p>
            <p><strong>Email:</strong></p>
            <p>reception.hendors@gmail.com</p>
            <p><strong>Hours:</strong></p>
            <p>Mon – Fri: 16h00 – 17h00</p>
          </div>

          <div className="contact-card">
            <h3>Beaufort West Outreach</h3>
            <p>9 Constitution Street</p>
            <p>Cnr Constitution & Bird Street</p>

            <a
              className="map-button"
              href="https://www.google.com/maps/search/?api=1&query=9+Constitution+Street+Beaufort+West"
              target="_blank"
              rel="noreferrer"
            >
              Open Beaufort West Map
            </a>

            <p><strong>Outreach Hours:</strong></p>
            <p>Saturday: 08h00 – 17h00</p>
            <p>Sunday rollover if fully booked:</p>
            <p>09h00 – 12h00</p>
            <p><strong>No Friday bookings</strong></p>
            <p>Travel / outreach preparation</p>
          </div>
        </div>
      </section>

      <section id="booking" className="section booking-section">
        <h2>Bookings and enquiries</h2>
        <p>
          Complete the form below and send your booking request directly to
          Hendors Diagnostics via WhatsApp.
        </p>

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();

            const name = e.target.name.value;
            const phone = e.target.phone.value;
            const scan = e.target.scan.value;
            const branch = e.target.branch.value;
            const date = e.target.date.value;

            const message =
              `New Booking Request:%0A%0A` +
              `Patient: ${name}%0A` +
              `Phone: ${phone}%0A` +
              `Scan Type: ${scan}%0A` +
              `Branch: ${branch}%0A` +
              `Preferred Date: ${date}`;

            window.open(
              `https://wa.me/27681042455?text=${message}`,
              "_blank"
            );
          }}
        >
          <input name="name" placeholder="Patient name" required />
          <input name="phone" placeholder="Contact number" required />

          <select name="scan" required>
            <option value="">Select Scan Type</option>
            <option>Abdominal Ultrasound — R1300</option>
            <option>Pelvic Ultrasound Trans-abdominal — R980</option>
            <option>Pelvic Ultrasound Transvaginal — R900</option>
            <option>Pelvic Ultrasound Combined — R1400</option>
            <option>Pregnancy Ultrasound — R900</option>
            <option>Breast Ultrasound — R950</option>
            <option>Kidneys & Bladder — R950</option>
            <option>Thyroid Ultrasound — R950</option>
            <option>Scrotal Ultrasound — R950</option>
            <option>Soft Tissue / Lump — R950</option>
            <option>Hernia Ultrasound — R950</option>
            <option>DVT Doppler — R950</option>
            <option>Carotid Doppler — R1600</option>
            <option>Other — On request</option>
          </select>

          <select name="branch" required>
            <option value="">Select Branch</option>
            <option>George Practice</option>
            <option>Beaufort West Outreach</option>
          </select>

          <input type="date" name="date" required />

          <button type="submit">Send WhatsApp Booking</button>
        </form>
      </section>

      <a
        className="whatsapp-float"
        href="https://wa.me/27681042455"
        target="_blank"
        rel="noreferrer"
      >
        💬 WhatsApp Booking
      </a>

      <footer>
        <b>Hendors Diagnostics</b>
        <span>Privacy | POPIA | PAIA | Terms | Staff Login</span>
      </footer>
    </div>
  );
}