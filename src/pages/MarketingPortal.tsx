import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BellRing,
  Briefcase,
  Gift,
  Image as ImageIcon,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useT } from "@/hooks/useT";

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

async function readJson(res: Response) {
  const text = await res.text();
  const trimmed = String(text || "").trim();

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const parsed = trimmed ? JSON.parse(trimmed) : {};
      message = parsed?.error || parsed?.message || message;
    } catch {
      if (trimmed) message = trimmed;
    }
    throw new Error(message);
  }

  if (!trimmed) return {};
  if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
    throw new Error("Marketing API returned HTML instead of JSON");
  }

  return JSON.parse(trimmed);
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function RowCard({
  title,
  line1,
  line2,
  badge,
}: {
  title: string;
  line1: string;
  line2?: string;
  badge?: string;
}) {
  return (
    <div style={{ border: "1px solid #dbe4ee", borderRadius: 16, padding: 14, background: "#f8fafc" }}>
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
}

export default function MarketingPortal() {
  const { t: tr } = useT();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [payload, setPayload] = useState<any>(null);

  const [campaignForm, setCampaignForm] = useState({
    title: "",
    campaign_code: "",
    promo_code: "",
    campaign_type: "PROMO_CODE",
    status: "DRAFT",
    discount_type: "PERCENT",
    discount_value: 15,
    waives_overweight_surcharge: false,
    geo_origin_city: "",
    geo_origin_township: "",
    volume_threshold: 0,
    cashback_amount: 0,
    start_date: "",
    end_date: "",
    description: "",
  });

  const [leadForm, setLeadForm] = useState({
    company_name: "",
    contact_name: "",
    phone: "",
    email: "",
    city: "",
    township: "",
    lead_status: "COLD_LEAD",
    monthly_way_target: 0,
    proposed_tariff_rate: 0,
    notes: "",
  });

  const [assetForm, setAssetForm] = useState({
    asset_name: "",
    asset_type: "IMAGE",
    asset_category: "BRAND",
    file_url: "",
    branch_scope: "GLOBAL",
    notes: "",
  });

  const [broadcastForm, setBroadcastForm] = useState({
    audience_type: "MERCHANTS",
    channel: "IN_APP",
    title: "",
    message: "",
  });

  const [walletForm, setWalletForm] = useState({
    party_id: "",
    campaign_id: "",
    credit_amount: 0,
    remarks: "",
  });

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/marketing/portal", {
        headers: { Accept: "application/json" },
      });
      const data = await readJson(res);
      setPayload(data?.data || {});
      const warnings = Array.isArray(data?.data?.warnings) ? data.data.warnings : [];
      setMessage(warnings.length ? `Some sources were unavailable: ${warnings.slice(0, 3).join(" | ")}` : "");
    } catch (error: any) {
      setMessage(error?.message || "Failed to load marketing portal");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: string, body: Record<string, any>) {
    try {
      const res = await fetch("/api/v1/marketing/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await readJson(res);
      setMessage(data?.message || "Marketing action completed");
      await loadData();
    } catch (error: any) {
      setMessage(error?.message || "Marketing action failed");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const campaigns = payload?.campaigns || [];
  const leads = payload?.leads || [];
  const assets = payload?.assets || [];
  const broadcasts = payload?.broadcasts || [];
  const merchants = payload?.merchants || [];
  const analytics = payload?.analytics || {};
  const kpis = payload?.kpis || {};

  const activeCampaigns = useMemo(
    () => campaigns.filter((x: AnyRow) => String(x.status || "").toUpperCase() === "ACTIVE"),
    [campaigns]
  );

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
            {tr("Marketing")}
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 30, fontWeight: 900, color: "#0f172a" }}>
            {tr("Marketing Portal")}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
            {tr("Run promo campaigns, manage B2B leads, analyze route density, control brand assets, and queue omnichannel broadcasts from one marketing workspace.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
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

      <section style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 14 }}>
        <KpiCard icon={<Gift size={18} />} label={tr("Active Campaigns")} value={String(kpis.active_campaigns || 0)} tone="good" />
        <KpiCard icon={<Briefcase size={18} />} label={tr("Open Leads")} value={String(kpis.open_leads || 0)} tone="info" />
        <KpiCard icon={<ImageIcon size={18} />} label={tr("Verified Assets")} value={String(kpis.verified_assets || 0)} />
        <KpiCard icon={<BellRing size={18} />} label={tr("Queued Broadcasts")} value={String(kpis.queued_broadcasts || 0)} tone="warn" />
        <KpiCard icon={<Wallet size={18} />} label={tr("Wallet Exposure")} value={`${money(kpis.merchant_wallet_exposure || 0)} MMK`} />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 18 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Promo Code & Campaign Engine")}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
              <Field label={tr("Campaign Title")}><input style={inputStyle} value={campaignForm.title} onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })} /></Field>
              <Field label={tr("Campaign Code")}><input style={inputStyle} value={campaignForm.campaign_code} onChange={(e) => setCampaignForm({ ...campaignForm, campaign_code: e.target.value })} /></Field>
              <Field label={tr("Promo Code")}><input style={inputStyle} value={campaignForm.promo_code} onChange={(e) => setCampaignForm({ ...campaignForm, promo_code: e.target.value })} /></Field>
              <Field label={tr("Campaign Type")}>
                <select style={inputStyle} value={campaignForm.campaign_type} onChange={(e) => setCampaignForm({ ...campaignForm, campaign_type: e.target.value })}>
                  <option value="PROMO_CODE">PROMO_CODE</option>
                  <option value="GEO_PROMO">GEO_PROMO</option>
                  <option value="VOLUME_CASHBACK">VOLUME_CASHBACK</option>
                  <option value="NEW_MERCHANT">NEW_MERCHANT</option>
                </select>
              </Field>
              <Field label={tr("Discount Type")}>
                <select style={inputStyle} value={campaignForm.discount_type} onChange={(e) => setCampaignForm({ ...campaignForm, discount_type: e.target.value })}>
                  <option value="PERCENT">PERCENT</option>
                  <option value="FIXED">FIXED</option>
                </select>
              </Field>
              <Field label={tr("Discount Value")}><input style={inputStyle} type="number" value={campaignForm.discount_value} onChange={(e) => setCampaignForm({ ...campaignForm, discount_value: Number(e.target.value) })} /></Field>
              <Field label={tr("Origin City")}><input style={inputStyle} value={campaignForm.geo_origin_city} onChange={(e) => setCampaignForm({ ...campaignForm, geo_origin_city: e.target.value })} /></Field>
              <Field label={tr("Origin Township")}><input style={inputStyle} value={campaignForm.geo_origin_township} onChange={(e) => setCampaignForm({ ...campaignForm, geo_origin_township: e.target.value })} /></Field>
              <Field label={tr("Volume Threshold")}><input style={inputStyle} type="number" value={campaignForm.volume_threshold} onChange={(e) => setCampaignForm({ ...campaignForm, volume_threshold: Number(e.target.value) })} /></Field>
              <Field label={tr("Cashback Amount")}><input style={inputStyle} type="number" value={campaignForm.cashback_amount} onChange={(e) => setCampaignForm({ ...campaignForm, cashback_amount: Number(e.target.value) })} /></Field>
              <Field label={tr("Start Date")}><input style={inputStyle} type="date" value={campaignForm.start_date} onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })} /></Field>
              <Field label={tr("End Date")}><input style={inputStyle} type="date" value={campaignForm.end_date} onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })} /></Field>
            </div>

            <label style={{ display: "inline-flex", gap: 10, alignItems: "center", fontWeight: 700, color: "#334155" }}>
              <input
                type="checkbox"
                checked={campaignForm.waives_overweight_surcharge}
                onChange={(e) => setCampaignForm({ ...campaignForm, waives_overweight_surcharge: e.target.checked })}
              />
              {tr("Waive overweight surcharge")}
            </label>

            <Field label={tr("Description")}>
              <textarea style={{ ...inputStyle, minHeight: 90 }} value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} />
            </Field>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={primaryBtn} onClick={() => void runAction("create_campaign", campaignForm)}>
                {tr("Create Campaign")}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {campaigns.slice(0, 8).map((row: AnyRow) => (
                <RowCard
                  key={row.id}
                  title={safe(row.title)}
                  badge={safe(row.status)}
                  line1={`${safe(row.campaign_type)} · ${safe(row.promo_code)} · ${safe(row.discount_type)} ${safe(row.discount_value)}`}
                  line2={`${safe(row.geo_origin_township)} · ${safe(row.start_date)} → ${safe(row.end_date)}`}
                />
              ))}
              {!campaigns.length && <div style={{ color: "#64748b", textAlign: "center", padding: 18 }}>{loading ? tr("Loading campaigns...") : tr("No campaigns yet.")}</div>}
            </div>
          </Panel>

          <Panel title={tr("B2B Merchant CRM")}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
              <Field label={tr("Company Name")}><input style={inputStyle} value={leadForm.company_name} onChange={(e) => setLeadForm({ ...leadForm, company_name: e.target.value })} /></Field>
              <Field label={tr("Contact Name")}><input style={inputStyle} value={leadForm.contact_name} onChange={(e) => setLeadForm({ ...leadForm, contact_name: e.target.value })} /></Field>
              <Field label={tr("Phone")}><input style={inputStyle} value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} /></Field>
              <Field label={tr("Email")}><input style={inputStyle} value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} /></Field>
              <Field label={tr("City")}><input style={inputStyle} value={leadForm.city} onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })} /></Field>
              <Field label={tr("Township")}><input style={inputStyle} value={leadForm.township} onChange={(e) => setLeadForm({ ...leadForm, township: e.target.value })} /></Field>
              <Field label={tr("Lead Status")}>
                <select style={inputStyle} value={leadForm.lead_status} onChange={(e) => setLeadForm({ ...leadForm, lead_status: e.target.value })}>
                  <option value="COLD_LEAD">COLD_LEAD</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="NEGOTIATING_CONTRACT">NEGOTIATING_CONTRACT</option>
                  <option value="ONBOARDING">ONBOARDING</option>
                </select>
              </Field>
              <Field label={tr("Monthly Way Target")}><input style={inputStyle} type="number" value={leadForm.monthly_way_target} onChange={(e) => setLeadForm({ ...leadForm, monthly_way_target: Number(e.target.value) })} /></Field>
              <Field label={tr("Proposed Tariff Rate")}><input style={inputStyle} type="number" value={leadForm.proposed_tariff_rate} onChange={(e) => setLeadForm({ ...leadForm, proposed_tariff_rate: Number(e.target.value) })} /></Field>
            </div>

            <Field label={tr("Notes")}>
              <textarea style={{ ...inputStyle, minHeight: 90 }} value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} />
            </Field>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={primaryBtn} onClick={() => void runAction("save_lead", leadForm)}>
                {tr("Save Lead")}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {leads.slice(0, 10).map((row: AnyRow) => (
                <div key={row.id} style={{ border: "1px solid #dbe4ee", borderRadius: 16, padding: 14, background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <strong>{safe(row.company_name)}</strong>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#475569" }}>
                      {safe(row.lead_status)}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, color: "#334155" }}>
                    {safe(row.contact_name)} · {safe(row.phone)} · {safe(row.email)}
                  </div>
                  <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
                    {safe(row.city)} / {safe(row.township)} · {tr("Target")}: {safe(row.monthly_way_target)}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <button
                      style={secondaryBtn}
                      onClick={() => void runAction("convert_lead", { lead_id: row.id })}
                    >
                      {tr("Convert to Merchant")}
                    </button>
                  </div>
                </div>
              ))}
              {!leads.length && <div style={{ color: "#64748b", textAlign: "center", padding: 18 }}>{loading ? tr("Loading leads...") : tr("No leads yet.")}</div>}
            </div>
          </Panel>

          <Panel title={tr("Geospatial & Operational Analytics")}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>{tr("Top Pickup Origins")}</div>
                {(analytics.origin_density || []).map((row: AnyRow) => (
                  <RowCard key={`origin-${row.name}`} title={safe(row.name)} line1={`${safe(row.count)} pickup(s)`} />
                ))}
                {!(analytics.origin_density || []).length && <div style={{ color: "#64748b" }}>{tr("No origin density data yet.")}</div>}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>{tr("Top Delivery Destinations")}</div>
                {(analytics.destination_density || []).map((row: AnyRow) => (
                  <RowCard key={`dest-${row.name}`} title={safe(row.name)} line1={`${safe(row.count)} delivery(s)`} />
                ))}
                {!(analytics.destination_density || []).length && <div style={{ color: "#64748b" }}>{tr("No destination density data yet.")}</div>}
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>{tr("Suggested Campaign Opportunities")}</div>
              {(analytics.campaign_ideas || []).map((row: AnyRow, idx: number) => (
                <RowCard key={`idea-${idx}`} title={safe(row.title)} line1={safe(row.rationale)} line2={safe(row.target)} />
              ))}
            </div>
          </Panel>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title={tr("Brand & Asset Command Center")}>
            <Field label={tr("Asset Name")}><input style={inputStyle} value={assetForm.asset_name} onChange={(e) => setAssetForm({ ...assetForm, asset_name: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label={tr("Asset Type")}>
                <select style={inputStyle} value={assetForm.asset_type} onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value })}>
                  <option value="IMAGE">IMAGE</option>
                  <option value="VIDEO">VIDEO</option>
                  <option value="AUDIO">AUDIO</option>
                  <option value="DOCUMENT">DOCUMENT</option>
                </select>
              </Field>
              <Field label={tr("Category")}>
                <select style={inputStyle} value={assetForm.asset_category} onChange={(e) => setAssetForm({ ...assetForm, asset_category: e.target.value })}>
                  <option value="BRAND">BRAND</option>
                  <option value="UNIFORM">UNIFORM</option>
                  <option value="DIGITAL_BANNER">DIGITAL_BANNER</option>
                  <option value="EVENT_AUDIO_VISUAL">EVENT_AUDIO_VISUAL</option>
                </select>
              </Field>
            </div>
            <Field label={tr("File URL")}><input style={inputStyle} value={assetForm.file_url} onChange={(e) => setAssetForm({ ...assetForm, file_url: e.target.value })} /></Field>
            <Field label={tr("Scope")}><input style={inputStyle} value={assetForm.branch_scope} onChange={(e) => setAssetForm({ ...assetForm, branch_scope: e.target.value })} /></Field>
            <Field label={tr("Notes")}><textarea style={{ ...inputStyle, minHeight: 80 }} value={assetForm.notes} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} /></Field>
            <button style={primaryBtn} onClick={() => void runAction("save_asset", assetForm)}>
              {tr("Save Asset")}
            </button>

            {(assets || []).slice(0, 10).map((row: AnyRow) => (
              <a
                key={row.id}
                href={row.file_url}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <RowCard
                  title={safe(row.asset_name)}
                  badge={row.is_verified ? tr("Verified") : tr("Draft")}
                  line1={`${safe(row.asset_type)} · ${safe(row.asset_category)}`}
                  line2={`${safe(row.branch_scope)} · ${safe(row.created_at)}`}
                />
              </a>
            ))}
            {!assets.length && <div style={{ color: "#64748b", textAlign: "center", padding: 18 }}>{loading ? tr("Loading assets...") : tr("No assets yet.")}</div>}
          </Panel>

          <Panel title={tr("Omnichannel Broadcasting")}>
            <Field label={tr("Audience Type")}>
              <select style={inputStyle} value={broadcastForm.audience_type} onChange={(e) => setBroadcastForm({ ...broadcastForm, audience_type: e.target.value })}>
                <option value="MERCHANTS">MERCHANTS</option>
                <option value="END_RECEIVERS">END_RECEIVERS</option>
                <option value="RIDERS">RIDERS</option>
                <option value="BRANCHES">BRANCHES</option>
              </select>
            </Field>
            <Field label={tr("Channel")}>
              <select style={inputStyle} value={broadcastForm.channel} onChange={(e) => setBroadcastForm({ ...broadcastForm, channel: e.target.value })}>
                <option value="IN_APP">IN_APP</option>
                <option value="SMS">SMS</option>
                <option value="VIBER">VIBER</option>
                <option value="EMAIL">EMAIL</option>
              </select>
            </Field>
            <Field label={tr("Title")}><input style={inputStyle} value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} /></Field>
            <Field label={tr("Message")}><textarea style={{ ...inputStyle, minHeight: 90 }} value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} /></Field>
            <button style={primaryBtn} onClick={() => void runAction("create_broadcast", broadcastForm)}>
              {tr("Queue Broadcast")}
            </button>

            {(broadcasts || []).slice(0, 10).map((row: AnyRow) => (
              <RowCard
                key={row.id}
                title={safe(row.title)}
                badge={safe(row.status)}
                line1={`${safe(row.channel)} · ${safe(row.audience_type)}`}
                line2={safe(row.message)}
              />
            ))}
            {!broadcasts.length && <div style={{ color: "#64748b", textAlign: "center", padding: 18 }}>{loading ? tr("Loading broadcasts...") : tr("No broadcasts queued.")}</div>}
          </Panel>

          <Panel title={tr("Merchant Cashback Wallet")}>
            <Field label={tr("Merchant")}>
              <select style={inputStyle} value={walletForm.party_id} onChange={(e) => setWalletForm({ ...walletForm, party_id: e.target.value })}>
                <option value="">{tr("Select Merchant")}</option>
                {merchants.map((row: AnyRow) => (
                  <option key={row.id} value={row.id}>{safe(row.business_name)}</option>
                ))}
              </select>
            </Field>
            <Field label={tr("Campaign")}>
              <select style={inputStyle} value={walletForm.campaign_id} onChange={(e) => setWalletForm({ ...walletForm, campaign_id: e.target.value })}>
                <option value="">{tr("Optional Campaign")}</option>
                {activeCampaigns.map((row: AnyRow) => (
                  <option key={row.id} value={row.id}>{safe(row.title)}</option>
                ))}
              </select>
            </Field>
            <Field label={tr("Credit Amount")}><input style={inputStyle} type="number" value={walletForm.credit_amount} onChange={(e) => setWalletForm({ ...walletForm, credit_amount: Number(e.target.value) })} /></Field>
            <Field label={tr("Remarks")}><textarea style={{ ...inputStyle, minHeight: 80 }} value={walletForm.remarks} onChange={(e) => setWalletForm({ ...walletForm, remarks: e.target.value })} /></Field>
            <button style={primaryBtn} onClick={() => void runAction("credit_wallet", walletForm)}>
              {tr("Post Wallet Credit")}
            </button>
          </Panel>

          <Panel title={tr("Top Merchant Volume")}>
            {(analytics.merchant_volume || []).map((row: AnyRow) => (
              <RowCard key={row.name} title={safe(row.name)} line1={`${safe(row.count)} way(s)`} />
            ))}
            {!(analytics.merchant_volume || []).length && <div style={{ color: "#64748b", textAlign: "center", padding: 18 }}>{tr("No merchant volume data yet.")}</div>}
          </Panel>
        </section>
      </div>
    </div>
  );
}
