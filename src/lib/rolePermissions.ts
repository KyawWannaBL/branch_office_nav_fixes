import { getCurrentRole } from "@/lib/roleAccess";

export type AppAction =
  | "dispatch.batch.create"
  | "dispatch.batch.scan"
  | "dispatch.batch.closeout"
  | "dispatch.batch.print"
  | "finance.exception.resolve"
  | "finance.export"
  | "rider.handover.save"
  | "rider.handover.print"
  | "route.sequence.save"
  | "way.bulk.update"
  | "way.assign.rider";

function isOneOf(role: string, values: string[]) {
  return values.includes(role);
}

export function canPerformAction(action: AppAction, role?: string | null): boolean {
  const r = String(role || getCurrentRole()).trim().toLowerCase();

  if (action === "dispatch.batch.create") {
    return isOneOf(r, ["supervisor", "ops_manager", "operations", "data_entry", "admin", "admin_hr"]);
  }

  if (action === "dispatch.batch.scan") {
    return isOneOf(r, ["supervisor", "ops_manager", "operations", "deliverymen", "deliveryman", "rider", "courier", "admin", "admin_hr"]);
  }

  if (action === "dispatch.batch.closeout") {
    return isOneOf(r, ["supervisor", "ops_manager", "operations", "finance", "finance_admin", "finance_manager", "admin", "admin_hr"]);
  }

  if (action === "dispatch.batch.print") {
    return isOneOf(r, ["supervisor", "ops_manager", "operations", "data_entry", "finance", "finance_admin", "finance_manager", "admin", "admin_hr"]);
  }

  if (action === "finance.exception.resolve") {
    return isOneOf(r, ["finance", "finance_admin", "finance_manager", "admin", "admin_hr"]);
  }

  if (action === "finance.export") {
    return isOneOf(r, ["finance", "finance_admin", "finance_manager", "admin", "admin_hr"]);
  }

  if (action === "rider.handover.save" || action === "rider.handover.print") {
    return isOneOf(r, ["finance", "finance_admin", "finance_manager", "supervisor", "admin", "admin_hr"]);
  }

  if (action === "route.sequence.save") {
    return isOneOf(r, ["supervisor", "ops_manager", "operations", "data_entry", "admin", "admin_hr"]);
  }

  if (action === "way.bulk.update" || action === "way.assign.rider") {
    return isOneOf(r, ["supervisor", "ops_manager", "operations", "data_entry", "admin", "admin_hr"]);
  }

  return false;
}
