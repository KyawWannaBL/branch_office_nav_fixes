export type AuditPreset = {
  id: string;
  name: string;
  actor: string;
  action: string;
  resource: string;
  dateFrom: string;
  dateTo: string;
  readonly?: boolean;
};

const STORAGE_KEY = "audit_log_viewer_presets_v1";

export const DEFAULT_AUDIT_PRESETS: AuditPreset[] = [
  {
    id: "default-finance-exports",
    name: "Finance Exports",
    actor: "",
    action: "finance.export",
    resource: "finance_export",
    dateFrom: "",
    dateTo: "",
    readonly: true,
  },
  {
    id: "default-dispatch-closeouts",
    name: "Dispatch Closeouts",
    actor: "",
    action: "dispatch.batch.closeout",
    resource: "dispatch_batch",
    dateFrom: "",
    dateTo: "",
    readonly: true,
  },
  {
    id: "default-exception-resolutions",
    name: "Exception Resolutions",
    actor: "",
    action: "finance.exception.resolve",
    resource: "dispatch_batch",
    dateFrom: "",
    dateTo: "",
    readonly: true,
  },
  {
    id: "default-rider-handovers",
    name: "Rider Handovers",
    actor: "",
    action: "rider.handover",
    resource: "rider_handover_report",
    dateFrom: "",
    dateTo: "",
    readonly: true,
  },
];

function safeParse(value: string | null): AuditPreset[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCustomAuditPresets(): AuditPreset[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function getAllAuditPresets(): AuditPreset[] {
  return [...DEFAULT_AUDIT_PRESETS, ...getCustomAuditPresets()];
}

export function saveAuditPreset(input: Omit<AuditPreset, "id" | "readonly">) {
  if (typeof window === "undefined") return null;

  const current = getCustomAuditPresets();
  const preset: AuditPreset = {
    id: "custom-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
    name: input.name.trim(),
    actor: input.actor || "",
    action: input.action || "",
    resource: input.resource || "",
    dateFrom: input.dateFrom || "",
    dateTo: input.dateTo || "",
    readonly: false,
  };

  const next = [preset, ...current];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return preset;
}

export function deleteAuditPreset(id: string) {
  if (typeof window === "undefined") return;
  const next = getCustomAuditPresets().filter((x) => x.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
