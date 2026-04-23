import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Layout from "@/components/Layout";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import RouteLoading from "@/components/RouteLoading";
import { TooltipProvider } from "@/components/ui/tooltip";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateDelivery = lazy(() => import("./pages/CreateDelivery"));
const WayManagement = lazy(() => import("./pages/WayManagement"));

const OperationsCommandCenter = lazy(() => import("./pages/OperationsCommandCenter"));
const ExecutiveOperationsDashboard = lazy(() => import("./pages/ExecutiveOperationsDashboard"));

const DeliveryWorkflowOperations = lazy(() => import("./pages/DeliveryWorkflowOperations"));
const DeliveryDispatchBoard = lazy(() => import("./pages/DeliveryDispatchBoard"));
const DeliveryExceptionCenter = lazy(() => import("./pages/DeliveryExceptionCenter"));

const CodSettlementCenter = lazy(() => import("./pages/CodSettlementCenter"));
const FinanceReconciliationDashboard = lazy(() => import("./pages/FinanceReconciliationDashboard"));
const FinanceExportPack = lazy(() => import("./pages/FinanceExportPack"));
const FinanceBatchDrilldown = lazy(() => import("./pages/FinanceBatchDrilldown"));
const RiderSettlementReport = lazy(() => import("./pages/RiderSettlementReport"));

const AuditLogViewer = lazy(() => import("./pages/AuditLogViewer"));

const DataEntryOperationsDashboard = lazy(() => import("./pages/DataEntryOperationsDashboard"));
const DeliveredRegistration = lazy(() => import("./pages/DeliveredRegistration"));
const DailyConsolidation = lazy(() => import("./pages/DailyConsolidation"));
const PickupDeliveryOverview = lazy(() => import("./pages/PickupDeliveryOverview"));
const PickupControlCenter = lazy(() => import("./pages/PickupControlCenter"));
const TariffMaster = lazy(() => import("./pages/TariffMaster"));
const PickupRegistration = lazy(() => import("./pages/PickupRegistration"));
const DeliveryRegistration = lazy(() => import("./pages/DeliveryRegistration"));

const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const queryClient = new QueryClient();

function PortalRoutes() {
  return (
    <Layout>
      <AppErrorBoundary>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/reset-password" element={<Navigate to="/dashboard" replace />} />
            <Route path="/unauthorized" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pickup-registration" element={<PickupRegistration />} />
           <Route path="/delivery-registration" element={<DeliveryRegistration />} />
           <Route path="/create-delivery" element={<Navigate to="/delivery-registration" replace />} />
            <Route path="/way-management" element={<WayManagement />} />

            <Route path="/delivery-workflow" element={<DeliveryWorkflowOperations />} />
            <Route path="/delivery-dispatch" element={<DeliveryDispatchBoard />} />
            <Route path="/delivery-exceptions" element={<DeliveryExceptionCenter />} />

            <Route path="/pickup-delivery-overview" element={<PickupDeliveryOverview />} />
            <Route path="/pickup-control-center" element={<PickupControlCenter />} />

            <Route path="/cod-settlements" element={<CodSettlementCenter />} />
            <Route path="/finance-reconciliation" element={<FinanceReconciliationDashboard />} />
            <Route path="/finance-export-pack" element={<FinanceExportPack />} />
            <Route path="/finance-batch-drilldown" element={<FinanceBatchDrilldown />} />
            <Route path="/finance-exceptions" element={<Navigate to="/finance-batch-drilldown" replace />} />
            <Route path="/rider-settlement-report" element={<RiderSettlementReport />} />

            <Route path="/operations-command-center" element={<OperationsCommandCenter />} />
            <Route path="/executive-operations" element={<ExecutiveOperationsDashboard />} />

            <Route path="/audit-logs" element={<AuditLogViewer />} />
            <Route path="/audit-anomalies" element={<Navigate to="/audit-logs" replace />} />
            <Route path="/daily-exception-summary" element={<Navigate to="/audit-logs" replace />} />

            <Route path="/data-entry-operations" element={<DataEntryOperationsDashboard />} />
            <Route path="/delivered-registration" element={<DeliveredRegistration />} />
            <Route path="/daily-consolidation" element={<DailyConsolidation />} />
            <Route path="/master/tariffs" element={<TariffMaster />} />

            <Route path="/admin-hr" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin-hr/employees" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin-hr/approvals" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin-hr/admin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin-hr/reports" element={<Navigate to="/dashboard" replace />} />

            <Route path="/warehouse" element={<Navigate to="/dashboard" replace />} />
            <Route path="/warehouse/inbound" element={<Navigate to="/dashboard" replace />} />
            <Route path="/warehouse/staging" element={<Navigate to="/dashboard" replace />} />
            <Route path="/warehouse/storage" element={<Navigate to="/dashboard" replace />} />
            <Route path="/warehouse/outbound" element={<Navigate to="/dashboard" replace />} />
            <Route path="/warehouse/qr" element={<Navigate to="/dashboard" replace />} />

            <Route path="/merchant" element={<Navigate to="/dashboard" replace />} />
            <Route path="/customer-service" element={<Navigate to="/dashboard" replace />} />
            <Route path="/marketing" element={<Navigate to="/dashboard" replace />} />
            <Route path="/customer" element={<Navigate to="/dashboard" replace />} />
            <Route path="/branch-office" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <PortalRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}