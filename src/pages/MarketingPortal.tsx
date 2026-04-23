import React, { useMemo, useState } from "react";
import {
  Megaphone,
  Target,
  TrendingUp,
  Store,
  Users,
  Truck,
  MapPinned,
  CalendarDays,
  BadgeDollarSign,
  Search,
  Filter,
  Download,
  Plus,
  Sparkles,
  Phone,
  Mail,
  Globe,
  ClipboardList,
  TicketPercent,
  Building2,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";

type UiLanguage = "en" | "my" | "both";

type PortalTab =
  | "overview"
  | "campaigns"
  | "merchant-acquisition"
  | "consumer-promos"
  | "zone-launches"
  | "calendar"
  | "partnerships"
  | "reports";

type Tone = "emerald" | "sky" | "amber" | "rose" | "violet" | "slate";

type CampaignStatus = "Draft" | "Scheduled" | "Live" | "Paused" | "Completed";

type Campaign = {
  id: string;
  nameEn: string;
  nameMy: string;
  objectiveEn: string;
  objectiveMy: string;
  channel: string;
  audienceEn: string;
  audienceMy: string;
  owner: string;
  budgetMmk: number;
  spendMmk: number;
  leads: number;
  activated: number;
  attributedShipments: number;
  roi: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
};

type MerchantLead = {
  id: string;
  company: string;
  contact: string;
  sourceEn: string;
  sourceMy: string;
  segmentEn: string;
  segmentMy: string;
  city: string;
  monthlyVolumeBand: string;
  stage: "New" | "Qualified" | "Demo Scheduled" | "Proposal Sent" | "Activated";
  owner: string;
};

type Promo = {
  id: string;
  nameEn: string;
  nameMy: string;
  code: string;
  audienceEn: string;
  audienceMy: string;
  discountLabelEn: string;
  discountLabelMy: string;
  redemptions: number;
  shipmentLiftPct: number;
  status: "Live" | "Scheduled" | "Expired";
};

type ZoneLaunch = {
  id: string;
  zone: string;
  launchDate: string;
  readiness: number;
  merchantPipeline: number;
  riderPipeline: number;
  partnerships: number;
  status: "Planning" | "Pre-Launch" | "Launching" | "Live";
};

type Partnership = {
  id: string;
  partner: string;
  categoryEn: string;
  categoryMy: string;
  initiativeEn: string;
  initiativeMy: string;
  stage: "Prospecting" | "Negotiation" | "Pilot" | "Live";
  expectedMonthlyShipments: number;
  owner: string;
};

const campaigns: Campaign[] = [
  {
    id: "CMP-2401",
    nameEn: "SME Merchant Onboarding Sprint",
    nameMy: "SME merchant onboarding အမြန်တိုးချဲ့ campaign",
    objectiveEn: "Acquire recurring merchants for same-day and next-day delivery",
    objectiveMy: "same-day နှင့် next-day delivery အတွက် merchant အသစ်များကို အဆက်မပြတ်ရယူရန်",
    channel: "Meta + Landing Page",
    audienceEn: "SME Retailers",
    audienceMy: "SME လက်လီရောင်းချသူများ",
    owner: "Growth Team",
    budgetMmk: 3200000,
    spendMmk: 2480000,
    leads: 286,
    activated: 54,
    attributedShipments: 4120,
    roi: 3.8,
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    status: "Live",
  },
  {
    id: "CMP-2402",
    nameEn: "COD Confidence Campaign",
    nameMy: "COD ယုံကြည်မှုတိုးမြှင့် campaign",
    objectiveEn: "Promote COD settlement trust for online sellers",
    objectiveMy: "online seller များအတွက် COD settlement ယုံကြည်မှုကို မြှင့်တင်ရန်",
    channel: "Email + Video + Sales Enablement",
    audienceEn: "Social Commerce Sellers",
    audienceMy: "social commerce seller များ",
    owner: "Brand Marketing",
    budgetMmk: 1800000,
    spendMmk: 990000,
    leads: 121,
    activated: 19,
    attributedShipments: 980,
    roi: 2.4,
    startDate: "2026-04-08",
    endDate: "2026-05-15",
    status: "Scheduled",
  },
  {
    id: "CMP-2403",
    nameEn: "Mandalay Zone Launch Awareness",
    nameMy: "Mandalay zone launch awareness campaign",
    objectiveEn: "Drive awareness for newly expanded service zone",
    objectiveMy: "အသစ်တိုးချဲ့ထားသော service zone အတွက် awareness တိုးတက်စေရန်",
    channel: "OOH + Local KOL + Search",
    audienceEn: "Merchants and consumers",
    audienceMy: "merchant များနှင့် customer များ",
    owner: "Regional Marketing",
    budgetMmk: 4500000,
    spendMmk: 4500000,
    leads: 440,
    activated: 61,
    attributedShipments: 6110,
    roi: 4.6,
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    status: "Completed",
  },
];

const merchantLeads: MerchantLead[] = [
  {
    id: "ML-1001",
    company: "Shwe Lotus Cosmetics",
    contact: "Nilar Win · 09 789 112 445",
    sourceEn: "Website Demo Form",
    sourceMy: "website demo form",
    segmentEn: "Beauty & Personal Care",
    segmentMy: "beauty နှင့် personal care",
    city: "Yangon",
    monthlyVolumeBand: "500-1,000 shipments",
    stage: "Qualified",
    owner: "Enterprise Sales",
  },
  {
    id: "ML-1002",
    company: "Mya Fashion Hub",
    contact: "Thura Kyaw · thura@myafashion.mm",
    sourceEn: "Meta Lead Ads",
    sourceMy: "Meta lead ads",
    segmentEn: "Apparel",
    segmentMy: "အဝတ်အထည်",
    city: "Mandalay",
    monthlyVolumeBand: "150-300 shipments",
    stage: "Demo Scheduled",
    owner: "SME Growth",
  },
  {
    id: "ML-1003",
    company: "Green Basket Mart",
    contact: "May Zin · 09 431 222 118",
    sourceEn: "Field Activation",
    sourceMy: "field activation",
    segmentEn: "Groceries",
    segmentMy: "စားသောက်ကုန်",
    city: "Naypyitaw",
    monthlyVolumeBand: "1,000+ shipments",
    stage: "Proposal Sent",
    owner: "Regional Sales",
  },
  {
    id: "ML-1004",
    company: "Nova Gadgets",
    contact: "Ko Sat · sales@novagadgets.com",
    sourceEn: "Referral Partner",
    sourceMy: "မိတ်ဖက် partner referral",
    segmentEn: "Electronics",
    segmentMy: "အီလက်ထရွန်းနစ်",
    city: "Yangon",
    monthlyVolumeBand: "300-500 shipments",
    stage: "Activated",
    owner: "Enterprise Sales",
  },
];

const promos: Promo[] = [
  {
    id: "PR-01",
    nameEn: "First Delivery Discount",
    nameMy: "ပထမအကြိမ် delivery discount",
    code: "FIRSTEXPRESS",
    audienceEn: "New consumers",
    audienceMy: "customer အသစ်များ",
    discountLabelEn: "20% off first delivery",
    discountLabelMy: "ပထမ delivery အတွက် 20% လျှော့ဈေး",
    redemptions: 1180,
    shipmentLiftPct: 14,
    status: "Live",
  },
  {
    id: "PR-02",
    nameEn: "Seller Week COD Promo",
    nameMy: "seller week COD promo",
    code: "CODSELLER10",
    audienceEn: "Merchant signups",
    audienceMy: "merchant signup အသစ်များ",
    discountLabelEn: "10% off first month service fee",
    discountLabelMy: "ပထမလ service fee 10% လျှော့ဈေး",
    redemptions: 92,
    shipmentLiftPct: 21,
    status: "Scheduled",
  },
  {
    id: "PR-03",
    nameEn: "Zone Expansion Free Pickup",
    nameMy: "zone expansion free pickup promo",
    code: "PICKUPFREE",
    audienceEn: "New launch zones",
    audienceMy: "အသစ်ဖွင့်မည့် zone များ",
    discountLabelEn: "Free first pickup",
    discountLabelMy: "ပထမ pickup အခမဲ့",
    redemptions: 604,
    shipmentLiftPct: 18,
    status: "Expired",
  },
];

const zoneLaunches: ZoneLaunch[] = [
  {
    id: "ZL-01",
    zone: "Mandalay North",
    launchDate: "2026-05-02",
    readiness: 84,
    merchantPipeline: 73,
    riderPipeline: 29,
    partnerships: 6,
    status: "Pre-Launch",
  },
  {
    id: "ZL-02",
    zone: "Bago Central",
    launchDate: "2026-05-20",
    readiness: 52,
    merchantPipeline: 38,
    riderPipeline: 17,
    partnerships: 4,
    status: "Planning",
  },
  {
    id: "ZL-03",
    zone: "Pathein Urban",
    launchDate: "2026-04-14",
    readiness: 100,
    merchantPipeline: 58,
    riderPipeline: 34,
    partnerships: 8,
    status: "Live",
  },
];

const partnerships: Partnership[] = [
  {
    id: "PT-01",
    partner: "Myanmar Seller Network",
    categoryEn: "Community",
    categoryMy: "community",
    initiativeEn: "Merchant onboarding webinars",
    initiativeMy: "merchant onboarding webinar များ",
    stage: "Live",
    expectedMonthlyShipments: 1400,
    owner: "Partnerships",
  },
  {
    id: "PT-02",
    partner: "Nova ERP",
    categoryEn: "Technology",
    categoryMy: "နည်းပညာ",
    initiativeEn: "Checkout + waybill integration",
    initiativeMy: "checkout + waybill integration",
    stage: "Pilot",
    expectedMonthlyShipments: 2200,
    owner: "Growth Partnerships",
  },
  {
    id: "PT-03",
    partner: "City Mall Retail Group",
    categoryEn: "Retail",
    categoryMy: "လက်လီ",
    initiativeEn: "Pickup point co-marketing",
    initiativeMy: "pickup point co-marketing",
    stage: "Negotiation",
    expectedMonthlyShipments: 950,
    owner: "Regional Marketing",
  },
];

const toneClasses: Record<Tone, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

function tt(language: UiLanguage, en: string, my: string) {
  if (language === "en") return en;
  if (language === "my") return my;
  return `${en} / ${my}`;
}

function mmk(value: number) {
  return `${value.toLocaleString()} MMK`;
}

function toneForStatus(status: string): Tone {
  const normalized = status.toUpperCase();
  if (["LIVE", "ACTIVATED", "COMPLETED"].includes(normalized)) return "emerald";
  if (["SCHEDULED", "QUALIFIED", "DEMO SCHEDULED", "PRE-LAUNCH"].includes(normalized)) return "sky";
  if (["PAUSED", "PLANNING", "NEGOTIATION"].includes(normalized)) return "amber";
  if (["EXPIRED"].includes(normalized)) return "rose";
  if (["PROPOSAL SENT", "PILOT"].includes(normalized)) return "violet";
  return "slate";
}

function PortalBadge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[#0d2c54]">
              {icon}
            </div>
          ) : null}
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#0d2c54]">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[#0d2c54]">
        {icon}
      </div>
      <div className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-[#0d2c54]">{value}</div>
      <div className="mt-2 text-sm font-medium text-slate-500">{note}</div>
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200">{children}</div>;
}

