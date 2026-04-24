import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from '../../_lib/serverSupabase.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const body = parseBody(req);
    const deliveryIds = Array.isArray(body.delivery_ids) ? body.delivery_ids.filter(Boolean) : [];
    const riderName = String(body.rider_name || "").trim();
    const riderPhone = String(body.rider_phone || "").trim();
    const note = String(body.note || "").trim();

    if (!deliveryIds.length) return send(res, 400, { error: "delivery_ids are required" });
    if (!riderName) return send(res, 400, { error: "rider_name is required" });

    const fetchRes = await supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .in("delivery_id", deliveryIds);

    if (fetchRes.error) return send(res, 500, { error: fetchRes.error.message });

    const rows = fetchRes.data || [];
    const now = new Date().toISOString();

    for (const row of rows) {
      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update({
          rider_name: riderName,
          rider_phone: riderPhone || null,
          rider_assigned_at: now,
          updated_at: now,
        })
        .eq("delivery_id", row.delivery_id);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await supabaseAdmin.from("way_status_logs").insert({
        delivery_id: row.delivery_id,
        pickup_id: row.pickup_id || null,
        action: "assign_rider",
        from_status: row.delivery_status || null,
        to_status: row.delivery_status || null,
        rider_name: riderName,
        rider_phone: riderPhone || null,
        note,
        payload: body,
      });
    }

    return send(res, 200, { ok: true, updated: rows.length });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Way assign rider API failed" });
  }
}
