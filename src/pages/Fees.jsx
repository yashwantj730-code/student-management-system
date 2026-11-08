import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Banknote, CheckCircle2, Clock, CreditCard, Download, IndianRupee, Plus, Search, Smartphone, Wallet } from "lucide-react";
import { useApi } from "../lib/hooks.js";
import { cn, downloadCSV, feeTone, formatCompactINR, formatDate, formatINR } from "../lib/utils.js";
import { Avatar, Badge, Card, EmptyState, ErrorState, PageHeader, Select, Skeleton, StatCard } from "../components/ui.jsx";
import PaymentModal from "../components/PaymentModal.jsx";

const MODE_ICON = { UPI: Smartphone, Cash: Banknote, Card: CreditCard };

export default function Fees() {
  const { data, loading, error, reload } = useApi("/fees");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState({ open: false, student: null });

  const list = useMemo(() => (data?.students || []).filter(s =>
    (!status || s.fee.status === status) && (!q || `${s.name} ${s.roll}`.toLowerCase().includes(q.toLowerCase()))), [data, q, status]);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <div className="space-y-4"><Skeleton className="h-10 w-60" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-96" /></div>;
  const s = data.summary;

  const exportCSV = () => downloadCSV("fee-payments.csv", [
    ["Receipt No", "Date", "Roll No", "Student", "Amount", "Mode", "Reference"],
    ...data.payments.map(p => [p.receiptNo, p.date, p.roll, p.studentName, p.amount, p.mode, p.reference])
  ]);

  return (
    <div>
      <PageHeader title="Fees" subtitle="Semester fee collection, dues and payment receipts"
        actions={<><button className="btn-outline" onClick={exportCSV}><Download className="h-4 w-4" /> Export payments</button>
          <button className="btn-primary" onClick={() => setPay({ open: true, student: null })}><Plus className="h-4 w-4" /> Record payment</button></>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} icon={Wallet} label="Expected this semester" value={s.expected} format={formatCompactINR} hint={`${data.students.length} students`} tone="indigo" />
        <StatCard index={1} icon={IndianRupee} label="Collected" value={s.collected} format={formatCompactINR} hint={`${Math.round((s.collected / (s.expected || 1)) * 100)}% of expected`} tone="emerald" />
        <StatCard index={2} icon={Clock} label="Outstanding dues" value={s.due} format={formatCompactINR} hint={`${s.partial + s.unpaid} students with dues`} tone="rose" />
        <StatCard index={3} icon={CheckCircle2} label="Fully paid" value={s.paid} hint={`${s.partial} partial · ${s.unpaid} unpaid`} tone="sky" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 dark:border-white/[0.06] sm:flex-row">
            <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input pl-10" placeholder="Search student or roll no…" value={q} onChange={e => setQ(e.target.value)} /></div>
            <Select className="sm:w-44" value={status} onChange={setStatus} placeholder="All statuses" options={[{ value: "Paid", label: "Paid" }, { value: "Partial", label: "Partial" }, { value: "Due", label: "Unpaid" }]} />
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[640px]">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900"><tr><th className="th">Student</th><th className="th">Total</th><th className="th">Paid</th><th className="th">Due</th><th className="th">Status</th><th className="th" /></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {list.map((st, i) => {
                  const pct = Math.round((st.fee.paid / st.fee.total) * 100);
                  return (
                    <motion.tr key={st.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }} className="hover:bg-indigo-500/[0.04]">
                      <td className="td"><div className="flex items-center gap-3"><Avatar name={st.name} size="sm" /><div><Link to={`/students/${st.id}`} className="font-semibold hover:text-indigo-500">{st.name}</Link><p className="text-xs text-slate-500">{st.roll} · {st.course}</p></div></div></td>
                      <td className="td">{formatINR(st.fee.total)}</td>
                      <td className="td"><p className="font-medium text-emerald-600 dark:text-emerald-400">{formatINR(st.fee.paid)}</p><div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div></td>
                      <td className={cn("td font-semibold", st.fee.due ? "text-rose-500" : "text-slate-400")}>{formatINR(st.fee.due)}</td>
                      <td className="td"><Badge tone={feeTone(st.fee.status)} dot>{st.fee.status === "Due" ? "Unpaid" : st.fee.status}</Badge></td>
                      <td className="td text-right">{st.fee.due > 0 && <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => setPay({ open: true, student: st })}>Collect</button>}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {list.length === 0 && <EmptyState title="No students match" />}
          </div>
        </div>

        <Card title="Payment history" subtitle={`${data.payments.length} receipts`} bodyClass="p-2">
          <ul className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto dark:divide-white/[0.05]">
            {data.payments.map(p => {
              const Icon = MODE_ICON[p.mode] || IndianRupee;
              return (
                <li key={p.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.studentName}</p><p className="truncate text-xs text-slate-500">{p.receiptNo} · {formatDate(p.date)} · {p.mode}</p></div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatINR(p.amount)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <PaymentModal open={pay.open} students={data.students} fixedStudent={pay.student} onClose={() => setPay({ open: false, student: null })} onSaved={() => reload(true)} />
    </div>
  );
}
