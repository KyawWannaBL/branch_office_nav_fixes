import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { getDefaultRouteForRole, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import RoleGuard from '@/components/RoleGuard';

import Login from '@/pages/Login';
import ResetPassword from '@/pages/ResetPassword';
import MustChangePasswordClient from '@/pages/MustChangePasswordClient';
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
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

function normalizePath(path: string) {
  if (!path || !path.startsWith('/')) return '/dashboard';
  if (path.startsWith('/login') || path.startsWith('/reset-password') || path.startsWith('/must-change-password')) {
    return '/dashboard';
  }
  return path;
}

function getLandingRoute(role?: string | null) {
  const route = getDefaultRouteForRole(role, false) || '/dashboard';
  return route === '/reset-password' ? '/dashboard' : route;
}

function getMustChangeRoute(role?: string | null, next?: string) {
  const target = normalizePath(next || getLandingRoute(role));
  return `/must-change-password?next=${encodeURIComponent(target)}`;
}

function ProtectedRoute() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (profile?.mustChangePassword && location.pathname !== '/must-change-password') {
    return <Navigate to={getMustChangeRoute(profile.role, location.pathname)} replace />;
  }

  return <Outlet />;
}

function LoginGate() {
  const { user, profile, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (user) {
    const target = profile?.mustChangePassword
      ? getMustChangeRoute(profile.role)
      : getLandingRoute(profile?.role);
    return <Navigate to={target} replace />;
  }

  return <Login />;
}

function HomeRedirect() {
  const { profile } = useAuth();

  if (profile?.mustChangePassword) {
    return <Navigate to={getMustChangeRoute(profile.role)} replace />;
  }

  const target = getLandingRoute(profile?.role);
  if (target === '/dashboard') return <Dashboard />;
  return <Navigate to={target} replace />;
}

function Unauthorized() {
  const location = useLocation();
  const { profile } = useAuth();
  const fallback = (location.state as { defaultRoute?: string } | null)?.defaultRoute || getLandingRoute(profile?.role);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">
        Access restricted
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">You do not have access to this page.</h1>
      <p className="mt-3 text-muted-foreground">
        Your account is active, but this module is not enabled for your current role.
      </p>
      <Navigate to={fallback} replace />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginGate />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/must-change-password" element={<MustChangePasswordClient />} />

        <Route element={<Layout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="/dashboard" element={<HomeRedirect />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/supervisor/*" element={<RoleGuard path="/supervisor"><SupervisorPortal /></RoleGuard>} />
          <Route path="/wayplan/*" element={<RoleGuard path="/wayplan"><WayplanPortal /></RoleGuard>} />
          <Route path="/driver/*" element={<RoleGuard path="/driver"><DriverPortal /></RoleGuard>} />
          <Route path="/rider/*" element={<RoleGuard path="/rider"><RiderApp /></RoleGuard>} />
          <Route path="/warehouse/*" element={<RoleGuard path="/warehouse"><WarehousePortal /></RoleGuard>} />
          <Route path="/data-entry/*" element={<RoleGuard path="/data-entry"><DataEntryPortal /></RoleGuard>} />
          <Route path="/customer-service/*" element={<RoleGuard path="/customer-service"><CustomerServicePortal /></RoleGuard>} />
          <Route path="/marketing/*" element={<RoleGuard path="/marketing"><MarketingPortal /></RoleGuard>} />
          <Route path="/hr/*" element={<RoleGuard path="/hr"><HRPortal /></RoleGuard>} />
          <Route path="/finance/*" element={<RoleGuard path="/finance"><FinancePortal /></RoleGuard>} />
          <Route path="/merchant/*" element={<RoleGuard path="/merchant"><MerchantPortal /></RoleGuard>} />
          <Route path="/customer/*" element={<RoleGuard path="/customer"><CustomerPortal /></RoleGuard>} />
          <Route path="/create-delivery" element={<RoleGuard path="/create-delivery"><CreateDelivery /></RoleGuard>} />
          <Route path="/branch-office/*" element={<RoleGuard path="/branch-office"><BranchOfficePortal /></RoleGuard>} />
          <Route path="/qr-code" element={<RoleGuard path="/qr-code"><QRCodeManagement /></RoleGuard>} />
          <Route path="/analytics/*" element={<RoleGuard path="/analytics"><AnalyticsPortal /></RoleGuard>} />
          <Route path="/settings/*" element={<RoleGuard path="/settings"><SettingsPortal /></RoleGuard>} />
          <Route path="/master-data/*" element={<RoleGuard path="/master-data"><MasterDataPortal /></RoleGuard>} />

          <Route path="*" element={<HomeRedirect />} />
        </Route>
      </Route>
    </Routes>
  );
}
