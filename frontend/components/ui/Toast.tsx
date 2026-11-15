"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "../../lib/utils";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { ToastMessage } from "../../types";

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || 4500;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
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

interface ToastCardProps {
  toast: ToastMessage;
  onClose: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#22C58B] shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#F5B942] shrink-0" />,
    error: <XCircle className="w-4 h-4 text-[#F06474] shrink-0" />,
    info: <Info className="w-4 h-4 text-[#38D9F5] shrink-0" />,
  };

  const borders = {
    success: "border-[#22C58B]/30",
    warning: "border-[#F5B942]/30",
    error: "border-[#F06474]/30",
    info: "border-[#38D9F5]/30",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto rounded-xl bg-[#0B1728]/95 border p-3.5 shadow-2xl shadow-black/80 backdrop-blur-2xl flex items-start justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200",
        borders[toast.type]
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5">{icons[toast.type]}</span>
        <div>
          <h4 className="text-xs font-semibold text-[#F3F7FC]">{toast.title}</h4>
          {toast.description && (
            <p className="text-[11px] text-[#B6C4D5] mt-0.5 leading-relaxed">
              {toast.description}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="text-[#7E90A8] hover:text-[#F3F7FC] p-0.5 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
