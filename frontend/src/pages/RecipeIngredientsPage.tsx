
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    ChefHat,
    LoaderCircle,
    Plus,
    Trash2,
    Utensils,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllRecipes } from '../services/recipeService';
import {
    addIngredientToRecipe,
    getAllIngredients,
    getRecipeIngredients,
    removeIngredientFromRecipe,
} from '../services/recipeIngredientService';

export default function RecipeIngredientsPage() {
    const { recipeId: routeId } = useParams();
    const recipeId = Number(routeId);
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();

    const [ingredientId, setIngredientId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [error, setError] = useState('');

    const validId = Number.isInteger(recipeId) && recipeId > 0;

    const recipesQuery = useQuery({
        queryKey: ['recipes'],
        queryFn: getAllRecipes,
        enabled: validId,
    });

    const ingredientsQuery = useQuery({
        queryKey: ['ingredients'],
        queryFn: getAllIngredients,
    });

    const recipeIngredientsQuery = useQuery({
        queryKey: ['recipe-ingredients', recipeId],
        queryFn: () => getRecipeIngredients(recipeId),
        enabled: validId,
    });

    const recipe = recipesQuery.data?.find((item) => item.id === recipeId);
    const assigned = recipeIngredientsQuery.data ?? [];
    const ingredients = ingredientsQuery.data ?? [];

    const assignedIds = useMemo(
        () => new Set(assigned.map((item) => item.ingredient?.id)),
        [assigned],
    );

    const availableIngredients = ingredients.filter(
        (item) => !assignedIds.has(item.id),
    );

    const addMutation = useMutation({
        mutationFn: addIngredientToRecipe,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['recipe-ingredients', recipeId],
            });
            setIngredientId('');
            setQuantity('');
            setError('');
        },
        onError: (err: Error) => {
            setError(err.message || 'Could not add ingredient.');
        },
    });

    const removeMutation = useMutation({
        mutationFn: removeIngredientFromRecipe,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['recipe-ingredients', recipeId],
            });
        },
        onError: (err: Error) => {
            setError(err.message || 'Could not remove ingredient.');
        },
    });

    const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        const id = Number(ingredientId);
        const amount = Number(quantity);

        if (!Number.isInteger(id) || id <= 0) {
            setError('Please select an ingredient.');
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Quantity must be greater than zero.');
            return;
        }

        addMutation.mutate({
            recipeId,
            ingredientId: id,
            quantity: amount,
        });
    };

    if (!validId) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                    <p className="font-semibold text-slate-800">Invalid recipe ID.</p>
                    <Link to="/recipes" className="mt-3 inline-block text-sm text-emerald-700 underline">
                        Back to Recipes
                    </Link>
                </div>
            </main>
        );
    }

    const isLoading =
        recipesQuery.isLoading ||
        ingredientsQuery.isLoading ||
        recipeIngredientsQuery.isLoading;

    const hasError =
        recipesQuery.isError ||
        ingredientsQuery.isError ||
        recipeIngredientsQuery.isError;

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                            <ChefHat size={23} />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900">
                                Restaurant<span className="text-emerald-600">OS</span>
                            </h1>
                            <p className="text-xs text-slate-500">Management System</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.name ?? 'User'}
            </span>
                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Link
                    to="/recipes"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-700"
                >
                    <ArrowLeft size={16} />
                    Back to Recipes
                </Link>

                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
                        <Utensils size={17} />
                        Recipe Configuration
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        Recipe Ingredients
                    </h2>
                    <p className="mt-2 text-slate-500">
                        {recipe ? `Manage ingredients for ${recipe.name}.` : 'View and manage the ingredients assigned to this recipe.'}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-500">
                        <LoaderCircle className="mr-2 animate-spin" size={20} />
                        Loading recipe ingredients...
                    </div>
                ) : hasError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                        Could not load recipe or ingredient data. Check the backend and try again.
                        <button
                            type="button"
                            onClick={() => {
                                recipesQuery.refetch();
                                ingredientsQuery.refetch();
                                recipeIngredientsQuery.refetch();
                            }}
                            className="ml-2 font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : !recipe ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <p className="font-semibold text-slate-800">Recipe not found.</p>
                        <Link to="/recipes" className="mt-3 inline-block text-sm text-emerald-700 underline">
                            Return to recipe list
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                            <div className="mb-5 flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <ChefHat size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900">{recipe.name}</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {recipe.description || 'No description provided.'}
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-700">
                                        Price: ৳{Number(recipe.price).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-5">
                                <h3 className="mb-4 font-semibold text-slate-900">Add Ingredient</h3>
                                <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                                    <div>
                                        <label htmlFor="ingredient" className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Ingredient
                                        </label>
                                        <select
                                            id="ingredient"
                                            required
                                            value={ingredientId}
                                            onChange={(event) => setIngredientId(event.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        >
                                            <option value="">Select ingredient</option>
                                            {availableIngredients.map((ingredient) => (
                                                <option key={ingredient.id} value={ingredient.id}>
                                                    {ingredient.name} ({ingredient.unit})
                                                </option>
                                            ))}
                                        </select>
                                        {availableIngredients.length === 0 && (
                                            <p className="mt-1 text-xs text-slate-500">
                                                No unassigned ingredients available.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Quantity
                                        </label>
                                        <input
                                            id="quantity"
                                            type="number"
                                            min="0.000001"
                                            step="any"
                                            required
                                            value={quantity}
                                            onChange={(event) => setQuantity(event.target.value)}
                                            placeholder="e.g. 0.25"
                                            className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!availableIngredients.length || addMutation.isPending}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {addMutation.isPending ? (
                                            <LoaderCircle size={17} className="animate-spin" />
                                        ) : (
                                            <Plus size={17} />
                                        )}
                                        Add
                                    </button>
                                </form>

                                {error && (
                                    <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                        {error}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div>
                                    <h3 className="font-semibold text-slate-900">Assigned Ingredients</h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {assigned.length} ingredient{assigned.length === 1 ? '' : 's'} assigned
                                    </p>
                                </div>
                            </div>

                            {assigned.length === 0 ? (
                                <div className="px-6 py-14 text-center">
                                    <Utensils className="mx-auto text-slate-300" size={34} />
                                    <p className="mt-3 font-semibold text-slate-800">No ingredients assigned</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Use the form above to add ingredients to this recipe.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[540px] text-left text-sm">
                                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4 font-semibold">Ingredient</th>
                                            <th className="px-5 py-4 font-semibold">Quantity</th>
                                            <th className="px-5 py-4 font-semibold">Unit</th>
                                            <th className="px-5 py-4 text-right font-semibold">Action</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                        {assigned.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/70">
                                                <td className="px-5 py-4 font-semibold text-slate-900">
                                                    {item.ingredient?.name ?? 'Ingredient'}
                                                </td>
                                                <td className="px-5 py-4 text-slate-700">
                                                    {Number(item.quantity).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-4 text-slate-500">
                                                    {item.ingredient?.unit ?? '—'}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        aria-label={`Remove ${item.ingredient?.name ?? 'ingredient'}`}
                                                        disabled={removeMutation.isPending}
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    `Remove ${item.ingredient?.name ?? 'this ingredient'} from ${recipe.name}?`,
                                                                )
                                                            ) {
                                                                setError('');
                                                                removeMutation.mutate({
                                                                    recipeId,
                                                                    ingredientId: item.ingredient.id,
                                                                });
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        <Trash2 size={15} />
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}