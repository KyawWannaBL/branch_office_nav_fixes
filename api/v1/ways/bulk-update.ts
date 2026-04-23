import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

function parseBody(req: VercelRequest) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

async function logWay(row: any, toStatus: string, note: string, payload: unknown) {
  await supabaseAdmin.from("way_status_logs").insert({
    delivery_id: row.delivery_id,
    pickup_id: row.pickup_id || null,
    action: "bulk_status_update",
    from_status: row.delivery_status || null,
    to_status: toStatus,
    rider_name: row.rider_name || null,
    rider_phone: row.rider_phone || null,
    note,
    payload,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const body = parseBody(req);
    const deliveryIds = Array.isArray(body.delivery_ids) ? body.delivery_ids.filter(Boolean) : [];
    const toStatus = String(body.to_status || "").trim();
    const note = String(body.note || "").trim();

    if (!deliveryIds.length) return send(res, 400, { error: "delivery_ids are required" });
    if (!toStatus) return send(res, 400, { error: "to_status is required" });

    const fetchRes = await supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .in("delivery_id", deliveryIds);

    if (fetchRes.error) return send(res, 500, { error: fetchRes.error.message });

    const rows = fetchRes.data || [];
    const now = new Date().toISOString();

    for (const row of rows) {
      const patch: Record<string, any> = {
        delivery_status: toStatus,
        updated_at: now,
      };

      if (toStatus === "OUT_FOR_DELIVERY") patch.out_for_delivery_at = now;
      if (toStatus === "RETURNED") patch.returned_at = now;
      if (toStatus === "FAILED_ATTEMPT") {
        patch.failed_attempt_at = now;
        patch.failed_attempt_count = Number(row.failed_attempt_count || 0) + 1;
      }

      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update(patch)
        .eq("delivery_id", row.delivery_id);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await logWay(row, toStatus, note, body);
    }

    return send(res, 200, { ok: true, updated: rows.length });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Way bulk update API failed" });
  }
}
