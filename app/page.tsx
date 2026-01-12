'use client';

import { useRef, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tasks } from "@/data/tasks";
import { Subject } from "@/lib/types";
import { Section } from "@/components/section";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupButton,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";
import { Banner } from '@/components/banner';
import { GitForkIcon, type GitForkIconHandle } from '@/components/ui/git-fork';
import { PlusIcon, type PlusIconHandle } from '@/components/ui/plus';
import { AtomIcon, type AtomIconHandle } from '@/components/ui/atom';
import { BookTextIcon, type BookTextIconHandle } from '@/components/ui/book-text';
import { TrendingUpIcon } from '@/components/ui/trending-up';

export default function Home() {
    const [activeTab, setActiveTab] = useState("inf");
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
            case "inf":
                gitForkRef.current?.startAnimation();
                break;
            case "mat":
                plusRef.current?.startAnimation();
                break;
            case "fiz":
                atomRef.current?.startAnimation();
                break;
            case "rus":
                bookTextRef.current?.startAnimation();
                break;
        }
    }, [activeTab]);
    return (
        <div className="flex min-h-screen flex-col">
            <Banner />
            <header className="font-medium text-3xl py-7 flex items-center gap-5">
                <TrendingUpIcon size={30} />
                <span>Решай задания и выигрывай олимпиады!</span>
            </header>
            <InputGroup className="h-12">
                <InputGroupAddon>
                    <Search />
                </InputGroupAddon>
                <InputGroupInput placeholder="Найти задания" />
                <InputGroupButton className="h-full flex gap-3">
                    <Search />
                    <span className='pr-3'>Поиск</span>
                </InputGroupButton>
            </InputGroup>
            <Tabs defaultValue={"inf"} onValueChange={setActiveTab}>
                <TabsList className="mt-5 w-full">
                    <TabsTrigger value="inf">
                        <GitForkIcon ref={gitForkRef} />
                        <span>Информатика</span>
                    </TabsTrigger>
                    <TabsTrigger value="mat">
                        <PlusIcon ref={plusRef} />
                        <span>Математика</span>
                    </TabsTrigger>
                    <TabsTrigger value="fiz">
                        <AtomIcon ref={atomRef} />
                        <span>Физика</span>
                    </TabsTrigger>
                    <TabsTrigger value="rus">
                        <BookTextIcon ref={bookTextRef} />
                        <span>Русский язык</span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="inf" className="p-3">
                    {Array.from(new Set(tasks.map((task) => task.theme))).map(
                        (theme) => (
                            <Section
                                key={theme}
                                title={theme}
                                tasks={tasks.filter(
                                    (task) =>
                                        task.subject === Subject.inf &&
                                        task.theme === theme,
                                )}
                            />
                        ),
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
