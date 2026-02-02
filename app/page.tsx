import { TrendingUpIcon } from "@/components/ui/trending-up";
import { HeroBlock } from "@/components/hero";
import { Catalog } from "@/components/catalog";
import { getTasksApiTasksGet } from "@/lib/client";
import type { TaskSchema } from "@/lib/client";

export default async function Home() {
    const tasks = await getTasksApiTasksGet();
    
    return (
        <div className="flex min-h-screen flex-col">
            <HeroBlock />
            <header className="font-medium text-3xl py-7 flex items-center gap-5">
                <TrendingUpIcon size={30} />
                <span>Решай задания и выигрывай олимпиады!</span>
            </header>
            {tasks.data ? (
                <Catalog tasks={tasks.data as TaskSchema[]} />
            ) : (
                "Нет заданий("
            )}
        </div>
    );
}
