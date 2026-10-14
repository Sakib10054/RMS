
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    CalendarDays,
    CircleDollarSign,
    PackagePlus,
    Plus,
    RefreshCw,
    Search,
    ShoppingBag,
    X,
} from 'lucide-react';
import { api } from '../lib/api';
import {
    purchaseService,
    type CreatePurchaseRequest,
    type Purchase,
} from '../services/purchaseService';

interface Ingredient {
    id: number;
    name: string;
    unit: string;
    minimumStock: number;
}

const currency = (value: number) =>
    new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        maximumFractionDigits: 2,
    }).format(value || 0);

const dateLabel = (value: string) => {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

function StatCard({
                      label,
                      value,
                      note,
                      icon: Icon,
                  }: {
    label: string;
    value: string | number;
    note: string;
    icon: typeof ShoppingBag;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
                    <p className="mt-1 text-xs text-gray-500">{note}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

export default function PurchasesPage() {
    const queryClient = useQueryClient();

    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [ingredientId, setIngredientId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [supplier, setSupplier] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(
        new Date().toLocaleDateString('en-CA'),
    );
    const [formError, setFormError] = useState('');

    const purchasesQuery = useQuery({
        queryKey: ['purchases'],
        queryFn: purchaseService.getAll,
    });

    const ingredientsQuery = useQuery({
        queryKey: ['ingredients'],
        queryFn: async () => {
            const response = await api.get<Ingredient[]>('/ingredients');
            return response.data;
        },
    });

    const purchases = purchasesQuery.data ?? [];
    const ingredients = ingredientsQuery.data ?? [];

    const createMutation = useMutation({
        mutationFn: (data: CreatePurchaseRequest) => purchaseService.create(data),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['purchases'] }),
                queryClient.invalidateQueries({ queryKey: ['inventory'] }),
                queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
            ]);
            setShowForm(false);
            setIngredientId('');
            setQuantity('');
            setUnitPrice('');
            setSupplier('');
            setPurchaseDate(new Date().toLocaleDateString('en-CA'));
            setFormError('');
        },
        onError: (error) => {
            setFormError(
                error instanceof Error ? error.message : 'Failed to create purchase.',
            );
        },
    });

    const filteredPurchases = useMemo(() => {
        const term = search.trim().toLowerCase();

        return purchases.filter((purchase) => {
            const name = purchase.ingredient?.name ?? '';
            const supplierName = purchase.supplier ?? '';

            const matchesSearch =
                !term ||
                name.toLowerCase().includes(term) ||
                supplierName.toLowerCase().includes(term) ||
                String(purchase.id).includes(term);

            const matchesStart = !startDate || purchase.purchaseDate >= startDate;
            const matchesEnd = !endDate || purchase.purchaseDate <= endDate;

            return matchesSearch && matchesStart && matchesEnd;
        });
    }, [purchases, search, startDate, endDate]);

    const totalSpend = purchases.reduce(
        (sum, purchase) => sum + Number(purchase.totalPrice || 0),
        0,
    );

    const visibleSpend = filteredPurchases.reduce(
        (sum, purchase) => sum + Number(purchase.totalPrice || 0),
        0,
    );

    const totalQuantity = purchases.reduce(
        (sum, purchase) => sum + Number(purchase.quantity || 0),
        0,
    );

    const computedTotal =
        Number(quantity) > 0 && Number(unitPrice) >= 0
            ? Number(quantity) * Number(unitPrice)
            : 0;

    const submitPurchase = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');

        const selectedIngredientId = Number(ingredientId);
        const qty = Number(quantity);
        const price = Number(unitPrice);

        if (!selectedIngredientId || !ingredients.some((i) => i.id === selectedIngredientId)) {
            setFormError('Please select a valid ingredient.');
            return;
        }

        if (!Number.isFinite(qty) || qty <= 0) {
            setFormError('Quantity must be greater than zero.');
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            setFormError('Unit price cannot be negative.');
            return;
        }

        if (!purchaseDate) {
            setFormError('Purchase date is required.');
            return;
        }

        const payload: CreatePurchaseRequest = {
            ingredient: { id: selectedIngredientId },
            quantity: qty,
            unitPrice: price,
            totalPrice: qty * price,
            supplier: supplier.trim() || undefined,
            purchaseDate,
        };

        createMutation.mutate(payload);
    };

    return (
        <main className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Purchases Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Record ingredient purchases and track spending.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => void purchasesQuery.refetch()}
                        disabled={purchasesQuery.isFetching}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={16}
                            className={purchasesQuery.isFetching ? 'animate-spin' : ''}
                        />
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFormError('');
                            setShowForm(true);
                        }}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        <Plus size={17} />
                        New Purchase
                    </button>
                </div>
            </div>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                    label="Total Purchases"
                    value={purchases.length}
                    note="All recorded purchases"
                    icon={ShoppingBag}
                />
                <StatCard
                    label="Total Purchase Cost"
                    value={currency(totalSpend)}
                    note="All-time recorded spend"
                    icon={CircleDollarSign}
                />
                <StatCard
                    label="Quantity Purchased"
                    value={totalQuantity.toLocaleString()}
                    note="Combined purchase quantity"
                    icon={PackagePlus}
                />
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-200 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-900">Purchase History</h2>
                            <p className="mt-1 text-xs text-gray-500">
                                Review your purchase records and supplier details.
                            </p>
                        </div>
                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search ingredient, supplier, ID..."
                                className="h-11 w-full rounded-xl border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:w-72"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                            <CalendarDays size={16} />
                            Date range
                        </div>
                        <input
                            type="date"
                            aria-label="Start date"
                            value={startDate}
                            max={endDate || undefined}
                            onChange={(event) => setStartDate(event.target.value)}
                            className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                        />
                        <span className="hidden text-gray-400 sm:inline">to</span>
                        <input
                            type="date"
                            aria-label="End date"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(event) => setEndDate(event.target.value)}
                            className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                        />
                        {(startDate || endDate || search) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                    setSearch('');
                                }}
                                className="h-10 rounded-lg px-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                {purchasesQuery.isLoading ? (
                    <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-gray-500">
                        <RefreshCw size={20} className="animate-spin text-blue-600" />
                        Loading purchases...
                    </div>
                ) : purchasesQuery.isError ? (
                    <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 text-center">
                        <AlertCircle size={30} className="text-red-500" />
                        <p className="font-semibold text-gray-900">
                            Could not load purchases
                        </p>
                        <p className="text-sm text-gray-500">
                            {purchasesQuery.error instanceof Error
                                ? purchasesQuery.error.message
                                : 'Please try again.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => void purchasesQuery.refetch()}
                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredPurchases.length === 0 ? (
                    <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-5 text-center">
                        <ShoppingBag size={30} className="text-gray-400" />
                        <p className="font-semibold text-gray-900">
                            {purchases.length === 0
                                ? 'No purchases yet'
                                : 'No matching purchases'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {purchases.length === 0
                                ? 'Create a purchase to add stock to your inventory.'
                                : 'Change the search or date filters.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-[780px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Purchase ID</th>
                                    <th className="px-5 py-4 font-semibold">Ingredient</th>
                                    <th className="px-5 py-4 font-semibold">Quantity</th>
                                    <th className="px-5 py-4 font-semibold">Unit Price</th>
                                    <th className="px-5 py-4 font-semibold">Total</th>
                                    <th className="px-5 py-4 font-semibold">Supplier</th>
                                    <th className="px-5 py-4 font-semibold">Date</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {filteredPurchases.map((purchase: Purchase) => (
                                    <tr key={purchase.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-4 font-semibold text-gray-700">
                                            #{purchase.id}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-gray-900">
                                            {purchase.ingredient?.name ?? 'Unknown ingredient'}
                                        </td>
                                        <td className="px-5 py-4 text-gray-700">
                                            {Number(purchase.quantity).toLocaleString()}{' '}
                                            {purchase.ingredient?.unit ?? ''}
                                        </td>
                                        <td className="px-5 py-4 text-gray-700">
                                            {currency(Number(purchase.unitPrice))}
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-gray-900">
                                            {currency(Number(purchase.totalPrice))}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {purchase.supplier || '—'}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {dateLabel(purchase.purchaseDate)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-gray-200 px-5 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredPurchases.length} of {purchases.length}{' '}
                  purchases
              </span>
                            <span>Filtered total: {currency(visibleSpend)}</span>
                        </div>
                    </>
                )}
            </section>

            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !createMutation.isPending) {
                            setShowForm(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="purchase-form-title"
                        className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl"
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                            <div>
                                <h2
                                    id="purchase-form-title"
                                    className="text-lg font-bold text-gray-900"
                                >
                                    Create Purchase
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Purchase cost and inventory stock will be updated.
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close form"
                                disabled={createMutation.isPending}
                                onClick={() => setShowForm(false)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={submitPurchase} className="space-y-4 p-5">
                            <div>
                                <label
                                    htmlFor="purchase-ingredient"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Ingredient *
                                </label>
                                <select
                                    id="purchase-ingredient"
                                    required
                                    value={ingredientId}
                                    onChange={(event) => setIngredientId(event.target.value)}
                                    disabled={ingredientsQuery.isLoading || createMutation.isPending}
                                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">Select ingredient</option>
                                    {ingredients.map((ingredient) => (
                                        <option key={ingredient.id} value={ingredient.id}>
                                            {ingredient.name} ({ingredient.unit})
                                        </option>
                                    ))}
                                </select>
                                {ingredientsQuery.isError && (
                                    <p className="mt-1 text-xs text-red-600">
                                        Could not load ingredients. Refresh and try again.
                                    </p>
                                )}
                                {!ingredientsQuery.isLoading &&
                                    !ingredientsQuery.isError &&
                                    ingredients.length === 0 && (
                                        <p className="mt-1 text-xs text-amber-700">
                                            Add an ingredient first before recording a purchase.
                                        </p>
                                    )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="purchase-quantity"
                                        className="mb-1.5 block text-sm font-medium text-gray-700"
                                    >
                                        Quantity *
                                    </label>
                                    <input
                                        id="purchase-quantity"
                                        type="number"
                                        min="0.001"
                                        step="any"
                                        required
                                        value={quantity}
                                        onChange={(event) => setQuantity(event.target.value)}
                                        placeholder="e.g. 10"
                                        className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                    {ingredientId && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Unit: {ingredients.find((i) => i.id === Number(ingredientId))?.unit ?? '—'}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="purchase-unit-price"
                                        className="mb-1.5 block text-sm font-medium text-gray-700"
                                    >
                                        Unit Price (BDT) *
                                    </label>
                                    <input
                                        id="purchase-unit-price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={unitPrice}
                                        onChange={(event) => setUnitPrice(event.target.value)}
                                        placeholder="e.g. 120"
                                        className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="purchase-supplier"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Supplier
                                </label>
                                <input
                                    id="purchase-supplier"
                                    value={supplier}
                                    onChange={(event) => setSupplier(event.target.value)}
                                    placeholder="Supplier name (optional)"
                                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="purchase-date"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Purchase Date *
                                </label>
                                <input
                                    id="purchase-date"
                                    type="date"
                                    required
                                    value={purchaseDate}
                                    onChange={(event) => setPurchaseDate(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-blue-900">
                    Estimated Total
                  </span>
                                    <span className="text-lg font-bold text-blue-900">
                    {currency(computedTotal)}
                  </span>
                                </div>
                                <p className="mt-1 text-xs text-blue-700">
                                    Calculated from quantity × unit price.
                                </p>
                            </div>

                            {formError && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                                >
                                    {formError}
                                </div>
                            )}

                            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={createMutation.isPending}
                                    onClick={() => setShowForm(false)}
                                    className="min-h-11 rounded-xl border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        createMutation.isPending ||
                                        ingredientsQuery.isLoading ||
                                        ingredients.length === 0
                                    }
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {createMutation.isPending && (
                                        <RefreshCw size={16} className="animate-spin" />
                                    )}
                                    {createMutation.isPending ? 'Saving...' : 'Save Purchase'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}