// Fetch wrapper: adds the JWT, normalises errors and reports slow (cold start) requests.
const slowListeners = new Set();
let pending = 0, slowTimer = null, isSlow = false;
const setSlow = v => { if (isSlow !== v) { isSlow = v; slowListeners.forEach(fn => fn(v)); } };
export const onSlow = fn => { slowListeners.add(fn); return () => slowListeners.delete(fn); };

export const TOKEN_KEY = "sms_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);

export async function api(path, { method = "GET", body } = {}) {
  pending++;
  if (!slowTimer) slowTimer = setTimeout(() => setSlow(true), 3500);
  try {
    const token = getToken();
    let res;
    try {
      res = await fetch(`/api${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch {
      throw new Error("Cannot reach the server. Check your connection and try again.");
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) window.dispatchEvent(new CustomEvent("sms:unauthorized", { detail: data.error }));
    if (!res.ok) {
      const err = new Error(data.error || (data.errors && data.errors.join(" · ")) || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  } finally {
    pending--;
    if (pending <= 0) { pending = 0; clearTimeout(slowTimer); slowTimer = null; setSlow(false); }
  }
}

export const qs = obj => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== "" && v != null) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : "";
};
