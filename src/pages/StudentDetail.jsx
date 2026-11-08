import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowLeft, FileText, IndianRupee, Pencil, Trash2 } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/hooks.js";
import { cn } from "../lib/utils.js";
import { ErrorState, Skeleton } from "../components/ui.jsx";
import { AttendancePanel, FeesPanel, InfoPanel, MarksPanel, ProfileHeader, QuickStats } from "../components/Profile.jsx";
import StudentFormModal from "../components/StudentFormModal.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import MarksModal from "../components/MarksModal.jsx";
import { ConfirmDialog } from "../components/Modal.jsx";

const TABS = ["Overview", "Attendance", "Marks", "Fees"];

export function ProfileSkeleton() {
  return <div className="space-y-4"><Skeleton className="h-44" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-72" /></div>;
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/students/${id}/profile`);
  const [tab, setTab] = useState("Overview");
  const [edit, setEdit] = useState(false);
  const [pay, setPay] = useState(false);
  const [marks, setMarks] = useState(false);
  const [del, setDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const marksRow = useMemo(() => (data ? { id, name: data.student.name, roll: data.student.roll, report: data.report } : null), [data, id]);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <ProfileSkeleton />;
  const s = data.student;
  const remove = async () => {
    setBusy(true);
    try { await api(`/students/${id}`, { method: "DELETE" }); toast.success(`${s.name} removed`); navigate("/students"); }
    catch (e) { toast.error(e.message); setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <Link to="/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-500"><ArrowLeft className="h-4 w-4" /> All students</Link>
      <ProfileHeader data={data} actions={<>
        <Link to={`/report/${id}`} className="btn-outline"><FileText className="h-4 w-4" /> Report card</Link>
        <button className="btn-outline" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Edit</button>
        <button className="icon-btn hover:!bg-rose-500/10 hover:!text-rose-500" onClick={() => setDel(true)} title="Delete student"><Trash2 className="h-4 w-4" /></button>
      </>} />
      <QuickStats data={data} />

      <div className="card inline-flex gap-1 p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative rounded-xl px-4 py-2 text-sm font-semibold transition", tab === t ? "text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}>
            {tab === t && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <span className="relative">{t}</span>
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {tab === "Overview" && <div className="grid gap-4 lg:grid-cols-2"><InfoPanel data={data} /><AttendancePanel data={data} delay={0.05} /></div>}
        {tab === "Attendance" && <AttendancePanel data={data} full />}
        {tab === "Marks" && <MarksPanel data={data} action={<button className="btn-outline" onClick={() => setMarks(true)}><Pencil className="h-4 w-4" /> Edit marks</button>} />}
        {tab === "Fees" && <FeesPanel data={data} action={s.fee.due > 0 && <button className="btn-primary" onClick={() => setPay(true)}><IndianRupee className="h-4 w-4" /> Record payment</button>} />}
      </motion.div>

      <StudentFormModal open={edit} student={s} onClose={() => setEdit(false)} onSaved={() => reload(true)} />
      <PaymentModal open={pay} fixedStudent={s} onClose={() => setPay(false)} onSaved={() => reload(true)} />
      <MarksModal open={marks} row={marksRow} onClose={() => setMarks(false)} onSaved={() => reload(true)} />
      <ConfirmDialog open={del} onClose={() => setDel(false)} onConfirm={remove} busy={busy} title="Delete student?" text={`This permanently removes ${s.name} and all their records.`} />
    </div>
  );
}
