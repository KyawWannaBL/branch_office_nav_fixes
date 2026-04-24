import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from '../../_lib/serverSupabase.js';
import { writeAuditLog } from '../../_lib/auditLog.js';

function esc(v: unknown) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function csv(headers: string[], rows: any[][]) {
  return [headers.join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method not allowed");
    }

    const pack = String(req.query.pack || "dispatch_closeout").trim();
    const dateFrom = String(req.query.date_from || "").trim();
    const dateTo = String(req.query.date_to || "").trim();
    const rider = String(req.query.rider_name || "").trim().toLowerCase();

    if (pack === "dispatch_closeout") {
      const result = await supabaseAdmin
        .from("dispatch_batches")
        .select("*")
        .order("dispatch_date", { ascending: false });

      if (result.error) return res.status(500).send(result.error.message);

      let rows = result.data || [];
      rows = rows.filter((x: any) => String(x.status || "") === "CLOSED");
      if (dateFrom) rows = rows.filter((x: any) => String(x.dispatch_date || "") >= dateFrom);
      if (dateTo) rows = rows.filter((x: any) => String(x.dispatch_date || "") <= dateTo);
      if (rider) rows = rows.filter((x: any) => String(x.rider_name || "").toLowerCase().includes(rider));

      const out = csv(
        [
          "dispatch_batch_id","dispatch_date","hub_code","township","zone_code",
          "rider_name","rider_phone","vehicle_no","status",
          "total_ways","delivered_count","failed_count","returned_count",
          "cod_expected","cod_collected","shortage_amount","overage_amount",
          "returned_at","returned_by","closeout_note"
        ],
        rows.map((x: any) => [
          x.dispatch_batch_id, x.dispatch_date, x.hub_code, x.township, x.zone_code,
          x.rider_name, x.rider_phone, x.vehicle_no, x.status,
          x.total_ways, x.delivered_count, x.failed_count, x.returned_count,
          num(x.cod_expected).toFixed(2), num(x.cod_collected).toFixed(2),
          num(x.shortage_amount).toFixed(2), num(x.overage_amount).toFixed(2),
          x.returned_at, x.returned_by, x.closeout_note
        ])
      );

      await writeAuditLog({
        req,
        action: "finance.export.pack",
        resourceType: "finance_export",
        resourceId: "dispatch_closeout",
        payload: { pack, dateFrom, dateTo, rider },
      });

      await writeAuditLog({
        req,
        action: "finance.export.pack",
        resourceType: "finance_export",
        resourceId: "rider_handover",
        payload: { pack, dateFrom, dateTo, rider },
      });

      await writeAuditLog({
        req,
        action: "finance.export.pack",
        resourceType: "finance_export",
        resourceId: "delivery_closeout_detail",
        payload: { pack, dateFrom, dateTo, rider },
      });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="dispatch_closeout_pack.csv"');
      return res.status(200).send(out);
    }

    if (pack === "rider_handover") {
      const result = await supabaseAdmin
        .from("rider_handover_reports")
        .select("*")
        .order("report_date", { ascending: false });

      if (result.error) return res.status(500).send(result.error.message);

      let rows = result.data || [];
      if (dateFrom) rows = rows.filter((x: any) => String(x.report_date || "") >= dateFrom);
      if (dateTo) rows = rows.filter((x: any) => String(x.report_date || "") <= dateTo);
      if (rider) rows = rows.filter((x: any) => String(x.rider_name || "").toLowerCase().includes(rider));

      const out = csv(
        [
          "report_id","report_date","rider_name","rider_phone","total_batches",
          "delivered_count","failed_count","returned_count",
          "cod_expected","cod_collected","shortage_amount","overage_amount","note","created_at"
        ],
        rows.map((x: any) => [
          x.report_id, x.report_date, x.rider_name, x.rider_phone, x.total_batches,
          x.delivered_count, x.failed_count, x.returned_count,
          num(x.cod_expected).toFixed(2), num(x.cod_collected).toFixed(2),
          num(x.shortage_amount).toFixed(2), num(x.overage_amount).toFixed(2),
          x.note, x.created_at
        ])
      );

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="rider_handover_pack.csv"');
      return res.status(200).send(out);
    }

    if (pack === "delivery_closeout_detail") {
      const batchRes = await supabaseAdmin
        .from("dispatch_batches")
        .select("dispatch_batch_id")
        .eq("status", "CLOSED");

      if (batchRes.error) return res.status(500).send(batchRes.error.message);
      const batchIds = (batchRes.data || []).map((x: any) => x.dispatch_batch_id);

      const itemsRes = await supabaseAdmin
        .from("dispatch_batch_items")
        .select("*")
        .in("dispatch_batch_id", batchIds.length ? batchIds : ["__NONE__"]);

      if (itemsRes.error) return res.status(500).send(itemsRes.error.message);
      const deliveryIds = (itemsRes.data || []).map((x: any) => x.delivery_id).filter(Boolean);

      const waysRes = await supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .in("delivery_id", deliveryIds.length ? deliveryIds : ["__NONE__"]);

      if (waysRes.error) return res.status(500).send(waysRes.error.message);

      const batchMap = new Map((itemsRes.data || []).map((x: any) => [x.delivery_id, x.dispatch_batch_id]));
      let rows = waysRes.data || [];
      if (rider) rows = rows.filter((x: any) => String(x.rider_name || "").toLowerCase().includes(rider));

      const out = csv(
        [
          "dispatch_batch_id","delivery_id","pickup_id","delivery_status","receiver_name","receiver_phone",
          "receiver_township","delivery_address","rider_name","rider_phone",
          "route_sequence","waybill_total_cod","last_scan_type","last_scan_at","updated_at"
        ],
        rows.map((x: any) => [
          batchMap.get(x.delivery_id) || "", x.delivery_id, x.pickup_id, x.delivery_status,
          x.receiver_name, x.receiver_phone, x.receiver_township || x.township,
          x.receiver_address || x.delivery_address, x.rider_name, x.rider_phone,
          x.route_sequence, num(x.waybill_total_cod || x.receivable).toFixed(2),
          x.last_scan_type, x.last_scan_at, x.updated_at
        ])
      );

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="delivery_closeout_detail.csv"');
      return res.status(200).send(out);
    }

    return res.status(400).send("Unknown pack");
  } catch (error: any) {
    return res.status(500).send(error?.message || "Finance export pack failed");
  }
}
