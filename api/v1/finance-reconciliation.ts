import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toCsv(rows: Record<string, any>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => esc(row[h])).join(","))].join("\n");
}

function inRange(dateValue: any, dateFrom: string, dateTo: string) {
  const s = String(dateValue || "").slice(0, 10);
  if (!s) return false;
  if (dateFrom && s < dateFrom) return false;
  if (dateTo && s > dateTo) return false;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const mode = String(req.query.mode || "summary").trim();
    const dateFrom = String(req.query.date_from || "").trim();
    const dateTo = String(req.query.date_to || "").trim();
    const format = String(req.query.format || "json").trim().toLowerCase();

    const [batchesRes, itemsRes, deliveriesRes] = await Promise.all([
      supabaseAdmin
        .from("cod_settlement_batches")
        .select("*")
        .order("settlement_date", { ascending: false }),
      supabaseAdmin
        .from("cod_settlement_items")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .eq("delivery_status", "DELIVERED")
        .order("delivered_at", { ascending: false }),
    ]);

    if (batchesRes.error) return send(res, 500, { error: batchesRes.error.message });
    if (itemsRes.error) return send(res, 500, { error: itemsRes.error.message });
    if (deliveriesRes.error) return send(res, 500, { error: deliveriesRes.error.message });

    const batches = (batchesRes.data || []).filter((row: any) =>
      (!dateFrom && !dateTo) || inRange(row.settlement_date, dateFrom, dateTo)
    );
    const items = (itemsRes.data || []).filter((row: any) =>
      (!dateFrom && !dateTo) || inRange(row.created_at, dateFrom, dateTo)
    );
    const deliveries = (deliveriesRes.data || []).filter((row: any) =>
      (!dateFrom && !dateTo) || inRange(row.delivered_at, dateFrom, dateTo)
    );

    let result: any[] = [];

    if (mode === "summary") {
      result = [{
        total_batches: batches.length,
        posted_batches: batches.filter((x: any) => x.status === "POSTED").length,
        total_delivery_count: batches.reduce((a: number, x: any) => a + num(x.total_delivery_count), 0),
        expected_amount: batches.reduce((a: number, x: any) => a + num(x.expected_amount), 0),
        collected_amount: batches.reduce((a: number, x: any) => a + num(x.collected_amount), 0),
        shortage_amount: batches.reduce((a: number, x: any) => a + num(x.shortage_amount), 0),
        overage_amount: batches.reduce((a: number, x: any) => a + num(x.overage_amount), 0),
      }];
    } else if (mode === "rider") {
      const map = new Map<string, any>();
      for (const row of items) {
        const key = String(row.rider_name || "Unassigned");
        if (!map.has(key)) {
          map.set(key, {
            rider_name: key,
            delivery_count: 0,
            expected_amount: 0,
            collected_amount: 0,
            difference_amount: 0,
            settled_count: 0,
            partial_count: 0,
            unsettled_count: 0,
          });
        }
        const agg = map.get(key);
        agg.delivery_count += 1;
        agg.expected_amount += num(row.expected_amount);
        agg.collected_amount += num(row.collected_amount);
        agg.difference_amount += num(row.difference_amount);
        if (row.status === "SETTLED") agg.settled_count += 1;
        else if (row.status === "PARTIAL") agg.partial_count += 1;
        else agg.unsettled_count += 1;
      }
      result = Array.from(map.values()).sort((a, b) => b.collected_amount - a.collected_amount);
    } else if (mode === "daily") {
      const map = new Map<string, any>();
      for (const row of batches) {
        const key = String(row.settlement_date || "");
        if (!map.has(key)) {
          map.set(key, {
            settlement_date: key,
            total_batches: 0,
            total_delivery_count: 0,
            expected_amount: 0,
            collected_amount: 0,
            shortage_amount: 0,
            overage_amount: 0,
          });
        }
        const agg = map.get(key);
        agg.total_batches += 1;
        agg.total_delivery_count += num(row.total_delivery_count);
        agg.expected_amount += num(row.expected_amount);
        agg.collected_amount += num(row.collected_amount);
        agg.shortage_amount += num(row.shortage_amount);
        agg.overage_amount += num(row.overage_amount);
      }
      result = Array.from(map.values()).sort((a, b) => String(a.settlement_date).localeCompare(String(b.settlement_date)));
    } else if (mode === "aging") {
      result = deliveries
        .filter((row: any) => ["UNSETTLED", "PARTIAL", "DISCREPANCY"].includes(String(row.settlement_status || "")))
        .map((row: any) => {
          const deliveredAt = new Date(row.delivered_at || row.updated_at || row.created_at || new Date().toISOString());
          const ageDays = Math.max(0, Math.floor((Date.now() - deliveredAt.getTime()) / 86400000));
          return {
            delivery_id: row.delivery_id,
            pickup_id: row.pickup_id,
            rider_name: row.rider_name || "",
            receiver_name: row.receiver_name || "",
            delivered_at: row.delivered_at,
            expected_amount: num(row.waybill_total_cod || row.receivable || 0),
            collected_amount: num(row.cod_collected_amount || 0),
            settlement_status: row.settlement_status || "UNSETTLED",
            age_days: ageDays,
          };
        })
        .sort((a, b) => b.age_days - a.age_days);
    } else {
      return send(res, 400, { error: "Unsupported mode" });
    }

    if (format === "csv") {
      const csv = toCsv(result);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${mode}-finance-reconciliation.csv"`);
      return res.status(200).send(csv);
    }

    return send(res, 200, { ok: true, mode, data: result });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Finance reconciliation API failed" });
  }
}
