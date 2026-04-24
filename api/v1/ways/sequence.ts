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

function normalizeTownship(row: any) {
  return String(row.receiver_township || row.township || "Unassigned").trim();
}

function normalizeAddress(row: any) {
  return String(row.receiver_address || row.delivery_address || "").trim().toLowerCase();
}

function normalizeReceiver(row: any) {
  return String(row.receiver_name || "").trim().toLowerCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const township = String(req.query.township || "").trim();

      let query = supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);

      const result = await query;
      if (result.error) return send(res, 500, { error: result.error.message });

      let rows = result.data || [];
      if (township) {
        rows = rows.filter((row: any) => normalizeTownship(row) === township);
      }

      rows = rows
        .slice()
        .sort((a: any, b: any) => {
          const ta = normalizeTownship(a).localeCompare(normalizeTownship(b));
          if (ta !== 0) return ta;
          const aa = normalizeAddress(a).localeCompare(normalizeAddress(b));
          if (aa !== 0) return aa;
          return normalizeReceiver(a).localeCompare(normalizeReceiver(b));
        })
        .map((row: any, index: number) => ({
          ...row,
          suggested_sequence: index + 1,
        }));

      return send(res, 200, { ok: true, data: rows });
    }

    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const body = parseBody(req);
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) return send(res, 400, { error: "items are required" });

    for (const item of items) {
      const deliveryId = String(item.delivery_id || "").trim();
      const seq = Number(item.route_sequence || 0);

      if (!deliveryId || !Number.isFinite(seq) || seq <= 0) continue;

      const fetchRes = await supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .eq("delivery_id", deliveryId)
        .maybeSingle();

      if (fetchRes.error) return send(res, 500, { error: fetchRes.error.message });
      if (!fetchRes.data) continue;

      const row = fetchRes.data;

      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update({
          route_sequence: seq,
          updated_at: new Date().toISOString(),
        })
        .eq("delivery_id", deliveryId);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await supabaseAdmin.from("way_status_logs").insert({
        delivery_id: row.delivery_id,
        pickup_id: row.pickup_id || null,
        action: "route_sequence_update",
        from_status: row.delivery_status || null,
        to_status: row.delivery_status || null,
        rider_name: row.rider_name || null,
        rider_phone: row.rider_phone || null,
        note: `Route sequence set to ${seq}`,
        payload: { route_sequence: seq },
      });
    }

    return send(res, 200, { ok: true, updated: items.length });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Way sequence API failed" });
  }
}
