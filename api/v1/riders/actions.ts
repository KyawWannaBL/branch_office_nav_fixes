import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from '../../_lib/serverSupabase.js';
import { writeAuditLog } from '../../_lib/auditLog.js';

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

async function resolveDeliveryIds(body: any) {
  const explicit = Array.isArray(body.delivery_ids)
    ? body.delivery_ids.map((x: any) => String(x || "").trim()).filter(Boolean)
    : [];

  if (explicit.length) return explicit;

  const dispatchBatchId = String(body.dispatch_batch_id || "").trim();
  if (!dispatchBatchId) return [];

  const itemsRes = await supabaseAdmin
    .from("dispatch_batch_items")
    .select("delivery_id")
    .eq("dispatch_batch_id", dispatchBatchId);

  if (itemsRes.error) throw new Error(itemsRes.error.message);

  return (itemsRes.data || [])
    .map((x: any) => String(x.delivery_id || "").trim())
    .filter(Boolean);
}

async function logWayActions(rows: any[], action: string, note: string, payload: any) {
  for (const row of rows) {
    const insertRes = await supabaseAdmin.from("way_status_logs").insert({
      delivery_id: row.delivery_id,
      pickup_id: row.pickup_id || null,
      action,
      from_status: row.delivery_status || null,
      to_status: payload?.to_status || row.delivery_status || null,
      rider_name: payload?.rider_name || row.rider_name || null,
      rider_phone: payload?.rider_phone || row.rider_phone || null,
      note: note || null,
      payload,
    });

    if (insertRes.error) throw new Error(insertRes.error.message);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const body = parseBody(req);
    const action = String(body.action || "").trim();
    const note = String(body.note || "").trim();
    const riderName = String(body.rider_name || "").trim();
    const riderPhone = String(body.rider_phone || "").trim();
    const helperName = String(body.helper_name || "").trim();
    const helperPhone = String(body.helper_phone || "").trim();
    const dispatchBatchId = String(body.dispatch_batch_id || "").trim();

    const deliveryIds = await resolveDeliveryIds(body);
    if (!deliveryIds.length) {
      return send(res, 400, { error: "delivery_ids or dispatch_batch_id is required" });
    }

    const waysRes = await supabaseAdmin
      .from("delivery_orders")
      .select("delivery_id,pickup_id,delivery_status,rider_name,rider_phone")
      .in("delivery_id", deliveryIds);

    if (waysRes.error) return send(res, 500, { error: waysRes.error.message });

    const rows = waysRes.data || [];
    if (!rows.length) return send(res, 404, { error: "No delivery orders found" });

    const now = new Date().toISOString();

    if (action === "assign_driver") {
      if (!riderName) return send(res, 400, { error: "rider_name is required" });

      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update({
          rider_name: riderName,
          rider_phone: riderPhone || null,
          updated_at: now,
        })
        .in("delivery_id", deliveryIds);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      if (dispatchBatchId) {
        const batchUpdate = await supabaseAdmin
          .from("dispatch_batches")
          .update({
            rider_name: riderName,
            rider_phone: riderPhone || null,
            updated_at: now,
          })
          .eq("dispatch_batch_id", dispatchBatchId);

        if (batchUpdate.error) return send(res, 500, { error: batchUpdate.error.message });
      }

      await logWayActions(rows, "rider_assign", note, {
        rider_name: riderName,
        rider_phone: riderPhone || null,
        dispatch_batch_id: dispatchBatchId || null,
      });

      await writeAuditLog({
        req,
        action: "rider.driver.assign",
        resourceType: "delivery_order",
        resourceId: dispatchBatchId || deliveryIds.join(","),
        payload: body,
      });

      return send(res, 200, { ok: true, updated: deliveryIds.length });
    }

    if (action === "mark_ofd") {
      const patch: Record<string, any> = {
        delivery_status: "OUT_FOR_DELIVERY",
        updated_at: now,
      };
      if (riderName) patch.rider_name = riderName;
      if (riderPhone) patch.rider_phone = riderPhone;

      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update(patch)
        .in("delivery_id", deliveryIds);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await logWayActions(rows, "rider_mark_ofd", note, {
        to_status: "OUT_FOR_DELIVERY",
        rider_name: riderName || null,
        rider_phone: riderPhone || null,
        dispatch_batch_id: dispatchBatchId || null,
      });

      await writeAuditLog({
        req,
        action: "rider.driver.mark_ofd",
        resourceType: "delivery_order",
        resourceId: dispatchBatchId || deliveryIds.join(","),
        targetStatus: "OUT_FOR_DELIVERY",
        payload: body,
      });

      return send(res, 200, { ok: true, updated: deliveryIds.length });
    }

    if (action === "helper_stage") {
      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update({
          delivery_status: "IN_TRANSIT",
          updated_at: now,
        })
        .in("delivery_id", deliveryIds);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await logWayActions(rows, "helper_stage", note, {
        helper_name: helperName || null,
        helper_phone: helperPhone || null,
        to_status: "IN_TRANSIT",
        dispatch_batch_id: dispatchBatchId || null,
      });

      await writeAuditLog({
        req,
        action: "rider.helper.stage",
        resourceType: "delivery_order",
        resourceId: dispatchBatchId || deliveryIds.join(","),
        targetStatus: "IN_TRANSIT",
        payload: body,
      });

      return send(res, 200, { ok: true, updated: deliveryIds.length });
    }

    if (action === "mark_failed") {
      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update({
          delivery_status: "FAILED_ATTEMPT",
          updated_at: now,
        })
        .in("delivery_id", deliveryIds);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await logWayActions(rows, "rider_mark_failed", note, {
        to_status: "FAILED_ATTEMPT",
        dispatch_batch_id: dispatchBatchId || null,
      });

      await writeAuditLog({
        req,
        action: "rider.driver.mark_failed",
        resourceType: "delivery_order",
        resourceId: dispatchBatchId || deliveryIds.join(","),
        targetStatus: "FAILED_ATTEMPT",
        payload: body,
      });

      return send(res, 200, { ok: true, updated: deliveryIds.length });
    }

    if (action === "mark_delivered") {
      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update({
          delivery_status: "DELIVERED",
          updated_at: now,
        })
        .in("delivery_id", deliveryIds);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await logWayActions(rows, "rider_mark_delivered", note, {
        to_status: "DELIVERED",
        dispatch_batch_id: dispatchBatchId || null,
      });

      await writeAuditLog({
        req,
        action: "rider.driver.mark_delivered",
        resourceType: "delivery_order",
        resourceId: dispatchBatchId || deliveryIds.join(","),
        targetStatus: "DELIVERED",
        payload: body,
      });

      return send(res, 200, { ok: true, updated: deliveryIds.length });
    }

    return send(res, 400, { error: "Unsupported action" });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Rider action API failed" });
  }
}
