import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isToday(dateLike: unknown) {
  const s = String(dateLike || "").slice(0, 10);
  return s === new Date().toISOString().slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const [
      batchesRes,
      deliveriesRes,
      reportsRes,
    ] = await Promise.all([
      supabaseAdmin
        .from("dispatch_batches")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(300),

      supabaseAdmin
        .from("delivery_orders")
        .select("delivery_id,delivery_status,waybill_total_cod,receivable,updated_at,rider_name,receiver_township,township")
        .order("updated_at", { ascending: false })
        .limit(1200),

      supabaseAdmin
        .from("rider_handover_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (batchesRes.error) return send(res, 500, { error: batchesRes.error.message });
    if (deliveriesRes.error) return send(res, 500, { error: deliveriesRes.error.message });
    if (reportsRes.error) return send(res, 500, { error: reportsRes.error.message });

    const batches = batchesRes.data || [];
    const deliveries = deliveriesRes.data || [];
    const reports = reportsRes.data || [];

    const activeBatches = batches.filter((x: any) => ["PLANNED", "DISPATCHED"].includes(String(x.status || "")));
    const closeoutPending = batches.filter((x: any) => String(x.status || "") === "DISPATCHED");
    const financeExceptionsOpen = batches.filter((x: any) =>
      ["OPEN", "UNDER_REVIEW", "REOPENED"].includes(String(x.finance_exception_status || "OPEN")) &&
      (num(x.shortage_amount) > 0 || num(x.overage_amount) > 0 || num(x.cod_expected) !== num(x.cod_collected))
    );
    const handoversToday = reports.filter((x: any) => isToday(x.report_date)).length;

    const deliverySummary = {
      total_ways: deliveries.length,
      out_for_delivery: deliveries.filter((x: any) => String(x.delivery_status || "") === "OUT_FOR_DELIVERY").length,
      delivered: deliveries.filter((x: any) => String(x.delivery_status || "") === "DELIVERED").length,
      failed_attempt: deliveries.filter((x: any) => String(x.delivery_status || "") === "FAILED_ATTEMPT").length,
      returned: deliveries.filter((x: any) => String(x.delivery_status || "") === "RETURNED").length,
      cod_total: deliveries.reduce((a: number, x: any) => a + num(x.waybill_total_cod || x.receivable || 0), 0),
    };

    const townshipMap = new Map<string, number>();
    for (const row of deliveries) {
      const key = String(row.receiver_township || row.township || "Unassigned");
      townshipMap.set(key, (townshipMap.get(key) || 0) + 1);
    }
    const topTownships = Array.from(townshipMap.entries())
      .map(([township, total_ways]) => ({ township, total_ways }))
      .sort((a, b) => b.total_ways - a.total_ways)
      .slice(0, 8);

    return send(res, 200, {
      ok: true,
      data: {
        kpis: {
          active_dispatch_batches: activeBatches.length,
          closeout_pending_batches: closeoutPending.length,
          finance_exceptions_open: financeExceptionsOpen.length,
          rider_handovers_today: handoversToday,
        },
        delivery_summary: deliverySummary,
        top_townships: topTownships,
        recent_batches: batches.slice(0, 12),
        recent_finance_exceptions: financeExceptionsOpen.slice(0, 12),
        recent_handover_reports: reports.slice(0, 12),
      },
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Operations command center API failed" });
  }
}
