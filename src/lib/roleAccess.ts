import { inferRoleFromBrowserStorage } from "@/lib/roleLanding";

export function getCurrentRole(): string {
  return String(inferRoleFromBrowserStorage() || "unknown").trim().toLowerCase();
}

function isOneOf(role: string, values: string[]) {
  return values.includes(role);
}

export function canAccessPath(path: string, role?: string | null): boolean {
  const r = String(role || getCurrentRole()).trim().toLowerCase();
  const p = String(path || "").trim();

  if (!p) return true;


  if (p.startsWith("/audit-logs")) {
    return isOneOf(r, [
      "supervisor", "ops_manager", "operations", "operations_command",
      "finance", "finance_admin", "finance_manager",
      "admin", "admin_hr"
    ]);
  }

  if (
    p.startsWith("/operations-command-center") ||
    p.startsWith("/finance-batch-drilldown") ||
    p.startsWith("/finance-exceptions") ||
    p.startsWith("/executive-operations")
  ) {
    return isOneOf(r, ["supervisor", "ops_manager", "operations", "operations_command", "admin", "admin_hr"]);
  }

  if (
    p.startsWith("/finance-export-pack") ||
    p.startsWith("/finance-reconciliation") ||
    p.startsWith("/rider-settlement-report")
  ) {
    return isOneOf(r, ["finance", "finance_admin", "finance_manager", "admin", "admin_hr"]);
  }

  if (
    p.startsWith("/warehouse")
  ) {
    return isOneOf(r, ["warehouse", "warehouse_staff", "warehouse_admin", "admin", "admin_hr"]);
  }

  if (
    p.startsWith("/data-entry-operations") ||
    p.startsWith("/delivered-registration") ||
    p.startsWith("/daily-consolidation")
  ) {
    return isOneOf(r, ["data_entry", "dataentry", "supervisor", "admin", "admin_hr"]);
  }

  if (
    p.startsWith("/way-management") ||
    p.startsWith("/delivery-workflow") ||
    p.startsWith("/delivery-dispatch") ||
    p.startsWith("/delivery-exceptions") ||
    p.startsWith("/cod-settlements") ||
    p.startsWith("/pickup-control-center") ||
    p.startsWith("/pickup-delivery-overview")
  ) {
    return isOneOf(r, [
      "deliverymen", "deliveryman", "rider", "courier",
      "supervisor", "ops_manager", "operations", "data_entry",
      "admin", "admin_hr"
    ]);
  }

  if (p.startsWith("/admin-hr")) {
    return isOneOf(r, ["admin", "admin_hr", "hr", "human_resources"]);
  }

  return true;
}
