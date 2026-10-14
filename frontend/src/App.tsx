import { type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoleDashboardPage from './pages/RoleDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import OrdersPage from './pages/OrdersPage';
import RecipesPage from './pages/RecipesPage';
import RecipeIngredientsPage from './pages/RecipeIngredientsPage';
import InventoryPage from './pages/InventoryPage';
import PurchasesPage from './pages/PurchasesPage';
import TablesPage from './pages/TablesPage';
import PaymentsPage from './pages/PaymentsPage';
import PaymentProofsPage from './pages/PaymentProofsPage';
import StockAlertsPage from './pages/StockAlertsPage';
import StockMovementsPage from './pages/StockMovementsPage';
import ReportsPage from './pages/ReportsPage';
import IngredientsPage from './pages/IngredientsPage';
import CustomerMenuPage from './pages/CustomerMenuPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import CustomerReservationsPage from './pages/CustomerReservationsPage';
import CustomerPaymentsPage from './pages/CustomerPaymentsPage';
import CustomerActivityPage from './pages/CustomerActivityPage';
import ReservationRequestsPage from './pages/ReservationRequestsPage';

function LoadingScreen() {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-600">Loading...</p></div>;
}

function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <LoadingScreen />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Outlet />;
}

function PublicRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <LoadingScreen />;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}

function ManagementOnlyRoute() {
    const { user, isLoading } = useAuth();
    if (isLoading) return <LoadingScreen />;
    if (user?.role === 'CUSTOMER') return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}

function CustomerOnlyRoute() {
    const { user, isLoading } = useAuth();
    if (isLoading) return <LoadingScreen />;
    if (user?.role !== 'CUSTOMER') return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}

function HomeRedirect() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <LoadingScreen />;
    return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
    return <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<RoleDashboardPage />} />

                <Route element={<CustomerOnlyRoute />}>
                    <Route path="/customer/menu" element={<CustomerMenuPage />} />
                    <Route path="/customer/orders" element={<CustomerOrdersPage />} />
                    <Route path="/customer/reservations" element={<CustomerReservationsPage />} />
                    <Route path="/customer/payments" element={<CustomerPaymentsPage />} />
                    <Route path="/customer/activity" element={<CustomerActivityPage />} />
                </Route>

                <Route element={<ManagementOnlyRoute />}>
                    <Route path="/users" element={<UserManagementPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/recipes" element={<RecipesPage />} />
                    <Route path="/recipes/:recipeId/ingredients" element={<RecipeIngredientsPage />} />
                    <Route path="/ingredients" element={<IngredientsPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/purchases" element={<PurchasesPage />} />
                    <Route path="/tables" element={<TablesPage />} />
                    <Route path="/reservation-requests" element={<ReservationRequestsPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/payment-proofs" element={<PaymentProofsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/stock-alerts" element={<StockAlertsPage />} />
                    <Route path="/stock-movements" element={<StockMovementsPage />} />
                </Route>
            </Route>
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
    </Routes>;
}
