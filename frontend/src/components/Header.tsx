import { LogOut, Menu, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemePicker from "./ThemePicker";

type HeaderProps = { onMenuClick?: () => void; };
export default function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuth();
    return <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/70 bg-white/75 px-3 backdrop-blur-2xl sm:px-6">
        <div className="flex items-center gap-3">
            <button type="button" onClick={onMenuClick} aria-label="Open navigation" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden"><Menu size={21}/></button>
            <div>
                <div className="flex items-center gap-2"><Sparkles size={15} className="text-[var(--brand-600)]"/><h1 className="text-base font-black tracking-tight text-slate-900 sm:text-lg">Restaurant<span className="text-[var(--brand-600)]">OS</span></h1></div>
                <p className="hidden text-xs font-medium text-slate-400 sm:block">Smart dining, beautifully managed</p>
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3"><ThemePicker/><div className="hidden text-right sm:block"><p className="text-sm font-bold text-slate-800">{user?.name ?? 'User'}</p><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{user?.role ?? ''}</p></div><button type="button" onClick={logout} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600"><LogOut size={17}/><span className="hidden sm:inline">Logout</span></button></div>
    </header>;
}
