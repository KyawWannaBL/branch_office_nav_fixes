import { useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import CreateDelivery from "./pages/CreateDelivery";
import DataEntryPortal from "./pages/DataEntryPortal";
import SupervisorPortal from "./pages/SupervisorPortal";
import CustomerServicePortal from "./pages/CustomerServicePortal";
import CustomerPortal from "./pages/CustomerPortal";
import Merchants from "./pages/Merchants";
import WalletHub from "./pages/WalletHub";
import BranchOffice from "./pages/BranchOffice";

const queryClient = new QueryClient();

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex min-h-full items-center justify-center">
    <div className="rounded-[32px] border border-black/10 bg-white/55 px-10 py-16 text-center shadow-sm backdrop-blur-md">
      <div className="text-3xl font-black text-slate-950">{title}</div>
      <div className="mt-3 text-sm font-semibold text-slate-600">Page Coming Soon</div>
    </div>
  </div>
);

function getScreenBackgroundClass(pathname: string) {
  if (pathname.startsWith("/dashboard")) return "screen-bg-dashboard";
  if (pathname.startsWith("/profile")) return "screen-bg-profile";
  if (pathname.startsWith("/wallet")) return "screen-bg-wallet";
  if (pathname.startsWith("/create-delivery")) return "screen-bg-create-delivery";
  if (pathname.startsWith("/way-management")) return "screen-bg-way-management";
  if (pathname.startsWith("/supervisor")) return "screen-bg-supervisor";
  if (pathname.startsWith("/data-entry")) return "screen-bg-data-entry";
  if (pathname.startsWith("/customer-service")) return "screen-bg-customer-service";
  if (pathname.startsWith("/branch-office")) return "screen-bg-branch-office";
  if (pathname.startsWith("/deliverymen")) return "screen-bg-deliverymen";
  if (pathname.startsWith("/merchants")) return "screen-bg-merchants";
  if (pathname.startsWith("/receipts")) return "screen-bg-receipts";
  if (pathname.startsWith("/reporting")) return "screen-bg-reporting";
  if (pathname.startsWith("/settings")) return "screen-bg-settings";
  if (pathname.startsWith("/marketing")) return "screen-bg-marketing";
  if (pathname.startsWith("/admin/operations")) return "screen-bg-admin-operations";
  if (pathname.startsWith("/admin/hr-admin")) return "screen-bg-admin-hr";
  if (pathname.startsWith("/production/create-delivery")) return "screen-bg-create-delivery";
  if (pathname.startsWith("/production/pickup-execution")) return "screen-bg-pickup";
  if (pathname.startsWith("/production/delivery-execution")) return "screen-bg-delivery";
  if (pathname.startsWith("/production/live-tracking")) return "screen-bg-live-tracking";
  if (pathname.startsWith("/production/parcel-intake")) return "screen-bg-parcel-intake";
  if (pathname.startsWith("/production/ocr-workbench")) return "screen-bg-ocr";
  if (pathname.startsWith("/production/warehouse-execution")) return "screen-bg-warehouse";
  return "screen-bg-default";
}

function AppLayout() {
  const location = useLocation();

  const screenBgClass = useMemo(
    () => getScreenBackgroundClass(location.pathname),
    [location.pathname]
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`enterprise-shell ${screenBgClass} flex h-screen w-full overflow-hidden`}>
        <Sidebar />

        <SidebarInset className="enterprise-main min-w-0 overflow-hidden bg-transparent">
          <header className="enterprise-topbar sticky top-0 z-30 flex h-16 items-center gap-3 px-4">
            <SidebarTrigger className="text-slate-700 hover:bg-white/50 hover:text-slate-900" />

            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Britium Express"
                className="h-9 w-9 rounded-xl object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                  Britium Express
                </div>
                <div className="text-sm font-bold text-slate-950">
                  Enterprise Operations Platform
                </div>
              </div>
            </div>
          </header>

          <main className="h-[calc(100vh-4rem)] overflow-y-auto p-4 md:p-8">
            <Outlet />
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

        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Placeholder title="Profile Dashboard" />} />
              <Route path="/wallet" element={<WalletHub />} />
              <Route path="/create-delivery" element={<CreateDelivery />} />
              <Route path="/way-management" element={<Placeholder title="Way Management" />} />

              <Route path="/supervisor" element={<SupervisorPortal />} />
              <Route path="/data-entry" element={<DataEntryPortal />} />
              <Route path="/marketing" element={<Placeholder title="Marketing Hub" />} />
              <Route path="/customer-service" element={<CustomerServicePortal />} />
              <Route path="/branch-office" element={<BranchOffice />} />
              <Route path="/deliverymen" element={<Placeholder title="Deliverymen" />} />
              <Route path="/receipts" element={<Placeholder title="Receipts" />} />
              <Route path="/reporting" element={<Placeholder title="Reporting" />} />
              <Route path="/settings" element={<Placeholder title="Settings" />} />

              <Route path="/admin/operations" element={<Placeholder title="Admin Operations" />} />
              <Route path="/admin/hr-admin" element={<Placeholder title="HR & Admin" />} />

              <Route path="/production/create-delivery" element={<CreateDelivery />} />
              <Route path="/production/pickup-execution" element={<Placeholder title="Pickup Execution" />} />
              <Route path="/production/delivery-execution" element={<Placeholder title="Delivery Execution" />} />
              <Route path="/production/focused-way-list" element={<Placeholder title="Focused Way List" />} />
              <Route path="/production/live-tracking" element={<Placeholder title="Live Tracking" />} />
              <Route path="/production/parcel-intake" element={<DataEntryPortal />} />
              <Route path="/production/ocr-workbench" element={<Placeholder title="OCR Workbench" />} />
              <Route path="/production/warehouse-execution" element={<Placeholder title="Warehouse Execution" />} />

              <Route path="/customer" element={<CustomerPortal />} />
              <Route path="/merchants" element={<Merchants />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
