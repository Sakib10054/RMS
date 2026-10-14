
import { api } from "../lib/api";

export type StockAlertStatus = "ACTIVE" | "RESOLVED";

export type StockMovementType =
    | "PURCHASE"
    | "ORDER_CONSUMPTION"
    | "ADJUSTMENT"
    | "WASTE";

export interface StockIngredient {
    id: number;
    name: string;
    unit: string;
    minimumStock?: number;
}

export interface StockAlert {
    id: number;
    ingredient: StockIngredient;
    currentQuantity: number;
    minimumStock: number;
    status: StockAlertStatus;
    createdAt: string;
    resolvedAt?: string | null;
}

export interface StockMovement {
    id: number;
    ingredient: StockIngredient;
    type: StockMovementType;
    quantity: number;
    referenceId?: number | null;
    date: string;
    note?: string | null;
}

export const stockService = {
    async getAlerts(): Promise<StockAlert[]> {
        const response = await api.get<StockAlert[]>("/stock-alerts");
        return response.data;
    },

    async getActiveAlerts(): Promise<StockAlert[]> {
        const response = await api.get<StockAlert[]>("/stock-alerts/active");
        return response.data;
    },

    async resolveAlert(id: number): Promise<StockAlert> {
        const response = await api.put<StockAlert>(`/stock-alerts/${id}/resolve`);
        return response.data;
    },

    async getMovements(): Promise<StockMovement[]> {
        const response = await api.get<StockMovement[]>("/stock-movements");
        return response.data;
    },

    async getMovementsByIngredient(
        ingredientId: number,
    ): Promise<StockMovement[]> {
        const response = await api.get<StockMovement[]>(
            `/stock-movements/${ingredientId}`,
        );
        return response.data;
    },

    async getMovementsByDateRange(
        from: string,
        to: string,
    ): Promise<StockMovement[]> {
        const response = await api.get<StockMovement[]>(
            "/reports/stock-movements",
            { params: { from, to } },
        );
        return response.data;
    },
};