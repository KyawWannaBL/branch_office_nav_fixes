import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const dispatchBatchId = String(req.query.dispatch_batch_id || "").trim();
    if (!dispatchBatchId) {
      return send(res, 400, { error: "dispatch_batch_id is required" });
    }

    const batchRes = await supabaseAdmin
      .from("dispatch_batches")
      .select("*")
      .eq("dispatch_batch_id", dispatchBatchId)
      .maybeSingle();

    if (batchRes.error) return send(res, 500, { error: batchRes.error.message });
    if (!batchRes.data) return send(res, 404, { error: "Dispatch batch not found" });

    const itemsRes = await supabaseAdmin
      .from("dispatch_batch_items")
      .select("*")
      .eq("dispatch_batch_id", dispatchBatchId)
      .order("created_at", { ascending: true });

    if (itemsRes.error) return send(res, 500, { error: itemsRes.error.message });

    const items = itemsRes.data || [];
    const deliveryIds = items.map((x: any) => x.delivery_id).filter(Boolean);

    const deliveriesRes = await supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .in("delivery_id", deliveryIds.length ? deliveryIds : ["__NONE__"]);

    if (deliveriesRes.error) return send(res, 500, { error: deliveriesRes.error.message });

    const deliveries = deliveriesRes.data || [];

    const scansRes = await supabaseAdmin
      .from("delivery_scan_events")
      .select("*")
      .in("delivery_id", deliveryIds.length ? deliveryIds : ["__NONE__"])
      .order("created_at", { ascending: false });

    if (scansRes.error) return send(res, 500, { error: scansRes.error.message });

    const logsRes = await supabaseAdmin
      .from("way_status_logs")
      .select("*")
      .in("delivery_id", deliveryIds.length ? deliveryIds : ["__NONE__"])
      .order("created_at", { ascending: false });

    if (logsRes.error) return send(res, 500, { error: logsRes.error.message });

    const scanSummary: Record<string, number> = {};
    for (const row of scansRes.data || []) {
      const key = String(row.scan_type || "UNKNOWN");
      scanSummary[key] = (scanSummary[key] || 0) + 1;
    }

    const deliverySummary = {
      total_ways: deliveries.length,
      delivered_count: deliveries.filter((x: any) => x.delivery_status === "DELIVERED").length,
      failed_count: deliveries.filter((x: any) => x.delivery_status === "FAILED_ATTEMPT").length,
      returned_count: deliveries.filter((x: any) => x.delivery_status === "RETURNED").length,
      out_for_delivery_count: deliveries.filter((x: any) => x.delivery_status === "OUT_FOR_DELIVERY").length,
      cod_total: deliveries.reduce((a: number, x: any) => a + num(x.waybill_total_cod || x.receivable || 0), 0),
    };

    return send(res, 200, {
      ok: true,
      data: {
        batch: batchRes.data,
        items,
        deliveries,
        scan_events: scansRes.data || [],
        way_logs: logsRes.data || [],
        scan_summary: scanSummary,
        delivery_summary: deliverySummary,
      },
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Batch drilldown API failed" });
  }
}
