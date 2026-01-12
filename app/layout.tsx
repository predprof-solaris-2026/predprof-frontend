import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Image from "next/image";
import logo from "@/public/logo.webp";
import Link from "next/link";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Платформа для подготовки к олимпиадам",
    description:
        "Платформа для подготовки к олимпиадам с использованием ИИ-технологий",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <header className="w-full flex justify-between fixed px-5 py-3 items-center bg-background left-0 z-10">
                        <Link href="/">
                            <Image src={logo} alt="Logo" height={35} />
                        </Link>
                        <ThemeSwitcher />
                    </header>
                    <main className="p-5 pt-17">{children}</main>
                </ThemeProvider>
            </body>
        </html>
    );
}
