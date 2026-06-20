import ReportStudio from "./ReportStudio.jsx";
import React, { useState } from "react";
import "./App.css";

// ── Supabase config ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://acqahzuiozxfuqyqmgqr.supabase.co";
const SUPABASE_ANON_KEY = ""; // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcWFoenVpb3p4ZnVxeXFtZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTY5MjYsImV4cCI6MjA5MzQ5MjkyNn0.8BMl5bjtI0o23eAG5j5p53Pun_h1s8cecY6xiTVs6aE

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ── Staff credentials (simple — upgrade to Supabase Auth later) ──────────────
const STAFF = {
  hendor: { password: "hd2025admin", role: "admin", name: "Dr Hendor" },
  reception: { password: "hd2025desk", role: "reception", name: "Reception" },
};

// ── Colour palette ───────────────────────────────────────────────────────────
// Deep navy #0a1628, steel blue #1e3a5f, accent #2d9cdb, white, light grey #f4f7fb

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("patients");

  if (!user) return <Login onLogin={setUser} />;
  return (
    <Shell user={user} onLogout={() => setUser(null)} page={page} setPage={setPage}>
      {page === "patients" && <Patients />}
      {page === "bookings" && <Bookings />}
      {page === "billing" && <Billing />}
      {page === "reports" && <Reports user={user} />}
      {page === "intake" && <Intake />}
      {page === "studio" && <ReportStudio supabaseKey={SUPABASE_ANON_KEY} />}
      {page === "password" && <ChangePassword user={user} onPasswordChanged={(newPwd) => {
        STAFF[user.username].password = newPwd;
      }} />}
    </Shell>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    const staff = STAFF[u.trim().toLowerCase()];
    if (staff && staff.password === p) {
      onLogin({ username: u, ...staff });
    } else {
      setErr("Incorrect username or password.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">HD</div>
        <h1>Hendors Diagnostics</h1>
        <p className="login-sub">Staff Portal</p>
        <form onSubmit={handleLogin}>
          <input
            placeholder="Username"
            value={u}
            onChange={e => { setU(e.target.value); setErr(""); }}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={p}
            onChange={e => { setP(e.target.value); setErr(""); }}
            autoComplete="current-password"
          />
          {err && <p className="login-err">{err}</p>}
          <button type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}

// ── SHELL ─────────────────────────────────────────────────────────────────────
function Shell({ user, onLogout, page, setPage, children }) {
  const nav = [
    { id: "patients", label: "Patients", icon: "👤" },
    { id: "bookings", label: "Bookings", icon: "📅" },
    { id: "billing", label: "Billing", icon: "💳" },
    { id: "reports", label: "Reports", icon: "📋" },
    { id: "intake", label: "Intake", icon: "📥" },
    { id: "studio", label: "Report Studio", icon: "🩺", adminOnly: true },
    { id: "password", label: "Change Password", icon: "🔑" },
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-hd">HD</span>
          <span className="brand-name">FrontDesk</span>
        </div>
        <nav className="sidebar-nav">
          {nav.filter(n => !n.adminOnly || user.role === "admin").map(n => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => setPage(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role === "admin" ? "Admin" : "Reception"}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

// ── PATIENTS ──────────────────────────────────────────────────────────────────
function Patients() {
  const [patients, setPatients] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    sbFetch("patients?select=*&order=created_at.desc&limit=200")
      .then(setPatients)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    [p.full_name, p.id_number, p.phone, p.medical_aid]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>Patient Register</h2>
        <span className="badge">{patients.length} patients</span>
      </div>
      <input
        className="search-input"
        placeholder="Search by name, ID, phone or medical aid…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading && <p className="loading">Loading…</p>}
      {err && <p className="error">⚠ {err}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>ID Number</th><th>Phone</th>
              <th>Medical Aid</th><th>DOB</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td><strong>{p.full_name}</strong></td>
                <td>{p.id_number || "—"}</td>
                <td>{p.phone || "—"}</td>
                <td>{p.medical_aid || "Cash"}</td>
                <td>{p.dob || "—"}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="empty">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── BOOKINGS ──────────────────────────────────────────────────────────────────
function Bookings() {
  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    sbFetch("bookings?select=*&order=created_at.desc&limit=200")
      .then(setBookings)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Bookings</h2>
        <span className="badge">{bookings.length} total</span>
      </div>
      {loading && <p className="loading">Loading…</p>}
      {err && <p className="error">⚠ {err}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Patient</th><th>Phone</th><th>Scan</th>
              <th>Branch</th><th>Date</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id}>
                <td><strong>{b.full_name || b.name}</strong></td>
                <td>{b.phone || "—"}</td>
                <td>{b.scan_type || b.scan || "—"}</td>
                <td>{b.branch || "—"}</td>
                <td>{b.preferred_date || b.date || "—"}</td>
                <td><span className={`status status-${(b.status||"pending").toLowerCase()}`}>{b.status || "Pending"}</span></td>
              </tr>
            ))}
            {!loading && bookings.length === 0 && (
              <tr><td colSpan={6} className="empty">No bookings found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── BILLING ───────────────────────────────────────────────────────────────────
function Billing() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [filter, setFilter] = React.useState("all");

  React.useEffect(() => {
    sbFetch("hd_billing_queue?select=*&order=created_at.desc&limit=300")
      .then(setItems)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? items : items.filter(i => (i.status || "").toLowerCase() === filter);
  const total = filtered.reduce((s, i) => s + (parseFloat(i.amount_due) || 0), 0);
  const paid = filtered.reduce((s, i) => s + (parseFloat(i.amount_paid) || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Billing Queue</h2>
        <span className="badge">{filtered.length} invoices</span>
      </div>
      <div className="billing-stats">
        <div className="stat-card"><span>Total Due</span><strong>R {total.toLocaleString()}</strong></div>
        <div className="stat-card green"><span>Total Paid</span><strong>R {paid.toLocaleString()}</strong></div>
        <div className="stat-card orange"><span>Outstanding</span><strong>R {(total - paid).toLocaleString()}</strong></div>
      </div>
      <div className="filter-row">
        {["all","pending","paid","partial"].map(f => (
          <button key={f} className={`filter-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      {loading && <p className="loading">Loading…</p>}
      {err && <p className="error">⚠ {err}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice</th><th>Patient</th><th>Exam</th>
              <th>Due</th><th>Paid</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id}>
                <td className="mono">{b.invoice_no || "—"}</td>
                <td><strong>{b.patient_name}</strong></td>
                <td>{b.exam_name || b.study_type || "—"}</td>
                <td>R {parseFloat(b.amount_due||0).toLocaleString()}</td>
                <td>R {parseFloat(b.amount_paid||0).toLocaleString()}</td>
                <td><span className={`status status-${(b.status||"pending").toLowerCase()}`}>{b.status || "Pending"}</span></td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="empty">No billing records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
function Reports({ user }) {
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    sbFetch("reports?select=*&order=created_at.desc&limit=200")
      .then(setReports)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r =>
    [r.patient_name, r.study_type, r.referring_doctor]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  function sendWhatsApp(r) {
    const msg = encodeURIComponent(
      `Hendors Diagnostics\n\nReport ready for: ${r.patient_name}\nStudy: ${r.study_type || ""}\nDate: ${r.report_date || r.created_at?.slice(0,10) || ""}\n\nPlease collect or arrange delivery.`
    );
    window.open(`https://wa.me/27${(r.patient_phone||"").replace(/^0/,"")}?text=${msg}`, "_blank");
  }

  function sendEmail(r) {
    const subject = encodeURIComponent(`Hendors Diagnostics — Report for ${r.patient_name}`);
    const body = encodeURIComponent(
      `Dear ${r.patient_name},\n\nYour report from Hendors Diagnostics is ready.\nStudy: ${r.study_type || ""}\nDate: ${r.report_date || r.created_at?.slice(0,10) || ""}\n\nPlease contact us to collect your report.\n\nHendors Diagnostics\n072 763 6282`
    );
    window.open(`mailto:${r.patient_email||""}?subject=${subject}&body=${body}`);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Reports</h2>
        <span className="badge">{reports.length} reports</span>
      </div>
      <input
        className="search-input"
        placeholder="Search by patient, study or doctor…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading && <p className="loading">Loading…</p>}
      {err && <p className="error">⚠ {err}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Patient</th><th>Study</th><th>Doctor</th>
              <th>Date</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td><strong>{r.patient_name}</strong></td>
                <td>{r.study_type || "—"}</td>
                <td>{r.referring_doctor || "—"}</td>
                <td>{r.report_date || r.created_at?.slice(0,10) || "—"}</td>
                <td><span className={`status status-${(r.status||"draft").toLowerCase()}`}>{r.status || "Draft"}</span></td>
                <td className="actions-cell">
                  <button className="act-btn whatsapp" onClick={() => sendWhatsApp(r)} title="WhatsApp">💬</button>
                  <button className="act-btn email" onClick={() => sendEmail(r)} title="Email">✉️</button>
                  {r.pdf_url && (
                    <a className="act-btn print" href={r.pdf_url} target="_blank" rel="noreferrer" title="Print/View PDF">🖨️</a>
                  )}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="empty">No reports found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── INTAKE ────────────────────────────────────────────────────────────────────
function Intake() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    sbFetch("pending_intake?select=*&order=created_at.desc&limit=100")
      .then(setItems)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function approve(item) {
    try {
      await sbFetch(`patients`, {
        method: "POST",
        body: JSON.stringify({
          full_name: item.full_name,
          id_number: item.id_number,
          dob: item.dob,
          sex: item.sex,
          phone: item.phone,
          email: item.email,
          address: item.address,
          medical_aid: item.medical_aid,
          medical_aid_no: item.medical_aid_no,
          referring_doctor: item.referring_doctor,
        }),
      });
      await sbFetch(`pending_intake?id=eq.${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Approved" }),
      });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "Approved" } : i));
    } catch (e) {
      alert("Error approving: " + e.message);
    }
  }

  const pending = items.filter(i => i.status !== "Approved");

  return (
    <div className="page">
      <div className="page-header">
        <h2>Patient Intake</h2>
        <span className="badge orange">{pending.length} pending</span>
      </div>
      {loading && <p className="loading">Loading…</p>}
      {err && <p className="error">⚠ {err}</p>}
      <div className="intake-grid">
        {items.map(item => (
          <div key={item.id} className={`intake-card ${item.status === "Approved" ? "approved" : ""}`}>
            <div className="intake-name">{item.full_name}</div>
            <div className="intake-details">
              <span>📱 {item.phone || "—"}</span>
              <span>🪪 {item.id_number || "—"}</span>
              <span>🏥 {item.medical_aid || "Cash"}</span>
              <span>👨‍⚕️ {item.referring_doctor || "—"}</span>
            </div>
            <div className="intake-time">{item.created_at?.slice(0,16).replace("T"," ") || ""}</div>
            {item.status === "Approved"
              ? <span className="status status-approved">✓ Approved</span>
              : <button className="approve-btn" onClick={() => approve(item)}>Approve → Add to Register</button>
            }
          </div>
        ))}
        {!loading && items.length === 0 && <p className="empty">No intake submissions yet</p>}
      </div>
    </div>
  );
}

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
function ChangePassword({ user, onPasswordChanged }) {
  const [current, setCurrent] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  const [success, setSuccess] = React.useState(false);

  function handleChange(e) {
    e.preventDefault();
    setMsg(null);
    if (current !== STAFF[user.username].password) {
      setMsg("Current password is incorrect."); return;
    }
    if (newPwd.length < 6) {
      setMsg("New password must be at least 6 characters."); return;
    }
    if (newPwd !== confirm) {
      setMsg("New passwords do not match."); return;
    }
    STAFF[user.username].password = newPwd;
    onPasswordChanged(newPwd);
    setSuccess(true);
    setCurrent(""); setNewPwd(""); setConfirm("");
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Change Password</h2>
      </div>
      <div className="pw-card">
        <p className="pw-info">Changing password for: <strong>{user.name}</strong> ({user.username})</p>
        <form onSubmit={handleChange}>
          <div className="pw-field">
            <label>Current Password</label>
            <input type="password" value={current} onChange={e => { setCurrent(e.target.value); setMsg(null); setSuccess(false); }} placeholder="Enter current password" required />
          </div>
          <div className="pw-field">
            <label>New Password</label>
            <input type="password" value={newPwd} onChange={e => { setNewPwd(e.target.value); setMsg(null); setSuccess(false); }} placeholder="At least 6 characters" required />
          </div>
          <div className="pw-field">
            <label>Confirm New Password</label>
            <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setMsg(null); setSuccess(false); }} placeholder="Repeat new password" required />
          </div>
          {msg && <p className="pw-error">⚠ {msg}</p>}
          {success && <p className="pw-success">✅ Password changed successfully!</p>}
          <button type="submit" className="pw-btn">Update Password</button>
        </form>
        <div className="pw-note">
          <strong>Note:</strong> This change applies for the current session only. To make it permanent, update the STAFF passwords in <code>App.jsx</code> on GitHub.
        </div>
      </div>
    </div>
  );
}
