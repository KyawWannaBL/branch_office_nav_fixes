import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from '../../_lib/serverSupabase.js';

function esc(v: unknown) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csv(headers: string[], rows: any[][]) {
  return [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

function clampLimit(v: unknown) {
  const n = Number(v ?? 2000);
  if (!Number.isFinite(n)) return 2000;
  return Math.max(1, Math.min(10000, Math.floor(n)));
}

function compactJson(v: unknown) {
  if (v === null || v === undefined) return "";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method not allowed");
    }

    const actor = String(req.query.actor || "").trim().toLowerCase();
    const action = String(req.query.action || "").trim().toLowerCase();
    const resource = String(req.query.resource || "").trim().toLowerCase();
    const dateFrom = String(req.query.date_from || "").trim();
    const dateTo = String(req.query.date_to || "").trim();
    const limit = clampLimit(req.query.limit);

    let query = supabaseAdmin
      .from("app_audit_logs")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (dateFrom) query = query.gte("occurred_at", `${dateFrom}T00:00:00.000Z`);
    if (dateTo) query = query.lte("occurred_at", `${dateTo}T23:59:59.999Z`);

    const result = await query;
    if (result.error) return res.status(500).send(result.error.message);

    let rows = result.data || [];

    if (actor) {
      rows = rows.filter((row: any) =>
        [row.actor_name, row.actor_role, row.actor_email].join(" ").toLowerCase().includes(actor)
      );
    }

    if (action) {
      rows = rows.filter((row: any) =>
        String(row.action || "").toLowerCase().includes(action)
      );
    }

    if (resource) {
      rows = rows.filter((row: any) =>
        [row.resource_type, row.resource_id].join(" ").toLowerCase().includes(resource)
      );
    }

    const out = csv(
      [
        "occurred_at",
        "request_id",
        "actor_name",
        "actor_role",
        "actor_email",
        "action",
        "resource_type",
        "resource_id",
        "target_status",
        "source_ip",
        "user_agent",
        "payload",
        "before_state",
        "after_state",
      ],
      rows.map((row: any) => [
        row.occurred_at,
        row.request_id,
        row.actor_name,
        row.actor_role,
        row.actor_email,
        row.action,
        row.resource_type,
        row.resource_id,
        row.target_status,
        row.source_ip,
        row.user_agent,
        compactJson(row.payload),
        compactJson(row.before_state),
        compactJson(row.after_state),
      ])
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="audit_logs_export.csv"');
    return res.status(200).send(out);
  } catch (error: any) {
    return res.status(500).send(error?.message || "Audit export API failed");
  }
}
