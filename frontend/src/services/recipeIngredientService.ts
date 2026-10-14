
import { api } from '../lib/api';

export interface Ingredient {
    id: number;
    name: string;
    unit: string;
    minimumStock: number;
}

export interface RecipeIngredient {
    id: number;
    quantity: number;
    ingredient: Ingredient;
}

export const getAllIngredients = async (): Promise<Ingredient[]> => {
    const response = await api.get<Ingredient[]>('/ingredients');
    return response.data;
};

export const getRecipeIngredients = async (
    recipeId: number,
): Promise<RecipeIngredient[]> => {
    const response = await api.get<RecipeIngredient[]>(
        `/recipes/${recipeId}/ingredients`,
    );
    return response.data;
};

export const addIngredientToRecipe = async ({
                                                recipeId,
                                                ingredientId,
                                                quantity,
                                            }: {
    recipeId: number;
    ingredientId: number;
    quantity: number;
}): Promise<RecipeIngredient> => {
    const response = await api.post<RecipeIngredient>(
        `/recipes/${recipeId}/ingredients/${ingredientId}`,
        null,
        { params: { quantity } },
    );
    return response.data;
};

export const removeIngredientFromRecipe = async ({
                                                     recipeId,
                                                     ingredientId,
                                                 }: {
    recipeId: number;
    ingredientId: number;
}): Promise<void> => {
    await api.delete(
        `/recipes/${recipeId}/ingredients/${ingredientId}`,
    );
};