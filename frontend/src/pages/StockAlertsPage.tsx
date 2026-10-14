
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    RefreshCw,
    Search,
    ShieldCheck,
} from "lucide-react";

import {
    stockService,
    type StockAlert,
    type StockAlertStatus,
} from "../services/stockService";

type Filter = "ALL" | StockAlertStatus;

const statusStyles: Record<StockAlertStatus, string> = {
    ACTIVE: "bg-red-100 text-red-700",
    RESOLVED: "bg-green-100 text-green-700",
};

function formatDate(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function quantity(value?: number) {
    return Number(value ?? 0).toLocaleString(undefined, {
        maximumFractionDigits: 3,
    });
}

function StatCard({
                      title,
                      value,
                      icon: Icon,
                      color,
                  }: {
    title: string;
    value: number;
    icon: typeof AlertTriangle;
    color: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`rounded-xl p-3 ${color}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

function getError(error: unknown) {
    return error instanceof Error ? error.message : "Something went wrong.";
}

export default function StockAlertsPage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<Filter>("ALL");
    const [search, setSearch] = useState("");
    const [pageError, setPageError] = useState("");

    const {
        data: alerts = [],
        isLoading,
        isError,
        error,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ["stock-alerts"],
        queryFn: stockService.getAlerts,
    });

    const resolveMutation = useMutation({
        mutationFn: (id: number) => stockService.resolveAlert(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
            setPageError("");
        },
        onError: (err) => setPageError(getError(err)),
    });

    const activeAlerts = alerts.filter((a) => a.status === "ACTIVE");
    const resolvedAlerts = alerts.filter((a) => a.status === "RESOLVED");

    const filteredAlerts = useMemo(() => {
        const term = search.trim().toLowerCase();

        return alerts.filter((alert) => {
            const statusMatch = filter === "ALL" || alert.status === filter;
            const searchMatch =
                !term ||
                String(alert.id).includes(term) ||
                alert.ingredient?.name?.toLowerCase().includes(term) ||
                String(alert.ingredient?.id ?? "").includes(term);

            return statusMatch && searchMatch;
        });
    }, [alerts, filter, search]);

    const resolveAlert = (alert: StockAlert) => {
        if (alert.status !== "ACTIVE") return;

        if (window.confirm(`Resolve stock alert for ${alert.ingredient?.name ?? "this ingredient"}?`)) {
            setPageError("");
            resolveMutation.mutate(alert.id);
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stock Alerts</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Monitor low-stock ingredients and resolve alerts.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw size={17} className={isFetching ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {pageError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {pageError}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total Alerts"
                    value={alerts.length}
                    icon={AlertTriangle}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Active Alerts"
                    value={activeAlerts.length}
                    icon={Clock3}
                    color="bg-red-50 text-red-600"
                />
                <StatCard
                    title="Resolved Alerts"
                    value={resolvedAlerts.length}
                    icon={ShieldCheck}
                    color="bg-green-50 text-green-600"
                />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search ingredient or alert ID..."
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as Filter)}
                        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="RESOLVED">Resolved</option>
                    </select>
                </div>

                {isLoading ? (
                    <div className="p-10 text-center text-sm text-gray-500">
                        Loading stock alerts...
                    </div>
                ) : isError ? (
                    <div className="p-10 text-center">
                        <p className="text-sm text-red-600">{getError(error)}</p>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="mt-3 text-sm font-semibold text-indigo-600"
                        >
                            Try again
                        </button>
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="p-10 text-center">
                        <CheckCircle2 className="mx-auto text-green-500" size={32} />
                        <p className="mt-3 font-medium text-gray-800">No alerts found</p>
                        <p className="mt-1 text-sm text-gray-500">
                            There are no alerts matching your search or filter.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-5 py-3">Alert</th>
                                <th className="px-5 py-3">Ingredient</th>
                                <th className="px-5 py-3">Current Stock</th>
                                <th className="px-5 py-3">Minimum Stock</th>
                                <th className="px-5 py-3">Created</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Action</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {filteredAlerts.map((alert) => (
                                <tr key={alert.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-4 font-medium text-gray-700">
                                        #{alert.id}
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-gray-900">
                                            {alert.ingredient?.name ?? "Unknown"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            ID: {alert.ingredient?.id ?? "—"}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-red-600">
                                        {quantity(alert.currentQuantity)}{" "}
                                        {alert.ingredient?.unit ?? ""}
                                    </td>
                                    <td className="px-5 py-4 text-gray-700">
                                        {quantity(alert.minimumStock)}{" "}
                                        {alert.ingredient?.unit ?? ""}
                                    </td>
                                    <td className="px-5 py-4 text-gray-500">
                                        {formatDate(alert.createdAt)}
                                    </td>
                                    <td className="px-5 py-4">
                      <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[alert.status]}`}
                      >
                        {alert.status === "ACTIVE" ? "Active" : "Resolved"}
                      </span>
                                        {alert.resolvedAt && (
                                            <p className="mt-1 text-xs text-gray-400">
                                                {formatDate(alert.resolvedAt)}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        {alert.status === "ACTIVE" ? (
                                            <button
                                                type="button"
                                                disabled={resolveMutation.isPending}
                                                onClick={() => resolveAlert(alert)}
                                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                            >
                                                Resolve
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400">Completed</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
                    Showing {filteredAlerts.length} of {alerts.length} alerts
                </div>
            </div>
        </div>
    );
}