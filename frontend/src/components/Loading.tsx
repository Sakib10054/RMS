export default function Loading() {
    return (
        <div className="flex min-h-[220px] items-center justify-center" role="status" aria-live="polite" aria-label="Loading content">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="loading-skeleton h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2"><div className="loading-skeleton h-3 w-1/3" /><div className="loading-skeleton h-3 w-1/2" /></div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="loading-skeleton h-20" /><div className="loading-skeleton h-20" /><div className="loading-skeleton h-20" />
                </div>
                <div className="mt-4 space-y-2"><div className="loading-skeleton h-3 w-full" /><div className="loading-skeleton h-3 w-5/6" /></div>
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
}
