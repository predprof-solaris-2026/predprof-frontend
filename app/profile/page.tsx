"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, Hash, Star, Slash } from "lucide-react"
import useUserStore from "@/lib/store/userStore"
import { getUserByIdApiUserUserIdGet, getMyStatsApiStatsMeGet, getUserStatsApiStatsUsersUserIdGet, getMyRatingHistoryApiRatingHistoryMeGet, getWinProbabilityApiRatingProbabilityGet, getRatingProjectionApiRatingProjectionGet } from "@/lib/client"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { getTokenFromCookie } from "@/lib/auth"
import Link from "next/link"

export default function ProfilePage() {
  const storeUser = useUserStore((s) => s.user)
  const setStoreUser = useUserStore((s) => s.setUser)
  const [user, setUser] = useState<any | null>(storeUser || null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any | null>(null)
  const [history, setHistory] = useState<any | null>(null)
  const [oppRating, setOppRating] = useState<number | ''>('')
  const [prob, setProb] = useState<any | null>(null)
  const [projection, setProjection] = useState<any | null>(null)

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

    const loadStats = async (token?: string | null, id?: string) => {
      try {
        const options: any = {}
        if (token) options.headers = { Authorization: `Bearer ${token}` }
        let resp: any
        if (token && (!id || id === String(storeUser?.id))) {
          resp = await getMyStatsApiStatsMeGet(options)
        } else if (id) {
          resp = await getUserStatsApiStatsUsersUserIdGet({ path: { user_id: id } })
        }
        const data = resp?.data || resp
        if (mounted && data) setStats(data)
      } catch (e) {
        console.error('Failed to load stats', e)
      }
    }

    const loadHistory = async (token?: string | null) => {
      if (!token) return
      try {
        const resp: any = await getMyRatingHistoryApiRatingHistoryMeGet({ headers: { Authorization: `Bearer ${token}` } })
        const data = resp?.data || resp
        if (mounted) setHistory(data)
      } catch (e) {
        console.error('Failed to load history', e)
      }
    }

    tryLoad()
    // load stats and history
    const _token = getTokenFromCookie()
    if (storeUser?.id) loadStats(_token, String(storeUser.id))
    else if (_token) loadStats(_token)
    if (_token) loadHistory(_token)

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

          {stats && (
            <div className="grid gap-6">
              <h3 className="text-lg font-semibold">Статистика</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border rounded">
                  <div className="text-sm text-muted-foreground">PVP</div>
                  <div className="text-xl font-bold">{stats.pvp?.wins ?? 0} / {stats.pvp?.matches ?? 0} побед</div>
                  <div className="text-sm text-muted-foreground">Побед: {stats.pvp?.wins ?? 0} • Поражений: {stats.pvp?.losses ?? 0} • Ничьих: {stats.pvp?.draws ?? 0}</div>
                </div>

                <div className="p-4 border rounded">
                  <div className="text-sm text-muted-foreground">Тренировка</div>
                  <div className="text-xl font-bold">{stats.training?.correct ?? 0} / {stats.training?.attempts ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Точность: {stats.training?.accuracy_pct ?? 0}%</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6">
            {prob && (
              <div className="p-3 border rounded">
                <div>Мой рейтинг: {prob.my_rating}</div>
                <div>Рейтинг соперника: {prob.opponent_rating}</div>
                <div>Ожидаемый счёт: {(prob.expected_score * 100).toFixed(1)}%</div>
              </div>
            )}
            {projection && (
              <div className="p-3 border rounded">
                <div>Дельты при исходе: Win {projection.deltas.win} • Draw {projection.deltas.draw} • Loss {projection.deltas.loss}</div>
              </div>
            )}
          </div>

          {/* Rating line chart based on history */}
          {history && history.items && history.items.length > 0 && (
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">Динамика рейтинга</h3>
              <div className="w-full h-64">
                <ChartContainer
                  id="rating-history"
                  config={{ rating: { label: 'Рейтинг', color: '#06b6d4' } }}
                  className="w-full h-full"
                >
                  {
                    // prepare chart data: oldest -> newest
                    (() => {
                      const items = [...history.items].slice().reverse()
                      const data = items.map((it: any, idx: number) => ({
                        date: `#${idx + 1}`,
                        rating: (it.my_rating_before ?? 0) + (it.my_rating_delta ?? 0),
                      }))

                      return (
                        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 6 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="rating" stroke="var(--color-rating)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      )
                    })()
                  }
                </ChartContainer>
              </div>
            </div>
          )}
          {history && history.items && (
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">История матчей</h3>
              <div className="space-y-2">
                {history.items.slice(0,10).map((it: any) => (
                  <div key={it.match_id} className="p-3 border rounded flex items-center justify-between">
                    <div className="text-sm">Против: {it.opponent_id ?? '—'}</div>
                    <div className="text-sm">Рейтинг до: {it.my_rating_before} • Δ {it.my_rating_delta}</div>
                    <div className="text-sm text-muted-foreground">{it.outcome || it.state}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
