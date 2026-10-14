import { api } from '../lib/api';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
export interface ReservationItem { id: number; recipe: { id: number; name: string; imageUrl?: string | null; price: number; discountedPrice?: number }; quantity: number; unitPrice: number; subtotal: number; }
export interface Reservation {
    id: number;
    customer?: { id: number; name: string; email: string; phone?: string | null };
    restaurantTable: { id: number; tableNumber: number; capacity: number; status: string };
    reservationDateTime: string;
    guestCount: number;
    status: ReservationStatus;
    note?: string | null;
    items?: ReservationItem[];
    preOrderTotal?: number;
    createdAt: string;
    order?: { id: number; orderNumber: string; totalAmount: number; status: string } | null;
}
export interface ReservationRecipeRequest { recipeId: number; quantity: number; }
export interface CreateReservationRequest { tableId: number; reservationDateTime: string; guestCount: number; note?: string; items: ReservationRecipeRequest[]; }

const reservationService = {
    getMine: async (): Promise<Reservation[]> => (await api.get<Reservation[]>('/reservations/me')).data,
    getAll: async (): Promise<Reservation[]> => (await api.get<Reservation[]>('/reservations')).data,
    create: async (data: CreateReservationRequest): Promise<Reservation> => (await api.post<Reservation>('/reservations', data)).data,
    cancel: async (id: number): Promise<Reservation> => (await api.put<Reservation>(`/reservations/${id}/cancel`)).data,
    confirm: async (id: number): Promise<Reservation> => (await api.put<Reservation>(`/reservations/${id}/confirm`)).data,
    reject: async (id: number): Promise<Reservation> => (await api.put<Reservation>(`/reservations/${id}/reject`)).data,
};
export default reservationService;
