import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Sidebar } from "./components/Sidebar";

// Core pages
import Dashboard from "./pages/Dashboard";
import CreateDelivery from "./pages/CreateDelivery";
import WayManagement from "./pages/WayManagement";
import Deliverymen from "./pages/Deliverymen";
import Merchants from "./pages/Merchants";
import Waybill from "@/pages/waybill"; // keep lowercase if your file is src/pages/waybill.tsx
import Reporting from "./pages/Reporting";
import Settings from "./pages/Settings";
import SupervisorPortal from "./pages/SupervisorPortal";
import DataEntryPortal from "./pages/DataEntryPortal";
import CustomerServicePortal from "./pages/CustomerServicePortal";
import CustomerPortal from "./pages/CustomerPortal";

// Extended pages
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import WarehouseOperations from "./pages/WarehouseOperations";
import AdminOperations from "./pages/AdminOperations";
import ProfileDashboard from "./pages/ProfileDashboard";
import WalletHub from "./pages/WalletHub";
import BranchOffice from "./pages/BranchOffice";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/*"
            element={
              <SidebarProvider defaultOpen={false}>
                <div className="flex h-screen w-full overflow-hidden bg-background">
                  <Sidebar />
                  <SidebarInset>
                    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur">
                      <SidebarTrigger className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" />
                      <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                        Britium Express Enterprise Platform
                      </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                      <Suspense
                        fallback={
                          <div className="flex h-full items-center justify-center">
                            Loading Britium Express...
                          </div>
                        }
                      >
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/profile/*" element={<ProfileDashboard />} />
                          <Route path="/wallet/*" element={<WalletHub />} />

                          <Route path="/create-delivery" element={<CreateDelivery />} />
                          <Route path="/way-management" element={<WayManagement />} />

                          <Route path="/supervisor/*" element={<SupervisorPortal />} />
                          <Route path="/data-entry/*" element={<DataEntryPortal />} />
                          <Route path="/customer-service/*" element={<CustomerServicePortal />} />
                          <Route path="/customer/*" element={<CustomerPortal />} />
                          <Route path="/merchant/*" element={<Merchants />} />
                          <Route path="/branch-office/*" element={<BranchOffice />} />
                          <Route path="/warehouse/*" element={<WarehouseOperations />} />
                          <Route path="/admin-hr/*" element={<AdminOperations />} />
                          <Route path="/deliverymen/*" element={<Deliverymen />} />

                          <Route path="/waybill/*" element={<Waybill />} />
                          <Route path="/reporting/*" element={<Reporting />} />
                          <Route path="/settings/*" element={<Settings />} />

                          <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </Suspense>
                    </main>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;