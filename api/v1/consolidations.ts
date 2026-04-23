import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/serverSupabase.js";

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

function nextId(dateStr: string, hub: string, prefix: string, seq: number) {
  const d = String(dateStr || "").split("-");
  const mmdd = `${d[1] || "00"}${d[2] || "00"}`;
  return `${prefix}${mmdd}-${hub}-${String(seq).padStart(3, "0")}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const listRes = await supabaseAdmin
        .from("daily_consolidation_batches")
        .select("*, daily_consolidation_pickups(*)")
        .order("consolidation_date", { ascending: false })
        .order("updated_at", { ascending: false });

      if (listRes.error) return send(res, 500, { error: listRes.error.message });
      return send(res, 200, { ok: true, data: listRes.data || [] });
    }

    if (req.method !== "POST") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const body = parseBody(req);
    const batch = body?.batch || {};
    const pickupIds = Array.isArray(body?.pickup_ids) ? body.pickup_ids : [];

    const dayRes = await supabaseAdmin
      .from("daily_consolidation_batches")
      .select("consolidated_id")
      .eq("consolidation_date", batch.consolidation_date)
      .eq("hub_code", batch.hub_code);

    if (dayRes.error) return send(res, 500, { error: dayRes.error.message });

    const seq = (dayRes.data || []).length + 1;
    const consolidatedId = batch.consolidated_id || nextId(batch.consolidation_date, batch.hub_code || "HUB", "CON", seq);

    const batchRes = await supabaseAdmin
      .from("daily_consolidation_batches")
      .upsert({
        consolidated_id: consolidatedId,
        consolidation_date: batch.consolidation_date,
        hub_code: batch.hub_code || "HUB",
        route_code: batch.route_code || null,
        vehicle_no: batch.vehicle_no || null,
        driver_name: batch.driver_name || null,
        status: batch.status || "OPEN",
        remarks: batch.remarks || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "consolidated_id" })
      .select("*")
      .single();

    if (batchRes.error) return send(res, 500, { error: batchRes.error.message });

    const savedBatch = batchRes.data;

    for (const pickupId of pickupIds) {
      const pickupRes = await supabaseAdmin
        .from("pickup_batches")
        .select("*")
        .eq("pickup_id", pickupId)
        .maybeSingle();

      if (pickupRes.error) return send(res, 500, { error: pickupRes.error.message });
      if (!pickupRes.data) continue;

      const rowRes = await supabaseAdmin
        .from("daily_consolidation_pickups")
        .upsert({
          batch_id: savedBatch.id,
          consolidated_id: consolidatedId,
          pickup_id: pickupId,
          merchant_name: pickupRes.data.merchant_name || null,
          total_way_count: pickupRes.data.actual_way_count || pickupRes.data.expected_way_count || 0,
          total_weight_kg: 0,
        }, { onConflict: "batch_id,pickup_id" });

      if (rowRes.error) return send(res, 500, { error: rowRes.error.message });

      await supabaseAdmin
        .from("delivery_orders")
        .update({
          consolidated_id: consolidatedId,
          updated_at: new Date().toISOString(),
        })
        .eq("pickup_id", pickupId);
    }

    return send(res, 200, {
      ok: true,
      consolidated_id: consolidatedId,
      batch: savedBatch,
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Consolidation failed" });
  }
}
