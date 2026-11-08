import { useEffect, useState } from "react";
import { NavLink, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenCheck, CalendarCheck, FileText, GraduationCap, Github, IndianRupee, LayoutDashboard, LogOut, Menu, Moon, RotateCcw, Sun, User, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../lib/auth.jsx";
import { useTheme } from "../lib/theme.jsx";
import { api } from "../lib/api.js";
import { cn } from "../lib/utils.js";
import { Avatar } from "./ui.jsx";
import { ConfirmDialog } from "./Modal.jsx";

const NAV = {
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/students", label: "Students", icon: Users },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/marks", label: "Marks & Results", icon: BookOpenCheck },
    { to: "/fees", label: "Fees", icon: IndianRupee }
  ],
  student: [
    { to: "/me", label: "My Dashboard", icon: LayoutDashboard, end: true },
    { to: "/me/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/me/report", label: "Report Card", icon: FileText },
    { to: "/me/fees", label: "Fees", icon: IndianRupee },
    { to: "/me/profile", label: "My Profile", icon: User }
  ]
};

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-lg font-extrabold tracking-tight">EduTrack</p>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Student Management System</p>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const items = NAV[user?.role] || [];
  const reset = async () => {
    setBusy(true);
    try { await api("/admin/reset-demo", { method: "POST" }); toast.success("Demo data restored"); setResetOpen(false); setTimeout(() => window.location.reload(), 500); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="flex h-full flex-col">
      <div className="py-6"><Brand /></div>
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{user?.role === "admin" ? "Administration" : "Student portal"}</p>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) => cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              isActive ? "text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white")}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                <Icon className="relative h-[18px] w-[18px] transition group-hover:scale-110" />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3 pb-5">
        {user?.role === "admin" && (
          <button onClick={() => setResetOpen(true)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
          </button>
        )}
        <div className="card flex items-center gap-3 p-3">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
          <button className="icon-btn" title="Log out" onClick={() => logout("Logged out successfully")}><LogOut className="h-4 w-4" /></button>
        </div>
        <a href="https://github.com/yashwantj730-code/student-management-system" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-500">
          <Github className="h-3.5 w-3.5" /> Built by Yashwant Jaiswal
        </a>
      </div>
      <ConfirmDialog open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={reset} busy={busy} confirmText="Reset data"
        title="Reset demo data?" text="This restores the original 30 demo students with their attendance, marks and fee records. Any changes you made will be lost." />
    </div>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const outlet = useOutlet();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);
  const current = (NAV[user?.role] || []).find(n => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative min-h-screen">
      <div className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-[120px] dark:bg-indigo-600/20" />
        <div className="absolute -right-40 top-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/10 blur-[120px] dark:bg-fuchsia-600/15" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-400/10 blur-[120px]" />
      </div>

      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200/80 bg-white/70 px-4 backdrop-blur-xl dark:border-white/[0.06] dark:bg-slate-950/50 lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="no-print fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="no-print fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-white px-4 dark:bg-slate-950 lg:hidden"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
              <button className="icon-btn absolute right-3 top-6" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64 print:!pl-0">
        <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#070b1a]/70">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button className="icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{greet}, {user?.name?.split(" ")[0]} 👋</p>
              <p className="truncate font-display font-bold">{current?.label || "Overview"}</p>
            </div>
            <span className="hidden rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold capitalize text-indigo-600 dark:text-indigo-300 sm:inline">{user?.role}</span>
            <motion.button whileTap={{ rotate: 180, scale: 0.9 }} className="icon-btn" onClick={toggle} aria-label="Toggle theme" title="Toggle dark / light mode">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:!max-w-none print:!p-0">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
