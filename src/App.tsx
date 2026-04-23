import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Layout from "@/components/Layout";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";

import Dashboard from "./pages/Dashboard";
import CreateDelivery from "./pages/CreateDelivery";
import PickupRegistration from "./pages/PickupRegistration";
import DeliveryRegistration from "./pages/DeliveryRegistration";
import WayManagement from "./pages/WayManagement";
import SupervisorPortal from "./pages/SupervisorPortal";
import CustomerServicePortal from "./pages/CustomerServicePortal";
import MarketingPortal from "./pages/MarketingPortal";
import MerchantPortal from "./pages/MerchantPortal";
import CustomerPortal from "./pages/CustomerPortal";
import HRPortal from "./pages/HRPortal";
import DeliveryWorkflowOperations from "./pages/DeliveryWorkflowOperations";
import DeliveryDispatchBoard from "./pages/DeliveryDispatchBoard";
import DeliveryExceptionCenter from "./pages/DeliveryExceptionCenter";
import CodSettlementCenter from "./pages/CodSettlementCenter";
import FinanceReconciliationDashboard from "./pages/FinanceReconciliationDashboard";
import FinanceExportPack from "./pages/FinanceExportPack";
import FinanceBatchDrilldown from "./pages/FinanceBatchDrilldown";
import RiderSettlementReport from "./pages/RiderSettlementReport";
import OperationsCommandCenter from "./pages/OperationsCommandCenter";
import ExecutiveOperationsDashboard from "./pages/ExecutiveOperationsDashboard";
import AuditLogViewer from "./pages/AuditLogViewer";
import DataEntryOperationsDashboard from "./pages/DataEntryOperationsDashboard";
import DeliveredRegistration from "./pages/DeliveredRegistration";
import DailyConsolidation from "./pages/DailyConsolidation";
import PickupDeliveryOverview from "./pages/PickupDeliveryOverview";
import PickupControlCenter from "./pages/PickupControlCenter";
import TariffMaster from "./pages/TariffMaster";
import NotFoundPage from "./pages/NotFoundPage";

const queryClient = new QueryClient();

function PortalRoutes() {
  return (
    <Layout>
      <AppErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/reset-password" element={<Navigate to="/dashboard" replace />} />
          <Route path="/unauthorized" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-delivery" element={<CreateDelivery />} />
          <Route path="/pickup-registration" element={<CreateDelivery />} />
          <Route path="/delivery-registration" element={<CreateDelivery />} />

          <Route path="/way-management" element={<WayManagement />} />
                    <Route path="/supervisor" element={<SupervisorPortal />} />
          <Route path="/delivery-workflow" element={<DeliveryWorkflowOperations />} />
          <Route path="/delivery-dispatch" element={<DeliveryDispatchBoard />} />
          <Route path="/delivery-exceptions" element={<DeliveryExceptionCenter />} />

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
          <Route path="/pickup-delivery-overview" element={<PickupDeliveryOverview />} />
          <Route path="/pickup-control-center" element={<PickupControlCenter />} />
          <Route path="/master/tariffs" element={<TariffMaster />} />

          <Route path="/admin-hr" element={<HRPortal />} />
          <Route path="/admin-hr/employees" element={<HRPortal />} />
          <Route path="/admin-hr/approvals" element={<HRPortal />} />
          <Route path="/admin-hr/admin" element={<HRPortal />} />
          <Route path="/admin-hr/reports" element={<HRPortal />} />

          <Route path="/warehouse" element={<Navigate to="/dashboard" replace />} />
          <Route path="/warehouse/inbound" element={<Navigate to="/dashboard" replace />} />
          <Route path="/warehouse/staging" element={<Navigate to="/dashboard" replace />} />
          <Route path="/warehouse/storage" element={<Navigate to="/dashboard" replace />} />
          <Route path="/warehouse/outbound" element={<Navigate to="/dashboard" replace />} />
          <Route path="/warehouse/qr" element={<Navigate to="/dashboard" replace />} />

          <Route path="/merchant" element={<MerchantPortal />} />
          <Route path="/customer-service" element={<CustomerServicePortal />} />
          <Route path="/marketing" element={<MarketingPortal />} />
          <Route path="/customer" element={<CustomerPortal />} />
          <Route path="/branch-office" element={<Navigate to="/dashboard" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
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
