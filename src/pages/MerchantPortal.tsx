import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Map,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
} from "lucide-react";
import { readApiJson } from "@/lib/readApiJson";
import { useT } from "@/hooks/useT";
import { statusText } from "@/lib/statusText";

type AnyRow = Record<string, any>;

const card: React.CSSProperties = {
  border: "1px solid #dbe4ee",
  borderRadius: 22,
  background: "#fff",
  padding: 18,
  boxShadow: "0 10px 24px rgba(15,23,42,.04)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 14,
  fontFamily: "inherit",
};

const primaryBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#0f766e",
  color: "#fff",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#0f2f5c",
  color: "#fff",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

function safe(v: any, fb = "-") {
  return v === null || v === undefined || v === "" ? fb : String(v);
}

function money(v: any) {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );
}

function normalizeError(error: any, fallback: string) {
  const message = String(error?.message || fallback);
  if (/Unexpected token .* valid JSON/i.test(message)) {
    return "Server returned an invalid response";
  }
  return message;
}

async function safeGet(url: string) {
  const res = await fetch(url);
  return readApiJson(res);
}

function KpiCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "good" | "warn" | "info";
}) {
  const bg =
    tone === "good"
      ? "linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 100%)"
      : tone === "warn"
        ? "linear-gradient(135deg,#fff7ed 0%,#fef3c7 100%)"
        : tone === "info"
          ? "linear-gradient(135deg,#eff6ff 0%,#eef2ff 100%)"
          : "#fff";

  return (
    <div style={{ ...card, background: bg, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>
          {label}
        </div>
        <div style={{ color: "#0f172a" }}>{icon}</div>
      </div>
      <div style={{ marginTop: 12, fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{title}</div>
        {action}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </section>
  );
}

function RowCard({
  title,
  line1,
  line2,
  badge,
  onClick,
  active = false,
}: {
  title: string;
  line1: string;
  line2?: string;
  badge?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const body = (
    <div
      style={{
        border: active ? "1px solid #93c5fd" : "1px solid #dbe4ee",
        borderRadius: 16,
        padding: 14,
        background: active ? "#eff6ff" : "#f8fafc",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <strong style={{ color: "#0f172a" }}>{title}</strong>
        {badge ? (
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#475569" }}>
            {badge}
          </span>
        ) : null}
      </div>
      <div style={{ marginTop: 6, color: "#334155", fontSize: 13 }}>{line1}</div>
      {line2 ? <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>{line2}</div> : null}
    </div>
  );

  if (!onClick) return body;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      {body}
    </button>
  );
}

function ActionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        border: "1px solid #dbe4ee",
        borderRadius: 14,
        padding: 12,
        color: "#0f172a",
        fontWeight: 700,
        background: "#fff",
      }}
    >
      {label}
    </Link>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #dbe4ee",
        borderRadius: 16,
        padding: 12,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 16, fontWeight: 900, color: "#0f172a", wordBreak: "break-word" }}>
        {value}
      </div>
    </div>
  );
}

