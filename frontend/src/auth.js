const API = "/api";
const SESSION_KEY = "toki_session";

export function readEntryParams() {
  const params = new URLSearchParams(window.location.search);
  const tokenid = params.get("tokenid");
  const devPhone = params.get("devPhone");

  if (tokenid || devPhone) {
    params.delete("tokenid");
    params.delete("devPhone");
    const rest = params.toString();
    const newUrl = window.location.pathname + (rest ? `?${rest}` : "");
    window.history.replaceState({}, "", newUrl);
  }

  return { tokenid, devPhone };
}

export function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session.sessionToken || Date.now() >= session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(sessionToken, employee) {
  const session = { sessionToken, employee, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function exchangeToken({ tokenid, devPhone }) {
  const res = await fetch(`${API}/auth/toki`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(devPhone ? { devPhone } : { token: tokenid }),
  });
  const data = await res.json();
  if (!res.ok || !data.authorized) return null;
  return saveSession(data.sessionToken, data.employee);
}

export function authorizedFetch(path, opts = {}) {
  const session = loadSession();
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${session?.sessionToken ?? ""}`,
    },
  });
}
