import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./components/Sidebar";

// Core pages
import Dashboard from "./pages/Dashboard";
import CreateDelivery from "./pages/CreateDelivery";
import WayManagement from "./pages/WayManagement";
import Deliverymen from "./pages/Deliverymen";
import Merchants from "./pages/Merchants";
import Waybill from "@/pages/waybill";
import Reporting from "./pages/Reporting";
import Settings from "./pages/Settings";
import SupervisorPortal from "./pages/SupervisorPortal";
import DataEntryPortal from "./pages/DataEntryPortal";
import CustomerServicePortal from "./pages/CustomerServicePortal";
import CustomerPortal from "./pages/CustomerPortal";
import Login from "./pages/Login";
import AdminHrPortal from "./pages/AdminOperations";

// Extra pages
import ProfileDashboard from "./pages/ProfileDashboard";
import WalletHub from "./pages/WalletHub";
import BranchOfficePage from "./pages/BranchOffice";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function FullScreenLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      Loading Britium Express...
    </div>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoading />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoading />;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppShell() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />
        <SidebarInset>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  Loading Britium Express...
                </div>
              }
            >
              <Routes>
                {/* Core */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="create-delivery" element={<CreateDelivery />} />
                <Route path="way-management" element={<WayManagement />} />

                {/* Extra pages */}
                <Route path="profile/*" element={<ProfileDashboard />} />
                <Route path="wallet/*" element={<WalletHub />} />
                <Route path="branch-office/*" element={<BranchOfficePage />} />

                {/* Portal groups */}
                <Route path="supervisor/*" element={<SupervisorPortal />} />
                <Route path="data-entry/*" element={<DataEntryPortal />} />
                <Route path="customer-service/*" element={<CustomerServicePortal />} />
                <Route path="customer/*" element={<CustomerPortal />} />
                <Route path="merchant/*" element={<Merchants />} />
                <Route path="deliverymen/*" element={<Deliverymen />} />
                <Route path="admin-hr/*" element={<AdminHrPortal />} />

                {/* System */}
                <Route path="waybill/*" element={<Waybill />} />
                <Route path="reporting/*" element={<Reporting />} />
                <Route path="settings/*" element={<Settings />} />

                {/* Legacy redirects */}
                <Route path="merchants" element={<Navigate to="/merchant" replace />} />
                <Route path="merchants/*" element={<Navigate to="/merchant" replace />} />

                <Route path="admin/hr-admin" element={<Navigate to="/admin-hr" replace />} />
                <Route path="admin/hr-admin/*" element={<Navigate to="/admin-hr" replace />} />

                <Route path="admin/operations" element={<Navigate to="/admin-hr/admin" replace />} />
                <Route path="admin/operations/*" element={<Navigate to="/admin-hr/admin" replace />} />

                <Route path="receipts" element={<Navigate to="/waybill" replace />} />
                <Route path="receipts/*" element={<Navigate to="/waybill" replace />} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={<Navigate to="/login" replace />}
            />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route path="/Login" element={<Navigate to="/login" replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password/" element={<Navigate to="/reset-password" replace />} />

            {/* Protected app */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}