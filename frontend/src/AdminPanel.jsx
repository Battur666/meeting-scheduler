import React, { useEffect, useState } from "react";

const API = "/api";
const ADMIN_KEY = "toki_admin_session";

export default function AdminPanel() {
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem(ADMIN_KEY));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function adminFetch(path, opts = {}) {
    return fetch(`${API}${path}`, {
      ...opts,
      headers: { ...(opts.headers || {}), Authorization: `Bearer ${sessionToken}` },
    });
  }

  async function loadEmployees() {
    const res = await adminFetch("/admin/employees");
    if (res.ok) setEmployees(await res.json());
  }

  useEffect(() => {
    if (sessionToken) loadEmployees();
  }, [sessionToken]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch(`${API}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setLoginError("Нууц үг буруу байна.");
      return;
    }
    const { sessionToken: token } = await res.json();
    localStorage.setItem(ADMIN_KEY, token);
    setSessionToken(token);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await adminFetch("/admin/employees/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setToast({ type: "error", msg: data.error || "Upload failed." });
      return;
    }
    setToast({ type: "ok", msg: `${data.count} ажилтан амжилттай орлоо.` });
    setFile(null);
    loadEmployees();
  }

  if (!sessionToken) {
    return (
      <div className="denied-screen">
        <div className="denied-card">
          <p className="eyebrow">Admin</p>
          <h1>Нэвтрэх</h1>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="password"
              placeholder="Нууц үг"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn primary" type="submit">Нэвтрэх</button>
          </form>
          {loginError && <p className="denied-sub" style={{ color: "#8B3A3A" }}>{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <div className="top">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Ажилчдын жагсаалт</h1>
        </div>
      </div>

      <div className="admin-panel">
        <form onSubmit={handleUpload} className="admin-upload-form">
          <label>XLSX файл сонгох</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button className="btn primary" type="submit" disabled={!file || uploading}>
            {uploading ? "Илгээж байна…" : "Ачаалах"}
          </button>
        </form>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Овог</th>
              <th>Нэр</th>
              <th>Утас</th>
              <th>Хэлтэс</th>
              <th>Компани</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>{e.lastname}</td>
                <td>{e.firstname}</td>
                <td>{e.phone}</td>
                <td>{e.department}</td>
                <td>{e.company}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="denied-sub">Нийт: {employees.length} ажилтан</p>
      </div>

      {toast && (
        <div className={`toast ${toast.type === "error" ? "error" : ""}`} onClick={() => setToast(null)}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
