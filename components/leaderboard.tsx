"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Crown, User } from "lucide-react"
import { getLeaderboardApiPvpRatingLeaderboardGet } from "@/lib/client"

type LeaderboardItem = {
  rank: number
  user_id: string
  email: string
  rating: number
  name: string
}

function initials(name?: string) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function Leaderboard() {
  const [items, setItems] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const resp: unknown = await getLeaderboardApiPvpRatingLeaderboardGet()
        let data: unknown = []
        if (resp && typeof resp === "object" && "data" in (resp as Record<string, unknown>)) {
          data = (resp as Record<string, unknown>).data
        } else {
          data = resp
        }
        if (mounted) setItems(Array.isArray(data) ? data : [])
      } catch (e) {
         
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col divide-y">
          {loading && <div className="py-4 text-sm text-muted-foreground">Загрузка...</div>}
          {!loading && items.length === 0 && (
            <div className="py-4 text-sm text-muted-foreground">Нет данных</div>
          )}

          {items.map((it) => (
            <div key={it.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="text-sm font-semibold text-muted-foreground mr-2">#{it.rank}</div>
                <div className="relative">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-linear-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                    {initials(it.name)}
                  </div>
                  {it.rank <= 3 && (
                    <div className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 shadow-sm">
                      <Crown className={`h-4 w-4 ${it.rank === 1 ? 'text-amber-400' : it.rank === 2 ? 'text-slate-400' : 'text-orange-400'}`} />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                          <div className="flex items-center gap-2 pl-2 min-w-0">
                            <div className="min-w-0">
                              <div className="font-medium text-sm sm:text-base truncate">{it.name || it.email}</div>
                              <div className="text-xs text-muted-foreground max-w-[120px] sm:max-w-[220px] truncate">{it.email}</div>
                            </div>
                          </div>
                </div>
              </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <div className="rounded-md bg-muted/60 px-3 py-1 font-medium">{it.rating}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
