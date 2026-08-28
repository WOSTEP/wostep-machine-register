"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastState = { title: string; body?: string } | null;
type ToastContextValue = { toast: ToastState; showToast: (title: string, body?: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((title: string, body?: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ title, body });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast }}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.showToast;
}

export function ToastHost() {
  const ctx = useContext(ToastContext);
  if (!ctx?.toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 104,
        transform: "translateX(-50%)",
        width: "calc(100% - 28px)",
        maxWidth: "calc(var(--screen-max-width) - 28px)",
        zIndex: 80,
        padding: "13px 15px",
        borderRadius: 11,
        background: "#000000",
        boxShadow: "var(--shadow-toast)",
      }}
    >
      <div style={{ font: "600 13px/1.3 var(--font-display)", color: "#efefed" }}>
        {ctx.toast.title}
      </div>
      {ctx.toast.body && (
        <div
          style={{
            marginTop: 4,
            font: "400 11px/1.45 var(--font-body)",
            color: "rgba(244,242,236,.6)",
          }}
        >
          {ctx.toast.body}
        </div>
      )}
    </div>
  );
}
