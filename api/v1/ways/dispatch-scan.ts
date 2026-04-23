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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const body = parseBody(req);
    const dispatchBatchId = String(body.dispatch_batch_id || body.scan_code || "").trim();
    const scannedBy = String(body.scanned_by || "").trim();
    const note = String(body.note || "").trim();

    if (!dispatchBatchId) return send(res, 400, { error: "dispatch_batch_id is required" });

    const batchRes = await supabaseAdmin
      .from("dispatch_batches")
      .select("*")
      .eq("dispatch_batch_id", dispatchBatchId)
      .maybeSingle();

    if (batchRes.error) return send(res, 500, { error: batchRes.error.message });
    if (!batchRes.data) return send(res, 404, { error: "Dispatch batch not found" });

    const batch = batchRes.data;

    const itemRes = await supabaseAdmin
      .from("dispatch_batch_items")
      .select("*")
      .eq("dispatch_batch_id", dispatchBatchId);

    if (itemRes.error) return send(res, 500, { error: itemRes.error.message });

    const items = itemRes.data || [];
    const deliveryIds = items.map((x: any) => x.delivery_id).filter(Boolean);

    if (!deliveryIds.length) {
      return send(res, 400, { error: "No ways linked to this dispatch batch" });
    }

    const waysRes = await supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .in("delivery_id", deliveryIds);

    if (waysRes.error) return send(res, 500, { error: waysRes.error.message });

    const ways = waysRes.data || [];
    const now = new Date().toISOString();

    const batchUpdateRes = await supabaseAdmin
      .from("dispatch_batches")
      .update({
        status: "DISPATCHED",
        dispatched_at: now,
        dispatched_by: scannedBy || null,
        dispatch_scan_code: dispatchBatchId,
        dispatch_note: note || null,
        updated_at: now,
      })
      .eq("dispatch_batch_id", dispatchBatchId)
      .select("*")
      .single();

    if (batchUpdateRes.error) return send(res, 500, { error: batchUpdateRes.error.message });

    for (const row of ways) {
      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update({
          delivery_status: "OUT_FOR_DELIVERY",
          out_for_delivery_at: now,
          last_scan_code: dispatchBatchId,
          last_scan_type: "BATCH_DISPATCH_SCAN",
          last_scan_at: now,
          last_scan_by: scannedBy || null,
          updated_at: now,
        })
        .eq("delivery_id", row.delivery_id);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await supabaseAdmin.from("delivery_scan_events").insert({
        delivery_id: row.delivery_id,
        pickup_id: row.pickup_id || null,
        scan_code: dispatchBatchId,
        scan_type: "BATCH_DISPATCH_SCAN",
        scanned_by: scannedBy || null,
      });

      await supabaseAdmin.from("way_status_logs").insert({
        delivery_id: row.delivery_id,
        pickup_id: row.pickup_id || null,
        action: "dispatch_batch_scan",
        from_status: row.delivery_status || null,
        to_status: "OUT_FOR_DELIVERY",
        rider_name: row.rider_name || batch.rider_name || null,
        rider_phone: row.rider_phone || batch.rider_phone || null,
        note,
        payload: {
          dispatch_batch_id: dispatchBatchId,
          scanned_by: scannedBy || null,
        },
      });
    }

    return send(res, 200, {
      ok: true,
      data: {
        dispatch_batch_id: dispatchBatchId,
        total_ways: ways.length,
        status: "DISPATCHED",
        dispatched_at: now,
        dispatched_by: scannedBy || null,
      },
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Dispatch scan API failed" });
  }
}
