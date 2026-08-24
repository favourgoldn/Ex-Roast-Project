import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "roast" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  roast: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 3500 }: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-3), newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => showToast({ type: "success", title, message }), [showToast]);
  const roast = useCallback((title: string, message?: string) => showToast({ type: "roast", title, message, duration: 4000 }), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast({ type: "error", title, message }), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast({ type: "warning", title, message }), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast({ type: "info", title, message }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, roast, error, warning, info }}>
      {children}
      <div id="toast-container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${
                t.type === "roast"
                  ? "bg-[#181014]/95 border-red-600/50 shadow-red-950/40 text-red-50"
                  : t.type === "success"
                  ? "bg-[#111814]/95 border-emerald-500/40 text-emerald-50"
                  : t.type === "error"
                  ? "bg-[#1f1113]/95 border-rose-600/50 text-rose-50"
                  : t.type === "warning"
                  ? "bg-[#1a1710]/95 border-amber-500/40 text-amber-50"
                  : "bg-[#14141d]/95 border-zinc-700 text-zinc-100"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {t.type === "roast" && <Flame className="w-5 h-5 text-red-500 animate-pulse" />}
                {t.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {t.type === "error" && <XCircle className="w-5 h-5 text-rose-400" />}
                {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {t.type === "info" && <Info className="w-5 h-5 text-cyan-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold tracking-tight">{t.title}</p>
                {t.message && <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button
                id={`toast-close-${t.id}`}
                onClick={() => removeToast(t.id)}
                className="text-zinc-400 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
