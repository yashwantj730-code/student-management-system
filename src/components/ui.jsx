import { useEffect, useRef } from "react";
import { animate, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react";
import { cn, avatarGrad, initials } from "../lib/utils.js";

const TONES = {
  emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300",
  sky: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-300",
  indigo: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-300",
  violet: "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-300",
  amber: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-300",
  slate: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300"
};
export const toneText = {
  emerald: "text-emerald-500", sky: "text-sky-500", indigo: "text-indigo-500", violet: "text-violet-500", amber: "text-amber-500", rose: "text-rose-500", slate: "text-slate-400"
};

export function Badge({ tone = "slate", dot, children, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Skeleton({ className }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-slate-200/70 dark:bg-white/[0.06]", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/[0.06]" />
    </div>
  );
}

export function Spinner({ className }) { return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />; }

export function Avatar({ name, size = "md", className }) {
  const s = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl", xl: "h-20 w-20 text-2xl" }[size];
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-bold text-white shadow-md", avatarGrad(name), s, className)}>
      {initials(name)}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500"><Icon className="h-7 w-7" /></div>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Select({ value, onChange, options, className, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={cn("input cursor-pointer pr-8", className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map(o => (typeof o === "object" ? <option key={o.value} value={o.value}>{o.label}</option> : <option key={o} value={o}>{o}</option>))}
    </select>
  );
}

export function AnimatedNumber({ value = 0, decimals = 0, format }) {
  const ref = useRef(null);
  const prev = useRef(0);
  const fmt = v => (format ? format(v) : Number(v).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
  useEffect(() => {
    const controls = animate(prev.current, value, { duration: 1.3, ease: [0.16, 1, 0.3, 1], onUpdate: v => { if (ref.current) ref.current.textContent = fmt(v); } });
    prev.current = value;
    return () => controls.stop();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref}>{fmt(0)}</span>;
}

const STAT_GRADS = {
  indigo: "from-indigo-500 to-violet-500 shadow-indigo-500/30", emerald: "from-emerald-500 to-teal-400 shadow-emerald-500/30",
  amber: "from-amber-500 to-orange-500 shadow-amber-500/30", rose: "from-rose-500 to-pink-500 shadow-rose-500/30",
  sky: "from-sky-500 to-cyan-400 shadow-sky-500/30", fuchsia: "from-fuchsia-500 to-purple-500 shadow-fuchsia-500/30"
};
export function StatCard({ icon: Icon, label, value, decimals, format, suffix, hint, tone = "indigo", index = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, duration: 0.45 }}
      className="card card-hover group relative overflow-hidden p-5">
      <div className={cn("pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-[0.12] blur-2xl transition group-hover:opacity-25", STAT_GRADS[tone])} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">
            <AnimatedNumber value={value} decimals={decimals} format={format} />{suffix && <span className="ml-0.5 text-lg font-bold text-slate-400">{suffix}</span>}
          </p>
          {hint && <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
        {Icon && <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition group-hover:scale-110 group-hover:rotate-3", STAT_GRADS[tone])}><Icon className="h-5 w-5" /></div>}
      </div>
    </motion.div>
  );
}

export function ProgressRing({ value = 0, size = 120, stroke = 10, tone = "indigo", children }) {
  const r = (size - stroke) / 2;
  const colors = { emerald: "#10b981", sky: "#0ea5e9", amber: "#f59e0b", rose: "#f43f5e", indigo: "#6366f1", slate: "#94a3b8" };
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" className="stroke-slate-200 dark:stroke-white/10" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" strokeLinecap="round" stroke={colors[tone]}
          initial={{ pathLength: 0 }} animate={{ pathLength: Math.min(1, value / 100) }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function Pagination({ page, pages, total, limit, onPage }) {
  if (!total) return null;
  const from = (page - 1) * limit + 1, to = Math.min(total, page * limit);
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 px-4 py-3 text-sm dark:border-white/[0.06] sm:flex-row">
      <p className="text-slate-500 dark:text-slate-400">Showing <b className="text-slate-700 dark:text-slate-200">{from}-{to}</b> of <b className="text-slate-700 dark:text-slate-200">{total}</b></p>
      <div className="flex items-center gap-1">
        <button className="icon-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        {nums.map((n, i) => (
          <span key={n} className="flex items-center">
            {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
            <button onClick={() => onPage(n)} className={cn("h-9 min-w-9 rounded-xl px-3 text-sm font-semibold transition", n === page ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30" : "hover:bg-slate-100 dark:hover:bg-white/10")}>{n}</button>
          </span>
        ))}
        <button className="icon-btn" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function Card({ title, subtitle, action, children, className, bodyClass, delay = 0 }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45 }} className={cn("card", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && <h3 className="font-bold">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClass)}>{children}</div>
    </motion.section>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <p className="font-semibold text-rose-500">Could not load data</p>
      <p className="mt-1 text-sm text-slate-500">{error?.message}</p>
      {onRetry && <button className="btn-outline mt-4" onClick={() => onRetry()}>Try again</button>}
    </div>
  );
}
