"use client"

import React, { useEffect, useRef, useState } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Play, X, Loader2, Zap, MessageSquare, Check, XCircle } from "lucide-react"
import { getTokenFromCookie } from "@/lib/auth"
import useUserStore from "@/lib/store/userStore"

type PvPTask = {
  id: string
  title?: string
  task_text?: string
}

export default function PvpPage() {
  const token = getTokenFromCookie()
  const user = useUserStore((s) => s.user)

  const wsRef = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState<"idle" | "queued" | "in_match">("idle")
  const [queueMessage, setQueueMessage] = useState<string | null>(null)
  const [queueSize, setQueueSize] = useState<number | null>(null)
  const [opponentRating, setOpponentRating] = useState<number | null>(null)
  const [task, setTask] = useState<PvPTask | null>(null)
  const [answer, setAnswer] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [matchResult, setMatchResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (wsRef.current) {
        try { wsRef.current.close() } catch {}
        wsRef.current = null
      }
    }
  }, [])

  const connect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return
    console.log(window.location.protocol)
    const envWs = (process.env.NEXT_PUBLIC_WS_HOST && process.env.NEXT_PUBLIC_WS_HOST.length > 0)
      ? process.env.NEXT_PUBLIC_WS_HOST
      : null
    const protoEnv = (process.env.NEXT_PUBLIC_WS_PROTO && process.env.NEXT_PUBLIC_WS_PROTO.length > 0)
      ? process.env.NEXT_PUBLIC_WS_PROTO
      : null

    let url: string
    if (envWs) {
      // env may contain full URL (wss://host) or just host
      if (envWs.startsWith('ws://') || envWs.startsWith('wss://')) {
        url = envWs.endsWith('/') ? `${envWs}api/pvp/` : `${envWs}/api/pvp/`
      } else {
        const proto = protoEnv ?? (window.location.protocol === 'https:' ? 'wss' : 'ws')
        url = `${proto}://${envWs}/api/pvp/`
      }
    } else {
      const proto = protoEnv ?? (window.location.protocol === 'https:' ? 'wss' : 'ws')
      const host = window.location.host
      url = `${proto}://${host}/api/pvp/`
    }

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setQueueMessage('Соединение установлено')
      // send auth
      ws.send(JSON.stringify({ type: 'auth', token }))
    }

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        handleMessage(msg)
      } catch (e) {
        console.error('Invalid WS message', e)
      }
    }

    ws.onclose = () => {
      setQueueMessage('Соединение закрыто')
      setStatus('idle')
      setTask(null)
    }

    ws.onerror = (e) => {
      console.error('ws error', e)
    }
  }

  const handleMessage = (msg: any) => {
    const t = msg.type
    switch (t) {
      case 'queued':
        setStatus('queued')
        setQueueMessage(msg.message || 'В очереди')
        if (msg.queue_size != null) setQueueSize(msg.queue_size)
        break
      case 'canceled':
        setStatus('idle')
        setQueueMessage(msg.message || null)
        setQueueSize(null)
        break
      case 'task':
        setStatus('in_match')
        setTask(msg.task || null)
        setMatchResult(null)
        setAnswer('')
        break
      case 'answer_received':
        // show small confirmation
        setQueueMessage(msg.message || 'Ответ принят')
        break
      case 'match_result':
      case 'finished':
        setMatchResult(msg)
        setStatus('idle')
        break
      case 'error':
        setQueueMessage(msg.message || 'Ошибка')
        break
      default:
        // generic update
        if (msg.state) {
          // possible broadcast state
        }
        break
    }
  }

  const joinQueue = () => {
    setLoading(true)
    connect()
    // after connect, server will place to queue on auth
    // set small delay to clear loader
    setTimeout(() => setLoading(false), 600)
  }

  const cancelQueue = () => {
    try {
      wsRef.current?.send(JSON.stringify({ type: 'cancel' }))
    } catch (e) { console.error(e) }
    setStatus('idle')
    setQueueMessage(null)
  }

  const submitAnswer = async () => {
    if (!task) return
    setSubmitting(true)
    const submission_id = crypto.randomUUID?.() || Math.random().toString(36).slice(2)
    try {
      wsRef.current?.send(JSON.stringify({ type: 'answer', submission_id, answer }))
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            PvP Соревнования
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">Статус:</div>
              <div className="font-medium">{status}</div>
              {queueSize != null && <div className="text-sm text-muted-foreground">— В очереди: {queueSize}</div>}
            </div>

            <div className="flex items-center gap-2">
              {status === 'idle' && (
                <Button onClick={joinQueue}>
                  <Play className="mr-2 h-4 w-4" />
                  Вступить в очередь
                </Button>
              )}
              {status === 'queued' && (
                <Button variant="destructive" onClick={cancelQueue}>
                  <X className="mr-2 h-4 w-4" />
                  Отмена
                </Button>
              )}
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </div>
          </div>

          {queueMessage && (
            <div className="text-sm text-muted-foreground">{queueMessage}</div>
          )}

          {status === 'in_match' && task && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div className="font-semibold">{task.title || 'Задача PvP'}</div>
              </div>
              <div className="prose max-w-full whitespace-pre-wrap">{task.task_text}</div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                <div className="sm:col-span-2">
                  <Label>Ответ</Label>
                  <Input value={answer} onChange={(e) => setAnswer((e.target as HTMLInputElement).value)} placeholder="Введите ответ" />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={submitAnswer} disabled={submitting || !answer}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Отправить
                  </Button>
                </div>
              </div>
            </div>
          )}

          {matchResult && (
            <div className="p-4 rounded-md bg-muted/40">
              <div className="flex items-center gap-3">
                {matchResult.outcome === 'draw' ? (
                  <div className="text-sm font-medium">Ничья</div>
                ) : matchResult.outcome?.includes('win') ? (
                  <div className="flex items-center gap-2 text-green-600"><Check /> Победа</div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600"><XCircle /> Проигрыш</div>
                )}
                <div className="text-sm text-muted-foreground">Результат матча показан выше</div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
