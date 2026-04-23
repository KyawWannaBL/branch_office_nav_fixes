// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePickups, useMasterParties, useMasterLocations } from "../hooks/useApi";
import { CITY_OPTIONS, getTownshipsByCity, searchPartyProfiles, findPartyByBusinessName } from "../lib/masterData";
import { useT } from "@/hooks/useT";
import { readApiJson } from "@/lib/readApiJson";
import PriceControlSection, {
  type PricingBreakdown,
  type PriceUiState,
} from "@/components/features/delivery/PriceControl/PriceControlSection";

type SourceType = "MER" | "CUS" | "OS" | "DEO";
type PayStatus = "PAID" | "UNPAID";
export type CreateDeliveryMode = "pickup" | "delivery";

type PickupForm = {
  pickupDate: string;
  sourceType: SourceType;
  businessName: string;
  contactName: string;
  contactPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupTownship: string;
  totalWays: string;
  pickupId?: string;
  remarks?: string;
};

type DeliveryRow = {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverTownship: string;
  weightKg: string;
  codAmount: string;
  serviceType: string;
  itemPaymentStatus: PayStatus;
  deliveryPaymentStatus: PayStatus;
  merchantCharge: string;
  notes: string;
};

const serviceOptions = ["standard", "express", "same_day", "cod_express"];

const cardBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 14,
  padding: "12px 18px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  transition: "all .22s ease",
};

const initPickup = (): PickupForm => ({
  pickupDate: new Date().toISOString().slice(0, 10),
  sourceType: "MER",
  businessName: "",
  contactName: "",
  contactPhone: "",
  pickupAddress: "",
  pickupCity: "Yangon",
  pickupTownship: "",
  totalWays: "1",
  pickupId: "",
  remarks: "",
});

const initRow = (): DeliveryRow => ({
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  receiverCity: "Yangon",
  receiverTownship: "",
  weightKg: "3",
  codAmount: "0",
  serviceType: "standard",
  itemPaymentStatus: "UNPAID",
  deliveryPaymentStatus: "UNPAID",
  merchantCharge: "0",
  notes: "",
});

const initPriceUiState = (): PriceUiState => ({
  baseStatus: "system",
  overweightStatus: "system",
  britiumStatus: "system",
  merchantStatus: "system",
  finalStatus: "system",
});

const emptyPricing = (): PricingBreakdown => ({
  baseWeightKg: 3,
  baseDeliveryFee: 0,
  overweightKg: 0,
  overweightPerKg: 500,
  overweightSurcharge: 0,
  osDeliveryCharge: 0,
  merchantInputCharge: 0,
  printedWaybillDeliveryCharge: 0,
  osTotalCod: 0,
  waybillTotalCod: 0,
  receivable: 0,
  pricingSource: "pending",
});

const fmtDateToken = (d: string) => {
  const p = (d || "").split("-");
  return `${p[1] || "00"}${p[2] || "00"}`;
};

const abbr = (s: string, fallback = "GEN") => {
  const w = String(s || "")
    .replace(/[^A-Za-z0-9\\s]/g, " ")
    .trim()
    .split(/\\s+/)
    .filter(Boolean);

  if (!w.length) return fallback;
  if (w.length === 1) return w[0].slice(0, 3).toUpperCase().padEnd(3, "X");

  return w
    .slice(0, 3)
    .map((x) => x[0])
    .join("")
    .toUpperCase()
    .padEnd(3, "X");
};

const seqFromPickup = (x: any) => {
  const raw =
    String(x?.pickup_id || x?.pickup_way_id || x?.pickupId || "").match(/-(\\d{3,4})$/);
  return raw ? Number(raw[1]) : 0;
};

const money = (n: number) =>
  `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(n || 0)} MMK`;

function normalizeError(error: any, fallback: string) {
  const message = String(error?.message || fallback);
  if (/Unexpected token .* valid JSON/i.test(message)) {
    return "Server returned an invalid response";
  }
  return message;
}

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

