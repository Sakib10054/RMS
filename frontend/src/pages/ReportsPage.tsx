
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Activity,
    CalendarDays,
    ChartNoAxesCombined,
    ClipboardCheck,
    Download,
    RefreshCw,
    Wallet,
} from "lucide-react";

import { reportService } from "../services/reportService";

function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatCurrency(value?: number) {
    return new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 2,
    }).format(value ?? 0);
}

function formatNumber(value?: number) {
    return new Intl.NumberFormat("en-BD").format(value ?? 0);
}

function escapeCsv(value: string | number) {
    const text = String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

function exportReportCsv(
    date: string,
    data: {
        dailySales: number;
        weeklySales: number;
        monthlySales: number;
        completedOrderCount: number;
        averageOrderValue: number;
    },
) {
    const rows = [
        ["Report Date", date],
        ["Metric", "Value"],
        ["Daily Sales (BDT)", data.dailySales],
        ["Weekly Sales (BDT)", data.weeklySales],
        ["Monthly Sales (BDT)", data.monthlySales],
        ["Completed Orders", data.completedOrderCount],
        ["Average Order Value (BDT)", data.averageOrderValue],
    ];

    const csvContent =
        "\uFEFF" +
        rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sales-report-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

function StatCard({
                      title,
                      value,
                      subtitle,
                      icon: Icon,
                      iconClass,
                  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: typeof Wallet;
    iconClass: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="mt-2 break-words text-2xl font-bold text-gray-900">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
                </div>
                <div className={`rounded-xl p-3 ${iconClass}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    const [date, setDate] = useState(getLocalDate());

    const {
        data,
        isLoading,
        isError,
        error,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ["sales-report", date],
        queryFn: () => reportService.getSalesReport(date),
        enabled: Boolean(date),
    });

    const errorMessage =
        error instanceof Error ? error.message : "Unable to load sales report.";

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            Reports & Analytics
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Review restaurant sales performance and order statistics.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {data && (
                            <button
                                type="button"
                                onClick={() => exportReportCsv(date, data)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                <Download size={17} />
                                Export CSV
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => void refetch()}
                            disabled={isFetching || !date}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={17}
                                className={isFetching ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>
                </header>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <label className="block w-full text-sm font-medium text-slate-700 sm:max-w-xs">
                            <span className="mb-2 flex items-center gap-2">
                                <CalendarDays size={17} />
                                Select report date
                            </span>
                            <input
                                type="date"
                                value={date}
                                max={getLocalDate()}
                                onChange={(event) => setDate(event.target.value)}
                                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                        </label>
                        <p className="text-xs text-slate-500">
                            Weekly sales are calculated from Monday to Sunday; monthly sales
                            use the selected date's month.
                        </p>
                    </div>
                </section>

                {isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                        Loading sales report...
                    </div>
                ) : isError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                        <p className="font-semibold text-red-700">
                            Failed to load sales report.
                        </p>
                        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                            Try again
                        </button>
                    </div>
                ) : data ? (
                    <>
                        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <StatCard
                                title="Daily Sales"
                                value={formatCurrency(data.dailySales)}
                                subtitle={`Sales on ${date}`}
                                icon={Wallet}
                                iconClass="bg-emerald-50 text-emerald-600"
                            />

                            <StatCard
                                title="Weekly Sales"
                                value={formatCurrency(data.weeklySales)}
                                subtitle="Selected date's week"
                                icon={ChartNoAxesCombined}
                                iconClass="bg-blue-50 text-blue-600"
                            />

                            <StatCard
                                title="Monthly Sales"
                                value={formatCurrency(data.monthlySales)}
                                subtitle="Selected date's month"
                                icon={Activity}
                                iconClass="bg-violet-50 text-violet-600"
                            />

                            <StatCard
                                title="Completed Orders"
                                value={formatNumber(data.completedOrderCount)}
                                subtitle={`Completed on ${date}`}
                                icon={ClipboardCheck}
                                iconClass="bg-amber-50 text-amber-600"
                            />

                            <StatCard
                                title="Average Order Value"
                                value={formatCurrency(data.averageOrderValue)}
                                subtitle="Daily sales divided by completed orders"
                                icon={Wallet}
                                iconClass="bg-cyan-50 text-cyan-600"
                            />
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Sales Overview
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Sales totals returned by the backend for the selected date.
                            </p>

                            <div className="mt-5 space-y-5">
                                {(
                                    [
                                        ["Daily", data.dailySales],
                                        ["Weekly", data.weeklySales],
                                        ["Monthly", data.monthlySales],
                                    ] as const
                                ).map(([label, value]) => {
                                    const maximum = Math.max(
                                        data.dailySales,
                                        data.weeklySales,
                                        data.monthlySales,
                                        1,
                                    );
                                    const width = Math.max(0, (value / maximum) * 100);

                                    return (
                                        <div key={label}>
                                            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                                <span className="font-medium text-slate-700">
                                                    {label}
                                                </span>
                                                <span className="font-semibold tabular-nums text-slate-900">
                                                    {formatCurrency(value)}
                                                </span>
                                            </div>
                                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-indigo-500 transition-all"
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="mt-4 text-xs text-slate-400">
                                The bars compare the returned totals; they are not a daily
                                trend chart.
                            </p>
                        </section>
                    </>
                ) : null}
            </div>
        </main>
    );
}