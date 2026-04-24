import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from '../../_lib/serverSupabase.js';

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

function base64ToBuffer(dataUrlOrBase64: string) {
  const raw = String(dataUrlOrBase64 || "");
  const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
  return Buffer.from(base64, "base64");
}

async function uploadBase64(bucket: string, path: string, data: string, contentType: string) {
  const uploadRes = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, base64ToBuffer(data), {
      contentType,
      upsert: true,
    });

  if (uploadRes.error) throw new Error(uploadRes.error.message);

  return supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function logAction(deliveryId: string, pickupId: string | null, action: string, payload: unknown) {
  await supabaseAdmin.from("delivery_workflow_logs").insert({
    delivery_id: deliveryId,
    pickup_id: pickupId,
    action,
    payload,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const status = String(req.query.status || "").trim();
      const q = String(req.query.q || "").trim().toLowerCase();

      let query = supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(300);

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
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
      }

      return send(res, 200, { ok: true, data: rows });
    }

    if (req.method !== "POST") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const body = parseBody(req);
    const action = String(body?.action || "").trim();
    const deliveryId = String(body?.delivery_id || "").trim();

    if (!deliveryId) return send(res, 400, { error: "delivery_id is required" });
    if (!action) return send(res, 400, { error: "action is required" });

    const existingRes = await supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .eq("delivery_id", deliveryId)
      .maybeSingle();

    if (existingRes.error) return send(res, 500, { error: existingRes.error.message });
    if (!existingRes.data) return send(res, 404, { error: "Delivery not found" });

    const row = existingRes.data;
    const now = new Date().toISOString();
    const patch: Record<string, any> = { updated_at: now };

    if (action === "assign_rider") {
      patch.rider_name = body.rider_name || null;
      patch.rider_phone = body.rider_phone || null;
      patch.rider_assigned_at = now;
    } else if (action === "out_for_delivery") {
      patch.delivery_status = "OUT_FOR_DELIVERY";
      patch.out_for_delivery_at = now;
      patch.rider_name = body.rider_name || row.rider_name || null;
      patch.rider_phone = body.rider_phone || row.rider_phone || null;
      patch.rider_assigned_at = row.rider_assigned_at || now;
    } else if (action === "delivered") {
      let podPhotoUrl = row.pod_photo_url || null;
      let podSignatureUrl = row.pod_signature_url || null;

      if (body.pod_photo_base64) {
        podPhotoUrl = await uploadBase64(
          "pod-files",
          `${deliveryId}/pod-photo-${Date.now()}.jpg`,
          body.pod_photo_base64,
          body.pod_photo_type || "image/jpeg"
        );
      }

      if (body.pod_signature_base64) {
        podSignatureUrl = await uploadBase64(
          "pod-files",
          `${deliveryId}/pod-signature-${Date.now()}.png`,
          body.pod_signature_base64,
          body.pod_signature_type || "image/png"
        );
      }

      patch.delivery_status = "DELIVERED";
      patch.delivered_at = now;
      patch.delivered_by = body.delivered_by || body.rider_name || row.rider_name || null;
      patch.delivered_receiver_name = body.receiver_name || row.receiver_name || null;
      patch.delivered_receiver_phone = body.receiver_phone || row.receiver_phone || null;
      patch.pod_note = body.pod_note || null;
      patch.pod_status = "COMPLETE";
      patch.pod_receiver_name = body.receiver_name || row.receiver_name || null;
      patch.pod_receiver_phone = body.receiver_phone || row.receiver_phone || null;
      patch.pod_photo_url = podPhotoUrl;
      patch.pod_signature_url = podSignatureUrl;
      patch.pod_verified_at = now;
    } else if (action === "failed_attempt") {
      patch.delivery_status = "FAILED_ATTEMPT";
      patch.failed_attempt_at = now;
      patch.failed_attempt_count = Number(row.failed_attempt_count || 0) + 1;
      patch.failed_reason = body.failed_reason || "Failed Attempt";
      patch.pod_status = "FAILED";
    } else if (action === "returned") {
      patch.delivery_status = "RETURNED";
      patch.returned_at = now;
      patch.return_reason = body.return_reason || "Returned";
      patch.pod_status = "RETURNED";
    } else {
      return send(res, 400, { error: "Unsupported action" });
    }

    const updateRes = await supabaseAdmin
      .from("delivery_orders")
      .update(patch)
      .eq("delivery_id", deliveryId)
      .select("*")
      .single();

    if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

    await logAction(deliveryId, row.pickup_id || null, action, body);

    return send(res, 200, { ok: true, data: updateRes.data });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Delivery workflow API failed" });
  }
}
