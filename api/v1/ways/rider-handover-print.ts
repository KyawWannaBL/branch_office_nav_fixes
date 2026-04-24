import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from '../../_lib/serverSupabase.js';
import { writeAuditLog } from '../../_lib/auditLog.js';

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

function wantsHtml(req: VercelRequest) {
  const format = String(req.query.format || "").toLowerCase();
  const accept = String(req.headers.accept || "").toLowerCase();
  const dest = String(req.headers["sec-fetch-dest"] || "").toLowerCase();
  return format === "html" || dest === "document" || accept.includes("text/html");
}

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
}

function page(report: any) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Rider Handover Report</title>
<style>
  @page { size: A4 portrait; margin: 14mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; }
  .wrap { padding: 8px; }
  .header { margin-bottom: 14px; }
  .eyebrow {
    display: inline-block;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .title { margin-top: 12px; font-size: 26px; font-weight: 800; }
  .sub { margin-top: 6px; font-size: 12px; color: #475569; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0; }
  .meta-card, .metric { border: 1px solid #dbe4ee; border-radius: 12px; padding: 10px; background: #fff; }
  .label { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #64748b; }
  .value { margin-top: 8px; font-size: 18px; font-weight: 800; color: #0f172a; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 12px; }
  .section-title { margin: 18px 0 10px; font-size: 16px; font-weight: 800; }
  .notes { min-height: 88px; border: 1px solid #dbe4ee; border-radius: 12px; padding: 10px; white-space: pre-wrap; }
  .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 28px; }
  .sig-box { padding-top: 42px; border-top: 1px solid #94a3b8; font-size: 12px; color: #334155; }
  .printbar { margin-bottom: 16px; }
  .printbtn { border: none; background: #0f766e; color: #fff; padding: 10px 14px; border-radius: 10px; font-weight: 700; cursor: pointer; }
  @media print { .printbar { display: none; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="printbar"><button class="printbtn" onclick="window.print()">Print</button></div>
    <div class="header">
      <div class="eyebrow">Britium Express</div>
      <div class="title">Rider Handover Report</div>
      <div class="sub">Saved finance handover report for rider settlement and reconciliation.</div>
    </div>
    <div class="meta">
      <div class="meta-card"><div class="label">Report ID</div><div class="value">${esc(report.report_id)}</div></div>
      <div class="meta-card"><div class="label">Report Date</div><div class="value">${esc(report.report_date)}</div></div>
      <div class="meta-card"><div class="label">Rider</div><div class="value">${esc(report.rider_name)}</div></div>
    </div>
    <div class="grid">
      <div class="metric"><div class="label">Rider Phone</div><div class="value">${esc(report.rider_phone || "-")}</div></div>
      <div class="metric"><div class="label">Total Batches</div><div class="value">${esc(report.total_batches)}</div></div>
      <div class="metric"><div class="label">Delivered</div><div class="value">${esc(report.delivered_count)}</div></div>
      <div class="metric"><div class="label">Failed Attempts</div><div class="value">${esc(report.failed_count)}</div></div>
      <div class="metric"><div class="label">Returned</div><div class="value">${esc(report.returned_count)}</div></div>
      <div class="metric"><div class="label">COD Expected</div><div class="value">${money(report.cod_expected)}</div></div>
      <div class="metric"><div class="label">COD Collected</div><div class="value">${money(report.cod_collected)}</div></div>
      <div class="metric"><div class="label">Shortage</div><div class="value">${money(report.shortage_amount)}</div></div>
      <div class="metric"><div class="label">Overage</div><div class="value">${money(report.overage_amount)}</div></div>
      <div class="metric"><div class="label">Created At</div><div class="value">${esc(report.created_at || "-")}</div></div>
    </div>
    <div class="section-title">Notes</div>
    <div class="notes">${esc(report.note || "-")}</div>
    <div class="signatures">
      <div class="sig-box">Prepared By</div>
      <div class="sig-box">Rider Signature</div>
      <div class="sig-box">Finance Received By</div>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const reportId = String(req.query.report_id || "").trim();
    if (!reportId) {
      return send(res, 400, { error: "report_id is required" });
    }

    const result = await supabaseAdmin
      .from("rider_handover_reports")
      .select("*")
      .eq("report_id", reportId)
      .maybeSingle();

    if (result.error) return send(res, 500, { error: result.error.message });
    if (!result.data) return send(res, 404, { error: "Rider handover report not found" });

    await writeAuditLog({
      req,
      action: "rider.handover.print",
      resourceType: "rider_handover_report",
      resourceId: reportId,
      afterState: result.data,
    });

    const printUrl = `/api/v1/ways/rider-handover-print?report_id=${encodeURIComponent(reportId)}&format=html`;

    if (wantsHtml(req)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(page(result.data));
    }

    return send(res, 200, {
      ok: true,
      data: result.data,
      print_url: printUrl,
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Rider handover print API failed" });
  }
}