
import { api } from '../lib/api';

export interface PurchaseIngredient {
    id: number;
    name: string;
    unit: string;
    minimumStock: number;
}

export interface Purchase {
    id: number;
    ingredient: PurchaseIngredient;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    supplier?: string | null;
    purchaseDate: string;
    createdAt?: string;
}

export interface CreatePurchaseRequest {
    ingredient: { id: number };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    supplier?: string;
    purchaseDate: string;
}

export const purchaseService = {
    async getAll(): Promise<Purchase[]> {
        const response = await api.get<Purchase[]>('/purchases');
        return response.data;
    },

    async getById(id: number): Promise<Purchase> {
        const response = await api.get<Purchase>(`/purchases/${id}`);
        return response.data;
    },

    async create(data: CreatePurchaseRequest): Promise<Purchase> {
        const response = await api.post<Purchase>('/purchases', data);
        return response.data;
    },

    async filter(params: {
        ingredientId?: number;
        supplier?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<Purchase[]> {
        const response = await api.get<Purchase[]>('/purchases/filter', {
            params,
        });
        return response.data;
    },
};