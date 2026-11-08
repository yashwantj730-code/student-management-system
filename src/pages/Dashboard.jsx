import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Award, CalendarCheck, GraduationCap, IndianRupee, TrendingUp, Users, Wallet } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "../lib/hooks.js";
import { useTheme } from "../lib/theme.jsx";
import { Avatar, Badge, Card, EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from "../components/ui.jsx";
import { formatCompactINR, formatDate, formatINR, shortDate } from "../lib/utils.js";

const COURSE_COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#0ea5e9", "#10b981"];
const GRADE_COLORS = { F: "#f43f5e", C: "#f59e0b", B: "#a855f7", "B+": "#6366f1", A: "#0ea5e9", "A+": "#10b981", O: "#059669" };

function ChartTooltip({ active, payload, label, money, suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map(p => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <b>{money ? formatINR(p.value) : `${p.value}${suffix}`}</b>
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, reload } = useApi("/stats");
  const { theme } = useTheme();
  const axis = { fontSize: 11, fill: theme === "dark" ? "#94a3b8" : "#64748b" };
  const grid = theme === "dark" ? "rgba(255,255,255,0.06)" : "#e2e8f0";

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div>
        <div className="grid gap-4 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
      </div>
    );
  }
  const k = data.kpis;
  const trend = data.attendanceTrend.map(d => ({ ...d, label: shortDate(d.date) }));
  const feePie = [{ name: "Collected", value: k.feesCollected, color: "#10b981" }, { name: "Due", value: k.feesDue, color: "#f43f5e" }];
  const collectedPct = k.feesCollected + k.feesDue ? Math.round((k.feesCollected / (k.feesCollected + k.feesDue)) * 100) : 0;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Overview of ${k.students} students across ${k.courses} courses · ${formatDate(new Date())}`}
        actions={<Link to="/attendance" className="btn-primary"><CalendarCheck className="h-4 w-4" /> Mark attendance</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} icon={Users} label="Total students" value={k.students} hint={`${k.courses} courses · ${k.passRate}% pass rate`} tone="indigo" />
        <StatCard index={1} icon={CalendarCheck} label="Avg. attendance" value={k.avgAttendance} decimals={1} suffix="%" hint={`${k.lowAttendance} students below 75%`} tone="emerald" />
        <StatCard index={2} icon={Award} label="Average CGPA" value={k.avgCgpa} decimals={2} suffix="/10" hint="Credit-weighted grade points" tone="fuchsia" />
        <StatCard index={3} icon={Wallet} label="Fees collected" value={k.feesCollected} format={formatCompactINR} hint={`${formatCompactINR(k.feesDue)} still due`} tone="amber" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Attendance trend" subtitle={`Daily present % across all classes · last ${trend.length} working days`} delay={0.1}
          action={<Badge tone="emerald" dot><TrendingUp className="h-3 w-3" /> {k.avgAttendance}% avg</Badge>}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="att" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis domain={[50, 100]} tick={axis} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<ChartTooltip suffix="%" />} />
                <Area type="monotone" dataKey="pct" name="Present" stroke="#6366f1" strokeWidth={2.5} fill="url(#att)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Fees collected vs due" subtitle="Current semester" delay={0.15}>
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={feePie} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={3} stroke="none" animationDuration={1200}>
                  {feePie.map(p => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltip money />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-3xl font-extrabold">{collectedPct}%</p>
              <p className="text-xs text-slate-500">collected</p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            {data.feeStatus.map(f => (
              <div key={f.status} className="rounded-xl bg-slate-100/80 py-2 dark:bg-white/5">
                <p className="font-display text-lg font-bold">{f.count}</p>
                <p className="text-slate-500">{f.status === "Due" ? "Unpaid" : f.status}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Students by course" subtitle="Current enrolment" delay={0.2}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byCourse} margin={{ left: -24, right: 4 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="course" tick={axis} tickLine={false} axisLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                <Bar dataKey="students" name="Students" radius={[8, 8, 0, 0]} animationDuration={1000}>
                  {data.byCourse.map((c, i) => <Cell key={c.course} fill={COURSE_COLORS[i % COURSE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Result distribution" subtitle="Students by overall grade" delay={0.25}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.gradeDistribution} margin={{ left: -24, right: 4 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="grade" tick={axis} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]} animationDuration={1000}>
                  {data.gradeDistribution.map(g => <Cell key={g.grade} fill={GRADE_COLORS[g.grade]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Fees by course" subtitle="Collected vs due (₹)" delay={0.3}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byCourse} margin={{ left: -8, right: 4 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="course" tick={axis} tickLine={false} axisLine={false} interval={0} />
                <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={v => (v >= 1e5 ? `${v / 1e5}L` : `${v / 1000}K`)} />
                <Tooltip content={<ChartTooltip money />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="collected" name="Collected" stackId="f" fill="#10b981" animationDuration={1000} />
                <Bar dataKey="due" name="Due" stackId="f" fill="#f43f5e" radius={[8, 8, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Low attendance alert" subtitle="Below the 75% minimum" delay={0.35} bodyClass="p-2"
          action={<Badge tone="rose" dot>{data.lowAttendance.length} students</Badge>}>
          {data.lowAttendance.length === 0 ? <EmptyState icon={CalendarCheck} title="Everyone is above 75%" /> : (
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {data.lowAttendance.map(s => (
                <li key={s.id}>
                  <Link to={`/students/${s.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{s.name}</p><p className="text-xs text-slate-500">{s.roll} · {s.course} Sem {s.semester}</p></div>
                    <span className="font-display text-sm font-bold text-rose-500">{s.pct}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Top performers" subtitle="Highest CGPA" delay={0.4} bodyClass="p-2">
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {data.topPerformers.map((s, i) => (
              <li key={s.id}>
                <Link to={`/students/${s.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                  <span className="w-4 text-center font-display text-sm font-bold text-slate-400">{i + 1}</span>
                  <Avatar name={s.name} size="sm" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{s.name}</p><p className="text-xs text-slate-500">{s.roll} · {s.course}</p></div>
                  <Badge tone="emerald">{s.cgpa.toFixed(2)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Recent payments" subtitle="Latest fee receipts" delay={0.45} bodyClass="p-2"
          action={<Link to="/fees" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline">View all <ArrowUpRight className="h-3 w-3" /></Link>}>
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {data.recentPayments.map(p => (
              <motion.li key={p.id} whileHover={{ x: 3 }} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"><IndianRupee className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.studentName}</p><p className="text-xs text-slate-500">{formatDate(p.date)} · {p.mode}</p></div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{formatINR(p.amount)}</span>
              </motion.li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400"><GraduationCap className="h-3.5 w-3.5" /> EduTrack SMS · Demo data for portfolio purposes</p>
    </div>
  );
}
