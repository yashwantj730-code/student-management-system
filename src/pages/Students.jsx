import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Eye, FilterX, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { api, qs } from "../lib/api.js";
import { useApi, useDebounced, useMeta } from "../lib/hooks.js";
import { attTone, cn, downloadCSV, feeTone, formatINR, formatPhone, gradeTone } from "../lib/utils.js";
import { Avatar, Badge, EmptyState, ErrorState, PageHeader, Pagination, Select, Skeleton } from "../components/ui.jsx";
import StudentFormModal from "../components/StudentFormModal.jsx";
import { ConfirmDialog } from "../components/Modal.jsx";

const COLUMNS = [
  { key: "name", label: "Student" }, { key: "course", label: "Course" }, { key: "attendance", label: "Attendance" },
  { key: "cgpa", label: "CGPA" }, { key: "fee", label: "Fee status" }
];
const LIMIT = 10;

export default function Students() {
  const navigate = useNavigate();
  const meta = useMeta();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ course: "", semester: "", attendance: "", fee: "" });
  const [sort, setSort] = useState({ key: "name", order: "asc" });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, student: null });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const dq = useDebounced(q, 300);
  useEffect(() => setPage(1), [dq, filters]);

  const params = { q: dq, ...filters, sort: sort.key, order: sort.order };
  const { data, loading, error, reload } = useApi(`/students${qs({ ...params, page, limit: LIMIT })}`);
  const courses = meta ? Object.keys(meta.courses) : [];
  const maxSem = filters.course && meta ? meta.courses[filters.course].semesters : 8;
  const hasFilters = q || Object.values(filters).some(Boolean);

  const toggleSort = key => setSort(s => ({ key, order: s.key === key && s.order === "asc" ? "desc" : "asc" }));
  const setFilter = k => v => setFilters(f => ({ ...f, [k]: v, ...(k === "course" ? { semester: "" } : {}) }));

  const exportCSV = async () => {
    try {
      const all = await api(`/students${qs({ ...params, page: 1, limit: 1000 })}`);
      downloadCSV(`students-${new Date().toISOString().slice(0, 10)}.csv`, [
        ["Roll No", "Name", "Gender", "Course", "Semester", "Email", "Phone", "Guardian", "Guardian Phone", "Address", "Attendance %", "Percentage", "CGPA", "Grade", "Fee Total", "Fee Paid", "Fee Due", "Fee Status"],
        ...all.items.map(s => [s.roll, s.name, s.gender, s.course, s.semester, s.email, `+91 ${s.phone}`, s.guardianName, s.guardianPhone ? `+91 ${s.guardianPhone}` : "", s.address,
          s.attendance.pct ?? "", s.percentage ?? "", s.cgpa ?? "", s.grade, s.fee.total, s.fee.paid, s.fee.due, s.fee.status])
      ]);
      toast.success(`Exported ${all.items.length} students to CSV`);
    } catch (e) { toast.error(e.message); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try { await api(`/students/${toDelete.id}`, { method: "DELETE" }); toast.success(`${toDelete.name} removed`); setToDelete(null); reload(true); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const SortIcon = ({ k }) => (sort.key !== k ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : sort.order === "asc" ? <ArrowUp className="h-3 w-3 text-indigo-500" /> : <ArrowDown className="h-3 w-3 text-indigo-500" />);

  return (
    <div>
      <PageHeader title="Students" subtitle={data ? `${data.total} student${data.total === 1 ? "" : "s"} ${hasFilters ? "match your filters" : "enrolled"}` : "Manage student records"}
        actions={<>
          <button className="btn-outline" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</button>
          <button className="btn-primary" onClick={() => setModal({ open: true, student: null })}><Plus className="h-4 w-4" /> Add student</button>
        </>} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mb-4 grid gap-3 p-4 md:grid-cols-[2fr_repeat(4,1fr)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search name, roll no, email, phone…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Select value={filters.course} onChange={setFilter("course")} options={courses} placeholder="All courses" />
        <Select value={filters.semester} onChange={setFilter("semester")} options={Array.from({ length: maxSem }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }))} placeholder="All semesters" />
        <Select value={filters.attendance} onChange={setFilter("attendance")} options={[{ value: "low", label: "Below 75%" }, { value: "ok", label: "75% and above" }]} placeholder="Any attendance" />
        <Select value={filters.fee} onChange={setFilter("fee")} options={[{ value: "Paid", label: "Paid" }, { value: "Partial", label: "Partially paid" }, { value: "Due", label: "Unpaid" }]} placeholder="Any fee status" />
        <button className="btn-ghost" disabled={!hasFilters} onClick={() => { setQ(""); setFilters({ course: "", semester: "", attendance: "", fee: "" }); }} title="Clear filters"><FilterX className="h-4 w-4" /><span className="md:hidden">Clear filters</span></button>
      </motion.div>

      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead className="border-b border-slate-200/80 bg-slate-50/80 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <tr>
                  <th className="th"><button onClick={() => toggleSort("roll")} className="inline-flex items-center gap-1 uppercase">Roll No <SortIcon k="roll" /></button></th>
                  {COLUMNS.map(c => <th key={c.key} className="th"><button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 uppercase">{c.label} <SortIcon k={c.key} /></button></th>)}
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {loading && !data ? [...Array(LIMIT)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-10" /></td></tr>
                )) : (
                  <AnimatePresence initial={false}>
                    {data?.items.map((s, i) => (
                      <motion.tr key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.025 }}
                        onClick={() => navigate(`/students/${s.id}`)}
                        className={cn("group cursor-pointer transition hover:bg-indigo-500/[0.04]", loading && "opacity-60")}>
                        <td className="td font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{s.roll}</td>
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <Avatar name={s.name} size="sm" />
                            <div><p className="font-semibold group-hover:text-indigo-500">{s.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{s.email} · {formatPhone(s.phone)}</p></div>
                          </div>
                        </td>
                        <td className="td"><p className="font-medium">{s.course}</p><p className="text-xs text-slate-500">Semester {s.semester}</p></td>
                        <td className="td">
                          {s.attendance.pct == null ? <span className="text-xs text-slate-400">No records</span> : (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${s.attendance.pct}%` }} transition={{ duration: 0.8 }}
                                  className={cn("h-full rounded-full", { emerald: "bg-emerald-500", sky: "bg-sky-500", amber: "bg-amber-500", rose: "bg-rose-500" }[attTone(s.attendance.pct)])} />
                              </div>
                              <span className={cn("text-xs font-semibold", s.attendance.low && "text-rose-500")}>{s.attendance.pct}%</span>
                            </div>
                          )}
                        </td>
                        <td className="td">{s.cgpa == null ? <span className="text-xs text-slate-400">-</span> : <div className="flex items-center gap-2"><span className="font-display font-bold">{s.cgpa.toFixed(2)}</span><Badge tone={gradeTone(s.grade)}>{s.grade}</Badge></div>}</td>
                        <td className="td"><Badge tone={feeTone(s.fee.status)} dot>{s.fee.status === "Due" ? "Unpaid" : s.fee.status}</Badge>{s.fee.due > 0 && <p className="mt-0.5 text-xs text-slate-500">{formatINR(s.fee.due)} due</p>}</td>
                        <td className="td" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                            <button className="icon-btn" title="View profile" onClick={() => navigate(`/students/${s.id}`)}><Eye className="h-4 w-4" /></button>
                            <button className="icon-btn" title="Edit" onClick={() => setModal({ open: true, student: s })}><Pencil className="h-4 w-4" /></button>
                            <button className="icon-btn hover:!bg-rose-500/10 hover:!text-rose-500" title="Delete" onClick={() => setToDelete(s)}><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
          {data && data.items.length === 0 && <EmptyState icon={Users} title="No students found" text="Try a different search or clear the filters." />}
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={LIMIT} onPage={setPage} />}
        </div>
      )}

      <StudentFormModal open={modal.open} student={modal.student} onClose={() => setModal({ open: false, student: null })} onSaved={() => reload(true)} />
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} busy={busy} title="Delete student?"
        text={`This permanently removes ${toDelete?.name} (${toDelete?.roll}) along with their login, marks, fee payments and attendance entries.`} />
    </div>
  );
}