export default function MarketingPortal() {
  const [language, setLanguage] = useState<UiLanguage>("both");
  const [tab, setTab] = useState<PortalTab>("overview");
  const [search, setSearch] = useState("");
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>("All");

  const activeCampaigns = campaigns.filter((c) => c.status === "Live").length;
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budgetMmk, 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spendMmk, 0);
  const totalAttributedShipments = campaigns.reduce((sum, c) => sum + c.attributedShipments, 0);
  const totalActivatedMerchants = campaigns.reduce((sum, c) => sum + c.activated, 0);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesStatus = campaignStatusFilter === "All" || campaign.status === campaignStatusFilter;
      const haystack = [
        campaign.id,
        campaign.nameEn,
        campaign.nameMy,
        campaign.objectiveEn,
        campaign.objectiveMy,
        campaign.channel,
        campaign.audienceEn,
        campaign.audienceMy,
        campaign.owner,
        campaign.status,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [campaignStatusFilter, search]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return merchantLeads;
    return merchantLeads.filter((lead) =>
      [
        lead.id,
        lead.company,
        lead.contact,
        lead.sourceEn,
        lead.sourceMy,
        lead.segmentEn,
        lead.segmentMy,
        lead.city,
        lead.monthlyVolumeBand,
        lead.stage,
        lead.owner,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search]);

  const tabs: { key: PortalTab; labelEn: string; labelMy: string }[] = [
    { key: "overview", labelEn: "Overview", labelMy: "အနှစ်ချုပ်" },
    { key: "campaigns", labelEn: "Campaigns", labelMy: "campaign များ" },
    { key: "merchant-acquisition", labelEn: "Merchant Acquisition", labelMy: "merchant ရယူမှု" },
    { key: "consumer-promos", labelEn: "Consumer Promos", labelMy: "customer promo များ" },
    { key: "zone-launches", labelEn: "Zone Launches", labelMy: "zone launch များ" },
    { key: "calendar", labelEn: "Content Calendar", labelMy: "content calendar" },
    { key: "partnerships", labelEn: "Partnerships", labelMy: "မိတ်ဖက်များ" },
    { key: "reports", labelEn: "Reports", labelMy: "အစီရင်ခံစာများ" },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-sm">
        <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute left-0 top-0 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <Megaphone size={14} className="text-[#0d2c54]" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                {tt(language, "Marketing Portal", "Marketing Portal")}
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#0d2c54] md:text-5xl">
              {tt(
                language,
                "Delivery Growth, Merchant Acquisition & Brand Operations",
                "ပို့ဆောင်ရေးလုပ်ငန်း တိုးတက်မှု၊ merchant ရယူမှု နှင့် brand operations"
              )}
            </h1>

            <p className="mt-4 max-w-3xl text-[15px] font-medium leading-7 text-slate-500">
              {tt(
                language,
                "Run performance marketing, merchant onboarding funnels, consumer promo campaigns, service-zone launch programs, partnership growth, and shipment attribution reporting tailored to express delivery operations.",
                "express delivery operations အတွက် performance marketing, merchant onboarding funnel, customer promo campaign, service zone launch program, partnership growth နှင့် shipment attribution reporting များကို တစ်နေရာတည်းတွင် စီမံနိုင်ပါသည်။"
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              {[
                ["en", "EN"],
                ["my", "မြန်မာ"],
                ["both", "EN + မြန်မာ"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLanguage(value as UiLanguage)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    language === value
                      ? "bg-[#0d2c54] text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#0d2c54] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-sm">
                <Plus size={15} />
                {tt(language, "New Campaign", "campaign အသစ်")}
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 shadow-sm">
                <Download size={15} />
                {tt(language, "Export Report", "report ထုတ်ယူမည်")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={tt(language, "Active Campaigns", "လက်ရှိ campaign များ")}
          value={String(activeCampaigns)}
          note={tt(
            language,
            "Merchant and consumer growth programs now live",
            "merchant နှင့် customer growth program များ စတင်လည်ပတ်နေပါသည်"
          )}
          icon={<Megaphone size={18} />}
        />
        <StatCard
          title={tt(language, "Activated Merchants", "စတင်အသုံးပြုနေသော merchant များ")}
          value={String(totalActivatedMerchants)}
          note={tt(
            language,
            "Merchants attributed to current campaigns",
            "လက်ရှိ campaign များမှ ရရှိထားသော merchant များ"
          )}
          icon={<Store size={18} />}
        />
        <StatCard
          title={tt(language, "Attributed Shipments", "campaign မှ ရရှိသော shipment များ")}
          value={totalAttributedShipments.toLocaleString()}
          note={tt(
            language,
            "Shipments generated from acquisition and promo activity",
            "acquisition နှင့် promo activity များမှ ရရှိသော shipment များ"
          )}
          icon={<Truck size={18} />}
        />
        <StatCard
          title={tt(language, "Total Spend", "စုစုပေါင်း အသုံးစရိတ်")}
          value={mmk(totalSpend)}
          note={tt(
            language,
            `Allocated budget ${mmk(totalBudget)}`,
            `သတ်မှတ် budget ${mmk(totalBudget)}`
          )}
          icon={<BadgeDollarSign size={18} />}
        />
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-8">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                tab === item.key ? "bg-[#0d2c54] text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tt(language, item.labelEn, item.labelMy)}
            </button>
          ))}
        </div>
      </div>

      {(tab === "campaigns" || tab === "merchant-acquisition") && (
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tt(
                language,
                "Search campaign, lead, company, audience, city...",
                "campaign၊ lead၊ company၊ audience၊ city ရှာရန်..."
              )}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-sky-300"
            />
          </div>

          {tab === "campaigns" ? (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
              <Filter size={15} className="text-slate-400" />
              <select
                value={campaignStatusFilter}
                onChange={(e) => setCampaignStatusFilter(e.target.value)}
                className="h-11 bg-transparent text-sm font-medium outline-none"
              >
                <option>All</option>
                <option>Draft</option>
                <option>Scheduled</option>
                <option>Live</option>
                <option>Paused</option>
                <option>Completed</option>
              </select>
            </div>
          ) : null}
        </div>
      )}

      {tab === "overview" && (
        <div className="grid gap-6 xl:grid-cols-12">
          <Panel
            title={tt(language, "Channel Performance", "channel performance")}
            subtitle={tt(
              language,
              "Track growth performance across acquisition, brand, and promo channels.",
              "acquisition၊ brand နှင့် promo channel များအလိုက် growth performance ကို စောင့်ကြည့်နိုင်ပါသည်။"
            )}
            icon={<TrendingUp size={18} />}
            className="xl:col-span-7"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Globe size={15} /> {tt(language, "Website", "website")}
                </div>
                <div className="mt-3 text-2xl font-black text-[#0d2c54]">42,800</div>
                <div className="mt-1 text-sm text-slate-500">
                  {tt(language, "Sessions this month", "ယခုလအတွင်း session အရေအတွက်")}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail size={15} /> Email
                </div>
                <div className="mt-3 text-2xl font-black text-[#0d2c54]">18.7%</div>
                <div className="mt-1 text-sm text-slate-500">
                  {tt(language, "CTR on merchant journeys", "merchant journey များအတွက် CTR")}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone size={15} /> {tt(language, "Sales Calls", "sales call များ")}
                </div>
                <div className="mt-3 text-2xl font-black text-[#0d2c54]">74</div>
                <div className="mt-1 text-sm text-slate-500">
                  {tt(language, "Qualified callbacks this week", "ယခုအပတ် qualified callback များ")}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Sparkles size={15} /> {tt(language, "Conversion", "conversion")}
                </div>
                <div className="mt-3 text-2xl font-black text-[#0d2c54]">6.2%</div>
                <div className="mt-1 text-sm text-slate-500">
                  {tt(language, "Visitor to activated merchant", "visitor မှ activated merchant သို့")}
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title={tt(language, "Immediate Priorities", "လက်တလော ဦးစားပေးအလုပ်များ")}
            subtitle={tt(
              language,
              "Tasks aligned with delivery-service launch, retention, and demand generation.",
              "delivery service launch, retention နှင့် demand generation အတွက် လက်ရှိအရေးကြီးသောအလုပ်များ။"
            )}
            icon={<ClipboardList size={18} />}
            className="xl:col-span-5"
          >
            <div className="space-y-3">
              {[
                tt(language, "Approve COD confidence creative for seller acquisition", "seller acquisition အတွက် COD confidence creative ကို approve လုပ်ရန်"),
                tt(language, "Launch Mandalay North merchant webinar registration", "Mandalay North merchant webinar registration စတင်ရန်"),
                tt(language, "Review pickup-point partnership pilot deck", "pickup-point partnership pilot deck ကို စစ်ဆေးရန်"),
                tt(language, "Sync sales handoff for enterprise leads above 1,000 shipments/month", "တစ်လလျှင် shipment 1,000 ကျော်သော enterprise lead များအတွက် sales handoff ကို sync လုပ်ရန်"),
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title={tt(language, "Top Live Campaigns", "ထိပ်တန်း live campaign များ")}
            subtitle={tt(
              language,
              "Most impactful campaigns by shipment contribution and ROI.",
              "shipment contribution နှင့် ROI အလိုက် အထိရောက်ဆုံး campaign များ။"
            )}
            icon={<Target size={18} />}
            className="xl:col-span-12"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {campaigns.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{campaign.id}</div>
                      <div className="mt-2 text-xl font-black text-[#0d2c54]">
                        {tt(language, campaign.nameEn, campaign.nameMy)}
                      </div>
                    </div>
                    <PortalBadge tone={toneForStatus(campaign.status)}>{campaign.status}</PortalBadge>
                  </div>
                  <div className="mt-4 text-sm font-medium leading-6 text-slate-500">
                    {tt(language, campaign.objectiveEn, campaign.objectiveMy)}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white p-3">
                      <div className="text-slate-500">ROI</div>
                      <div className="mt-1 font-black text-[#0d2c54]">{campaign.roi.toFixed(1)}x</div>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <div className="text-slate-500">
                        {tt(language, "Shipments", "shipment များ")}
                      </div>
                      <div className="mt-1 font-black text-[#0d2c54]">
                        {campaign.attributedShipments.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "campaigns" && (
        <Panel
          title={tt(language, "Campaign Pipeline", "campaign pipeline")}
          subtitle={tt(
            language,
            "Campaign planning and execution for merchant growth, zone launches, promo conversion, and brand demand.",
            "merchant growth, zone launch, promo conversion နှင့် brand demand အတွက် campaign planning နှင့် execution များ။"
          )}
          icon={<Megaphone size={18} />}
          action={
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              <Plus size={14} />
              {tt(language, "Add Campaign", "campaign ထည့်မည်")}
            </button>
          }
        >
          <TableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  {[
                    tt(language, "ID", "ID"),
                    tt(language, "Campaign", "campaign"),
                    tt(language, "Channel", "channel"),
                    tt(language, "Audience", "audience"),
                    tt(language, "Budget", "budget"),
                    tt(language, "Leads", "lead များ"),
                    tt(language, "Shipments", "shipment များ"),
                    tt(language, "ROI", "ROI"),
                    tt(language, "Status", "status"),
                  ].map((col) => (
                    <th key={col} className="px-4 py-3 font-black">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-500">{row.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-black text-[#0d2c54]">{tt(language, row.nameEn, row.nameMy)}</div>
                      <div className="mt-1 text-xs text-slate-500">{tt(language, row.objectiveEn, row.objectiveMy)}</div>
                    </td>
                    <td className="px-4 py-3">{row.channel}</td>
                    <td className="px-4 py-3">{tt(language, row.audienceEn, row.audienceMy)}</td>
                    <td className="px-4 py-3">{mmk(row.budgetMmk)}</td>
                    <td className="px-4 py-3">{row.leads}</td>
                    <td className="px-4 py-3">{row.attributedShipments.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.roi.toFixed(1)}x</td>
                    <td className="px-4 py-3">
                      <PortalBadge tone={toneForStatus(row.status)}>{row.status}</PortalBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </Panel>
      )}

      {tab === "merchant-acquisition" && (
        <div className="grid gap-6 xl:grid-cols-12">
          <Panel
            title={tt(language, "Merchant Funnel", "merchant funnel")}
            subtitle={tt(
              language,
              "Qualified seller growth for express delivery, COD, same-day, and scheduled pickup services.",
              "express delivery, COD, same-day နှင့် scheduled pickup service များအတွက် qualified seller growth ကို စောင့်ကြည့်ရန်။"
            )}
            icon={<Store size={18} />}
            className="xl:col-span-4"
          >
            <div className="space-y-4">
              {[
                [tt(language, "New Leads", "lead အသစ်များ"), "124", "sky"],
                [tt(language, "Qualified", "qualified"), "91", "emerald"],
                [tt(language, "Demo Scheduled", "demo စီစဉ်ပြီး"), "31", "violet"],
                [tt(language, "Activated", "activated"), "22", "amber"],
              ].map(([label, value, tone]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="font-semibold text-slate-700">{label}</div>
                  <PortalBadge tone={tone as Tone}>{value}</PortalBadge>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title={tt(language, "Merchant Lead Queue", "merchant lead queue")}
            subtitle={tt(
              language,
              "Track retailer and seller acquisition from demo form to shipping activation.",
              "demo form မှ shipping activation အထိ retailer နှင့် seller acquisition ကို စောင့်ကြည့်နိုင်သည်။"
            )}
            icon={<Users size={18} />}
            className="xl:col-span-8"
          >
            <TableShell>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    {[
                      tt(language, "Company", "company"),
                      tt(language, "Contact", "ဆက်သွယ်ရန်"),
                      tt(language, "Source", "source"),
                      tt(language, "Segment", "segment"),
                      tt(language, "City", "မြို့"),
                      tt(language, "Volume Band", "shipment အရွယ်အစား"),
                      tt(language, "Stage", "stage"),
                      tt(language, "Owner", "တာဝန်ခံ"),
                    ].map((col) => (
                      <th key={col} className="px-4 py-3 font-black">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-black text-[#0d2c54]">{lead.company}</div>
                        <div className="mt-1 text-xs text-slate-500">{lead.id}</div>
                      </td>
                      <td className="px-4 py-3">{lead.contact}</td>
                      <td className="px-4 py-3">{tt(language, lead.sourceEn, lead.sourceMy)}</td>
                      <td className="px-4 py-3">{tt(language, lead.segmentEn, lead.segmentMy)}</td>
                      <td className="px-4 py-3">{lead.city}</td>
                      <td className="px-4 py-3">{lead.monthlyVolumeBand}</td>
                      <td className="px-4 py-3">
                        <PortalBadge tone={toneForStatus(lead.stage)}>{lead.stage}</PortalBadge>
                      </td>
                      <td className="px-4 py-3">{lead.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </Panel>
        </div>
      )}

      {tab === "consumer-promos" && (
        <Panel
          title={tt(language, "Consumer Promo Management", "customer promo စီမံခန့်ခွဲမှု")}
          subtitle={tt(
            language,
            "Promotions tied to first-order conversion, COD confidence, free pickup, and zone launch acceleration.",
            "first-order conversion, COD confidence, free pickup နှင့် zone launch acceleration အတွက် promo များကို စီမံနိုင်ပါသည်။"
          )}
          icon={<TicketPercent size={18} />}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {promos.map((promo) => (
              <div key={promo.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{promo.id}</div>
                    <div className="mt-2 text-xl font-black text-[#0d2c54]">{tt(language, promo.nameEn, promo.nameMy)}</div>
                  </div>
                  <PortalBadge tone={toneForStatus(promo.status)}>{promo.status}</PortalBadge>
                </div>
                <div className="mt-3 text-sm text-slate-600">{tt(language, promo.audienceEn, promo.audienceMy)}</div>
                <div className="mt-5 rounded-2xl border border-white bg-white p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {tt(language, "Code", "code")}
                  </div>
                  <div className="mt-2 text-lg font-black text-[#0d2c54]">{promo.code}</div>
                  <div className="mt-2 text-sm text-slate-500">
                    {tt(language, promo.discountLabelEn, promo.discountLabelMy)}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white p-3">
                    <div className="text-slate-500">{tt(language, "Redemptions", "အသုံးပြုမှု")}</div>
                    <div className="mt-1 font-black text-[#0d2c54]">{promo.redemptions.toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <div className="text-slate-500">{tt(language, "Shipment Lift", "shipment တိုးတက်မှု")}</div>
                    <div className="mt-1 font-black text-[#0d2c54]">+{promo.shipmentLiftPct}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "zone-launches" && (
        <Panel
          title={tt(language, "Zone Launch Readiness", "zone launch readiness")}
          subtitle={tt(
            language,
            "Coordinate launch marketing with operations, rider supply, merchant recruitment, and local partnerships.",
            "operations, rider supply, merchant recruitment နှင့် local partnership များနှင့်အတူ zone launch marketing ကို ချိတ်ဆက်စီမံနိုင်ပါသည်။"
          )}
          icon={<MapPinned size={18} />}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {zoneLaunches.map((zone) => (
              <div key={zone.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{zone.id}</div>
                    <div className="mt-2 text-xl font-black text-[#0d2c54]">{zone.zone}</div>
                  </div>
                  <PortalBadge tone={toneForStatus(zone.status)}>{zone.status}</PortalBadge>
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  {tt(language, "Launch date", "launch ရက်")}: {zone.launchDate}
                </div>
                <div className="mt-5 space-y-3">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-600">{tt(language, "Readiness", "အဆင်သင့်ဖြစ်မှု")}</span>
                      <span className="font-black text-[#0d2c54]">{zone.readiness}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-[#0d2c54]" style={{ width: `${zone.readiness}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-slate-500">{tt(language, "Merchants", "merchant များ")}</div>
                      <div className="mt-1 font-black text-[#0d2c54]">{zone.merchantPipeline}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-slate-500">{tt(language, "Riders", "rider များ")}</div>
                      <div className="mt-1 font-black text-[#0d2c54]">{zone.riderPipeline}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-slate-500">{tt(language, "Partners", "partner များ")}</div>
                      <div className="mt-1 font-black text-[#0d2c54]">{zone.partnerships}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "calendar" && (
        <Panel
          title={tt(language, "Content Calendar", "content calendar")}
          subtitle={tt(
            language,
            "Cross-channel content tailored to express delivery selling points, service trust, and merchant enablement.",
            "express delivery selling point, service trust နှင့် merchant enablement အတွက် channel အလိုက် content များ။"
          )}
          icon={<CalendarDays size={18} />}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Mon",
                tt(language, "Merchant onboarding webinar promo", "merchant onboarding webinar promo"),
                tt(language, "Performance + CRM", "performance + CRM"),
              ],
              [
                "Tue",
                tt(language, "Same-day delivery proof-point carousel", "same-day delivery proof-point carousel"),
                "Social",
              ],
              [
                "Wed",
                tt(language, "COD settlement explainer video", "COD settlement ရှင်းပြ video"),
                "Website / Reels",
              ],
              [
                "Thu",
                tt(language, "Zone launch rider recruitment campaign", "zone launch rider recruitment campaign"),
                "Regional",
              ],
              [
                "Fri",
                tt(language, "Pickup reliability case study", "pickup reliability case study"),
                "Sales Enablement",
              ],
              [
                "Sat",
                tt(language, "Consumer promo reminder push", "customer promo reminder push"),
                "CRM / Push",
              ],
              [
                "Sun",
                tt(language, "Weekly growth review and optimization", "အပတ်စဉ် growth review နှင့် optimization"),
                tt(language, "Internal", "အတွင်းပိုင်း"),
              ],
            ].map(([day, title, channel]) => (
              <div key={`${day}-${title}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{day}</div>
                <div className="mt-3 text-lg font-black text-[#0d2c54]">{title}</div>
                <div className="mt-2 text-sm font-medium text-slate-500">{channel}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "partnerships" && (
        <Panel
          title={tt(language, "Partnership Pipeline", "partnership pipeline")}
          subtitle={tt(
            language,
            "Partnerships that unlock seller acquisition, pickup point growth, platform integrations, and co-marketing reach.",
            "seller acquisition, pickup point growth, platform integration နှင့် co-marketing reach တိုးတက်စေသော partnership များ။"
          )}
          icon={<Building2 size={18} />}
        >
          <TableShell>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  {[
                    tt(language, "Partner", "partner"),
                    tt(language, "Category", "အမျိုးအစား"),
                    tt(language, "Initiative", "initiative"),
                    tt(language, "Stage", "stage"),
                    tt(language, "Monthly Shipment Potential", "လစဉ် shipment အလားအလာ"),
                    tt(language, "Owner", "တာဝန်ခံ"),
                  ].map((col) => (
                    <th key={col} className="px-4 py-3 font-black">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partnerships.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-black text-[#0d2c54]">{row.partner}</div>
                      <div className="mt-1 text-xs text-slate-500">{row.id}</div>
                    </td>
                    <td className="px-4 py-3">{tt(language, row.categoryEn, row.categoryMy)}</td>
                    <td className="px-4 py-3">{tt(language, row.initiativeEn, row.initiativeMy)}</td>
                    <td className="px-4 py-3">
                      <PortalBadge tone={toneForStatus(row.stage)}>{row.stage}</PortalBadge>
                    </td>
                    <td className="px-4 py-3">{row.expectedMonthlyShipments.toLocaleString()}</td>
                    <td className="px-4 py-3">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </Panel>
      )}

      {tab === "reports" && (
        <div className="grid gap-6 xl:grid-cols-12">
          <Panel
            title={tt(language, "Performance Summary", "performance အနှစ်ချုပ်")}
            subtitle={tt(
              language,
              "Top-line growth measures for delivery marketing effectiveness.",
              "delivery marketing effectiveness အတွက် အရေးပါသော growth metric များ။"
            )}
            icon={<BarChart3 size={18} />}
            className="xl:col-span-7"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                [tt(language, "CAC", "CAC"), "54,000 MMK", tt(language, "Merchant acquisition cost", "merchant ရယူမှုကုန်ကျစရိတ်")],
                [tt(language, "ROAS", "ROAS"), "3.8x", tt(language, "Paid media return", "paid media return")],
                [tt(language, "MQL → Activation", "MQL → Activation"), "17%", tt(language, "Lead to live shipping merchant", "lead မှ live shipping merchant သို့")],
                [tt(language, "Promo Lift", "Promo Lift"), "+18%", tt(language, "Shipment increase from promotions", "promo များကြောင့် shipment တိုးတက်မှု")],
              ].map(([title, value, note]) => (
                <div key={String(title)} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{title}</div>
                  <div className="mt-3 text-3xl font-black text-[#0d2c54]">{value}</div>
                  <div className="mt-2 text-sm font-medium text-slate-500">{note}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title={tt(language, "Executive Notes", "executive မှတ်ချက်များ")}
            subtitle={tt(
              language,
              "Operationally relevant growth observations for leadership review.",
              "leadership review အတွက် operation နှင့်ဆိုင်သော growth observation များ။"
            )}
            icon={<ArrowUpRight size={18} />}
            className="xl:col-span-5"
          >
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={16} />
                  {tt(language, "Strong merchant conversion", "merchant conversion ကောင်းမွန်နေသည်")}
                </div>
                <div className="mt-2">
                  {tt(
                    language,
                    "SME merchant campaign is converting above target in Yangon and Mandalay.",
                    "Yangon နှင့် Mandalay တွင် SME merchant campaign သည် ရည်မှန်းချက်ထက် ပိုမိုကောင်းမွန်စွာ convert ဖြစ်နေပါသည်။"
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                <div className="flex items-center gap-2 font-bold">
                  <Clock3 size={16} />
                  {tt(language, "Launch support needed", "launch support လိုအပ်နေသည်")}
                </div>
                <div className="mt-2">
                  {tt(
                    language,
                    "Bago Central needs more rider-supply marketing before zone launch ads scale.",
                    "Bago Central တွင် zone launch ads မတိုးခင် rider-supply marketing ပိုမိုလိုအပ်နေပါသည်။"
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={16} />
                  {tt(language, "Promo dependency risk", "promo dependency risk")}
                </div>
                <div className="mt-2">
                  {tt(
                    language,
                    "Consumer promo performance is strong, but retention after first order should be improved.",
                    "customer promo performance ကောင်းမွန်သော်လည်း first order ပြီးနောက် retention ကို ပိုမိုကောင်းမွန်အောင်လုပ်သင့်ပါသည်။"
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}