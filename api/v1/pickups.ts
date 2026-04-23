import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/serverSupabase";
import { calculateDeliveryPricing } from "../_lib/deliveryPricing";

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

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function orgAbbr(input: string, fallback = "GEN") {
  const words = String(input || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return fallback;
  if (words.length === 1) {
    const one = words[0].replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
    return one || fallback;
  }
  return words.slice(0, 3).map((w) => w.replace(/[^A-Za-z]/g, "").slice(0, 1)).join("").toUpperCase().padEnd(3, "X").slice(0, 3);
}

async function reserveId(seqDate: string, org: string, kind: "P" | "D", existingId?: string | null) {
  const rpc = await supabaseAdmin.rpc("reserve_document_id", {
    p_seq_date: seqDate,
    p_org_abbr: org,
    p_seq_kind: kind,
    p_existing_id: existingId || null,
  });
  if (rpc.error) throw new Error(rpc.error.message);
  return String(rpc.data);
}

async function writeAudit(args: { pickupBatchId: string; pickupId: string; action: string; oldValue?: unknown; newValue?: unknown; }) {
  await supabaseAdmin.from("pickup_audit_logs").insert({
    pickup_batch_id: args.pickupBatchId,
    pickup_id: args.pickupId,
    action: args.action,
    old_value: args.oldValue ?? null,
    new_value: args.newValue ?? null,
  });
}

async function writeStatusHistory(args: { pickupBatchId: string; pickupId: string; fromStatus?: string | null; toStatus: string; }) {
  if (args.fromStatus === args.toStatus) return;
  await supabaseAdmin.from("pickup_status_history").insert({
    pickup_batch_id: args.pickupBatchId,
    pickup_id: args.pickupId,
    from_status: args.fromStatus ?? null,
    to_status: args.toStatus,
  });
}

function validatePickupForSave(pickup: any) {
  const missing: string[] = [];
  if (!pickup.pickupDate) missing.push("pickupDate");
  if (!pickup.sourceType) missing.push("sourceType");
  if (!pickup.merchantName) missing.push("merchantName");
  if (!pickup.contactPhone) missing.push("contactPhone");
  if (!pickup.pickupCity) missing.push("pickupCity");
  if (!pickup.pickupTownship) missing.push("pickupTownship");
  if (!pickup.pickupAddress) missing.push("pickupAddress");
  return missing;
}

function validatePickupForSubmit(pickup: any, deliveries: any[]) {
  const missing = validatePickupForSave(pickup);
  if (!deliveries.length) missing.push("deliveries");
  deliveries.forEach((row, i) => {
    if (!row.receiverName) missing.push(`deliveries[${i}].receiverName`);
    if (!row.receiverPhone) missing.push(`deliveries[${i}].receiverPhone`);
    if (!row.receiverCity) missing.push(`deliveries[${i}].receiverCity`);
    if (!row.receiverTownship) missing.push(`deliveries[${i}].receiverTownship`);
    if (!row.deliveryAddress && !row.receiverAddress) missing.push(`deliveries[${i}].deliveryAddress`);
  });
  return missing;
}

function actionToStatus(action: string) {
  if (action === "save_draft") return "DRAFT";
  if (action === "submit_pickup") return "SUBMITTED";
  return "SAVED";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const pickupId = String(req.query.pickup_id || "").trim();

      if (pickupId) {
        const pickupRes = await supabaseAdmin.from("pickup_batches").select("*").eq("pickup_id", pickupId).maybeSingle();
        if (pickupRes.error) return send(res, 500, { error: pickupRes.error.message });
        if (!pickupRes.data) return send(res, 404, { error: "Pickup not found" });

        const [rowsRes, auditRes, historyRes, attachRes] = await Promise.all([
          supabaseAdmin.from("delivery_orders").select("*, delivery_evidence(*)").eq("pickup_id", pickupId).order("line_no", { ascending: true }),
          supabaseAdmin.from("pickup_audit_logs").select("*").eq("pickup_id", pickupId).order("created_at", { ascending: false }).limit(30),
          supabaseAdmin.from("pickup_status_history").select("*").eq("pickup_id", pickupId).order("changed_at", { ascending: false }),
          supabaseAdmin.from("pickup_attachments").select("*").eq("pickup_id", pickupId).order("created_at", { ascending: false }),
        ]);

        if (rowsRes.error) return send(res, 500, { error: rowsRes.error.message });

        return send(res, 200, {
          ok: true,
          pickup: pickupRes.data,
          deliveries: rowsRes.data || [],
          audit_logs: auditRes.data || [],
          status_history: historyRes.data || [],
          attachments: attachRes.data || [],
        });
      }

      const listRes = await supabaseAdmin.from("pickup_batches").select("*").order("pickup_date", { ascending: false }).order("updated_at", { ascending: false });
      if (listRes.error) return send(res, 500, { error: listRes.error.message });
      return send(res, 200, { ok: true, data: listRes.data || [] });
    }

    if (req.method !== "POST") {
      return send(res, 405, { error: "Method not allowed" });
    }

    const body = parseBody(req);
    const action = String(body?.action || "save_pickup");
    const pickup = body?.pickup || {};
    const deliveries = Array.isArray(body?.deliveries) ? body.deliveries : [];

    if (!["save_draft", "save_pickup", "submit_pickup"].includes(action)) {
      return send(res, 400, { error: "Unsupported action" });
    }

    const missing =
      action === "submit_pickup"
        ? validatePickupForSubmit(pickup, deliveries)
        : action === "save_pickup"
          ? validatePickupForSave(pickup)
          : [];

    if (missing.length) {
      return send(res, 400, { error: `Missing required fields: ${missing.join(", ")}` });
    }

    const seqDate = String(pickup.pickupDate || "").slice(0, 10);
    const sourceType = String(pickup.sourceType || "MER");
    const org = orgAbbr(pickup.merchantCode || pickup.merchantName || sourceType, sourceType);
    const pickupId = await reserveId(seqDate, org, "P", pickup.pickupId || pickup.pickup_id || null);

    const existingBatchRes = await supabaseAdmin.from("pickup_batches").select("*").eq("pickup_id", pickupId).maybeSingle();
    if (existingBatchRes.error) return send(res, 500, { error: existingBatchRes.error.message });

    const existingBatch = existingBatchRes.data;
    const nextStatus = actionToStatus(action);

    const batchRes = await supabaseAdmin
      .from("pickup_batches")
      .upsert({
        id: existingBatch?.id || undefined,
        pickup_id: pickupId,
        pickup_date: seqDate,
        org_abbr: org,
        source_type: sourceType,
        merchant_name: pickup.merchantName,
        merchant_code: pickup.merchantCode || null,
        contact_name: pickup.contactName || null,
        contact_phone: pickup.contactPhone || null,
        pickup_address: pickup.pickupAddress || null,
        pickup_township: pickup.pickupTownship || null,
        pickup_city: pickup.pickupCity || null,
        pickup_by: pickup.pickupBy || null,
        pickup_by_2: pickup.pickupBy2 || null,
        pickup_window: pickup.pickupWindow || null,
        expected_way_count: Math.max(1, Number(pickup.totalWays || deliveries.length || 1)),
        actual_way_count: deliveries.length,
        pickup_status: nextStatus,
        remarks: pickup.remarks || null,
        draft_saved_at: action === "save_draft" ? new Date().toISOString() : existingBatch?.draft_saved_at || null,
        submitted_at: action === "submit_pickup" ? new Date().toISOString() : existingBatch?.submitted_at || null,
        locked_fields: action === "submit_pickup",
        version_no: Number(existingBatch?.version_no || 0) + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: "pickup_id" })
      .select("*")
      .single();

    if (batchRes.error) return send(res, 500, { error: batchRes.error.message });

    const savedBatch = batchRes.data;

    const existingRowsRes = await supabaseAdmin.from("delivery_orders").select("*").eq("pickup_id", pickupId).order("line_no", { ascending: true });
    if (existingRowsRes.error) return send(res, 500, { error: existingRowsRes.error.message });

    const existingRows = existingRowsRes.data || [];
    const existingByLine = new Map(existingRows.map((row: any) => [Number(row.line_no), row]));
    let maxLineNo = existingRows.reduce((m: number, row: any) => Math.max(m, Number(row.line_no || 0)), 0);

    const savedLineNos: number[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < deliveries.length; i += 1) {
      const row = deliveries[i];
      const existingRow = row.lineNo ? existingByLine.get(Number(row.lineNo)) : null;
      const lineNo = existingRow?.line_no || row.lineNo || ++maxLineNo;
      savedLineNos.push(Number(lineNo));

      const deliveryId = await reserveId(seqDate, org, "D", row.deliveryId || existingRow?.delivery_id || null);

      const calc = await calculateDeliveryPricing({
        township: row.receiverTownship || row.township || null,
        serviceType: row.serviceType || "standard",
        weightKg: num(row.weightKg),
        itemPrice: num(row.codAmount || row.itemPrice),
        itemPaymentStatus: row.itemPaymentStatus === "PAID" ? "PAID" : "UNPAID",
        merchantCustomerDeliveryCharge: num(row.merchantCharge || row.merchantCustomerDeliveryCharge),
        deliveryPaymentStatus: row.deliveryPaymentStatus === "PAID" ? "PAID" : "UNPAID",
      });

      const rowRes = await supabaseAdmin
        .from("delivery_orders")
        .upsert({
          id: existingRow?.id || row.id || undefined,
          delivery_id: deliveryId,
          pickup_batch_id: savedBatch.id,
          pickup_id: pickupId,
          line_no: Number(lineNo),
          receiver_name: row.receiverName || "",
          receiver_phone: row.receiverPhone || "",
          receiver_address: row.receiverAddress || row.deliveryAddress || "",
          receiver_city: row.receiverCity || "",
          receiver_township: row.receiverTownship || row.township || "",
          township: row.receiverTownship || row.township || "",
          destination: row.destination || null,
          delivery_address: row.receiverAddress || row.deliveryAddress || "",
          remarks: row.notes || row.remarks || null,
          parcel_count: Math.max(1, Number(row.parcelCount || 1)),
          weight_kg: num(row.weightKg),
          item_price: num(row.codAmount || row.itemPrice),
          item_payment_status: row.itemPaymentStatus === "PAID" ? "PAID" : "UNPAID",
          merchant_customer_delivery_charge: num(row.merchantCharge || row.merchantCustomerDeliveryCharge),
          delivery_payment_status: row.deliveryPaymentStatus === "PAID" ? "PAID" : "UNPAID",
          service_type: row.serviceType || "standard",
          base_weight_kg: calc.baseWeightKg,
          base_delivery_fee: calc.baseDeliveryFee,
          overweight_kg: calc.overweightKg,
          overweight_per_kg: calc.overweightPerKg,
          overweight_surcharge: calc.overweightSurcharge,
          os_delivery_charge: calc.osDeliveryCharge,
          printed_waybill_delivery_charge: calc.printedWaybillDeliveryCharge,
          os_total_cod: calc.osTotalCod,
          waybill_total_cod: calc.waybillTotalCod,
          receivable: calc.receivable,
          qr_value: deliveryId,
          detail_status: nextStatus,
          photo_evidence_status: row.photoEvidenceStatus || existingRow?.photo_evidence_status || "PENDING",
          qr_status: existingRow?.qr_status || "PENDING",
          waybill_print_status: existingRow?.waybill_print_status || "PENDING",
          status: action === "submit_pickup" ? "submitted" : "saved",
          updated_at: new Date().toISOString(),
        }, { onConflict: "delivery_id" })
        .select("*")
        .single();

      if (rowRes.error) return send(res, 500, { error: rowRes.error.message });

      const evidenceNames = Array.isArray(row.evidenceFiles) ? row.evidenceFiles.map((f: any) => f?.name).filter(Boolean) : [];
      if (evidenceNames.length) warnings.push(`${deliveryId}: attach/upload evidence through evidence endpoint`);
    }

    const deletableStatuses = ["DRAFT", "SAVED"];
    const rowsToDelete = existingRows.filter((row: any) =>
      !savedLineNos.includes(Number(row.line_no)) &&
      deletableStatuses.includes(String(row.detail_status || ""))
    );

    if (rowsToDelete.length) {
      const deleteIds = rowsToDelete.map((row: any) => row.id);
      await supabaseAdmin.from("delivery_orders").delete().in("id", deleteIds);
    }

    await writeAudit({
      pickupBatchId: savedBatch.id,
      pickupId,
      action,
      oldValue: existingBatch || null,
      newValue: savedBatch,
    });

    await writeStatusHistory({
      pickupBatchId: savedBatch.id,
      pickupId,
      fromStatus: existingBatch?.pickup_status || null,
      toStatus: nextStatus,
    });

    const finalRowsRes = await supabaseAdmin.from("delivery_orders").select("*, delivery_evidence(*)").eq("pickup_id", pickupId).order("line_no", { ascending: true });
    if (finalRowsRes.error) return send(res, 500, { error: finalRowsRes.error.message });

    return send(res, 200, {
      ok: true,
      pickup: savedBatch,
      deliveries: finalRowsRes.data || [],
      warnings,
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Pickup API failed" });
  }
}
