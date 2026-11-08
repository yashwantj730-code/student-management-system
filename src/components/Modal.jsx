import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../lib/utils.js";

export default function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" }[size];
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div role="dialog" aria-modal="true"
            initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={cn("relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:rounded-3xl", width)}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-white/[0.06]">
              <div>
                <h2 className="text-lg font-bold">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
              </div>
              <button className="icon-btn -mr-2" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmText = "Delete", busy }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-danger" disabled={busy} onClick={onConfirm}>{confirmText}</button></>}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{text}</p>
    </Modal>
  );
}
