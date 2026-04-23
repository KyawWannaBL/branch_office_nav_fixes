import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isoDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const [pickupsRes, deliveriesRes, settlementsRes] = await Promise.all([
      supabaseAdmin
        .from("pickup_batches")
        .select("*")
        .order("pickup_date", { ascending: false })
        .limit(1500),
      supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(3000),
      supabaseAdmin
        .from("cod_settlement_batches")
        .select("*")
        .order("settlement_date", { ascending: false })
        .limit(1000),
    ]);

    if (pickupsRes.error) return send(res, 500, { error: pickupsRes.error.message });
    if (deliveriesRes.error) return send(res, 500, { error: deliveriesRes.error.message });
    if (settlementsRes.error) return send(res, 500, { error: settlementsRes.error.message });

    const pickups = pickupsRes.data || [];
    const deliveries = deliveriesRes.data || [];
    const settlements = settlementsRes.data || [];

    const summary = {
      total_pickups: pickups.length,
      draft_pickups: pickups.filter((x: any) => String(x.pickup_status || "").toUpperCase() === "DRAFT").length,
      saved_pickups: pickups.filter((x: any) => String(x.pickup_status || "").toUpperCase() === "SAVED").length,
      submitted_pickups: pickups.filter((x: any) => String(x.pickup_status || "").toUpperCase() === "SUBMITTED").length,

      total_deliveries: deliveries.length,
      out_for_delivery: deliveries.filter((x: any) => String(x.delivery_status || "").toUpperCase() === "OUT_FOR_DELIVERY").length,
      delivered: deliveries.filter((x: any) => String(x.delivery_status || "").toUpperCase() === "DELIVERED").length,
      failed_attempts: deliveries.filter((x: any) => String(x.delivery_status || "").toUpperCase() === "FAILED_ATTEMPT").length,
      returned: deliveries.filter((x: any) => String(x.delivery_status || "").toUpperCase() === "RETURNED").length,

      cod_expected: deliveries.reduce((a: number, x: any) => a + num(x.waybill_total_cod || x.receivable || 0), 0),
      cod_collected: deliveries.reduce((a: number, x: any) => a + num(x.cod_collected_amount || 0), 0),

      settlement_batches: settlements.length,
      posted_settlements: settlements.filter((x: any) => String(x.status || "").toUpperCase() === "POSTED").length,
      settlement_shortage: settlements.reduce((a: number, x: any) => a + num(x.shortage_amount || 0), 0),
      settlement_overage: settlements.reduce((a: number, x: any) => a + num(x.overage_amount || 0), 0),
    };

    const trend = [];
    for (let i = -6; i <= 0; i += 1) {
      const day = isoDay(i);

      trend.push({
        day,
        pickups: pickups.filter((x: any) => String(x.pickup_date || "").slice(0, 10) === day).length,
        delivered: deliveries.filter((x: any) => String(x.delivered_at || "").slice(0, 10) === day).length,
        failed_attempts: deliveries.filter((x: any) => String(x.failed_attempt_at || "").slice(0, 10) === day).length,
        returned: deliveries.filter((x: any) => String(x.returned_at || "").slice(0, 10) === day).length,
        cod_collected: deliveries
          .filter((x: any) => String(x.cod_collected_at || "").slice(0, 10) === day)
          .reduce((a: number, x: any) => a + num(x.cod_collected_amount || 0), 0),
        settlement_batches: settlements.filter((x: any) => String(x.settlement_date || "").slice(0, 10) === day).length,
      });
    }

    return send(res, 200, {
      ok: true,
      summary,
      trend,
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Executive overview API failed" });
  }
}
