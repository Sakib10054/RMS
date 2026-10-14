import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ChefHat, Clock3, Flame, ShoppingBag, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RecipeImage from '../components/RecipeImage';
import { getAllRecipes } from '../services/recipeService';
import { getAllOrders } from '../services/orderService';
import reservationService from '../services/reservationService';
import paymentService from '../services/paymentService';

const money = (value: number) => new Intl.NumberFormat('en-BD', {
    style: 'currency', currency: 'BDT', maximumFractionDigits: 2,
}).format(Number.isFinite(value) ? value : 0);

export default function CustomerDashboardPage() {
    const { user } = useAuth();
    const recipes = useQuery({ queryKey: ['recipes'], queryFn: getAllRecipes });
    const orders = useQuery({ queryKey: ['orders'], queryFn: getAllOrders });
    const reservations = useQuery({ queryKey: ['reservations', 'mine'], queryFn: reservationService.getMine });
    const payments = useQuery({ queryKey: ['payments', 'mine'], queryFn: paymentService.getMine });

    const available = useMemo(() => (recipes.data ?? []).filter(recipe =>
        recipe.available && Number(recipe.availableUnits ?? 0) > 0,
    ), [recipes.data]);
    const offers = useMemo(() => available.filter(recipe => Number(recipe.discountPercent ?? 0) > 0).slice(0, 3), [available]);
    const recent = useMemo(() => [...(orders.data ?? [])]
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .slice(0, 3), [orders.data]);
    const nextReservation = (reservations.data ?? []).find(reservation =>
        reservation.status === 'CONFIRMED' && new Date(reservation.reservationDateTime).getTime() > Date.now(),
    );
    const pendingPayments = (payments.data ?? []).filter(payment => payment.paymentStatus === 'UNPAID').length;

    return <div className="customer-glow min-h-full space-y-7">
        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-10">
            <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.4fr_.6fr] lg:items-center">
                <div>
                    <div className="mb-4 flex items-center gap-2 text-emerald-300"><ChefHat size={20} /><span className="text-xs font-black uppercase tracking-[.2em]">RestaurantOS dining club</span></div>
                    <h1 className="max-w-3xl break-words text-4xl font-black tracking-tight sm:text-6xl">Welcome back, {user?.name?.trim().split(/\s+/)[0] || 'Guest'}.</h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Your menu is alive: offers, stock and table moments update with the kitchen. Pick a dish or plan your next reservation.</p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link to="/customer/menu" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-100"><Utensils size={18} /> Explore menu <ArrowRight size={16} /></Link>
                        <Link to="/customer/reservations" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-black hover:bg-white/10"><CalendarDays size={18} /> Book a table</Link>
                    </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Kitchen pulse</p>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                        <Stat value={recipes.isLoading ? '—' : available.length} label="ready dishes" />
                        <Stat value={recipes.isLoading ? '—' : offers.length} label="live offers" />
                        <Stat value={orders.isLoading ? '—' : (orders.data?.length ?? 0)} label="my orders" />
                        <Stat value={payments.isLoading ? '—' : pendingPayments} label="payments due" />
                    </div>
                    {(recipes.isError || orders.isError || payments.isError) && <p className="mt-3 text-xs text-amber-200">Some live figures could not be loaded. Please refresh in a moment.</p>}
                </div>
            </div>
        </section>

        {offers.length > 0 && <section>
            <div className="mb-4 flex items-end justify-between gap-3">
                <div><div className="flex items-center gap-2 text-rose-600"><Flame size={18} /><span className="text-xs font-black uppercase tracking-widest">Hot right now</span></div><h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Offers worth leaving home for</h2></div>
                <Link to="/customer/menu" className="shrink-0 text-sm font-bold text-emerald-700 hover:underline">See all</Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {offers.map(recipe => <Link key={recipe.id} to="/customer/menu" className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative h-44 overflow-hidden bg-slate-100 sm:h-48"><RecipeImage src={recipe.imageUrl} alt={recipe.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white">-{Number(recipe.discountPercent)}%</span>{recipe.offerTag && <span className="absolute right-3 top-3 max-w-[60%] truncate rounded-full bg-slate-950/85 px-3 py-1 text-xs font-bold text-white">{recipe.offerTag}</span>}</div>
                    <div className="p-4"><p className="font-black text-slate-900">{recipe.name}</p><div className="mt-2 flex items-center justify-between gap-3"><span className="text-sm font-black text-emerald-700">{money(Number(recipe.discountedPrice ?? recipe.price))}</span><span className="shrink-0 text-xs text-slate-400">{recipe.availableUnits} left</span></div></div>
                </Link>)}
            </div>
        </section>}
        {recipes.isError && <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">We couldn't load the menu offers right now. You can still open Menu &amp; Prices to try again.</p>}

        <section className="grid gap-5 md:grid-cols-3">
            <Shortcut to="/customer/menu" icon={<ShoppingBag className="text-emerald-600" />} title="Order something great" description="Explore dishes with live stock availability and today's offers." />
            <Shortcut to="/customer/reservations" icon={<CalendarDays className="text-violet-600" />} title="Make it a night" description="Reserve a table and pre-order your favourite recipes." />
            <Shortcut to="/customer/payments" icon={<Clock3 className="text-amber-600" />} title="Payment, simplified" description="Review payment records and submit proof when needed." />
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div><h2 className="text-xl font-black text-slate-950">Your next chapter</h2><p className="mt-1 text-sm text-slate-500">Recent orders and upcoming booking</p></div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">{orders.isLoading ? <LoadingLine label="Loading your orders…" /> : recent.length ? recent.map(order => <div key={order.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"><div className="min-w-0"><p className="truncate font-bold text-slate-900">{order.orderNumber || `Order #${order.id}`}</p><p className="text-xs text-slate-500">{order.orderType}</p></div><div className="shrink-0 text-right"><p className="font-black">{money(Number(order.totalAmount))}</p><span className="text-xs font-bold text-emerald-700">{order.status}</span></div></div>) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No orders yet. Explore the menu to place your first order.</p>}</div>
                <div>{reservations.isLoading ? <LoadingLine label="Checking your bookings…" /> : nextReservation ? <div className="rounded-2xl bg-emerald-50 p-4"><p className="font-black text-slate-900">Table {nextReservation.restaurantTable?.tableNumber ?? 'reserved'} confirmed</p><p className="mt-1 text-sm text-slate-600">{new Date(nextReservation.reservationDateTime).toLocaleString('en-BD')} · {nextReservation.guestCount} guests</p></div> : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No confirmed upcoming table. <Link to="/customer/reservations" className="font-bold text-emerald-700 hover:underline">Make a reservation</Link>.</p>}</div>
            </div>
        </section>
    </div>;
}

function Stat({ value, label }: { value: number | string; label: string }) {
    return <div className="rounded-2xl bg-white/5 p-3"><p className="text-2xl font-black">{value}</p><p className="text-xs text-slate-400">{label}</p></div>;
}
function Shortcut({ to, icon, title, description }: { to: string; icon: React.ReactNode; title: string; description: string }) {
    return <Link to={to} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-6">{icon}<h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></Link>;
}
function LoadingLine({ label }: { label: string }) {
    return <p role="status" className="animate-pulse rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">{label}</p>;
}
