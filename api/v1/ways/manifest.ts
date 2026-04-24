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
    if (req.method === "GET") {
      const deliveryIds = String(req.query.delivery_ids || "").trim().split(",").map(x => x.trim()).filter(Boolean);
      if (!deliveryIds.length) return send(res, 400, { error: "delivery_ids are required" });

      const result = await supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .in("delivery_id", deliveryIds)
        .order("receiver_township", { ascending: true });

      if (result.error) return send(res, 500, { error: result.error.message });

      return send(res, 200, { ok: true, data: result.data || [] });
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      const deliveryIds = Array.isArray(body.delivery_ids) ? body.delivery_ids.filter(Boolean) : [];
      const printType = String(body.print_type || "MANIFEST").trim();
      const printedBy = String(body.printed_by || "").trim();

      if (!deliveryIds.length) return send(res, 400, { error: "delivery_ids are required" });

      const result = await supabaseAdmin
        .from("delivery_orders")
        .select("delivery_id,pickup_id")
        .in("delivery_id", deliveryIds);

      if (result.error) return send(res, 500, { error: result.error.message });

      for (const row of result.data || []) {
        await supabaseAdmin.from("way_print_logs").insert({
          delivery_id: row.delivery_id,
          pickup_id: row.pickup_id || null,
          print_type: printType,
          printed_by: printedBy || null,
        });
      }

      return send(res, 200, { ok: true, logged: (result.data || []).length });
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Way manifest API failed" });
  }
}
