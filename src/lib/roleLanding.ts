export type AppRole =
  | "supervisor"
  | "finance"
  | "warehouse"
  | "admin_hr"
  | "data_entry"
  | "merchant"
  | "customer_service"
  | "marketing"
  | "customer"
  | "deliverymen"
  | "branch_office"
  | "unknown";

export function resolveRoleLanding(role?: string | null): string {
  const r = String(role || "").trim().toLowerCase();

  if (["supervisor", "ops_manager", "operations", "operations_command"].includes(r)) return "/operations-command-center";
  if (["finance", "finance_admin", "finance_manager"].includes(r)) return "/finance-export-pack";
  if (["warehouse", "warehouse_staff", "warehouse_admin"].includes(r)) return "/warehouse/inbound";
  if (["admin", "admin_hr", "hr", "human_resources"].includes(r)) return "/admin-hr";
  if (["data_entry", "dataentry"].includes(r)) return "/data-entry-operations";
  if (["merchant", "merchant_user"].includes(r)) return "/merchant";
  if (["customer_service", "cs"].includes(r)) return "/customer-service";
  if (["marketing"].includes(r)) return "/marketing";
  if (["customer"].includes(r)) return "/customer";
  if (["deliverymen", "deliveryman", "rider", "courier"].includes(r)) return "/way-management";
  if (["branch_office", "branch"].includes(r)) return "/branch-office";

  return "/dashboard";
}

function tryParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function deepFindRole(input: any): string | null {
  if (!input || typeof input !== "object") return null;

  const directKeys = ["role", "user_role", "userRole", "portal_role", "portalRole"];
  for (const key of directKeys) {
    if (typeof input[key] === "string" && input[key].trim()) return input[key];
  }

  const nested = [
    input.user,
    input.profile,
    input.session,
    input.currentSession,
    input.user_metadata,
    input.app_metadata,
    input.currentSession?.user,
    input.session?.user,
    input.user?.user_metadata,
    input.user?.app_metadata,
    input.currentSession?.user?.user_metadata,
    input.currentSession?.user?.app_metadata,
  ];

  for (const item of nested) {
    const found = deepFindRole(item);
    if (found) return found;
  }

  return null;
}

export function inferRoleFromBrowserStorage(): string | null {
  if (typeof window === "undefined") return null;

  const candidateKeys = [
    "user",
    "profile",
    "currentUser",
    "auth_user",
    "session",
    "auth",
    "britium_user",
    "britium_profile",
  ];

  for (const key of candidateKeys) {
    const parsed = tryParse(window.localStorage.getItem(key));
    const found = deepFindRole(parsed);
    if (found) return found;
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;

    if (
      key.includes("auth-token") ||
      key.includes("supabase") ||
      key.includes("session") ||
      key.includes("profile")
    ) {
      const parsed = tryParse(window.localStorage.getItem(key));
      const found = deepFindRole(parsed);
      if (found) return found;
    }
  }

  return null;
}
