import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Files,
  LayoutDashboard,
  LocateFixed,
  Map,
  Package,
  Receipt,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";

import { useT } from "@/hooks/useT";
import { canAccessPath } from "@/lib/roleAccess";
import LanguageToggle from "@/components/LanguageToggle";

type NavItem = {
  title: string;
  path: string;
  icon: LucideIcon;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    label: "General",
    items: [
      { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { title: "Create Delivery", path: "/create-delivery", icon: Package },
      { title: "Way Management", path: "/way-management", icon: Package },
    ],
  },
  {
    label: "Delivery Operations",
    items: [
      { title: "Delivery Workflow", path: "/delivery-workflow", icon: Truck },
      { title: "Delivery Dispatch", path: "/delivery-dispatch", icon: Truck },
      { title: "Delivery Exceptions", path: "/delivery-exceptions", icon: AlertTriangle },
      { title: "Pickup & Delivery Overview", path: "/pickup-delivery-overview", icon: Map },
      { title: "Pickup Control Center", path: "/pickup-control-center", icon: LocateFixed },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "COD Settlements", path: "/cod-settlements", icon: Wallet },
      { title: "Finance Reconciliation", path: "/finance-reconciliation", icon: Wallet },
      { title: "Finance Export", path: "/finance-export-pack", icon: Database },
      { title: "Batch Drill-Down", path: "/finance-batch-drilldown", icon: Database },
      { title: "Finance Exceptions", path: "/finance-exceptions", icon: AlertTriangle },
      { title: "Rider Settlement", path: "/rider-settlement-report", icon: Database },
    ],
  },
  {
    label: "Operations Control",
    items: [
      { title: "Operations Command", path: "/operations-command-center", icon: Activity },
      { title: "Executive Operations", path: "/executive-operations", icon: BarChart3 },
      { title: "Audit Logs", path: "/audit-logs", icon: ShieldCheck },
      { title: "Audit Anomalies", path: "/audit-anomalies", icon: ShieldCheck },
      { title: "Daily Exception Summary", path: "/daily-exception-summary", icon: ClipboardList },
    ],
  },
  {
    label: "Data Entry",
    items: [
      { title: "Data Entry Operations", path: "/data-entry-operations", icon: FileText },
      { title: "Delivered Registration", path: "/delivered-registration", icon: CheckCircle2 },
      { title: "Daily Consolidation", path: "/daily-consolidation", icon: Files },
      { title: "Tariff Master", path: "/master/tariffs", icon: Receipt },
    ],
  },
  {
    label: "Placeholders",
    items: [
      { title: "Admin HR", path: "/admin-hr", icon: ClipboardList },
      { title: "Warehouse Inbound", path: "/warehouse/inbound", icon: ClipboardList },
      { title: "Warehouse Staging", path: "/warehouse/staging", icon: ClipboardList },
      { title: "Warehouse Storage", path: "/warehouse/storage", icon: ClipboardList },
      { title: "Warehouse Outbound", path: "/warehouse/outbound", icon: ClipboardList },
      { title: "Warehouse QR", path: "/warehouse/qr", icon: ClipboardList },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { t: tr } = useT();

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessPath(item.path)),
    }))
    .filter((section) => section.items.length > 0);

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    if (path === "/home") return location.pathname === "/home";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside
      style={{
        width: 280,
        minWidth: 280,
        height: "100vh",
        overflowY: "auto",
        borderRight: "1px solid #e2e8f0",
        background: "#ffffff",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: ".12em",
            color: "#0f766e",
          }}
        >
          BRITIUM EXPRESS
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 20,
            fontWeight: 900,
            color: "#0f172a",
            lineHeight: 1.2,
          }}
        >
          Logistics Portal
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <LanguageToggle />
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {visibleSections.map((section) => (
          <div key={section.label}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: ".08em",
                color: "#64748b",
                marginBottom: 8,
                padding: "0 8px",
              }}
            >
              {tr(section.label)}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 12,
                      textDecoration: "none",
                      background: active ? "#0f766e" : "transparent",
                      color: active ? "#ffffff" : "#0f172a",
                      fontWeight: 700,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={16} />
                    <span>{tr(item.title)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
