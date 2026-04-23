import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/serverSupabase";

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

function nextId(dateStr: string, hub: string, seq: number) {
  const d = String(dateStr || "").split("-");
  const mmdd = `${d[1] || "00"}${d[2] || "00"}`;
  return `SET${mmdd}-${hub}-${String(seq).padStart(3, "0")}`;
}

async function logAction(settlementBatchId: string | null, deliveryId: string | null, action: string, payload: unknown) {
  await supabaseAdmin.from("cod_settlement_logs").insert({
    settlement_batch_id: settlementBatchId,
    delivery_id: deliveryId,
    action,
    payload,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const mode = String(req.query.mode || "queue").trim();

      if (mode === "batches") {
        const batchRes = await supabaseAdmin
          .from("cod_settlement_batches")
          .select("*, cod_settlement_items(*)")
          .order("settlement_date", { ascending: false })
          .order("updated_at", { ascending: false });

        if (batchRes.error) return send(res, 500, { error: batchRes.error.message });
        return send(res, 200, { ok: true, data: batchRes.data || [] });
      }

      const q = String(req.query.q || "").trim().toLowerCase();
      const rider = String(req.query.rider_name || "").trim();

      let query = supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .eq("delivery_status", "DELIVERED")
        .order("delivered_at", { ascending: false })
        .limit(400);

      if (rider) query = query.eq("rider_name", rider);

      const result = await query;
      if (result.error) return send(res, 500, { error: result.error.message });

      let rows = (result.data || []).filter((row: any) => num(row.waybill_total_cod || row.receivable || 0) > 0);

      if (q) {
        rows = rows.filter((row: any) =>
          [
            row.delivery_id,
            row.pickup_id,
            row.receiver_name,
            row.receiver_phone,
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
    const action = String(body?.action || "create_settlement").trim();

    if (action === "update_delivery_cod") {
      const deliveryId = String(body?.delivery_id || "").trim();
      if (!deliveryId) return send(res, 400, { error: "delivery_id is required" });

      const existingRes = await supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .eq("delivery_id", deliveryId)
        .maybeSingle();

      if (existingRes.error) return send(res, 500, { error: existingRes.error.message });
      if (!existingRes.data) return send(res, 404, { error: "Delivery not found" });

      const expected = num(existingRes.data.waybill_total_cod || existingRes.data.receivable || 0);
      const collected = num(body?.cod_collected_amount || 0);

      const patch = {
        cod_collected_amount: collected,
        cod_collected_at: body?.cod_collected_at || new Date().toISOString(),
        cod_collected_by: body?.cod_collected_by || null,
        cod_status: expected === 0 ? "NOT_APPLICABLE" : collected === expected ? "COLLECTED" : collected > 0 ? "PARTIAL" : "PENDING",
        settlement_status: collected === expected ? "SETTLED" : collected > 0 ? "PARTIAL" : "UNSETTLED",
        settlement_note: body?.settlement_note || null,
        updated_at: new Date().toISOString(),
      };

      const updateRes = await supabaseAdmin
        .from("delivery_orders")
        .update(patch)
        .eq("delivery_id", deliveryId)
        .select("*")
        .single();

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await logAction(null, deliveryId, "update_delivery_cod", patch);

      return send(res, 200, { ok: true, data: updateRes.data });
    }

    if (action === "create_settlement" || action === "post_settlement") {
      const batch = body?.batch || {};
      const items = Array.isArray(body?.items) ? body.items : [];

      if (!batch.settlement_date) return send(res, 400, { error: "settlement_date is required" });
      if (!batch.hub_code) return send(res, 400, { error: "hub_code is required" });

      const sameDayRes = await supabaseAdmin
        .from("cod_settlement_batches")
        .select("settlement_batch_id")
        .eq("settlement_date", batch.settlement_date)
        .eq("hub_code", batch.hub_code);

      if (sameDayRes.error) return send(res, 500, { error: sameDayRes.error.message });

      const settlementBatchId =
        String(batch.settlement_batch_id || "").trim() ||
        nextId(batch.settlement_date, batch.hub_code || "HUB", (sameDayRes.data || []).length + 1);

      let expectedTotal = 0;
      let collectedTotal = 0;

      for (const item of items) {
        expectedTotal += num(item.expected_amount);
        collectedTotal += num(item.collected_amount);
      }

      const shortage = Math.max(0, expectedTotal - collectedTotal);
      const overage = Math.max(0, collectedTotal - expectedTotal);

      const batchRes = await supabaseAdmin
        .from("cod_settlement_batches")
        .upsert({
          settlement_batch_id: settlementBatchId,
          settlement_date: batch.settlement_date,
          hub_code: batch.hub_code,
          rider_name: batch.rider_name || null,
          rider_phone: batch.rider_phone || null,
          total_delivery_count: items.length,
          expected_amount: expectedTotal,
          collected_amount: collectedTotal,
          shortage_amount: shortage,
          overage_amount: overage,
          status: action === "post_settlement" ? "POSTED" : "OPEN",
          note: batch.note || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "settlement_batch_id" })
        .select("*")
        .single();

      if (batchRes.error) return send(res, 500, { error: batchRes.error.message });

      const savedBatch = batchRes.data;

      for (const item of items) {
        const deliveryId = String(item.delivery_id || "").trim();
        if (!deliveryId) continue;

        const expected = num(item.expected_amount);
        const collected = num(item.collected_amount);
        const diff = collected - expected;

        const existingRes = await supabaseAdmin
          .from("delivery_orders")
          .select("*")
          .eq("delivery_id", deliveryId)
          .maybeSingle();

        if (existingRes.error) return send(res, 500, { error: existingRes.error.message });
        if (!existingRes.data) continue;

        const row = existingRes.data;

        const itemRes = await supabaseAdmin
          .from("cod_settlement_items")
          .upsert({
            batch_id: savedBatch.id,
            settlement_batch_id: settlementBatchId,
            delivery_id: deliveryId,
            pickup_id: row.pickup_id || null,
            rider_name: batch.rider_name || row.rider_name || null,
            expected_amount: expected,
            collected_amount: collected,
            difference_amount: diff,
            status: diff === 0 ? "SETTLED" : collected > 0 ? "PARTIAL" : "UNSETTLED",
            note: item.note || null,
          }, { onConflict: "batch_id,delivery_id" });

        if (itemRes.error) return send(res, 500, { error: itemRes.error.message });

        const patch = {
          settlement_batch_id: settlementBatchId,
          cod_collected_amount: collected,
          cod_collected_at: item.cod_collected_at || new Date().toISOString(),
          cod_collected_by: item.cod_collected_by || batch.rider_name || null,
          cod_status: expected === 0 ? "NOT_APPLICABLE" : collected === expected ? "COLLECTED" : collected > 0 ? "PARTIAL" : "PENDING",
          settlement_status: diff === 0 ? "SETTLED" : collected > 0 ? "PARTIAL" : "DISCREPANCY",
          settlement_note: item.note || null,
          updated_at: new Date().toISOString(),
        };

        const updateRes = await supabaseAdmin
          .from("delivery_orders")
          .update(patch)
          .eq("delivery_id", deliveryId);

        if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

        await logAction(settlementBatchId, deliveryId, action, {
          expected_amount: expected,
          collected_amount: collected,
          difference_amount: diff,
        });
      }

      return send(res, 200, { ok: true, data: savedBatch });
    }

    return send(res, 400, { error: "Unsupported action" });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "COD settlement API failed" });
  }
}
