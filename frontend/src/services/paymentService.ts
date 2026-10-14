
import { api } from "../lib/api";

export type PaymentMethod = "CASH" | "CARD" | "MOBILE_BANKING";
export type PaymentStatus = "PAID" | "UNPAID" | "REFUNDED";

export interface PaymentOrder {
    id: number;
    orderNumber?: string;
    totalAmount: number;
    status?: string;
}

export interface Payment {
    id: number;
    order: PaymentOrder;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    paymentDate: string | null;
    createdAt: string;
    proofReference?: string | null;
    proofNote?: string | null;
    proofFileUrl?: string | null;
}

export interface CreatePaymentRequest {
    order: { id: number };
    amount?: number;
    paymentMethod: PaymentMethod;
    proofReference?: string;
    proofNote?: string;
}

const paymentService = {
    getMine: async (): Promise<Payment[]> => {
        const response = await api.get<Payment[]>('/payments/mine');
        return response.data;
    },

    getAll: async (): Promise<Payment[]> => {
        const response = await api.get<Payment[]>("/payments");
        return response.data;
    },

    getById: async (id: number): Promise<Payment> => {
        const response = await api.get<Payment>(`/payments/${id}`);
        return response.data;
    },

    getByOrderId: async (orderId: number): Promise<Payment> => {
        const response = await api.get<Payment>(`/payments/order/${orderId}`);
        return response.data;
    },

    getByStatus: async (status: PaymentStatus): Promise<Payment[]> => {
        const response = await api.get<Payment[]>(`/payments/status/${status}`);
        return response.data;
    },


    submitProof: async (data: {
        orderId: number;
        paymentMethod: PaymentMethod;
        proofReference?: string;
        proofNote?: string;
        proofFile?: File | null;
    }): Promise<Payment> => {
        const form = new FormData();

        form.append("orderId", String(data.orderId));
        form.append("paymentMethod", data.paymentMethod);

        if (data.proofReference?.trim()) {
            form.append("proofReference", data.proofReference.trim());
        }

        if (data.proofNote?.trim()) {
            form.append("proofNote", data.proofNote.trim());
        }

        if (data.proofFile) {
            form.append("proofFile", data.proofFile);
        }

        const response = await api.post<Payment>(
            "/payments/proof",
            form
        );

        return response.data;
    },

    create: async (data: CreatePaymentRequest): Promise<Payment> => {
        const response = await api.post<Payment>("/payments", data);
        return response.data;
    },

    rejectProof: async (id: number): Promise<Payment> => {
        const response = await api.put<Payment>(`/payments/${id}/proof/reject`);
        return response.data;
    },

    updateStatus: async (
        id: number,
        status: PaymentStatus
    ): Promise<Payment> => {
        const response = await api.put<Payment>(
            `/payments/${id}/status`,
            status,
            {
                headers: { "Content-Type": "application/json" },
            }
        );
        return response.data;
    },
};

export default paymentService;