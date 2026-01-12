'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Render a neutral placeholder on the server to avoid hydration mismatch.
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