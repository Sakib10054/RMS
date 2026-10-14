
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    AlertTriangle,
    Boxes,
    CheckCircle2,
    Package,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react';

import {
    inventoryService,
    getStockStatus,
    type Inventory,
    type StockStatus,
} from '../services/inventoryService';

type StatusFilter = 'ALL' | StockStatus;

const statusStyles: Record<StockStatus, string> = {
    NORMAL: 'bg-green-100 text-green-700',
    LOW_STOCK: 'bg-amber-100 text-amber-700',
    OUT_OF_STOCK: 'bg-red-100 text-red-700',
};

const statusLabels: Record<StockStatus, string> = {
    NORMAL: 'Normal',
    LOW_STOCK: 'Low Stock',
    OUT_OF_STOCK: 'Out of Stock',
};

function formatDate(value?: string) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString();
}

function formatQuantity(value: number) {
    return Number(value).toLocaleString(undefined, {
        maximumFractionDigits: 3,
    });
}

function StatCard({
                      title,
                      value,
                      description,
                      icon: Icon,
                      iconClass,
                  }: {
    title: string;
    value: number;
    description: string;
    icon: typeof Package;
    iconClass: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{description}</p>
                </div>
                <div className={`rounded-xl p-3 ${iconClass}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

export default function InventoryPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

    const {
        data: inventory = [],
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ['inventory'],
        queryFn: inventoryService.getAll,
    });

    const stats = useMemo(() => {
        const normal = inventory.filter(
            (item) => getStockStatus(item) === 'NORMAL',
        ).length;
        const low = inventory.filter(
            (item) => getStockStatus(item) === 'LOW_STOCK',
        ).length;
        const out = inventory.filter(
            (item) => getStockStatus(item) === 'OUT_OF_STOCK',
        ).length;

        return { total: inventory.length, normal, low, out };
    }, [inventory]);

    const filteredInventory = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return inventory.filter((item) => {
            const name = item.ingredient?.name ?? '';
            const matchesSearch =
                !keyword ||
                name.toLowerCase().includes(keyword) ||
                String(item.ingredient?.id ?? '').includes(keyword);

            const matchesStatus =
                statusFilter === 'ALL' ||
                getStockStatus(item) === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [inventory, search, statusFilter]);

    const errorMessage =
        error instanceof Error ? error.message : 'Unable to load inventory.';

    return (
        <main className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Inventory Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Monitor ingredient quantities and stock levels.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Ingredients"
                    value={stats.total}
                    description="Tracked in inventory"
                    icon={Boxes}
                    iconClass="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Normal Stock"
                    value={stats.normal}
                    description="Above minimum stock"
                    icon={CheckCircle2}
                    iconClass="bg-green-50 text-green-600"
                />
                <StatCard
                    title="Low Stock"
                    value={stats.low}
                    description="At or below minimum"
                    icon={AlertTriangle}
                    iconClass="bg-amber-50 text-amber-600"
                />
                <StatCard
                    title="Out of Stock"
                    value={stats.out}
                    description="Quantity is zero or less"
                    icon={XCircle}
                    iconClass="bg-red-50 text-red-600"
                />
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-900">Stock Overview</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Inventory quantities and their current status
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search ingredient..."
                                className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value as StatusFilter)
                            }
                            className="h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            aria-label="Filter by stock status"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="NORMAL">Normal</option>
                            <option value="LOW_STOCK">Low Stock</option>
                            <option value="OUT_OF_STOCK">Out of Stock</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-gray-500">
                        <RefreshCw size={25} className="animate-spin text-blue-600" />
                        <p className="text-sm">Loading inventory...</p>
                    </div>
                ) : isError ? (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
                        <AlertTriangle size={30} className="text-red-500" />
                        <p className="font-semibold text-gray-900">
                            Could not load inventory
                        </p>
                        <p className="max-w-md text-sm text-gray-500">{errorMessage}</p>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredInventory.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-5 text-center">
                        <Package size={32} className="text-gray-400" />
                        <p className="font-semibold text-gray-900">
                            {inventory.length === 0
                                ? 'No inventory found'
                                : 'No matching ingredients'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {inventory.length === 0
                                ? 'Inventory records will appear here when available.'
                                : 'Try changing your search or status filter.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Ingredient</th>
                                    <th className="px-5 py-4 font-semibold">Current Stock</th>
                                    <th className="px-5 py-4 font-semibold">Minimum Stock</th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                    <th className="px-5 py-4 font-semibold">Last Updated</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {filteredInventory.map((item: Inventory) => {
                                    const ingredient = item.ingredient;
                                    const status = getStockStatus(item);

                                    return (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-gray-900">
                                                    {ingredient?.name ?? 'Unknown ingredient'}
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500">
                                                    ID: {ingredient?.id ?? '—'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                          <span
                              className={`font-semibold ${
                                  status === 'OUT_OF_STOCK'
                                      ? 'text-red-600'
                                      : status === 'LOW_STOCK'
                                          ? 'text-amber-600'
                                          : 'text-gray-900'
                              }`}
                          >
                            {formatQuantity(item.currentQuantity)}
                          </span>
                                                <span className="ml-1 text-gray-500">
                            {ingredient?.unit ?? ''}
                          </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-700">
                                                {formatQuantity(ingredient?.minimumStock ?? 0)}{' '}
                                                {ingredient?.unit ?? ''}
                                            </td>
                                            <td className="px-5 py-4">
                          <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
                          >
                            {statusLabels[status]}
                          </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-500">
                                                {formatDate(item.lastUpdated)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-2 border-t border-gray-200 px-5 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredInventory.length} of {inventory.length}{' '}
                  ingredients
              </span>
                            <span>Stock data from the backend</span>
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}