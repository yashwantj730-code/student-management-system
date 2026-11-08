import clsx from "clsx";
export const cn = (...a) => clsx(...a);

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatINR = n => inr.format(Math.round(n || 0));
export const formatCompactINR = n => {
  n = Math.round(n || 0);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n}`;
};
export const formatDate = (d, opts = { day: "2-digit", month: "short", year: "numeric" }) => {
  if (!d) return "-";
  const dt = new Date(String(d).length === 10 ? `${d}T00:00:00` : d);
  return isNaN(dt) ? String(d) : dt.toLocaleDateString("en-IN", opts);
};
export const shortDate = d => formatDate(d, { day: "2-digit", month: "short" });
export const formatPhone = p => (p && p.length === 10 ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : p || "-");
export const initials = name => String(name || "?").replace("Mohd. ", "").replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
export const genderLabel = g => ({ M: "Male", F: "Female", O: "Other" })[g] || "-";

export const todayLocal = () => {
  const d = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000); // IST
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const GRADES = [
  { min: 90, grade: "O", point: 10 }, { min: 80, grade: "A+", point: 9 }, { min: 70, grade: "A", point: 8 },
  { min: 60, grade: "B+", point: 7 }, { min: 50, grade: "B", point: 6 }, { min: 40, grade: "C", point: 5 }, { min: 0, grade: "F", point: 0 }
];
export const gradeOf = pct => GRADES.find(g => pct >= g.min) || GRADES[GRADES.length - 1];

export const gradeTone = g => ({
  "O": "emerald", "A+": "emerald", "A": "sky", "B+": "indigo", "B": "violet", "C": "amber", "F": "rose"
})[g] || "slate";
export const feeTone = s => ({ Paid: "emerald", Partial: "amber", Due: "rose" })[s] || "slate";
export const attTone = pct => (pct == null ? "slate" : pct >= 85 ? "emerald" : pct >= 75 ? "sky" : pct >= 65 ? "amber" : "rose");

const AVATAR_GRADS = ["from-indigo-500 to-violet-500", "from-sky-500 to-cyan-400", "from-fuchsia-500 to-pink-500", "from-emerald-500 to-teal-400", "from-amber-500 to-orange-500", "from-rose-500 to-red-500"];
export const avatarGrad = name => AVATAR_GRADS[[...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GRADS.length];

export function downloadCSV(filename, rows) {
  const esc = v => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = rows.map(r => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
