
import { api } from "../lib/api";

export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED";

export interface RestaurantTable {
    id: number;
    tableNumber: number;
    capacity: number;
    status: TableStatus;
}

export interface TableRequest {
    tableNumber: number;
    capacity: number;
    status?: TableStatus;
}

const tableService = {
    getAll: async (): Promise<RestaurantTable[]> => {
        const response = await api.get<RestaurantTable[]>("/tables");
        return response.data;
    },

    getById: async (id: number): Promise<RestaurantTable> => {
        const response = await api.get<RestaurantTable>(`/tables/${id}`);
        return response.data;
    },

    getByStatus: async (status: TableStatus): Promise<RestaurantTable[]> => {
        const response = await api.get<RestaurantTable[]>(
            `/tables/status/${status}`
        );
        return response.data;
    },

    create: async (data: TableRequest): Promise<RestaurantTable> => {
        const response = await api.post<RestaurantTable>("/tables", {
            tableNumber: data.tableNumber,
            capacity: data.capacity,
            status: "AVAILABLE",
        });
        return response.data;
    },

    update: async (
        id: number,
        data: TableRequest
    ): Promise<RestaurantTable> => {
        const response = await api.put<RestaurantTable>(`/tables/${id}`, {
            tableNumber: data.tableNumber,
            capacity: data.capacity,
        });
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/tables/${id}`);
    },
};

export default tableService;