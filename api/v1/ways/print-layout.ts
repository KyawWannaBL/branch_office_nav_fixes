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
  return Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "0";
}

function htmlPage(title: string, subtitle: string, tableRows: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<style>
  @page { size: A4 portrait; margin: 14mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; }
  .wrap { padding: 8px; }
  .header { margin-bottom: 14px; }
  .title { font-size: 24px; font-weight: 800; }
  .sub { margin-top: 6px; font-size: 12px; color: #475569; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
  th { background: #f8fafc; font-weight: 800; }
  .right { text-align: right; }
  .footer { margin-top: 18px; font-size: 11px; color: #64748b; }
  .printbar { margin: 10px 0 16px; }
  .printbtn { border: none; background: #0f766e; color: #fff; padding: 10px 14px; border-radius: 10px; font-weight: 700; cursor: pointer; }
  @media print { .printbar { display: none; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="printbar"><button class="printbtn" onclick="window.print()">Print</button></div>
    <div class="header">
      <div class="title">${esc(title)}</div>
      <div class="sub">${esc(subtitle)}</div>
    </div>
    <table>${tableRows}</table>
    <div class="footer">Britium Express Logistics Operations Platform</div>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const type = String(req.query.type || "MANIFEST").trim().toUpperCase();
    const deliveryIds = String(req.query.delivery_ids || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const dispatchBatchId = String(req.query.dispatch_batch_id || "").trim();

    let deliveryRows: any[] = [];

    if (dispatchBatchId) {
      const batchItemsRes = await supabaseAdmin
        .from("dispatch_batch_items")
        .select("delivery_id")
        .eq("dispatch_batch_id", dispatchBatchId);

      if (batchItemsRes.error) return send(res, 500, { error: batchItemsRes.error.message });

      const ids = (batchItemsRes.data || []).map((x: any) => x.delivery_id).filter(Boolean);
      if (!ids.length) return send(res, 404, { error: "No dispatch batch items found" });

      const deliveryRes = await supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .in("delivery_id", ids)
        .order("receiver_township", { ascending: true });

      if (deliveryRes.error) return send(res, 500, { error: deliveryRes.error.message });
      deliveryRows = deliveryRes.data || [];
    } else {
      if (!deliveryIds.length) return send(res, 400, { error: "delivery_ids are required" });

      const deliveryRes = await supabaseAdmin
        .from("delivery_orders")
        .select("*")
        .in("delivery_id", deliveryIds)
        .order("receiver_township", { ascending: true });

      if (deliveryRes.error) return send(res, 500, { error: deliveryRes.error.message });
      deliveryRows = deliveryRes.data || [];
    }

    const title = type === "ROUTE_SHEET" ? "Route Sheet" : "Delivery Manifest";
    const subtitle = dispatchBatchId
      ? `Dispatch Batch: ${dispatchBatchId} | Ways: ${deliveryRows.length}`
      : `Selected Ways: ${deliveryRows.length}`;

    const head =
      type === "ROUTE_SHEET"
        ? `<thead><tr>
            <th>No.</th>
            <th>Delivery ID</th>
            <th>Pickup ID</th>
            <th>Receiver</th>
            <th>Phone</th>
            <th>Township</th>
            <th>Address</th>
            <th>COD</th>
            <th>Seq</th>
            <th>Sign</th>
          </tr></thead>`
        : `<thead><tr>
            <th>No.</th>
            <th>Delivery ID</th>
            <th>Pickup ID</th>
            <th>Receiver</th>
            <th>Phone</th>
            <th>Township</th>
            <th>Address</th>
            <th>Status</th>
            <th>COD</th>
          </tr></thead>`;

    const bodyRows = deliveryRows.map((row: any, idx: number) => {
      const township = row.receiver_township || row.township || "";
      const address = row.receiver_address || row.delivery_address || "";
      const cod = money(row.waybill_total_cod || row.receivable || 0);

      if (type === "ROUTE_SHEET") {
        return `<tr>
          <td>${idx + 1}</td>
          <td>${esc(row.delivery_id)}</td>
          <td>${esc(row.pickup_id)}</td>
          <td>${esc(row.receiver_name)}</td>
          <td>${esc(row.receiver_phone)}</td>
          <td>${esc(township)}</td>
          <td>${esc(address)}</td>
          <td class="right">${cod}</td>
          <td></td>
          <td></td>
        </tr>`;
      }

      return `<tr>
        <td>${idx + 1}</td>
        <td>${esc(row.delivery_id)}</td>
        <td>${esc(row.pickup_id)}</td>
        <td>${esc(row.receiver_name)}</td>
        <td>${esc(row.receiver_phone)}</td>
        <td>${esc(township)}</td>
        <td>${esc(address)}</td>
        <td>${esc(row.delivery_status)}</td>
        <td class="right">${cod}</td>
      </tr>`;
    }).join("");

    await writeAuditLog({
      req,
      action: "dispatch.batch.print",
      resourceType: "dispatch_print",
      resourceId: dispatchBatchId || type,
      payload: { type, dispatchBatchId, deliveryIds },
    });

    const qs = new URLSearchParams();
    qs.set("type", type);
    if (dispatchBatchId) qs.set("dispatch_batch_id", dispatchBatchId);
    if (!dispatchBatchId && deliveryIds.length) qs.set("delivery_ids", deliveryIds.join(","));
    qs.set("format", "html");
    const printUrl = `/api/v1/ways/print-layout?${qs.toString()}`;

    if (wantsHtml(req)) {
      const html = htmlPage(title, subtitle, `${head}<tbody>${bodyRows}</tbody>`);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    }

    return send(res, 200, {
      ok: true,
      data: {
        title,
        subtitle,
        count: deliveryRows.length,
        rows: deliveryRows,
      },
      print_url: printUrl,
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Way print layout API failed" });
  }
}