import { Palette, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
export default function ThemePicker() {
    const { theme, setTheme, themes, mode, toggleMode } = useTheme();
    const [open, setOpen] = useState(false);
    return <div className="relative flex items-center gap-2">
        <button type="button" onClick={toggleMode} aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} className="icon-button">{mode === 'light' ? <Moon size={17}/> : <Sun size={17}/>}</button>
        <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"><Palette size={17}/> <span className="hidden sm:inline">Theme</span></button>
        {open && <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
            <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Choose your mood</p>
            <div className="grid grid-cols-2 gap-2">{(Object.keys(themes) as Array<keyof typeof themes>).map(key => <button key={key} onClick={() => { setTheme(key); setOpen(false); }} className={`flex items-center gap-2 rounded-xl p-2 text-left text-sm ${theme === key ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}><span className="h-7 w-7 rounded-full" style={{ background: `linear-gradient(135deg, ${themes[key].colors[0]}, ${themes[key].colors[1]})` }}/>{themes[key].name}</button>)}</div>
        </div>}
    </div>;
}
