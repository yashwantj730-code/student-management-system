import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./lib/auth.jsx";
import { ThemeProvider, useTheme } from "./lib/theme.jsx";
import Layout from "./components/Layout.jsx";
import WakeBanner from "./components/WakeBanner.jsx";
import { Skeleton } from "./components/ui.jsx";
import Login from "./pages/Login.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Students = lazy(() => import("./pages/Students.jsx"));
const StudentDetail = lazy(() => import("./pages/StudentDetail.jsx"));
const Attendance = lazy(() => import("./pages/Attendance.jsx"));
const Marks = lazy(() => import("./pages/Marks.jsx"));
const Fees = lazy(() => import("./pages/Fees.jsx"));
const ReportCardPage = lazy(() => import("./pages/ReportCardPage.jsx"));
const MyPortal = lazy(() => import("./pages/MyPortal.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}</div>
      <Skeleton className="h-80" />
    </div>
  );
}

function Protected({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/dashboard" : "/me"} replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  return <Navigate to={!user ? "/login" : user.role === "admin" ? "/dashboard" : "/me"} replace />;
}

function Themed() {
  const { theme } = useTheme();
  return (
    <Toaster position="top-right" toastOptions={{
      duration: 3200,
      style: { borderRadius: "14px", fontSize: "14px", background: theme === "dark" ? "#0f172a" : "#fff", color: theme === "dark" ? "#e2e8f0" : "#0f172a", border: theme === "dark" ? "1px solid rgba(255,255,255,.08)" : "1px solid #e2e8f0" }
    }} />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WakeBanner />
        <Themed />
        <Suspense fallback={<div className="p-8"><PageFallback /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route element={<Protected role="admin"><Layout /></Protected>}>
              <Route path="/dashboard" element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
              <Route path="/students" element={<Suspense fallback={<PageFallback />}><Students /></Suspense>} />
              <Route path="/students/:id" element={<Suspense fallback={<PageFallback />}><StudentDetail /></Suspense>} />
              <Route path="/attendance" element={<Suspense fallback={<PageFallback />}><Attendance /></Suspense>} />
              <Route path="/marks" element={<Suspense fallback={<PageFallback />}><Marks /></Suspense>} />
              <Route path="/fees" element={<Suspense fallback={<PageFallback />}><Fees /></Suspense>} />
              <Route path="/report/:id" element={<Suspense fallback={<PageFallback />}><ReportCardPage /></Suspense>} />
            </Route>
            <Route element={<Protected role="student"><Layout /></Protected>}>
              <Route path="/me/*" element={<Suspense fallback={<PageFallback />}><MyPortal /></Suspense>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
