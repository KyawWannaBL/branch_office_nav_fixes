import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("shipment")
        .select("id, awb, sender_name, receiver_name, status, current_location, updated_at")
        .eq("status", "STORED")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ ok: true, data: data ?? [] });
    }

    if (req.method === "POST") {
      const { trackingNo, rack, bin } = req.body || {};

      if (!trackingNo || !rack || !bin) {
        return res.status(400).json({ ok: false, error: "trackingNo, rack and bin are required." });
      }

      const location = `${rack}-${bin}`;

      const { data: updated, error } = await supabaseAdmin
        .from("shipment")
        .update({
          status: "STORED",
          current_location: location,
          updated_at: new Date().toISOString(),
        })
        .eq("awb", trackingNo)
        .select("id, awb, status, current_location")
        .maybeSingle();

      if (error) throw error;
      return res.status(200).json({ ok: true, data: updated });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message || "Failed to process storage request." });
  }
}