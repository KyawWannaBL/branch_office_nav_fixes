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

async function getDelivery(deliveryId: string) {
  const primary = await supabaseAdmin
    .from("delivery_orders")
    .select("*")
    .eq("delivery_id", deliveryId)
    .maybeSingle();

  if (!primary.error && primary.data) {
    return { table: "delivery_orders", row: primary.data };
  }

  const fallback = await supabaseAdmin
    .from("deliveries")
    .select("*")
    .eq("delivery_id", deliveryId)
    .maybeSingle();

  if (!fallback.error && fallback.data) {
    return { table: "deliveries", row: fallback.data };
  }

  throw new Error(primary.error?.message || fallback.error?.message || "Delivery not found");
}

async function updateDelivery(table: string, deliveryId: string, patch: Record<string, any>) {
  const result = await supabaseAdmin
    .from(table)
    .update(patch)
    .eq("delivery_id", deliveryId);

  if (result.error) throw new Error(result.error.message);
}

async function insertAudit(payload: Record<string, any>) {
  const result = await supabaseAdmin.from("audit_logs").insert(payload);
  if (result.error) throw new Error(result.error.message);
}

async function insertWayLog(payload: Record<string, any>) {
  const result = await supabaseAdmin.from("way_status_logs").insert(payload);
  if (result.error) return;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const body = parseBody(req);
    const action = String(body.action || "").trim();
    const deliveryId = String(body.delivery_id || "").trim();
    const note = String(body.note || "").trim();
    const updatedAddress = String(body.updated_address || "").trim();
    const updatedTownship = String(body.updated_township || "").trim();

    if (!deliveryId) return send(res, 400, { error: "delivery_id is required" });
    if (!action) return send(res, 400, { error: "action is required" });

    const current = await getDelivery(deliveryId);
    const row = current.row;
    const now = new Date().toISOString();

    if (action === "reattempt") {
      await updateDelivery(current.table, deliveryId, {
        delivery_status: "SUBMITTED",
        updated_at: now,
      });

      await insertWayLog({
        delivery_id: deliveryId,
        pickup_id: row.pickup_id || null,
        action: "cs_reattempt_delivery",
        from_status: row.delivery_status || row.status || null,
        to_status: "SUBMITTED",
        note: note || "Re-attempt requested by customer service",
        rider_name: row.rider_name || null,
        rider_phone: row.rider_phone || null,
      });

      await insertAudit({
        reference_id: deliveryId,
        reference_type: "DELIVERY",
        action: "CS_REATTEMPT_DELIVERY",
        from_value: row.delivery_status || row.status || null,
        to_value: "SUBMITTED",
        actor_name: "Customer Service",
        actor_role: "CUSTOMER_SERVICE",
        payload: { note },
      });

      return send(res, 200, { ok: true, message: "Delivery pushed back to dispatch queue" });
    }

    if (action === "rts") {
      await updateDelivery(current.table, deliveryId, {
        delivery_status: "RETURNED",
        updated_at: now,
      });

      await insertWayLog({
        delivery_id: deliveryId,
        pickup_id: row.pickup_id || null,
        action: "cs_return_to_sender",
        from_status: row.delivery_status || row.status || null,
        to_status: "RETURNED",
        note: note || "Return to sender requested by customer service",
        rider_name: row.rider_name || null,
        rider_phone: row.rider_phone || null,
      });

      await insertAudit({
        reference_id: deliveryId,
        reference_type: "DELIVERY",
        action: "CS_RETURN_TO_SENDER",
        from_value: row.delivery_status || row.status || null,
        to_value: "RETURNED",
        actor_name: "Customer Service",
        actor_role: "CUSTOMER_SERVICE",
        payload: { note },
      });

      return send(res, 200, { ok: true, message: "Return to sender initiated" });
    }

    if (action === "update_address") {
      const patch: Record<string, any> = { updated_at: now };
      if (updatedAddress) patch.receiver_address = updatedAddress;
      if (updatedTownship) patch.receiver_township = updatedTownship;

      await updateDelivery(current.table, deliveryId, patch);

      await insertAudit({
        reference_id: deliveryId,
        reference_type: "DELIVERY",
        action: "CS_UPDATE_ADDRESS",
        from_value: row.receiver_address || row.delivery_address || null,
        to_value: updatedAddress || row.receiver_address || row.delivery_address || null,
        actor_name: "Customer Service",
        actor_role: "CUSTOMER_SERVICE",
        payload: { updated_address: updatedAddress, updated_township: updatedTownship, note },
      });

      return send(res, 200, { ok: true, message: "Address updated and ready for rider sync" });
    }

    if (action === "ping_rider") {
      await insertAudit({
        reference_id: deliveryId,
        reference_type: "DELIVERY",
        action: "CS_PING_RIDER",
        from_value: null,
        to_value: row.rider_name || null,
        actor_name: "Customer Service",
        actor_role: "CUSTOMER_SERVICE",
        payload: { note, rider_name: row.rider_name || null, rider_phone: row.rider_phone || null },
      });

      return send(res, 200, { ok: true, message: "Rider ping logged" });
    }

    if (action === "rescue") {
      await insertAudit({
        reference_id: deliveryId,
        reference_type: "DELIVERY",
        action: "CS_EMERGENCY_INTERVENTION",
        from_value: row.delivery_status || row.status || null,
        to_value: row.delivery_status || row.status || null,
        actor_name: "Customer Service",
        actor_role: "CUSTOMER_SERVICE",
        payload: { note, type: "rescue_vehicle" },
      });

      return send(res, 200, { ok: true, message: "Emergency rescue escalation logged" });
    }

    if (action === "reroute_branch") {
      await insertAudit({
        reference_id: deliveryId,
        reference_type: "DELIVERY",
        action: "CS_REROUTE_BRANCH",
        from_value: row.delivery_status || row.status || null,
        to_value: row.delivery_status || row.status || null,
        actor_name: "Customer Service",
        actor_role: "CUSTOMER_SERVICE",
        payload: { note, type: "branch_reroute" },
      });

      return send(res, 200, { ok: true, message: "Branch re-route escalation logged" });
    }

    return send(res, 400, { error: "Unsupported action" });
  } catch (error: any) {
    return send(res, 500, {
      error: error?.message || "Customer service action failed",
    });
  }
}
