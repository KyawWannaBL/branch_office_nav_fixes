import type { VercelRequest } from "@vercel/node";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "./serverSupabase.js";

type AuditInput = {
  req: VercelRequest;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  targetStatus?: string | null;
  payload?: unknown;
  beforeState?: unknown;
  afterState?: unknown;
  actorName?: string | null;
  actorRole?: string | null;
  actorEmail?: string | null;
};

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

function q(req: VercelRequest, key: string) {
  const v = req.query?.[key];
  if (Array.isArray(v)) return String(v[0] || "").trim();
  return String(v || "").trim();
}

function h(req: VercelRequest, key: string) {
  const v = req.headers?.[key];
  if (Array.isArray(v)) return String(v[0] || "").trim();
  return String(v || "").trim();
}

function bodyValue(body: any, key: string) {
  const v = body?.[key];
  return typeof v === "string" ? v.trim() : "";
}

export function resolveActor(req: VercelRequest, explicit?: {
  actorName?: string | null;
  actorRole?: string | null;
  actorEmail?: string | null;
}) {
  const body = parseBody(req);

  const actorName =
    explicit?.actorName ||
    h(req, "x-actor-name") ||
    q(req, "actor_name") ||
    bodyValue(body, "actor_name") ||
    bodyValue(body, "reviewed_by") ||
    bodyValue(body, "returned_by") ||
    bodyValue(body, "scanned_by") ||
    bodyValue(body, "printed_by") ||
    null;

  const actorRole =
    explicit?.actorRole ||
    h(req, "x-actor-role") ||
    q(req, "actor_role") ||
    bodyValue(body, "actor_role") ||
    null;

  const actorEmail =
    explicit?.actorEmail ||
    h(req, "x-actor-email") ||
    q(req, "actor_email") ||
    bodyValue(body, "actor_email") ||
    null;

  return { actorName, actorRole, actorEmail };
}

export async function writeAuditLog(input: AuditInput) {
  try {
    const requestId = h(input.req, "x-request-id") || randomUUID();
    const actor = resolveActor(input.req, {
      actorName: input.actorName || null,
      actorRole: input.actorRole || null,
      actorEmail: input.actorEmail || null,
    });

    const sourceIp =
      h(input.req, "x-forwarded-for").split(",")[0].trim() ||
      h(input.req, "x-real-ip") ||
      null;

    const userAgent = h(input.req, "user-agent") || null;

    const result = await supabaseAdmin.from("app_audit_logs").insert({
      request_id: requestId,
      actor_name: actor.actorName,
      actor_role: actor.actorRole,
      actor_email: actor.actorEmail,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId || null,
      target_status: input.targetStatus || null,
      source_ip: sourceIp,
      user_agent: userAgent,
      payload: input.payload ?? null,
      before_state: input.beforeState ?? null,
      after_state: input.afterState ?? null,
    });

    if (result.error) {
      console.error("writeAuditLog insert failed:", result.error.message);
    }
  } catch (error) {
    console.error("writeAuditLog unexpected error:", error);
  }
}