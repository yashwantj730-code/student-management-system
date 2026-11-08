import { motion } from "framer-motion";
import { AlertTriangle, BookOpen, CalendarDays, CheckCircle2, Hash, Home, Mail, Phone, Receipt, User, XCircle } from "lucide-react";
import { Avatar, Badge, Card, EmptyState, ProgressRing, toneText } from "./ui.jsx";
import { attTone, cn, feeTone, formatDate, formatINR, formatPhone, genderLabel, gradeTone } from "../lib/utils.js";

export function ProfileHeader({ data, actions }) {
  const s = data.student;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-90" />
      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.18)_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="relative flex flex-col gap-4 px-6 pb-6 pt-14 sm:flex-row sm:items-end">
        <Avatar name={s.name} size="xl" className="ring-4 ring-white dark:ring-slate-900" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{s.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-mono font-semibold">{s.roll}</span><span>·</span><span>{s.course} · Semester {s.semester}</span>
            {s.attendance.low && <Badge tone="rose" dot>Low attendance</Badge>}
            <Badge tone={feeTone(s.fee.status)} dot>Fees {s.fee.status === "Due" ? "unpaid" : s.fee.status.toLowerCase()}</Badge>
          </div>
        </div>
        {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
}

export function QuickStats({ data }) {
  const a = data.attendance, r = data.report, f = data.fee;
  const items = [
    { label: "Attendance", value: a.pct == null ? "-" : `${a.pct}%`, sub: `${a.present}/${a.total} days present`, tone: attTone(a.pct) },
    { label: "CGPA", value: r.cgpa == null ? "-" : r.cgpa.toFixed(2), sub: r.percentage == null ? "Marks pending" : `${r.percentage}% · Grade ${r.grade}`, tone: gradeTone(r.grade) },
    { label: "Result", value: r.result, sub: `${r.subjects.length} subjects · ${r.credits} credits`, tone: r.result === "Pass" ? "emerald" : r.result === "Fail" ? "rose" : "amber" },
    { label: "Fee due", value: formatINR(f.due), sub: `${formatINR(f.paid)} of ${formatINR(f.total)} paid`, tone: feeTone(f.status) }
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((x, i) => (
        <motion.div key={x.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} className="card card-hover p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{x.label}</p>
          <p className={cn("mt-2 font-display text-2xl font-extrabold", toneText[x.tone])}>{x.value}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{x.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

export function InfoPanel({ data, delay = 0 }) {
  const s = data.student;
  const rows = [
    [Hash, "Roll number", s.roll], [BookOpen, "Programme", data.courseInfo?.title || s.course], [CalendarDays, "Admission year", s.admissionYear || "-"],
    [Mail, "Email", s.email], [Phone, "Mobile", formatPhone(s.phone)], [User, "Gender / DOB", `${genderLabel(s.gender)} · ${formatDate(s.dob)}`],
    [User, "Guardian", s.guardianName || "-"], [Phone, "Guardian mobile", formatPhone(s.guardianPhone)], [Home, "Address", s.address || "-"]
  ];
  return (
    <Card title="Personal details" delay={delay}>
      <dl className="grid gap-4 sm:grid-cols-2">
        {rows.map(([Icon, k, v]) => (
          <div key={k} className={cn("flex gap-3", k === "Address" && "sm:col-span-2")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500"><Icon className="h-4 w-4" /></div>
            <div className="min-w-0"><dt className="text-xs text-slate-500 dark:text-slate-400">{k}</dt><dd className="break-words text-sm font-medium">{v}</dd></div>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function AttendancePanel({ data, delay = 0, full }) {
  const a = data.attendance;
  const tone = attTone(a.pct);
  const days = [...a.log].reverse();
  const needed = a.total && a.pct < 75 ? Math.ceil((0.75 * a.total - a.present) / 0.25) : 0;
  return (
    <Card title="Attendance" subtitle={`Last ${a.total} working days`} delay={delay}>
      {a.total === 0 ? <EmptyState icon={CalendarDays} title="No attendance recorded yet" /> : (
        <div className={cn("grid gap-6", full && "lg:grid-cols-[auto_1fr]")}>
          <div className="flex items-center gap-5">
            <ProgressRing value={a.pct} tone={tone} size={124}>
              <p className="font-display text-2xl font-extrabold">{a.pct}%</p>
              <p className="text-[11px] text-slate-500">present</p>
            </ProgressRing>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {a.present} present</p>
              <p className="flex items-center gap-2"><XCircle className="h-4 w-4 text-rose-500" /> {a.absent} absent</p>
              {a.low ? <p className="flex items-start gap-2 text-rose-500"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Below 75%. Needs {needed} more consecutive present day{needed === 1 ? "" : "s"}.</p>
                : <p className="text-emerald-600 dark:text-emerald-400">Meets the 75% requirement</p>}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Day-wise record</p>
            <div className="flex flex-wrap gap-1.5">
              {days.map((d, i) => (
                <motion.div key={d.date} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.01 * i }}
                  title={`${formatDate(d.date)}: ${d.status === "P" ? "Present" : "Absent"}`}
                  className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold transition hover:scale-110",
                    d.status === "P" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-rose-500/20 text-rose-600 dark:text-rose-300")}>
                  {d.date.slice(8)}
                </motion.div>
              ))}
            </div>
            {full && (
              <div className="mt-5 max-h-72 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900"><tr><th className="th">Date</th><th className="th">Day</th><th className="th">Status</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {a.log.map(d => (
                      <tr key={d.date}><td className="td">{formatDate(d.date)}</td><td className="td text-slate-500">{new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" })}</td>
                        <td className="td"><Badge tone={d.status === "P" ? "emerald" : "rose"} dot>{d.status === "P" ? "Present" : "Absent"}</Badge></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export function MarksPanel({ data, delay = 0, action }) {
  const r = data.report;
  return (
    <Card title="Subject-wise marks" subtitle={`Semester ${data.student.semester} · Internal /30 + External /70`} delay={delay} action={action} bodyClass="p-0 pt-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="border-y border-slate-200/80 bg-slate-50/80 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <tr><th className="th">Subject</th><th className="th text-center">Int.</th><th className="th text-center">Ext.</th><th className="th">Total</th><th className="th text-center">Grade</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {r.subjects.map((s, i) => (
              <tr key={s.code}>
                <td className="td"><p className="font-semibold">{s.name}</p><p className="text-xs text-slate-500">{s.code} · {s.credits} credits</p></td>
                <td className="td text-center">{s.internal ?? "-"}</td>
                <td className="td text-center">{s.external ?? "-"}</td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.total ?? 0}%` }} transition={{ delay: 0.05 * i, duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                    </div>
                    <b>{s.total ?? "-"}</b>
                  </div>
                </td>
                <td className="td text-center"><Badge tone={gradeTone(s.grade)}>{s.grade}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 px-5 py-4 text-sm">
        <span>Total: <b>{r.totalObtained}/{r.totalMax}</b></span>
        <span>Percentage: <b>{r.percentage ?? "-"}%</b></span>
        <span>CGPA: <b className="gradient-text text-base">{r.cgpa?.toFixed(2) ?? "-"}</b></span>
        <Badge tone={r.result === "Pass" ? "emerald" : r.result === "Fail" ? "rose" : "amber"}>{r.result}</Badge>
      </div>
    </Card>
  );
}

export function FeesPanel({ data, delay = 0, action }) {
  const f = data.fee;
  const pct = f.total ? Math.round((f.paid / f.total) * 100) : 0;
  return (
    <Card title="Fees" subtitle={`Semester ${data.student.semester} fee · ${data.student.course}`} delay={delay} action={action}>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[["Total", f.total, ""], ["Paid", f.paid, "text-emerald-500"], ["Due", f.due, f.due ? "text-rose-500" : "text-emerald-500"]].map(([k, v, c]) => (
          <div key={k} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.04]"><p className="text-xs text-slate-500">{k}</p><p className={cn("mt-1 font-display text-lg font-bold", c)}>{formatINR(v)}</p></div>
        ))}
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-500">Payment progress</span><b>{pct}%</b></div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>
      </div>
      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Payment history</p>
      {data.payments.length === 0 ? <p className="rounded-xl bg-rose-500/5 px-3 py-4 text-center text-sm text-rose-500">No payments received yet</p> : (
        <ul className="space-y-2">
          {data.payments.map(p => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 px-3 py-2.5 dark:border-white/[0.06]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"><Receipt className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{p.receiptNo}</p><p className="truncate text-xs text-slate-500">{formatDate(p.date)} · {p.mode}{p.reference ? ` · ${p.reference}` : ""}</p></div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(p.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

