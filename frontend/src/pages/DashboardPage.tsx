
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary } from '../services/dashboardService';
import { getAllOrders } from '../services/orderService';

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navigationItems = [
        { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
        { label: 'Orders', path: '/orders', icon: '🧾' },
        { label: 'Recipes', path: '/recipes', icon: '🍽️' },
        { label: 'Inventory', path: '/inventory', icon: '📦' },
        { label: 'Purchases', path: '/purchases', icon: '🛒' },
        { label: 'Tables', path: '/tables', icon: '🪑' },
        { label: 'Payments', path: '/payments', icon: '💳' },
        { label: 'Reports & Analytics', path: '/reports', icon: '📊' },
        { label: 'Stock Alerts', path: '/stock-alerts', icon: '🔔' },
        { label: 'Stock Movements', path: '/stock-movements', icon: '📈' },
        ...(user?.role === 'MANAGER'
            ? [{ label: 'User Management', path: '/users', icon: '👥' }]
            : []),
    ];

    const {
        data,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['dashboard-summary'],
        queryFn: getDashboardSummary,
    });

    const {
        data: orders,
        isLoading: ordersLoading,
        isError: ordersError,
        refetch: refetchOrders,
    } = useQuery({
        queryKey: ['orders'],
        queryFn: getAllOrders,
    });

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const formatNumber = (value: number) =>
        new Intl.NumberFormat('en-BD').format(value ?? 0);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            maximumFractionDigits: 2,
        }).format(value ?? 0);

    const formatDate = (value: string) => {
        if (!value) return '—';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';

        return new Intl.DateTimeFormat('en-BD', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    };

    const getStatusClass = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED':
                return 'bg-emerald-100 text-emerald-700';
            case 'PENDING':
                return 'bg-amber-100 text-amber-700';
            case 'CANCELLED':
                return 'bg-red-100 text-red-700';
            case 'PREPARING':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const stats = data
        ? [
            { label: 'Total Orders', value: formatNumber(data.totalOrders) },
            { label: 'Pending Orders', value: formatNumber(data.pendingOrders) },
            { label: 'Completed Orders', value: formatNumber(data.completedOrders) },
            { label: 'Cancelled Orders', value: formatNumber(data.cancelledOrders) },
            { label: "Today's Orders", value: formatNumber(data.todayOrders) },
            { label: "Today's Sales", value: formatCurrency(data.todaySales) },
            { label: 'Low Stock Items', value: formatNumber(data.lowStockItems) },
            { label: 'Total Recipes', value: formatNumber(data.totalRecipes) },
            { label: 'Total Ingredients', value: formatNumber(data.totalIngredients) },
            { label: 'Total Tables', value: formatNumber(data.totalTables) },
            { label: 'Occupied Tables', value: formatNumber(data.occupiedTables) },
            { label: 'Available Tables', value: formatNumber(data.availableTables) },
            { label: 'Total Payments', value: formatNumber(data.totalPayments) },
            { label: 'Paid Payments', value: formatNumber(data.paidPayments) },
            { label: 'Unpaid Payments', value: formatNumber(data.unpaidPayments) },
            { label: 'Total Purchase Cost', value: formatCurrency(data.totalPurchaseCost) },
        ]
        : [];

    const orderChartData = data
        ? [
            { name: 'Pending', orders: data.pendingOrders, color: '#f59e0b' },
            { name: 'Completed', orders: data.completedOrders, color: '#10b981' },
            { name: 'Cancelled', orders: data.cancelledOrders, color: '#ef4444' },
        ]
        : [];

    const tableChartData = data
        ? [
            { name: 'Occupied', value: data.occupiedTables, color: '#3b82f6' },
            { name: 'Available', value: data.availableTables, color: '#10b981' },
        ]
        : [];

    const recentOrders = [...(orders ?? [])]
        .sort(
            (a, b) =>
                new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
        )
        .slice(0, 5);

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Welcome, {user?.name ?? 'User'}!
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                            Role: {user?.role ?? 'N/A'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        Sign out
                    </button>
                </header>

                {/* Quick Navigation */}
                <section className="mb-8">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800">
                        Quick Navigation
                    </h2>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {navigationItems.map((item) => (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => navigate(item.path)}
                                aria-current={
                                    item.path === '/dashboard' ? 'page' : undefined
                                }
                                className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                                    item.path === '/dashboard'
                                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
                                }`}
                            >
                                <span className="text-2xl" aria-hidden="true">
                                    {item.icon}
                                </span>
                                <span className="text-sm font-semibold">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {isLoading && (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
                        Loading dashboard summary...
                    </div>
                )}

                {isError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                        <p className="font-medium text-red-700">
                            Failed to load dashboard summary.
                        </p>
                        <p className="mt-1 text-sm text-red-600">
                            Check your connection and try again.
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {data && (
                    <>
                        <section>
                            <h2 className="mb-4 text-lg font-semibold text-slate-800">
                                Restaurant Overview
                            </h2>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {stats.map((stat) => (
                                    <article
                                        key={stat.label}
                                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                                    >
                                        <p className="text-sm font-medium text-slate-500">
                                            {stat.label}
                                        </p>
                                        <p className="mt-3 break-words text-2xl font-bold text-slate-900">
                                            {stat.value}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-lg font-semibold text-slate-800">
                                Analytics
                            </h2>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="mb-4 font-semibold text-slate-800">
                                        Order Status
                                    </h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={orderChartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Bar
                                                    dataKey="orders"
                                                    name="Orders"
                                                    radius={[6, 6, 0, 0]}
                                                >
                                                    {orderChartData.map((entry) => (
                                                        <Cell
                                                            key={entry.name}
                                                            fill={entry.color}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </article>

                                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="mb-4 font-semibold text-slate-800">
                                        Table Occupancy
                                    </h3>
                                    <div className="h-72">
                                        {data.totalTables > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={tableChartData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={90}
                                                        label
                                                    >
                                                        {tableChartData.map((entry) => (
                                                            <Cell
                                                                key={entry.name}
                                                                fill={entry.color}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                                No table data available
                                            </div>
                                        )}
                                    </div>
                                </article>
                            </div>
                        </section>
                    </>
                )}

                <section className="mt-8">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">
                                Recent Orders
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                The latest 5 orders from your restaurant
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => refetchOrders()}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                            Refresh orders
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        {ordersLoading ? (
                            <p className="p-8 text-center text-sm text-slate-500">
                                Loading recent orders...
                            </p>
                        ) : ordersError ? (
                            <div className="p-6 text-center">
                                <p className="text-sm text-red-600">
                                    Failed to load recent orders.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => refetchOrders()}
                                    className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <p className="p-8 text-center text-sm text-slate-500">
                                No orders found.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[650px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">
                                            Order Number
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Type
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Date
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Amount
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {recentOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                                                {order.orderNumber || `#${order.id}`}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                {order.orderType?.replaceAll('_', ' ') ?? '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                {formatDate(order.orderDate)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                                                {formatCurrency(order.totalAmount)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(order.status)}`}
                                                    >
                                                        {order.status?.replaceAll('_', ' ') ?? 'UNKNOWN'}
                                                    </span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default DashboardPage;