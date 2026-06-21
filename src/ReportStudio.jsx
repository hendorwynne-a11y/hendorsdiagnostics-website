import React, { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://acqahzuiozxfuqyqmgqr.supabase.co";
// ← This key is set from the parent App.jsx via props
// We export this as a standalone page component

const SCAN_TYPES = [
  "OBSTETRIC","OB Normal","OB Detail Anomaly Scan","Detail Anomaly Scan",
  "ABDOMEN","KUB / RENAL","PELVIS","THYROID","SCROTAL","BREAST",
  "DVT / VASCULAR","CAROTID DOPPLER","MSK","SOFT TISSUE / HERNIA","OTHER"
];

const DOCTORS = [
  "Dr Kritzinger","Dr Van der Merwe","Dr Joubert","Dr Smith","Dr Botha",
  "Dr Nel","Dr Pretorius","Dr Du Plessis","Dr Venter","Other"
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

export default function ReportStudio({ supabaseKey }) {
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
      measurements: "", findings: "", comment: "", impression: "",
      status: "Draft",
    };
  }

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
      const row = {
        patient_name: report.patient_name,
        patient_id: report.patient_id,
        dob: report.dob || null,
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
        status: report.status,
        created_at: new Date().toISOString(),
      };
      await sbFetch("reports", { method:"POST", body: JSON.stringify(row) }, supabaseKey);
      setStatus({type:"success", msg:"Report saved to cloud ✓"});
    } catch(e) {
      setStatus({type:"error", msg:"Save failed: " + e.message});
    } finally { setSaving(false); }
  }

  function printReport() {
    const isOB = ["OBSTETRIC","OB Normal","OB Detail Anomaly Scan","Detail Anomaly Scan"].includes(report.scan_type);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page{size:A4;margin:15mm}
  body{font-family:Arial,sans-serif;color:#10233f;font-size:11px}
  .header{border-bottom:3px solid #0b73b7;padding-bottom:10px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-end}
  h1{color:#062D5C;margin:0;font-size:22px}
  .sub{color:#526575;font-size:10px;text-transform:uppercase;letter-spacing:1px}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}
  .card{border:1px solid #d6e4ef;border-radius:8px;padding:10px}
  .card h2{margin:0 0 6px;color:#075f96;font-size:11px;text-transform:uppercase}
  .row{font-size:11px;margin:3px 0}
  .label{color:#075f96;font-weight:bold;display:inline-block;min-width:80px}
  .section{border:1px solid #d6e4ef;border-radius:8px;padding:12px;margin-bottom:10px}
  .section h2{margin:0 0 8px;color:#075f96;font-size:12px;text-transform:uppercase;border-bottom:1px solid #e8f0f8;padding-bottom:4px}
  .section p{margin:4px 0;line-height:1.6}
  .footer{display:flex;justify-content:space-between;border-top:2px solid #0b73b7;padding-top:10px;font-size:10px;color:#31495f;margin-top:16px}
  .sig{font-family:'Brush Script MT',cursive;font-size:28px;color:#111}
</style></head><body>
<div class="header">
  <div><h1>HENDORS DIAGNOSTICS</h1><div class="sub">${isOB ? "Obstetric Ultrasound Report" : "Medical Ultrasound Report"}</div></div>
  <div style="text-align:right;font-size:10px;color:#526575">Date: ${report.exam_date}<br>Practice No: 039004 0590266</div>
</div>
<div class="grid">
  <div class="card"><h2>Patient</h2>
    <div class="row"><span class="label">Name:</span>${report.patient_name}</div>
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
${report.measurements ? `<div class="section"><h2>Measurements</h2><p style="white-space:pre-wrap">${report.measurements}</p></div>` : ""}
${report.findings ? `<div class="section"><h2>Findings</h2><p style="white-space:pre-wrap">${report.findings}</p></div>` : ""}
${report.comment ? `<div class="section"><h2>Comment</h2><p style="white-space:pre-wrap">${report.comment}</p></div>` : ""}
${report.impression ? `<div class="section"><h2>Impression</h2><p style="white-space:pre-wrap">${report.impression}</p></div>` : ""}
<div class="footer">
  <div><div class="sig">Hendor</div><strong>Hendor Wynne</strong><br>Medical Sonographer<br>HPCSA Reg: 0092673</div>
  <div><strong>Hendors Diagnostics</strong><br>Practice No: 039004 0590266<br>George / Beaufort West<br>072 763 6282</div>
</div>
</body></html>`;
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
                  <select value={report.referring_doctor} onChange={e=>setReport(r=>({...r,referring_doctor:e.target.value}))}>
                    <option value="">Select…</option>
                    {DOCTORS.map(d=><option key={d}>{d}</option>)}
                  </select>
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
              <h3 className="s-title">Measurements</h3>
              <DictateTextarea rows={6} value={report.measurements}
                onChange={v=>setReport(r=>({...r,measurements:v}))}
                placeholder={"BPD: 72mm\nHC: 265mm\nAC: 230mm\nFL: 52mm\nEFW: 1450g\nFHR: 148 bpm\nAFI: 14cm\nPlacenta: posterior, grade 1"}/>
            </div>
          </div>

          {/* Right: Report body */}
          <div className="studio-right">
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
              <button className="act-s print" onClick={printReport}>🖨️ Print / PDF</button>
              <button className="act-s new" onClick={()=>{setReport(defaultReport());setPatientSearch("");setStatus(null);}}>➕ New</button>
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
    </div>
  );
}
