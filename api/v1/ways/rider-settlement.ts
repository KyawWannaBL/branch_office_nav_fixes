import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase.ts";
import { writeAuditLog } from "../../_lib/auditLog";

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

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function nextReportId(dateStr: string, riderName: string, seq: number) {
  const d = String(dateStr || "").split("-");
  const yymmdd = `${(d[0] || "0000").slice(-2)}${d[1] || "00"}${d[2] || "00"}`;
  const rider = riderName.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4) || "RDR";
  return `RSH-${rider}-${yymmdd}-${String(seq).padStart(3, "0")}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const dateFrom = String(req.query.date_from || "").trim();
      const dateTo = String(req.query.date_to || "").trim();
      const rider = String(req.query.rider_name || "").trim().toLowerCase();

      const result = await supabaseAdmin
        .from("dispatch_batches")
        .select("*")
        .eq("status", "CLOSED")
        .order("dispatch_date", { ascending: false });

      if (result.error) return send(res, 500, { error: result.error.message });

      let rows = result.data || [];
      if (dateFrom) rows = rows.filter((x: any) => String(x.dispatch_date || "") >= dateFrom);
      if (dateTo) rows = rows.filter((x: any) => String(x.dispatch_date || "") <= dateTo);
      if (rider) rows = rows.filter((x: any) => String(x.rider_name || "").toLowerCase().includes(rider));

      const map = new Map<string, any>();

      for (const row of rows) {
        const key = String(row.rider_name || "Unassigned");
        if (!map.has(key)) {
          map.set(key, {
            rider_name: key,
            rider_phone: row.rider_phone || "",
            total_batches: 0,
            delivered_count: 0,
            failed_count: 0,
            returned_count: 0,
            cod_expected: 0,
            cod_collected: 0,
            shortage_amount: 0,
            overage_amount: 0,
            batches: [],
          });
        }

        const agg = map.get(key);
        agg.total_batches += 1;
        agg.delivered_count += num(row.delivered_count);
        agg.failed_count += num(row.failed_count);
        agg.returned_count += num(row.returned_count);
        agg.cod_expected += num(row.cod_expected);
        agg.cod_collected += num(row.cod_collected);
        agg.shortage_amount += num(row.shortage_amount);
        agg.overage_amount += num(row.overage_amount);
        agg.batches.push(row);
      }

      return send(res, 200, { ok: true, data: Array.from(map.values()) });
    }

    if (req.method !== "POST") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const body = parseBody(req);
    const reportDate = String(body.report_date || "").trim();
    const riderName = String(body.rider_name || "").trim();
    const riderPhone = String(body.rider_phone || "").trim();
    const note = String(body.note || "").trim();

    if (!reportDate) return send(res, 400, { error: "report_date is required" });
    if (!riderName) return send(res, 400, { error: "rider_name is required" });

    const existingRes = await supabaseAdmin
      .from("rider_handover_reports")
      .select("report_id")
      .eq("report_date", reportDate)
      .eq("rider_name", riderName);

    if (existingRes.error) return send(res, 500, { error: existingRes.error.message });

    const reportId = nextReportId(reportDate, riderName, (existingRes.data || []).length + 1);

    const summary = {
      total_batches: num(body.total_batches),
      delivered_count: num(body.delivered_count),
      failed_count: num(body.failed_count),
      returned_count: num(body.returned_count),
      cod_expected: num(body.cod_expected),
      cod_collected: num(body.cod_collected),
      shortage_amount: num(body.shortage_amount),
      overage_amount: num(body.overage_amount),
    };

    const insertRes = await supabaseAdmin
      .from("rider_handover_reports")
      .insert({
        report_id: reportId,
        report_date: reportDate,
        rider_name: riderName,
        rider_phone: riderPhone || null,
        total_batches: summary.total_batches,
        delivered_count: summary.delivered_count,
        failed_count: summary.failed_count,
        returned_count: summary.returned_count,
        cod_expected: summary.cod_expected,
        cod_collected: summary.cod_collected,
        shortage_amount: summary.shortage_amount,
        overage_amount: summary.overage_amount,
        note: note || null,
      })
      .select("*")
      .single();

    if (insertRes.error) return send(res, 500, { error: insertRes.error.message });

    await writeAuditLog({
      req,
      action: "rider.handover.save",
      resourceType: "rider_handover_report",
      resourceId: insertRes.data.report_id,
      payload: body,
      afterState: insertRes.data,
    });

    return send(res, 200, { ok: true, data: insertRes.data });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Rider settlement API failed" });
  }
}