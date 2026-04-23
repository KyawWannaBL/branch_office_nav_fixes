import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function buildQuery(params?: QueryParams) {
  if (!params) return "";
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    sp.set(key, String(value));
  });

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();
const API_BASE = RAW_API_BASE.includes(".supabase.co")
  ? ""
  : RAW_API_BASE.replace(/\/+$/, "");

async function apiRequest<T = any>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON from ${path}, got ${contentType || "non-JSON response"}`);
  }

  const parsed = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(
      parsed?.error ||
      parsed?.message ||
      `Request failed (${response.status})`
    );
  }

  return (parsed?.data ?? parsed) as T;
}

export function usePickups(params?: QueryParams) {
  return useQuery({
    queryKey: ["pickups", params],
    queryFn: () => apiRequest("/api/v1/pickups" + buildQuery(params)),
    staleTime: 30000,
  });
}

export function useShipments(params?: QueryParams) {
  return useQuery({
    queryKey: ["shipments", params],
    queryFn: () => apiRequest("/api/v1/shipments" + buildQuery(params)),
    staleTime: 30000,
  });
}

export function useSettlements(params?: QueryParams) {
  return useQuery({
    queryKey: ["settlements", params],
    queryFn: () => apiRequest("/api/v1/settlements" + buildQuery(params)),
    staleTime: 30000,
  });
}

export function useCreatePickup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("/api/v1/pickups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pickups"] });
    },
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("/api/v1/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["pickups"] });
    },
  });
}

export function useBulkUpload() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("/api/v1/shipments/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["pickups"] });
    },
  });
}


export function useMasterParties(params?: QueryParams) {
  return useQuery({
    queryKey: ["master-parties", params],
    queryFn: () => apiRequest("/api/v1/master/parties" + buildQuery(params)),
    staleTime: 30000,
  });
}

export function useMasterLocations(params?: QueryParams) {
  return useQuery({
    queryKey: ["master-locations", params],
    queryFn: () => apiRequest("/api/v1/master/locations" + buildQuery(params)),
    staleTime: 30000,
  });
}
