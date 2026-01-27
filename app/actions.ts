"use server";

import { checkTaskApiTasksTaskIdCheckPost } from "@/lib/client";

interface CheckAnswerResult {
    correct: boolean;
    correct_answer: string;
}

export async function checkAnswer(
    answer: string,
    taskId: string,
): Promise<CheckAnswerResult> {
    // Простая валидация на клиенте
    if (!taskId) {
        return { correct: false, correct_answer: "Отсутствует идентификатор задания" };
    }

    if (!answer || !answer.toString().trim()) {
        return { correct: false, correct_answer: "Вы не ввели ответ" };
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
        const data = (await checkTaskApiTasksTaskIdCheckPost({
            path: { task_id: taskId },
            body: { answer: answer },
        })).data as unknown;

        console.log(data)

        if (typeof data === 'object' && data !== null) {
            const d = data as any;
            if (typeof d.correct === 'boolean' && typeof d.correct_answer === 'string') {
                return { correct: d.correct, correct_answer: d.correct_answer };
            }
            return { correct: false, correct_answer: JSON.stringify(d) };
        }

        return { correct: false, correct_answer: 'Неверный формат ответа от сервера' };
    } catch (err) {
        console.error('checkAnswer error:', err);
        return { correct: false, correct_answer: parseErrorMessage(err) };
    }
}
