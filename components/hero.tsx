"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { BookOpen, Trophy } from "lucide-react";
import { useRouter } from 'next/navigation';

export function HeroBlock() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center relative bottom-12 sm:bottom-20">
            <span className="uppercase font-black text-md sm:text-xl relative -bottom-6 sm:-bottom-10">
                Решай задания на Платформе и
            </span>
            <span className="uppercase font-black text-5xl sm:text-[128px] mt-10">
                Возьми всерос
            </span>
            <Image
                src="/vsos.webp"
                width={700}
                height={700}
                alt="Диплом Всероса"
                className="relative bottom-12 sm:bottom-20 z-10 drop-shadow-2xl drop-shadow-black/50 dark:drop-shadow-white/50 max-w-full h-auto"
            />
            <div className="flex justify-center gap-3 sm:gap-5 relative bottom-8 sm:bottom-20">
                <Button
                    size={"lg"}
                    className="text-lg px-5 py-3 sm:px-10 sm:py-8 rounded-3xl flex justify-center items-center gap-3 cursor-pointer"
                    variant={"default"}
                    onClick={() => {
                        // window.scrollTo({top: 750, behavior: 'smooth'});
                        window.scrollTo({
                            top:
                                (document.getElementById("catalog")
                                    ?.offsetTop ?? 0) - 100,
                            behavior: "smooth",
                        });
                    }}
                >
                    <BookOpen className="size-6" />
                    <span>Открыть каталог</span>
                </Button>
                <Button
                    size={"lg"}
                    className="text-lg px-5 py-3 sm:px-10 sm:py-8 rounded-3xl flex justify-center items-center gap-3 cursor-pointer"
                    variant={"outline"}
                    onClick={() => router.push("/pvp")}
                >
                    <Trophy className="size-6" />
                    <span>Соревнования</span>
                </Button>
            </div>
        </div>
    );
}
