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
    if (req.method !== "POST") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const body = parseBody(req);
    const scanCode = String(body.scan_code || "").trim();
    const scanType = String(body.scan_type || "VERIFY").trim();
    const scannedBy = String(body.scanned_by || "").trim();
    const note = String(body.note || "").trim();

    if (!scanCode) return send(res, 400, { error: "scan_code is required" });

    const fetchRes = await supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .or(`delivery_id.eq.${scanCode},qr_value.eq.${scanCode}`)
      .maybeSingle();

    if (fetchRes.error) return send(res, 500, { error: fetchRes.error.message });
    if (!fetchRes.data) return send(res, 404, { error: "Way not found for scan" });

    const row = fetchRes.data;
    const now = new Date().toISOString();

    const patch: Record<string, any> = {
      last_scan_code: scanCode,
      last_scan_type: scanType,
      last_scan_at: now,
      last_scan_by: scannedBy || null,
      updated_at: now,
    };

    if (scanType === "OUT_FOR_DELIVERY") {
      patch.delivery_status = "OUT_FOR_DELIVERY";
      patch.out_for_delivery_at = now;
    } else if (["STAGING_IN", "OUTBOUND_SCAN", "VERIFY"].includes(scanType)) {
      if (!row.delivery_status || row.delivery_status === "SUBMITTED" || row.delivery_status === "SAVED") {
        patch.delivery_status = "IN_TRANSIT";
      }
    }

    const updateRes = await supabaseAdmin
      .from("delivery_orders")
      .update(patch)
      .eq("delivery_id", row.delivery_id)
      .select("*")
      .single();

    if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

    const scanLog = await supabaseAdmin.from("delivery_scan_events").insert({
      delivery_id: row.delivery_id,
      pickup_id: row.pickup_id || null,
      scan_code: scanCode,
      scan_type: scanType,
      scanned_by: scannedBy || null,
    });

    if (scanLog.error) return send(res, 500, { error: scanLog.error.message });

    const wayLog = await supabaseAdmin.from("way_status_logs").insert({
      delivery_id: row.delivery_id,
      pickup_id: row.pickup_id || null,
      action: "scan",
      from_status: row.delivery_status || null,
      to_status: updateRes.data.delivery_status || row.delivery_status || null,
      rider_name: row.rider_name || null,
      rider_phone: row.rider_phone || null,
      note,
      payload: {
        scan_code: scanCode,
        scan_type: scanType,
        scanned_by: scannedBy || null,
      },
    });

    if (wayLog.error) return send(res, 500, { error: wayLog.error.message });

    return send(res, 200, { ok: true, data: updateRes.data });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Way scan API failed" });
  }
}