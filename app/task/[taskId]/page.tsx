"use client";
import { useParams } from "next/navigation";
import { tasks } from "@/data/tasks";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TaskSidebar } from '@/components/task-sidebar';

export default function TaskPage() {
    const { taskId } = useParams();
    const task = tasks.find((t) => t._id === taskId);

    if (!task) {
        return <div>Задание не найдено</div>;
    }

    return (
        <SidebarProvider>
            <TaskSidebar />
            <SidebarTrigger className='size-10' />
            <div className="flex flex-col justify-between ml-10 max-h-[85vh]">
                <div className="flex flex-col flex-1">
                    <span>
                        {task.subject} - {task.theme}
                    </span>
                    <header className="text-3xl font-medium">
                        {task.title}
                    </header>
                    <div className="mt-10 w-2/3 text-justify">
                        {task.statement}
                    </div>
                </div>
                <div className="flex gap-5 items-center justify-start max-w-1/2 flex-wrap">
                    <div className="w-full pt-3 text-sm">Введите свой ответ в поле ниже:</div>
                    <div className="w-full flex items-stretch gap-5">
                        <Input placeholder="Ваш ответ" />
                        <Button className="flex gap-3 items-center">
                            <span>Отправить</span>
                            <Send />
                        </Button>
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
}
