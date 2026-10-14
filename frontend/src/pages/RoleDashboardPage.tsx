import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import CustomerDashboardPage from './CustomerDashboardPage';

export default function RoleDashboardPage() {
    const { user } = useAuth();
    return user?.role === 'CUSTOMER' ? <CustomerDashboardPage /> : <DashboardPage />;
}
