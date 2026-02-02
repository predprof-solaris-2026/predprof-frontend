"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { Button } from "@/components/ui/button";
import { User, LogIn, Trophy } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import useUserStore from "@/lib/store/userStore";
import { getTokenFromCookie, clearTokenCookie } from "@/lib/auth";
import { useRouter } from 'next/navigation';

export default function Header() {
    const router = useRouter();
    const token = useUserStore((s) => s.token);
    const setToken = useUserStore((s) => s.setToken);
    const clear = useUserStore((s) => s.clear);

    useEffect(() => {
        const t = getTokenFromCookie();
        if (t && !token) setToken(t);
    }, []);

    const handleLogout = () => {
        clearTokenCookie();
        clear();
        router.push("/login");
    };

    return (
        <header className="w-full flex justify-between px-5 py-3 items-center z-20">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Image
                        src={logo}
                        alt="Logo"
                        height={48}
                        className="rounded-xl h-12 w-auto"
                    />
                </Link>
            </div>
            <div className="flex items-center gap-3">
                {token ? (
                        <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                        <Link href="/pvp">
                            <Button variant="ghost" size="sm" className='py-2 sm:p-5 sm:pz-6'>
                                <Trophy className="size-4" /> PVP
                            </Button>
                        </Link>
                        <Link href="/profile">
                            <Button variant="ghost" size="sm" className='px-3 py-2 sm:p-5'>
                                <User className="size-4" /> Профиль
                            </Button>
                        </Link>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="px-3 py-2 sm:p-5"
                            onClick={handleLogout}
                        >
                            Выйти
                        </Button>
                    </div>
                ) : (
                    <Link href="/login">
                        <Button size="sm" className="px-3 py-2 sm:p-5">
                            <LogIn className="size-4" /> Войти
                        </Button>
                    </Link>
                )}
                <ThemeSwitcher />
            </div>
        </header>
    );
}
