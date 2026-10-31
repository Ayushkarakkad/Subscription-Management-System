import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      toast(type, message);
    },
    [toast]
  );

  const success = useCallback((msg: string) => toast("success", msg), [toast]);
  const error = useCallback((msg: string) => toast("error", msg), [toast]);
  const warning = useCallback((msg: string) => toast("warning", msg), [toast]);
  const info = useCallback((msg: string) => toast("info", msg), [toast]);

  return (
    <ToastContext.Provider value={{ toast, showToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-3 transition-all ${
              t.type === "success"
                ? "bg-white border-emerald-200 text-emerald-900"
                : t.type === "error"
                ? "bg-white border-rose-200 text-rose-900"
                : t.type === "warning"
                ? "bg-white border-amber-200 text-amber-900"
                : "bg-white border-blue-200 text-blue-900"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
            {t.type === "info" && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 ml-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
