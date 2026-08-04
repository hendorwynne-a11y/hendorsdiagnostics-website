import React, { useMemo, useState } from "react";
import { LOGO_DATA_URL } from "./brandAssets.js";

const SUPABASE_URL = "https://acqahzuiozxfuqyqmgqr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcWFoenVpb3p4ZnVxeXFtZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTY5MjYsImV4cCI6MjA5MzQ5MjkyNn0.8BMl5bjtI0o23eAG5j5p53Pun_h1s8cecY6xiTVs6aE";

const SERVICES = [
  ["Pregnancy Ultrasound", "Early viability, NT, detailed anomaly, growth and Doppler assessments."],
  ["Abdominal & Renal", "Liver, gallbladder, pancreas, spleen, kidneys, bladder and aorta."],
  ["Women’s Health", "Pelvic, transabdominal and transvaginal ultrasound examinations."],
  ["Small Parts", "Thyroid, breast, testes, soft tissue, hernia and lymph-node assessment."],
  ["Vascular Doppler", "DVT, carotid and peripheral vascular Doppler examinations."],
  ["Musculoskeletal", "Shoulder, knee, Achilles tendon and focused soft-tissue ultrasound."],
];

const SCANS = [
  "Early pregnancy scan", "NT scan (11–13+6 weeks)", "Detailed anomaly scan (19–24 weeks)",
  "Pregnancy growth scan", "Abdominal ultrasound", "Renal / bladder ultrasound",
  "Pelvic ultrasound", "Transvaginal ultrasound", "Breast ultrasound", "Thyroid ultrasound",
  "Scrotal ultrasound", "DVT Doppler ultrasound", "Carotid Doppler ultrasound",
  "Musculoskeletal ultrasound", "Soft tissue / hernia ultrasound", "Other ultrasound examination"
];

function go(id) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }

