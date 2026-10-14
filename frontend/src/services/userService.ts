
import { api } from "../lib/api";
import type { UserRole } from "../types/auth";

export interface ManagedUser {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    role: UserRole;
    active: boolean;
    createdAt?: string | null;
}

export interface UserAccessUpdateRequest {
    role: UserRole;
    active: boolean;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
}

export const userService = {
    getAll: async (): Promise<ManagedUser[]> => {
        const response = await api.get<ManagedUser[]>("/users");
        return response.data;
    },

    updateAccess: async (
        userId: number,
        data: UserAccessUpdateRequest,
    ): Promise<ManagedUser> => {
        const response = await api.put<ManagedUser>(
            `/users/${userId}/access`,
            data,
        );
        return response.data;
    },

    create: async (data: CreateUserRequest): Promise<ManagedUser> => {
        const response = await api.post<ManagedUser>("/users", data);
        return response.data;
    },
};