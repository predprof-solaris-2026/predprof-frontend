'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const id = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(id);
    }, []);

    if (!mounted) {
        return (
            <Button className="p-2 rounded-full size-10" aria-label="Toggle Theme" aria-hidden>
                <Sun />
            </Button>
        );
    }

    return (
        <Button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full size-10"
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? <Moon /> : <Sun />}
        </Button>
    );
}