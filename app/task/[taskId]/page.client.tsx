"use client";

import { Send, Plus, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TaskSchema } from "@/lib/client";
import { Loader2, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation'
import { checkAnswer, requestHint } from "@/app/actions";
import useUserStore from "@/lib/store/userStore";

export default function TaskPageClient({ task }: { task: TaskSchema | null }) {
    const [trainingList, setTrainingList] = useState<TaskSchema[] | null>(null)
    const [trainingProgress, setTrainingProgress] = useState<Record<string, 'correct' | 'wrong' | 'none'>>({})
    const [answer, setAnswer] = useState<string>("");
    const [hint, setHint] = useState<string | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [lastMessage, setLastMessage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false);
    const [loadingHint, setLoadingHint] = useState(false);
    useEffect(() => {
        try {
            const raw = localStorage.getItem('trainingList')
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed)) setTrainingList(parsed)
            }
            const rawProg = localStorage.getItem('trainingProgress')
            if (rawProg) {
                const parsed = JSON.parse(rawProg)
                if (parsed && typeof parsed === 'object') setTrainingProgress(parsed)
            }
        } catch (e) {
            // ignore
        }
    }, [task?.id])
    const token = useUserStore((s) => s.token);
    const router = useRouter()

    async function handleCheckAnswer() {
        setLoading(true);
        setCorrectAnswer(null);
        setIsCorrect(null);
        try {
                const result = await checkAnswer(answer, task ? task.id : "", token ?? null);
                const correct = Boolean(result?.correct)
                setIsCorrect(correct)
                setLastMessage(result?.message ?? null)
                // сервер возвращает поле `message`, а не `answer` в CheckAnswerResult;
                // корректный ответ сейчас не доступен отдельно, поэтому не пытаемся читать `result.answer`

                // update training progress for current task
                try {
                    const id = task?.id;
                    if (id) {
                        const idStr = String(id)
                        const next = { ...trainingProgress }
                        next[idStr] = correct ? 'correct' : 'wrong'
                        setTrainingProgress(next)
                        localStorage.setItem('trainingProgress', JSON.stringify(next))
                    }
                } catch (e) {
                    // ignore
                }
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
            if (res.hint) setHint(res.hint);
            else setHint(res.error ?? 'Нет подсказки');
        } finally {
            setLoadingHint(false);
        }
    }

    if (!task) {
        return <div>Задание не найдено</div>;
    }

    return (
        <div className="flex justify-start flex-col h-full gap-4 px-4 sm:px-10">
            <nav
                className="flex items-center gap-3 px-3 pt-2 bg-accent rounded-xl overflow-x-scroll shadow-xl"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#00000050 transparent",
                }}
            >
                {trainingList && trainingList.length > 0 ? (
                    trainingList.map((t, i) => {
                        const id = t.id;
                        const idStr = id ? String(id) : undefined
                        const status = idStr ? trainingProgress[idStr] : undefined
                        const isCurrent = String(task?.id) === idStr
                        let cls = ''
                        if (status === 'correct') cls = 'bg-green-50 text-green-800 border border-green-100'
                        if (status === 'wrong') cls = 'bg-red-50 text-red-800 border border-red-100'
                        return (
                            <Button key={idStr ?? i} className={cls} variant={isCurrent ? 'default' : 'ghost'} size={'sm'} onClick={() => router.push(`/task/${idStr}`)}>{i + 1}</Button>
                        )
                    })
                ) : (
                    <>
                        <Button className="size-9">1</Button>
                        <Button className="size-9">
                            <Plus className="size-4" />
                        </Button>
                    </>
                )}
            </nav>
                <div className="flex flex-col content-between flex-1 pt-2 py-10 w-full">
                <div className="flex flex-col flex-1 gap-3">
                    <span className="opacity-50">
                        {task.subject} - {task.theme}
                    </span>
                    <header className="text-3xl font-medium">
                        {task.title}
                    </header>
                    <div className="mt-5 w-full md:w-2/3 text-justify">
                        {task.task_text}
                    </div>
                </div>
                <div className="flex gap-3 sm:gap-5 items-center justify-start max-w-full md:max-w-1/2 flex-wrap">
                    {isCorrect !== null && (
                        <div className={`w-full p-3 rounded-md flex items-center gap-3 text-sm ${isCorrect ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                            {isCorrect ? (
                                <Check className="h-5 w-5 text-green-600" />
                            ) : (
                                <X className="h-5 w-5 text-red-600" />
                            )}
                            <div className="break-words">
                                {isCorrect ? (correctAnswer ?? 'Правильно') : (lastMessage ?? 'Неверно')}
                            </div>
                        </div>
                    )}
                    {hint && (
                        <div className="w-full p-3 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-100 text-sm">
                            <div className="font-medium mb-1">Подсказка</div>
                            <div className="break-words">{hint}</div>
                        </div>
                    )}
                    <div className="w-full pt-3 text-sm">
                        Введите свой ответ в поле ниже:
                    </div>

                    <div className="w-full flex items-stretch gap-3 sm:gap-5">
                        <Input
                            placeholder="Ваш ответ"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <Button
                                className="flex gap-3 items-center"
                                onClick={handleCheckAnswer}
                                disabled={loading}
                                aria-busy={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Проверка...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Отправить</span>
                                        <Send />
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleHint}
                                disabled={loadingHint}
                                className="flex gap-2 items-center"
                            >
                                {loadingHint ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Lightbulb className="h-4 w-4" />
                                        <span>Подсказка</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
