import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, RefreshCw, Search, X, ChefHat } from 'lucide-react';
import reservationService, { type Reservation, type ReservationStatus } from '../services/reservationService';

type Filter = 'ALL' | ReservationStatus;

function errorMessage(error: unknown): string {
    const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
    return err.response?.data?.message || err.response?.data?.error || err.message || 'Something went wrong. Please try again.';
}

const statusClass: Record<ReservationStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-600',
    COMPLETED: 'bg-blue-100 text-blue-700',
};

export default function ReservationRequestsPage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<Filter>('PENDING');
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    const reservationsQuery = useQuery({
        queryKey: ['reservations', 'all'],
        queryFn: reservationService.getAll,
    });

    const action = useMutation({
        mutationFn: async ({ id, type }: { id: number; type: 'confirm' | 'reject' }) =>
            type === 'confirm' ? reservationService.confirm(id) : reservationService.reject(id),
        onSuccess: async () => {
            setError('');
            await queryClient.invalidateQueries({ queryKey: ['reservations', 'all'] });
            await queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] });
            await queryClient.invalidateQueries({ queryKey: ['tables'] });
        },
        onError: (err) => setError(errorMessage(err)),
    });

    const reservations = reservationsQuery.data ?? [];
    const pendingCount = reservations.filter(r => r.status === 'PENDING').length;
    const confirmedCount = reservations.filter(r => r.status === 'CONFIRMED').length;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return reservations.filter(r => {
            const statusMatch = filter === 'ALL' || r.status === filter;
            const searchMatch = !q ||
                String(r.id).includes(q) ||
                r.customer?.name?.toLowerCase().includes(q) ||
                r.customer?.email?.toLowerCase().includes(q) ||
                String(r.restaurantTable.tableNumber).includes(q);
            return statusMatch && searchMatch;
        });
    }, [reservations, filter, search]);

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Table Reservation Requests</h1>
                    <p className="mt-1 text-sm text-slate-500">Review customer table reservations and approve or reject pending requests.</p>
                </div>
                <button type="button" onClick={() => reservationsQuery.refetch()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <RefreshCw size={17} /> Refresh
                </button>
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Pending Requests</p><p className="mt-1 text-3xl font-bold text-amber-600">{pendingCount}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Confirmed</p><p className="mt-1 text-3xl font-bold text-emerald-600">{confirmedCount}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total Requests</p><p className="mt-1 text-3xl font-bold text-slate-900">{reservations.length}</p></div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, email, table..." className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <select value={filter} onChange={e => setFilter(e.target.value as Filter)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ALL">All statuses</option>
                    </select>
                </div>

                {reservationsQuery.isLoading ? (
                    <div className="p-10 text-center text-slate-500">Loading reservation requests...</div>
                ) : reservationsQuery.isError ? (
                    <div className="p-10 text-center text-red-600">{errorMessage(reservationsQuery.error)}</div>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">No reservation requests found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Table</th>
                                    <th className="px-4 py-3">Date & Time</th>
                                    <th className="px-4 py-3">Guests</th>
                                    <th className="px-4 py-3">Pre-order</th><th className="px-4 py-3">Note</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((r: Reservation) => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-4"><p className="font-semibold text-slate-900">{r.customer?.name || 'Customer'}</p><p className="text-xs text-slate-500">{r.customer?.email || '—'}</p></td>
                                        <td className="px-4 py-4 font-medium">Table {r.restaurantTable.tableNumber}<span className="ml-1 text-xs text-slate-500">({r.restaurantTable.capacity} seats)</span></td>
                                        <td className="px-4 py-4 whitespace-nowrap">{new Date(r.reservationDateTime).toLocaleString('en-BD')}</td>
                                        <td className="px-4 py-4">{r.guestCount}</td>
                                        <td className="px-4 py-4"><div className="min-w-[180px]">{r.items?.length ? <>{r.items.map(i => <div key={i.id} className="flex items-center justify-between gap-2 text-xs"><span>{i.recipe.name} × {i.quantity}</span><span className="font-semibold">৳{Number(i.subtotal).toFixed(2)}</span></div>)}<div className="mt-2 border-t pt-2 text-xs font-black">Total ৳{Number(r.preOrderTotal ?? 0).toFixed(2)}</div></> : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><ChefHat size={13}/> No dishes</span>}</div></td><td className="max-w-xs px-4 py-4 text-slate-600">{r.note || '—'}</td>
                                        <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[r.status]}`}>{r.status}</span></td>
                                        <td className="px-4 py-4 text-right">
                                            {r.status === 'PENDING' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button disabled={action.isPending} onClick={() => action.mutate({ id: r.id, type: 'confirm' })} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Check size={15}/> Approve</button>
                                                    <button disabled={action.isPending} onClick={() => action.mutate({ id: r.id, type: 'reject' })} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><X size={15}/> Reject</button>
                                                </div>
                                            ) : <span className="text-xs text-slate-400">No action</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
