"use client";

import { Send, Lightbulb, Loader2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TaskSchema, Theme as GenTheme, Difficulty as GenDifficulty } from "@/lib/client";
import { generateTaskViaGigachatApiTasksGeneratePost } from '@/lib/client';
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import TaskNav from "@/components/task-nav";
import { useRouter } from 'next/navigation';
import { checkAnswer, requestHint } from "@/app/actions";
import useUserStore from "@/lib/store/userStore";

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

export default function TaskPageClient({ task }: { task: TaskSchema | null }) {
    const [trainingList, setTrainingList] = useState<TaskSchema[] | null>(null);
    const [trainingProgress, setTrainingProgress] = useState<Record<string, 'correct' | 'wrong' | 'none'>>({});
    const [answer, setAnswer] = useState<string>("");
    const [hint, setHint] = useState<string | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [lastMessage, setLastMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingHint, setLoadingHint] = useState(false);
    const [loadingGenerate, setLoadingGenerate] = useState(false);

    const navRef = useRef<HTMLDivElement | null>(null);
    const token = useUserStore((s) => s.token);
    const router = useRouter();

    useEffect(() => {
        if (navRef.current) {
            navRef.current.scrollTo({
                left: navRef.current.scrollWidth,
                behavior: "smooth",
            });
        }
    }, [trainingList?.length]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("trainingList");
            let list: TaskSchema[] = [];
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) list = parsed as TaskSchema[];
            }

            if (task) {
                const idStr = String(task.id);
                const existsIndex = list.findIndex((t) => String(t.id) === idStr);
                const nextList = [...list];
                if (existsIndex !== -1) {
                    nextList[existsIndex] = task;
                } else {
                    nextList.push(task);
                }
                setTrainingList(nextList);
                localStorage.setItem("trainingList", JSON.stringify(nextList));
            } else if (list.length > 0) {
                setTrainingList(list);
            }

            const rawProg = localStorage.getItem("trainingProgress");
            if (rawProg) {
                const parsed = JSON.parse(rawProg);
                if (parsed && typeof parsed === "object") setTrainingProgress(parsed);
            }
        } catch (e) {
            console.error("Error init task list", e);
        }
    }, [task]);

    async function handleCheckAnswer() {
        setLoading(true);
        setCorrectAnswer(null);
        setIsCorrect(null);
        try {
            const result = await checkAnswer(answer, task ? task.id : "", token ?? null);
            const _resCheck = result as unknown as Record<string, unknown>;
            const msg = result?.message ?? "";
            const unauthRe = /(not authenticated|not authorized|unauth|401|не авториз|неавториз|no autorizado)/i;
            if ((_resCheck && "error" in _resCheck) || (typeof msg === "string" && unauthRe.test(msg))) {
                toast.error("Вы не авторизованы");
                return;
            }
            const correct = Boolean(result?.correct);
            setIsCorrect(correct);
            setLastMessage(result?.message ?? null);

            try {
                const id = task?.id;
                if (id) {
                    const idStr = String(id);
                    const next = { ...trainingProgress };
                    next[idStr] = correct ? 'correct' : 'wrong';
                    setTrainingProgress(next);
                    localStorage.setItem('trainingProgress', JSON.stringify(next));
                }
            } catch {}
        } finally {
            setLoading(false);
        }
    }

    async function handleHint() {
        if (!task) return;
        setLoadingHint(true);
        setHint(null);
        try {
            const res = await requestHint(task.id, token ?? null);
            const _hintCheck = res as unknown as Record<string, unknown>;
            if (_hintCheck && "error" in _hintCheck) {
                toast.error("Вы не авторизованы");
                return;
            }
            if (res.hint) setHint(res.hint);
            else setHint(res.error ?? 'Нет подсказки');
        } finally {
            setLoadingHint(false);
        }
    }

    async function handleGenerate() {
        setLoadingGenerate(true);
        try {
            const body = {
                subject: String(task?.subject ?? "Математика"),
                theme: (task?.theme ?? "математика") as GenTheme,
                difficulty: (task?.difficulty ?? "лёгкий") as GenDifficulty,
            };
            const resp: unknown = await generateTaskViaGigachatApiTasksGeneratePost({
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body,
            });
            const _genCheck = resp as unknown as Record<string, unknown>;
            if (_genCheck && "error" in _genCheck) {
                toast.error("Вы не авторизованы");
                return;
            }
            const data: unknown = (resp as Record<string, unknown>)?.data ?? resp;
            const newTask: TaskSchema = data as TaskSchema;

            if (newTask && newTask.id) {
                setTrainingList((prev) => {
                    const next = prev ? [...prev, newTask] : [task as TaskSchema, newTask].filter(Boolean);
                    try { localStorage.setItem('trainingList', JSON.stringify(next)); } catch {}
                    return next;
                });
                setHint(null);
                setCorrectAnswer(null);
                setIsCorrect(null);
                setLastMessage(null);
                setAnswer("");
                try { router.push(`/task/${newTask.id}`); } catch {}
            }
        } catch (err) {
            console.error('Task generation failed', err);
        } finally {
            setLoadingGenerate(false);
        }
    }

    if (!task) {
        return <div>Задание не найдено</div>;
    }

    return (
        <div className="flex justify-start flex-col h-full gap-4 px-4 sm:px-10">
            <div ref={navRef}>
              <TaskNav
                trainingList={trainingList}
                trainingProgress={trainingProgress}
                currentTaskId={task?.id ? String(task.id) : null}
                onNavigate={(id: string) => { try { router.push(`/task/${id}`) } catch {} }}
                onGenerate={handleGenerate}
                onResetProgress={() => {
                  if (!confirm('Сбросить прогресс? Все задания и прогресс будут очищены, текущая задача останется первой.')) return
                  try {
                    const curId = task?.id ? String(task.id) : null
                    const newList = curId ? [task as TaskSchema] : []
                    localStorage.setItem('trainingList', JSON.stringify(newList))
                    localStorage.removeItem('trainingProgress')
                    setTrainingList(newList)
                    setTrainingProgress({})
                    toast.success('Прогресс сброшен')
                  } catch (e) {
                    console.error('Reset progress failed', e)
                    toast.error('Не удалось сбросить прогресс')
                  }
                }}
                loadingGenerate={loadingGenerate}
              />
            </div>

            <div className="flex flex-col content-between flex-1 pt-2 py-10 w-full">
                <div className="flex flex-col flex-1 gap-3">
                    <span className="opacity-50 text-sm font-medium uppercase tracking-wider">
                        {task.subject} — {task.theme}
                    </span>
                    <header className="text-3xl font-bold">
                        {task.title}
                    </header>
                    <div className="mt-5 w-full md:w-2/3 text-md text-justify">
                        {task.task_text}
                    </div>
                </div>

                <div className="flex gap-4 flex-col mt-8">
                    {isCorrect !== null && (
                        <div className={cn(
                            "w-full md:w-2/3 p-4 rounded-lg flex items-center gap-3 text-base font-medium border animate-in fade-in slide-in-from-top-2",
                            isCorrect 
                                ? "bg-green-50 text-green-900 border-green-200" 
                                : "bg-red-50 text-red-900 border-red-200"
                        )}>
                            {isCorrect ? (
                                <div className="p-1 bg-green-200 rounded-full"><Check className="h-5 w-5 text-green-700" /></div>
                            ) : (
                                <div className="p-1 bg-red-200 rounded-full"><X className="h-5 w-5 text-red-700" /></div>
                            )}
                            <div className="break-words">
                                {isCorrect ? (correctAnswer ?? 'Правильно!') : (lastMessage ?? 'Ответ неверный, попробуйте еще раз.')}
                            </div>
                        </div>
                    )}

                    {hint && (
                        <div className="w-full md:w-2/3 p-4 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-sm animate-in fade-in">
                            <div className="font-bold flex items-center gap-2 mb-1">
                                <Lightbulb className="h-4 w-4" />
                                Подсказка
                            </div>
                            <div className="break-words text-amber-800">{hint}</div>
                        </div>
                    )}

                    <div className="w-full md:w-2/3 pt-4">
                        <div className="text-sm font-medium text-gray-500 mb-2">
                            Введите ваш ответ:
                        </div>
                        <div className="flex items-stretch gap-3 flex-col sm:flex-row">
                            <Input
                                placeholder="Ваш ответ..."
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="text-lg h-12"
                                onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
                            />
                            <div className="flex gap-2 shrink-0">
                                <Button
                                    className="h-12 px-6 text-base gap-2"
                                    onClick={handleCheckAnswer}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    <span>Ответить</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleHint}
                                    disabled={loadingHint}
                                    className="h-12 w-12 p-0 sm:w-auto sm:px-4 text-gray-500 border-gray-300"
                                    title="Взять подсказку"
                                >
                                    {loadingHint ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Lightbulb className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}