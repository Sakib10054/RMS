
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    ChefHat,
    CircleDollarSign,
    LoaderCircle,
    Plus,
    Search,
    Utensils,
    X,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    createRecipe,
    getAllRecipes,
    updateRecipe,
    deleteRecipe,
    uploadRecipeImage,
    type CreateRecipeRequest,
} from '../services/recipeService';
import {
    addIngredientToRecipe,
    getAllIngredients,
    type Ingredient,
} from '../services/recipeIngredientService';

const initialForm: CreateRecipeRequest = {
    name: '',
    description: '',
    price: 0,
    available: true,
    imageUrl: '',
    discountPercent: 0,
    offerTag: '',
};

type RecipeIngredientDraft = {
    ingredientId: string;
    quantity: string;
};

const emptyIngredient = (): RecipeIngredientDraft => ({
    ingredientId: '',
    quantity: '',
});

export default function RecipesPage() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CreateRecipeRequest>(initialForm);
    const [formError, setFormError] = useState('');
    const [requiredIngredients, setRequiredIngredients] = useState<RecipeIngredientDraft[]>([emptyIngredient()]);
    const [recipeImageFile, setRecipeImageFile] = useState<File | null>(null);
    const [recipeImagePreview, setRecipeImagePreview] = useState<string>('');
    const [editingRecipe, setEditingRecipe] = useState<import('../services/recipeService').Recipe | null>(null);
    const [editForm, setEditForm] = useState<CreateRecipeRequest>(initialForm);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editError, setEditError] = useState('');

    const recipesQuery = useQuery({
        queryKey: ['recipes'],
        queryFn: getAllRecipes,
    });

    const ingredientsQuery = useQuery<Ingredient[]>({
        queryKey: ['ingredients'],
        queryFn: getAllIngredients,
        enabled: showForm,
    });

    const ingredients = ingredientsQuery.data ?? [];

    const createMutation = useMutation({
        mutationFn: async (data: CreateRecipeRequest) => {
            const recipe = await createRecipe({ ...data, imageUrl: '' });

            const recipeWithImage = recipeImageFile
                ? await uploadRecipeImage(recipe.id, recipeImageFile)
                : recipe;

            const ingredientRows = requiredIngredients.map((row) => ({
                ingredientId: Number(row.ingredientId),
                quantity: Number(row.quantity),
            }));

            for (const row of ingredientRows) {
                await addIngredientToRecipe({
                    recipeId: recipe.id,
                    ingredientId: row.ingredientId,
                    quantity: row.quantity,
                });
            }

            return recipeWithImage;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['recipes'] });
            await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
            setForm(initialForm);
            setRequiredIngredients([emptyIngredient()]);
            setRecipeImageFile(null);
            setRecipeImagePreview('');
            setFormError('');
            setShowForm(false);
        },
        onError: (error: Error) => {
            setFormError(
                error.message ||
                'Recipe was created, but one or more required ingredients could not be assigned. Open Manage to finish the recipe.',
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!editingRecipe) throw new Error('Recipe not selected');
            const updated = await updateRecipe(editingRecipe.id, {
                ...editForm,
                name: editForm.name.trim(),
                description: editForm.description.trim(),
                offerTag: editForm.offerTag?.trim(),
            });
            if (editImageFile) {
                return uploadRecipeImage(editingRecipe.id, editImageFile);
            }
            return updated;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['recipes'] });
            setEditingRecipe(null);
            setEditImageFile(null);
            setEditError('');
        },
        onError: (error: Error) => setEditError(error.message || 'Could not update recipe.'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteRecipe,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['recipes'] });
        },
        onError: (error: Error) => setFormError(error.message || 'Could not delete recipe.'),
    });

    const startEdit = (recipe: import('../services/recipeService').Recipe) => {
        setEditingRecipe(recipe);
        setEditForm({
            name: recipe.name,
            description: recipe.description ?? '',
            price: Number(recipe.price),
            available: recipe.available,
            imageUrl: recipe.imageUrl ?? '',
            discountPercent: Number(recipe.discountPercent ?? 0),
            offerTag: recipe.offerTag ?? '',
        });
        setEditImageFile(null);
        setEditError('');
    };

    const recipes = recipesQuery.data ?? [];

    const filteredRecipes = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return recipes;

        return recipes.filter((recipe) =>
            `${recipe.name} ${recipe.description ?? ''}`
                .toLowerCase()
                .includes(term),
        );
    }, [recipes, search]);

    const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');

        if (!form.name.trim()) {
            setFormError('Recipe name is required.');
            return;
        }

        if (!Number.isFinite(form.price) || form.price < 0) {
            setFormError('Enter a valid non-negative price.');
            return;
        }
        if (Number(form.discountPercent ?? 0) < 0 || Number(form.discountPercent ?? 0) > 100) {
            setFormError('Discount must be between 0 and 100%.');
            return;
        }

        if (ingredientsQuery.isLoading) {
            setFormError('Please wait for the ingredient list to finish loading.');
            return;
        }

        if (ingredientsQuery.isError) {
            setFormError('Could not load ingredients. Please try again.');
            return;
        }

        const validIngredients = requiredIngredients.filter(
            (row) => row.ingredientId.trim() !== '' || row.quantity.trim() !== '',
        );

        if (validIngredients.length === 0) {
            setFormError('Add at least one required ingredient.');
            return;
        }

        if (validIngredients.length !== requiredIngredients.length) {
            setFormError('Complete or remove every ingredient row.');
            return;
        }

        const selectedIds = validIngredients.map((row) => Number(row.ingredientId));
        if (new Set(selectedIds).size !== selectedIds.length) {
            setFormError('Each ingredient can only be added once.');
            return;
        }

        if (validIngredients.some((row) => !Number.isFinite(Number(row.quantity)) || Number(row.quantity) <= 0)) {
            setFormError('Ingredient quantity must be greater than 0.');
            return;
        }

        createMutation.mutate({
            name: form.name.trim(),
            description: form.description.trim(),
            price: form.price,
            available: form.available,
            imageUrl: '',
            discountPercent: Number(form.discountPercent ?? 0),
            offerTag: form.offerTag?.trim(),
        });
    };

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
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Link
                    to="/dashboard"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-700"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>

                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
                            <Utensils size={17} />
                            Menu Management
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            Recipes
                        </h2>
                        <p className="mt-2 text-slate-500">
                            Manage your restaurant dishes and their ingredients.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setFormError('');
                            setForm(initialForm);
                            setRequiredIngredients([emptyIngredient()]);
                            setShowForm(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                        <Plus size={18} />
                        Add Recipe
                    </button>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm text-slate-500">Total Recipes</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{recipes.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm text-slate-500">Available</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-600">
                            {recipes.filter((recipe) => recipe.available).length}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm text-slate-500">Unavailable</p>
                        <p className="mt-2 text-2xl font-bold text-slate-700">
                            {recipes.filter((recipe) => !recipe.available).length}
                        </p>
                    </div>
                </div>

                <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <Search size={18} className="shrink-0 text-slate-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search recipes..."
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            aria-label="Clear search"
                            className="text-slate-400 hover:text-slate-700"
                        >
                            <X size={17} />
                        </button>
                    )}
                </div>

                {recipesQuery.isLoading ? (
                    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-500">
                        <LoaderCircle className="mr-2 animate-spin" size={20} />
                        Loading recipes...
                    </div>
                ) : recipesQuery.isError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                        Could not load recipes. Check that the backend is running and try again.
                        <button
                            type="button"
                            onClick={() => recipesQuery.refetch()}
                            className="ml-2 font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredRecipes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                        <ChefHat className="mx-auto text-slate-300" size={36} />
                        <h3 className="mt-3 font-semibold text-slate-800">
                            {search ? 'No matching recipes' : 'No recipes yet'}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {search ? 'Try another search term.' : 'Add your first recipe to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Recipe</th>
                                    <th className="px-6 py-4 font-semibold">Price</th>
                                    <th className="px-6 py-4 font-semibold">Availability</th>
                                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {filteredRecipes.map((recipe) => (
                                    <tr key={recipe.id} className="hover:bg-slate-50/70">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                                    <ChefHat size={19} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900">{recipe.name}</p>
                                                    <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                                                        {recipe.description || 'No description'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700">
                                            <div className="flex items-center gap-2"><CircleDollarSign size={15} className="text-slate-400"/><span>৳{Number(recipe.discountedPrice ?? recipe.price).toFixed(2)}</span>{Number(recipe.discountPercent ?? 0)>0&&<del className="text-xs text-slate-400">৳{Number(recipe.price).toFixed(2)}</del>}</div>
                                            {recipe.offerTag&&<span className="mt-1 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">{recipe.offerTag}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            recipe.available
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}>
                          {recipe.available ? `Available · ${recipe.availableUnits ?? 0} unit(s)` : 'Unavailable'}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <Link
                                                    to={`/recipes/${recipe.id}/ingredients`}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                                >
                                                    <Utensils size={15} />
                                                    Ingredients
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(recipe)}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={deleteMutation.isPending}
                                                    onClick={() => {
                                                        if (window.confirm(`Delete recipe "${recipe.name}"? This will remove its ingredient mappings.`)) {
                                                            deleteMutation.mutate(recipe.id);
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="recipe-form-title"
                        className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h3 id="recipe-form-title" className="text-xl font-bold text-slate-900">
                                    Add New Recipe
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Enter the dish details below.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                aria-label="Close form"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label htmlFor="recipe-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Recipe Name
                                </label>
                                <input
                                    id="recipe-name"
                                    required
                                    maxLength={255}
                                    value={form.name}
                                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                    placeholder="e.g. Chicken Burger"
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            <div>
                                <label htmlFor="recipe-description" className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Description
                                </label>
                                <textarea
                                    id="recipe-description"
                                    rows={3}
                                    maxLength={1000}
                                    value={form.description}
                                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                    placeholder="Briefly describe this dish..."
                                    className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            <div>
                                <label htmlFor="recipe-price" className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Price (BDT)
                                </label>
                                <input
                                    id="recipe-price"
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={form.price}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        price: event.target.value === '' ? 0 : Number(event.target.value),
                                    }))}
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="recipe-discount" className="mb-1.5 block text-sm font-medium text-slate-700">Discount (%)</label>
                                    <input id="recipe-discount" type="number" min="0" max="100" step="1" value={form.discountPercent ?? 0} onChange={(event) => setForm(prev => ({...prev, discountPercent: Number(event.target.value || 0)}))} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                                </div>
                                <div>
                                    <label htmlFor="recipe-offer" className="mb-1.5 block text-sm font-medium text-slate-700">Offer tag</label>
                                    <input id="recipe-offer" maxLength={80} value={form.offerTag ?? ''} onChange={(event) => setForm(prev => ({...prev, offerTag: event.target.value}))} placeholder="Weekend Special" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="recipe-image" className="mb-1.5 block text-sm font-medium text-slate-700">Recipe picture</label>
                                <input
                                    id="recipe-image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null;
                                        setRecipeImageFile(file);
                                        if (recipeImagePreview) URL.revokeObjectURL(recipeImagePreview);
                                        setRecipeImagePreview(file ? URL.createObjectURL(file) : '');
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700"
                                />
                                <p className="mt-1 text-xs text-slate-400">JPG, PNG, WEBP or GIF · maximum 5MB.</p>
                                {recipeImagePreview && (
                                    <img src={recipeImagePreview} alt="Recipe preview" className="mt-3 h-36 w-full rounded-xl object-cover" />
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900">Required Ingredients</h4>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Add the ingredients and quantity needed to make one serving.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRequiredIngredients((current) => [...current, emptyIngredient()])}
                                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                    >
                                        <Plus size={14} />
                                        Add Ingredient
                                    </button>
                                </div>

                                {ingredientsQuery.isLoading ? (
                                    <div className="flex items-center py-3 text-xs text-slate-500">
                                        <LoaderCircle className="mr-2 animate-spin" size={15} />
                                        Loading ingredients...
                                    </div>
                                ) : ingredientsQuery.isError ? (
                                    <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                                        Could not load ingredients. Make sure ingredients exist and the backend is running.
                                    </p>
                                ) : ingredients.length === 0 ? (
                                    <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                                        No ingredients exist yet. Create ingredients first, then create this recipe.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {requiredIngredients.map((row, index) => {
                                            const selectedIds = requiredIngredients
                                                .filter((_, rowIndex) => rowIndex !== index)
                                                .map((entry) => Number(entry.ingredientId));

                                            return (
                                                <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_auto]">
                                                    <select
                                                        required
                                                        value={row.ingredientId}
                                                        onChange={(event) =>
                                                            setRequiredIngredients((current) =>
                                                                current.map((entry, rowIndex) =>
                                                                    rowIndex === index
                                                                        ? { ...entry, ingredientId: event.target.value }
                                                                        : entry,
                                                                ),
                                                            )
                                                        }
                                                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                    >
                                                        <option value="">Select ingredient</option>
                                                        {ingredients.map((ingredient) => (
                                                            <option
                                                                key={ingredient.id}
                                                                value={ingredient.id}
                                                                disabled={selectedIds.includes(ingredient.id)}
                                                            >
                                                                {ingredient.name} ({ingredient.unit})
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <input
                                                        type="number"
                                                        required
                                                        min="0.000001"
                                                        step="any"
                                                        value={row.quantity}
                                                        onChange={(event) =>
                                                            setRequiredIngredients((current) =>
                                                                current.map((entry, rowIndex) =>
                                                                    rowIndex === index
                                                                        ? { ...entry, quantity: event.target.value }
                                                                        : entry,
                                                                ),
                                                            )
                                                        }
                                                        placeholder="Quantity"
                                                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                    />

                                                    <button
                                                        type="button"
                                                        aria-label={`Remove ingredient ${index + 1}`}
                                                        disabled={requiredIngredients.length === 1}
                                                        onClick={() =>
                                                            setRequiredIngredients((current) =>
                                                                current.filter((_, rowIndex) => rowIndex !== index),
                                                            )
                                                        }
                                                        className="min-h-11 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.available}
                                    onChange={(event) => setForm((prev) => ({
                                        ...prev,
                                        available: event.target.checked,
                                    }))}
                                    className="h-4 w-4 accent-emerald-600"
                                />
                                Available for ordering
                            </label>

                            {formError && (
                                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    {formError}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {createMutation.isPending && <LoaderCircle size={16} className="animate-spin" />}
                                    {createMutation.isPending ? 'Saving...' : 'Save Recipe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingRecipe && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="my-auto w-full max-w-xl rounded-3xl border border-white/50 bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Quick edit</p>
                                <h3 className="mt-1 text-2xl font-black text-slate-900">Edit {editingRecipe.name}</h3>
                            </div>
                            <button type="button" onClick={() => setEditingRecipe(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={20}/></button>
                        </div>
                        <form onSubmit={(event) => { event.preventDefault(); setEditError(''); if (!editForm.name.trim() || Number(editForm.price) < 0) { setEditError('Enter a valid recipe name and price.'); return; } if (Number(editForm.discountPercent ?? 0) < 0 || Number(editForm.discountPercent ?? 0) > 100) { setEditError('Discount must be between 0 and 100%.'); return; } updateMutation.mutate(); }} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm font-semibold text-slate-700">Name<input value={editForm.name} onChange={e=>setEditForm(v=>({...v,name:e.target.value}))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500"/></label>
                                <label className="text-sm font-semibold text-slate-700">Price<input type="number" min="0" step="0.01" value={editForm.price} onChange={e=>setEditForm(v=>({...v,price:Number(e.target.value)}))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500"/></label>
                            </div>
                            <label className="block text-sm font-semibold text-slate-700">Description<textarea value={editForm.description} onChange={e=>setEditForm(v=>({...v,description:e.target.value}))} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500"/></label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm font-semibold text-slate-700">Discount %<input type="number" min="0" max="100" step="0.01" value={editForm.discountPercent ?? 0} onChange={e=>setEditForm(v=>({...v,discountPercent:Number(e.target.value)}))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500"/></label>
                                <label className="text-sm font-semibold text-slate-700">Offer tag<input value={editForm.offerTag ?? ''} onChange={e=>setEditForm(v=>({...v,offerTag:e.target.value}))} placeholder="Weekend Special" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500"/></label>
                            </div>
                            <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-700">Replace picture<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>setEditImageFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm"/><span className="mt-1 block text-xs font-normal text-slate-400">Leave empty to keep the current picture.</span></label>
                            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={editForm.available} onChange={e=>setEditForm(v=>({...v,available:e.target.checked}))} className="h-4 w-4 accent-emerald-600"/>Available for ordering</label>
                            {editError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{editError}</p>}
                            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setEditingRecipe(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" disabled={updateMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{updateMutation.isPending&&<LoaderCircle size={16} className="animate-spin"/>}{updateMutation.isPending?'Saving...':'Save changes'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}