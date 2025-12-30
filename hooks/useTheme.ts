import { useState, useEffect, useCallback } from 'react';
import { Theme } from '../types';

export const useTheme = (): [Theme, () => void] => {
    const [theme, setTheme] = useState<Theme>(() => {
        // This function runs only on initial mount.
        // It avoids a flicker by setting the theme correctly from the start.
        if (typeof window === 'undefined') {
            return 'light'; // Default for SSR
        }

        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }

        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return systemPrefersDark ? 'dark' : 'light';
    });

    // This effect synchronizes the theme state with the DOM (<html> class) and localStorage.
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // The toggle function is memoized with useCallback for performance,
    // preventing unnecessary re-renders of child components.
    const toggleTheme = useCallback(() => {
        setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
    }, []);

    return [theme, toggleTheme];
};
