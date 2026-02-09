'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Evitar error de hidratación configurando mounted a true después del primer renderizado
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400">
                <Sun size={20} className="animate-pulse" />
            </div>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#293b64] dark:text-[#23bcef] transition-all duration-300 group shadow-sm border border-slate-200 dark:border-slate-700"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun size={20} className="transition-all transform group-hover:rotate-45" />
            ) : (
                <Moon size={20} className="transition-all transform group-hover:-rotate-12" />
            )}
        </button>
    );
}
