import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/supabaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { data, error } = await supabaseAdmin
      .from("manifest")
      .select("id, manifest_no, destination_branch_id, status, total_shipments, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ ok: true, data: data ?? [] });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message || "Failed to load manifests." });
  }
}