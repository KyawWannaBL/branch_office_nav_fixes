import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";
import { writeAuditLog } from "../../_lib/auditLog";

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

function nextBatchId(dateStr: string, hub: string, seq: number) {
  const d = String(dateStr || "").split("-");
  const yymmdd = `${(d[0] || "0000").slice(-2)}${d[1] || "00"}${d[2] || "00"}`;
  return `DB-${hub}-${yymmdd}-${String(seq).padStart(3, "0")}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const result = await supabaseAdmin
        .from("dispatch_batches")
        .select("*, dispatch_batch_items(*)")
        .order("dispatch_date", { ascending: false })
        .order("updated_at", { ascending: false });

      if (result.error) return send(res, 500, { error: result.error.message });
      return send(res, 200, { ok: true, data: result.data || [] });
    }

    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const body = parseBody(req);
    const deliveryIds = Array.isArray(body.delivery_ids) ? body.delivery_ids.filter(Boolean) : [];
    const dispatchDate = String(body.dispatch_date || "").trim();
    const hubCode = String(body.hub_code || "").trim();
    const township = String(body.township || "").trim();
    const zoneCode = String(body.zone_code || "").trim();
    const riderName = String(body.rider_name || "").trim();
    const riderPhone = String(body.rider_phone || "").trim();
    const vehicleNo = String(body.vehicle_no || "").trim();
    const note = String(body.note || "").trim();

    if (!dispatchDate) return send(res, 400, { error: "dispatch_date is required" });
    if (!hubCode) return send(res, 400, { error: "hub_code is required" });
    if (!deliveryIds.length) return send(res, 400, { error: "delivery_ids are required" });

    const seqRes = await supabaseAdmin
      .from("dispatch_batches")
      .select("dispatch_batch_id")
      .eq("dispatch_date", dispatchDate)
      .eq("hub_code", hubCode);

    if (seqRes.error) return send(res, 500, { error: seqRes.error.message });

    const dispatchBatchId = nextBatchId(dispatchDate, hubCode, (seqRes.data || []).length + 1);

    const batchRes = await supabaseAdmin
      .from("dispatch_batches")
      .insert({
        dispatch_batch_id: dispatchBatchId,
        dispatch_date: dispatchDate,
        hub_code: hubCode,
        township: township || null,
        zone_code: zoneCode || null,
        rider_name: riderName || null,
        rider_phone: riderPhone || null,
        vehicle_no: vehicleNo || null,
        total_ways: deliveryIds.length,
        note: note || null,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (batchRes.error) return send(res, 500, { error: batchRes.error.message });

    const fetchRes = await supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .in("delivery_id", deliveryIds);

    if (fetchRes.error) return send(res, 500, { error: fetchRes.error.message });

    for (const row of fetchRes.data || []) {
      const itemRes = await supabaseAdmin
        .from("dispatch_batch_items")
        .insert({
          batch_id: batchRes.data.id,
          dispatch_batch_id: dispatchBatchId,
          delivery_id: row.delivery_id,
          pickup_id: row.pickup_id || null,
          township: row.receiver_township || row.township || null,
          rider_name: riderName || row.rider_name || null,
        });

      if (itemRes.error) return send(res, 500, { error: itemRes.error.message });

      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update({
          run_sheet_id: dispatchBatchId,
          rider_name: riderName || row.rider_name || null,
          rider_phone: riderPhone || row.rider_phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("delivery_id", row.delivery_id);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await supabaseAdmin.from("way_status_logs").insert({
        delivery_id: row.delivery_id,
        pickup_id: row.pickup_id || null,
        action: "dispatch_batch_create",
        from_status: row.delivery_status || null,
        to_status: row.delivery_status || null,
        rider_name: riderName || row.rider_name || null,
        rider_phone: riderPhone || row.rider_phone || null,
        note,
        payload: {
          dispatch_batch_id: dispatchBatchId,
          township,
          zone_code: zoneCode,
          vehicle_no: vehicleNo,
        },
      });
    }

    await writeAuditLog({
      req,
      action: "dispatch.batch.create",
      resourceType: "dispatch_batch",
      resourceId: dispatchBatchId,
      targetStatus: batchRes.data.status,
      payload: body,
      afterState: batchRes.data,
    });

    return send(res, 200, { ok: true, data: batchRes.data });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Dispatch batch API failed" });
  }
}
