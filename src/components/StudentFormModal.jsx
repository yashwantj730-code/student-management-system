import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal.jsx";
import { Spinner } from "./ui.jsx";
import { api } from "../lib/api.js";
import { useMeta } from "../lib/hooks.js";

const EMPTY = { name: "", gender: "M", dob: "", email: "", phone: "", course: "BCA", semester: 1, roll: "", guardianName: "", guardianPhone: "", address: "" };

function Field({ label, children, className }) {
  return <div className={className}><label className="label">{label}</label>{children}</div>;
}

export default function StudentFormModal({ open, onClose, student, onSaved }) {
  const meta = useMeta();
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState([]);
  useEffect(() => { if (open) { setF(student ? { ...EMPTY, ...student } : EMPTY); setErrors([]); } }, [open, student]);
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));
  const courses = meta ? Object.keys(meta.courses) : ["BCA", "B.Tech CSE", "B.Sc IT", "MCA", "BBA"];
  const maxSem = meta?.courses[f.course]?.semesters || 8;

  const submit = async e => {
    e.preventDefault(); setBusy(true); setErrors([]);
    const body = { ...f, semester: Number(f.semester) };
    try {
      const saved = await api(student ? `/students/${student.id}` : "/students", { method: student ? "PUT" : "POST", body });
      toast.success(student ? "Student details updated" : `${saved.name} added · Roll ${saved.roll}`);
      onSaved?.(saved); onClose();
    } catch (err) { setErrors(err.message.split(" · ")); toast.error("Please fix the highlighted issues"); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={student ? "Edit student" : "Add new student"}
      subtitle={student ? `${student.roll} · ${student.course}` : "A student login is created automatically (password: Student@123)"}
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button form="student-form" className="btn-primary" disabled={busy}>{busy && <Spinner />}{student ? "Save changes" : "Add student"}</button></>}>
      <form id="student-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {errors.length > 0 && (
          <ul className="list-inside list-disc rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300 sm:col-span-2">{errors.map(x => <li key={x}>{x}</li>)}</ul>
        )}
        <Field label="Full name *" className="sm:col-span-2"><input required className="input" value={f.name} onChange={set("name")} placeholder="e.g. Aditi Srivastava" /></Field>
        <Field label="Email *"><input required type="email" className="input" value={f.email} onChange={set("email")} placeholder="name@example.com" /></Field>
        <Field label="Mobile *">
          <div className="flex"><span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5">+91</span>
            <input required inputMode="numeric" maxLength={10} className="input rounded-l-none" value={f.phone} onChange={set("phone")} placeholder="98XXXXXXXX" /></div>
        </Field>
        <Field label="Course *">
          <select className="input" value={f.course} onChange={e => setF(s => ({ ...s, course: e.target.value, semester: 1 }))}>{courses.map(c => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Semester *">
          <select className="input" value={f.semester} onChange={set("semester")}>{Array.from({ length: maxSem }, (_, i) => <option key={i + 1} value={i + 1}>Semester {i + 1}</option>)}</select>
        </Field>
        <Field label="Roll number"><input className="input uppercase" value={f.roll} onChange={set("roll")} placeholder="Auto-generated if empty" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Gender"><select className="input" value={f.gender} onChange={set("gender")}><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></select></Field>
          <Field label="Date of birth"><input type="date" className="input" value={f.dob} onChange={set("dob")} /></Field>
        </div>
        <Field label="Guardian name"><input className="input" value={f.guardianName} onChange={set("guardianName")} placeholder="Father / Mother / Guardian" /></Field>
        <Field label="Guardian mobile"><input inputMode="numeric" maxLength={10} className="input" value={f.guardianPhone} onChange={set("guardianPhone")} placeholder="10-digit number" /></Field>
        <Field label="Address" className="sm:col-span-2"><textarea rows={2} className="input resize-none" value={f.address} onChange={set("address")} placeholder="House no., area, Lucknow, Uttar Pradesh" /></Field>
      </form>
    </Modal>
  );
}
