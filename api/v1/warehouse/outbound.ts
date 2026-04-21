import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("shipment")
        .select("id, awb, sender_name, receiver_name, status, current_location, updated_at")
        .eq("status", "OUTBOUND")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ ok: true, data: data ?? [] });
    }

    if (req.method === "POST") {
      const { trackingNo, manifestNo } = req.body || {};

      if (!trackingNo) {
        return res.status(400).json({ ok: false, error: "trackingNo is required." });
      }

      const { data: updated, error } = await supabaseAdmin
        .from("shipment")
        .update({
          status: "OUTBOUND",
          manifest_no: manifestNo || null,
          updated_at: new Date().toISOString(),
        })
        .eq("awb", trackingNo)
        .select("id, awb, status, manifest_no")
        .maybeSingle();

      if (error) throw error;
      return res.status(200).json({ ok: true, data: updated });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message || "Failed to process outbound request." });
  }
}