export default function LandingPage({ onStaffLogin }) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", scan_type: "", preferred_date: "",
    preferred_time: "", referring_doctor: "", payment_type: "Cash / Private", notes: ""
  });

  const set = (name, value) => { setForm(p => ({ ...p, [name]: value })); setError(""); };
  const openBooking = () => { setSuccess(false); setError(""); setBookingOpen(true); setMenuOpen(false); };

  async function submit(e) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.scan_type || !form.preferred_date) {
      setError("Please complete your name, phone number, scan type and preferred date."); return;
    }
    setSending(true);
    setError("");
    try {
      const bookingRef = `WEB-${Date.now().toString(36).toUpperCase()}`;
      const requestedTime = form.preferred_time || "Any available time";

      // Website submissions are booking REQUESTS, not confirmed appointments.
      // start_time stays NULL so a confirmed appointment cannot block the request.
      const payload = {
        patient_name: form.full_name.trim(),
        patient_phone: form.phone.trim(),
        appointment_date: form.preferred_date,
        start_time: null,
        study_type: form.scan_type,
        status: "Online Request",
        location: "George",
        doctor: form.referring_doctor.trim() || null,
        notes: [
          `Booking reference: ${bookingRef}`,
          `Requested time: ${requestedTime}`,
          form.email.trim() ? `Email: ${form.email.trim()}` : "",
          `Payment: ${form.payment_type}`,
          form.notes.trim()
        ].filter(Boolean).join("\n")
      };

      const res = await fetch(`${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/appointments`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`HTTP ${res.status}: ${detail || res.statusText}`);
      }
      setSuccess(true);
    } catch (err) {
      console.error("HD ONE booking submission failed", err);
      const detail = String(err?.message || err || "Unknown error");
      setError(`The request could not be submitted. ${detail.slice(0, 260)}`);
    } finally { setSending(false); }
  }

  return <div className="hd">
    <header>
      <button className="logo" onClick={() => go("home")}><img src={LOGO_DATA_URL} alt="Hendors Diagnostics" /></button>
      <nav className={menuOpen ? "open" : ""}>
        <button onClick={() => go("services")}>Services</button>
        <button onClick={() => go("journey")}>Your journey</button>
        <button onClick={() => go("about")}>About</button>
        <button onClick={() => go("contact")}>Contact</button>
        <button onClick={onStaffLogin}>Staff portal</button>
      </nav>
      <div className="actions"><button className="book" onClick={openBooking}>Book a scan</button><button className="hamb" onClick={() => setMenuOpen(v => !v)}>☰</button></div>
    </header>

    <main>
      <section id="home" className="hero">
        <div className="copy">
          <div className="eyebrow">ADVANCED DIAGNOSTIC ULTRASOUND IN GEORGE</div>
          <h1>Precision imaging.<br/><em>Personal care.</em></h1>
          <p>Choose Hendors Diagnostics for an ultrasound experience where modern technology, experienced care and an intelligent digital workflow connect every step—from your booking request to the final diagnostic report in your hands.</p>
          <div className="buttons"><button className="primary" onClick={openBooking}>Request an appointment →</button><button className="secondary" onClick={() => go("journey")}>See how it works</button></div>
          <div className="trust"><div><b>23+</b><span>Years of experience</span></div><div><b>HD ONE</b><span>Connected workflow</span></div><div><b>Doctor-ready</b><span>Professional reports</span></div></div>
        </div>
        <div className="visual">
          <div className="scanner">
            <div className="scanhead"><span>HD ONE</span><span>● LIVE WORKFLOW</span></div>
            <div className="screen"><div className="beam"/><div className="ring r1"/><div className="ring r2"/><div className="core"/><small>DIAGNOSTIC ULTRASOUND</small></div>
            <div className="steps"><span>✓ Booking</span><i/><span>✓ Scan</span><i/><span>● Report</span><i/><span>Delivery</span></div>
          </div>
        </div>
      </section>

      <section className="strip"><span>ONLINE BOOKING</span><span>MODERN ULTRASOUND</span><span>EXPERIENCED SONOGRAPHER</span><span>STRUCTURED REPORTING</span><span>RAPID COMMUNICATION</span></section>

      <section id="services" className="section">
        <div className="heading"><div><small>OUR SERVICES</small><h2>Comprehensive ultrasound care, delivered with precision.</h2></div><p>From pregnancy imaging to focused diagnostic examinations, each scan is performed with careful attention and professionally documented findings.</p></div>
        <div className="grid">{SERVICES.map(([title,text],i)=><article key={title}><span>0{i+1}</span><div className="icon">◉</div><h3>{title}</h3><p>{text}</p><button onClick={openBooking}>Book this service ↗</button></article>)}</div>
      </section>

      <section id="journey" className="journey">
        <div className="journeyIntro"><small>THE HD ONE EXPERIENCE</small><h2>One connected journey. No unnecessary repetition.</h2><p>Your information follows a structured digital pathway from booking through reception, examination, reporting and final communication.</p><button onClick={openBooking}>Start your booking</button></div>
        <div className="journeyList">{[
          ["01","Request your booking","Choose your scan, preferred date and contact details online."],
          ["02","Receive confirmation","Reception reviews your request and confirms the appointment."],
          ["03","Attend your examination","Your ultrasound is performed with modern imaging technology and personal care."],
          ["04","Professional reporting","Findings are documented in a structured diagnostic ultrasound report."],
          ["05","Report delivered","Your report is prepared for you and your referring doctor."]
        ].map(x=><div className="journeyItem" key={x[0]}><span>{x[0]}</span><div><h3>{x[1]}</h3><p>{x[2]}</p></div></div>)}</div>
      </section>

      <section id="about" className="section about">
        <div className="aboutCard"><div className="portrait"><div>HW</div><small>HENDOR L. WYNNE</small></div><div className="aboutCopy"><small>EXPERIENCE YOU CAN TRUST</small><h2>Clinical experience supported by modern technology.</h2><p>Hendors Diagnostics is led by Hendor L. Wynne, a qualified medical sonographer and diagnostic radiographer with more than 23 years of ultrasound experience.</p><p>Every examination is approached with careful imaging, clear communication and a professional report that supports the next step in your healthcare.</p><div className="credentials"><div><b>Medical Sonographer</b><span>Advanced ultrasound practice</span></div><div><b>Diagnostic Radiographer</b><span>Medical imaging foundation</span></div><div><b>HPCSA Registered</b><span>DR 0092673</span></div><div><b>George, Western Cape</b><span>Private diagnostic service</span></div></div></div></div>
      </section>

      <section className="cta"><div><small>READY TO BOOK?</small><h2>Your diagnostic journey can start right here.</h2><p>Submit your appointment request online and our team will confirm the date, time and preparation requirements.</p></div><button onClick={openBooking}>Request your appointment →</button></section>
    </main>

    <footer id="contact"><div><img src={LOGO_DATA_URL} alt="Hendors Diagnostics"/><p>Precision ultrasound, personal care and connected digital reporting.</p></div><div><h4>Contact</h4><a href="tel:+27727636282">072 763 6282</a><a href="tel:+27814882066">081 488 2066</a><a href="mailto:reception.hendors@gmail.com">reception.hendors@gmail.com</a></div><div><h4>Visit us</h4><p>69 Meade Street<br/>George Central<br/>George, 6529</p></div><div><h4>Quick access</h4><button onClick={openBooking}>Book a scan</button><button onClick={onStaffLogin}>Staff portal</button></div><div className="footbottom">© {new Date().getFullYear()} Hendors Diagnostics · HPCSA DR 0092673</div></footer>

    {bookingOpen && <div className="backdrop" onMouseDown={e => e.target===e.currentTarget && setBookingOpen(false)}><div className="modal"><button className="close" onClick={()=>setBookingOpen(false)}>×</button>{!success?<><small>ONLINE BOOKING REQUEST</small><h2>Let’s arrange your ultrasound.</h2><p>Complete the form below. Reception will confirm the final appointment time.</p><form onSubmit={submit}>
      <label>Full name *<input value={form.full_name} onChange={e=>set("full_name",e.target.value)} /></label>
      <label>WhatsApp / phone *<input value={form.phone} onChange={e=>set("phone",e.target.value)} /></label>
      <label>Email<input type="email" value={form.email} onChange={e=>set("email",e.target.value)} /></label>
      <label>Ultrasound examination *<select value={form.scan_type} onChange={e=>set("scan_type",e.target.value)}><option value="">Select examination</option>{SCANS.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Preferred date *<input type="date" min={minDate} value={form.preferred_date} onChange={e=>set("preferred_date",e.target.value)} /></label>
      <label>Preferred time<select value={form.preferred_time} onChange={e=>set("preferred_time",e.target.value)}><option value="">Any available time</option>{["16:15","16:45","17:15","17:45","18:15","18:45"].map(t=><option key={t}>{t}</option>)}</select></label>
      <label>Referring doctor<input value={form.referring_doctor} onChange={e=>set("referring_doctor",e.target.value)} /></label>
      <label>Payment option<select value={form.payment_type} onChange={e=>set("payment_type",e.target.value)}><option>Cash / Private</option><option>Medical Aid</option></select></label>
      <label className="full">Clinical details or message<textarea value={form.notes} onChange={e=>set("notes",e.target.value)} /></label>
      {error&&<div className="error full">{error}</div>}<div className="note full">This is a booking request. Your appointment is confirmed only after reception contacts you.</div><button className="submit full" disabled={sending}>{sending?"Submitting request…":"Submit booking request →"}</button>
    </form></>:<div className="success"><div>✓</div><small>REQUEST RECEIVED</small><h2>Thank you, {form.full_name.split(" ")[0]}.</h2><p>Your booking request has been sent. Reception will contact you to confirm the appointment and preparation instructions.</p><button onClick={()=>setBookingOpen(false)}>Return to website</button></div>}</div></div>}

    <style>{`
      :root{--navy:#0b2740;--blue:#0f75a8;--cyan:#54d6d2;--ink:#0b1b2b;--muted:#607181;--line:#dbe5ea}*{box-sizing:border-box}body{margin:0}.hd{font-family:Inter,system-ui,sans-serif;color:var(--ink);overflow:hidden}.hd button,.hd input,.hd select,.hd textarea{font:inherit}.hd button{cursor:pointer}header{position:fixed;z-index:50;top:0;left:0;right:0;height:82px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:#ffffffed;backdrop-filter:blur(18px);border-bottom:1px solid #0b274014}.logo{border:0;background:none}.logo img{width:210px;max-height:58px;object-fit:contain}nav{display:flex;gap:26px}nav button{border:0;background:none;color:#405667;font-weight:700;font-size:14px}.actions{display:flex;gap:10px}.book{border:0;border-radius:999px;background:var(--navy);color:#fff;padding:13px 20px;font-weight:800}.hamb{display:none;border:0;background:none;font-size:24px}.hero{min-height:850px;padding:150px 6vw 70px;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;background:linear-gradient(135deg,#f8fbfc,#eaf4f6)}.copy{max-width:760px}.eyebrow,.section small,.journey small,.about small,.cta small,.modal>small,.success small{font-size:12px;letter-spacing:.15em;font-weight:900;color:var(--blue)}h1{font-size:clamp(55px,6vw,92px);line-height:.96;letter-spacing:-.055em;margin:24px 0}h1 em{font-style:normal;color:var(--blue);font-weight:500}.copy>p{font-size:19px;line-height:1.7;color:#506577}.buttons{display:flex;gap:14px;margin:34px 0 40px}.primary,.secondary{padding:16px 23px;border-radius:999px;font-weight:800}.primary{border:0;background:var(--blue);color:white}.secondary{border:1px solid #c8d9e0;background:white}.trust{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;border-top:1px solid #cadce3;padding-top:24px}.trust div{display:flex;flex-direction:column;gap:4px}.trust span{font-size:12px;color:#768995}.visual{display:grid;place-items:center}.scanner{width:min(520px,90%);padding:18px;border-radius:28px;background:#071a29;box-shadow:0 45px 80px #06233444}.scanhead,.steps{display:flex;align-items:center;color:#9ab6c5;font-size:11px;letter-spacing:.1em}.scanhead{justify-content:space-between;padding:3px 5px 14px}.screen{height:410px;position:relative;overflow:hidden;border-radius:18px;background:radial-gradient(ellipse at 50% 75%,#8ce8df,#2d7a86 13%,#173d50 27%,#07131f 64%)}.beam{position:absolute;left:20%;right:20%;top:-10%;height:90%;clip-path:polygon(43% 0,57% 0,100% 100%,0 100%);background:#8debe02a}.ring{position:absolute;border:2px solid #8debe06b;border-radius:50%}.r1{width:230px;height:155px;left:28%;top:40%;transform:rotate(-16deg)}.r2{width:140px;height:100px;left:40%;top:50%;transform:rotate(20deg)}.core{position:absolute;width:85px;height:60px;left:47%;top:56%;border-radius:50%;background:radial-gradient(circle,#d6fff8,#5bc3bb 38%,#143b48 75%)}.screen small{position:absolute;left:18px;bottom:15px;color:#a3bfcc}.steps{gap:8px;padding:17px 4px 2px}.steps i{height:1px;flex:1;background:#28485b}.strip{background:var(--navy);color:#bed0da;display:flex;justify-content:center;gap:28px;flex-wrap:wrap;padding:22px;font-size:10px;letter-spacing:.13em;font-weight:900}.section{padding:115px 6vw}.heading{max-width:1400px;margin:auto auto 50px;display:grid;grid-template-columns:1.2fr .8fr;gap:70px;align-items:end}.heading h2,.journey h2,.about h2,.cta h2{font-size:clamp(38px,4.2vw,62px);line-height:1.06;letter-spacing:-.04em;margin:14px 0}.heading p,.about p{color:var(--muted);line-height:1.75}.grid{max-width:1400px;margin:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.grid article{min-height:300px;position:relative;padding:30px;border:1px solid var(--line);border-radius:22px;background:linear-gradient(145deg,#fff,#f8fbfc)}.grid article>span{position:absolute;right:24px;color:#9dadb8}.icon{width:50px;height:50px;border-radius:15px;display:grid;place-items:center;background:#e8f7f6;color:var(--blue);font-size:23px}.grid h3{margin:25px 0 10px}.grid p{color:var(--muted);line-height:1.65;font-size:14px}.grid button{position:absolute;left:30px;bottom:26px;border:0;background:none;color:var(--blue);font-weight:800}.journey{display:grid;grid-template-columns:.9fr 1.1fr;background:linear-gradient(135deg,#071a29,#0b3048);color:#fff}.journeyIntro,.journeyList{padding:105px 7vw}.journeyIntro p{color:#b6cad4;line-height:1.8}.journeyIntro button{margin-top:24px;border:1px solid #57798b;background:none;color:#fff;border-radius:999px;padding:14px 20px}.journeyItem{display:grid;grid-template-columns:65px 1fr;gap:18px;padding:24px 0;border-bottom:1px solid #ffffff1f}.journeyItem>span{color:#5ad7cc}.journeyItem h3{margin:0 0 7px}.journeyItem p{margin:0;color:#9fb6c1;line-height:1.6;font-size:14px}.about{background:#f5f8f9}.aboutCard{max-width:1400px;margin:auto;display:grid;grid-template-columns:.8fr 1.2fr;background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 25px 60px #173c4c14}.portrait{min-height:600px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;background:linear-gradient(145deg,#0a2235,#0d4960);color:white}.portrait>div{width:230px;height:230px;border-radius:50%;display:grid;place-items:center;border:9px double #7cddd1;color:#bdece7;font:70px Georgia}.portrait small{color:#b6d2db}.aboutCopy{padding:70px}.credentials{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);margin-top:28px}.credentials div{background:white;padding:19px;display:flex;flex-direction:column;gap:4px}.credentials span{font-size:12px;color:#83929c}.cta{padding:85px 7vw;background:linear-gradient(110deg,#0e719f,#0c405e);color:white;display:flex;align-items:center;justify-content:space-between;gap:40px}.cta>div{max-width:850px}.cta p{color:#cee5ed;line-height:1.7}.cta button{flex:none;border:0;background:white;color:var(--navy);border-radius:999px;padding:17px 24px;font-weight:900}footer{padding:70px 6vw 25px;background:#06141f;color:#aec1cb;display:grid;grid-template-columns:1.4fr 1fr 1fr .8fr;gap:40px}footer img{width:215px;filter:brightness(0) invert(1)}footer h4{color:white}footer a,footer p,footer button{display:block;color:#aec1cb;text-decoration:none;line-height:1.8;font-size:13px}footer button{border:0;background:none;padding:0}.footbottom{grid-column:1/-1;border-top:1px solid #ffffff18;padding-top:22px;font-size:11px}.backdrop{position:fixed;z-index:1000;inset:0;background:#03121dcc;backdrop-filter:blur(9px);display:grid;place-items:center;padding:20px;overflow:auto}.modal{position:relative;width:min(900px,100%);max-height:94vh;overflow:auto;background:white;border-radius:25px;padding:42px;box-shadow:0 40px 90px #0007}.close{position:absolute;right:18px;top:14px;width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:white;font-size:24px}.modal h2{font-size:38px;margin:12px 0}.modal>p,.success p{color:var(--muted);line-height:1.7}.modal form{display:grid;grid-template-columns:1fr 1fr;gap:17px;margin-top:25px}.modal label{display:flex;flex-direction:column;gap:7px;font-size:11px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:#526979}.modal input,.modal select,.modal textarea{border:1px solid #cfdde3;border-radius:11px;padding:13px;background:#fbfcfd;outline:none}.modal textarea{min-height:95px}.full{grid-column:1/-1}.error{background:#fff0f2;color:#b4233d;padding:12px;border-radius:10px}.note{font-size:12px;color:#738692}.submit{border:0;border-radius:999px;padding:15px;background:var(--blue);color:white;font-weight:900}.success{text-align:center;padding:45px 10px}.success>div{width:72px;height:72px;margin:auto auto 20px;border-radius:50%;display:grid;place-items:center;background:#e8f8f4;color:#16806d;font-size:34px}.success button{border:0;border-radius:999px;background:var(--navy);color:white;padding:14px 20px;font-weight:800}@media(max-width:1000px){nav{display:none;position:absolute;top:82px;left:0;right:0;background:white;padding:25px;flex-direction:column;align-items:flex-start}nav.open{display:flex}.hamb{display:block}.hero{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}.journey{grid-template-columns:1fr}.aboutCard{grid-template-columns:1fr}.heading{grid-template-columns:1fr}.cta{flex-direction:column;align-items:flex-start}footer{grid-template-columns:1fr 1fr}}@media(max-width:680px){header{height:70px;padding:0 18px}.logo img{width:155px}.book{display:none}nav{top:70px}.hero{padding:115px 20px 55px;min-height:auto}.hero h1{font-size:50px}.copy>p{font-size:16px}.trust{grid-template-columns:1fr}.visual{min-height:460px}.scanner{width:100%}.screen{height:320px}.section{padding:75px 20px}.grid{grid-template-columns:1fr}.journeyIntro,.journeyList{padding:70px 22px}.journeyItem{grid-template-columns:46px 1fr}.aboutCopy{padding:38px 23px}.portrait{min-height:350px}.credentials{grid-template-columns:1fr}.cta{padding:65px 22px}footer{grid-template-columns:1fr;padding:55px 22px 22px}.modal{padding:38px 20px 25px}.modal form{grid-template-columns:1fr}.full{grid-column:auto}}
    `}</style>
  </div>;
}

