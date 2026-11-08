import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal.jsx";
import { Badge, Spinner } from "./ui.jsx";
import { api } from "../lib/api.js";
import { gradeOf, gradeTone } from "../lib/utils.js";

// row: { id, name, roll, report: { subjects: [...] } }
export default function MarksModal({ open, onClose, row, onSaved }) {
  const [subs, setSubs] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open && row) setSubs(row.report.subjects.map(s => ({ ...s, internal: s.internal ?? "", external: s.external ?? "" }))); }, [open, row]);
  const set = (i, k, v) => setSubs(list => list.map((s, j) => (j === i ? { ...s, [k]: v === "" ? "" : Math.max(0, Math.min(k === "internal" ? 30 : 70, Number(v))) } : s)));
  const graded = subs.filter(s => s.internal !== "" && s.external !== "");
  const pct = graded.length ? graded.reduce((a, s) => a + Number(s.internal) + Number(s.external), 0) / graded.length : null;
  const credits = graded.reduce((a, s) => a + s.credits, 0);
  const cgpa = credits ? graded.reduce((a, s) => a + gradeOf(Number(s.internal) + Number(s.external)).point * s.credits, 0) / credits : null;

  const save = async () => {
    setBusy(true);
    try {
      const report = await api(`/marks/${row.id}`, { method: "PUT", body: { subjects: subs.map(s => ({ code: s.code, internal: s.internal, external: s.external })) } });
      toast.success(`Marks saved for ${row.name}`);
      onSaved?.(report); onClose();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`Edit marks · ${row?.name || ""}`} subtitle={`${row?.roll || ""} · Internal out of 30, External out of 70`}
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy} onClick={save}>{busy && <Spinner />}Save marks</button></>}>
      <div className="space-y-3">
        {subs.map((s, i) => {
          const total = s.internal !== "" && s.external !== "" ? Number(s.internal) + Number(s.external) : null;
          const g = total == null ? null : gradeOf(total);
          return (
            <div key={s.code} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-slate-200/80 p-3 dark:border-white/10 sm:grid-cols-[1fr_90px_90px_100px]">
              <div className="col-span-2 sm:col-span-1"><p className="text-sm font-semibold">{s.name}</p><p className="text-xs text-slate-500">{s.code} · {s.credits} credits</p></div>
              <input type="number" min={0} max={30} className="input text-center" placeholder="Int /30" value={s.internal} onChange={e => set(i, "internal", e.target.value)} aria-label={`${s.name} internal`} />
              <input type="number" min={0} max={70} className="input text-center" placeholder="Ext /70" value={s.external} onChange={e => set(i, "external", e.target.value)} aria-label={`${s.name} external`} />
              <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                <span className="font-display font-bold">{total ?? "-"}</span>{g && <Badge tone={gradeTone(g.grade)}>{g.grade}</Badge>}
              </div>
            </div>
          );
        })}
        <div className="flex items-center justify-end gap-6 rounded-2xl bg-indigo-500/5 px-4 py-3 text-sm">
          <span>Percentage: <b>{pct == null ? "-" : `${pct.toFixed(1)}%`}</b></span>
          <span>CGPA: <b className="gradient-text">{cgpa == null ? "-" : cgpa.toFixed(2)}</b></span>
        </div>
      </div>
    </Modal>
  );
}
