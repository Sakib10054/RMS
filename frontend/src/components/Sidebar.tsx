import { useMemo, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Utensils, ShoppingBag, CalendarDays, CalendarCheck, CreditCard, History, Users, BookOpen, ChefHat, Package, ShoppingCart, ClipboardList, AlertTriangle, ArrowLeftRight, BarChart3, BellDot, FileCheck2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import reservationService from '../services/reservationService';
import paymentService from '../services/paymentService';
import { getAllOrders } from '../services/orderService';
import { stockService } from '../services/stockService';

interface SidebarProps { onNavigate?: () => void; }

type Item = { label: string; path: string; icon: ComponentType<{ size?: number; strokeWidth?: number }>; key?: string };

const customerGroups: { title: string; items: Item[] }[] = [
    { title: 'Customer', items: [
        { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Menu & Prices', path: '/customer/menu', icon: Utensils },
        { label: 'My Orders', path: '/customer/orders', icon: ShoppingBag, key: 'orders' },
        { label: 'Reserve Table', path: '/customer/reservations', icon: CalendarDays, key: 'reservations' },
        { label: 'Payment Proofs', path: '/customer/payments', icon: CreditCard, key: 'payments' },
        { label: 'Activity History', path: '/customer/activity', icon: History },
    ]},
];

const managementGroups: { title: string; items: Item[] }[] = [
    { title: 'Overview', items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] },
    { title: 'Management', items: [
        { label: 'User Management', path: '/users', icon: Users },
        { label: 'Recipes', path: '/recipes', icon: BookOpen },
        { label: 'Ingredients', path: '/ingredients', icon: ChefHat },
        { label: 'Inventory', path: '/inventory', icon: Package },
        { label: 'Purchases', path: '/purchases', icon: ShoppingCart },
        { label: 'Tables', path: '/tables', icon: Utensils },
        { label: 'Reservation Requests', path: '/reservation-requests', icon: CalendarCheck, key: 'reservations' },
        { label: 'Orders', path: '/orders', icon: ClipboardList, key: 'orders' },
        { label: 'Payments', path: '/payments', icon: CreditCard, key: 'payments' },
        { label: 'Payment Proofs', path: '/payment-proofs', icon: FileCheck2, key: 'payments' },
    ]},
    { title: 'Monitoring', items: [
        { label: 'Stock Alerts', path: '/stock-alerts', icon: AlertTriangle, key: 'stock' },
        { label: 'Stock Movements', path: '/stock-movements', icon: ArrowLeftRight },
        { label: 'Reports', path: '/reports', icon: BarChart3 },
    ]},
];

export default function Sidebar({ onNavigate }: SidebarProps) {
    const { user } = useAuth();
    const customer = user?.role === 'CUSTOMER';
    const groups = customer ? customerGroups : managementGroups;

    const customerOrders = useQuery({ queryKey: ['sidebar-customer-orders'], queryFn: getAllOrders, enabled: customer, staleTime: 30_000 });
    const customerReservations = useQuery({ queryKey: ['sidebar-customer-reservations'], queryFn: reservationService.getMine, enabled: customer, staleTime: 30_000 });
    const customerPayments = useQuery({ queryKey: ['sidebar-customer-payments'], queryFn: paymentService.getMine, enabled: customer, staleTime: 30_000 });
    const orders = useQuery({ queryKey: ['sidebar-orders'], queryFn: getAllOrders, enabled: !customer, staleTime: 30_000 });
    const reservations = useQuery({ queryKey: ['sidebar-reservations'], queryFn: reservationService.getAll, enabled: !customer, staleTime: 30_000 });
    const payments = useQuery({ queryKey: ['sidebar-payments'], queryFn: paymentService.getAll, enabled: !customer, staleTime: 30_000 });
    const stock = useQuery({ queryKey: ['sidebar-stock'], queryFn: stockService.getActiveAlerts, enabled: !customer, staleTime: 30_000 });

    const counts = useMemo(() => {
        if (customer) {
            return {
                orders: customerOrders.data?.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status)).length ?? 0,
                reservations: customerReservations.data?.filter(r => r.status === 'PENDING' || r.status === 'CONFIRMED').length ?? 0,
                payments: customerPayments.data?.filter(p => p.paymentStatus === 'UNPAID').length ?? 0,
            } as Record<string, number>;
        }
        return {
            orders: orders.data?.filter(o => ['PENDING', 'READY'].includes(o.status)).length ?? 0,
            reservations: reservations.data?.filter(r => r.status === 'PENDING').length ?? 0,
            payments: payments.data?.filter(p => p.paymentStatus === 'UNPAID' && !!(p.proofReference || p.proofFileUrl)).length ?? 0,
            stock: stock.data?.length ?? 0,
        } as Record<string, number>;
    }, [customer, customerOrders.data, customerReservations.data, customerPayments.data, orders.data, reservations.data, payments.data, stock.data]);

    return <aside className="flex h-full w-72 shrink-0 flex-col border-r border-white/70 bg-white/85 shadow-[10px_0_40px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-200/80 px-5">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-600)] text-white shadow-lg shadow-[var(--brand-600)]/20"><ChefHat size={23}/><span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-300"/></div>
            <div><h1 className="text-lg font-black tracking-tight text-slate-900">Restaurant<span className="text-[var(--brand-600)]">OS</span></h1><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{customer ? 'Guest Experience' : 'Command Center'}</p></div>
        </div>
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
            {groups.map(group=><div key={group.title}><h2 className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{group.title}</h2><div className="space-y-1">{group.items.map(item=>{const Icon=item.icon; const count=item.key ? counts[item.key] ?? 0 : 0; return <NavLink key={item.path} to={item.path} end={item.path==='/dashboard'} onClick={onNavigate} className={({isActive})=>`group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${isActive?'bg-[var(--brand-50)] text-[var(--brand-700)] shadow-sm ring-1 ring-[var(--brand-100)]':'text-slate-600 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900'}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 transition group-hover:bg-white group-[.active]:bg-white"><Icon size={18}/></span><span className="min-w-0 flex-1 truncate">{item.label}</span>{count > 0 ? <span className="min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white shadow-sm">{count > 99 ? '99+' : count}</span> : <span title="Notifications enabled" className="opacity-60"><BellDot size={14}/></span>}</NavLink>})}</div></div>)}
        </nav>
        <div className="m-3 rounded-2xl bg-gradient-to-br from-[var(--brand-50)] to-white p-4 ring-1 ring-[var(--brand-100)]"><p className="text-xs font-black text-[var(--brand-800)]">Smart notifications</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Live badges highlight orders, reservations, payment proofs and stock alerts.</p></div>
    </aside>;
}
