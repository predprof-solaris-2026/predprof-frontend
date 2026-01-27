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
    // Простая валидация на клиенте
    if (!taskId) {
        return { correct: false, message: "Отсутствует идентификатор задания" };
    }

    if (!answer || !answer.toString().trim()) {
        return { correct: false, message: "Вы не ввели ответ" };
    }

    const parseErrorMessage = (err: unknown) => {
        try {
            if (!err) return "Произошла ошибка при проверке ответа";

            // Сервер может вернуть объект с detail (валидация FastAPI)
            if (typeof err === 'object' && err !== null) {
                const e = err as any;
                if (Array.isArray(e.detail) && e.detail.length > 0) {
                    const first = e.detail[0];
                    if (first?.msg) return String(first.msg);
                    if (first?.message) return String(first.message);
                }
                if (e?.message) return String(e.message);
                if (e?.detail) return String(e.detail);
            }

            return String(err);
        } catch (e) {
            return "Произошла ошибка при проверке ответа";
        }
    };

    try {
        const cookieStore = cookies();
        const token = tokenFromClient ?? cookieStore.get('token')?.value ?? null;

        const res = await checkAnswerApiTrainingTaskTaskIdCheckPost({
            path: { task_id: taskId },
            body: { answer: answer },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const data = res.data as unknown;

        // Сервер возвращает true/false (boolean) — корректен ли ответ
        if (typeof data === 'boolean') {
            return { correct: data };
        }

        // Если пришёл объект с полем correct
        if (typeof data === 'object' && data !== null) {
            const d = data as any;
            if (typeof d === 'boolean') return { correct: d };
            if (typeof d.correct === 'boolean') return { correct: d.correct };
            return { correct: false, message: JSON.stringify(d) };
        }

        return { correct: false, message: 'Неверный формат ответа от сервера' };
    } catch (err) {
        console.error('checkAnswer error:', err);
        return { correct: false, message: parseErrorMessage(err) };
    }
}

export async function requestHint(taskId: string, tokenFromClient?: string | null): Promise<{ hint?: string; error?: string }>{
    if (!taskId) return { error: 'Отсутствует идентификатор задания' };

    try {
        const cookieStore = cookies();
        const token = tokenFromClient ?? cookieStore.get('token')?.value ?? null;

        const res = await getTaskHintApiTrainingTaskTaskIdHintGet({ path: { task_id: taskId }, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const data = res.data as unknown;

        if (typeof data === 'object' && data !== null) return { hint: (data as any).hint };
        return { error: 'Пустая подсказка' };
    } catch (err) {
        console.error('requestHint error:', err);
        return { error: 'Ошибка при получении подсказки' };
    }
}
