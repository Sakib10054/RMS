
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowDownUp,
    CalendarDays,
    Package,
    RefreshCw,
    Search,
} from "lucide-react";

import {
    stockService,
    type StockMovement,
    type StockMovementType,
} from "../services/stockService";

type TypeFilter = "ALL" | StockMovementType;

const typeLabels: Record<StockMovementType, string> = {
    PURCHASE: "Purchase",
    ORDER_CONSUMPTION: "Order Consumption",
    ADJUSTMENT: "Adjustment",
    WASTE: "Waste",
};

const typeStyles: Record<StockMovementType, string> = {
    PURCHASE: "bg-green-100 text-green-700",
    ORDER_CONSUMPTION: "bg-blue-100 text-blue-700",
    ADJUSTMENT: "bg-purple-100 text-purple-700",
    WASTE: "bg-red-100 text-red-700",
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

function getError(error: unknown) {
    return error instanceof Error ? error.message : "Something went wrong.";
}

export default function StockMovementsPage() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [dateError, setDateError] = useState("");

    const dateRangeSelected = Boolean(from || to);
    const validDateRange = Boolean(from && to && from <= to);

    const {
        data: movements = [],
        isLoading,
        isError,
        error,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ["stock-movements", from, to],
        queryFn: () =>
            dateRangeSelected && validDateRange
                ? stockService.getMovementsByDateRange(from, to)
                : stockService.getMovements(),
        enabled: !dateRangeSelected || validDateRange,
    });

    const filteredMovements = useMemo(() => {
        const term = search.trim().toLowerCase();

        return movements.filter((movement) => {
            const typeMatch =
                typeFilter === "ALL" || movement.type === typeFilter;

            const searchMatch =
                !term ||
                String(movement.id).includes(term) ||
                movement.ingredient?.name?.toLowerCase().includes(term) ||
                String(movement.ingredient?.id ?? "").includes(term) ||
                String(movement.referenceId ?? "").includes(term) ||
                (movement.note ?? "").toLowerCase().includes(term);

            return typeMatch && searchMatch;
        });
    }, [movements, search, typeFilter]);

    const totalByType = useMemo(() => {
        return movements.reduce(
            (totals, movement) => {
                totals[movement.type] += Number(movement.quantity || 0);
                return totals;
            },
            {
                PURCHASE: 0,
                ORDER_CONSUMPTION: 0,
                ADJUSTMENT: 0,
                WASTE: 0,
            } as Record<StockMovementType, number>,
        );
    }, [movements]);

    const applyDateRange = () => {
        if (!from || !to) {
            setDateError("Please select both start and end dates.");
            return;
        }
        if (from > to) {
            setDateError("Start date cannot be after end date.");
            return;
        }
        setDateError("");
    };

    const clearDateRange = () => {
        setFrom("");
        setTo("");
        setDateError("");
    };

    const activeDateRange = dateRangeSelected && validDateRange;

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Stock Movement History
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Review purchases, consumption, adjustments and waste records.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    disabled={isFetching || (dateRangeSelected && !validDateRange)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw size={17} className={isFetching ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {(
                    [
                        ["Purchase", "PURCHASE", "text-green-600", "bg-green-50"],
                        [
                            "Consumption",
                            "ORDER_CONSUMPTION",
                            "text-blue-600",
                            "bg-blue-50",
                        ],
                        ["Adjustment", "ADJUSTMENT", "text-purple-600", "bg-purple-50"],
                        ["Waste", "WASTE", "text-red-600", "bg-red-50"],
                    ] as const
                ).map(([label, type, textColor, bgColor]) => (
                    <div
                        key={type}
                        className="rounded-2xl border border-gray-200 bg-white p-5"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{label} Quantity</p>
                            <div className={`rounded-lg p-2 ${bgColor} ${textColor}`}>
                                <Package size={19} />
                            </div>
                        </div>
                        <p className={`mt-2 text-2xl font-bold ${textColor}`}>
                            {quantity(totalByType[type])}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">Across loaded records</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                    <CalendarDays size={18} />
                    Filter by date range
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <label className="flex-1 text-sm text-gray-600">
                        From
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => {
                                setFrom(e.target.value);
                                setDateError("");
                            }}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />
                    </label>
                    <label className="flex-1 text-sm text-gray-600">
                        To
                        <input
                            type="date"
                            value={to}
                            min={from || undefined}
                            onChange={(e) => {
                                setTo(e.target.value);
                                setDateError("");
                            }}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={applyDateRange}
                            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            Apply
                        </button>
                        <button
                            type="button"
                            onClick={clearDateRange}
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                </div>
                {dateError && (
                    <p className="mt-2 text-sm text-red-600">{dateError}</p>
                )}
                {activeDateRange && (
                    <p className="mt-2 text-xs text-gray-500">
                        Showing records from {from} to {to}.
                    </p>
                )}
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
                            placeholder="Search ingredient, ID, note..."
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    >
                        <option value="ALL">All Movement Types</option>
                        <option value="PURCHASE">Purchase</option>
                        <option value="ORDER_CONSUMPTION">Order Consumption</option>
                        <option value="ADJUSTMENT">Adjustment</option>
                        <option value="WASTE">Waste</option>
                    </select>
                </div>

                {dateRangeSelected && !validDateRange ? (
                    <div className="p-10 text-center text-sm text-gray-500">
                        Select a valid date range and press Apply.
                    </div>
                ) : isLoading ? (
                    <div className="p-10 text-center text-sm text-gray-500">
                        Loading stock movements...
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
                ) : filteredMovements.length === 0 ? (
                    <div className="p-10 text-center">
                        <ArrowDownUp className="mx-auto text-gray-400" size={32} />
                        <p className="mt-3 font-medium text-gray-800">
                            No stock movements found
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            Try changing the filters or date range.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-5 py-3">Movement</th>
                                <th className="px-5 py-3">Ingredient</th>
                                <th className="px-5 py-3">Type</th>
                                <th className="px-5 py-3">Quantity</th>
                                <th className="px-5 py-3">Reference</th>
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3">Note</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {filteredMovements.map((movement: StockMovement) => (
                                <tr key={movement.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-4 font-medium text-gray-700">
                                        #{movement.id}
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-gray-900">
                                            {movement.ingredient?.name ?? "Unknown"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            ID: {movement.ingredient?.id ?? "—"}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4">
                      <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${typeStyles[movement.type]}`}
                      >
                        {typeLabels[movement.type] ?? movement.type}
                      </span>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-gray-800">
                                        {quantity(movement.quantity)}{" "}
                                        {movement.ingredient?.unit ?? ""}
                                    </td>
                                    <td className="px-5 py-4 text-gray-600">
                                        {movement.referenceId ?? "—"}
                                    </td>
                                    <td className="px-5 py-4 text-gray-500">
                                        {formatDate(movement.date)}
                                    </td>
                                    <td className="max-w-[220px] truncate px-5 py-4 text-gray-600">
                                        {movement.note || "—"}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
                    Showing {filteredMovements.length} of {movements.length} movements
                </div>
            </div>
        </div>
    );
}