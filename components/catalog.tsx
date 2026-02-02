"use client";

import { useRef, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Theme } from "@/lib/client";
import { Section } from "@/components/section";
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { getTasksApiTrainingGet } from '@/lib/client'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupButton,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";
import { GitForkIcon, type GitForkIconHandle } from "@/components/ui/git-fork";
import { PlusIcon, type PlusIconHandle } from "@/components/ui/plus";
import { AtomIcon, type AtomIconHandle } from "@/components/ui/atom";
import {
    BookTextIcon,
    type BookTextIconHandle,
} from "@/components/ui/book-text";
import type { TaskSchema } from "@/lib/client";
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function Catalog({ tasks }: { tasks: TaskSchema[] }) {
    const [activeTab, setActiveTab] = useState<Theme>("информатика");
    const themes: Theme[] = Array.from(
        new Set(tasks.map((task) => task.theme)),
    );
    const subjects = Array.from(new Set(tasks.map(t => t.subject))).filter(Boolean) as string[]
    const difficulties = Array.from(new Set(tasks.map(t => t.difficulty))).filter(Boolean) as string[]
    const router = useRouter()
    const { toast } = useToast()

    const [selSubject, setSelSubject] = useState<string>('all')
    const [selTheme, setSelTheme] = useState<string>('all')
    const [selDifficulty, setSelDifficulty] = useState<string>('all')
    const [limit, setLimit] = useState<number>(10)
    const [skip, setSkip] = useState<number>(0)
    const gitForkRef = useRef<GitForkIconHandle>(null);
    const plusRef = useRef<PlusIconHandle>(null);
    const atomRef = useRef<AtomIconHandle>(null);
    const bookTextRef = useRef<BookTextIconHandle>(null);

    useEffect(() => {
        gitForkRef.current?.stopAnimation();
        plusRef.current?.stopAnimation();
        atomRef.current?.stopAnimation();
        bookTextRef.current?.stopAnimation();

        switch (activeTab) {
            case "информатика":
                gitForkRef.current?.startAnimation();
                break;
            case "математика":
                plusRef.current?.startAnimation();
                break;
            case "физика":
                atomRef.current?.startAnimation();
                break;
            case "русский":
                bookTextRef.current?.startAnimation();
                break;
        }
    }, [activeTab]);

    return (
        <section id="catalog" className="flex flex-col">
            <div className="p-3 mb-4 border rounded">
                <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                                <Label>Тема</Label>
                                                <Select value={selSubject} onValueChange={(v) => setSelSubject(v)}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Все" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Все</SelectItem>
                                                        {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                        </div>
                                        <div>
                                                <Label>Предмет</Label>
                                                <Select value={selTheme} onValueChange={(v) => setSelTheme(v)}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Все" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Все</SelectItem>
                                                        {themes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                        </div>
                                        <div>
                                                <Label>Уровень</Label>
                                                <Select value={selDifficulty} onValueChange={(v) => setSelDifficulty(v)}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Все" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Все</SelectItem>
                                                        {difficulties.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                        </div>
                    <div>
                        <Label>Количество</Label>
                        <Input className="mt-1" type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
                    </div>
                    <div>
                        <Label>Пропустить</Label>
                        <Input className="mt-1" type="number" min={0} value={skip} onChange={(e) => setSkip(Number(e.target.value))} />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button className="btn btn-primary px-4 py-2 rounded" onClick={async () => {
                        try {
                            const q: any = {}
                            if (selSubject && selSubject !== 'all') q.subject = selSubject
                            if (selTheme && selTheme !== 'all') q.theme = selTheme
                            if (selDifficulty && selDifficulty !== 'all') q.difficulty = selDifficulty
                            q.limit = limit ?? 10
                            q.skip = skip ?? 0
                            const resp: any = await getTasksApiTrainingGet({ query: q })
                            const data = (resp as any)?.data || resp
                            if (!Array.isArray(data) || data.length === 0) {
                                toast({ title: 'Задания не найдены', variant: 'destructive' })
                                return
                            }
                            // reset previous training progress, save new training list and navigate to first task
                            try { localStorage.setItem('trainingProgress', JSON.stringify({})) } catch {}
                            try { localStorage.setItem('trainingList', JSON.stringify(data)) } catch {}
                            const firstId = data[0]?.id;
                            if (firstId) router.push(`/task/${firstId}`)
                        } catch (err: any) {
                            console.error(err)
                            toast({ title: 'Ошибка получения тренировок', variant: 'destructive' })
                        }
                    }}>Начать тренировку</Button>
                </div>
            </div>
            <InputGroup className="h-12">
                <InputGroupAddon>
                    <Search />
                </InputGroupAddon>
                <InputGroupInput placeholder="Найти задания" />
                <InputGroupButton className="h-full flex gap-3">
                    <Search />
                    <span className="pr-3">Поиск</span>
                </InputGroupButton>
            </InputGroup>
            <Tabs
                defaultValue={"информатика"}
                onValueChange={(value) => setActiveTab(value as Theme)}
            >
                <TabsList className="mt-5 w-full">
                    <TabsTrigger value={"информатика"}>
                        <GitForkIcon ref={gitForkRef} />
                        <span>Информатика</span>
                    </TabsTrigger>
                    <TabsTrigger value={"математика"}>
                        <PlusIcon ref={plusRef} />
                        <span>Математика</span>
                    </TabsTrigger>
                    <TabsTrigger value={"физика"}>
                        <AtomIcon ref={atomRef} />
                        <span>Физика</span>
                    </TabsTrigger>
                    <TabsTrigger value={"русский"}>
                        <BookTextIcon ref={bookTextRef} />
                        <span>Русский язык</span>
                    </TabsTrigger>
                </TabsList>
                {themes.map((theme, i) => (
                    <TabsContent value={theme} className="p-3" key={i}>
                        {Array.from(
                            new Set(tasks.filter(task => task.theme == theme).map((task) => task.subject)),
                        ).map((subject) => (
                            <Section
                                key={subject}
                                title={subject}
                                tasks={tasks.filter(
                                    (task) => task.subject === subject,
                                )}
                            />
                        ))}
                    </TabsContent>
                ))}
            </Tabs>
        </section>
    );
}
