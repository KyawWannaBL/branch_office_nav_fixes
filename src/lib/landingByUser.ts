import { defaultPortalForRole, normalizeRole } from "@/lib/portalRegistry";

function roleFromUser(user: any): string {
  return (
    user?.user_metadata?.roleCode ||
    user?.user_metadata?.role_code ||
    user?.user_metadata?.app_role ||
    user?.user_metadata?.user_role ||
    user?.user_metadata?.role ||
    ""
  );
}

export function landingByUser(user: any): string {
  const email = String(user?.email || "").trim().toLowerCase();

  if (["md@britiumexpress.com", "sai@britiumexpress.com"].includes(email)) {
    return "/admin-hr/admin";
  }

  const role = normalizeRole(roleFromUser(user));

  if (["DATA_ENTRY", "DATAENTRY", "DEO"].includes(role)) {
    return "/data-entry-operations";
  }

  if (["SUPERVISOR", "SUP", "OPS_SUPERVISOR"].includes(role)) {
    return "/pickup-control-center";
  }

  if (["MERCHANT", "MERCHANT_ADMIN", "MERCHANT_OWNER", "MERCHANT_MANAGER", "MERCHANT_STAFF"].includes(role)) {
    return "/create-delivery?source=MER";
  }

  if (["CUSTOMER", "CUSTOMER_PORTAL"].includes(role)) {
    return "/create-delivery?source=CUS";
  }

  if (["OS", "ONLINE_STORE", "ONLINESTORE"].includes(role)) {
    return "/create-delivery?source=OS";
  }

  return defaultPortalForRole(role);
}
