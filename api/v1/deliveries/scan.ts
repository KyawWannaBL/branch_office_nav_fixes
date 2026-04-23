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
    const scanCode = String(body?.scan_code || "").trim();
    const scanType = String(body?.scan_type || "SCREEN_SCAN").trim();
    const scannedBy = String(body?.scanned_by || "").trim();

    if (!scanCode) {
      return send(res, 400, { error: "scan_code is required" });
    }

    const result = await supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .or(`delivery_id.eq.${scanCode},qr_value.eq.${scanCode}`)
      .maybeSingle();

    if (result.error) return send(res, 500, { error: result.error.message });
    if (!result.data) return send(res, 404, { error: "Delivery not found for scan" });

    const row = result.data;

    const scanInsert = await supabaseAdmin.from("delivery_scan_events").insert({
      delivery_id: row.delivery_id,
      pickup_id: row.pickup_id || null,
      scan_code: scanCode,
      scan_type: scanType,
      scanned_by: scannedBy || null,
    });

    if (scanInsert.error) return send(res, 500, { error: scanInsert.error.message });

    const updateRes = await supabaseAdmin
      .from("delivery_orders")
      .update({
        last_scan_code: scanCode,
        last_scan_type: scanType,
        last_scan_at: new Date().toISOString(),
        last_scan_by: scannedBy || null,
        updated_at: new Date().toISOString(),
      })
      .eq("delivery_id", row.delivery_id)
      .select("*")
      .single();

    if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

    return send(res, 200, { ok: true, data: updateRes.data });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Delivery scan API failed" });
  }
}
