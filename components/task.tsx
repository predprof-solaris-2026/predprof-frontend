import { type Task } from "@/lib/types";
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import Link from "next/link";

export function Task({ task }: { task: Task }) {
    return (
        <Link href={`/task/${task._id}`}>
            <Card className="w-full flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow min-h-62.5">
                <div>
                    <CardHeader>
                        <div className="text-sm text-foreground/50">
                            {task.subject}
                        </div>
                        <div className="font-medium">{task.title}</div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 items-start mt-2">
                        <div className="line-clamp-3 text-sm">
                            {task.statement}
                        </div>
                    </CardContent>
                </div>
                <CardFooter>
                    <div className="text-sm text-foreground/50">
                        Сложность: {task.difficulty}
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}
