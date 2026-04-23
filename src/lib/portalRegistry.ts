export function normalizeRole(value?: string | null): string {
  return String(value || "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

export function defaultPortalForRole(role?: string | null): string {
  const r = normalizeRole(role);

  if (
    [
      "SYS",
      "APP_OWNER",
      "SUPER_ADMIN",
      "SUPER_A",
      "ADMIN",
      "ADM",
      "MGR",
    ].includes(r)
  ) {
    return "/admin-hr/admin";
  }

  if (["HR", "HR_ADMIN", "HR_MANAGER"].includes(r)) {
    return "/admin-hr/employees";
  }

  if (["SUPERVISOR", "SUP", "OPS_SUPERVISOR"].includes(r)) {
    return "/pickup-control-center";
  }

  if (["DATA_ENTRY", "DATAENTRY", "DEO"].includes(r)) {
    return "/data-entry-operations";
  }

  if (["CUSTOMER_SERVICE", "CS"].includes(r)) {
    return "/customer-service";
  }

  if (["CUSTOMER", "CUSTOMER_PORTAL"].includes(r)) {
    return "/create-delivery?source=CUS";
  }

  if (["OS", "ONLINE_STORE", "ONLINESTORE"].includes(r)) {
    return "/create-delivery?source=OS";
  }

  if (
    [
      "MERCHANT",
      "MERCHANT_ADMIN",
      "MERCHANT_OWNER",
      "MERCHANT_MANAGER",
      "MERCHANT_STAFF",
    ].includes(r)
  ) {
    return "/create-delivery?source=MER";
  }

  if (["WAREHOUSE", "WH", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"].includes(r)) {
    return "/warehouse";
  }

  if (["BRANCH", "BRANCH_OFFICE", "BRANCH_MANAGER"].includes(r)) {
    return "/branch-office";
  }

  if (["DELIVERYMAN", "DELIVERYMEN", "RIDER", "DRIVER"].includes(r)) {
    return "/deliverymen";
  }

  return "/dashboard";
}
