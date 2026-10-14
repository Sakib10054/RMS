
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    LoaderCircle,
    Plus,
    Search,
    X,
    Package,
} from 'lucide-react';
import {
    createIngredient,
    getAllIngredients,
    type CreateIngredientRequest,
} from '../services/ingredientService';

const initialForm: CreateIngredientRequest = {
    name: '',
    unit: '',
    minimumStock: 0,
};

export default function IngredientsPage() {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CreateIngredientRequest>(initialForm);
    const [formError, setFormError] = useState('');

    const ingredientsQuery = useQuery({
        queryKey: ['ingredients'],
        queryFn: getAllIngredients,
    });

    const createMutation = useMutation({
        mutationFn: createIngredient,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['ingredients'] });
            await queryClient.invalidateQueries({ queryKey: ['inventory'] });
            await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
            setForm(initialForm);
            setFormError('');
            setShowForm(false);
        },
        onError: (error: Error) => {
            setFormError(error.message || 'Could not create ingredient.');
        },
    });

    const ingredients = ingredientsQuery.data ?? [];

    const filteredIngredients = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return ingredients;

        return ingredients.filter((ingredient) =>
            ingredient.name.toLowerCase().includes(term),
        );
    }, [ingredients, search]);

    const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');

        if (!form.name.trim()) {
            setFormError('Ingredient name is required.');
            return;
        }

        if (!form.unit.trim()) {
            setFormError('Unit is required.');
            return;
        }

        if (!Number.isFinite(form.minimumStock) || form.minimumStock < 0) {
            setFormError('Minimum stock cannot be negative.');
            return;
        }

        createMutation.mutate({
            name: form.name.trim(),
            unit: form.unit.trim(),
            minimumStock: form.minimumStock,
        });
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                            <Package size={23} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Ingredient Management
                            </h1>
                            <p className="text-sm text-slate-500">
                                Create and manage restaurant ingredients
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setShowForm((value) => !value);
                            setFormError('');
                        }}
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        {showForm ? <X size={18} /> : <Plus size={18} />}
                        <span>{showForm ? 'Close' : 'Add Ingredient'}</span>
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {showForm && (
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">
                            Add New Ingredient
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Ingredient Name
                                    </label>
                                    <input
                                        value={form.name}
                                        onChange={(event) =>
                                            setForm({ ...form, name: event.target.value })
                                        }
                                        placeholder="e.g. Chicken"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Unit
                                    </label>
                                    <input
                                        value={form.unit}
                                        onChange={(event) =>
                                            setForm({ ...form, unit: event.target.value })
                                        }
                                        placeholder="e.g. kg, liter, pcs"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Minimum Stock
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={form.minimumStock}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                minimumStock: Number(event.target.value),
                                            })
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        required
                                    />
                                </div>
                            </div>

                            {formError && (
                                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    <AlertCircle size={17} />
                                    {formError}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {createMutation.isPending && (
                                        <LoaderCircle size={17} className="animate-spin" />
                                    )}
                                    {createMutation.isPending ? 'Saving...' : 'Save Ingredient'}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Ingredient List
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {ingredients.length} ingredient(s) available
                            </p>
                        </div>

                        <div className="relative w-full sm:max-w-xs">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search ingredients..."
                                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>
                    </div>

                    {ingredientsQuery.isLoading ? (
                        <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
                            <LoaderCircle size={19} className="animate-spin" />
                            Loading ingredients...
                        </div>
                    ) : ingredientsQuery.isError ? (
                        <div className="p-8 text-center text-sm text-red-600">
                            {ingredientsQuery.error.message || 'Failed to load ingredients.'}
                            <button
                                type="button"
                                onClick={() => ingredientsQuery.refetch()}
                                className="ml-2 font-semibold underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredIngredients.length === 0 ? (
                        <div className="p-12 text-center">
                            <Package size={32} className="mx-auto mb-3 text-slate-300" />
                            <p className="font-medium text-slate-700">
                                No ingredients found
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Add an ingredient or try another search.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">ID</th>
                                    <th className="px-5 py-3 font-semibold">Name</th>
                                    <th className="px-5 py-3 font-semibold">Unit</th>
                                    <th className="px-5 py-3 text-right font-semibold">
                                        Minimum Stock
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {filteredIngredients.map((ingredient) => (
                                    <tr key={ingredient.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-4 text-slate-500">
                                            #{ingredient.id}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-slate-900">
                                            {ingredient.name}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {ingredient.unit}
                                        </td>
                                        <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                                            {ingredient.minimumStock}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}