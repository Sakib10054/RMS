import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'emerald' | 'ocean' | 'violet' | 'rose' | 'amber' | 'cyan';
type ColorMode = 'light' | 'dark';
const themes: Record<Theme, { name: string; colors: string[] }> = {
    emerald: { name: 'Emerald', colors: ['#059669', '#10b981'] },
    ocean: { name: 'Ocean', colors: ['#2563eb', '#06b6d4'] },
    violet: { name: 'Violet', colors: ['#7c3aed', '#a855f7'] },
    rose: { name: 'Rose', colors: ['#e11d48', '#f43f5e'] },
    amber: { name: 'Amber', colors: ['#d97706', '#f59e0b'] },
    cyan: { name: 'Cyan', colors: ['#0891b2', '#06b6d4'] },
};
const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void; themes: typeof themes; mode: ColorMode; toggleMode: () => void }>({ theme: 'emerald', setTheme: () => {}, themes, mode: 'light', toggleMode: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => { const saved = localStorage.getItem('restaurant-theme') as Theme | null; return saved && saved in themes ? saved : 'emerald'; });
    const [mode, setMode] = useState<ColorMode>(() => localStorage.getItem('restaurant-mode') === 'dark' ? 'dark' : 'light');
    const setTheme = (t: Theme) => { setThemeState(t); localStorage.setItem('restaurant-theme', t); };
    const toggleMode = () => setMode(current => { const next = current === 'light' ? 'dark' : 'light'; localStorage.setItem('restaurant-mode', next); return next; });
    useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.dataset.mode = mode; }, [theme, mode]);
    const value = useMemo(() => ({ theme, setTheme, themes, mode, toggleMode }), [theme, mode]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
