"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { X } from "lucide-react"

type ToastItem = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "destructive"
}

type ToastContext = {
  toast: (t: { title?: string; description?: string; variant?: ToastItem["variant"] }) => void
}

const ToastCtx = createContext<ToastContext | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((t: { title?: string; description?: string; variant?: ToastItem["variant"] }) => {
    const id = Math.random().toString(36).slice(2, 9)
    const item: ToastItem = { id, title: t.title, description: t.description, variant: t.variant || "default" }
    setToasts((s) => [item, ...s])
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4000)
  }, [])

  const remove = useCallback((id: string) => setToasts((s) => s.filter((x) => x.id !== id)), [])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm w-full rounded-lg border p-3 shadow-lg flex items-start gap-3 text-sm ring-1 ${
              t.variant === "destructive" ? "bg-red-600 text-white border-red-700" : t.variant === "success" ? "bg-green-600 text-white border-green-700" : "bg-white text-foreground border"
            }`}
          >
            <div className="flex-1">
              {t.title && <div className="font-medium">{t.title}</div>}
              {t.description && <div className="text-xs opacity-90">{t.description}</div>}
            </div>
            <button className="opacity-80 hover:opacity-100" onClick={() => remove(t.id)} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
