import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coffee } from "lucide-react";
import { onSlow } from "../lib/api.js";

export default function WakeBanner() {
  const [slow, setSlow] = useState(false);
  useEffect(() => onSlow(setSlow), []);
  return (
    <AnimatePresence>
      {slow && (
        <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
          className="no-print fixed inset-x-0 top-3 z-[70] mx-auto flex w-[calc(100%-1.5rem)] max-w-lg items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-50/95 px-4 py-3 text-sm text-amber-900 shadow-xl backdrop-blur dark:bg-amber-950/90 dark:text-amber-100">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/20"><Coffee className="h-5 w-5 animate-pulse" /></span>
          <div>
            <p className="font-semibold">Waking up the server…</p>
            <p className="text-xs opacity-80">This demo runs on free hosting that sleeps when idle. The first request can take up to a minute.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
