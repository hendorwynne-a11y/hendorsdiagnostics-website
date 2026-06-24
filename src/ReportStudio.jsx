import React, { useState, useEffect, useRef } from "react";
import { LOGO_DATA_URL, SIGNATURE_DATA_URL } from "./brandAssets.js";

const SUPABASE_URL = "https://acqahzuiozxfuqyqmgqr.supabase.co";
// ← This key is set from the parent App.jsx via props
// We export this as a standalone page component

const SCAN_TYPES = [
  "OBSTETRIC","OB Normal","OB Detail Anomaly Scan","Detail Anomaly Scan",
  "ABDOMEN","KUB / RENAL","PELVIS","THYROID","SCROTAL","BREAST",
  "DVT / VASCULAR","CAROTID DOPPLER","MSK","SOFT TISSUE / HERNIA","OTHER"
];

// Default doctors - editable via Manage Doctors panel, persisted in Supabase 'doctors' table
const DEFAULT_DOCTORS = [
  "Dr Kritzinger","Dr Van der Merwe","Dr Joubert","Dr Smith","Dr Botha",
  "Dr Nel","Dr Pretorius","Dr Du Plessis","Dr Venter"
];

async function sbFetch(path, opts={}, key) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type": "application/json", Accept: "application/json",
      Prefer: "return=representation", ...opts.headers,
    }, ...opts,
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function aiGenerate(prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "AI request failed");
  return data.content?.[0]?.text || "";
}

// ── Voice dictation textarea ────────────────────────────────────────────────
function DictateTextarea({ value, onChange, placeholder, rows }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recogRef = useRef(null);
  const baseTextRef = useRef("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-ZA";
    recog.onresult = (e) => {
      let finalText = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      if (finalText) baseTextRef.current = (baseTextRef.current + " " + finalText).trim();
      const combined = (baseTextRef.current + " " + interim).trim();
      onChange(combined);
    };
    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    return () => { try { recog.stop(); } catch(e){} };
    // eslint-disable-next-line
  }, []);

  function toggleListen() {
    if (!supported) return;
    if (listening) {
      recogRef.current.stop();
      setListening(false);
    } else {
      baseTextRef.current = value || "";
      try {
        recogRef.current.start();
        setListening(true);
      } catch(e) {}
    }
  }

  return (
    <div className="dictate-wrap">
      <textarea
        className="s-ta"
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {supported && (
        <button
          type="button"
          className={`mic-btn ${listening ? "live" : ""}`}
          onClick={toggleListen}
          title={listening ? "Stop dictation" : "Start dictation"}
        >
          {listening ? "⏹️" : "🎤"}
        </button>
      )}
      {listening && <span className="mic-live-label">● Listening…</span>}
    </div>
  );
}

