"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, Hash, Star, Slash } from "lucide-react"
import useUserStore from "@/lib/store/userStore"
import { getUserByIdApiUserUserIdGet } from "@/lib/client"
import { getTokenFromCookie } from "@/lib/auth"
import Link from "next/link"

export default function ProfilePage() {
  const storeUser = useUserStore((s) => s.user)
  const setStoreUser = useUserStore((s) => s.setUser)
  const [user, setUser] = useState<any | null>(storeUser || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadById = async (id: string, token?: string | null) => {
      if (!id || id === "undefined") return
      setLoading(true)
      try {
        const options: any = { path: { user_id: id } }
        if (token) options.headers = { Authorization: `Bearer ${token}` }
        const resp: any = await getUserByIdApiUserUserIdGet(options)
        const data = resp?.data || resp
        if (mounted && data && (data.id || data.email)) {
          setUser(data)
          setStoreUser(data)
        }
      } catch (e) {
        console.error("Failed to load user:", e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    const tryLoad = async () => {
      const token = getTokenFromCookie()
      if (!mounted) return
      setLoading(true)

      try {
        if (storeUser?.id && storeUser?.email) {
          setUser(storeUser)
          return
        }

        // если есть только id в сторе — попробуем дозагрузить по id
        if (storeUser?.id) {
          await loadById(String(storeUser.id), token)
          return
        }

        if (!token) return

        // Попробуем получить пользователя по токену через серверный эндпоинт
        try {
          const resp: any = await (await import("@/lib/client")).getUserByTokenApiUserTokenGet({ headers: { Authorization: `Bearer ${token}` } })
          const data = resp?.data || resp
          if (mounted && data && (data.id || data.email)) {
            setUser(data)
            setStoreUser(data)
            return
          }
        } catch (e) {
          console.error("getUserByToken failed:", e)
        }

        // fallback: try to decode JWT and load by id
        try {
          const parts = token.split('.')
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
            let userId = payload.user_id || payload.id || payload.uid
            if (!userId && payload.sub && !payload.sub.includes('@')) userId = payload.sub
            if (userId) await loadById(String(userId), token)
          }
        } catch (e) {
          console.error("JWT decode error:", e)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    tryLoad()

    return () => { mounted = false }
  }, [storeUser?.id, setStoreUser])

  const initials = (u: any) => {
    if (!u) return "?"
    const f = u.first_name || u.name || ""
    const l = u.last_name || ""
    const res = (f.slice(0, 1) + l.slice(0, 1)).toUpperCase()
    return res || u.email?.slice(0, 1).toUpperCase() || "?"
  }

  if (loading && !user) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center">
        <div className="animate-pulse text-muted-foreground font-medium">Загрузка профиля...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
            <CardDescription>Вы не вошли в систему или сессия истекла.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">Войти в аккаунт</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pt-0 sm:p-6 space-y-6">
      <Card className="overflow-hidden pt-0">
        <CardHeader className="flex flex-col items-start gap-6 py-8 bg-muted/30">
          <div className="text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight">
                {user.first_name} {user.last_name}
              </h2>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-bold text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 shadow-sm">
                <Star className="h-4 w-4 fill-current" />
                <span>{user.elo_rating ?? 0} ELO</span>
              </div>
              {user.is_blocked && (
                <div className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-sm font-bold border border-destructive/20 uppercase tracking-tighter">
                  <Slash className="h-4 w-4" /> Banned
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-muted-foreground">
              <div className="flex items-center justify-center sm:justify-start gap-2 group cursor-pointer">
                <Mail className="h-4 w-4 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Hash className="h-4 w-4" />
                <span className="text-xs font-mono opacity-60">ID: {user.id}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-8 p-6 sm:p-8 sm:py-4">
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="grid gap-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/80">Имя</Label>
                <div className="text-lg font-semibold border-b pb-2">{user.first_name || '—'}</div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/80">Фамилия</Label>
                <div className="text-lg font-semibold border-b pb-2">{user.last_name || '—'}</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/80">Электронная почта</Label>
                <div className="text-lg font-semibold border-b pb-2">{user.email || '—'}</div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/80">Текущий рейтинг</Label>
                <div className="text-lg font-semibold border-b pb-2">{user.elo_rating ?? 0} очков</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
