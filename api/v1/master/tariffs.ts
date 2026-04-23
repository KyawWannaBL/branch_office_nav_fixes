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
    if (req.method === "GET") {
      const q = String(req.query.q || "").trim().toLowerCase();

      let query = supabaseAdmin
        .from("tariffs")
        .select("id, township_name, base_price, weight_surcharge_per_kg, created_by, updated_at")
        .order("township_name", { ascending: true });

      const result = await query;
      if (result.error) return send(res, 500, { error: result.error.message });

      let rows = result.data || [];
      if (q) {
        rows = rows.filter((row: any) =>
          String(row.township_name || "").toLowerCase().includes(q)
        );
      }

      return send(res, 200, { ok: true, data: rows });
    }

    if (req.method === "POST") {
      const body = parseBody(req);

      const township_name = String(body.township_name || "").trim();
      const base_price = Number(body.base_price || 0);
      const weight_surcharge_per_kg = Number(body.weight_surcharge_per_kg || 0);
      const created_by =
        body.created_by && String(body.created_by).trim()
          ? String(body.created_by).trim()
          : null;

      if (!township_name) return send(res, 400, { error: "township_name is required" });
      if (!Number.isFinite(base_price)) return send(res, 400, { error: "base_price must be numeric" });
      if (!Number.isFinite(weight_surcharge_per_kg)) {
        return send(res, 400, { error: "weight_surcharge_per_kg must be numeric" });
      }

      const insertRes = await supabaseAdmin
        .from("tariffs")
        .insert({
          township_name,
          base_price,
          weight_surcharge_per_kg,
          created_by,
          updated_at: new Date().toISOString(),
        })
        .select("id, township_name, base_price, weight_surcharge_per_kg, created_by, updated_at")
        .single();

      if (insertRes.error) return send(res, 500, { error: insertRes.error.message });
      return send(res, 200, { ok: true, data: insertRes.data });
    }

    if (req.method === "PUT") {
      const body = parseBody(req);

      const id = String(body.id || "").trim();
      const township_name = String(body.township_name || "").trim();
      const base_price = Number(body.base_price || 0);
      const weight_surcharge_per_kg = Number(body.weight_surcharge_per_kg || 0);

      if (!id) return send(res, 400, { error: "id is required" });
      if (!township_name) return send(res, 400, { error: "township_name is required" });
      if (!Number.isFinite(base_price)) return send(res, 400, { error: "base_price must be numeric" });
      if (!Number.isFinite(weight_surcharge_per_kg)) {
        return send(res, 400, { error: "weight_surcharge_per_kg must be numeric" });
      }

      const updateRes = await supabaseAdmin
        .from("tariffs")
        .update({
          township_name,
          base_price,
          weight_surcharge_per_kg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id, township_name, base_price, weight_surcharge_per_kg, created_by, updated_at")
        .single();

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });
      return send(res, 200, { ok: true, data: updateRes.data });
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Tariff API failed" });
  }
}
