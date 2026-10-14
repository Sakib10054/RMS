
import { api } from '../lib/api';

export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'READY'
    | 'COMPLETED'
    | 'CANCELLED';

export type OrderType = 'DINE_IN' | 'PICKUP';

export interface OrderSummary {
    id: number;
    orderNumber: string;
    orderType: OrderType;
    status: OrderStatus;
    totalAmount: number;
    orderDate: string;
}

export interface CreateOrderItemRequest {
    recipe: { id: number };
    quantity: number;
}

export interface CreateOrderRequest {
    order: {
        orderNumber: string;
        orderType: OrderType;
        restaurantTable?: { id: number } | null;
        customer?: { id: number } | null;
        status: OrderStatus;
        totalAmount: number;
    };
    items: CreateOrderItemRequest[];
}

export const getAllOrders = async (): Promise<OrderSummary[]> => {
    const response = await api.get<OrderSummary[]>('/orders');
    return response.data;
};

export const createOrder = async (
    data: CreateOrderRequest,
): Promise<OrderSummary> => {
    const response = await api.post<OrderSummary>('/orders', data);
    return response.data;
};

export const updateOrderStatus = async (
    orderId: number,
    status: OrderStatus,
): Promise<OrderSummary> => {
    const response = await api.put<OrderSummary>(
        `/orders/${orderId}/status`,
        status,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );

    return response.data;
};