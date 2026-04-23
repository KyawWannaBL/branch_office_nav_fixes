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

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const serviceType = String(req.query.service_type || "").trim();
      const township = String(req.query.township || "").trim();
      const activeOnly = String(req.query.active_only || "false").trim() === "true";

      let query = supabaseAdmin
        .from("tariff_rate_cards")
        .select("*")
        .order("service_type", { ascending: true })
        .order("township", { ascending: true });

      if (serviceType) query = query.eq("service_type", serviceType);
      if (township) query = query.eq("township", township);
      if (activeOnly) query = query.eq("active", true);

      const result = await query;
      if (result.error) return send(res, 500, { error: result.error.message });

      return send(res, 200, { ok: true, data: result.data || [] });
    }

    if (req.method === "POST") {
      const body = parseBody(req);

      const insertRes = await supabaseAdmin
        .from("tariff_rate_cards")
        .insert({
          service_type: body.service_type,
          township: body.township || null,
          base_weight_kg: num(body.base_weight_kg || 0),
          base_delivery_fee: num(body.base_delivery_fee || 0),
          overweight_per_kg: num(body.overweight_per_kg || 0),
          notes: body.notes || null,
          active: body.active !== false,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (insertRes.error) return send(res, 500, { error: insertRes.error.message });
      return send(res, 200, { ok: true, data: insertRes.data });
    }

    if (req.method === "PATCH") {
      const body = parseBody(req);
      const id = String(body.id || "").trim();

      if (!id) {
        return send(res, 400, { error: "id is required" });
      }

      const updateRes = await supabaseAdmin
        .from("tariff_rate_cards")
        .update({
          service_type: body.service_type,
          township: body.township || null,
          base_weight_kg: num(body.base_weight_kg || 0),
          base_delivery_fee: num(body.base_delivery_fee || 0),
          overweight_per_kg: num(body.overweight_per_kg || 0),
          notes: body.notes || null,
          active: body.active !== false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });
      return send(res, 200, { ok: true, data: updateRes.data });
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Tariff master API failed" });
  }
}
