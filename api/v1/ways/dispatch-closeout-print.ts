import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";

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

function page(batch: any) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Dispatch Closeout Summary</title>
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
  .meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 16px 0;
  }
  .card {
    border: 1px solid #dbe4ee;
    border-radius: 12px;
    padding: 10px;
    background: #fff;
  }
  .label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: #64748b;
  }
  .value {
    margin-top: 8px;
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 12px;
  }
  .section-title {
    margin: 18px 0 10px;
    font-size: 16px;
    font-weight: 800;
  }
  .notes {
    min-height: 88px;
    border: 1px solid #dbe4ee;
    border-radius: 12px;
    padding: 10px;
    white-space: pre-wrap;
  }
  .signatures {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin-top: 28px;
  }
  .sig-box {
    padding-top: 42px;
    border-top: 1px solid #94a3b8;
    font-size: 12px;
    color: #334155;
  }
  .printbar { margin-bottom: 16px; }
  .printbtn {
    border: none;
    background: #0f766e;
    color: #fff;
    padding: 10px 14px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
  }
  @media print { .printbar { display: none; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="printbar"><button class="printbtn" onclick="window.print()">Print</button></div>

    <div class="header">
      <div class="eyebrow">Britium Express</div>
      <div class="title">Dispatch Closeout Summary</div>
      <div class="sub">Closed dispatch batch summary for operations and finance sign-off.</div>
    </div>

    <div class="meta">
      <div class="card"><div class="label">Dispatch Batch ID</div><div class="value">${esc(batch.dispatch_batch_id)}</div></div>
      <div class="card"><div class="label">Dispatch Date</div><div class="value">${esc(batch.dispatch_date)}</div></div>
      <div class="card"><div class="label">Status</div><div class="value">${esc(batch.status)}</div></div>
    </div>

    <div class="grid">
      <div class="card"><div class="label">Hub</div><div class="value">${esc(batch.hub_code || "-")}</div></div>
      <div class="card"><div class="label">Township</div><div class="value">${esc(batch.township || "-")}</div></div>
      <div class="card"><div class="label">Zone</div><div class="value">${esc(batch.zone_code || "-")}</div></div>
      <div class="card"><div class="label">Rider</div><div class="value">${esc(batch.rider_name || "-")}</div></div>
      <div class="card"><div class="label">Rider Phone</div><div class="value">${esc(batch.rider_phone || "-")}</div></div>
      <div class="card"><div class="label">Vehicle No</div><div class="value">${esc(batch.vehicle_no || "-")}</div></div>
      <div class="card"><div class="label">Total Ways</div><div class="value">${esc(batch.total_ways || 0)}</div></div>
      <div class="card"><div class="label">Delivered</div><div class="value">${esc(batch.delivered_count || 0)}</div></div>
      <div class="card"><div class="label">Failed Attempts</div><div class="value">${esc(batch.failed_count || 0)}</div></div>
      <div class="card"><div class="label">Returned</div><div class="value">${esc(batch.returned_count || 0)}</div></div>
      <div class="card"><div class="label">COD Expected</div><div class="value">${money(batch.cod_expected)}</div></div>
      <div class="card"><div class="label">COD Collected</div><div class="value">${money(batch.cod_collected)}</div></div>
      <div class="card"><div class="label">Shortage</div><div class="value">${money(batch.shortage_amount)}</div></div>
      <div class="card"><div class="label">Overage</div><div class="value">${money(batch.overage_amount)}</div></div>
      <div class="card"><div class="label">Returned At</div><div class="value">${esc(batch.returned_at || "-")}</div></div>
      <div class="card"><div class="label">Returned By</div><div class="value">${esc(batch.returned_by || "-")}</div></div>
    </div>

    <div class="section-title">Closeout Note</div>
    <div class="notes">${esc(batch.closeout_note || "-")}</div>

    <div class="signatures">
      <div class="sig-box">Operations Prepared By</div>
      <div class="sig-box">Rider Returned By</div>
      <div class="sig-box">Finance Verified By</div>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method not allowed");
    }

    const dispatchBatchId = String(req.query.dispatch_batch_id || "").trim();
    if (!dispatchBatchId) {
      return res.status(400).send("dispatch_batch_id is required");
    }

    const result = await supabaseAdmin
      .from("dispatch_batches")
      .select("*")
      .eq("dispatch_batch_id", dispatchBatchId)
      .maybeSingle();

    if (result.error) return res.status(500).send(result.error.message);
    if (!result.data) return res.status(404).send("Dispatch batch not found");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(page(result.data));
  } catch (error: any) {
    return res.status(500).send(error?.message || "Dispatch closeout print API failed");
  }
}
