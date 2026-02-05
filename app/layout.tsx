import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/sonner";
import FetchInterceptor from "@/components/fetch-interceptor";

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
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col items-center`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ToastProvider>
                        <Toaster position="top-center" />
                        <FetchInterceptor />
                        <Header />
                        <main className="p-4 sm:p-5 flex-1 max-w-7xl w-full">{children}</main>
                        <footer className="w-full border-t px-5 py-4 text-sm text-muted-foreground max-w-7xl">
                            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                                <div>© {new Date().getFullYear()} Предпроф</div>
                                <div>
                                    <a href="/admin" className="underline hover:text-foreground">Админка</a>
                                </div>
                            </div>
                        </footer>
                        {/* Sonner Toaster removed */}
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