export default function MerchantPortal() {
  const { lang, t: tr } = useT();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [pickupRows, setPickupRows] = useState<AnyRow[]>([]);
  const [deliveryRows, setDeliveryRows] = useState<AnyRow[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  async function loadPortal(searchValue = query) {
    setLoading(true);
    setMessage("");

    const pickupQs = new URLSearchParams();
    pickupQs.set("limit", "300");
    if (searchValue.trim()) pickupQs.set("q", searchValue.trim());

    const deliveryQs = new URLSearchParams();
    if (searchValue.trim()) deliveryQs.set("q", searchValue.trim());

    const results = await Promise.allSettled([
      safeGet(`/api/v1/pickups?${pickupQs.toString()}`),
      safeGet(`/api/v1/deliveries/workflow?${deliveryQs.toString()}`),
    ]);

    const pickups = results[0].status === "fulfilled" ? results[0].value : null;
    const deliveries = results[1].status === "fulfilled" ? results[1].value : null;

    if (results.every((r) => r.status === "rejected")) {
      const first = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      setMessage(normalizeError(first?.reason, "Failed to load merchant portal"));
    } else {
      const rejectedCount = results.filter((r) => r.status === "rejected").length;
      if (rejectedCount > 0) {
        setMessage("Some merchant widgets could not be loaded, but the portal is available.");
      }
    }

    const pickupList = Array.isArray(pickups?.data)
      ? pickups.data
      : Array.isArray((pickups as any)?.pickups)
        ? (pickups as any).pickups
        : [];
    const deliveryList = Array.isArray(deliveries?.data) ? deliveries.data : [];

    setPickupRows(pickupList);
    setDeliveryRows(deliveryList);

    const accounts = buildMerchantAccounts(pickupList, deliveryList);
    setSelectedAccount((prev: any) => {
      if (!accounts.length) return null;
      if (!prev) return accounts[0];
      return accounts.find((x: any) => x.name === prev.name) || accounts[0];
    });

    setLoading(false);
  }

  useEffect(() => {
    void loadPortal("");
  }, []);

  const merchantAccounts = useMemo(
    () => buildMerchantAccounts(pickupRows, deliveryRows),
    [pickupRows, deliveryRows]
  );

  const serviceMix = useMemo(() => {
    const counts = new Map<string, number>();

    for (const row of deliveryRows) {
      const service = String(row.service_type || "standard").trim() || "standard";
      counts.set(service, (counts.get(service) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([service, total]) => ({ service, total }));
  }, [deliveryRows]);

  const recentPickups = useMemo(() => {
    return [...pickupRows]
      .sort((a: AnyRow, b: AnyRow) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))
      .slice(0, 8);
  }, [pickupRows]);

  const stats = useMemo(() => {
    const totalPickups = pickupRows.length;
    const totalWays = deliveryRows.length;
    const delivered = deliveryRows.filter((x) => String(x.delivery_status || x.status || "").toUpperCase() === "DELIVERED").length;
    const inPipeline = deliveryRows.filter((x) => {
      const s = String(x.delivery_status || x.status || "").toUpperCase();
      return ["SUBMITTED", "SAVED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED_ATTEMPT"].includes(s);
    }).length;

    const codExposure = deliveryRows.reduce((sum, x) => sum + Number(x.waybill_total_cod || x.receivable || 0), 0);
    const activeAccounts = merchantAccounts.length;

    const townshipSet = new Set(
      deliveryRows
        .map((x) => String(x.receiver_township || x.township || "").trim())
        .filter(Boolean)
    );

    return {
      activeAccounts,
      totalPickups,
      totalWays,
      delivered,
      inPipeline,
      codExposure,
      activeTownships: townshipSet.size,
    };
  }, [pickupRows, deliveryRows, merchantAccounts]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section
        style={{
          ...card,
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: 999,
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".12em",
            }}
          >
            {tr("Merchant")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Merchant Portal")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Track merchant shipment activity, pickup performance, delivery pipeline, and COD exposure from one account workspace.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPortal()}
          style={{
            ...secondaryBtn,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <RefreshCw size={16} />
          {tr("Refresh")}
        </button>
      </section>

      {message ? (
        <div
          style={{
            border: "1px solid #a5f3fc",
            background: "#ecfeff",
            color: "#0f766e",
            padding: "12px 14px",
            borderRadius: 16,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {message}
        </div>
      ) : null}

      <section
        style={{
          ...card,
          display: "grid",
          gridTemplateColumns: "minmax(320px,1fr) auto auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginBottom: 6 }}>
            {tr("Merchant Search")}
          </div>
          <input
            style={inputStyle}
            placeholder={tr("Search merchant, pickup ID, delivery ID, township, or phone")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => void loadPortal(query)}
          style={{
            ...primaryBtn,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Search size={16} />
          {tr("Search")}
        </button>

        <button
          type="button"
          onClick={() => {
            setQuery("");
            void loadPortal("");
          }}
          style={secondaryBtn}
        >
          {tr("Clear")}
        </button>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <KpiCard icon={<Store size={18} />} label={tr("Active Merchant Accounts")} value={String(stats.activeAccounts)} tone="info" />
        <KpiCard icon={<ClipboardList size={18} />} label={tr("Pickup Batches")} value={String(stats.totalPickups)} />
        <KpiCard icon={<Package size={18} />} label={tr("Total Shipment Ways")} value={String(stats.totalWays)} tone="good" />
        <KpiCard icon={<Truck size={18} />} label={tr("Open Pipeline")} value={String(stats.inPipeline)} tone="warn" />
        <KpiCard icon={<TrendingUp size={18} />} label={tr("Delivered Ways")} value={String(stats.delivered)} tone="good" />
        <KpiCard icon={<ShoppingBag size={18} />} label={tr("COD Exposure")} value={`${money(stats.codExposure)} MMK`} tone="warn" />
        <KpiCard icon={<Map size={18} />} label={tr("Active Townships")} value={String(stats.activeTownships)} tone="info" />
        <KpiCard icon={<Package size={18} />} label={tr("Service Mix Categories")} value={String(serviceMix.length)} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 18 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel
            title={tr("Merchant Accounts")}
            action={
              <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                {merchantAccounts.length} account(s)
              </span>
            }
          >
            {merchantAccounts.length ? (
              merchantAccounts.slice(0, 12).map((row: any) => (
                <RowCard
                  key={row.name}
                  active={selectedAccount?.name === row.name}
                  onClick={() => setSelectedAccount(row)}
                  title={safe(row.name)}
                  badge={`${row.pickups} pickup(s)`}
                  line1={`${tr("Ways")}: ${row.ways} · ${tr("Delivered")}: ${row.delivered}`}
                  line2={`${tr("Pipeline")}: ${row.pipeline} · ${tr("COD")}: ${money(row.codExposure)} MMK`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading merchant portal...") : tr("No merchant records found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Recent Pickup Activity")}>
            {recentPickups.length ? (
              recentPickups.map((row: AnyRow) => (
                <RowCard
                  key={safe(row.pickup_id)}
                  title={safe(row.pickup_id)}
                  badge={statusText(lang, row.pickup_status || row.status)}
                  line1={`${safe(row.merchant_name || row.business_name || row.contact_name)} · ${safe(row.pickup_city)} / ${safe(row.pickup_township)}`}
                  line2={`${tr("Ways")}: ${safe(row.actual_way_count || row.expected_way_count || 0)} · ${tr("Updated")}: ${safe(row.updated_at || row.created_at)}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading merchant portal...") : tr("No recent pickup activity found.")}
              </div>
            )}
          </Panel>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Selected Merchant Detail")}>
            {selectedAccount ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <DetailMetric label={tr("Merchant")} value={safe(selectedAccount.name)} />
                  <DetailMetric label={tr("Pickup Batches")} value={String(selectedAccount.pickups)} />
                  <DetailMetric label={tr("Total Ways")} value={String(selectedAccount.ways)} />
                  <DetailMetric label={tr("Delivered Ways")} value={String(selectedAccount.delivered)} />
                  <DetailMetric label={tr("Open Pipeline")} value={String(selectedAccount.pipeline)} />
                  <DetailMetric label={tr("COD Exposure")} value={`${money(selectedAccount.codExposure)} MMK`} />
                  <DetailMetric label={tr("Top City")} value={safe(selectedAccount.topCity)} />
                  <DetailMetric label={tr("Top Township")} value={safe(selectedAccount.topTownship)} />
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  <ActionLink to="/pickup-registration" label={tr("Open Pickup Registration")} />
                  <ActionLink to="/delivery-registration" label={tr("Open Delivery Registration")} />
                  <ActionLink to="/customer-service" label={tr("Open Customer Service")} />
                  <ActionLink to="/marketing" label={tr("Open Marketing Portal")} />
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading merchant portal...") : tr("Select a merchant to view details.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Service Mix")}>
            {serviceMix.length ? (
              serviceMix.map((row) => (
                <RowCard
                  key={row.service}
                  title={row.service}
                  line1={`${tr("Ways")}: ${row.total}`}
                />
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: 18 }}>
                {loading ? tr("Loading merchant portal...") : tr("No service mix data found.")}
              </div>
            )}
          </Panel>

          <Panel title={tr("Quick Actions")}>
            <ActionLink to="/pickup-registration" label={tr("Create Pickup Batch")} />
            <ActionLink to="/delivery-registration" label={tr("Create Delivery Entry")} />
            <ActionLink to="/master/tariffs" label={tr("Open Tariff Master")} />
            <ActionLink to="/dashboard" label={tr("Open Dashboard")} />
          </Panel>
        </section>
      </div>
    </div>
  );
}

function buildMerchantAccounts(pickups: AnyRow[], deliveries: AnyRow[]) {
  const byMerchant = new Map<
    string,
    {
      name: string;
      pickups: number;
      ways: number;
      delivered: number;
      pipeline: number;
      codExposure: number;
      cityCounts: Map<string, number>;
      townshipCounts: Map<string, number>;
    }
  >();

  const deliveryByPickup = new Map<string, AnyRow[]>();
  for (const row of deliveries) {
    const pickupId = String(row.pickup_id || "").trim();
    if (!pickupId) continue;
    if (!deliveryByPickup.has(pickupId)) deliveryByPickup.set(pickupId, []);
    deliveryByPickup.get(pickupId)!.push(row);
  }

  for (const pickup of pickups) {
    const merchant =
      String(
        pickup.merchant_name ||
        pickup.business_name ||
        pickup.contact_name ||
        pickup.sender_name ||
        ""
      ).trim() || "Unassigned Merchant";

    if (!byMerchant.has(merchant)) {
      byMerchant.set(merchant, {
        name: merchant,
        pickups: 0,
        ways: 0,
        delivered: 0,
        pipeline: 0,
        codExposure: 0,
        cityCounts: new Map<string, number>(),
        townshipCounts: new Map<string, number>(),
      });
    }

    const agg = byMerchant.get(merchant)!;
    agg.pickups += 1;

    const pickupId = String(pickup.pickup_id || "").trim();
    const linked = pickupId ? deliveryByPickup.get(pickupId) || [] : [];
    const wayCount = linked.length || Number(pickup.actual_way_count || pickup.expected_way_count || 0);
    agg.ways += wayCount;

    for (const row of linked) {
      const status = String(row.delivery_status || row.status || "").toUpperCase();
      if (status === "DELIVERED") agg.delivered += 1;
      if (["SUBMITTED", "SAVED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED_ATTEMPT"].includes(status)) {
        agg.pipeline += 1;
      }

      agg.codExposure += Number(row.waybill_total_cod || row.receivable || 0);

      const city = String(row.receiver_city || "").trim();
      const township = String(row.receiver_township || row.township || "").trim();

      if (city) agg.cityCounts.set(city, (agg.cityCounts.get(city) || 0) + 1);
      if (township) agg.townshipCounts.set(township, (agg.townshipCounts.get(township) || 0) + 1);
    }
  }

  return Array.from(byMerchant.values())
    .map((row) => {
      const topCity = Array.from(row.cityCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
      const topTownship = Array.from(row.townshipCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
      return {
        name: row.name,
        pickups: row.pickups,
        ways: row.ways,
        delivered: row.delivered,
        pipeline: row.pipeline,
        codExposure: row.codExposure,
        topCity,
        topTownship,
      };
    })
    .sort((a, b) => b.ways - a.ways || b.pickups - a.pickups);
}
