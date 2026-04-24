import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const q = String(req.query.q || "").trim();
    const partyType = String(req.query.party_type || "").trim();

    let query = supabaseAdmin
      .from("master_parties")
      .select("*")
      .eq("active", true)
      .order("business_name", { ascending: true })
      .limit(50);

    if (partyType) {
      query = query.eq("party_type", partyType);
    }

    const result = await query;
    if (result.error) return send(res, 500, { error: result.error.message });

    let rows = result.data || [];
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter((row: any) =>
        [
          row.business_name,
          row.contact_name,
          row.phone,
          row.address,
          row.city,
          row.township,
          row.party_code,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      );
    }

    return send(res, 200, { ok: true, data: rows });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Master parties API failed" });
  }
}
