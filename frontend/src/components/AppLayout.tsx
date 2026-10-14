import { useState } from "react";
import { Outlet } from "react-router-dom";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="modern-app flex min-h-screen bg-slate-50">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" />
                    <div className="relative z-10 h-full w-72 shadow-2xl">
                        <button type="button" aria-label="Close menu" onClick={() => setSidebarOpen(false)} className="absolute right-3 top-4 z-20 rounded-xl bg-white/15 p-2 text-white hover:bg-white/25">
                            <X size={20} />
                        </button>
                        <Sidebar onNavigate={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-7">
                    <div className="mx-auto w-full max-w-[1600px]">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
