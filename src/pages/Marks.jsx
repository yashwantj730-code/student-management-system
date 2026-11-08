import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, FileText, Pencil, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { qs } from "../lib/api.js";
import { useApi, useMeta } from "../lib/hooks.js";
import { cn, downloadCSV, gradeTone } from "../lib/utils.js";
import { Avatar, Badge, EmptyState, ErrorState, PageHeader, Select, Skeleton } from "../components/ui.jsx";
import MarksModal from "../components/MarksModal.jsx";

export default function Marks() {
  const meta = useMeta();
  const [course, setCourse] = useState("BCA");
  const [semester, setSemester] = useState("");
  const [editing, setEditing] = useState(null);
  const { data, loading, error, reload } = useApi(`/marks${qs({ course, semester })}`);
  const subjects = meta?.courses[course]?.subjects || data?.[0]?.report.subjects || [];
  const graded = (data || []).filter(r => r.report.cgpa != null);
  const avg = graded.length ? graded.reduce((a, r) => a + r.report.cgpa, 0) / graded.length : 0;
  const topper = [...graded].sort((a, b) => b.report.cgpa - a.report.cgpa)[0];
  const pass = graded.filter(r => r.report.result === "Pass").length;

  const exportCSV = () => {
    downloadCSV(`marks-${course.replace(/\W+/g, "-")}${semester ? `-sem${semester}` : ""}.csv`, [
      ["Roll No", "Name", "Semester", ...subjects.map(s => `${s.name} (100)`), "Percentage", "CGPA", "Grade", "Result"],
      ...data.map(r => [r.roll, r.name, r.semester, ...r.report.subjects.map(s => s.total ?? ""), r.report.percentage ?? "", r.report.cgpa ?? "", r.report.grade, r.report.result])
    ]);
    toast.success("Result sheet exported");
  };

  return (
    <div>
      <PageHeader title="Marks & Results" subtitle="Subject-wise marks with automatic grades, CGPA and printable report cards"
        actions={<button className="btn-outline" disabled={!data?.length} onClick={exportCSV}><Download className="h-4 w-4" /> Export result sheet</button>} />

      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="card grid gap-3 p-4 sm:grid-cols-2">
          <div><label className="label">Course</label><Select value={course} onChange={v => { setCourse(v); setSemester(""); }} options={meta ? Object.keys(meta.courses) : ["BCA"]} /></div>
          <div><label className="label">Semester</label><Select value={semester} onChange={setSemester} placeholder="All semesters" options={Array.from({ length: meta?.courses[course]?.semesters || 6 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }))} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[["Class avg CGPA", avg ? avg.toFixed(2) : "-"], ["Pass", `${pass}/${graded.length}`], ["Topper", topper ? topper.name.split(" ")[0] : "-"]].map(([k, v], i) => (
            <motion.div key={k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card flex min-w-[110px] flex-col justify-center p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</p>
              <p className="mt-1 flex items-center gap-1 truncate font-display text-xl font-extrabold">{i === 2 && topper && <Trophy className="h-4 w-4 text-amber-500" />}{v}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-slate-200/80 bg-slate-50/80 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <tr>
                  <th className="th">Student</th>
                  {subjects.map(s => <th key={s.code} className="th text-center" title={s.name}>{s.name.length > 16 ? s.name.split(/\s+/).map(w => w[0]).join("").replace(/[^A-Z]/g, "") : s.name}</th>)}
                  <th className="th text-center">%</th><th className="th text-center">CGPA</th><th className="th text-center">Result</th><th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {loading && !data ? [...Array(6)].map((_, i) => <tr key={i}><td colSpan={subjects.length + 5} className="px-4 py-3"><Skeleton className="h-10" /></td></tr>)
                  : data.map((r, i) => (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className={cn("group transition hover:bg-indigo-500/[0.04]", loading && "opacity-60")}>
                      <td className="td"><div className="flex items-center gap-3"><Avatar name={r.name} size="sm" /><div><Link to={`/students/${r.id}`} className="font-semibold hover:text-indigo-500">{r.name}</Link><p className="font-mono text-xs text-slate-500">{r.roll} · Sem {r.semester}</p></div></div></td>
                      {r.report.subjects.map(s => (
                        <td key={s.code} className="td text-center"><span className={cn("font-semibold", s.grade === "F" && "text-rose-500")}>{s.total ?? "-"}</span><span className="ml-1 text-[10px] text-slate-400">{s.grade !== "-" && s.grade}</span></td>
                      ))}
                      <td className="td text-center font-semibold">{r.report.percentage ?? "-"}</td>
                      <td className="td text-center"><Badge tone={gradeTone(r.report.grade)}>{r.report.cgpa?.toFixed(2) ?? "-"}</Badge></td>
                      <td className="td text-center"><Badge tone={r.report.result === "Pass" ? "emerald" : r.report.result === "Fail" ? "rose" : "amber"} dot>{r.report.result}</Badge></td>
                      <td className="td"><div className="flex justify-end gap-1">
                        <button className="icon-btn" title="Edit marks" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></button>
                        <Link className="icon-btn" title="Report card" to={`/report/${r.id}`}><FileText className="h-4 w-4" /></Link>
                      </div></td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          </div>
          {data && data.length === 0 && <EmptyState title="No students in this selection" />}
        </div>
      )}
      <MarksModal open={!!editing} row={editing} onClose={() => setEditing(null)} onSaved={() => reload(true)} />
    </div>
  );
}