export function CreateDeliveryForm({ mode = "delivery" }: { mode?: CreateDeliveryMode }) {
  const { t: tr } = useT();
  const [searchParams] = useSearchParams();
  const pickupIdFromQuery = searchParams.get("pickup_id") || "";
  const deliveryIdFromQuery = searchParams.get("delivery_id") || "";

  const [pickup, setPickup] = useState<PickupForm>(initPickup());
  const [rows, setRows] = useState<DeliveryRow[]>([initRow()]);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");
  const [existingPickupId, setExistingPickupId] = useState("");
  const [pickupStatus, setPickupStatus] = useState<"DRAFT" | "SAVED" | "SUBMITTED">("DRAFT");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [pricing, setPricing] = useState<PricingBreakdown>(emptyPricing());
  const [pricingLoading, setPricingLoading] = useState(false);
  const [priceUiStates, setPriceUiStates] = useState<PriceUiState[]>([initPriceUiState()]);

  const isPickupMode = mode === "pickup";
  const isDeliveryMode = mode === "delivery";

  const pickups = usePickups({ limit: "200" });
  const pickupList = Array.isArray(pickups.data) ? pickups.data : [];
  const current = rows[selected] ?? initRow();
  const currentPriceUi = priceUiStates[selected] || initPriceUiState();

  const senderPartyType =
    pickup.sourceType === "MER"
      ? "merchant"
      : pickup.sourceType === "CUS"
        ? "customer"
        : pickup.sourceType === "OS"
          ? "online_store"
          : "";

  const senderMasterQuery = useMasterParties({
    q: pickup.businessName,
    party_type: senderPartyType,
  });

  const receiverMasterQuery = useMasterParties({
    q: current.receiverName,
    party_type: "customer",
  });

  const senderMasterRows = Array.isArray(senderMasterQuery.data)
    ? senderMasterQuery.data
    : senderMasterQuery.data?.data || [];

  const receiverMasterRows = Array.isArray(receiverMasterQuery.data)
    ? receiverMasterQuery.data
    : receiverMasterQuery.data?.data || [];

  const pickupLocationsQuery = useMasterLocations({ city: pickup.pickupCity });
  const receiverLocationsQuery = useMasterLocations({ city: current.receiverCity });

  const pickupLocationRows = Array.isArray(pickupLocationsQuery.data)
    ? pickupLocationsQuery.data
    : pickupLocationsQuery.data?.data || [];

  const receiverLocationRows = Array.isArray(receiverLocationsQuery.data)
    ? receiverLocationsQuery.data
    : receiverLocationsQuery.data?.data || [];

  const pickupCityOptions = [
    ...new Set(
      [
        ...pickupLocationRows.map((x: any) => x.city),
        ...receiverLocationRows.map((x: any) => x.city),
        ...CITY_OPTIONS,
      ].filter(Boolean)
    ),
  ];

  const receiverCityOptions = [
    ...new Set(
      [
        ...pickupLocationRows.map((x: any) => x.city),
        ...receiverLocationRows.map((x: any) => x.city),
        ...CITY_OPTIONS,
      ].filter(Boolean)
    ),
  ];

  const pickupTownshipOptions = [
    ...new Set(
      [
        ...pickupLocationRows.map((x: any) => x.township),
        ...getTownshipsByCity(pickup.pickupCity || ""),
      ].filter(Boolean)
    ),
  ];

  const receiverTownshipOptions = [
    ...new Set(
      [
        ...receiverLocationRows.map((x: any) => x.township),
        ...getTownshipsByCity(current.receiverCity || ""),
      ].filter(Boolean)
    ),
  ];

  const senderMatches = useMemo(
    () =>
      senderMasterRows.length
        ? senderMasterRows.slice(0, 6)
        : searchPartyProfiles(
            pickup.businessName,
            pickup.sourceType === "MER"
              ? "merchant"
              : pickup.sourceType === "CUS"
                ? "customer"
                : undefined
          ).slice(0, 6),
    [senderMasterRows, pickup.businessName, pickup.sourceType]
  );

  const receiverMatches = useMemo(
    () =>
      receiverMasterRows.length
        ? receiverMasterRows.slice(0, 6)
        : searchPartyProfiles(current.receiverName, "customer").slice(0, 6),
    [receiverMasterRows, current.receiverName]
  );

  const pickupId = useMemo(() => {
    if (existingPickupId) return existingPickupId;
    const org = abbr(
      pickup.businessName || pickup.contactName || pickup.sourceType,
      pickup.sourceType
    );
    const token = fmtDateToken(pickup.pickupDate);

    const max = pickupList
      .filter((r: any) => {
        const value = String(r?.pickup_id || r?.pickup_way_id || r?.pickupId || "");
        return value.startsWith(`P${token}-${org}-`);
      })
      .reduce((m: number, r: any) => Math.max(m, seqFromPickup(r)), 0);

    return `P${token}-${org}-${String(max + 1).padStart(3, "0")}`;
  }, [pickup, pickupList, existingPickupId]);

  const deliveryIds = useMemo(
    () =>
      rows.map(
        (_, i) =>
          `D${fmtDateToken(pickup.pickupDate)}-${abbr(
            pickup.businessName || pickup.contactName || pickup.sourceType,
            pickup.sourceType
          )}-${String(i + 1).padStart(3, "0")}`
      ),
    [rows, pickup]
  );

  useEffect(() => {
    setPriceUiStates((prev) => {
      const next = [...prev];
      while (next.length < rows.length) next.push(initPriceUiState());
      next.length = rows.length;
      return next;
    });
  }, [rows.length]);

  useEffect(() => {
    if (!pickupIdFromQuery) {
      setExistingPickupId("");
      return;
    }

    let active = true;

    async function loadPickupFromQuery() {
      try {
        const res = await fetch(
          `/api/v1/pickups?pickup_id=${encodeURIComponent(pickupIdFromQuery)}`
        );
        const data = await readApiJson(res);
        if (!active) return;

        const serverPickup = data?.pickup || {};
        const serverRows = Array.isArray(data?.deliveries) ? data.deliveries : [];

        setExistingPickupId(serverPickup.pickup_id || pickupIdFromQuery);
        setPickupStatus(serverPickup.pickup_status || "SAVED");
        setLastSavedAt(serverPickup.updated_at || "");

        setPickup((prev) => ({
          ...prev,
          pickupDate: String(serverPickup.pickup_date || prev.pickupDate).slice(0, 10),
          sourceType: serverPickup.source_type || prev.sourceType,
          businessName: serverPickup.merchant_name || prev.businessName,
          contactName: serverPickup.contact_name || prev.contactName,
          contactPhone: serverPickup.contact_phone || prev.contactPhone,
          pickupAddress: serverPickup.pickup_address || prev.pickupAddress,
          pickupCity: serverPickup.pickup_city || prev.pickupCity,
          pickupTownship: serverPickup.pickup_township || prev.pickupTownship,
          totalWays: String(
            serverRows.length ||
            serverPickup.actual_way_count ||
            serverPickup.expected_way_count ||
            prev.totalWays ||
            1
          ),
          pickupId: serverPickup.pickup_id || pickupIdFromQuery,
          remarks: serverPickup.remarks || prev.remarks,
        }));

        const mappedRows = serverRows.length
          ? serverRows.map((row: any) => ({
              ...initRow(),
              receiverName: row.receiver_name || "",
              receiverPhone: row.receiver_phone || "",
              receiverAddress: row.receiver_address || row.delivery_address || "",
              receiverCity: row.receiver_city || "",
              receiverTownship: row.receiver_township || row.township || "",
              weightKg: String(row.weight_kg ?? 0),
              codAmount: String(row.item_price ?? 0),
              serviceType: row.service_type || "standard",
              itemPaymentStatus: row.item_payment_status === "PAID" ? "PAID" : "UNPAID",
              deliveryPaymentStatus: row.delivery_payment_status === "PAID" ? "PAID" : "UNPAID",
              merchantCharge: String(row.merchant_customer_delivery_charge ?? 0),
              notes: row.remarks || "",
            }))
          : [initRow()];

        setRows(mappedRows);
        setPriceUiStates(mappedRows.map(() => initPriceUiState()));

        const targetIndex = deliveryIdFromQuery
          ? serverRows.findIndex((row: any) => String(row.delivery_id || "") === deliveryIdFromQuery)
          : -1;

        setSelected(targetIndex >= 0 ? targetIndex : 0);
        setMessage(`Loaded ${serverPickup.pickup_id || pickupIdFromQuery}`);
      } catch (error: any) {
        if (!active) return;
        setMessage(normalizeError(error, "Failed to load pickup from overview"));
      }
    }

    void loadPickupFromQuery();

    return () => {
      active = false;
    };
  }, [pickupIdFromQuery, deliveryIdFromQuery]);

  useEffect(() => {
    if (!isDeliveryMode) return;

    let active = true;
    const timeout = setTimeout(async () => {
      try {
        setPricingLoading(true);
        const res = await fetch("/api/v1/deliveries/recalc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            township: current.receiverTownship || "",
            serviceType: current.serviceType || "standard",
            weightKg: Number(current.weightKg || 0),
            itemPrice: Number(current.codAmount || 0),
            itemPaymentStatus: current.itemPaymentStatus,
            merchantCustomerDeliveryCharge: Number(current.merchantCharge || 0),
            deliveryPaymentStatus: current.deliveryPaymentStatus,
          }),
        });

        const data = await readApiJson(res);
        if (!active) return;
        setPricing(data?.data || emptyPricing());
      } catch {
        if (!active) return;
        setPricing({
          ...emptyPricing(),
          merchantInputCharge: Number(current.merchantCharge || 0),
        });
      } finally {
        if (active) setPricingLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [
    isDeliveryMode,
    current.receiverTownship,
    current.serviceType,
    current.weightKg,
    current.codAmount,
    current.itemPaymentStatus,
    current.merchantCharge,
    current.deliveryPaymentStatus,
  ]);

  const setPickupField = (key: keyof PickupForm, value: string) => {
    setPickup((p) => ({ ...p, [key]: value }));

    if (key === "totalWays") {
      const count = Math.max(1, Number(value || 1));
      setRows((prev) => {
        const next = [...prev];
        while (next.length < count) next.push(initRow());
        next.length = count;
        return next;
      });
      setSelected((prev) => Math.min(prev, count - 1));
    }
  };

  const setRow = (patch: Partial<DeliveryRow>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === selected ? { ...r, ...patch } : r))
    );
  };

  const setPriceUiState = (key: keyof PriceUiState, value: PriceUiState[keyof PriceUiState]) => {
    setPriceUiStates((prev) =>
      prev.map((state, i) => (i === selected ? { ...state, [key]: value } : state))
    );
  };

  const fillSender = (name: string) => {
    const found = senderMasterRows.find(
      (row: any) =>
        String(row.business_name || "").trim().toLowerCase() ===
        String(name || "").trim().toLowerCase()
    );

    if (found) {
      setPickup((p) => ({
        ...p,
        businessName: found.business_name,
        contactName: found.contact_name || "",
        contactPhone: found.phone || "",
        pickupAddress: found.address || "",
        pickupCity: found.city || "Yangon",
        pickupTownship: found.township || "",
      }));
      return;
    }

    const fallback = findPartyByBusinessName(name);
    if (!fallback) return;

    setPickup((p) => ({
      ...p,
      businessName: fallback.businessName,
      contactName: fallback.contactName || "",
      contactPhone: fallback.phone || "",
      pickupAddress: fallback.address || "",
      pickupCity: fallback.city || "Yangon",
      pickupTownship: fallback.township || "",
    }));
  };

  const fillReceiver = (name: string) => {
    const found = receiverMasterRows.find(
      (row: any) =>
        String(row.business_name || "").trim().toLowerCase() ===
        String(name || "").trim().toLowerCase()
    );

    if (found) {
      setRow({
        receiverName: found.business_name,
        receiverPhone: found.phone || "",
        receiverAddress: found.address || "",
        receiverCity: found.city || "Yangon",
        receiverTownship: found.township || "",
      });
      return;
    }

    const fallback = findPartyByBusinessName(name);
    if (!fallback) return;

    setRow({
      receiverName: fallback.businessName,
      receiverPhone: fallback.phone || "",
      receiverAddress: fallback.address || "",
      receiverCity: fallback.city || "Yangon",
      receiverTownship: fallback.township || "",
    });
  };

  async function persistPickup(action: "save_draft" | "save_pickup" | "submit_pickup") {
    setMessage("");

    try {
      const res = await fetch("/api/v1/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          pickup: {
            pickupId: pickup.pickupId || "",
            pickupDate: pickup.pickupDate,
            sourceType: pickup.sourceType,
            merchantName: pickup.businessName,
            merchantCode: "",
            contactName: pickup.contactName,
            contactPhone: pickup.contactPhone,
            pickupAddress: pickup.pickupAddress,
            pickupCity: pickup.pickupCity,
            pickupTownship: pickup.pickupTownship,
            totalWays: pickup.totalWays,
            remarks: pickup.remarks || "",
          },
          deliveries: rows.map((row, index) => ({
            lineNo: index + 1,
            deliveryId: deliveryIds[index] || "",
            receiverName: row.receiverName,
            receiverPhone: row.receiverPhone,
            receiverAddress: row.receiverAddress,
            receiverCity: row.receiverCity,
            receiverTownship: row.receiverTownship,
            deliveryAddress: row.receiverAddress,
            township: row.receiverTownship,
            weightKg: row.weightKg,
            codAmount: row.codAmount,
            itemPrice: row.codAmount,
            serviceType: row.serviceType,
            itemPaymentStatus: row.itemPaymentStatus,
            deliveryPaymentStatus: row.deliveryPaymentStatus,
            merchantCharge: row.merchantCharge,
            merchantCustomerDeliveryCharge: row.merchantCharge,
            notes: row.notes,
          })),
        }),
      });

      const data = await readApiJson(res);

      setExistingPickupId(data.pickup.pickup_id);
      setPickup((prev) => ({
        ...prev,
        pickupId: data.pickup.pickup_id,
        totalWays: String(data.pickup.actual_way_count || rows.length),
      }));

      setPickupStatus(data.pickup.pickup_status || "SAVED");
      setLastSavedAt(data.pickup.updated_at || "");

      const serverRows = Array.isArray(data.deliveries) ? data.deliveries : [];
      const mappedRows = serverRows.length
        ? serverRows.map((row: any) => ({
            ...initRow(),
            receiverName: row.receiver_name || "",
            receiverPhone: row.receiver_phone || "",
            receiverAddress: row.receiver_address || row.delivery_address || "",
            receiverCity: row.receiver_city || "",
            receiverTownship: row.receiver_township || row.township || "",
            weightKg: String(row.weight_kg ?? 0),
            codAmount: String(row.item_price ?? 0),
            serviceType: row.service_type || "standard",
            itemPaymentStatus: row.item_payment_status === "PAID" ? "PAID" : "UNPAID",
            deliveryPaymentStatus: row.delivery_payment_status === "PAID" ? "PAID" : "UNPAID",
            merchantCharge: String(row.merchant_customer_delivery_charge ?? 0),
            notes: row.remarks || "",
          }))
        : [initRow()];

      setRows(mappedRows);
      setPriceUiStates(mappedRows.map(() => initPriceUiState()));

      setMessage(
        action === "save_draft"
          ? `Draft saved: ${data.pickup.pickup_id}`
          : action === "submit_pickup"
            ? `Pickup submitted: ${data.pickup.pickup_id}`
            : isDeliveryMode
              ? `Delivery saved: ${data.pickup.pickup_id}`
              : `Pickup saved: ${data.pickup.pickup_id}`
      );
    } catch (error: any) {
      setMessage(normalizeError(error, "Failed to persist pickup"));
    }
  }

  return (
    <div className="cd-page">
      <style>{css}</style>

      <section className="cd-hero">
        <div className="cd-hero-left">
          <div className="cd-chip">Enterprise Delivery Workspace</div>
          <h1>{isPickupMode ? "Pickup Registration" : "Delivery Registration"}</h1>
          <p>
            {isPickupMode
              ? "Register pickup batch information separately before entering shipment deliveries."
              : "Register delivery rows separately while still using the linked pickup batch context."}
          </p>
        </div>

        <div className="cd-hero-right">
          <div className="cd-stat-label">Pickup ID</div>
          <div className="cd-stat-value">{pickupId}</div>
          <div className="cd-stat-sub">Auto-preview based on date and sender profile</div>
          <div className="cd-statusbar">
            <div><strong>Status:</strong> {pickupStatus}</div>
            <div><strong>Last saved:</strong> {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "-"}</div>
          </div>
        </div>
      </section>

      {message ? <div className="cd-alert">{message}</div> : null}

      {isPickupMode ? (
        <section className="cd-card">
          <div className="cd-card-head">
            <div>
              <div className="cd-title">Pickup Registration</div>
              <div className="cd-subtitle">
                Fill sender information first and reserve the pickup batch before delivery data entry.
              </div>
            </div>
          </div>

          <div className="cd-grid">
            <Field label="Pickup Date">
              <input type="date" value={pickup.pickupDate} onChange={(e) => setPickupField("pickupDate", e.target.value)} />
            </Field>

            <Field label="Source Type">
              <select value={pickup.sourceType} onChange={(e) => setPickupField("sourceType", e.target.value)}>
                <option value="MER">Merchant</option>
                <option value="CUS">Customer</option>
                <option value="OS">Online Store</option>
                <option value="DEO">Data Entry</option>
              </select>
            </Field>

            <Field label="Business / Sender Name">
              <input
                list="sender-master"
                value={pickup.businessName}
                onChange={(e) => {
                  setPickupField("businessName", e.target.value);
                  fillSender(e.target.value);
                }}
                placeholder="Type business or sender name"
              />
            </Field>

            <Field label="Contact Name">
              <input value={pickup.contactName} onChange={(e) => setPickupField("contactName", e.target.value)} />
            </Field>

            <Field label="Phone Number">
              <input value={pickup.contactPhone} onChange={(e) => setPickupField("contactPhone", e.target.value)} />
            </Field>

            <Field label="Pickup City">
              <select value={pickup.pickupCity} onChange={(e) => setPickupField("pickupCity", e.target.value)}>
                {pickupCityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </Field>

            <Field label="Pickup Township">
              <select value={pickup.pickupTownship} onChange={(e) => setPickupField("pickupTownship", e.target.value)}>
                <option value="">Select township</option>
                {pickupTownshipOptions.map((township: string) => (
                  <option key={township} value={township}>{township}</option>
                ))}
              </select>
            </Field>

            <Field label="Total Way Count">
              <input type="number" min={1} value={pickup.totalWays} onChange={(e) => setPickupField("totalWays", e.target.value)} />
            </Field>

            <Field label="Pickup Address" wide>
              <textarea value={pickup.pickupAddress} onChange={(e) => setPickupField("pickupAddress", e.target.value)} rows={4} />
            </Field>

            <Field label="Remarks" wide>
              <textarea value={pickup.remarks || ""} onChange={(e) => setPickupField("remarks", e.target.value)} rows={3} />
            </Field>
          </div>

          <div className="cd-suggest">
            <div className="cd-suggest-title">Suggested registered sender profiles</div>
            <div className="cd-tag-wrap">
              {senderMatches.length ? (
                senderMatches.map((match: any) => (
                  <button key={match.id} className="cd-tag" type="button" onClick={() => fillSender(match.business_name)}>
                    {match.business_name} · {match.township}
                  </button>
                ))
              ) : (
                <span className="cd-muted">Start typing to see sender suggestions.</span>
              )}
            </div>
          </div>

          <div className="cd-actions">
            <button style={{ ...cardBtn, background: "#fff", color: "#334155", border: "1px solid #cbd5e1" }} type="button" onClick={() => persistPickup("save_draft")}>
              Save Draft
            </button>
            <button style={{ ...cardBtn, background: "#0f766e", color: "#fff" }} type="button" onClick={() => persistPickup("save_pickup")}>
              Save Pickup
            </button>
            <button style={{ ...cardBtn, background: "#0f2f5c", color: "#fff" }} type="button" onClick={() => persistPickup("submit_pickup")}>
              Submit Pickup
            </button>
          </div>

          <datalist id="sender-master">
            {senderMasterRows.map((row: any) => (
              <option key={row.id} value={row.business_name} />
            ))}
          </datalist>
        </section>
      ) : (
        <section className="cd-card">
          <div className="cd-card-head">
            <div>
              <div className="cd-title">Delivery Registration</div>
              <div className="cd-subtitle">
                Enter delivery rows in a separate screen with tariff-driven live pricing.
              </div>
            </div>
            <div className="cd-idbox">
              <span>Delivery ID</span>
              <strong>{deliveryIds[selected] || "-"}</strong>
            </div>
          </div>

          <div className="cd-summary">
            <div><strong>Pickup:</strong> {pickupId || "-"}</div>
            <div><strong>Sender:</strong> {pickup.businessName || "-"}</div>
            <div><strong>Ways:</strong> {rows.length}</div>
          </div>

          <div className="cd-compact">
            <Field label="Pickup Date">
              <input type="date" value={pickup.pickupDate} onChange={(e) => setPickupField("pickupDate", e.target.value)} />
            </Field>
            <Field label="Sender / Merchant">
              <input value={pickup.businessName} onChange={(e) => setPickupField("businessName", e.target.value)} />
            </Field>
            <Field label="Contact Phone">
              <input value={pickup.contactPhone} onChange={(e) => setPickupField("contactPhone", e.target.value)} />
            </Field>
            <Field label="Pickup City">
              <select value={pickup.pickupCity} onChange={(e) => setPickupField("pickupCity", e.target.value)}>
                {pickupCityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </Field>
            <Field label="Pickup Township">
              <select value={pickup.pickupTownship} onChange={(e) => setPickupField("pickupTownship", e.target.value)}>
                <option value="">Select township</option>
                {pickupTownshipOptions.map((township: string) => (
                  <option key={township} value={township}>{township}</option>
                ))}
              </select>
            </Field>
            <Field label="Total Way Count">
              <input type="number" min={1} value={pickup.totalWays} onChange={(e) => setPickupField("totalWays", e.target.value)} />
            </Field>
            <Field label="Pickup Address" wide>
              <textarea value={pickup.pickupAddress} onChange={(e) => setPickupField("pickupAddress", e.target.value)} rows={3} />
            </Field>
          </div>

          <div className="cd-rownav">
            <button className="cd-mini" type="button" onClick={() => setSelected((prev) => Math.max(0, prev - 1))}>Previous</button>
            <div className="cd-rowcount">{selected + 1} / {rows.length}</div>
            <button className="cd-mini" type="button" onClick={() => setSelected((prev) => Math.min(rows.length - 1, prev + 1))}>Next</button>
          </div>

          <div className="cd-grid">
            <Field label="Receiver Name">
              <input
                list="receiver-master"
                value={current.receiverName}
                onChange={(e) => {
                  setRow({ receiverName: e.target.value });
                  fillReceiver(e.target.value);
                }}
                placeholder="Type receiver name"
              />
            </Field>

            <Field label="Receiver Phone">
              <input value={current.receiverPhone} onChange={(e) => setRow({ receiverPhone: e.target.value })} />
            </Field>

            <Field label="Receiver City">
              <select
                value={current.receiverCity}
                onChange={(e) => setRow({ receiverCity: e.target.value, receiverTownship: "" })}
              >
                {receiverCityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </Field>

            <Field label="Receiver Township">
              <select value={current.receiverTownship} onChange={(e) => setRow({ receiverTownship: e.target.value })}>
                <option value="">Select township</option>
                {receiverTownshipOptions.map((township: string) => (
                  <option key={township} value={township}>{township}</option>
                ))}
              </select>
            </Field>

            <Field label="Weight (Kg)">
              <input type="number" min={0} value={current.weightKg} onChange={(e) => setRow({ weightKg: e.target.value })} />
            </Field>

            <Field label="Service Type">
              <select value={current.serviceType} onChange={(e) => setRow({ serviceType: e.target.value })}>
                {serviceOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <Field label="Item Price">
              <input type="number" min={0} value={current.codAmount} onChange={(e) => setRow({ codAmount: e.target.value })} />
            </Field>

            <Field label="Merchant Collected Rate">
              <input type="number" min={0} value={current.merchantCharge} onChange={(e) => setRow({ merchantCharge: e.target.value })} />
            </Field>

            <Field label="Item Payment">
              <select value={current.itemPaymentStatus} onChange={(e) => setRow({ itemPaymentStatus: e.target.value as PayStatus })}>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </Field>

            <Field label="Delivery Payment">
              <select value={current.deliveryPaymentStatus} onChange={(e) => setRow({ deliveryPaymentStatus: e.target.value as PayStatus })}>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </Field>

            <Field label="Receiver Address" wide>
              <textarea value={current.receiverAddress} onChange={(e) => setRow({ receiverAddress: e.target.value })} rows={4} />
            </Field>

            <Field label="Notes" wide>
              <textarea value={current.notes} onChange={(e) => setRow({ notes: e.target.value })} rows={3} />
            </Field>
          </div>

          <div className="cd-suggest">
            <div className="cd-suggest-title">Suggested registered receiver profiles</div>
            <div className="cd-tag-wrap">
              {receiverMatches.length ? (
                receiverMatches.map((match: any) => (
                  <button key={match.id} className="cd-tag" type="button" onClick={() => fillReceiver(match.business_name)}>
                    {match.business_name} · {match.phone}
                  </button>
                ))
              ) : (
                <span className="cd-muted">Start typing to see receiver suggestions.</span>
              )}
            </div>
          </div>

          <div className="mt-6">
            <PriceControlSection
              breakdown={pricing}
              merchantRate={Number(current.merchantCharge || 0)}
              onMerchantRateChange={(next) => setRow({ merchantCharge: String(next) })}
              statusState={currentPriceUi}
              onStatusChange={setPriceUiState}
              loading={pricingLoading}
            />
          </div>

          <div className="cd-actions">
            <button style={{ ...cardBtn, background: "#fff", color: "#334155", border: "1px solid #cbd5e1" }} type="button" onClick={() => persistPickup("save_draft")}>
              Save Delivery Draft
            </button>
            <button style={{ ...cardBtn, background: "#0f766e", color: "#fff" }} type="button" onClick={() => persistPickup("save_pickup")}>
              Save Delivery
            </button>
            <button style={{ ...cardBtn, background: "#0f2f5c", color: "#fff" }} type="button" onClick={() => persistPickup("submit_pickup")}>
              Submit Delivery
            </button>
          </div>

          <datalist id="receiver-master">
            {receiverMasterRows.map((row: any) => (
              <option key={row.id} value={row.business_name} />
            ))}
          </datalist>
        </section>
      )}
    </div>
  );
}

export default function CreateDelivery() {
  return <CreateDeliveryForm mode="delivery" />;
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "cd-field wide" : "cd-field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

const css = `
.cd-page{display:flex;flex-direction:column;gap:18px}
.cd-hero{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:18px;border:1px solid #dbe4ee;border-radius:26px;background:linear-gradient(135deg,#ffffff 0%,#f8fbff 100%);box-shadow:0 10px 24px rgba(15,23,42,.04);padding:24px;animation:fadeUp .35s ease}
.cd-chip{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em}
.cd-hero h1{margin:14px 0 0;font-size:32px;line-height:1.1;font-weight:900;color:#0f172a}
.cd-hero p{margin:10px 0 0;color:#64748b;font-size:14px;line-height:1.7}
.cd-hero-right{border:1px solid #dbe4ee;border-radius:20px;background:#f8fafc;padding:18px;align-self:start}
.cd-stat-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#64748b}
.cd-stat-value{margin-top:10px;font-size:28px;font-weight:900;color:#0f172a;word-break:break-word}
.cd-stat-sub{margin-top:8px;color:#64748b;font-size:12px}
.cd-alert{border:1px solid #a5f3fc;background:#ecfeff;color:#0f766e;padding:12px 14px;border-radius:16px;font-size:13px;font-weight:700;animation:fadeUp .25s ease}
.cd-card{border:1px solid #dbe4ee;border-radius:24px;background:#fff;box-shadow:0 10px 24px rgba(15,23,42,.04);padding:20px;transition:transform .25s ease, box-shadow .25s ease;animation:fadeUp .35s ease}
.cd-card:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(15,23,42,.07)}
.cd-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}
.cd-title{font-size:22px;font-weight:900;color:#0f172a}
.cd-subtitle{margin-top:4px;font-size:13px;color:#64748b}
.cd-idbox{border:1px solid #dbe4ee;border-radius:16px;background:#f8fafc;padding:12px 14px;min-width:170px}
.cd-idbox span{display:block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#64748b}
.cd-idbox strong{display:block;margin-top:6px;font-size:18px;color:#0f172a}
.cd-summary{display:flex;flex-wrap:wrap;gap:18px;margin-bottom:14px;font-size:13px;color:#475569;font-weight:700}
.cd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.cd-compact{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:16px}
.cd-field{display:flex;flex-direction:column;gap:6px}
.cd-field.wide{grid-column:1 / -1}
.cd-field span{font-size:12px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.04em}
.cd-field input,.cd-field select,.cd-field textarea{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:12px 14px;font-size:14px;font-family:inherit;background:#fff;outline:none;transition:border-color .2s ease, box-shadow .2s ease, transform .2s ease}
.cd-field input:focus,.cd-field select:focus,.cd-field textarea:focus{border-color:#60a5fa;box-shadow:0 0 0 4px rgba(96,165,250,.12)}
.cd-suggest{margin-top:16px;border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;padding:14px}
.cd-suggest-title{font-size:12px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.04em}
.cd-tag-wrap{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.cd-tag{border:1px solid #cbd5e1;border-radius:999px;background:#fff;padding:8px 12px;cursor:pointer;font-size:12px;font-weight:700;color:#334155;transition:all .2s ease}
.cd-tag:hover{background:#eff6ff;border-color:#93c5fd;color:#1d4ed8}
.cd-muted{color:#64748b;font-size:13px}
.cd-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.cd-statusbar{display:flex;flex-wrap:wrap;gap:16px;margin-top:12px;font-size:13px;color:#475569;font-weight:700}
.cd-rownav{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin:16px 0 14px}
.cd-rowcount{font-size:13px;font-weight:800;color:#334155}
.cd-mini{border:1px solid #dbe4ee;background:#fff;border-radius:12px;padding:9px 12px;cursor:pointer;font-size:12px;font-weight:700;color:#334155}
.cd-mini:hover{background:#f8fafc}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media (max-width: 1180px){.cd-hero{grid-template-columns:1fr}.cd-compact{grid-template-columns:1fr 1fr}}
@media (max-width: 760px){.cd-grid,.cd-compact{grid-template-columns:1fr}.cd-actions{flex-direction:column}}
`;
