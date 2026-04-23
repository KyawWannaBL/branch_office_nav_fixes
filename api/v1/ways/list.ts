import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase.js";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const q = String(req.query.q || "").trim().toLowerCase();
    const status = String(req.query.status || "").trim();
    const rider = String(req.query.rider_name || "").trim();

    let query = supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (status) query = query.eq("delivery_status", status);
    if (rider) query = query.eq("rider_name", rider);

    const result = await query;
    if (result.error) return send(res, 500, { error: result.error.message });

    let rows = result.data || [];
    if (q) {
      rows = rows.filter((row: any) =>
        [
          row.delivery_id,
          row.pickup_id,
          row.receiver_name,
          row.receiver_phone,
          row.receiver_township,
          row.township,
          row.rider_name,
          row.run_sheet_id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return send(res, 200, { ok: true, data: rows });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Way list API failed" });
  }
}
