import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });

    const q = String(req.query.q || "").trim().toLowerCase();
    const status = String(req.query.status || "").trim();

    let query = supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .order("receiver_township", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(500);

    if (status) query = query.eq("delivery_status", status);

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
        ].join(" ").toLowerCase().includes(q)
      );
    }

    const groups = new Map<string, any>();

    for (const row of rows) {
      const township = String(row.receiver_township || row.township || "Unassigned");
      if (!groups.has(township)) {
        groups.set(township, {
          township,
          total_ways: 0,
          total_cod: 0,
          total_weight: 0,
          ways: [],
        });
      }
      const g = groups.get(township);
      g.total_ways += 1;
      g.total_cod += num(row.waybill_total_cod || row.receivable || 0);
      g.total_weight += num(row.weight || row.weight_kg || 0);
      g.ways.push(row);
    }

    return send(res, 200, {
      ok: true,
      data: Array.from(groups.values()).sort((a, b) => a.township.localeCompare(b.township)),
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Way route plan API failed" });
  }
}
