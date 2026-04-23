import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });

    const deliveryId = String(req.query.delivery_id || "").trim();
    if (!deliveryId) return send(res, 400, { error: "delivery_id is required" });

    const result = await supabaseAdmin
      .from("way_status_logs")
      .select("*")
      .eq("delivery_id", deliveryId)
      .order("created_at", { ascending: false });

    if (result.error) return send(res, 500, { error: result.error.message });

    return send(res, 200, { ok: true, data: result.data || [] });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Way history API failed" });
  }
}
