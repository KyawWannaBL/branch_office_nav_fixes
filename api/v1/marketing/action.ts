import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/serverSupabase";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const body = parseBody(req);
    const action = String(body.action || "").trim();

    if (!action) return send(res, 400, { error: "action is required" });

    if (action === "create_campaign") {
      const payload = {
        campaign_code: body.campaign_code || null,
        title: body.title,
        campaign_type: body.campaign_type || "PROMO_CODE",
        status: body.status || "DRAFT",
        promo_code: body.promo_code || null,
        discount_type: body.discount_type || "PERCENT",
        discount_value: Number(body.discount_value || 0),
        waives_overweight_surcharge: !!body.waives_overweight_surcharge,
        geo_origin_city: body.geo_origin_city || null,
        geo_origin_township: body.geo_origin_township || null,
        geo_destination_city: body.geo_destination_city || null,
        geo_destination_township: body.geo_destination_township || null,
        applies_to_new_merchants: !!body.applies_to_new_merchants,
        volume_threshold: Number(body.volume_threshold || 0),
        cashback_amount: Number(body.cashback_amount || 0),
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        description: body.description || null,
      };

      if (!payload.title) return send(res, 400, { error: "title is required" });

      const result = await supabaseAdmin
        .from("marketing_campaigns")
        .insert(payload)
        .select("*")
        .single();

      if (result.error) return send(res, 500, { error: result.error.message });

      return send(res, 200, { ok: true, data: result.data, message: "Campaign created" });
    }

    if (action === "save_lead") {
      const payload = {
        company_name: body.company_name,
        contact_name: body.contact_name || null,
        phone: body.phone || null,
        email: body.email || null,
        city: body.city || null,
        township: body.township || null,
        lead_status: body.lead_status || "COLD_LEAD",
        monthly_way_target: Number(body.monthly_way_target || 0),
        proposed_tariff_rate: Number(body.proposed_tariff_rate || 0),
        notes: body.notes || null,
      };

      if (!payload.company_name) return send(res, 400, { error: "company_name is required" });

      const result = await supabaseAdmin
        .from("marketing_leads")
        .insert(payload)
        .select("*")
        .single();

      if (result.error) return send(res, 500, { error: result.error.message });

      return send(res, 200, { ok: true, data: result.data, message: "Lead saved" });
    }

    if (action === "convert_lead") {
      const leadId = String(body.lead_id || "");
      if (!leadId) return send(res, 400, { error: "lead_id is required" });

      const leadRes = await supabaseAdmin
        .from("marketing_leads")
        .select("*")
        .eq("id", leadId)
        .maybeSingle();

      if (leadRes.error) return send(res, 500, { error: leadRes.error.message });
      if (!leadRes.data) return send(res, 404, { error: "Lead not found" });

      const lead = leadRes.data;

      const partyRes = await supabaseAdmin
        .from("parties")
        .insert({
          party_type: "MERCHANT",
          business_name: lead.company_name,
          contact_name: lead.contact_name || lead.company_name,
          phone: lead.phone || null,
          township: lead.township || null,
          address: lead.notes || null,
        })
        .select("*")
        .single();

      if (partyRes.error) return send(res, 500, { error: partyRes.error.message });

      const updateRes = await supabaseAdmin
        .from("marketing_leads")
        .update({
          lead_status: "ACTIVE_MERCHANT",
          converted_party_id: partyRes.data.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (updateRes.error) return send(res, 500, { error: updateRes.error.message });

      await supabaseAdmin.from("broadcast_jobs").insert({
        audience_type: "MERCHANT_ONBOARDING",
        channel: "EMAIL",
        title: `Welcome ${lead.company_name}`,
        message: `Merchant onboarding queued for ${lead.company_name}. Create portal credentials and send SLA/welcome pack.`,
        status: "QUEUED",
        target_filter: { merchant_party_id: partyRes.data.id, lead_id: leadId },
      });

      return send(res, 200, {
        ok: true,
        data: { party_id: partyRes.data.id, company_name: lead.company_name },
        message: "Lead converted to active merchant and welcome job queued",
      });
    }

    if (action === "save_asset") {
      const payload = {
        asset_name: body.asset_name,
        asset_type: body.asset_type || "IMAGE",
        asset_category: body.asset_category || "BRAND",
        file_url: body.file_url,
        branch_scope: body.branch_scope || "GLOBAL",
        is_verified: body.is_verified !== false,
        notes: body.notes || null,
      };

      if (!payload.asset_name || !payload.file_url) {
        return send(res, 400, { error: "asset_name and file_url are required" });
      }

      const result = await supabaseAdmin
        .from("marketing_assets")
        .insert(payload)
        .select("*")
        .single();

      if (result.error) return send(res, 500, { error: result.error.message });

      return send(res, 200, { ok: true, data: result.data, message: "Asset saved" });
    }

    if (action === "create_broadcast") {
      const payload = {
        audience_type: body.audience_type || "MERCHANTS",
        channel: body.channel || "IN_APP",
        title: body.title,
        message: body.message,
        target_filter: body.target_filter || {},
        status: "QUEUED",
      };

      if (!payload.title || !payload.message) {
        return send(res, 400, { error: "title and message are required" });
      }

      const result = await supabaseAdmin
        .from("broadcast_jobs")
        .insert(payload)
        .select("*")
        .single();

      if (result.error) return send(res, 500, { error: result.error.message });

      return send(res, 200, { ok: true, data: result.data, message: "Broadcast queued" });
    }

    if (action === "credit_wallet") {
      const payload = {
        party_id: body.party_id || null,
        campaign_id: body.campaign_id || null,
        credit_type: body.credit_type || "CASHBACK",
        credit_amount: Number(body.credit_amount || 0),
        status: "POSTED",
        remarks: body.remarks || null,
      };

      if (!payload.party_id) return send(res, 400, { error: "party_id is required" });
      if (!payload.credit_amount) return send(res, 400, { error: "credit_amount is required" });

      const result = await supabaseAdmin
        .from("merchant_wallet_credits")
        .insert(payload)
        .select("*")
        .single();

      if (result.error) return send(res, 500, { error: result.error.message });

      return send(res, 200, { ok: true, data: result.data, message: "Wallet credit posted" });
    }

    return send(res, 400, { error: "Unsupported action" });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Marketing action failed" });
  }
}
