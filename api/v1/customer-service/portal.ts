import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

type Row = Record<string, any>;

async function readTableSafe(
  table: string,
  warnings: string[],
  orderBy = "updated_at",
  limit = 500
): Promise<Row[]> {
  try {
    const query = supabaseAdmin.from(table).select("*");
    const ordered =
      orderBy === "created_at"
        ? query.order("created_at", { ascending: false }).limit(limit)
        : query.order(orderBy, { ascending: false }).limit(limit);

    const { data, error } = await ordered;
    if (error) {
      warnings.push(`${table}: ${error.message}`);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    warnings.push(`${table}: ${error?.message || "read failed"}`);
    return [];
  }
}

function matchesQuery(row: Row, q: string) {
  if (!q) return true;
  const text = [
    row.delivery_id,
    row.pickup_id,
    row.receiver_name,
    row.receiver_phone,
    row.receiver_township,
    row.township,
    row.receiver_address,
    row.delivery_address,
    row.rider_name,
    row.rider_phone,
    row.merchant_name,
    row.contact_name,
    row.contact_phone,
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(q);
}

function normalizeDelivery(row: Row, pickupMap: Map<string, Row>) {
  const pickup = pickupMap.get(String(row.pickup_id || "").trim()) || null;
  return {
    ...row,
    delivery_id: String(row.delivery_id || ""),
    pickup_id: String(row.pickup_id || ""),
    receiver_name: row.receiver_name || "-",
    receiver_phone: row.receiver_phone || "-",
    receiver_township: row.receiver_township || row.township || "-",
    receiver_address: row.receiver_address || row.delivery_address || "-",
    merchant_name:
      row.merchant_name ||
      pickup?.merchant_name ||
      pickup?.business_name ||
      pickup?.contact_name ||
      "-",
    delivery_status: row.delivery_status || row.status || "UNKNOWN",
    rider_name: row.rider_name || "-",
    rider_phone: row.rider_phone || "-",
    base_fee: Number(row.base_fee || 0),
    surcharge: Number(row.surcharge || 0),
    merchant_charge: Number(row.merchant_charge || 0),
    cod_amount: Number(row.cod_amount || row.waybill_total_cod || row.receivable || 0),
    updated_at: row.updated_at || row.created_at || null,
    created_at: row.created_at || row.updated_at || null,
  };
}

function isFailed(row: Row) {
  const s = String(row.delivery_status || "").toUpperCase();
  return s.includes("FAILED");
}

function isReturned(row: Row) {
  const s = String(row.delivery_status || "").toUpperCase();
  return s.includes("RETURN");
}

function isDelivered(row: Row) {
  const s = String(row.delivery_status || "").toUpperCase();
  return s === "DELIVERED";
}

function olderThanHours(value: string | null | undefined, hours: number) {
  if (!value) return false;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts > hours * 60 * 60 * 1000;
}

function buildTimeline(
  selected: Row | null,
  pickupId: string,
  wayLogs: Row[],
  auditLogs: Row[]
) {
  if (!selected) return [];

  const deliveryId = String(selected.delivery_id || "");
  const items: Row[] = [];

  items.push({
    source: "delivery",
    action: "WAYBILL_CREATED",
    actor_name: selected.created_by || "System",
    actor_role: "SYSTEM",
    from_value: null,
    to_value: selected.delivery_status,
    created_at: selected.created_at,
    note: `Waybill ${deliveryId} created`,
  });

  for (const row of wayLogs) {
    if (String(row.delivery_id || "") !== deliveryId) continue;
    items.push({
      source: "way_status_logs",
      action: row.action || "STATUS_CHANGE",
      actor_name: row.rider_name || row.updated_by || "Operations",
      actor_role: "RIDER/OPS",
      from_value: row.from_status || null,
      to_value: row.to_status || null,
      created_at: row.created_at || row.updated_at,
      note: row.note || null,
    });
  }

  for (const row of auditLogs) {
    const ref = String(row.reference_id || "");
    const refType = String(row.reference_type || "").toUpperCase();
    if (
      (ref === deliveryId && refType.includes("DELIVERY")) ||
      (pickupId && ref === pickupId && refType.includes("PICKUP"))
    ) {
      items.push({
        source: "audit_logs",
        action: row.action || "AUDIT",
        actor_name: row.actor_name || row.user_id || "User",
        actor_role: row.actor_role || "USER",
        from_value: row.from_value || null,
        to_value: row.to_value || null,
        created_at: row.created_at,
        note: row.payload ? JSON.stringify(row.payload) : null,
      });
    }
  }

  return items
    .filter((x) => x.created_at)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const q = String(req.query.q || "").trim().toLowerCase();
    const selectedDeliveryId = String(req.query.selected_delivery_id || "").trim();
    const warnings: string[] = [];

    const pickups = await readTableSafe("pickups", warnings, "updated_at", 400);

    let deliveries = await readTableSafe("delivery_orders", warnings, "updated_at", 800);
    if (!deliveries.length) {
      deliveries = await readTableSafe("deliveries", warnings, "updated_at", 800);
    }

    const wayLogs = await readTableSafe("way_status_logs", warnings, "created_at", 1200);
    const auditLogs = await readTableSafe("audit_logs", warnings, "created_at", 1200);
    const attachments = await readTableSafe("attachments", warnings, "created_at", 800);

    const pickupMap = new Map<string, Row>();
    for (const row of pickups) {
      pickupMap.set(String(row.pickup_id || "").trim(), row);
    }

    const normalized = deliveries.map((row) => normalizeDelivery(row, pickupMap));
    const lookupResults = normalized.filter((row) => matchesQuery(row, q)).slice(0, 100);

    const failedQueue = normalized.filter(isFailed).slice(0, 50);
    const returnedQueue = normalized.filter(isReturned).slice(0, 50);
    const slaQueue = normalized
      .filter((row) => !isDelivered(row) && !isReturned(row) && olderThanHours(row.updated_at, 48))
      .slice(0, 50);

    const podReviewQueue = normalized
      .filter((row) => {
        if (!isDelivered(row)) return false;
        const deliveryId = String(row.delivery_id || "");
        const pickupId = String(row.pickup_id || "");
        const evid = attachments.filter((a) => {
          const ref = String(a.reference_id || "");
          return ref === deliveryId || ref === pickupId;
        });
        const hasPod = evid.some((a) => {
          const t = String(a.attachment_type || "").toUpperCase();
          return t.includes("POD") || t.includes("SIGNATURE");
        });
        return !hasPod;
      })
      .slice(0, 50);

    const openSupportIds = new Set<string>();
    [...failedQueue, ...returnedQueue, ...slaQueue, ...podReviewQueue].forEach((x) =>
      openSupportIds.add(String(x.delivery_id || ""))
    );

    const selected =
      lookupResults.find((x) => x.delivery_id === selectedDeliveryId) ||
      lookupResults[0] ||
      failedQueue[0] ||
      returnedQueue[0] ||
      slaQueue[0] ||
      podReviewQueue[0] ||
      null;

    const selectedPickupId = String(selected?.pickup_id || "");
    const selectedEvidence = selected
      ? attachments.filter((a) => {
          const ref = String(a.reference_id || "");
          return ref === String(selected.delivery_id || "") || ref === selectedPickupId;
        })
      : [];

    const merchantChildren = selectedPickupId
      ? normalized.filter((x) => String(x.pickup_id || "") === selectedPickupId).slice(0, 200)
      : [];

    const timeline = buildTimeline(selected, selectedPickupId, wayLogs, auditLogs);

    return send(res, 200, {
      ok: true,
      data: {
        kpis: {
          lookup_results: lookupResults.length,
          delivered_visible: lookupResults.filter(isDelivered).length,
          open_support_queues: openSupportIds.size,
          pod_review_queue: podReviewQueue.length,
        },
        lookup_results: lookupResults,
        selected,
        selected_pickup: selectedPickupId ? pickupMap.get(selectedPickupId) || null : null,
        timeline,
        evidence: selectedEvidence,
        merchant_children: merchantChildren,
        failed_queue: failedQueue,
        pod_review_queue: podReviewQueue,
        returned_queue: returnedQueue,
        sla_queue: slaQueue,
        warnings,
      },
    });
  } catch (error: any) {
    return send(res, 500, {
      error: error?.message || "Customer service portal failed",
    });
  }
}
