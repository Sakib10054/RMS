
import { api } from '../lib/api';

export interface Ingredient {
    id: number;
    name: string;
    unit: string;
    minimumStock: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateIngredientRequest {
    name: string;
    unit: string;
    minimumStock: number;
}

export const getAllIngredients = async (): Promise<Ingredient[]> => {
    const response = await api.get<Ingredient[]>('/ingredients');
    return response.data;
};

export const getIngredientById = async (
    id: number,
): Promise<Ingredient> => {
    const response = await api.get<Ingredient>(`/ingredients/${id}`);
    return response.data;
};

export const createIngredient = async (
    data: CreateIngredientRequest,
): Promise<Ingredient> => {
    const response = await api.post<Ingredient>('/ingredients', data);
    return response.data;
};