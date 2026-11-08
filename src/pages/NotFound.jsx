import { Link } from "react-router-dom";
import { motion } from "framer-motion";
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="gradient-text font-display text-8xl font-extrabold">404</motion.p>
      <p className="mt-3 text-lg font-semibold">This page does not exist</p>
      <Link to="/" className="btn-primary mt-6">Go to dashboard</Link>
    </div>
  );
}
