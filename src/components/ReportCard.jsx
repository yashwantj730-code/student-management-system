import { GraduationCap } from "lucide-react";
import { formatDate, formatPhone } from "../lib/utils.js";

const GRADE_SCALE = [["O", "90-100", 10], ["A+", "80-89", 9], ["A", "70-79", 8], ["B+", "60-69", 7], ["B", "50-59", 6], ["C", "40-49", 5], ["F", "< 40", 0]];

// Always rendered as a white printable document
export default function ReportCard({ data }) {
  const s = data.student, r = data.report, a = data.attendance;
  const resultColor = r.result === "Pass" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : r.result === "Fail" ? "text-rose-700 bg-rose-50 border-rose-200" : "text-amber-700 bg-amber-50 border-amber-200";
  return (
    <div className="print-area mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
      <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-8 py-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30"><GraduationCap className="h-8 w-8" /></div>
          <div className="flex-1">
            <p className="font-display text-2xl font-extrabold tracking-tight">EduTrack Institute of Technology</p>
            <p className="text-sm text-white/80">Lucknow, Uttar Pradesh · Affiliated demo institution</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-white/70">Statement of Marks</p>
            <p className="font-display text-lg font-bold">Semester {s.semester} · 2026-27</p>
          </div>
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-2 border-b border-slate-200 px-8 py-5 text-sm sm:grid-cols-2">
        {[["Student name", s.name], ["Roll number", s.roll], ["Programme", `${data.courseInfo?.title || s.course} (${s.course})`], ["Semester", s.semester],
          ["Father / Guardian", s.guardianName || "-"], ["Date of birth", formatDate(s.dob)], ["Email", s.email], ["Mobile", formatPhone(s.phone)]].map(([k, v]) => (
          <div key={k} className="flex gap-2"><span className="w-36 shrink-0 text-slate-500">{k}</span><span className="font-semibold">{v}</span></div>
        ))}
      </div>

      <div className="px-8 py-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
              <th className="border border-slate-200 px-3 py-2">Code</th><th className="border border-slate-200 px-3 py-2">Subject</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Credits</th><th className="border border-slate-200 px-3 py-2 text-center">Internal (30)</th>
              <th className="border border-slate-200 px-3 py-2 text-center">External (70)</th><th className="border border-slate-200 px-3 py-2 text-center">Total (100)</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Grade</th><th className="border border-slate-200 px-3 py-2 text-center">GP</th>
            </tr>
          </thead>
          <tbody>
            {r.subjects.map(sub => (
              <tr key={sub.code} className={sub.grade === "F" ? "bg-rose-50" : ""}>
                <td className="border border-slate-200 px-3 py-2 font-mono text-xs">{sub.code}</td>
                <td className="border border-slate-200 px-3 py-2 font-medium">{sub.name}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">{sub.credits}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">{sub.internal ?? "-"}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">{sub.external ?? "-"}</td>
                <td className="border border-slate-200 px-3 py-2 text-center font-bold">{sub.total ?? "-"}</td>
                <td className="border border-slate-200 px-3 py-2 text-center font-bold">{sub.grade}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">{sub.total == null ? "-" : sub.point}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold">
              <td colSpan={2} className="border border-slate-200 px-3 py-2 text-right">Grand total</td>
              <td className="border border-slate-200 px-3 py-2 text-center">{r.credits}</td>
              <td colSpan={2} className="border border-slate-200 px-3 py-2" />
              <td className="border border-slate-200 px-3 py-2 text-center">{r.totalObtained}/{r.totalMax}</td>
              <td colSpan={2} className="border border-slate-200 px-3 py-2 text-center">{r.grade}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[["Percentage", r.percentage == null ? "-" : `${r.percentage}%`], ["CGPA", r.cgpa == null ? "-" : r.cgpa.toFixed(2)], ["Attendance", a.pct == null ? "-" : `${a.pct}%`]].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-slate-200 px-4 py-3 text-center"><p className="text-xs uppercase tracking-wide text-slate-500">{k}</p><p className="font-display text-2xl font-extrabold text-indigo-700">{v}</p></div>
          ))}
          <div className={`rounded-xl border px-4 py-3 text-center ${resultColor}`}><p className="text-xs uppercase tracking-wide opacity-70">Result</p><p className="font-display text-2xl font-extrabold">{r.result.toUpperCase()}</p></div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="text-xs text-slate-500">
            <p className="mb-1 font-semibold text-slate-700">Grading scale</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">{GRADE_SCALE.map(([g, range, gp]) => <span key={g}><b className="text-slate-700">{g}</b> {range} ({gp})</span>)}</div>
            <p className="mt-2">CGPA = Σ(credits × grade point) / Σ credits. Generated on {formatDate(new Date())}.</p>
          </div>
          <div className="text-center text-xs text-slate-500">
            <div className="mb-1 h-10 w-44 border-b border-slate-400" />
            Controller of Examinations
          </div>
        </div>
      </div>
      <p className="border-t border-slate-200 bg-slate-50 px-8 py-2 text-center text-[11px] text-slate-400">This is a computer generated report card from EduTrack SMS (demo data, built by Yashwant Jaiswal).</p>
    </div>
  );
}
