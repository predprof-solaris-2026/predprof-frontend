"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const g = globalThis as any
    if (g.__fetchPatched) return
    const origFetch = g.fetch.bind(window)

    g.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const resp = await origFetch(input, init)
      try {
        const cloned = resp.clone()
        const ct = cloned.headers.get?.("content-type") ?? ""
        if (ct.includes("application/json")) {
          const body = await cloned.json().catch(() => null)
          if (body && typeof body === "object" && "error" in body) {
            const err = (body as any).error
            let msg = "Ошибка"
            if (err) {
              if (typeof err === "string") msg = err
              else if (typeof err === "object") {
                if (err.detail) msg = String(err.detail)
                else if (err.message) msg = String(err.message)
              }
            }
            if (/auth|401|unauth/i.test(msg)) {
              toast.error("Вы не авторизованы")
            } else {
              toast.error(msg)
            }
          }
        }
      } catch (e) {
        // ignore parse errors
      }
      return resp
    }

    g.__fetchPatched = true
    return () => {
      if (!g.__fetchPatched) return
      g.fetch = origFetch
      delete g.__fetchPatched
    }
  }, [])

  return null
}

