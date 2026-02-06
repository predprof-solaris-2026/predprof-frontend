"use client";

import { useRef, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
    Theme,
    ThemeResponse,
    DifficultyRecommendation,
} from "@/lib/client";
import { Section } from "@/components/section";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
    getTasksApiTrainingGet,
    getThemeAnalysisApiTrainingThemeThemeGet,
} from "@/lib/client";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Search, Info } from "lucide-react";
import { GitForkIcon, type GitForkIconHandle } from "@/components/ui/git-fork";
import { PlusIcon, type PlusIconHandle } from "@/components/ui/plus";
import { AtomIcon, type AtomIconHandle } from "@/components/ui/atom";
import {
    BookTextIcon,
    type BookTextIconHandle,
} from "@/components/ui/book-text";
import type { TaskSchema } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

export function Catalog({ tasks }: { tasks: TaskSchema[] }) {
    const [activeTab, setActiveTab] = useState<Theme>("информатика");
    const themes: Theme[] = Array.from(
        new Set(tasks.map((task) => task.theme)),
    );
    const subjects = Array.from(new Set(tasks.map((t) => t.subject))).filter(
        Boolean,
    ) as string[];
    const difficulties = Array.from(
        new Set(tasks.map((t) => t.difficulty)),
    ).filter(Boolean) as string[];
    const router = useRouter();
    const { toast } = useToast();

    const [qSearch, setQSearch] = useState<string>("");

    const [selSubject, setSelSubject] = useState<string>("all");
    const [selTheme, setSelTheme] = useState<string>("all");
    const [selDifficulty, setSelDifficulty] = useState<string>("all");
    const [limit, setLimit] = useState<string>("10");
    const [skip, setSkip] = useState<string>("0");
    const gitForkRef = useRef<GitForkIconHandle>(null);
    const plusRef = useRef<PlusIconHandle>(null);
    const atomRef = useRef<AtomIconHandle>(null);
    const bookTextRef = useRef<BookTextIconHandle>(null);

    // Theme recommendations state
    const [themeRecommendations, setThemeRecommendations] = useState<
        DifficultyRecommendation[]
    >([]);
    const [loadingRecommendations, setLoadingRecommendations] =
        useState<boolean>(false);

    // Fetch theme recommendations when tab changes
    useEffect(() => {
        const fetchThemeRecommendations = async () => {
            setLoadingRecommendations(true);
            try {
                // Get token from cookies
                const token = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("token="))
                    ?.split("=")[1];

                if (!token) {
                    setThemeRecommendations([]);
                    setLoadingRecommendations(false);
                    return;
                }

                const resp = await getThemeAnalysisApiTrainingThemeThemeGet({
                    path: { theme: activeTab },
                    headers: { Authorization: `Bearer ${token}` },
                });

                const respObj = resp as unknown as Record<string, unknown>;
                let data: ThemeResponse | null = null;

                if (respObj && "data" in respObj) {
                    data = respObj.data as ThemeResponse | null;
                } else if (respObj && "recommendations" in respObj) {
                    data = respObj as unknown as ThemeResponse;
                }

                if (data && data.recommendations) {
                    setThemeRecommendations(data.recommendations);
                } else {
                    setThemeRecommendations([]);
                }
            } catch (err) {
                console.error("Error fetching theme recommendations:", err);
                setThemeRecommendations([]);
            } finally {
                setLoadingRecommendations(false);
            }
        };

        fetchThemeRecommendations();
    }, [activeTab]);

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

    const getRecommendationColor = (recommendation: string) => {
        if (
            recommendation.toLowerCase().includes("практика") ||
            recommendation.toLowerCase().includes("продолжайте") ||
            recommendation.toLowerCase().includes("отлично")
        ) {
            return "text-green-600 bg-green-50 border-green-200";
        }
        if (
            recommendation.toLowerCase().includes("подождите") ||
            recommendation.toLowerCase().includes("укрепите") ||
            recommendation.toLowerCase().includes("основы")
        ) {
            return "text-orange-600 bg-orange-50 border-orange-200";
        }
        if (
            recommendation.toLowerCase().includes("сложно") ||
            recommendation.toLowerCase().includes("рано")
        ) {
            return "text-red-600 bg-red-50 border-red-200";
        }
        return "text-blue-600 bg-blue-50 border-blue-200";
    };

    return (
        <section id="catalog" className="flex flex-col">
            <div className="p-3 mb-4 border rounded">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <Label>Тема</Label>
                        <Select
                            value={selSubject}
                            onValueChange={(v) => setSelSubject(v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Все" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все</SelectItem>
                                {subjects.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Предмет</Label>
                        <Select
                            value={selTheme}
                            onValueChange={(v) => setSelTheme(v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Все" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все</SelectItem>
                                {themes.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {t}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Уровень</Label>
                        <Select
                            value={selDifficulty}
                            onValueChange={(v) => setSelDifficulty(v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Все" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все</SelectItem>
                                {difficulties.map((d) => (
                                    <SelectItem key={d} value={d}>
                                        {d}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Количество</Label>
                        <Input
                            className="mt-1"
                            type="number"
                            min={1}
                            max={100}
                            value={limit}
                            onChange={(e) => {
                                const v = e.target.value;

                                if (v === "") {
                                    setLimit("");
                                } else {
                                    setLimit(String(Number(v)));
                                }
                            }}
                        />
                    </div>
                    <div>
                        <Label>Пропустить</Label>
                        <Input
                            className="mt-1"
                            type="number"
                            min={0}
                            value={skip}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === "") setSkip("");
                                else setSkip(String(Number(v)));
                            }}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        className="btn btn-primary px-4 py-2"
                        onClick={async () => {
                            try {
                                const q: Record<string, unknown> = {};
                                if (selSubject && selSubject !== "all")
                                    q.subject = selSubject;
                                if (selTheme && selTheme !== "all")
                                    q.theme = selTheme;
                                if (selDifficulty && selDifficulty !== "all")
                                    q.difficulty = selDifficulty;
                                q.limit = Number(limit) || 10;
                                q.skip = Number(skip) || 0;

                                const resp: unknown =
                                    await getTasksApiTrainingGet({ query: q });
                                let data: unknown;
                                if (
                                    resp &&
                                    typeof resp === "object" &&
                                    "data" in (resp as Record<string, unknown>)
                                ) {
                                    data = (resp as Record<string, unknown>)
                                        .data;
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

                                const arr = Array.isArray(data)
                                    ? (data as TaskSchema[])
                                    : [];
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
                        }}
                    >
                        Начать тренировку
                    </Button>
                </div>
            </div>
            <div className="mt-4 w-full">
                <div className="mb-4">
                    <InputGroup>
                        <InputGroupAddon>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </InputGroupAddon>
                        <InputGroupInput
                            placeholder="Найти задания"
                            value={qSearch}
                            onChange={(e) => setQSearch(e.target.value)}
                            className="w-full"
                        />
                    </InputGroup>
                </div>

                {qSearch ? (
                    <div className="space-y-3">
                        {tasks
                            .filter((t) => {
                                const q = qSearch.toLowerCase();
                                const title = (t.title || "")
                                    .toString()
                                    .toLowerCase();
                                const text = (t.task_text || "")
                                    .toString()
                                    .toLowerCase();
                                const subject = (t.subject || "")
                                    .toString()
                                    .toLowerCase();
                                const theme = (t.theme || "")
                                    .toString()
                                    .toLowerCase();
                                const difficulty = (t.difficulty || "")
                                    .toString()
                                    .toLowerCase();
                                return (
                                    title.includes(q) ||
                                    text.includes(q) ||
                                    subject.includes(q) ||
                                    theme.includes(q) ||
                                    difficulty.includes(q)
                                );
                            })
                            .map((t: TaskSchema) => (
                                <div
                                    key={t.id}
                                    className="p-3 border rounded flex justify-between items-start"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {t.title}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {t.subject} — {t.theme}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {(t.task_text || "").slice(0, 200)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                router.push(`/task/${t.id}`)
                                            }
                                        >
                                            Открыть
                                        </Button>
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <Tabs
                        defaultValue={"информатика"}
                        onValueChange={(value) => setActiveTab(value as Theme)}
                    >
                        <TabsList className="mt-5 w-full overflow-x-scroll overflow-y-hidden lg:overflow-x-hidden pl-26 lg:pl-1">
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

                        {/* Theme Recommendations Block */}
                        {themeRecommendations.length > 0 && (
                            <div className="mt-4 p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-2 mb-3">
                                    <Info className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold">
                                        Рекомендации по предмету: {activeTab}
                                    </h4>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {themeRecommendations.map((rec, index) => (
                                        <div
                                            key={`${rec.difficulty}-${index}`}
                                            className={`p-3 border rounded-md ${getRecommendationColor(rec.recommendation)}`}
                                        >
                                            <div className="font-medium text-sm mb-1">
                                                {rec.difficulty}
                                            </div>
                                            <div className="text-sm">
                                                {rec.recommendation}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {loadingRecommendations && (
                            <div className="mt-4 p-4 border rounded-lg bg-card animate-pulse">
                                <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    <div className="h-16 bg-muted rounded"></div>
                                    <div className="h-16 bg-muted rounded"></div>
                                    <div className="h-16 bg-muted rounded"></div>
                                </div>
                            </div>
                        )}

                        {themes.map((theme, i) => (
                            <TabsContent value={theme} className="p-3" key={i}>
                                {Array.from(
                                    new Set(
                                        tasks
                                            .filter(
                                                (task) => task.theme == theme,
                                            )
                                            .map((task) => task.subject),
                                    ),
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
                )}
            </div>
        </section>
    );
}
