"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    Card,
    CardHeader,
    CardContent,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Star,
    Play,
    X,
    Loader2,
    Zap,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Trophy,
    Users,
    Swords,
    Hash,
} from "lucide-react";
import { getTokenFromCookie, clearTokenCookie } from "@/lib/auth";
import useUserStore from "@/lib/store/userStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Leaderboard from "@/components/leaderboard";
import { cn } from "@/lib/utils";
import { getUserByIdApiUserUserIdGet } from "@/lib/client";

type PvPTask = {
    id: string;
    title?: string;
    task_text?: string;
};

export default function PvpPage() {
    const token = getTokenFromCookie();
    const user = useUserStore((s) => s.user);

    const wsRef = useRef<WebSocket | null>(null);
    const lastTaskIdRef = useRef<string | null>(null);
    const [status, setStatus] = useState<"idle" | "queued" | "in_match">(
        "idle",
    );
    const [queueMessage, setQueueMessage] = useState<string | null>(null);
    const [queueSize, setQueueSize] = useState<number | null>(null);
    const [task, setTask] = useState<PvPTask | null>(null);
    const [round, setRound] = useState<number>(0);
    const [answer, setAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [matchResult, setMatchResult] = useState<Record<
        string,
        unknown
    > | null>(null);
    const [lastAnswerReceived, setLastAnswerReceived] = useState<Record<
        string,
        unknown
    > | null>(null);
    const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
    const [waitingForNext, setWaitingForNext] = useState(false);
    const answerWatchdogRef = useRef<number | null>(null);
    const lastSentAnswerRef = useRef<string | null>(null);
    const lastSentTaskIdRef = useRef<string | null>(null);
    const autoResentRef = useRef<boolean>(false);
    const answerRef = useRef<string>("");
    const closeWebSocket = (sendDisconnect = true) => {
        try {
            if (sendDisconnect) {
                try {
                    wsRef.current?.send(JSON.stringify({ type: "disconnect" }));
                } catch (e) {}
            }
            try {
                wsRef.current?.close();
            } catch (e) {}
        } catch (e) {
            console.error("Error while closing websocket", e);
        } finally {
            try {
                wsRef.current = null;
            } catch (e) {}
        }
    };
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        return () => {
            try {
                closeWebSocket(false);
            } catch (e) {}
            clearAnswerWatchdog();
        };
    }, []);

    const connect = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)
            return;

        const envWs = process.env.NEXT_PUBLIC_WS_HOST || null;
        const protoEnv = process.env.NEXT_PUBLIC_WS_PROTO || null;

        let url: string;
        if (envWs) {
            if (envWs.startsWith("ws://") || envWs.startsWith("wss://")) {
                url = envWs.endsWith("/")
                    ? `${envWs}api/pvp/`
                    : `${envWs}/api/pvp/`;
            } else {
                const proto =
                    protoEnv ??
                    (window.location.protocol === "https:" ? "wss" : "ws");
                url = `${proto}://${envWs}/api/pvp/`;
            }
        } else {
            const proto =
                protoEnv ??
                (window.location.protocol === "https:" ? "wss" : "ws");
            url = `${proto}://${window.location.host}/api/pvp/`;
        }

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setQueueMessage("Соединение установлено");
            ws.send(JSON.stringify({ type: "bearer", token }));
        };

        ws.onerror = () => {
            toast.error("Ошибка соединения с сервером");
        };

        ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                handleMessage(msg);
            } catch (e) {
                console.error("Invalid WS message", e);
            }
        };

        ws.onclose = () => {
            setQueueMessage("Соединение разорвано");
            setStatus("idle");
            setTask(null);
            try {
                wsRef.current = null;
            } catch {}
        };
    };

    const fetchUserName = async (userId: string) => {
        if (!userId) return;
        if (playerNames[userId]) return;
        try {
            const resp = await getUserByIdApiUserUserIdGet({
                path: { user_id: userId },
            });
            const data = resp?.data;
            const name =
                (data?.first_name
                    ? `${data.first_name} ${data.last_name ?? ""}`.trim()
                    : data?.email) || userId;
            setPlayerNames((s) => ({ ...s, [userId]: name }));
        } catch (e) {
            console.error("Failed to fetch user via SDK", e);
        }
    };

    const startAnswerWatchdog = () => {
        clearAnswerWatchdog();
        setWaitingForNext(true);

        answerWatchdogRef.current = window.setTimeout(() => {
            if (
                lastSentAnswerRef.current &&
                !autoResentRef.current &&
                wsRef.current &&
                wsRef.current.readyState === WebSocket.OPEN
            ) {
                try {
                    wsRef.current.send(
                        JSON.stringify({
                            type: "answer",
                            answer: lastSentAnswerRef.current,
                        }),
                    );
                    autoResentRef.current = true;
                    console.warn(
                        "Auto-resending last answer due to watchdog timeout",
                    );

                    setWaitingForNext(true);
                    answerWatchdogRef.current = window.setTimeout(() => {
                        setWaitingForNext(false);
                        answerWatchdogRef.current = null;
                        console.warn(
                            "Answer watchdog expired — re-enabling UI",
                        );
                    }, 6000);
                    return;
                } catch (e) {
                    console.error("Auto-resend failed", e);
                }
            }

            setWaitingForNext(false);
            answerWatchdogRef.current = null;
            console.warn("Answer watchdog expired — re-enabling UI");
        }, 6000);
    };

    const clearAnswerWatchdog = () => {
        if (answerWatchdogRef.current) {
            clearTimeout(answerWatchdogRef.current);
            answerWatchdogRef.current = null;
        }
        setWaitingForNext(false);
    };

    const handleMessage = (msg: unknown) => {
        const m =
            typeof msg === "object" && msg !== null
                ? (msg as Record<string, unknown>)
                : {};
        const type = String(m.type ?? "");
        switch (type) {
            case "state_update": {
                try {
                    const p1 =
                        (m.p1 as Record<string, unknown> | undefined) ?? {};
                    const p2 =
                        (m.p2 as Record<string, unknown> | undefined) ?? {};
                    const myId = user?.id;
                    const me = (
                        String(p1.user_id ?? "") === myId
                            ? p1
                            : String(p2.user_id ?? "") === myId
                              ? p2
                              : null
                    ) as Record<string, unknown> | null;
                    const opp = me === p1 ? p2 : me === p2 ? p1 : null;
                    if (me && opp) {
                    }
                } catch (e) {
                    console.error("state_update handling failed", e);
                }
                break;
            }
            case "queued": {
                setStatus("queued");
                setQueueMessage(String(m.message ?? "Поиск противника..."));
                if (m.queue_size != null)
                    setQueueSize(Number(m.queue_size as number));
                break;
            }
            case "unauthorized":
            case "error": {
                const errorMsg = String(m.message ?? "Неизвестная ошибка");
                const isAuth =
                    /auth|token|unauthori|не авторизован/i.test(errorMsg) ||
                    type === "unauthorized";
                toast.error(isAuth ? "Вы не авторизованы" : errorMsg);
                if (isAuth) {
                    try {
                        clearTokenCookie();
                    } catch {}
                    try {
                        // @ts-ignore
                        if (typeof useUserStore.getState === "function")
                            useUserStore.getState().clear();
                    } catch {}
                    try {
                        router.push("/login");
                    } catch {}
                }
                try {
                    closeWebSocket();
                } catch (e) {}
                setStatus("idle");
                setTask(null);
                setQueueMessage(null);
                break;
            }
            case "canceled": {
                setStatus("idle");
                setQueueMessage(null);
                setQueueSize(null);
                break;
            }
            case "task": {
                const taskObj =
                    (m.task as Record<string, unknown> | undefined) ?? {};
                const incomingId = String(taskObj.id ?? "");
                if (incomingId && lastTaskIdRef.current === incomingId) {
                    console.debug("Duplicate task ignored", incomingId);
                    break;
                }
                setStatus("in_match");
                setRound((r) => Math.min(4, r + 1));
                const newTask: PvPTask = {
                    id: incomingId || String(taskObj.id ?? ""),
                    title: String(m.title ?? taskObj.title ?? "Боевая задача"),
                    task_text: String(m.task_text ?? taskObj.task_text ?? ""),
                };
                setTask(newTask);
                lastSentAnswerRef.current = null;
                lastSentTaskIdRef.current = null;
                autoResentRef.current = false;
                if (newTask?.id) lastTaskIdRef.current = newTask.id;
                setMatchResult(null);
                setLastAnswerReceived(null);
                setAnswer("");
                clearAnswerWatchdog();
                break;
            }
            case "answer_received": {
                setLastAnswerReceived(m as Record<string, unknown>);
                startAnswerWatchdog();
                break;
            }
            case "match_result": {
                try {
                    const p1id = String(
                        (m.p1 as Record<string, unknown> | undefined)
                            ?.user_id ?? "",
                    );
                    const p2id = String(
                        (m.p2 as Record<string, unknown> | undefined)
                            ?.user_id ?? "",
                    );
                    if (p1id && p2id && p1id === p2id) {
                        console.error("Server paired user with themself", p1id);
                        toast.error(
                            "Сервер подобрал матч с самим собой — попытка отменена",
                        );
                        try {
                            closeWebSocket();
                        } catch {}
                        setStatus("idle");
                        setRound(0);
                        setTask(null);
                        lastTaskIdRef.current = null;
                        clearAnswerWatchdog();
                        break;
                    }
                } catch (e) {
                    console.error(e);
                }
                setMatchResult(m as Record<string, unknown>);
                setStatus("idle");
                setRound(0);
                try {
                    wsRef.current?.send(JSON.stringify({ type: "disconnect" }));
                } catch (e) {
                    console.error(e);
                }
                lastTaskIdRef.current = null;
                try {
                    const p1id = String(
                        (m.p1 as Record<string, unknown> | undefined)
                            ?.user_id ?? "",
                    );
                    const p2id = String(
                        (m.p2 as Record<string, unknown> | undefined)
                            ?.user_id ?? "",
                    );
                    if (p1id) fetchUserName(p1id);
                    if (p2id) fetchUserName(p2id);
                } catch (e) {
                    console.error(e);
                }
                clearAnswerWatchdog();
                lastSentAnswerRef.current = null;
                lastSentTaskIdRef.current = null;
                autoResentRef.current = false;
                try {
                    closeWebSocket();
                } catch (e) {
                    console.error(e);
                }
                break;
            }
            case "finished": {
                try {
                    const p1id = String(
                        (m.p1 as Record<string, unknown> | undefined)
                            ?.user_id ?? "",
                    );
                    const p2id = String(
                        (m.p2 as Record<string, unknown> | undefined)
                            ?.user_id ?? "",
                    );
                    if (p1id && p2id && p1id === p2id) {
                        console.error(
                            "Server finished match with same user",
                            p1id,
                        );
                        toast.error(
                            "Сервер завершил матч с самим собой — попытка отменена",
                        );
                        try {
                            closeWebSocket();
                        } catch {}
                        setStatus("idle");
                        setRound(0);
                        setTask(null);
                        lastTaskIdRef.current = null;
                        clearAnswerWatchdog();
                        break;
                    }
                } catch (e) {
                    console.error(e);
                }
                setMatchResult(m as Record<string, unknown>);
                setStatus("idle");
                setRound(0);
                try {
                    const p1id = String(
                        (m.p1 as Record<string, unknown> | undefined)
                            ?.user_id ?? "",
                    );
                    const p2id = String(
                        (m.p2 as Record<string, unknown> | undefined)
                            ?.user_id ?? "",
                    );
                    if (p1id) fetchUserName(p1id);
                    if (p2id) fetchUserName(p2id);
                } catch (e) {
                    console.error(e);
                }
                clearAnswerWatchdog();
                lastSentAnswerRef.current = null;
                lastSentTaskIdRef.current = null;
                autoResentRef.current = false;
                try {
                    closeWebSocket();
                } catch (e) {
                    console.error(e);
                }
                break;
            }
            default:
                break;
        }
    };

    const joinQueue = () => {
        setLoading(true);

        try {
            if (wsRef.current) {
                if (wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                        JSON.stringify({ type: "bearer", token }),
                    );
                } else if (wsRef.current.readyState === WebSocket.CONNECTING) {
                } else {
                    connect();
                }
            } else {
                connect();
            }
        } catch (e) {
            console.error(e);
            connect();
        }

        setTimeout(() => setLoading(false), 600);
    };

    const cancelQueue = () => {
        try {
            closeWebSocket();
        } catch (e) {
            console.error(e);
        }
        setStatus("idle");
        setQueueMessage(null);
        setQueueSize(null);
        setRound(0);
        setTask(null);
        lastTaskIdRef.current = null;
        setLastAnswerReceived(null);
        clearAnswerWatchdog();
    };

    const submitAnswer = async () => {
        if (!task || !answer) return;
        setSubmitting(true);
        try {
            wsRef.current?.send(JSON.stringify({ type: "answer", answer }));
        } catch (e) {
            console.error(e);
        }
        setSubmitting(false);

        startAnswerWatchdog();
    };

    return (
        <div className="container max-w-6xl mx-auto p-4 md:p-8 md:pt-0 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Swords className="h-8 w-8 text-primary" />
                        PvP Арена
                    </h1>
                    <p className="text-muted-foreground">
                        Сражайтесь с другими игроками в реальном времени
                    </p>
                </div>
            </div>

            <div className="grid gap-8">
                {/* Main Game Card */}
                <Card className="lg:col-span-2 overflow-hidden border-2 shadow-lg pt-0">
                    <CardHeader className="bg-muted/30 border-b pt-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl">
                                    Игровая сессия
                                </CardTitle>
                                <CardDescription>
                                    {status === "idle" &&
                                        "Готовы к новому вызову?"}
                                    {status === "queued" &&
                                        "Ожидайте, подбираем достойного оппонента..."}
                                    {status === "in_match" &&
                                        "Матч в самом разгаре!"}
                                </CardDescription>
                            </div>
                            <Badge
                                variant={
                                    status === "in_match"
                                        ? "default"
                                        : status === "queued"
                                          ? "secondary"
                                          : "outline"
                                }
                                className={cn(
                                    "px-3 py-1 text-sm font-medium",
                                    status === "queued" && "animate-pulse",
                                )}
                            >
                                {status === "idle" && "Начнем?"}
                                {status === "queued" && "В поиске"}
                                {status === "in_match" && "В бою"}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        {status === "idle" && !matchResult && (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                                <button
                                    type="button"
                                    onClick={joinQueue}
                                    disabled={loading}
                                    className={cn(
                                        "h-20 w-20 rounded-full flex items-center justify-center focus:outline-none",
                                        "bg-primary/10",
                                        loading
                                            ? "opacity-80 cursor-wait"
                                            : "hover:scale-105 active:scale-95",
                                    )}
                                    aria-pressed={status !== "idle"}
                                >
                                    {loading ? (
                                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                    ) : (
                                        <Play className="h-10 w-10 text-primary fill-current" />
                                    )}
                                </button>
                                <div className="max-w-xs space-y-2">
                                    <h3 className="font-semibold text-lg">
                                        Начать соревнование
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Система подберет игрока с похожим
                                        рейтингом
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    className="px-8 shadow-md"
                                    onClick={joinQueue}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        <Zap className="mr-2 h-5 w-5 fill-current" />
                                    )}
                                    Найти игру
                                </Button>
                            </div>
                        )}

                        {status === "queued" && (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                                    <div className="relative h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Users className="h-10 w-10 text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">
                                        Ищем соперника...
                                    </h3>
                                </div>
                                <Button variant="outline" onClick={cancelQueue}>
                                    <X className="mr-2 h-4 w-4" /> Отменить
                                    поиск
                                </Button>
                            </div>
                        )}

                        {status === "in_match" && task && (
                            <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                {/* countdown moved to Sonner toast */}
                                <div className="flex items-center justify-between gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    <div className="flex items-center gap-3">
                                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                                        <h3 className="font-bold text-lg">
                                            {task.title || "Боевая задача"}
                                        </h3>
                                    </div>
                                    <Badge className="text-sm">
                                        Раунд {round}
                                    </Badge>
                                </div>

                                <div className="bg-zinc-950 text-zinc-100 p-6 rounded-xl font-mono text-sm leading-relaxed shadow-inner overflow-x-auto whitespace-pre-wrap border border-zinc-800">
                                    {task.task_text}
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <Label
                                        htmlFor="answer"
                                        className="text-base font-semibold"
                                    >
                                        Ваш ответ
                                    </Label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Input
                                            id="answer"
                                            value={answer}
                                            onChange={(e) => {
                                                setAnswer(e.target.value);
                                                answerRef.current =
                                                    e.target.value;
                                            }}
                                            disabled={waitingForNext}
                                            placeholder="Введите решение здесь..."
                                            className="h-12 text-lg"
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                submitAnswer()
                                            }
                                            autoComplete={"off"}
                                        />
                                        <Button
                                            size="lg"
                                            onClick={submitAnswer}
                                            disabled={
                                                submitting ||
                                                !answer ||
                                                waitingForNext
                                            }
                                            className="h-12 sm:w-32 transition-all active:scale-95"
                                        >
                                            {submitting ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <MessageSquare className="mr-2 h-5 w-5" />
                                            )}
                                            ОК
                                        </Button>
                                    </div>
                                    {lastAnswerReceived && (
                                        <div
                                            className={cn(
                                                "mt-2 text-sm p-2 rounded-md",
                                                lastAnswerReceived.counted
                                                    ? "text-green-700 bg-green-50"
                                                    : "text-red-700 bg-red-50",
                                            )}
                                        >
                                            {lastAnswerReceived.counted
                                                ? "Ответ записан, ждем соперника..."
                                                : `Ответ не засчитан — ${lastAnswerReceived.message}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {matchResult && status === "idle" && (
                            <div
                                className={cn(
                                    "p-6 rounded-xl border-2 flex flex-col items-center text-center space-y-4 transition-all animate-in slide-in-from-bottom-4",
                                    String(matchResult.outcome ?? "").includes(
                                        "win",
                                    )
                                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                                        : matchResult.outcome === "draw"
                                          ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                                          : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    {String(matchResult.outcome ?? "").includes(
                                        "win",
                                    ) ? (
                                        <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                                        </div>
                                    ) : matchResult.outcome === "draw" ? (
                                        <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                            <Zap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    ) : (
                                        <div className="h-16 w-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                                            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-2xl font-bold">
                                            {matchResult.outcome === "draw"
                                                ? "Ничья"
                                                : "Матч завершён"}
                                        </h2>
                                        <p className="text-muted-foreground">
                                            Результаты и изменения рейтинга
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {[
                                        matchResult?.p1 as
                                            | Record<string, unknown>
                                            | undefined,
                                        matchResult?.p2 as
                                            | Record<string, unknown>
                                            | undefined,
                                    ].map((p, idx) => {
                                        const userId = String(p?.user_id ?? "");
                                        const isMe =
                                            user?.id && user.id === userId;
                                        const displayName =
                                            playerNames[userId] ??
                                            (p?.first_name
                                                ? `${String(p.first_name)} ${String(p.last_name ?? "")}`.trim()
                                                : userId);
                                        const oldRating =
                                            String(p?.old_rating ?? "") || "—";
                                        const newRating =
                                            String(p?.new_rating ?? "") || "—";
                                        const delta = Number(p?.delta ?? 0);
                                        return (
                                            <div
                                                key={userId || idx}
                                                className={cn(
                                                    "p-4 rounded-lg border",
                                                    isMe
                                                        ? "border-primary/60 bg-primary/5"
                                                        : "border-muted/30 bg-transparent",
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {isMe
                                                                ? "Вы"
                                                                : `Игрок ${idx + 1}`}
                                                        </div>
                                                        <div className="font-medium">
                                                            {displayName}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm">
                                                            Рейтинг
                                                        </div>
                                                        <div className="font-semibold">
                                                            {oldRating} →{" "}
                                                            {newRating}{" "}
                                                            <span
                                                                className={cn(
                                                                    "ml-2",
                                                                    delta > 0
                                                                        ? "text-green-600"
                                                                        : "text-red-600",
                                                                )}
                                                            >
                                                                (
                                                                {delta > 0
                                                                    ? "+"
                                                                    : ""}
                                                                {delta})
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setMatchResult(null)}
                                >
                                    Закрыть результат
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Leaderboard: full width below PvP */}
            </div>

            <div className="w-full">
                <div className="mt-4">
                    <Leaderboard />
                </div>
            </div>
        </div>
    );
}
