import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, FileCheck2, RefreshCw, XCircle } from 'lucide-react';
import paymentService from '../services/paymentService';

import { openPaymentProof } from '../lib/paymentProof';
const money = (v: number) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(Number(v) || 0);

export default function PaymentProofsPage() {
    const qc = useQueryClient();
    const query = useQuery({ queryKey: ['payments'], queryFn: paymentService.getAll });
    const approve = useMutation({
        mutationFn: (id: number) => paymentService.updateStatus(id, 'PAID'),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
    });
    const reject = useMutation({
        mutationFn: (id: number) => paymentService.rejectProof(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
    });
    const pending = useMemo(() => (query.data ?? []).filter(p => p.paymentStatus === 'UNPAID' && Boolean(p.proofReference || p.proofFileUrl)), [query.data]);

    return <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-9">
            <div className="flex items-center gap-3 text-emerald-300"><FileCheck2 size={20}/><span className="text-xs font-black uppercase tracking-[.2em]">Verification desk</span></div>
            <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h1 className="text-3xl font-black sm:text-4xl">Customer payment proofs</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review transaction references, notes and uploaded proof files before marking a payment as paid.</p></div><div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/10"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Waiting for review</p><p className="mt-1 text-3xl font-black">{pending.length}</p></div></div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-900">Proof queue</h2><p className="mt-1 text-sm text-slate-500">Approve valid payments or reject a proof so the customer can resubmit.</p></div><button type="button" onClick={() => query.refetch()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={16}/>Refresh</button></div>
            {query.isLoading ? <div className="py-16 text-center text-sm text-slate-500">Loading proof queue...</div> : query.isError ? <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">Could not load payment proofs.</div> : pending.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={42}/><p className="mt-3 font-bold text-slate-800">All caught up</p><p className="mt-1 text-sm text-slate-500">There are no customer proofs waiting for review.</p></div> : <div className="grid gap-4 lg:grid-cols-2">{pending.map(payment => <article key={payment.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Payment #{payment.id}</p><h3 className="mt-1 text-lg font-black text-slate-900">{payment.order?.orderNumber || `Order #${payment.order?.id}`}</h3><p className="mt-1 text-sm text-slate-500">{payment.paymentMethod.replace('_',' ')} · {money(payment.amount)}</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">Pending</span></div><div className="mt-4 space-y-3 rounded-2xl bg-white p-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reference</p><p className="mt-1 font-semibold text-slate-800">{payment.proofReference || 'Not provided'}</p></div>{payment.proofNote && <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Customer note</p><p className="mt-1 text-sm text-slate-700">{payment.proofNote}</p></div>}{payment.proofFileUrl && <button type="button" onClick={() => openPaymentProof(payment.id).catch(() => window.alert('Could not open payment proof. Please sign in again.'))} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-50)] px-3 py-2 text-sm font-bold text-[var(--brand-700)] hover:bg-[var(--brand-100)]"><ExternalLink size={15}/>Open proof file</button>}</div><div className="mt-4 flex gap-2"><button type="button" disabled={approve.isPending || reject.isPending} onClick={()=>{if(window.confirm('Approve this payment proof?')) approve.mutate(payment.id)}} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 size={17}/>Approve & mark paid</button><button type="button" disabled={approve.isPending || reject.isPending} onClick={()=>{if(window.confirm('Reject this proof? The customer will be able to submit it again.')) reject.mutate(payment.id)}} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 hover:bg-red-50 disabled:opacity-50"><XCircle size={17}/>Reject</button></div></article>)}</div>}
        </section>
    </div>;
}
