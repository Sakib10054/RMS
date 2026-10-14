
import { api } from "../lib/api";

export interface SalesReport {
    dailySales: number;
    weeklySales: number;
    monthlySales: number;
    completedOrderCount: number;
    averageOrderValue: number;
}

export const reportService = {
    async getDailySales(date: string): Promise<number> {
        const response = await api.get<number>("/reports/sales/daily", {
            params: { date },
        });
        return Number(response.data ?? 0);
    },

    async getWeeklySales(date: string): Promise<number> {
        const response = await api.get<number>("/reports/sales/weekly", {
            params: { date },
        });
        return Number(response.data ?? 0);
    },

    async getMonthlySales(date: string): Promise<number> {
        const response = await api.get<number>("/reports/sales/monthly", {
            params: { date },
        });
        return Number(response.data ?? 0);
    },

    async getCompletedOrderCount(date: string): Promise<number> {
        const response = await api.get<number>(
            "/reports/sales/completed-count",
            { params: { date } },
        );
        return Number(response.data ?? 0);
    },

    async getAverageOrderValue(date: string): Promise<number> {
        const response = await api.get<number>(
            "/reports/sales/average-order-value",
            { params: { date } },
        );
        return Number(response.data ?? 0);
    },

    async getSalesReport(date: string): Promise<SalesReport> {
        const [
            dailySales,
            weeklySales,
            monthlySales,
            completedOrderCount,
            averageOrderValue,
        ] = await Promise.all([
            this.getDailySales(date),
            this.getWeeklySales(date),
            this.getMonthlySales(date),
            this.getCompletedOrderCount(date),
            this.getAverageOrderValue(date),
        ]);

        return {
            dailySales,
            weeklySales,
            monthlySales,
            completedOrderCount,
            averageOrderValue,
        };
    },
};