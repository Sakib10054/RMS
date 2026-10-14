
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Armchair,
    Plus,
    Pencil,
    Trash2,
    Users,
    X,
    RefreshCw,
} from "lucide-react";

import tableService, {
    type RestaurantTable,
    type TableStatus,
} from "../services/tableService";

type FilterStatus = "ALL" | TableStatus;

const statusStyles: Record<TableStatus, string> = {
    AVAILABLE: "bg-green-100 text-green-700",
    OCCUPIED: "bg-red-100 text-red-700",
    RESERVED: "bg-amber-100 text-amber-700",
};

const statusLabels: Record<TableStatus, string> = {
    AVAILABLE: "Available",
    OCCUPIED: "Occupied",
    RESERVED: "Reserved",
};

function getErrorMessage(error: unknown): string {
    const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
    };

    return (
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong. Please try again."
    );
}

export default function TablesPage() {
    const queryClient = useQueryClient();

    const [filter, setFilter] = useState<FilterStatus>("ALL");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<RestaurantTable | null>(
        null
    );
    const [tableNumber, setTableNumber] = useState("");
    const [capacity, setCapacity] = useState("");
    const [formError, setFormError] = useState("");
    const [pageError, setPageError] = useState("");

    const {
        data: tables = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["tables"],
        queryFn: tableService.getAll,
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const data = {
                tableNumber: Number(tableNumber),
                capacity: Number(capacity),
            };

            if (editingTable) {
                return tableService.update(editingTable.id, data);
            }

            return tableService.create(data);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["tables"] });
            setIsModalOpen(false);
            resetForm();
        },
        onError: (err) => setFormError(getErrorMessage(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: tableService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tables"] });
        },
        onError: (err) => setPageError(getErrorMessage(err)),
    });

    const resetForm = () => {
        setTableNumber("");
        setCapacity("");
        setEditingTable(null);
        setFormError("");
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (table: RestaurantTable) => {
        setEditingTable(table);
        setTableNumber(String(table.tableNumber));
        setCapacity(String(table.capacity));
        setFormError("");
        setIsModalOpen(true);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");

        const number = Number(tableNumber);
        const seats = Number(capacity);

        if (!Number.isInteger(number) || number <= 0) {
            setFormError("Table number must be a positive whole number.");
            return;
        }

        if (!Number.isInteger(seats) || seats <= 0) {
            setFormError("Capacity must be a positive whole number.");
            return;
        }

        const duplicate = tables.some(
            (table) =>
                table.tableNumber === number && table.id !== editingTable?.id
        );

        if (duplicate) {
            setFormError("This table number already exists.");
            return;
        }

        saveMutation.mutate();
    };

    const handleDelete = (table: RestaurantTable) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete Table ${table.tableNumber}?`
        );

        if (confirmed) {
            setPageError("");
            deleteMutation.mutate(table.id);
        }
    };

    const filteredTables = useMemo(() => {
        const result =
            filter === "ALL"
                ? tables
                : tables.filter((table) => table.status === filter);

        return [...result].sort((a, b) => a.tableNumber - b.tableNumber);
    }, [tables, filter]);

    const availableCount = tables.filter(
        (table) => table.status === "AVAILABLE"
    ).length;

    const occupiedCount = tables.filter(
        (table) => table.status === "OCCUPIED"
    ).length;

    const reservedCount = tables.filter(
        (table) => table.status === "RESERVED"
    ).length;

    const totalCapacity = tables.reduce(
        (sum, table) => sum + (table.capacity || 0),
        0
    );

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Table Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage restaurant tables and view their current status.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                    <Plus size={18} />
                    Add Table
                </button>
            </div>

            {pageError && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{pageError}</span>
                    <button
                        type="button"
                        onClick={() => setPageError("")}
                        aria-label="Dismiss error"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Total Tables"
                    value={tables.length}
                    icon={<Armchair size={21} />}
                    iconClass="bg-indigo-50 text-indigo-600"
                />
                <SummaryCard
                    title="Available"
                    value={availableCount}
                    icon={<Armchair size={21} />}
                    iconClass="bg-green-50 text-green-600"
                />
                <SummaryCard
                    title="Occupied"
                    value={occupiedCount}
                    icon={<Users size={21} />}
                    iconClass="bg-red-50 text-red-600"
                />
                <SummaryCard
                    title="Total Seating"
                    value={totalCapacity}
                    icon={<Users size={21} />}
                    iconClass="bg-amber-50 text-amber-600"
                    subtitle={`${reservedCount} reserved`}
                />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-semibold text-gray-900">Restaurant Tables</h2>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={filter}
                            onChange={(event) =>
                                setFilter(event.target.value as FilterStatus)
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
                            aria-label="Filter tables by status"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="OCCUPIED">Occupied</option>
                            <option value="RESERVED">Reserved</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                        Loading tables...
                    </div>
                ) : isError ? (
                    <div className="py-10 text-center">
                        <p className="text-sm text-red-600">
                            {getErrorMessage(error)}
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredTables.length === 0 ? (
                    <div className="py-12 text-center">
                        <Armchair className="mx-auto mb-3 text-gray-300" size={40} />
                        <p className="font-medium text-gray-700">No tables found</p>
                        <p className="mt-1 text-sm text-gray-500">
                            {filter === "ALL"
                                ? "Add your first restaurant table to get started."
                                : "There are no tables with this status."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                            {filteredTables.map((table) => (
                                <div
                                    key={table.id}
                                    className="rounded-xl border border-gray-200 p-4 transition hover:border-indigo-200 hover:shadow-sm"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                                                <Armchair size={23} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    Table {table.tableNumber}
                                                </p>
                                                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                                                    <Users size={14} />
                                                    {table.capacity} seats
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                statusStyles[table.status] ||
                                                "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                      {statusLabels[table.status] || table.status}
                    </span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(table)}
                                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                                            aria-label={`Edit table ${table.tableNumber}`}
                                        >
                                            <Pencil size={15} />
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(table)}
                                            disabled={deleteMutation.isPending}
                                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            aria-label={`Delete table ${table.tableNumber}`}
                                        >
                                            <Trash2 size={15} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="mt-5 text-sm text-gray-500">
                            Showing {filteredTables.length} of {tables.length} tables
                        </p>
                    </>
                )}
            </div>

            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsModalOpen(false);
                            resetForm();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="table-modal-title"
                        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl sm:p-6"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2
                                id="table-modal-title"
                                className="text-lg font-semibold text-gray-900"
                            >
                                {editingTable ? "Edit Table" : "Add New Table"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    resetForm();
                                }}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                                aria-label="Close modal"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="tableNumber"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Table Number
                                </label>
                                <input
                                    id="tableNumber"
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    value={tableNumber}
                                    onChange={(event) => setTableNumber(event.target.value)}
                                    placeholder="e.g. 1"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="capacity"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Seating Capacity
                                </label>
                                <input
                                    id="capacity"
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    value={capacity}
                                    onChange={(event) => setCapacity(event.target.value)}
                                    placeholder="e.g. 4"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            {editingTable && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Current Status
                                    </label>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                                        {statusLabels[editingTable.status] ||
                                            editingTable.status}
                                        <span className="ml-2 text-xs text-gray-400">
                      (Managed by order workflow)
                    </span>
                                    </div>
                                </div>
                            )}

                            {formError && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                    {formError}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveMutation.isPending}
                                    className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saveMutation.isPending
                                        ? "Saving..."
                                        : editingTable
                                            ? "Save Changes"
                                            : "Create Table"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({
                         title,
                         value,
                         icon,
                         iconClass,
                         subtitle,
                     }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    iconClass: string;
    subtitle?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <div className={`rounded-lg p-2 ${iconClass}`}>{icon}</div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
                <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            )}
        </div>
    );
}