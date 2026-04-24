import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from '../../_lib/serverSupabase.js';

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const city = String(req.query.city || "").trim();
    const activeOnly = String(req.query.active_only || "true").trim() !== "false";

    let query = supabaseAdmin
      .from("master_locations")
      .select("*")
      .order("city", { ascending: true })
      .order("township", { ascending: true });

    if (activeOnly) query = query.eq("active", true);
    if (city) query = query.eq("city", city);

    const result = await query;
    if (result.error) return send(res, 500, { error: result.error.message });

    return send(res, 200, { ok: true, data: result.data || [] });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Master locations API failed" });
  }
}
