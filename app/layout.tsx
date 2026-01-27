import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { ToastProvider } from "@/components/ui/toast";

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
                className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {/* ToastProvider добавляет шины для уведомлений */}
                    <ToastProvider>
                        <Header />
                        <main className="p-5 flex-1">{children}</main>
                        <footer className="w-full border-t px-5 py-4 text-sm text-muted-foreground">
                            <div className="max-w-6xl mx-auto flex justify-between items-center">
                                <div>© {new Date().getFullYear()} Предпроф</div>
                                <div>
                                    <a href="/admin" className="underline hover:text-foreground">Админка</a>
                                </div>
                            </div>
                        </footer>
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
