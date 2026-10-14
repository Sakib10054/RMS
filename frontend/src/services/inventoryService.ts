
import { api } from '../lib/api';

export type StockStatus = 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryIngredient {
    id: number;
    name: string;
    unit: string;
    minimumStock: number;
}

export interface Inventory {
    id: number;
    ingredient: InventoryIngredient;
    currentQuantity: number;
    lastUpdated: string;
}

export const inventoryService = {
    async getAll(): Promise<Inventory[]> {
        const response = await api.get<Inventory[]>('/inventory');
        return response.data;
    },

    async getByIngredientId(ingredientId: number): Promise<Inventory> {
        const response = await api.get<Inventory>(`/inventory/${ingredientId}`);
        return response.data;
    },

    async getStockStatus(ingredientId: number): Promise<StockStatus> {
        const response = await api.get<StockStatus>(
            `/inventory/${ingredientId}/status`,
        );
        return response.data;
    },
};

export function getStockStatus(item: Inventory): StockStatus {
    if (item.currentQuantity <= 0) return 'OUT_OF_STOCK';
    if (item.currentQuantity <= item.ingredient.minimumStock) {
        return 'LOW_STOCK';
    }
    return 'NORMAL';
}