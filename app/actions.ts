"use server";

import { checkAnswerApiTrainingTaskTaskIdCheckPost, getTaskHintApiTrainingTaskTaskIdHintGet } from "@/lib/client";
import { cookies } from 'next/headers';

interface CheckAnswerResult {
    correct: boolean;
    message?: string;
}

export async function checkAnswer(
    answer: string,
    taskId: string,
    tokenFromClient?: string | null,
): Promise<CheckAnswerResult> {
    if (!taskId) {
        return { correct: false, message: "Отсутствует идентификатор задания" };
    }

    if (!answer || !answer.toString().trim()) {
        return { correct: false, message: "Вы не ввели ответ" };
    }

    const parseErrorMessage = (err: unknown) => {
        try {
            if (!err) return "Произошла ошибка при проверке ответа";

            if (typeof err === "object" && err !== null) {
                const rec = err as Record<string, unknown>;
                if (Array.isArray(rec.detail) && rec.detail.length > 0) {
                    const first = rec.detail[0] as Record<string, unknown> | undefined;
                    if (first?.msg) return String(first.msg);
                    if (first?.message) return String(first.message);
                }
                if (rec.message) return String(rec.message);
                if (rec.detail) return String(rec.detail);
            }

            return String(err);
        } catch {
            return "Произошла ошибка при проверке ответа";
        }
    };

    try {
        const cookieStore = await cookies();
        const token = tokenFromClient ?? cookieStore.get('token')?.value ?? null;

        const res = await checkAnswerApiTrainingTaskTaskIdCheckPost({
            path: { task_id: taskId },
            body: { answer: answer },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const data: unknown = (res as Record<string, unknown>)?.data ?? res;

        if (typeof data === "boolean") {
            return { correct: data };
        }

        if (typeof data === "object" && data !== null) {
            const drec = data as Record<string, unknown>;
            if (typeof drec.correct === "boolean") return { correct: Boolean(drec.correct) };
            return { correct: false, message: JSON.stringify(drec) };
        }

        return { correct: false, message: "Неверный формат ответа от сервера" };
    } catch (err) {
        console.error('checkAnswer error:', err);
        return { correct: false, message: parseErrorMessage(err) };
    }
}

export async function requestHint(taskId: string, tokenFromClient?: string | null): Promise<{ hint?: string; error?: string }> {
    if (!taskId) return { error: 'Отсутствует идентификатор задания' };

    try {
        const cookieStore = await cookies();
        const token = tokenFromClient ?? cookieStore.get('token')?.value ?? null;

        const res = await getTaskHintApiTrainingTaskTaskIdHintGet({
            path: { task_id: taskId },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const data: unknown = (res as Record<string, unknown>)?.data ?? res;
        if (typeof data === "object" && data !== null && "hint" in (data as Record<string, unknown>)) {
            return { hint: String((data as Record<string, unknown>).hint ?? "") };
        }
        return { error: "Пустая подсказка" };
    } catch (err) {
        console.error('requestHint error:', err);
        return { error: 'Ошибка при получении подсказки' };
    }
}