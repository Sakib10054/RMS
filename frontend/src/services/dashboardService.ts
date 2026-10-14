import { api } from '../lib/api';

export interface DashboardSummary {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    todayOrders: number;
    todaySales: number;
    lowStockItems: number;
    totalRecipes: number;
    totalIngredients: number;
    totalTables: number;
    occupiedTables: number;
    availableTables: number;
    totalPayments: number;
    paidPayments: number;
    unpaidPayments: number;
    totalPurchaseCost: number;
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>('/dashboard/summary');
    return response.data;
};