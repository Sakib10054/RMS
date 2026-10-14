
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    CreditCard,
    Plus,
    RefreshCw,
    Search,
    X,
    Wallet,
    CheckCircle2,
    Clock3,
    RotateCcw,
    FileCheck2,
} from "lucide-react";
import { openPaymentProof } from '../lib/paymentProof';

import paymentService, {
    type Payment,
    type PaymentMethod,
    type PaymentStatus,
} from "../services/paymentService";

type FilterStatus = "ALL" | PaymentStatus;

const statusClass: Record<PaymentStatus, string> = {
    PAID: "bg-green-100 text-green-700",
    UNPAID: "bg-amber-100 text-amber-700",
    REFUNDED: "bg-gray-100 text-gray-700",
};

const statusText: Record<PaymentStatus, string> = {
    PAID: "Paid",
    UNPAID: "Unpaid",
    REFUNDED: "Refunded",
};

const methodText: Record<PaymentMethod, string> = {
    CASH: "Cash",
    CARD: "Card",
    MOBILE_BANKING: "Mobile Banking",
};

const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleString();
};

function errorMessage(error: unknown) {
    const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
    };

    return (
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong."
    );
}

export default function PaymentsPage() {
    const queryClient = useQueryClient();

    const [filter, setFilter] = useState<FilterStatus>("ALL");
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [orderId, setOrderId] = useState("");
    const [method, setMethod] = useState<PaymentMethod>("CASH");
    const [formError, setFormError] = useState("");
    const [pageError, setPageError] = useState("");

    const {
        data: payments = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["payments"],
        queryFn: paymentService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: () =>
            paymentService.create({
                order: { id: Number(orderId) },
                amount: 0,
                paymentMethod: method,
                proofReference: "",
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["payments"] });
            await queryClient.invalidateQueries({ queryKey: ["orders"] });

            setModalOpen(false);
            setOrderId("");
            setMethod("CASH");
            setFormError("");
        },
        onError: (err) => setFormError(errorMessage(err)),
    });
    const statusMutation = useMutation({
        mutationFn: ({
                         id,
                         status,
                     }: {
            id: number;
            status: PaymentStatus;
        }) => paymentService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (err) => setPageError(errorMessage(err)),
    });

    const paidCount = payments.filter(
        (payment) => payment.paymentStatus === "PAID"
    ).length;

    const unpaidCount = payments.filter(
        (payment) => payment.paymentStatus === "UNPAID"
    ).length;

    const refundedCount = payments.filter(
        (payment) => payment.paymentStatus === "REFUNDED"
    ).length;

    const paidAmount = payments
        .filter((payment) => payment.paymentStatus === "PAID")
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const proofPendingCount = payments.filter(
        (payment) => payment.paymentStatus === "UNPAID" && Boolean(payment.proofReference || payment.proofFileUrl),
    ).length;

    const filteredPayments = useMemo(() => {
        const term = search.trim().toLowerCase();

        return payments.filter((payment) => {
            const statusMatches =
                filter === "ALL" || payment.paymentStatus === filter;

            const searchMatches =
                !term ||
                String(payment.id).includes(term) ||
                String(payment.order?.id ?? "").includes(term) ||
                (payment.order?.orderNumber ?? "").toLowerCase().includes(term) ||
                payment.paymentMethod.toLowerCase().includes(term) ||
                payment.paymentStatus.toLowerCase().includes(term);

            return statusMatches && searchMatches;
        });
    }, [payments, filter, search]);

    const submitCreate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");

        const id = Number(orderId);

        if (!Number.isInteger(id) || id <= 0) {
            setFormError("Enter a valid positive Order ID.");
            return;
        }

        const existingPayment = payments.some(
            (payment) => payment.order?.id === id
        );

        if (existingPayment) {
            setFormError("A payment already exists for this order.");
            return;
        }

        createMutation.mutate();
    };

    const updateStatus = (payment: Payment, status: PaymentStatus) => {
        if (payment.paymentStatus === "REFUNDED") return;

        if (status === "REFUNDED" && payment.paymentStatus !== "PAID") {
            setPageError("Only paid payments can be refunded.");
            return;
        }

        const message =
            status === "REFUNDED"
                ? `Refund payment #${payment.id}?`
                : `Mark payment #${payment.id} as paid?`;

        if (window.confirm(message)) {
            setPageError("");
            statusMutation.mutate({ id: payment.id, status });
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Payment Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Track payments, payment methods and transaction statuses.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setFormError("");
                        setModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                    <Plus size={18} />
                    Create Payment
                </button>
            </div>

            {pageError && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{pageError}</span>
                    <button
                        type="button"
                        onClick={() => setPageError("")}
                        aria-label="Dismiss error"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    title="Total Payments"
                    value={payments.length}
                    icon={<CreditCard size={21} />}
                    iconClass="bg-indigo-50 text-indigo-600"
                />
                <SummaryCard
                    title="Paid"
                    value={paidCount}
                    icon={<CheckCircle2 size={21} />}
                    iconClass="bg-green-50 text-green-600"
                />
                <SummaryCard
                    title="Unpaid"
                    value={unpaidCount}
                    icon={<Clock3 size={21} />}
                    iconClass="bg-amber-50 text-amber-600"
                />
                <SummaryCard
                    title="Proofs to Review"
                    value={proofPendingCount}
                    icon={<FileCheck2 size={21} />}
                    iconClass="bg-rose-50 text-rose-600"
                    subtitle="Customer submissions"
                />
                <SummaryCard
                    title="Total Collected"
                    value={formatMoney(paidAmount)}
                    icon={<Wallet size={21} />}
                    iconClass="bg-blue-50 text-blue-600"
                    subtitle={`${refundedCount} refunded`}
                />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="font-semibold text-gray-900">Payment Records</h2>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search payment or order..."
                                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 sm:w-64"
                            />
                        </div>

                        <select
                            value={filter}
                            onChange={(event) =>
                                setFilter(event.target.value as FilterStatus)
                            }
                            aria-label="Filter payments by status"
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PAID">Paid</option>
                            <option value="UNPAID">Unpaid</option>
                            <option value="REFUNDED">Refunded</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <p className="py-12 text-center text-sm text-gray-500">
                        Loading payments...
                    </p>
                ) : isError ? (
                    <div className="py-10 text-center">
                        <p className="text-sm text-red-600">{errorMessage(error)}</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="py-12 text-center">
                        <CreditCard className="mx-auto mb-3 text-gray-300" size={40} />
                        <p className="font-medium text-gray-700">No payments found</p>
                        <p className="mt-1 text-sm text-gray-500">
                            Create a payment or change your search filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                                <th className="px-3 py-3 font-medium">Payment</th>
                                <th className="px-3 py-3 font-medium">Order</th>
                                <th className="px-3 py-3 font-medium">Amount</th>
                                <th className="px-3 py-3 font-medium">Method</th>
                                <th className="px-3 py-3 font-medium">Proof</th>
                                <th className="px-3 py-3 font-medium">Date</th>
                                <th className="px-3 py-3 font-medium">Status</th>
                                <th className="px-3 py-3 text-right font-medium">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredPayments.map((payment) => (
                                <tr
                                    key={payment.id}
                                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                                >
                                    <td className="px-3 py-4 font-medium text-gray-900">
                                        #{payment.id}
                                    </td>
                                    <td className="px-3 py-4 text-gray-700">
                                        {payment.order?.orderNumber ||
                                            (payment.order?.id
                                                ? `Order #${payment.order.id}`
                                                : "—")}
                                    </td>
                                    <td className="px-3 py-4 font-medium text-gray-900">
                                        {formatMoney(payment.amount)}
                                    </td>
                                    <td className="px-3 py-4 text-gray-600">
                                        {methodText[payment.paymentMethod] ||
                                            payment.paymentMethod}
                                    </td>
                                    <td className="px-3 py-4 text-gray-600">
                                        <div className="space-y-1">
                                            <p>{payment.proofReference || '—'}</p>
                                            {(payment.proofReference || payment.proofFileUrl) && payment.paymentStatus === 'UNPAID' && (
                                                <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">Proof pending review</span>
                                            )}
                                            {payment.proofFileUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => openPaymentProof(payment.id).catch(() => window.alert('Could not open payment proof. Please sign in again.'))}
                                                    className="text-xs font-semibold text-indigo-600 hover:underline"
                                                >
                                                    View proof file
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 text-gray-600">
                                        {formatDate(payment.paymentDate || payment.createdAt)}
                                    </td>
                                    <td className="px-3 py-4">
                      <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              statusClass[payment.paymentStatus] ||
                              "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {statusText[payment.paymentStatus] ||
                            payment.paymentStatus}
                      </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="flex justify-end gap-2">
                                            {payment.paymentStatus === "UNPAID" && (
                                                <button
                                                    type="button"
                                                    disabled={statusMutation.isPending}
                                                    onClick={() => updateStatus(payment, "PAID")}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                                                >
                                                    {payment.proofReference || payment.proofFileUrl ? 'Approve Proof' : 'Mark Paid'}
                                                </button>
                                            )}

                                            {payment.paymentStatus === "PAID" && (
                                                <button
                                                    type="button"
                                                    disabled={statusMutation.isPending}
                                                    onClick={() =>
                                                        updateStatus(payment, "REFUNDED")
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                                >
                                                    <RotateCcw size={13} />
                                                    Refund
                                                </button>
                                            )}

                                            {payment.paymentStatus === "REFUNDED" && (
                                                <span className="px-2 py-1.5 text-xs text-gray-400">
                            Final
                          </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <p className="mt-4 text-sm text-gray-500">
                            Showing {filteredPayments.length} of {payments.length} payments
                        </p>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payment-modal-title"
                        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl sm:p-6"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2
                                id="payment-modal-title"
                                className="text-lg font-semibold text-gray-900"
                            >
                                Create Payment
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setModalOpen(false);
                                    setFormError("");
                                    setOrderId("");
                                }}
                                aria-label="Close"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={submitCreate} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="orderId"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Order ID
                                </label>
                                <input
                                    id="orderId"
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    value={orderId}
                                    onChange={(event) => setOrderId(event.target.value)}
                                    placeholder="Enter existing Order ID"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">
                                    The backend retrieves the order total automatically.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="paymentMethod"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Payment Method
                                </label>
                                <select
                                    id="paymentMethod"
                                    value={method}
                                    onChange={(event) =>
                                        setMethod(event.target.value as PaymentMethod)
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="MOBILE_BANKING">Mobile Banking</option>
                                </select>
                            </div>

                            <div className="rounded-lg bg-blue-50 px-3 py-3 text-sm text-blue-800">
                                Payment amount and initial status are assigned by the backend.
                                The new payment will be created as Unpaid.
                            </div>

                            {formError && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                    {formError}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalOpen(false);
                                        setFormError("");
                                        setOrderId("");
                                    }}
                                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                                >
                                    {createMutation.isPending
                                        ? "Creating..."
                                        : "Create Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({
                         title,
                         value,
                         icon,
                         iconClass,
                         subtitle,
                     }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    iconClass: string;
    subtitle?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <div className={`rounded-lg p-2 ${iconClass}`}>{icon}</div>
            </div>
            <p className="mt-3 break-words text-2xl font-bold text-gray-900">
                {value}
            </p>
            {subtitle && (
                <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            )}
        </div>
    );
}
