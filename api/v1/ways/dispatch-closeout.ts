import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";
import { writeAuditLog } from "../../_lib/auditLog";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

function parseBody(req: VercelRequest) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const body = parseBody(req);
    const dispatchBatchId = String(body.dispatch_batch_id || "").trim();
    const returnedBy = String(body.returned_by || "").trim();
    const note = String(body.note || "").trim();
    const codCollected = num(body.cod_collected);

    if (!dispatchBatchId) return send(res, 400, { error: "dispatch_batch_id is required" });

    const batchRes = await supabaseAdmin
      .from("dispatch_batches")
      .select("*")
      .eq("dispatch_batch_id", dispatchBatchId)
      .maybeSingle();

    if (batchRes.error) return send(res, 500, { error: batchRes.error.message });
    if (!batchRes.data) return send(res, 404, { error: "Dispatch batch not found" });

    const itemsRes = await supabaseAdmin
      .from("dispatch_batch_items")
      .select("*")
      .eq("dispatch_batch_id", dispatchBatchId);

    if (itemsRes.error) return send(res, 500, { error: itemsRes.error.message });

    const deliveryIds = (itemsRes.data || []).map((x: any) => x.delivery_id).filter(Boolean);
    if (!deliveryIds.length) return send(res, 400, { error: "No ways linked to this batch" });

    const waysRes = await supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .in("delivery_id", deliveryIds);

    if (waysRes.error) return send(res, 500, { error: waysRes.error.message });

    const ways = waysRes.data || [];
    const deliveredCount = ways.filter((x: any) => x.delivery_status === "DELIVERED").length;
    const failedCount = ways.filter((x: any) => x.delivery_status === "FAILED_ATTEMPT").length;
    const returnedCount = ways.filter((x: any) => x.delivery_status === "RETURNED").length;
    const codExpected = ways.reduce((a: number, x: any) => a + num(x.waybill_total_cod || x.receivable || 0), 0);
    const shortage = Math.max(0, codExpected - codCollected);
    const overage = Math.max(0, codCollected - codExpected);
    const now = new Date().toISOString();

    const updateRes = await supabaseAdmin
      .from("dispatch_batches")
      .update({
        status: "CLOSED",
        returned_at: now,
        returned_by: returnedBy || null,
        closeout_note: note || null,
        delivered_count: deliveredCount,
        failed_count: failedCount,
        returned_count: returnedCount,
        cod_expected: codExpected,
        cod_collected: codCollected,
        shortage_amount: shortage,
        overage_amount: overage,
        updated_at: now,
      })
      .eq("dispatch_batch_id", dispatchBatchId)
      .select("*")
      .single();

    if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

    for (const row of ways) {
      await supabaseAdmin.from("way_status_logs").insert({
        delivery_id: row.delivery_id,
        pickup_id: row.pickup_id || null,
        action: "dispatch_batch_closeout",
        from_status: row.delivery_status || null,
        to_status: row.delivery_status || null,
        rider_name: row.rider_name || null,
        rider_phone: row.rider_phone || null,
        note,
        payload: {
          dispatch_batch_id: dispatchBatchId,
          returned_by: returnedBy || null,
        },
      });
    }

    await writeAuditLog({
      req,
      action: "dispatch.batch.closeout",
      resourceType: "dispatch_batch",
      resourceId: dispatchBatchId,
      targetStatus: updateRes.data.status,
      payload: body,
      beforeState: batchRes.data,
      afterState: updateRes.data,
    });

    return send(res, 200, { ok: true, data: updateRes.data });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Dispatch closeout API failed" });
  }
}
