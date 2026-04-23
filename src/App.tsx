import React, { Suspense, lazy } from "react";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import RouteLoading from "@/components/RouteLoading";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import RoleGuard from "@/components/RoleGuard";

// Core pages
import Dashboard from "./pages/Dashboard";
import WayManagement from "./pages/WayManagement";
import Deliverymen from "./pages/Deliverymen";
import Merchants from "./pages/Merchants";
import Waybill from "@/pages/Waybill";
import Reporting from "./pages/Reporting";
import Settings from "./pages/Settings";
import SupervisorPortal from "./pages/SupervisorPortal";
import DataEntryPortal from "./pages/DataEntryPortal";
import MarketingPortal from "./pages/MarketingPortal";
import CustomerServicePortal from "./pages/CustomerServicePortal";
import CustomerPortal from "./pages/CustomerPortal";
import FinancialCenter from "./pages/FinancialCenter";

// Extended pages
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import WarehouseOperations from "./pages/WarehouseOperations";
import AdminOperations from "./pages/AdminOperations";
import ProfileDashboard from "./pages/ProfileDashboard";
import WalletHub from "./pages/WalletHub";
import BranchOffice from "./pages/BranchOffice";
import NotFoundPage from "./pages/NotFoundPage";

const CreateDelivery = lazy(() => import("./pages/CreateDelivery"));
const DeliveredRegistration = lazy(() => import("./pages/DeliveredRegistration"));
const DailyConsolidation = lazy(() => import("./pages/DailyConsolidation"));
const PickupDeliveryOverview = lazy(() => import("./pages/PickupDeliveryOverview"));
const PickupControlCenter = lazy(() => import("./pages/PickupControlCenter"));
const DataEntryOperationsDashboard = lazy(() => import("./pages/DataEntryOperationsDashboard"));
const TariffMaster = lazy(() => import("./pages/TariffMaster"));
const DeliveryWorkflowOperations = lazy(() => import("./pages/DeliveryWorkflowOperations"));
const DeliveryDispatchBoard = lazy(() => import("./pages/DeliveryDispatchBoard"));
const DeliveryExceptionCenter = lazy(() => import("./pages/DeliveryExceptionCenter"));
const CodSettlementCenter = lazy(() => import("./pages/CodSettlementCenter"));
const FinanceReconciliationDashboard = lazy(() => import("./pages/FinanceReconciliationDashboard"));
const ExecutiveOperationsDashboard = lazy(() => import("./pages/ExecutiveOperationsDashboard"));
const RiderSettlementReport = lazy(() => import("./pages/RiderSettlementReport"));
const FinanceExportPack = lazy(() => import("./pages/FinanceExportPack"));
const FinanceBatchDrilldown = lazy(() => import("./pages/FinanceBatchDrilldown"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route
              path="/*"
              element={
                <Layout>
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center p-6">
                        Loading Britium Express...
                      </div>
                    }
                  >
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/home" element={<RoleLanding />} />
                      <Route path="/profile/*" element={<ProfileDashboard />} />
                      <Route path="/wallet/*" element={<WalletHub />} />

                      <Route path="/create-delivery" element={<CreateDelivery />} />
                      <Route path="/way-management" element={<RoleGuard path="/way-management"><WayManagement /></RoleGuard>} />

                      <Route path="/supervisor/*" element={<SupervisorPortal />} />
                      <Route path="/data-entry/*" element={<DataEntryPortal />} />
                      <Route path="/marketing/*" element={<MarketingPortal />} />
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
                      <Route path="/finance/*" element={<FinancialCenter />} />

                      <Route path="/delivered-registration" element={<DeliveredRegistration />} />
                      <Route path="/daily-consolidation" element={<DailyConsolidation />} />
                      <Route path="/pickup-delivery-overview" element={<PickupDeliveryOverview />} />
                      <Route path="/pickup-control-center" element={<PickupControlCenter />} />
                      <Route path="/data-entry-operations" element={<RoleGuard path="/data-entry-operations"><DataEntryOperationsDashboard /></RoleGuard>} />
                      <Route path="/master/tariffs" element={<TariffMaster />} />
                      <Route path="/delivery-workflow" element={<RoleGuard path="/delivery-workflow"><DeliveryWorkflowOperations /></RoleGuard>} />
                      <Route path="/delivery-dispatch" element={<RoleGuard path="/delivery-dispatch"><DeliveryDispatchBoard /></RoleGuard>} />
                      <Route path="/delivery-exceptions" element={<RoleGuard path="/delivery-exceptions"><DeliveryExceptionCenter /></RoleGuard>} />
                      <Route path="/cod-settlements" element={<RoleGuard path="/cod-settlements"><CodSettlementCenter /></RoleGuard>} />
                      <Route path="/finance-reconciliation" element={<FinanceReconciliationDashboard />} />
                      <Route path="/executive-operations" element={<ExecutiveOperationsDashboard />} />
                      <Route path="/rider-settlement-report" element={<RoleGuard path="/rider-settlement-report"><RiderSettlementReport /></RoleGuard>} />
                      <Route path="/finance-export-pack" element={<RoleGuard path="/finance-export-pack"><FinanceExportPack /></RoleGuard>} />
                      <Route path="/finance-batch-drilldown" element={<RoleGuard path="/finance-batch-drilldown"><FinanceBatchDrilldown /></RoleGuard>} />

                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </Layout>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
