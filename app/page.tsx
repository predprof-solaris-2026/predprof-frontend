import { TrendingUpIcon } from "@/components/ui/trending-up";
import { HeroBlock } from "@/components/hero";
import { Catalog } from "@/components/catalog";
import { getTasksApiTasksGet, getNextTaskRecommendationApiTrainingRecommendedTaskGet } from "@/lib/client";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TaskSchema, TaskRecommendation } from "@/lib/client";

export default async function Home() {
    const tasks = await getTasksApiTasksGet();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value ?? null;
    const recResp = await getNextTaskRecommendationApiTrainingRecommendedTaskGet(token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    let rec: TaskRecommendation | null = null;
    const recObj = recResp as unknown as Record<string, unknown>;
    if (recObj && "data" in recObj) {
        rec = recObj.data as TaskRecommendation | null;
    } else if (recObj && "error" in recObj) {
        console.log(recObj.error);
        rec = null;
    } else {
        rec = recResp as unknown as TaskRecommendation | null;
    }
    
    return (
        <div className="flex min-h-screen flex-col">
            <HeroBlock />
            <header className="font-medium text-3xl py-7 flex items-center gap-5">
                <TrendingUpIcon size={30} />
                <span>Решай задания и выигрывай олимпиады!</span>
            </header>
            {rec ? (
                <div className="max-w-4xl p-4 mb-6 flex flex-start">
                    <div className="p-4 border rounded bg-card flex items-center justify-between gap-4">
                        <div>
                            <div className="text-xs text-muted-foreground uppercase">Рекомендую решить</div>
                            <div className="font-semibold">{rec.theme} • {rec.difficulty}</div>
                            <div className="text-sm text-muted-foreground mt-1">{rec.reason}</div>
                        </div>
                        <div>
                            <Link href={`/task/${rec.id}`}>
                                <Button>Решить</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}
            {tasks.data ? (
                <Catalog tasks={tasks.data as TaskSchema[]} />
            ) : (
                "Нет заданий("
            )}
        </div>
    );
}
