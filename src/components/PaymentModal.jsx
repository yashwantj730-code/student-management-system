import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import Modal from "./Modal.jsx";
import { Spinner } from "./ui.jsx";
import { api } from "../lib/api.js";
import { cn, formatINR, todayLocal } from "../lib/utils.js";

const MODES = [{ id: "UPI", icon: Smartphone }, { id: "Cash", icon: Banknote }, { id: "Card", icon: CreditCard }];

// students: [{id,name,roll,fee:{due,...}}]; fixedStudent: preselect and lock
export default function PaymentModal({ open, onClose, students = [], fixedStudent, onSaved }) {
  const options = useMemo(() => (fixedStudent ? [fixedStudent] : students.filter(s => s.fee.due > 0)), [students, fixedStudent]);
  const [f, setF] = useState({ studentId: "", amount: "", mode: "UPI", date: todayLocal(), reference: "" });
  const [busy, setBusy] = useState(false);
  const sel = options.find(s => s.id === f.studentId);
  useEffect(() => {
    if (open) { const first = fixedStudent || options[0]; setF({ studentId: first?.id || "", amount: first ? String(first.fee.due) : "", mode: "UPI", date: todayLocal(), reference: "" }); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await api("/fees/payments", { method: "POST", body: { ...f, amount: Number(f.amount) } });
      toast.success(`Payment of ${formatINR(r.payment.amount)} recorded · ${r.payment.receiptNo}`);
      onSaved?.(r); onClose();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record fee payment" subtitle="Receipt number is generated automatically"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button form="pay-form" className="btn-primary" disabled={busy || !sel}>{busy && <Spinner />}Record payment</button></>}>
      {options.length === 0 ? <p className="text-sm text-slate-500">All students have cleared their fees. 🎉</p> : (
        <form id="pay-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Student</label>
            <select className="input" disabled={!!fixedStudent} value={f.studentId} onChange={e => { const s = options.find(x => x.id === e.target.value); setF({ ...f, studentId: e.target.value, amount: String(s?.fee.due || "") }); }}>
              {options.map(s => <option key={s.id} value={s.id}>{s.roll} · {s.name} (due {formatINR(s.fee.due)})</option>)}
            </select>
          </div>
          {sel && (
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center text-xs dark:bg-white/[0.04]">
              <div><p className="text-slate-500">Total fee</p><p className="mt-0.5 font-bold">{formatINR(sel.fee.total)}</p></div>
              <div><p className="text-slate-500">Paid</p><p className="mt-0.5 font-bold text-emerald-500">{formatINR(sel.fee.paid)}</p></div>
              <div><p className="text-slate-500">Due</p><p className="mt-0.5 font-bold text-rose-500">{formatINR(sel.fee.due)}</p></div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Amount (₹)</label>
              <input required type="number" min={1} max={sel?.fee.due} className="input" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
              {sel && <div className="mt-2 flex gap-1.5">{[0.25, 0.5, 1].map(x => <button type="button" key={x} onClick={() => setF({ ...f, amount: String(Math.round(sel.fee.due * x)) })} className="rounded-lg bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-300">{x === 1 ? "Full due" : `${x * 100}%`}</button>)}</div>}
            </div>
            <div><label className="label">Payment date</label><input required type="date" max={todayLocal()} className="input" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(m => (
                <button type="button" key={m.id} onClick={() => setF({ ...f, mode: m.id })}
                  className={cn("flex flex-col items-center gap-1 rounded-2xl border py-3 text-sm font-semibold transition", f.mode === m.id ? "border-indigo-400 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5")}>
                  <m.icon className="h-5 w-5" />{m.id}
                </button>
              ))}
            </div>
          </div>
          <div><label className="label">Reference / transaction ID</label><input className="input" value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} placeholder={f.mode === "UPI" ? "UPI transaction ID" : f.mode === "Card" ? "Last 4 digits / auth code" : "Optional"} /></div>
        </form>
      )}
    </Modal>
  );
}
