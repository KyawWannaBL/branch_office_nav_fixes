import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

function includesQ(row: any, q: string) {
  if (!q) return true;
  const text = [
    row.delivery_id,
    row.pickup_id,
    row.receiver_name,
    row.receiver_phone,
    row.receiver_township,
    row.township,
    row.rider_name,
    row.run_sheet_id,
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(q);
}

function money(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const q = String(req.query.q || "").trim().toLowerCase();

    const [deliveryRes, batchRes] = await Promise.all([
      supabaseAdmin
        .from("delivery_orders")
        .select(
          "delivery_id,pickup_id,receiver_name,receiver_phone,receiver_township,township,receiver_address,delivery_address,delivery_status,rider_name,rider_phone,run_sheet_id,waybill_total_cod,receivable,updated_at"
        )
        .order("updated_at", { ascending: false })
        .limit(600),
      supabaseAdmin
        .from("dispatch_batches")
        .select(
          "dispatch_batch_id,dispatch_date,hub_code,township,zone_code,status,rider_name,rider_phone,vehicle_no,total_ways,updated_at"
        )
        .order("updated_at", { ascending: false })
        .limit(300),
    ]);

    if (deliveryRes.error) return send(res, 500, { error: deliveryRes.error.message });
    if (batchRes.error) return send(res, 500, { error: batchRes.error.message });

    let deliveries = Array.isArray(deliveryRes.data) ? deliveryRes.data : [];
    let batches = Array.isArray(batchRes.data) ? batchRes.data : [];

    if (q) {
      deliveries = deliveries.filter((row: any) => includesQ(row, q));
      batches = batches.filter((row: any) =>
        [
          row.dispatch_batch_id,
          row.dispatch_date,
          row.hub_code,
          row.township,
          row.zone_code,
          row.status,
          row.rider_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    const openStatuses = new Set(["SAVED", "SUBMITTED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED_ATTEMPT"]);
    const helperStatuses = new Set(["SAVED", "SUBMITTED", "IN_TRANSIT"]);

    const unassigned = deliveries.filter((row: any) => {
      const status = String(row.delivery_status || "").toUpperCase();
      return openStatuses.has(status) && !String(row.rider_name || "").trim();
    });

    const driverQueue = deliveries.filter((row: any) => {
      const status = String(row.delivery_status || "").toUpperCase();
      return ["IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED_ATTEMPT"].includes(status);
    });

    const helperQueue = deliveries.filter((row: any) => {
      const status = String(row.delivery_status || "").toUpperCase();
      return helperStatuses.has(status);
    });

    const activeBatches = batches.filter(
      (row: any) => String(row.status || "").toUpperCase() !== "CLOSED"
    );

    const driverMap = new Map<
      string,
      { rider_name: string; rider_phone: string; assigned_ways: number; out_for_delivery: number; failed_attempts: number; cod_open: number }
    >();

    for (const row of deliveries) {
      const rider = String(row.rider_name || "").trim();
      if (!rider) continue;

      if (!driverMap.has(rider)) {
        driverMap.set(rider, {
          rider_name: rider,
          rider_phone: String(row.rider_phone || ""),
          assigned_ways: 0,
          out_for_delivery: 0,
          failed_attempts: 0,
          cod_open: 0,
        });
      }

      const agg = driverMap.get(rider)!;
      const status = String(row.delivery_status || "").toUpperCase();

      agg.assigned_ways += 1;
      if (status === "OUT_FOR_DELIVERY") agg.out_for_delivery += 1;
      if (status === "FAILED_ATTEMPT") agg.failed_attempts += 1;
      agg.cod_open += money(row.waybill_total_cod || row.receivable || 0);
    }

    const driverSummary = Array.from(driverMap.values()).sort(
      (a, b) => b.assigned_ways - a.assigned_ways || b.cod_open - a.cod_open
    );

    const kpis = {
      total_open_ways: deliveries.filter((row: any) => {
        const s = String(row.delivery_status || "").toUpperCase();
        return openStatuses.has(s);
      }).length,
      unassigned_ways: unassigned.length,
      helper_pending_ways: helperQueue.length,
      out_for_delivery_ways: deliveries.filter((row: any) => String(row.delivery_status || "").toUpperCase() === "OUT_FOR_DELIVERY").length,
      failed_attempts: deliveries.filter((row: any) => String(row.delivery_status || "").toUpperCase() === "FAILED_ATTEMPT").length,
      active_batches: activeBatches.length,
      active_drivers: driverSummary.length,
      cod_open: deliveries.reduce((sum: number, row: any) => sum + money(row.waybill_total_cod || row.receivable || 0), 0),
    };

    return send(res, 200, {
      ok: true,
      data: {
        kpis,
        driver_queue: driverQueue,
        helper_queue: helperQueue,
        unassigned,
        active_batches: activeBatches,
        driver_summary: driverSummary,
      },
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Rider portal API failed" });
  }
}
