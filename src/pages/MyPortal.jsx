import { Link, Route, Routes } from "react-router-dom";
import { CalendarCheck, FileText, IndianRupee } from "lucide-react";
import { useApi } from "../lib/hooks.js";
import { ErrorState, PageHeader } from "../components/ui.jsx";
import { AttendancePanel, FeesPanel, InfoPanel, MarksPanel, ProfileHeader, QuickStats } from "../components/Profile.jsx";
import { ProfileSkeleton } from "./StudentDetail.jsx";
import ReportCard from "../components/ReportCard.jsx";
import { Printer } from "lucide-react";

function useMe() { return useApi("/me"); }

function Guard({ children }) {
  const { data, loading, error, reload } = useMe();
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <ProfileSkeleton />;
  return children(data);
}

const Overview = () => <Guard>{d => (
  <div className="space-y-5">
    <ProfileHeader data={d} actions={<>
      <Link to="/me/report" className="btn-outline"><FileText className="h-4 w-4" /> Report card</Link>
      {d.fee.due > 0 && <Link to="/me/fees" className="btn-primary"><IndianRupee className="h-4 w-4" /> View dues</Link>}
    </>} />
    <QuickStats data={d} />
    <div className="grid gap-4 lg:grid-cols-2">
      <AttendancePanel data={d} delay={0.05} />
      <FeesPanel data={d} delay={0.1} />
    </div>
    <MarksPanel data={d} delay={0.15} />
  </div>
)}</Guard>;

const AttendancePage = () => <Guard>{d => (
  <div><PageHeader title="My attendance" subtitle={`${d.student.course} · Semester ${d.student.semester} · Minimum required 75%`}
    actions={<span className="inline-flex items-center gap-2 text-sm text-slate-500"><CalendarCheck className="h-4 w-4" /> Updated daily by admin</span>} />
    <AttendancePanel data={d} full /></div>
)}</Guard>;

const ReportPage = () => <Guard>{d => (
  <div>
    <div className="no-print mx-auto mb-5 flex max-w-4xl flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold">Report card</h1><p className="text-sm text-slate-500">Semester {d.student.semester} statement of marks</p></div>
      <button className="btn-primary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / Save as PDF</button>
    </div>
    <ReportCard data={d} />
  </div>
)}</Guard>;

const FeesPage = () => <Guard>{d => (
  <div><PageHeader title="My fees" subtitle="Pay at the accounts office by UPI, cash or card. Payments show here once recorded." />
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><FeesPanel data={d} />
      <div className="card p-5 text-sm">
        <h3 className="font-bold">How to pay</h3>
        <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
          <li>• UPI through the college fee portal, quoting your roll number <b>{d.student.roll}</b>.</li>
          <li>• Cash or card at the accounts office, Admin Block, 10 AM to 4 PM.</li>
          <li>• Your receipt number appears in the payment history after the office records it.</li>
        </ul>
      </div>
    </div></div>
)}</Guard>;

const ProfilePage = () => <Guard>{d => (
  <div className="space-y-5"><ProfileHeader data={d} /><InfoPanel data={d} /></div>
)}</Guard>;

export default function MyPortal() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="report" element={<ReportPage />} />
      <Route path="fees" element={<FeesPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<Overview />} />
    </Routes>
  );
}