export default function ReportStudio({ supabaseKey, prefillPatient, onPrefillUsed }) {
  const [tab, setTab] = useState("new");
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [report, setReport] = useState(defaultReport());
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDrop, setShowPatientDrop] = useState(false);

  function defaultReport() {
    return {
      patient_name: "", patient_id: "", dob: "", age: "", gender: "",
      phone: "", email: "", medical_aid: "",
      exam_date: new Date().toISOString().slice(0,10),
      scan_type: "OBSTETRIC", study_title: "",
      referring_doctor: "", performed_by: "Hendor Wynne",
      // Structured biometry fields
      bpd: "", hc: "", ac: "", fl: "", efw: "", fhr: "", afi: "", placenta: "",
      // Doppler fields
      ua_pi: "", ua_ri: "", ua_sd: "", ua_edf: "",
      mca_pi: "", mca_ri: "", mca_psv: "", cpr: "",
      meas_notes: "",
      // Combined text (auto-built from fields above)
      measurements: "",
      findings: "", comment: "", impression: "", transcript: "",
      status: "Draft",
    };
  }

  // Build a clean measurements text string from structured fields
  function buildMeasText(r) {
    const lines = [];
    if (r.bpd)      lines.push(`BPD: ${r.bpd}mm`);
    if (r.hc)       lines.push(`HC: ${r.hc}mm`);
    if (r.ac)       lines.push(`AC: ${r.ac}mm`);
    if (r.fl)       lines.push(`FL: ${r.fl}mm`);
    if (r.efw)      lines.push(`EFW: ${r.efw}g`);
    if (r.fhr)      lines.push(`FHR: ${r.fhr} bpm`);
    if (r.afi)      lines.push(`AFI: ${r.afi}cm`);
    if (r.placenta) lines.push(`Placenta: ${r.placenta}`);
    if (r.ua_pi || r.ua_ri || r.ua_sd || r.ua_edf) {
      lines.push("--- Umbilical Artery Doppler ---");
      if (r.ua_pi)  lines.push(`UA PI: ${r.ua_pi}`);
      if (r.ua_ri)  lines.push(`Umb RI: ${r.ua_ri}`);
      if (r.ua_sd)  lines.push(`UA S/D: ${r.ua_sd}`);
      if (r.ua_edf) lines.push(`End Diastolic Flow: ${r.ua_edf}`);
    }
    if (r.mca_pi || r.mca_ri || r.mca_psv) {
      lines.push("--- MCA Doppler ---");
      if (r.mca_pi)  lines.push(`MCA PI: ${r.mca_pi}`);
      if (r.mca_ri)  lines.push(`MCA RI: ${r.mca_ri}`);
      if (r.mca_psv) lines.push(`MCA PSV: ${r.mca_psv} cm/s`);
      const cpr = r.ua_pi && r.mca_pi
        ? (parseFloat(r.mca_pi)/parseFloat(r.ua_pi)).toFixed(2)
        : r.cpr;
      if (cpr) lines.push(`CPR: ${cpr}`);
    }
    if (r.meas_notes) lines.push(r.meas_notes);
    return lines.join("\n");
  }

  // When a patient is started from Patients or approved from Intake, prefill here
  useEffect(() => {
    if (prefillPatient) {
      setReport(r => ({
        ...defaultReport(),
        patient_name:     prefillPatient.patient_name || "",
        patient_id:       prefillPatient.patient_id || "",
        dob:              prefillPatient.dob || "",
        age:              prefillPatient.age || "",
        gender:           prefillPatient.gender || "",
        phone:            prefillPatient.phone || "",
        medical_aid:      prefillPatient.medical_aid || "",
        referring_doctor: prefillPatient.referring_doctor || "",
        exam_date:        new Date().toISOString().slice(0,10),
        status:           "Draft",
      }));
      setPatientSearch(prefillPatient.patient_name || "");
      setTab("new");
      setStatus({
        type: "success",
        msg: `▶ Scan started for ${prefillPatient.patient_name}. Fill in findings now or save as Draft and return later. Use "AI Extract" after pasting a scan image.`
      });
      if (onPrefillUsed) onPrefillUsed();
    }
  }, [prefillPatient]);

  useEffect(() => {
    if (tab === "cases") loadCases();
    if (tab === "new") loadPatients();
  }, [tab]);

  async function loadCases() {
    setLoadingCases(true);
    try {
      const rows = await sbFetch("reports?select=*&order=created_at.desc&limit=100", {}, supabaseKey);
      setCases(rows);
    } catch(e) { setStatus({type:"error", msg: e.message}); }
    finally { setLoadingCases(false); }
  }

  async function loadPatients() {
    try {
      const rows = await sbFetch("patients?select=id,full_name,dob,phone,email,medical_aid&order=full_name&limit=300", {}, supabaseKey);
      setPatients(rows);
    } catch(e) {}
  }

  function selectPatient(p) {
    setReport(r => ({...r,
      patient_name: p.full_name || "",
      dob: p.dob || "",
      phone: p.phone || "",
      email: p.email || "",
      medical_aid: p.medical_aid || "",
    }));
    setPatientSearch(p.full_name || "");
    setShowPatientDrop(false);
  }

  const [pastedImages, setPastedImages] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef(null);
  const pasteZoneRef = useRef(null);
  const [doctors, setDoctors] = useState([]);
  const [showDoctorMgr, setShowDoctorMgr] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: "", phone: "", email: "" });
  const [editingDoctor, setEditingDoctor] = useState(null); // { original, name, phone, email }
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => { loadDoctors(); }, []);

  async function loadDoctors() {
    try {
      const rows = await sbFetch("doctors?select=*&order=name", {}, supabaseKey);
      if (rows.length > 0) setDoctors(rows);
      else setDoctors(DEFAULT_DOCTORS.map(name => ({ name, phone: "", email: "" })));
    } catch(e) {
      setDoctors(DEFAULT_DOCTORS.map(name => ({ name, phone: "", email: "" })));
    }
  }

  async function addDoctor() {
    const name = newDoc.name.trim();
    if (!name) return;
    if (doctors.find(d => d.name === name)) { setNewDoc({ name: "", phone: "", email: "" }); return; }
    const docObj = { name, phone: newDoc.phone.trim(), email: newDoc.email.trim() };
    try {
      await sbFetch("doctors", { method: "POST", body: JSON.stringify(docObj) }, supabaseKey);
    } catch(e) {}
    setDoctors(prev => [...prev, docObj].sort((a,b) => a.name.localeCompare(b.name)));
    setNewDoc({ name: "", phone: "", email: "" });
  }

  async function removeDoctor(name) {
    try {
      await sbFetch(`doctors?name=eq.${encodeURIComponent(name)}`, { method: "DELETE" }, supabaseKey);
    } catch(e) {}
    setDoctors(prev => prev.filter(d => d.name !== name));
    if (report.referring_doctor === name) setReport(r => ({...r, referring_doctor: ""}));
  }

  async function saveEditDoctor() {
    if (!editingDoctor || !editingDoctor.name.trim()) return;
    const updated = { name: editingDoctor.name.trim(), phone: editingDoctor.phone.trim(), email: editingDoctor.email.trim() };
    try {
      // Delete old, insert new (Supabase REST doesn't support upsert by name easily)
      await sbFetch(`doctors?name=eq.${encodeURIComponent(editingDoctor.original)}`, { method: "DELETE" }, supabaseKey);
      await sbFetch("doctors", { method: "POST", body: JSON.stringify(updated) }, supabaseKey);
    } catch(e) {}
    setDoctors(prev => prev.map(d => (d.name === editingDoctor.original ? updated : d)).sort((a,b) => a.name.localeCompare(b.name)));
    if (report.referring_doctor === editingDoctor.original) setReport(r => ({...r, referring_doctor: updated.name}));
    setEditingDoctor(null);
  }

  // Get full doctor object for the currently selected referring doctor
  function selectedDoctor() {
    return doctors.find(d => d.name === report.referring_doctor) || null;
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = () => {
          setPastedImages(prev => [...prev, { id: Date.now()+Math.random(), dataUrl: reader.result }]);
        };
        reader.readAsDataURL(blob);
        e.preventDefault();
      }
    }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPastedImages(prev => [...prev, { id: Date.now()+Math.random(), dataUrl: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeImage(id) {
    setPastedImages(prev => prev.filter(img => img.id !== id));
  }

  async function aiExtractFromImages() {
    if (pastedImages.length === 0) { setStatus({type:"error", msg:"Paste or upload an ultrasound screenshot first"}); return; }
    setExtracting(true); setStatus(null);
    try {
      const content = [
        { type: "text", text:
          "Extract patient/case details and all ultrasound/fetal/biometry measurements visible in the attached ultrasound screenshot(s). " +
          "Extract EDD/EDC/due date and EFW/Hadlock estimated fetal weight whenever visible. " +
          "Return STRICT JSON only with keys: patient_name, patient_id, age, gender, dob, phone, referring_doctor, study_title, measurements_text. " +
          "measurements_text must be clean separate lines, one measurement per line, e.g.:\\n" +
          "BPD: 43.96 mm\\nHC: 164.71 mm\\nAC: 138.78 mm\\nFL: 28.95 mm\\nFHR: 162 bpm\\nGS: 19.16 mm\\nEFW: 618 g\\nEDD: 13-06-2026\\n" +
          "Do not invent values. If a field is not visible, leave it blank. Return ONLY the JSON object, no markdown, no explanation."
        }
      ];
      pastedImages.slice(-4).forEach(img => {
        const base64 = img.dataUrl.split(",")[1];
        const mediaType = img.dataUrl.match(/data:(image\/\w+);/)?.[1] || "image/png";
        content.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } });
      });

      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 1000,
          messages: [{ role: "user", content }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      let text = data.content?.[0]?.text || "{}";
      text = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);

      setReport(r => ({
        ...r,
        patient_name: parsed.patient_name || r.patient_name,
        patient_id: parsed.patient_id || r.patient_id,
        age: parsed.age || r.age,
        gender: parsed.gender || r.gender,
        dob: parsed.dob || r.dob,
        phone: parsed.phone || r.phone,
        referring_doctor: parsed.referring_doctor || r.referring_doctor,
        study_title: parsed.study_title || r.study_title,
        measurements: parsed.measurements_text ? (r.measurements ? r.measurements + "\n" + parsed.measurements_text : parsed.measurements_text) : r.measurements,
      }));
      setStatus({type:"success", msg:"Patient info and measurements extracted ✓"});
    } catch(e) {
      setStatus({type:"error", msg:"Extraction failed: " + e.message});
    } finally { setExtracting(false); }
  }

  function downloadPDF() {
    // Open report in new window with auto-print to PDF
    const html = buildReportHtml().replace(
      '</style>',
      `@media print { body { margin: 0; } }
       </style>
       <script>window.onload = function() { window.print(); }<\/script>`
    );
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function downloadWord() {
    // Build a simple RTF-based Word document (no external library needed)
    const name = report.patient_name || "Patient";
    const safe = (s) => (s||"").replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #10233f; margin: 2cm; }
  h1 { color: #062D5C; font-size: 18pt; border-bottom: 2pt solid #0b73b7; padding-bottom: 6pt; }
  h2 { color: #075f96; font-size: 12pt; border-bottom: 1pt solid #d6e4ef; margin-top: 14pt; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
  td, th { border: 1pt solid #d6e4ef; padding: 5pt 8pt; font-size: 10pt; }
  th { background: #e8f4fd; color: #075f96; font-weight: bold; }
  .section { border: 1pt solid #d6e4ef; padding: 10pt; margin-bottom: 10pt; }
  .footer { border-top: 2pt solid #0b73b7; margin-top: 20pt; padding-top: 8pt; font-size: 9pt; color: #31495f; }
  img.sig { height: 40pt; }
</style></head>
<body>
<h1>HENDORS DIAGNOSTICS</h1>
<p style="color:#526575;font-size:9pt;text-transform:uppercase">${safe(report.scan_type)} Report &nbsp;|&nbsp; Date: ${safe(report.exam_date)} &nbsp;|&nbsp; Practice No: 039004 0590266</p>

<table>
  <tr><th colspan="2">Patient</th><th colspan="2">Examination</th><th colspan="2">Clinician</th></tr>
  <tr>
    <td><b>Name</b></td><td>${safe(report.patient_name)}</td>
    <td><b>Date</b></td><td>${safe(report.exam_date)}</td>
    <td><b>Referred by</b></td><td>${safe(report.referring_doctor)||"—"}</td>
  </tr>
  <tr>
    <td><b>File No</b></td><td>${safe(report.patient_id)||"—"}</td>
    <td><b>Type</b></td><td>${safe(report.scan_type)}</td>
    <td><b>Performed by</b></td><td>${safe(report.performed_by)}</td>
  </tr>
  <tr>
    <td><b>DOB</b></td><td>${safe(report.dob)||"—"}</td>
    <td><b>Study</b></td><td>${safe(report.study_title)||safe(report.scan_type)}</td>
    <td><b>Medical Aid</b></td><td>${safe(report.medical_aid)||"Cash"}</td>
  </tr>
  <tr>
    <td><b>Age/Sex</b></td><td>${safe(report.age)||"—"} / ${safe(report.gender)||"—"}</td>
    <td></td><td></td><td></td><td></td>
  </tr>
</table>

${report.measurements ? `<h2>Measurements</h2><div class="section"><pre style="font-family:Arial;font-size:10pt;margin:0">${safe(report.measurements)}</pre></div>` : ""}
${report.findings ? `<h2>Findings</h2><div class="section">${safe(report.findings).replace(/\n/g,'<br>')}</div>` : ""}
${report.comment ? `<h2>Comment</h2><div class="section">${safe(report.comment).replace(/\n/g,'<br>')}</div>` : ""}
${report.impression ? `<h2>Impression</h2><div class="section">${safe(report.impression).replace(/\n/g,'<br>')}</div>` : ""}

<div class="footer">
  <table style="border:none"><tr>
    <td style="border:none;width:50%">
      <img class="sig" src="${SIGNATURE_DATA_URL}" alt="Signature"/><br>
      <b>Hendor Wynne</b><br>
      Medical Sonographer<br>
      HPCSA Reg: 0092673
    </td>
    <td style="border:none;width:50%;text-align:right">
      <b>Hendors Diagnostics</b><br>
      Practice No: 039004 0590266<br>
      George / Beaufort West<br>
      072 763 6282
    </td>
  </tr></table>
</div>
</body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g,'_')}_Report_${report.exam_date||'draft'}.doc`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function sendWA(target) {
    const name = report.patient_name || "Patient";
    const study = report.study_title || report.scan_type || "";
    const date = report.exam_date || "";
    const doctor = report.referring_doctor || "Doctor";
    const doc = selectedDoctor();
    let phone = "";
    let msg = "";
    if (target === "patient") {
      phone = (report.phone || "").replace(/\D/g,"").replace(/^0/,"27");
      if (!phone) { alert("No patient phone number saved on this report."); return; }
      msg = encodeURIComponent(
        `Hendors Diagnostics\n\nDear ${name},\n\nYour ultrasound report is ready.\nStudy: ${study}\nDate: ${date}\n\nPlease contact us to collect your report or arrange delivery.\n\nHendors Diagnostics\n📞 072 763 6282\n✉️ reception.hendors@gmail.com`
      );
    } else {
      // Use stored doctor WhatsApp/phone number
      const docPhone = (doc?.phone || doc?.whatsapp || "").replace(/\D/g,"").replace(/^0/,"27");
      phone = docPhone;
      if (!phone) {
        // No number saved — open WhatsApp without a number (user can paste)
        alert(`No phone number saved for ${doctor}.\n\nAdd their number in Manage Doctors (⚙️) first.\n\nOpening WhatsApp — you can manually paste the number.`);
      }
      msg = encodeURIComponent(
        `Hendors Diagnostics\n\nDear ${doctor},\n\nReport completed for your patient: ${name}\nStudy: ${study}\nDate: ${date}\n\nPlease contact us if you require a copy.\n\nHendor Wynne\nMedical Sonographer\n📞 072 763 6282`
      );
    }
    const url = phone
      ? `https://wa.me/${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
  }

  function sendEmail(target) {
    const name = report.patient_name || "Patient";
    const study = report.study_title || report.scan_type || "";
    const date = report.exam_date || "";
    const doctor = report.referring_doctor || "Doctor";
    const doc = selectedDoctor();
    let to = "";
    let subject = "";
    let body = "";
    if (target === "patient") {
      to = report.email || "";
      subject = encodeURIComponent(`Hendors Diagnostics — Ultrasound Report for ${name}`);
      body = encodeURIComponent(
        `Dear ${name},\n\nYour ultrasound report is ready.\nStudy: ${study}\nDate: ${date}\n\nPlease contact us to collect your report or arrange delivery.\n\nHendors Diagnostics\nTel: 072 763 6282\nEmail: reception.hendors@gmail.com`
      );
    } else {
      // Use stored doctor email
      to = doc?.email || "";
      if (!to) {
        alert(`No email address saved for ${doctor}.\n\nAdd their email in Manage Doctors (⚙️) first.`);
        return;
      }
      subject = encodeURIComponent(`Report: ${name} — ${study}`);
      body = encodeURIComponent(
        `Dear ${doctor},\n\nReport completed for your patient:\n\nPatient: ${name}\nStudy: ${study}\nDate: ${date}\n\nKind regards,\nHendor Wynne\nMedical Sonographer\nHendors Diagnostics\nTel: 072 763 6282`
      );
    }
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  async function deleteReport() {
    if (!report.id) return;
    if (!window.confirm(`Delete report for ${report.patient_name}? This cannot be undone.`)) return;
    try {
      await sbFetch(`reports?id=eq.${report.id}`, { method: "DELETE" }, supabaseKey);
      setReport(defaultReport());
      setPatientSearch("");
      setStatus({ type: "success", msg: "Report deleted." });
      loadCases();
    } catch(e) {
      setStatus({ type: "error", msg: "Delete failed: " + e.message });
    }
  }

  async function generateReport() {
    if (!report.patient_name) { setStatus({type:"error", msg:"Enter patient name first"}); return; }
    setGenerating(true); setStatus(null);
    try {
      const isOB = ["OBSTETRIC","OB Normal","OB Detail Anomaly Scan","Detail Anomaly Scan"].includes(report.scan_type);
      const prompt = `You are writing a professional medical ultrasound report for Hendors Diagnostics.

Patient: ${report.patient_name}
Age/Sex: ${report.age || "unknown"} / ${report.gender || "unknown"}
Scan type: ${report.scan_type}
Study: ${report.study_title || report.scan_type}
Referring doctor: ${report.referring_doctor || "not specified"}
Date: ${report.exam_date}

Measurements / Findings provided:
${report.measurements || "Not provided"}

${report.transcript ? `Dictated notes from sonographer:\n${report.transcript}` : ""}

${report.findings ? `Additional findings: ${report.findings}` : ""}

Write a professional ${isOB ? "obstetric " : ""}ultrasound report in Hendors Diagnostics HD style.
Structure: 
1. FINDINGS (flowing narrative, 3-5 sentences)
2. COMMENT (1-2 sentences)  
3. IMPRESSION (bullet points, 2-4 items)

Keep it clinical, professional and concise. Do NOT include patient header info or signature — just the 3 sections above with clear headings.`;

      const text = await aiGenerate(prompt);
      // Parse sections
      const findingsMatch = text.match(/FINDINGS[:\s]*([\s\S]*?)(?=COMMENT|$)/i);
      const commentMatch = text.match(/COMMENT[:\s]*([\s\S]*?)(?=IMPRESSION|$)/i);
      const impressionMatch = text.match(/IMPRESSION[:\s]*([\s\S]*?)$/i);
      setReport(r => ({...r,
        findings: findingsMatch?.[1]?.trim() || text,
        comment: commentMatch?.[1]?.trim() || "",
        impression: impressionMatch?.[1]?.trim() || "",
      }));
      setStatus({type:"success", msg:"Report generated — review and save."});
    } catch(e) {
      setStatus({type:"error", msg:"AI generation failed: " + e.message});
    } finally { setGenerating(false); }
  }

  async function saveReport() {
    if (!report.patient_name) { setStatus({type:"error", msg:"Patient name required"}); return; }
    setSaving(true); setStatus(null);
    try {
      // Convert DOB from DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD for Supabase
      function toISODate(d) {
        if (!d) return null;
        // Already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
        // DD-MM-YYYY or DD/MM/YYYY
        const m = d.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
        if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
        return null;
      }
      const row = {
        patient_name: report.patient_name,
        file_no: report.patient_id,
        dob: toISODate(report.dob),
        age: report.age,
        gender: report.gender,
        phone: report.phone,
        email: report.email,
        medical_aid: report.medical_aid,
        report_date: report.exam_date,
        scan_type: report.scan_type,
        study_type: report.study_title || report.scan_type,
        referring_doctor: report.referring_doctor,
        performed_by: report.performed_by,
        measurements: report.measurements,
        findings: report.findings,
        comment: report.comment,
        impression: report.impression,
        transcript: report.transcript,
        status: report.status,
        created_at: new Date().toISOString(),
      };
      const saved = await sbFetch("reports", { method:"POST", body: JSON.stringify(row) }, supabaseKey);
      if (saved && saved[0]) setReport(r => ({...r, id: saved[0].id}));
      setStatus({type:"success", msg:"Report saved to cloud ✓"});
    } catch(e) {
      setStatus({type:"error", msg:"Save failed: " + e.message});
    } finally { setSaving(false); }
  }

  function buildOBChartHtml(measurementsText) {
    if (!measurementsText) return "";
    const get = (key) => {
      const m = measurementsText.match(new RegExp(key + '[^\\d]*(\\d+\\.?\\d*)', 'i'));
      return m ? parseFloat(m[1]) : null;
    };
    const bpd = get('BPD'), hc = get('HC'), ac = get('AC'), fl = get('FL');
    const efw = get('EFW'), umbRI = get('Umb RI') || get('RI'), umbPI = get('UA PI') || get('Umb PI') || get('PI');
    const mcaPI = get('MCA PI'); const cpr = get('CPR');
    if (!bpd && !hc && !ac && !fl) return "";

    // GA estimate from BPD (Hadlock)
    const gaFromBPD = bpd ? bpd * 0.2977 + 4.0 : null;
    const gaFromHC  = hc  ? hc  * 0.0871 + 4.0 : null;
    const gaFromAC  = ac  ? ac  * 0.0905 + 2.0 : null;
    const gaFromFL  = fl  ? fl  * 0.4722 + 6.0 : null;
    const gas = [gaFromBPD,gaFromHC,gaFromAC,gaFromFL].filter(Boolean);
    const ga = gas.length ? gas.reduce((a,b)=>a+b,0)/gas.length : null;

    // Centile reference data (from desktop obs_graphs.py)
    const CHARTS = {
      BPD:    { title:'BPD', unit:'mm', ymin:15, ymax:105, weeks:[14,18,22,26,30,34,38,40], p50:[[14,27],[18,42],[22,55],[26,68],[30,78],[34,86],[38,94],[40,97]], spread:5, val:bpd, ga:ga },
      HC:     { title:'HC',  unit:'mm', ymin:80, ymax:360, weeks:[14,18,22,26,30,34,38,40], p50:[[14,100],[18,150],[22,200],[26,240],[30,280],[34,310],[38,335],[40,345]], spread:18, val:hc, ga:ga },
      AC:     { title:'AC',  unit:'mm', ymin:70, ymax:380, weeks:[14,18,22,26,30,34,38,40], p50:[[14,85],[18,130],[22,180],[26,225],[30,270],[34,310],[38,345],[40,360]], spread:22, val:ac, ga:ga },
      FL:     { title:'FL',  unit:'mm', ymin:5,  ymax:85,  weeks:[14,18,22,26,30,34,38,40], p50:[[14,15],[18,28],[22,39],[26,49],[30,59],[34,67],[38,75],[40,78]], spread:4, val:fl, ga:ga },
      EFW:    { title:'Estimated Fetal Weight (EFW)', unit:'g', ymin:100, ymax:4500, weeks:[18,22,26,30,34,38,40], p50:[[18,230],[22,500],[26,900],[30,1500],[34,2300],[38,3200],[40,3600]], spread:350, val:efw, ga:ga },
      UmbRI:  { title:'Umbilical Artery RI', unit:'', ymin:0.35, ymax:1.0, weeks:[18,22,26,30,34,38,40], p50:[[18,0.78],[22,0.72],[26,0.66],[30,0.61],[34,0.57],[38,0.53],[40,0.51]], spread:0.08, val:umbRI, ga:ga },
      UmbPI:  { title:'Umbilical Artery PI', unit:'', ymin:0.4, ymax:2.0, weeks:[18,22,26,30,34,38,40], p50:[[18,1.5],[22,1.3],[26,1.1],[30,0.95],[34,0.85],[38,0.75],[40,0.70]], spread:0.25, val:umbPI, ga:ga },
      MCAPI:  { title:'MCA PI', unit:'', ymin:0.8, ymax:2.8, weeks:[18,22,26,30,34,38,40], p50:[[18,1.8],[22,1.9],[26,1.95],[30,1.85],[34,1.65],[38,1.45],[40,1.35]], spread:0.35, val:mcaPI, ga:ga },
      CPR:    { title:'Cerebroplacental Ratio (CPR)', unit:'', ymin:0.5, ymax:3.0, weeks:[18,22,26,30,34,38,40], p50:[[18,1.8],[22,1.9],[26,1.95],[30,1.9],[34,1.7],[38,1.5],[40,1.4]], spread:0.4, val:cpr, ga:ga },
    };

    function interp(pts, x) {
      const sorted = [...pts].sort((a,b)=>a[0]-b[0]);
      if (x <= sorted[0][0]) return sorted[0][1];
      if (x >= sorted[sorted.length-1][0]) return sorted[sorted.length-1][1];
      for (let i=0; i<sorted.length-1; i++) {
        const [x0,y0]=sorted[i], [x1,y1]=sorted[i+1];
        if (x0<=x && x<=x1) return y0 + (y1-y0)*(x-x0)/(x1-x0);
      }
      return sorted[sorted.length-1][1];
    }

    function makeChart(key) {
      const s = CHARTS[key];
      if (!s.val) return '';
      const W=260, H=160, PL=8, PR=30, PT=22, PB=28;
      const pw=W-PL-PR, ph=H-PT-PB;
      const minW=s.weeks[0], maxW=s.weeks[s.weeks.length-1];
      const xm=(g)=>PL+pw*(g-minW)/(maxW-minW);
      const ym=(v)=>PT+ph*(1-(v-s.ymin)/(s.ymax-s.ymin));

      // Build smooth curve points for p10/p50/p90
      const steps=40;
      function curve(offset) {
        return Array.from({length:steps+1},(_,i)=>{
          const g=minW+(maxW-minW)*i/steps;
          const v=Math.max(s.ymin,Math.min(s.ymax,interp(s.p50,g)+offset));
          return `${xm(g).toFixed(1)},${ym(v).toFixed(1)}`;
        }).join(' ');
      }

      const gax = s.ga ? xm(s.ga) : null;
      const gay = s.val ? ym(Math.max(s.ymin,Math.min(s.ymax,s.val))) : null;
      const gaLabel = s.ga ? `Patient: ${s.val} ${s.unit} at ${s.ga.toFixed(1)}w` : '';

      // Grid lines
      const gridLines = s.weeks.map(w=>`
        <line x1="${xm(w).toFixed(1)}" y1="${PT}" x2="${xm(w).toFixed(1)}" y2="${PT+ph}" stroke="#edf2f7" stroke-width="0.6"/>
        <text x="${xm(w).toFixed(1)}" y="${PT+ph+10}" text-anchor="middle" font-size="7" fill="#566575">${w}</text>
      `).join('');
      const hGridLines = [0.25,0.5,0.75].map(f=>`
        <line x1="${PL}" y1="${(PT+ph*f).toFixed(1)}" x2="${PL+pw}" y2="${(PT+ph*f).toFixed(1)}" stroke="#edf2f7" stroke-width="0.6"/>
      `).join('');

      // Centile labels
      const labelX = PL+pw+3;
      const p90y = ym(interp(s.p50,maxW)+s.spread*1.28);
      const p50y = ym(interp(s.p50,maxW));
      const p10y = ym(interp(s.p50,maxW)-s.spread*1.28);

      return `
        <div style="border:1px solid #d6e4ef;border-radius:8px;padding:8px;background:#fff;display:inline-block;width:260px;vertical-align:top;margin:4px">
          <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
            <text x="4" y="14" font-size="9" font-weight="bold" fill="#071a3d">${s.title}</text>
            <rect x="${PL}" y="${PT}" width="${pw}" height="${ph}" fill="white" stroke="#d8e3ef" stroke-width="0.8"/>
            ${gridLines}${hGridLines}
            <polyline points="${curve(s.spread*1.28)}" fill="none" stroke="#f87171" stroke-width="1.2" stroke-dasharray="3,2"/>
            <polyline points="${curve(0)}" fill="none" stroke="#3b82f6" stroke-width="1.6"/>
            <polyline points="${curve(-s.spread*1.28)}" fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="3,2"/>
            <text x="${labelX}" y="${p90y.toFixed(0)}" font-size="6" fill="#f87171">90th</text>
            <text x="${labelX}" y="${p50y.toFixed(0)}" font-size="6" fill="#3b82f6">50th</text>
            <text x="${labelX}" y="${p10y.toFixed(0)}" font-size="6" fill="#f59e0b">10th</text>
            ${gax !== null && gay !== null ? `<circle cx="${gax.toFixed(1)}" cy="${gay.toFixed(1)}" r="4" fill="#111" stroke="white" stroke-width="1"/>` : ''}
            <text x="${PL+pw/2}" y="${H-4}" text-anchor="middle" font-size="7" fill="#566575">Gestational age (weeks)</text>
            <text x="4" y="${H-4}" font-size="7" fill="#344054">${gaLabel}</text>
          </svg>
        </div>`;
    }

    const charts = ['BPD','HC','AC','FL','EFW','UmbPI','UmbRI','MCAPI','CPR'].map(makeChart).filter(Boolean).join('');
    if (!charts) return '';

    return `<div class="section" style="page-break-inside:avoid">
      <h2>OBS Growth + Doppler Charts</h2>
      <p style="font-size:9px;color:#526575;margin-bottom:10px">Guide chart with gestational-week axis. Formal validated centile dataset integration planned in next phase.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${charts}</div>
    </div>`;
  }

  function buildReportHtml() {
    const isOB = ["OBSTETRIC","OB Normal","OB Detail Anomaly Scan","Detail Anomaly Scan"].includes(report.scan_type);
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page{size:A4;margin:15mm}
  body{font-family:Arial,sans-serif;color:#10233f;font-size:11px;margin:0;background:#fff}
  .header{border-bottom:3px solid #0b73b7;padding-bottom:10px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}
  .logo-img{height:48px;object-fit:contain}
  .sub{color:#526575;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}
  .card{border:1px solid #d6e4ef;border-radius:8px;padding:10px}
  .card h2{margin:0 0 6px;color:#075f96;font-size:11px;text-transform:uppercase}
  .row{font-size:11px;margin:3px 0}
  .label{color:#075f96;font-weight:bold;display:inline-block;min-width:80px}
  .section{border:1px solid #d6e4ef;border-radius:8px;padding:12px;margin-bottom:10px}
  .section h2{margin:0 0 8px;color:#075f96;font-size:12px;text-transform:uppercase;border-bottom:1px solid #e8f0f8;padding-bottom:4px}
  .section p{margin:4px 0;line-height:1.6;white-space:pre-wrap}
  .footer{display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #0b73b7;padding-top:10px;font-size:10px;color:#31495f;margin-top:16px}
  .sig-img{height:46px;object-fit:contain;display:block;margin-bottom:2px}
</style></head><body>
<div class="header">
  <div><img class="logo-img" src="${LOGO_DATA_URL}" alt="Hendors Diagnostics"/><div class="sub">${isOB ? "Obstetric Ultrasound Report" : "Medical Ultrasound Report"}</div></div>
  <div style="text-align:right;font-size:10px;color:#526575">Date: ${report.exam_date}<br>Practice No: 039004 0590266</div>
</div>
<div class="grid">
  <div class="card"><h2>Patient</h2>
    <div class="row"><span class="label">Name:</span>${report.patient_name||"—"}</div>
    <div class="row"><span class="label">ID/File:</span>${report.patient_id || "—"}</div>
    <div class="row"><span class="label">DOB:</span>${report.dob || "—"}</div>
    <div class="row"><span class="label">Age/Sex:</span>${report.age || "—"} / ${report.gender || "—"}</div>
  </div>
  <div class="card"><h2>Examination</h2>
    <div class="row"><span class="label">Date:</span>${report.exam_date}</div>
    <div class="row"><span class="label">Type:</span>${report.scan_type}</div>
    <div class="row"><span class="label">Study:</span>${report.study_title || report.scan_type}</div>
  </div>
  <div class="card"><h2>Clinician</h2>
    <div class="row"><span class="label">Referred by:</span>${report.referring_doctor || "—"}</div>
    <div class="row"><span class="label">Performed:</span>${report.performed_by}</div>
    <div class="row"><span class="label">Medical aid:</span>${report.medical_aid || "Cash"}</div>
  </div>
</div>
${report.measurements ? `<div class="section"><h2>Measurements</h2><p>${report.measurements}</p></div>` : ""}
${report.findings ? `<div class="section"><h2>Findings</h2><p>${report.findings}</p></div>` : ""}
${report.comment ? `<div class="section"><h2>Comment</h2><p>${report.comment}</p></div>` : ""}
${report.impression ? `<div class="section"><h2>Impression</h2><p>${report.impression}</p></div>` : ""}
${isOB ? buildOBChartHtml(report.measurements) : ""}
<div class="footer">
  <div><img class="sig-img" src="${SIGNATURE_DATA_URL}" alt="Signature"/><strong>Hendor Wynne</strong><br>Medical Sonographer<br>HPCSA Reg: 0092673</div>
  <div style="text-align:right"><strong>Hendors Diagnostics</strong><br>Practice No: 039004 0590266<br>George / Beaufort West<br>072 763 6282</div>
</div>
</body></html>`;
  }

  function printReport() {
    const html = buildReportHtml();
    const w = window.open("","_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  function whatsappReport(r) {
    const msg = encodeURIComponent(`Hendors Diagnostics\n\nDear ${r.patient_name},\n\nYour ultrasound report is ready.\nStudy: ${r.study_type||r.scan_type||""}\nDate: ${r.report_date||""}\n\nPlease contact us to collect your report.\n\nHendors Diagnostics\n072 763 6282`);
    window.open(`https://wa.me/27${(r.phone||"").replace(/^0/,"")}?text=${msg}`,"_blank");
  }

  const filteredPatients = patients.filter(p => p.full_name?.toLowerCase().includes(patientSearch.toLowerCase())).slice(0,8);

  return (
    <div className="studio-wrap">
      <div className="studio-tabs">
        <button className={`stab ${tab==="new"?"active":""}`} onClick={()=>setTab("new")}>✏️ New Report</button>
        <button className={`stab ${tab==="cases"?"active":""}`} onClick={()=>setTab("cases")}>📋 Saved Reports</button>
      </div>

      {tab==="new" && (
        <div className="studio-layout">
          {/* Left: Patient + Exam */}
          <div className="studio-left">
            <div className="s-section">
              <h3 className="s-title">Patient</h3>
              <div className="s-field" style={{position:"relative"}}>
                <label>Search patient</label>
                <input value={patientSearch}
                  onChange={e=>{setPatientSearch(e.target.value);setShowPatientDrop(true)}}
                  onFocus={()=>setShowPatientDrop(true)}
                  placeholder="Type patient name…"/>
                {showPatientDrop && patientSearch && filteredPatients.length>0 && (
                  <div className="patient-drop">
                    {filteredPatients.map(p=>(
                      <div key={p.id} className="patient-opt" onClick={()=>selectPatient(p)}>
                        <strong>{p.full_name}</strong>
                        <span>{p.dob||""} {p.medical_aid||""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="s-row2">
                <div className="s-field"><label>Full Name *</label><input value={report.patient_name} onChange={e=>setReport(r=>({...r,patient_name:e.target.value}))}/></div>
                <div className="s-field"><label>ID / File No</label><input value={report.patient_id} onChange={e=>setReport(r=>({...r,patient_id:e.target.value}))}/></div>
              </div>
              <div className="s-row3">
                <div className="s-field"><label>DOB</label><input type="date" value={report.dob} onChange={e=>setReport(r=>({...r,dob:e.target.value}))}/></div>
                <div className="s-field"><label>Age</label><input value={report.age} onChange={e=>setReport(r=>({...r,age:e.target.value}))} placeholder="e.g. 28"/></div>
                <div className="s-field"><label>Sex</label>
                  <select value={report.gender} onChange={e=>setReport(r=>({...r,gender:e.target.value}))}>
                    <option value="">—</option><option>Female</option><option>Male</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="s-row2">
                <div className="s-field"><label>Phone</label><input value={report.phone} onChange={e=>setReport(r=>({...r,phone:e.target.value}))}/></div>
                <div className="s-field"><label>Medical Aid</label><input value={report.medical_aid} onChange={e=>setReport(r=>({...r,medical_aid:e.target.value}))}/></div>
              </div>
            </div>

            <div className="s-section">
              <h3 className="s-title">Examination</h3>
              <div className="s-row2">
                <div className="s-field"><label>Exam Date</label><input type="date" value={report.exam_date} onChange={e=>setReport(r=>({...r,exam_date:e.target.value}))}/></div>
                <div className="s-field"><label>Scan Type</label>
                  <select value={report.scan_type} onChange={e=>setReport(r=>({...r,scan_type:e.target.value}))}>
                    {SCAN_TYPES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="s-field"><label>Study Title</label><input value={report.study_title} onChange={e=>setReport(r=>({...r,study_title:e.target.value}))} placeholder="e.g. 20-week morphology scan"/></div>
              <div className="s-row2">
                <div className="s-field"><label>Referring Doctor</label>
                  <div className="doc-select-row">
                    <select value={report.referring_doctor} onChange={e=>setReport(r=>({...r,referring_doctor:e.target.value}))}>
                      <option value="">Select…</option>
                      {doctors.map(d=><option key={d.name || d}>{d.name || d}</option>)}
                    </select>
                    <button type="button" className="doc-manage-btn" onClick={()=>setShowDoctorMgr(true)} title="Manage doctors">⚙️</button>
                  </div>
                </div>
                <div className="s-field"><label>Performed By</label><input value={report.performed_by} onChange={e=>setReport(r=>({...r,performed_by:e.target.value}))}/></div>
              </div>
            </div>

            <div className="s-section" onPaste={handlePaste} tabIndex={0} ref={pasteZoneRef}>
              <div className="s-title-row">
                <h3 className="s-title">Ultrasound Images</h3>
                <button className="gen-btn" onClick={aiExtractFromImages} disabled={extracting || pastedImages.length===0}>
                  {extracting ? "⏳ Extracting…" : "🤖 AI Extract Patient + Measurements"}
                </button>
              </div>
              <div className="paste-zone" onClick={()=>fileInputRef.current?.click()}>
                <p>📋 Click here then <strong>Ctrl+V</strong> to paste a snip, or click to upload an image</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFileSelect}/>
              </div>
              {pastedImages.length>0 && (
                <div className="img-thumbs">
                  {pastedImages.map(img=>(
                    <div key={img.id} className="img-thumb">
                      <img src={img.dataUrl} alt="snip"/>
                      <button className="img-remove" onClick={()=>removeImage(img.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="s-section">
              <h3 className="s-title">Measurements — Biometry</h3>
              <div className="s-row3">
                <div className="s-field"><label>BPD (mm)</label><input placeholder="e.g. 72" value={(report.bpd||"")} onChange={e=>setReport(r=>({...r,bpd:e.target.value,measurements:buildMeasText({...r,bpd:e.target.value})}))} /></div>
                <div className="s-field"><label>HC (mm)</label><input placeholder="e.g. 265" value={(report.hc||"")} onChange={e=>setReport(r=>({...r,hc:e.target.value,measurements:buildMeasText({...r,hc:e.target.value})}))} /></div>
                <div className="s-field"><label>AC (mm)</label><input placeholder="e.g. 230" value={(report.ac||"")} onChange={e=>setReport(r=>({...r,ac:e.target.value,measurements:buildMeasText({...r,ac:e.target.value})}))} /></div>
                <div className="s-field"><label>FL (mm)</label><input placeholder="e.g. 52" value={(report.fl||"")} onChange={e=>setReport(r=>({...r,fl:e.target.value,measurements:buildMeasText({...r,fl:e.target.value})}))} /></div>
                <div className="s-field"><label>EFW (g)</label><input placeholder="e.g. 1450" value={(report.efw||"")} onChange={e=>setReport(r=>({...r,efw:e.target.value,measurements:buildMeasText({...r,efw:e.target.value})}))} /></div>
                <div className="s-field"><label>FHR (bpm)</label><input placeholder="e.g. 148" value={(report.fhr||"")} onChange={e=>setReport(r=>({...r,fhr:e.target.value,measurements:buildMeasText({...r,fhr:e.target.value})}))} /></div>
                <div className="s-field"><label>AFI (cm)</label><input placeholder="e.g. 14" value={(report.afi||"")} onChange={e=>setReport(r=>({...r,afi:e.target.value,measurements:buildMeasText({...r,afi:e.target.value})}))} /></div>
                <div className="s-field"><label>Placenta</label><input placeholder="e.g. posterior, grade 1" value={(report.placenta||"")} onChange={e=>setReport(r=>({...r,placenta:e.target.value,measurements:buildMeasText({...r,placenta:e.target.value})}))} /></div>
              </div>

              <h3 className="s-title" style={{marginTop:12}}>Umbilical Artery Doppler</h3>
              <div className="s-row3">
                <div className="s-field"><label>UA PI</label><input placeholder="e.g. 0.95" value={(report.ua_pi||"")} onChange={e=>setReport(r=>({...r,ua_pi:e.target.value,measurements:buildMeasText({...r,ua_pi:e.target.value})}))} /></div>
                <div className="s-field"><label>UA RI</label><input placeholder="e.g. 0.62" value={(report.ua_ri||"")} onChange={e=>setReport(r=>({...r,ua_ri:e.target.value,measurements:buildMeasText({...r,ua_ri:e.target.value})}))} /></div>
                <div className="s-field"><label>UA S/D Ratio</label><input placeholder="e.g. 2.6" value={(report.ua_sd||"")} onChange={e=>setReport(r=>({...r,ua_sd:e.target.value,measurements:buildMeasText({...r,ua_sd:e.target.value})}))} /></div>
                <div className="s-field"><label>End Diastolic Flow</label>
                  <select value={(report.ua_edf||"")} onChange={e=>setReport(r=>({...r,ua_edf:e.target.value,measurements:buildMeasText({...r,ua_edf:e.target.value})}))}>
                    <option value="">— Select —</option>
                    <option>Present</option>
                    <option>Absent</option>
                    <option>Reversed</option>
                  </select>
                </div>
              </div>

              <h3 className="s-title" style={{marginTop:12}}>MCA Doppler</h3>
              <div className="s-row3">
                <div className="s-field"><label>MCA PI</label><input placeholder="e.g. 1.82" value={(report.mca_pi||"")} onChange={e=>setReport(r=>({...r,mca_pi:e.target.value,measurements:buildMeasText({...r,mca_pi:e.target.value})}))} /></div>
                <div className="s-field"><label>MCA RI</label><input placeholder="e.g. 0.79" value={(report.mca_ri||"")} onChange={e=>setReport(r=>({...r,mca_ri:e.target.value,measurements:buildMeasText({...r,mca_ri:e.target.value})}))} /></div>
                <div className="s-field"><label>MCA PSV (cm/s)</label><input placeholder="e.g. 45" value={(report.mca_psv||"")} onChange={e=>setReport(r=>({...r,mca_psv:e.target.value,measurements:buildMeasText({...r,mca_psv:e.target.value})}))} /></div>
                <div className="s-field"><label>CPR (UA PI / MCA PI)</label><input placeholder="Auto or manual" value={(report.ua_pi && report.mca_pi ? (parseFloat(report.mca_pi)/parseFloat(report.ua_pi)).toFixed(2) : report.cpr||"")} readOnly={!!(report.ua_pi && report.mca_pi)} onChange={e=>setReport(r=>({...r,cpr:e.target.value}))} style={{background: report.ua_pi && report.mca_pi ? "var(--color-background-secondary)" : undefined}} /></div>
              </div>

              <h3 className="s-title" style={{marginTop:12}}>Additional Notes</h3>
              <DictateTextarea rows={3} value={report.meas_notes||""} onChange={v=>setReport(r=>({...r,meas_notes:v,measurements:buildMeasText({...r,meas_notes:v})}))} placeholder="Any additional measurements or observations…"/>
            </div>
          </div>

          {/* Right: Transcript + Report body */}
          <div className="studio-right">
            <div className="s-section">
              <div className="s-title-row">
                <h3 className="s-title">Transcribe</h3>
                <button className="gen-btn ghost" onClick={()=>setReport(r=>({...r,transcript:""}))} disabled={!report.transcript}>
                  🗑️ Clear
                </button>
              </div>
              <DictateTextarea rows={6} value={report.transcript} onChange={v=>setReport(r=>({...r,transcript:v}))} placeholder="Dictate your raw notes here — separate from the final report. Use this as a scratchpad, then click 'Use Transcript' below to feed it into AI Generate Report."/>
              <p className="transcribe-hint">🎤 This stays separate from the final report. Dictate freely, then use it as input below.</p>
            </div>

            <div className="s-section">
              <div className="s-title-row">
                <h3 className="s-title">Report</h3>
                <button className="gen-btn" onClick={generateReport} disabled={generating}>
                  {generating ? "⏳ Generating…" : "🤖 AI Generate Report"}
                </button>
              </div>
              <div className="s-field"><label>Findings</label>
                <DictateTextarea rows={5} value={report.findings} onChange={v=>setReport(r=>({...r,findings:v}))} placeholder="Describe ultrasound findings…"/>
              </div>
              <div className="s-field"><label>Comment</label>
                <DictateTextarea rows={3} value={report.comment} onChange={v=>setReport(r=>({...r,comment:v}))} placeholder="Additional comments…"/>
              </div>
              <div className="s-field"><label>Impression</label>
                <DictateTextarea rows={4} value={report.impression} onChange={v=>setReport(r=>({...r,impression:v}))} placeholder={"• Normal fetal biometry for gestation\n• Adequate amniotic fluid\n• No structural anomalies identified"}/>
              </div>
            </div>

            {status && (
              <div className={`s-status ${status.type}`}>{status.type==="success"?"✅":"⚠️"} {status.msg}</div>
            )}

            <div className="s-actions">
              <div className="s-field s-inline">
                <label>Status</label>
                <select value={report.status} onChange={e=>setReport(r=>({...r,status:e.target.value}))}>
                  <option>Draft</option><option>Final</option><option>Sent</option>
                </select>
              </div>
              <button className="act-s save" onClick={saveReport} disabled={saving}>{saving?"Saving…":"💾 Save to Cloud"}</button>
              <button className="act-s preview" onClick={()=>setShowPdfPreview(true)}>👁️ Preview</button>
              <button className="act-s print" onClick={printReport}>🖨️ Print / PDF</button>
              <button className="act-s pdf-dl" onClick={downloadPDF}>📄 Download PDF</button>
              <button className="act-s word-dl" onClick={downloadWord}>📝 Download Word</button>
            </div>

            <div className="s-actions" style={{marginTop:"10px"}}>
              <button className="act-s wa-patient" onClick={()=>sendWA("patient")}>💬 WhatsApp Patient</button>
              <button className="act-s wa-doctor" onClick={()=>sendWA("doctor")}>💬 WhatsApp Doctor</button>
              <button className="act-s email-patient" onClick={()=>sendEmail("patient")}>✉️ Email Patient</button>
              <button className="act-s email-doctor" onClick={()=>sendEmail("doctor")}>✉️ Email Doctor</button>
              <button className="act-s new" onClick={()=>{setReport(defaultReport());setPatientSearch("");setStatus(null);}}>➕ New</button>
              {report.id && <button className="act-s del" onClick={deleteReport}>🗑️ Delete</button>}
            </div>
          </div>
        </div>
      )}

      {tab==="cases" && (
        <div className="page">
          <div className="page-header">
            <h2>Saved Reports</h2>
            <span className="badge">{cases.length} reports</span>
          </div>
          {loadingCases && <p className="loading">Loading…</p>}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Patient</th><th>Study</th><th>Doctor</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {cases.map(r=>(
                  <tr key={r.id}>
                    <td><strong>{r.patient_name}</strong></td>
                    <td>{r.study_type||r.scan_type||"—"}</td>
                    <td>{r.referring_doctor||"—"}</td>
                    <td>{r.report_date||r.created_at?.slice(0,10)||"—"}</td>
                    <td><span className={`status status-${(r.status||"draft").toLowerCase()}`}>{r.status||"Draft"}</span></td>
                    <td className="actions-cell">
                      <button className="act-btn" onClick={()=>{setReport({...defaultReport(),...r,exam_date:r.report_date||r.created_at?.slice(0,10)||""});setTab("new");setPatientSearch(r.patient_name||"");}} title="Edit">✏️</button>
                      <button className="act-btn" onClick={()=>whatsappReport(r)} title="WhatsApp">💬</button>
                    </td>
                  </tr>
                ))}
                {!loadingCases&&cases.length===0&&<tr><td colSpan={6} className="empty">No reports yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPdfPreview && (
        <div className="modal-overlay" onClick={()=>setShowPdfPreview(false)}>
          <div className="modal-box modal-preview" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Preview</h3>
              <div className="modal-header-actions">
                <button className="act-s print" onClick={printReport}>🖨️ Print / PDF</button>
                <button className="modal-close" onClick={()=>setShowPdfPreview(false)}>✕</button>
              </div>
            </div>
            <iframe
              title="Report Preview"
              className="preview-iframe"
              srcDoc={buildReportHtml()}
            />
          </div>
        </div>
      )}

      {showDoctorMgr && (
        <div className="modal-overlay" onClick={()=>setShowDoctorMgr(false)}>
          <div className="modal-box modal-doctors" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Referring Doctors</h3>
              <button className="modal-close" onClick={()=>setShowDoctorMgr(false)}>✕</button>
            </div>
            <div className="doc-add-row" style={{ flexDirection: "column", gap: 8 }}>
              <input
                placeholder="Doctor name *"
                value={newDoc.name}
                onChange={e=>setNewDoc(d=>({...d, name: e.target.value}))}
                onKeyDown={e=>{if(e.key==="Enter") addDoctor();}}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="📱 Cell / WhatsApp (e.g. 0821234567)"
                  value={newDoc.phone}
                  onChange={e=>setNewDoc(d=>({...d, phone: e.target.value}))}
                  style={{ flex: 1 }}
                />
                <input
                  placeholder="✉️ Email address"
                  value={newDoc.email}
                  onChange={e=>setNewDoc(d=>({...d, email: e.target.value}))}
                  style={{ flex: 1 }}
                />
              </div>
              <button className="act-s save" onClick={addDoctor} style={{ width: "100%" }}>+ Add Doctor</button>
            </div>
            <div className="doc-list">
              {doctors.map(d => {
                const key = d.name || d;
                const isEditing = editingDoctor?.original === key;
                return (
                  <div key={key} className="doc-list-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6, padding: "10px 10px" }}>
                    {isEditing ? (
                      // ── Edit mode ──
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                        <input
                          value={editingDoctor.name}
                          onChange={e => setEditingDoctor(ed => ({...ed, name: e.target.value}))}
                          placeholder="Doctor name *"
                          style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #2d9cdb", borderRadius: 6, fontSize: 13, background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            value={editingDoctor.phone}
                            onChange={e => setEditingDoctor(ed => ({...ed, phone: e.target.value}))}
                            placeholder="📱 Cell / WhatsApp"
                            style={{ flex: 1, padding: "7px 10px", border: "1.5px solid #dde3ec", borderRadius: 6, fontSize: 12, background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }}
                          />
                          <input
                            value={editingDoctor.email}
                            onChange={e => setEditingDoctor(ed => ({...ed, email: e.target.value}))}
                            placeholder="✉️ Email"
                            style={{ flex: 1, padding: "7px 10px", border: "1.5px solid #dde3ec", borderRadius: 6, fontSize: 12, background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="act-s save" onClick={saveEditDoctor} style={{ flex: 1, padding: "7px" }}>✅ Save</button>
                          <button className="act-s new" onClick={() => setEditingDoctor(null)} style={{ flex: 1, padding: "7px" }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      // ── View mode ──
                      <>
                        <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{d.name || d}</span>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              className="doc-remove"
                              style={{ color: "#1565c0", fontSize: 13 }}
                              onClick={() => setEditingDoctor({ original: key, name: d.name || d, phone: d.phone || "", email: d.email || "" })}
                              title="Edit doctor"
                            >✏️</button>
                            <button className="doc-remove" onClick={() => removeDoctor(d.name || d)} title="Remove">🗑️</button>
                          </div>
                        </div>
                        {(d.phone || d.email) ? (
                          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {d.phone && <span>📱 {d.phone}</span>}
                            {d.email && <span>✉️ {d.email}</span>}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "#f57c00" }}>⚠ No contact details — click ✏️ to add phone/email</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {doctors.length === 0 && <p className="empty">No doctors added yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

