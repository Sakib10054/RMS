import { api } from '../lib/api';

export interface Recipe {
    id: number;
    name: string;
    description: string | null;
    price: number;
    discountedPrice?: number;
    discountPercent?: number;
    offerTag?: string | null;
    imageUrl?: string | null;
    available: boolean;
    availableUnits?: number;
}

export interface CreateRecipeRequest {
    name: string;
    description: string;
    price: number;
    available: boolean;
    imageUrl?: string;
    discountPercent?: number;
    offerTag?: string;
}

export const getAllRecipes = async (): Promise<Recipe[]> => (await api.get<Recipe[]>('/recipes')).data;
export const createRecipe = async (data: CreateRecipeRequest): Promise<Recipe> => (await api.post<Recipe>('/recipes', data)).data;


export const uploadRecipeImage = async (recipeId: number, file: File): Promise<Recipe> => {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post<Recipe>(`/recipes/${recipeId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
};


export const updateRecipe = async (id: number, data: CreateRecipeRequest): Promise<Recipe> =>
    (await api.put<Recipe>(`/recipes/${id}`, data)).data;

export const deleteRecipe = async (id: number): Promise<void> => {
    await api.delete(`/recipes/${id}`);
};
