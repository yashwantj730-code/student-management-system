import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { AlertTriangle, CalendarDays, Check, CheckCheck, Save, UserX, X } from "lucide-react";
import { api, qs } from "../lib/api.js";
import { useApi, useMeta } from "../lib/hooks.js";
import { cn, formatDate, shortDate, todayLocal } from "../lib/utils.js";
import { Avatar, Badge, Card, EmptyState, ErrorState, PageHeader, Select, Skeleton, Spinner } from "../components/ui.jsx";

const lastWorkingDay = () => { const d = new Date(todayLocal() + "T00:00:00"); while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const GROUPS = [["BCA", 3], ["BCA", 5], ["B.Tech CSE", 5], ["B.Sc IT", 3], ["MCA", 1], ["BBA", 3]];

export default function Attendance() {
  const meta = useMeta();
  const [course, setCourse] = useState("BCA");
  const [semester, setSemester] = useState("3");
  const [date, setDate] = useState(lastWorkingDay);
  const [records, setRecords] = useState({});
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload } = useApi(`/attendance/sheet${qs({ course, semester, date })}`);
  const low = useApi("/attendance/low");

  useEffect(() => {
    if (data) setRecords(Object.fromEntries(data.students.map(s => [s.id, s.status || "P"])));
  }, [data]);

  const counts = useMemo(() => { const v = Object.values(records); return { p: v.filter(x => x === "P").length, a: v.filter(x => x === "A").length }; }, [records]);
  const dirty = data && data.students.some(s => (s.status || null) !== records[s.id]);
  const weekend = [0, 6].includes(new Date(date + "T00:00:00").getDay());
  const maxSem = meta?.courses[course]?.semesters || 8;

  const save = async () => {
    setSaving(true);
    try {
      const r = await api("/attendance", { method: "POST", body: { course, semester: Number(semester), date, records } });
      toast.success(`Attendance saved for ${formatDate(date)} · ${r.present} present, ${r.absent} absent`);
      reload(true); low.reload(true);
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };
  const setAll = v => setRecords(Object.fromEntries(Object.keys(records).map(k => [k, v])));

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark date-wise attendance for a class and track students below 75%" />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className="label">Course</label><Select value={course} onChange={v => { setCourse(v); setSemester(String(GROUPS.find(g => g[0] === v)?.[1] || 1)); }} options={meta ? Object.keys(meta.courses) : ["BCA"]} /></div>
              <div><label className="label">Semester</label><Select value={semester} onChange={setSemester} options={Array.from({ length: maxSem }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }))} /></div>
              <div><label className="label">Date</label><input type="date" className="input" max={todayLocal()} value={date} onChange={e => e.target.value && setDate(e.target.value)} /></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick select:</span>
              {GROUPS.map(([c, s]) => (
                <button key={c + s} onClick={() => { setCourse(c); setSemester(String(s)); }}
                  className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold transition", course === c && semester === String(s) ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10")}>
                  {c} · Sem {s}
                </button>
              ))}
            </div>
          </motion.div>

          {error ? <ErrorState error={error} onRetry={reload} /> : (
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-white/[0.06]">
                <div>
                  <p className="font-bold">{course} · Semester {semester}</p>
                  <p className="text-xs text-slate-500">{new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {data && (data.marked ? <Badge tone="emerald" dot>Already marked</Badge> : <Badge tone="amber" dot>Not marked yet</Badge>)}
                  {weekend && <Badge tone="slate">Weekend</Badge>}
                  <Badge tone="emerald">{counts.p} P</Badge><Badge tone="rose">{counts.a} A</Badge>
                </div>
              </div>
              {loading && !data ? <div className="space-y-2 p-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                : data.students.length === 0 ? <EmptyState icon={UserX} title="No students in this class" text="Pick another course or semester, or add students first." /> : (
                  <>
                    <div className="flex flex-wrap gap-2 px-5 pt-4">
                      <button className="btn-outline py-1.5" onClick={() => setAll("P")}><CheckCheck className="h-4 w-4 text-emerald-500" /> All present</button>
                      <button className="btn-outline py-1.5" onClick={() => setAll("A")}><X className="h-4 w-4 text-rose-500" /> All absent</button>
                    </div>
                    <ul className={cn("grid gap-2 p-4 md:grid-cols-2", loading && "opacity-60")}>
                      {data.students.map((s, i) => {
                        const v = records[s.id];
                        return (
                          <motion.li key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                            className={cn("flex items-center gap-3 rounded-2xl border p-3 transition", v === "A" ? "border-rose-400/40 bg-rose-500/[0.05]" : "border-slate-200/80 dark:border-white/[0.06]")}>
                            <Avatar name={s.name} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{s.name}</p>
                              <p className="text-xs text-slate-500">{s.roll} · <span className={cn(s.attendance.low && "font-semibold text-rose-500")}>{s.attendance.pct ?? "-"}% overall</span></p>
                            </div>
                            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/5">
                              {["P", "A"].map(x => (
                                <button key={x} onClick={() => setRecords(r => ({ ...r, [s.id]: x }))} aria-label={`${s.name} ${x === "P" ? "present" : "absent"}`}
                                  className={cn("relative flex h-8 w-10 items-center justify-center rounded-lg text-xs font-bold transition",
                                    v === x ? (x === "P" ? "bg-emerald-500 text-white shadow" : "bg-rose-500 text-white shadow") : "text-slate-500 hover:text-slate-800 dark:hover:text-white")}>
                                  {x === "P" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                </button>
                              ))}
                            </div>
                          </motion.li>
                        );
                      })}
                    </ul>
                    <div className="flex items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/60 px-5 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                      <p className="text-xs text-slate-500">{dirty ? "You have unsaved changes" : data.marked ? "Saved. Changes will update the record." : "Defaults to Present. Adjust and save."}</p>
                      <button className="btn-primary" disabled={saving} onClick={save}>{saving ? <Spinner /> : <Save className="h-4 w-4" />} {data.marked ? "Update attendance" : "Save attendance"}</button>
                    </div>
                  </>
                )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Low attendance" subtitle="Students below 75% (all classes)" bodyClass="p-2" action={low.data && <Badge tone="rose" dot>{low.data.length}</Badge>}>
            {!low.data ? <div className="space-y-2 p-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              : low.data.length === 0 ? <EmptyState icon={CheckCheck} title="No warnings" text="Every student meets the minimum." /> : (
                <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-white/[0.05]">
                  {low.data.map(s => (
                    <li key={s.id}>
                      <Link to={`/students/${s.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{s.name}</p><p className="text-xs text-slate-500">{s.course} Sem {s.semester} · {s.attendance.present}/{s.attendance.total} days</p></div>
                        <span className="font-display text-sm font-bold text-rose-500">{s.attendance.pct}%</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
          </Card>
          {data?.history?.length > 0 && (
            <Card title="Recently marked" subtitle={`${course} · Semester ${semester}`} bodyClass="p-3">
              <ul className="space-y-1">
                {data.history.map(h => (
                  <li key={h.date}>
                    <button onClick={() => setDate(h.date)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-white/[0.04]", h.date === date && "bg-indigo-500/10")}>
                      <CalendarDays className="h-4 w-4 text-indigo-500" />
                      <span className="flex-1 font-medium">{shortDate(h.date)}</span>
                      <span className="text-xs text-slate-500">{h.present}/{h.total} present</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
