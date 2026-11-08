import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowRight, BarChart3, CalendarCheck, Eye, EyeOff, FileText, GraduationCap, IndianRupee, Lock, Mail, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { useTheme } from "../lib/theme.jsx";
import { Spinner } from "../components/ui.jsx";
import { cn } from "../lib/utils.js";

const DEMO = [
  { role: "Admin", email: "admin@sms.demo", password: "Admin@123", icon: ShieldCheck, text: "Full access: students, attendance, marks, fees", grad: "from-indigo-500 to-violet-500" },
  { role: "Student", email: "aarav.sharma@example.com", password: "Student@123", icon: UserRound, text: "Own profile, attendance, report card, fees", grad: "from-fuchsia-500 to-pink-500" }
];
const FEATURES = [
  { icon: BarChart3, title: "Live analytics", text: "Charts for attendance, results and fee collection" },
  { icon: CalendarCheck, title: "Date-wise attendance", text: "Mark Present / Absent with low-attendance alerts" },
  { icon: FileText, title: "Report cards", text: "Subject-wise marks, grades, CGPA and print-ready cards" },
  { icon: IndianRupee, title: "Fee management", text: "Payments by UPI, cash or card with due tracking" }
];

export default function Login() {
  const { user, login } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to={user.role === "admin" ? "/dashboard" : "/me"} replace />;

  const submit = async (e, creds = form) => {
    e?.preventDefault();
    setError(""); setBusy(true);
    try {
      const u = await login(creds.email, creds.password);
      toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);
      const from = location.state?.from;
      navigate(from && ((u.role === "admin" && !from.startsWith("/me")) || (u.role === "student" && from.startsWith("/me"))) ? from : u.role === "admin" ? "/dashboard" : "/me", { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="relative grid min-h-screen overflow-hidden lg:grid-cols-[1.1fr_1fr]">
      <button onClick={toggle} className="icon-btn absolute right-4 top-4 z-20" aria-label="Toggle theme">{theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>

      {/* Hero */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-24 top-24 h-72 w-72 animate-float rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 right-0 h-96 w-96 animate-float rounded-full bg-fuchsia-300/20 blur-3xl [animation-delay:2s]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.15)_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur"><GraduationCap className="h-6 w-6" /></div>
          <div><p className="font-display text-xl font-extrabold">EduTrack</p><p className="text-xs text-white/70">Student Management System</p></div>
        </div>
        <div className="relative my-auto max-w-lg">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="font-display text-5xl font-extrabold leading-[1.1] tracking-tight">
            Run your college, <span className="text-fuchsia-200">beautifully.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="mt-4 text-lg text-white/80">
            Students, attendance, results and fees in one fast, secure dashboard with separate portals for admins and students.
          </motion.p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                whileHover={{ y: -4 }} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                <f.icon className="h-5 w-5 text-fuchsia-200" />
                <p className="mt-3 font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-white/70">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-white/60">React · Tailwind · Framer Motion · Node.js · Express · MongoDB · JWT</p>
      </div>

      {/* Form */}
      <div className="relative flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px] lg:hidden" />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white"><GraduationCap className="h-6 w-6" /></div>
            <div><p className="font-display text-xl font-extrabold">EduTrack</p><p className="text-xs text-slate-500">Student Management System</p></div>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Sign in</h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Use a demo account below or enter your credentials.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="email" type="email" autoComplete="username" required className="input pl-10" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="password" type={show ? "text" : "password"} autoComplete="current-password" required className="input px-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Show password">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }} className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-300">{error}</motion.p>}
            <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">
              {busy ? <Spinner /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /> Demo accounts <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="grid gap-3">
            {DEMO.map(d => (
              <motion.button key={d.role} type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={busy}
                onClick={() => { setForm({ email: d.email, password: d.password }); submit(null, d); }}
                className="card group flex items-center gap-4 p-4 text-left transition hover:border-indigo-400/50">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", d.grad)}><d.icon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{d.role} login</p>
                  <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">{d.email} · {d.password}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{d.text}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-500" />
              </motion.button>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-slate-400">
            Designed & developed by <a className="font-semibold text-indigo-500 hover:underline" href="https://yashwantj730-code.github.io/yashwant-portfolio/" target="_blank" rel="noreferrer">Yashwant Jaiswal</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
