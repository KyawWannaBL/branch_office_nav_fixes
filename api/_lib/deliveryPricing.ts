import { supabaseAdmin } from "./serverSupabase.js";

export type PaymentStatus = "PAID" | "UNPAID";

export type DeliveryPricingInput = {
  township?: string | null;
  serviceType?: string | null;
  weightKg?: number | null;
  itemPrice?: number | null;
  itemPaymentStatus?: PaymentStatus | null;
  merchantCustomerDeliveryCharge?: number | null;
  deliveryPaymentStatus?: PaymentStatus | null;
};

export type DeliveryPricingResult = {
  baseWeightKg: number;
  baseDeliveryFee: number;
  overweightKg: number;
  overweightPerKg: number;
  overweightSurcharge: number;
  osDeliveryCharge: number;
  merchantInputCharge: number;
  printedWaybillDeliveryCharge: number;
  osTotalCod: number;
  waybillTotalCod: number;
  receivable: number;
  pricingSource: string;
};

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function cleanTownship(value: unknown) {
  return String(value || "").trim();
}

async function getTariff(township: string) {
  if (!township) return null;

  const exact = await supabaseAdmin
    .from("tariffs")
    .select("township_name, base_price, weight_surcharge_per_kg")
    .eq("township_name", township)
    .maybeSingle();

  if (!exact.error && exact.data) return exact.data;

  const rows = await supabaseAdmin
    .from("tariffs")
    .select("township_name, base_price, weight_surcharge_per_kg")
    .ilike("township_name", township);

  if (rows.error || !rows.data?.length) return null;
  return rows.data[0];
}

export async function calculateDeliveryPricing(
  input: DeliveryPricingInput
): Promise<DeliveryPricingResult> {
  const township = cleanTownship(input.township);
  const weightKg = Math.max(0, num(input.weightKg));
  const itemPrice = Math.max(0, num(input.itemPrice));
  const merchantInputCharge = Math.max(0, num(input.merchantCustomerDeliveryCharge));
  const itemPaymentStatus: PaymentStatus =
    input.itemPaymentStatus === "PAID" ? "PAID" : "UNPAID";
  const deliveryPaymentStatus: PaymentStatus =
    input.deliveryPaymentStatus === "PAID" ? "PAID" : "UNPAID";

  const defaultBaseWeightKg = 3;
  const defaultBaseDeliveryFee = 4000;
  const defaultOverweightPerKg = 500;

  try {
    const tariff = await getTariff(township);

    const baseDeliveryFee = Math.max(
      0,
      num(tariff?.base_price ?? defaultBaseDeliveryFee)
    );
    const overweightPerKg = Math.max(
      0,
      num(tariff?.weight_surcharge_per_kg ?? defaultOverweightPerKg)
    );

    const overweightKg = Math.max(0, weightKg - defaultBaseWeightKg);
    const overweightSurcharge = overweightKg * overweightPerKg;
    const osDeliveryCharge = baseDeliveryFee + overweightSurcharge;

    const printedWaybillDeliveryCharge = Math.max(
      osDeliveryCharge,
      merchantInputCharge
    );

    const itemCollectable = itemPaymentStatus === "UNPAID" ? itemPrice : 0;
    const osDeliveryCollectable =
      deliveryPaymentStatus === "UNPAID" ? osDeliveryCharge : 0;
    const waybillDeliveryCollectable =
      deliveryPaymentStatus === "UNPAID" ? printedWaybillDeliveryCharge : 0;

    return {
      baseWeightKg: defaultBaseWeightKg,
      baseDeliveryFee,
      overweightKg,
      overweightPerKg,
      overweightSurcharge,
      osDeliveryCharge,
      merchantInputCharge,
      printedWaybillDeliveryCharge,
      osTotalCod: itemCollectable + osDeliveryCollectable,
      waybillTotalCod: itemCollectable + waybillDeliveryCollectable,
      receivable: itemCollectable + osDeliveryCollectable,
      pricingSource: tariff ? "tariff_master" : "default_fallback",
    };
  } catch {
    const overweightKg = Math.max(0, weightKg - defaultBaseWeightKg);
    const overweightSurcharge = overweightKg * defaultOverweightPerKg;
    const osDeliveryCharge = defaultBaseDeliveryFee + overweightSurcharge;
    const printedWaybillDeliveryCharge = Math.max(
      osDeliveryCharge,
      merchantInputCharge
    );
    const itemCollectable = itemPaymentStatus === "UNPAID" ? itemPrice : 0;
    const osDeliveryCollectable =
      deliveryPaymentStatus === "UNPAID" ? osDeliveryCharge : 0;
    const waybillDeliveryCollectable =
      deliveryPaymentStatus === "UNPAID" ? printedWaybillDeliveryCharge : 0;

    return {
      baseWeightKg: defaultBaseWeightKg,
      baseDeliveryFee: defaultBaseDeliveryFee,
      overweightKg,
      overweightPerKg: defaultOverweightPerKg,
      overweightSurcharge,
      osDeliveryCharge,
      merchantInputCharge,
      printedWaybillDeliveryCharge,
      osTotalCod: itemCollectable + osDeliveryCollectable,
      waybillTotalCod: itemCollectable + waybillDeliveryCollectable,
      receivable: itemCollectable + osDeliveryCollectable,
      pricingSource: "default_fallback",
    };
  }
}