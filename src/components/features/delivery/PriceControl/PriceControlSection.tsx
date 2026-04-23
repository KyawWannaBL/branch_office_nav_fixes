import React from "react";
import PriceBox, { type PriceBoxStatus } from "./PriceBox";

export type PricingBreakdown = {
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

export type PriceUiState = {
  baseStatus: PriceBoxStatus;
  overweightStatus: PriceBoxStatus;
  britiumStatus: PriceBoxStatus;
  merchantStatus: PriceBoxStatus;
  finalStatus: PriceBoxStatus;
};

type Props = {
  breakdown: PricingBreakdown;
  merchantRate: number;
  onMerchantRateChange: (next: number) => void;
  statusState: PriceUiState;
  onStatusChange: (key: keyof PriceUiState, next: PriceBoxStatus) => void;
  loading?: boolean;
};

function money(value: number) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "0";
}

export function PriceControlSection({
  breakdown,
  merchantRate,
  onMerchantRateChange,
  statusState,
  onStatusChange,
  loading = false,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Enterprise Price Control
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-700">
            Tariff Master + overweight + max comparison
          </div>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {loading ? "Recalculating..." : `Source: ${breakdown.pricingSource}`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <PriceBox
          label="Base Rate"
          value={breakdown.baseDeliveryFee}
          subtext={`Tariff Master base up to ${breakdown.baseWeightKg} kg`}
          status={statusState.baseStatus}
          onStatusChange={(next) => onStatusChange("baseStatus", next)}
        />

        <PriceBox
          label="Overweight Charge"
          value={breakdown.overweightSurcharge}
          subtext={`${breakdown.overweightKg.toFixed(2)} kg extra x ${money(breakdown.overweightPerKg)}`}
          status={statusState.overweightStatus}
          onStatusChange={(next) => onStatusChange("overweightStatus", next)}
        />

        <PriceBox
          label="Britium Total"
          value={breakdown.osDeliveryCharge}
          subtext="Base + overweight"
          variant="highlight"
          status={statusState.britiumStatus}
          onStatusChange={(next) => onStatusChange("britiumStatus", next)}
        />

        <PriceBox
          label="Merchant Collected Rate"
          value={merchantRate}
          subtext="Manual merchant input"
          editable
          status={statusState.merchantStatus}
          onStatusChange={(next) => onStatusChange("merchantStatus", next)}
          onCommit={onMerchantRateChange}
        />
      </div>

      <PriceBox
        label="Waybill Print Charge"
        value={breakdown.printedWaybillDeliveryCharge}
        subtext="Final MAX(Britium Total, Merchant Collected Rate)"
        variant="final"
        status={statusState.finalStatus}
        onStatusChange={(next) => onStatusChange("finalStatus", next)}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
            OS Total COD
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {money(breakdown.osTotalCod)} MMK
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
            Waybill Total COD
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {money(breakdown.waybillTotalCod)} MMK
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
            Receivable
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {money(breakdown.receivable)} MMK
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceControlSection;
