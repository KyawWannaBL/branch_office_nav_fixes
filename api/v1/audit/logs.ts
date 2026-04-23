import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

function clampLimit(v: unknown) {
  const n = Number(v ?? 300);
  if (!Number.isFinite(n)) return 300;
  return Math.max(1, Math.min(1000, Math.floor(n)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return send(res, 405, { error: "Method not allowed" });
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

    if (dateFrom) {
      query = query.gte("occurred_at", `${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
      query = query.lte("occurred_at", `${dateTo}T23:59:59.999Z`);
    }

    const result = await query;
    if (result.error) return send(res, 500, { error: result.error.message });

    let rows = result.data || [];

    if (actor) {
      rows = rows.filter((row: any) =>
        [
          row.actor_name,
          row.actor_role,
          row.actor_email,
        ]
          .join(" ")
          .toLowerCase()
          .includes(actor)
      );
    }

    if (action) {
      rows = rows.filter((row: any) =>
        String(row.action || "").toLowerCase().includes(action)
      );
    }

    if (resource) {
      rows = rows.filter((row: any) =>
        [
          row.resource_type,
          row.resource_id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(resource)
      );
    }

    const summary = {
      total_logs: rows.length,
      unique_actions: Array.from(new Set(rows.map((x: any) => String(x.action || "")))).filter(Boolean).length,
      unique_resources: Array.from(new Set(rows.map((x: any) => String(x.resource_type || "")))).filter(Boolean).length,
      unique_actors: Array.from(new Set(rows.map((x: any) => String(x.actor_name || x.actor_email || "")))).filter(Boolean).length,
    };

    return send(res, 200, { ok: true, data: rows, summary });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Audit logs API failed" });
  }
}
