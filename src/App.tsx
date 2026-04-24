import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { getDefaultRouteForRole, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

import Login from '@/pages/Login';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import SupervisorPortal from '@/pages/SupervisorPortal';
import WayplanPortal from '@/pages/WayplanPortal';
import DriverPortal from '@/pages/DriverPortal';
import RiderApp from '@/pages/RiderApp';
import WarehousePortal from '@/pages/WarehousePortal';
import DataEntryPortal from '@/pages/DataEntryPortal';
import CustomerServicePortal from '@/pages/CustomerServicePortal';
import MarketingPortal from '@/pages/MarketingPortal';
import HRPortal from '@/pages/HRPortal';
import FinancePortal from '@/pages/FinancePortal';
import MerchantPortal from '@/pages/MerchantPortal';
import CustomerPortal from '@/pages/CustomerPortal';
import CreateDelivery from '@/pages/CreateDelivery';
import BranchOfficePortal from '@/pages/BranchOfficePortal';
import QRCodeManagement from '@/pages/QRCodeManagement';
import AnalyticsPortal from '@/pages/AnalyticsPortal';
import SettingsPortal from '@/pages/SettingsPortal';
import MasterDataPortal from '@/pages/master-data/MasterDataPortal';

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

function LoginGate() {
  const { user, profile, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (user && profile?.role) {
    return (
      <Navigate
        to={getDefaultRouteForRole(profile.role, profile.mustChangePassword)}
        replace
      />
    );
  }

  return <Login />;
}

function HomeRedirect() {
  const { profile } = useAuth();
  const target = getDefaultRouteForRole(
    profile?.role,
    profile?.mustChangePassword
  );

  if (target === '/dashboard') return <Dashboard />;
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginGate />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="/dashboard" element={<HomeRedirect />} />
          <Route path="/supervisor/*" element={<SupervisorPortal />} />
          <Route path="/wayplan/*" element={<WayplanPortal />} />
          <Route path="/driver/*" element={<DriverPortal />} />
          <Route path="/rider/*" element={<RiderApp />} />
          <Route path="/warehouse/*" element={<WarehousePortal />} />
          <Route path="/data-entry/*" element={<DataEntryPortal />} />
          <Route path="/customer-service/*" element={<CustomerServicePortal />} />
          <Route path="/marketing/*" element={<MarketingPortal />} />
          <Route path="/hr/*" element={<HRPortal />} />
          <Route path="/finance/*" element={<FinancePortal />} />
          <Route path="/merchant/*" element={<MerchantPortal />} />
          <Route path="/customer/*" element={<CustomerPortal />} />
          <Route path="/create-delivery" element={<CreateDelivery />} />
          <Route path="/branch-office/*" element={<BranchOfficePortal />} />
          <Route path="/qr-code" element={<QRCodeManagement />} />
          <Route path="/analytics/*" element={<AnalyticsPortal />} />
          <Route path="/settings/*" element={<SettingsPortal />} />
          <Route path="/master-data/*" element={<MasterDataPortal />} />
          <Route path="*" element={<HomeRedirect />} />
        </Route>
      </Route>
    </Routes>
  );
}
