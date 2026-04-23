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
        .from("delivery_completion_batches")
        .select("*, delivery_completion_items(*)")
        .order("delivery_date", { ascending: false })
        .order("updated_at", { ascending: false });

      if (listRes.error) return send(res, 500, { error: listRes.error.message });
      return send(res, 200, { ok: true, data: listRes.data || [] });
    }

    if (req.method !== "POST") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const body = parseBody(req);
    const batch = body?.batch || {};
    const items = Array.isArray(body?.items) ? body.items : [];

    const todayRes = await supabaseAdmin
      .from("delivery_completion_batches")
      .select("delivered_reg_id")
      .eq("delivery_date", batch.delivery_date)
      .eq("hub_code", batch.hub_code);

    if (todayRes.error) return send(res, 500, { error: todayRes.error.message });

    const seq = (todayRes.data || []).length + 1;
    const deliveredRegId = batch.delivered_reg_id || nextId(batch.delivery_date, batch.hub_code || "HUB", "DRV", seq);

    const batchRes = await supabaseAdmin
      .from("delivery_completion_batches")
      .upsert({
        delivered_reg_id: deliveredRegId,
        delivery_date: batch.delivery_date,
        hub_code: batch.hub_code || "HUB",
        rider_name: batch.rider_name || null,
        vehicle_no: batch.vehicle_no || null,
        status: batch.status || "DRAFT",
        remarks: batch.remarks || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "delivered_reg_id" })
      .select("*")
      .single();

    if (batchRes.error) return send(res, 500, { error: batchRes.error.message });

    const savedBatch = batchRes.data;

    for (const item of items) {
      const itemRes = await supabaseAdmin
        .from("delivery_completion_items")
        .insert({
          batch_id: savedBatch.id,
          delivered_reg_id: deliveredRegId,
          pickup_id: item.pickup_id || null,
          delivery_id: item.delivery_id,
          receiver_name: item.receiver_name || null,
          receiver_phone: item.receiver_phone || null,
          delivered_at: item.delivered_at || new Date().toISOString(),
          delivered_by: item.delivered_by || batch.rider_name || null,
          pod_note: item.pod_note || null,
          pod_photo_url: item.pod_photo_url || null,
          status: item.status || "DELIVERED",
        });

      if (itemRes.error) return send(res, 500, { error: itemRes.error.message });

      await supabaseAdmin
        .from("delivery_orders")
        .update({
          delivery_status: "DELIVERED",
          delivered_at: item.delivered_at || new Date().toISOString(),
          delivered_by: item.delivered_by || batch.rider_name || null,
          delivered_receiver_name: item.receiver_name || null,
          delivered_receiver_phone: item.receiver_phone || null,
          pod_note: item.pod_note || null,
          pod_photo_url: item.pod_photo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("delivery_id", item.delivery_id);
    }

    return send(res, 200, {
      ok: true,
      delivered_reg_id: deliveredRegId,
      batch: savedBatch,
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Delivered registration failed" });
  }
}
