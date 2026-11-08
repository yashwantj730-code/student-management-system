import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { useApi } from "../lib/hooks.js";
import { ErrorState, Skeleton } from "../components/ui.jsx";
import ReportCard from "../components/ReportCard.jsx";

export function ReportCardView({ path, backTo, backLabel }) {
  const { data, loading, error, reload } = useApi(path);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Skeleton className="mx-auto h-[640px] max-w-4xl" />;
  return (
    <div>
      <div className="no-print mx-auto mb-5 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        {backTo ? <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-500"><ArrowLeft className="h-4 w-4" /> {backLabel}</Link> : <span />}
        <button className="btn-primary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / Save as PDF</button>
      </div>
      <ReportCard data={data} />
    </div>
  );
}

export default function ReportCardPage() {
  const { id } = useParams();
  return <ReportCardView path={`/students/${id}/profile`} backTo={`/students/${id}`} backLabel="Back to profile" />;
}
