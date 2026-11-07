import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";
const COURSES = ["BCA", "MCA", "B.Tech", "B.Sc", "BBA"];
const EMPTY = { name: "", roll: "", course: "BCA", semester: 1, email: "", phone: "", attendance: "", marks: "" };

function grade(m) {
  if (m >= 90) return ["A+", "bg-emerald-500/15 text-emerald-300"];
  if (m >= 75) return ["A", "bg-sky-500/15 text-sky-300"];
  if (m >= 60) return ["B", "bg-violet-500/15 text-violet-300"];
  if (m >= 40) return ["C", "bg-amber-500/15 text-amber-300"];
  return ["F", "bg-rose-500/15 text-rose-300"];
}

function StatCard({ label, value, hint, color }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Bar({ value }) {
  const c = value >= 75 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${c}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-slate-300">{value}%</span>
    </div>
  );
}

function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-white" aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState([]);
  const [toast, setToast] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  const notify = msg => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  async function refresh() {
    const params = new URLSearchParams({ q, course });
    const [s, st] = await Promise.all([
      fetch(`${API}/api/students?${params}`).then(r => r.json()),
      fetch(`${API}/api/stats`).then(r => r.json())
    ]);
    setStudents(s); setStats(st); setLoading(false);
  }

  useEffect(() => { const t = setTimeout(() => refresh().catch(() => setLoading(false)), 250); return () => clearTimeout(t); }, [q, course]);

  const sorted = useMemo(() => {
    const list = [...students];
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "marks") list.sort((a, b) => b.marks - a.marks);
    if (sort === "attendance") list.sort((a, b) => b.attendance - a.attendance);
    return list;
  }, [students, sort]);

  function openAdd() { setForm(EMPTY); setEditId(null); setErrors([]); setOpen(true); }
  function openEdit(s) { setForm({ ...s }); setEditId(s.id); setErrors([]); setOpen(true); }

  async function submit(e) {
    e.preventDefault();
    const res = await fetch(`${API}/api/students${editId ? `/${editId}` : ""}`, {
      method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) return setErrors(data.errors || [data.error || "Something went wrong"]);
    setOpen(false); notify(editId ? "Student updated" : "Student added"); refresh();
  }

  async function remove(id) {
    await fetch(`${API}/api/students/${id}`, { method: "DELETE" });
    setConfirmDel(null); notify("Student deleted"); refresh();
  }

  function exportCSV() {
    const head = ["Name", "Roll", "Course", "Semester", "Email", "Phone", "Attendance", "Marks"];
    const rows = sorted.map(s => [s.name, s.roll, s.course, s.semester, s.email, s.phone, s.attendance, s.marks]);
    const csv = [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "students.csv"; a.click();
  }

  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const maxCourse = stats ? Math.max(1, ...Object.values(stats.byCourse)) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/40 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-lg font-bold">S</div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Student Management System</h1>
              <p className="text-xs text-slate-400">React · Tailwind CSS · Node.js · Express</p>
            </div>
          </div>
          <button onClick={openAdd} className="btn bg-violet-600 text-white hover:bg-violet-500">+ Add Student</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Students" value={stats?.total ?? "–"} color="text-white" />
          <StatCard label="Avg Attendance" value={stats ? `${stats.avgAttendance}%` : "–"} color="text-emerald-400" />
          <StatCard label="Avg Marks" value={stats ? `${stats.avgMarks}%` : "–"} color="text-cyan-400" />
          <StatCard label="Low Attendance" value={stats?.lowAttendance ?? "–"} hint="Below 75%" color="text-rose-400" />
        </section>

        <section className="grid gap-6 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-1">
            <h2 className="mb-4 font-semibold">Students by Course</h2>
            <div className="space-y-3">
              {stats && Object.entries(stats.byCourse).map(([c, n]) => (
                <div key={c}>
                  <div className="mb-1 flex justify-between text-sm"><span>{c}</span><span className="text-slate-400">{n}</span></div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${(n / maxCourse) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-3">
            <div className="mb-4 flex flex-col gap-3 md:flex-row">
              <input className="input md:flex-1" placeholder="Search by name, roll no. or email…" value={q} onChange={e => setQ(e.target.value)} />
              <select className="input md:w-40" value={course} onChange={e => setCourse(e.target.value)}>
                <option value="">All courses</option>
                {COURSES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="input md:w-44" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="name">Sort: Name</option>
                <option value="marks">Sort: Marks</option>
                <option value="attendance">Sort: Attendance</option>
              </select>
              <button onClick={exportCSV} className="btn border border-slate-700 text-slate-200 hover:bg-slate-800">Export CSV</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr className="border-b border-slate-800">
                    <th className="py-3 pr-4">Student</th><th className="pr-4">Roll No.</th><th className="pr-4">Course</th>
                    <th className="pr-4">Attendance</th><th className="pr-4">Marks</th><th className="pr-4">Grade</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan="7" className="py-10 text-center text-slate-400">Loading students… (free server may take a few seconds to wake up)</td></tr>}
                  {!loading && sorted.length === 0 && <tr><td colSpan="7" className="py-10 text-center text-slate-400">No students found.</td></tr>}
                  {sorted.map(s => {
                    const [g, gc] = grade(s.marks);
                    return (
                      <tr key={s.id} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-600/30 font-semibold text-violet-200">{s.name[0]}</div>
                            <div><p className="font-medium text-white">{s.name}</p><p className="text-xs text-slate-400">{s.email}</p></div>
                          </div>
                        </td>
                        <td className="pr-4 font-mono text-xs">{s.roll}</td>
                        <td className="pr-4">{s.course} <span className="text-slate-500">· Sem {s.semester}</span></td>
                        <td className="pr-4"><Bar value={s.attendance} /></td>
                        <td className="pr-4 font-semibold">{s.marks}</td>
                        <td className="pr-4"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${gc}`}>{g}</span></td>
                        <td className="text-right">
                          <button onClick={() => openEdit(s)} className="rounded-md px-3 py-1 text-sky-300 hover:bg-sky-500/10">Edit</button>
                          <button onClick={() => setConfirmDel(s)} className="rounded-md px-3 py-1 text-rose-300 hover:bg-rose-500/10">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-sm text-slate-500">
        © 2026 Yashwant Jaiswal · <a className="text-violet-400 hover:underline" href="https://yashwant-portfolio.onrender.com" target="_blank" rel="noreferrer">Portfolio</a>
      </footer>

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit Student" : "Add Student"}>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-sm">Full name<input className="input mt-1" value={form.name} onChange={set("name")} required /></label>
          <label className="text-sm">Roll no.<input className="input mt-1" value={form.roll} onChange={set("roll")} required /></label>
          <label className="text-sm">Course<select className="input mt-1" value={form.course} onChange={set("course")}>{COURSES.map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm">Semester<input type="number" min="1" max="10" className="input mt-1" value={form.semester} onChange={set("semester")} required /></label>
          <label className="text-sm">Phone<input className="input mt-1" value={form.phone} onChange={set("phone")} placeholder="10 digits" /></label>
          <label className="col-span-2 text-sm">Email<input type="email" className="input mt-1" value={form.email} onChange={set("email")} required /></label>
          <label className="text-sm">Attendance %<input type="number" min="0" max="100" className="input mt-1" value={form.attendance} onChange={set("attendance")} /></label>
          <label className="text-sm">Marks %<input type="number" min="0" max="100" className="input mt-1" value={form.marks} onChange={set("marks")} /></label>
          {errors.length > 0 && <ul className="col-span-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{errors.map(e => <li key={e}>• {e}</li>)}</ul>}
          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn border border-slate-700 hover:bg-slate-800">Cancel</button>
            <button className="btn bg-violet-600 text-white hover:bg-violet-500">{editId ? "Save changes" : "Add student"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete student?">
        <p className="text-slate-300">This will remove <b>{confirmDel?.name}</b> ({confirmDel?.roll}).</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setConfirmDel(null)} className="btn border border-slate-700 hover:bg-slate-800">Cancel</button>
          <button onClick={() => remove(confirmDel.id)} className="btn bg-rose-600 text-white hover:bg-rose-500">Delete</button>
        </div>
      </Modal>

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-lg">{toast}</div>}
    </div>
  );
}
