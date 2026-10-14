
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    type CreateOrderRequest,
    type OrderStatus,
    type OrderSummary,
    type OrderType,
} from '../services/orderService';
import { getAllRecipes } from '../services/recipeService';
import { getRecipeIngredients, type RecipeIngredient } from '../services/recipeIngredientService';
import tableService from '../services/tableService';

const statuses: OrderStatus[] = [
    'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED',
];

const statusStyles: Record<OrderStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    CONFIRMED: 'bg-sky-100 text-sky-800',
    PREPARING: 'bg-indigo-100 text-indigo-800',
    READY: 'bg-violet-100 text-violet-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        maximumFractionDigits: 2,
    }).format(amount ?? 0);

const formatDate = (dateValue: string) => {
    if (!dateValue) return '—';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

type DraftItem = {
    recipeId: string;
    quantity: number;
};

const emptyItem = (): DraftItem => ({ recipeId: '', quantity: 1 });

type RequiredIngredientsProps = {
    recipeId: number;
    orderQuantity: number;
};

const RequiredIngredients = ({
    recipeId,
    orderQuantity,
}: RequiredIngredientsProps) => {
    const { data: ingredients = [], isLoading, isError } = useQuery<RecipeIngredient[]>({
        queryKey: ['recipe-ingredients', recipeId],
        queryFn: () => getRecipeIngredients(recipeId),
        enabled: recipeId > 0,
    });

    if (recipeId <= 0) return null;

    return (
        <div className="sm:col-span-4 rounded-lg bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Required Ingredients
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                        Total quantity needed for {orderQuantity} item{orderQuantity === 1 ? '' : 's'}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <p className="text-xs text-slate-500">Loading ingredients...</p>
            ) : isError ? (
                <p className="text-xs text-red-600">
                    Could not load the recipe ingredients.
                </p>
            ) : ingredients.length === 0 ? (
                <p className="text-xs font-medium text-amber-700">
                    No ingredients are assigned to this recipe. Assign required ingredients before creating the order.
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {ingredients.map((item) => (
                        <span
                            key={item.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                        >
                            <span className="font-semibold">{item.ingredient?.name ?? 'Ingredient'}</span>
                            <span className="text-slate-400">•</span>
                            <span>
                                {(Number(item.quantity) * orderQuantity).toLocaleString(undefined, {
                                    maximumFractionDigits: 6,
                                })}{' '}
                                {item.ingredient?.unit ?? ''}
                            </span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

const OrdersPage = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [updateError, setUpdateError] = useState('');
    const [createError, setCreateError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
    const [tableId, setTableId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [items, setItems] = useState<DraftItem[]>([emptyItem()]);

    const {
        data: orders = [],
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['orders'],
        queryFn: getAllOrders,
    });

    const { data: recipes = [], isLoading: recipesLoading } = useQuery({
        queryKey: ['recipes'],
        queryFn: getAllRecipes,
        enabled: showCreateForm,
    });

    const { data: tables = [], isLoading: tablesLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: tableService.getAll,
        enabled: showCreateForm && orderType === 'DINE_IN',
    });

    const availableRecipes = recipes.filter((recipe) => recipe.available);
    const availableTables = tables.filter((table) => table.status === 'AVAILABLE');

    const totalAmount = items.reduce((total, item) => {
        const recipe = recipes.find((entry) => entry.id === Number(item.recipeId));
        return total + (recipe?.price ?? 0) * (Number(item.quantity) || 0);
    }, 0);

    const createMutation = useMutation({
        mutationFn: (data: CreateOrderRequest) => createOrder(data),
        onSuccess: async () => {
            setCreateError('');
            setSuccessMessage('Order created successfully.');
            setShowCreateForm(false);
            setOrderType('DINE_IN');
            setTableId('');
            setCustomerId('');
            setItems([emptyItem()]);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['orders'] }),
                queryClient.invalidateQueries({ queryKey: ['tables'] }),
                queryClient.invalidateQueries({ queryKey: ['inventory'] }),
                queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
            ]);
        },
        onError: (error: unknown) => {
            setSuccessMessage('');
            setCreateError(
                error instanceof Error ? error.message : 'Could not create order.',
            );
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) =>
            updateOrderStatus(orderId, status),
        onSuccess: async () => {
            setUpdateError('');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['orders'] }),
                queryClient.invalidateQueries({ queryKey: ['tables'] }),
                queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
            ]);
        },
        onError: (error: unknown) => {
            setUpdateError(
                error instanceof Error ? error.message : 'Could not update order status.',
            );
        },
    });

    const filteredOrders = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return [...orders]
            .filter((order) => {
                const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
                const matchesSearch =
                    !term ||
                    order.orderNumber?.toLowerCase().includes(term) ||
                    order.orderType?.toLowerCase().includes(term) ||
                    String(order.id).includes(term);
                return matchesStatus && matchesSearch;
            })
            .sort((a, b) =>
                (new Date(b.orderDate).getTime() || 0) -
                (new Date(a.orderDate).getTime() || 0),
            );
    }, [orders, searchTerm, statusFilter]);

    const statusCount = (status: OrderStatus) =>
        orders.filter((order) => order.status === status).length;

    const changeItem = (index: number, updates: Partial<DraftItem>) => {
        setItems((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...updates } : item,
            ),
        );
    };

    const handleCreateOrder = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCreateError('');
        setSuccessMessage('');

        if (items.length === 0 || items.some(
            (item) => !item.recipeId || !Number.isInteger(Number(item.quantity)) ||
                Number(item.quantity) <= 0,
        )) {
            setCreateError('Select a recipe and enter a valid quantity for every item.');
            return;
        }

        if (orderType === 'DINE_IN' && !tableId) {
            setCreateError('Please select an available table.');
            return;
        }

        if (orderType === 'PICKUP' &&
            (!customerId || !Number.isInteger(Number(customerId)) || Number(customerId) <= 0)) {
            setCreateError('Enter a valid Customer ID for the pickup order.');
            return;
        }

        const request: CreateOrderRequest = {
            order: {
                orderNumber: 'NEW',
                orderType,
                status: 'PENDING',
                totalAmount: 0,
                ...(orderType === 'DINE_IN'
                    ? { restaurantTable: { id: Number(tableId) } }
                    : { customer: { id: Number(customerId) } }),
            },
            items: items.map((item) => ({
                recipe: { id: Number(item.recipeId) },
                quantity: Number(item.quantity),
            })),
        };

        createMutation.mutate(request);
    };

    const handleStatusChange = (order: OrderSummary, status: OrderStatus) => {
        if (status === order.status) return;
        setUpdateError('');
        statusMutation.mutate({ orderId: order.id, status });
    };

    const inputClass =
        'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            Orders Management
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Create orders, view orders and manage their current status.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowCreateForm((value) => !value);
                                setCreateError('');
                                setSuccessMessage('');
                            }}
                            className="min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            {showCreateForm ? 'Close Form' : '+ Create Order'}
                        </button>
                        <Link
                            to="/dashboard"
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </header>

                {successMessage && (
                    <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        {successMessage}
                    </div>
                )}

                {showCreateForm && (
                    <section className="mb-7 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">Create New Order</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Select the order type and add one or more recipes.
                        </p>

                        <form onSubmit={handleCreateOrder} className="mt-5 space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Order Type
                                    <select
                                        value={orderType}
                                        onChange={(event) => {
                                            setOrderType(event.target.value as OrderType);
                                            setTableId('');
                                            setCustomerId('');
                                            setCreateError('');
                                        }}
                                        className={`${inputClass} mt-1.5`}
                                    >
                                        <option value="DINE_IN">Dine In</option>
                                        <option value="PICKUP">Pickup</option>
                                    </select>
                                </label>

                                {orderType === 'DINE_IN' ? (
                                    <label className="block text-sm font-medium text-slate-700">
                                        Available Table
                                        <select
                                            value={tableId}
                                            onChange={(event) => setTableId(event.target.value)}
                                            required
                                            className={`${inputClass} mt-1.5`}
                                        >
                                            <option value="">
                                                {tablesLoading ? 'Loading tables...' : 'Select table'}
                                            </option>
                                            {availableTables.map((table) => (
                                                <option key={table.id} value={table.id}>
                                                    Table {table.tableNumber} · Capacity {table.capacity}
                                                </option>
                                            ))}
                                        </select>
                                        {!tablesLoading && availableTables.length === 0 && (
                                            <span className="mt-1 block text-xs text-amber-700">
                                                No available tables. Add or free a table first.
                                            </span>
                                        )}
                                    </label>
                                ) : (
                                    <label className="block text-sm font-medium text-slate-700">
                                        Customer ID
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            required
                                            value={customerId}
                                            onChange={(event) => setCustomerId(event.target.value)}
                                            placeholder="Enter existing customer ID"
                                            className={`${inputClass} mt-1.5`}
                                        />
                                        <span className="mt-1 block text-xs font-normal text-slate-500">
                                            Enter the ID of an existing customer account.
                                        </span>
                                    </label>
                                )}
                            </div>

                            <div>
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="font-semibold text-slate-800">Order Items</h3>
                                    <button
                                        type="button"
                                        onClick={() => setItems((current) => [...current, emptyItem()])}
                                        className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                                    >
                                        + Add Item
                                    </button>
                                </div>

                                {recipesLoading ? (
                                    <p className="text-sm text-slate-500">Loading recipes...</p>
                                ) : availableRecipes.length === 0 ? (
                                    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                                        No available recipes found. Create or enable a recipe first.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {items.map((item, index) => {
                                            const selectedRecipe = recipes.find(
                                                (recipe) => recipe.id === Number(item.recipeId),
                                            );
                                            return (
                                                <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_120px_150px_auto] sm:items-end">
                                                    <label className="block text-sm font-medium text-slate-700">
                                                        Recipe
                                                        <select
                                                            required
                                                            value={item.recipeId}
                                                            onChange={(event) =>
                                                                changeItem(index, { recipeId: event.target.value })
                                                            }
                                                            className={`${inputClass} mt-1.5`}
                                                        >
                                                            <option value="">Select recipe</option>
                                                            {availableRecipes.map((recipe) => (
                                                                <option key={recipe.id} value={recipe.id}>
                                                                    {recipe.name} — {formatCurrency(recipe.price)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>

                                                    <label className="block text-sm font-medium text-slate-700">
                                                        Quantity
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            required
                                                            value={item.quantity}
                                                            onChange={(event) =>
                                                                changeItem(index, {
                                                                    quantity: Number(event.target.value),
                                                                })
                                                            }
                                                            className={`${inputClass} mt-1.5`}
                                                        />
                                                    </label>

                                                    <div className="text-sm">
                                                        <span className="block text-slate-500">Subtotal</span>
                                                        <span className="mt-3 block font-semibold text-slate-800">
                                                            {formatCurrency((selectedRecipe?.price ?? 0) * item.quantity)}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={items.length === 1}
                                                        onClick={() =>
                                                            setItems((current) =>
                                                                current.filter((_, itemIndex) => itemIndex !== index),
                                                            )
                                                        }
                                                        className="min-h-11 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                        aria-label={`Remove item ${index + 1}`}
                                                    >
                                                        Remove
                                                    </button>

                                                    <RequiredIngredients
                                                        recipeId={Number(item.recipeId)}
                                                        orderQuantity={Number(item.quantity) || 0}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                                <div>
                                    <p className="text-sm text-slate-500">Estimated Total</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {formatCurrency(totalAmount)}
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={
                                        createMutation.isPending ||
                                        recipesLoading ||
                                        availableRecipes.length === 0 ||
                                        (orderType === 'DINE_IN' &&
                                            (tablesLoading || availableTables.length === 0))
                                    }
                                    className="min-h-11 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create Order'}
                                </button>
                            </div>

                            {createError && (
                                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {createError}
                                </div>
                            )}
                        </form>
                    </section>
                )}

                <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {statuses.map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setStatusFilter(statusFilter === status ? 'ALL' : status)}
                            className={`rounded-xl border bg-white p-4 text-left shadow-sm transition ${
                                statusFilter === status
                                    ? 'border-emerald-500 ring-2 ring-emerald-100'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <p className="text-xs font-medium text-slate-500">
                                {status.replaceAll('_', ' ')}
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {statusCount(status)}
                            </p>
                        </button>
                    ))}
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold text-slate-800">All Orders</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {filteredOrders.length} order(s) found
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search order..."
                                aria-label="Search orders"
                                className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                aria-label="Filter by status"
                                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                            >
                                <option value="ALL">All statuses</option>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status.replaceAll('_', ' ')}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="min-h-11 rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    {updateError && (
                        <div role="alert" className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {updateError}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                            Loading orders...
                        </div>
                    ) : isError ? (
                        <div className="p-10 text-center">
                            <p className="text-sm text-red-600">
                                Failed to load orders. Check your connection or login status.
                            </p>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                            >
                                Try again
                            </button>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                            No matching orders found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Order</th>
                                    <th className="px-5 py-4 font-semibold">Type</th>
                                    <th className="px-5 py-4 font-semibold">Date</th>
                                    <th className="px-5 py-4 font-semibold">Amount</th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                    <th className="px-5 py-4 font-semibold">Update Status</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {filteredOrders.map((order) => {
                                    const isTerminal =
                                        order.status === 'COMPLETED' ||
                                        order.status === 'CANCELLED';
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                                                {order.orderNumber || `#${order.id}`}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                {order.orderType?.replaceAll('_', ' ') ?? '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                {formatDate(order.orderDate)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                                                {formatCurrency(order.totalAmount)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        statusStyles[order.status] ?? 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {order.status?.replaceAll('_', ' ') ?? 'UNKNOWN'}
                                                    </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <select
                                                    value={order.status}
                                                    disabled={isTerminal || statusMutation.isPending}
                                                    onChange={(event) =>
                                                        handleStatusChange(order, event.target.value as OrderStatus)
                                                    }
                                                    aria-label={`Update status for ${order.orderNumber}`}
                                                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                                >
                                                    {statuses.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status.replaceAll('_', ' ')}
                                                        </option>
                                                    ))}
                                                </select>
                                                {isTerminal && (
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Final status
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
};

export default OrdersPage;