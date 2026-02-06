"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTasksApiTrainingGet } from "@/lib/client";
import type { PersonalRecommendation, TaskSchema } from "@/lib/client";
import { useToast } from "@/components/ui/toast";
import { CalendarIcon } from "lucide-react";

interface AdaptivePlanBlockProps {
    recommendations: PersonalRecommendation[];
}

export function AdaptivePlanBlock({ recommendations }: AdaptivePlanBlockProps) {
    const router = useRouter();
    const { toast } = useToast();

    const safeSetLocalStorage = (key: string, value: unknown) => {
        try {
            if (
                typeof window !== "undefined" &&
                typeof localStorage !== "undefined"
            ) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch {
            console.warn(`localStorage set failed for ${key}`);
        }
    };

    const startTrainingWithPlan = async (rec: PersonalRecommendation) => {
        try {
            const q: Record<string, unknown> = {
                theme: rec.theme,
                difficulty: rec.difficulty,
                limit: 10,
                skip: 0,
            };

            const resp: unknown = await getTasksApiTrainingGet({ query: q });
            let data: unknown;
            if (
                resp &&
                typeof resp === "object" &&
                "data" in (resp as Record<string, unknown>)
            ) {
                data = (resp as Record<string, unknown>).data;
            } else {
                data = resp;
            }

            if (!Array.isArray(data) || data.length === 0) {
                toast({
                    title: "Задания не найдены",
                    variant: "destructive",
                });
                return;
            }

            const arr = Array.isArray(data) ? (data as TaskSchema[]) : [];
            safeSetLocalStorage("trainingProgress", {});
            safeSetLocalStorage("trainingList", arr);

            const firstId = arr[0]?.id;
            if (firstId) router.push(`/task/${firstId}`);
        } catch (err) {
            console.error(err);
            toast({
                title: "Ошибка получения тренировок",
                variant: "destructive",
            });
        }
    };

    const getPriorityLabel = (priority: number) => {
        switch (priority) {
            case 5:
                return "Очень высокий";
            case 4:
                return "Высокий";
            case 3:
                return "Средний";
            case 2:
                return "Низкий";
            case 1:
                return "Очень низкий";
            default:
                return "Обычный";
        }
    };

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 5:
                return "text-red-500";
            case 4:
                return "text-orange-500";
            case 3:
                return "text-yellow-500";
            case 2:
                return "text-green-500";
            case 1:
                return "text-blue-500";
            default:
                return "text-muted-foreground";
        }
    };

    // Sort by priority (highest first)
    const sortedRecommendations = [...recommendations].sort(
        (a, b) => b.priority - a.priority,
    );

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="h-5 w-5" />
                <h3 className="font-semibold text-lg">
                    Индивидуальный план обучения
                </h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 w-full">
                {sortedRecommendations.map((rec, index) => (
                    <div
                        key={`${rec.theme}-${rec.difficulty}-${index}`}
                        className="p-4 border rounded bg-card hover:shadow-md transition-shadow"
                    >
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold">
                                        {rec.theme}
                                    </div>
                                    <span
                                        className={`text-xs font-medium ${getPriorityColor(rec.priority)}`}
                                    >   
                                    Приоритет: {getPriorityLabel(rec.priority)}
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground mb-1">
                                    Уровень: {rec.difficulty}
                                </div>
                                <div className="text-sm text-muted-foreground mb-3">
                                    {rec.reason}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => startTrainingWithPlan(rec)}
                            >
                                Начать тренировку
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
