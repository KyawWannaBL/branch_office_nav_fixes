import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileSearch,
  Globe2,
  Headset,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Star,
  Ticket,
  Truck,
  UserCircle2,
} from "lucide-react";

type UiLanguage = "en" | "my" | "both";
type PortalView = "dashboard" | "tickets" | "lookup" | "knowledge";
type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "PENDING_CUSTOMER"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type TicketActivity = {
  id: string;
  type: string;
  note: string;
  actorName: string;
  createdAt: string;
};

type CustomerServiceTicket = {
  id: string;
  ticketNo: string;
  awbNo?: string;
  customerName: string;
  customerPhone: string;
  township: string;
  city: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedAgent: string;
  lastUpdatedAt: string;
  latestNote: string;
  activities: TicketActivity[];
};

type KnowledgeArticle = {
  id: string;
  title: string;
  category: string;
  body: string;
  updatedAt: string;
};

const ACCESS_ROLE_TOKENS = new Set<string>([
  "SYS",
  "SUPER_ADMIN",
  "ADMIN",
  "SUPERVISOR",
  "CUSTOMER_SERVICE",
  "CUSTOMER_SERVICE_AGENT",
  "CUSTOMER_SERVICE_MANAGER",
  "CUSTOMER_SUPPORT",
  "SUPPORT",
  "CALL_CENTER",
  "CALL_CENTER_AGENT",
  "NDR_AGENT",
  "NDR_SUPERVISOR",
]);

const ACCESS_PERMISSION_TOKENS = new Set<string>([
  "CUSTOMER_SERVICE_ACCESS",
  "CUSTOMER_SERVICE_ALL",
  "NDR_ACCESS",
  "SUPPORT_ACCESS",
  "ALL",
  "SUPER_ADMIN",
  "SYS",
]);

const TICKET_SEED: CustomerServiceTicket[] = [
  {
    id: "CS-1001",
    ticketNo: "TKT-24001",
    awbNo: "BRT-882190",
    customerName: "Daw Hla",
    customerPhone: "09 445 778 112",
    township: "Latha",
    city: "Yangon",
    subject: "Receiver asks for redelivery",
    category: "Delivery Support",
    status: "OPEN",
    priority: "HIGH",
    assignedAgent: "May Thandar",
    lastUpdatedAt: "2026-04-14 10:45",
    latestNote: "Customer requested evening redelivery window.",
    activities: [
      {
        id: "A-1",
        type: "CALL_CUSTOMER",
        note: "Confirmed the receiver is available after 5 PM.",
        actorName: "May Thandar",
        createdAt: "2026-04-14 10:45",
      },
    ],
  },
  {
    id: "CS-1002",
    ticketNo: "TKT-24002",
    awbNo: "BRT-882191",
    customerName: "Ko Aung",
    customerPhone: "09 780 991 233",
    township: "Lanmadaw",
    city: "Yangon",
    subject: "Address clarification needed",
    category: "NDR",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    assignedAgent: "Aye Mon",
    lastUpdatedAt: "2026-04-14 09:20",
    latestNote: "Pending landmark confirmation from customer.",
    activities: [
      {
        id: "A-2",
        type: "UPDATE_ADDRESS",
        note: "Requested landmark and nearest cross street.",
        actorName: "Aye Mon",
        createdAt: "2026-04-14 09:20",
      },
    ],
  },
  {
    id: "CS-1003",
    ticketNo: "TKT-24003",
    awbNo: "BRT-882194",
    customerName: "Ko Myo",
    customerPhone: "09 681 102 882",
    township: "Sanchaung",
    city: "Yangon",
    subject: "COD dispute from receiver",
    category: "COD",
    status: "ESCALATED",
    priority: "CRITICAL",
    assignedAgent: "Supervisor Queue",
    lastUpdatedAt: "2026-04-14 08:15",
    latestNote: "Escalated to supervisor for price verification.",
    activities: [
      {
        id: "A-3",
        type: "ESCALATE_TO_SUPERVISOR",
        note: "Mismatch between expected COD and parcel label.",
        actorName: "Nilar Win",
        createdAt: "2026-04-14 08:15",
      },
    ],
  },
  {
    id: "CS-1004",
    ticketNo: "TKT-24004",
    awbNo: "BRT-882188",
    customerName: "Ma Su",
    customerPhone: "09 797 228 551",
    township: "Hlaing",
    city: "Yangon",
    subject: "Delivered parcel confirmation",
    category: "Tracking",
    status: "RESOLVED",
    priority: "LOW",
    assignedAgent: "May Thandar",
    lastUpdatedAt: "2026-04-14 07:40",
    latestNote: "POD confirmed and SMS resent successfully.",
    activities: [
      {
        id: "A-4",
        type: "MARK_RESOLVED",
        note: "Customer confirmed parcel received in good condition.",
        actorName: "May Thandar",
        createdAt: "2026-04-14 07:40",
      },
    ],
  },
];

const KNOWLEDGE_SEED: KnowledgeArticle[] = [
  {
    id: "KB-1",
    title: "Redelivery Handling SOP",
    category: "Delivery Support",
    body: "Confirm recipient availability, update delivery window, notify rider dispatch, and add a customer-facing note to the case log.",
    updatedAt: "2026-04-10",
  },
  {
    id: "KB-2",
    title: "COD Dispute Checklist",
    category: "COD",
    body: "Verify AWB, parcel label, merchant order reference, and settlement expectation before escalating to supervisor or finance.",
    updatedAt: "2026-04-11",
  },
  {
    id: "KB-3",
    title: "Address Clarification Script",
    category: "NDR",
    body: "Ask for street number, landmark, township confirmation, and alternate phone number. Record all verified address details in the ticket.",
    updatedAt: "2026-04-09",
  },
];

function t(language: UiLanguage, en: string, my: string) {
  if (language === "en") return en;
  if (language === "my") return my;
  return `${en} / ${my}`;
}

function normalizeToken(value?: string | null) {
  return (value ?? "").trim().replace(/[\s-]+/g, "_").toUpperCase();
}

function asTokenList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeToken(String(item))).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [normalizeToken(value)];
  }
  return [];
}

function buildAccessTokens(user: any, profile: any) {
  const tokens = new Set<string>();

  [
    profile?.role,
    profile?.role_code,
    profile?.app_role,
    profile?.user_role,
    user?.app_metadata?.role,
    user?.app_metadata?.role_code,
    user?.user_metadata?.role,
    user?.user_metadata?.role_code,
  ]
    .map((item) => normalizeToken(item))
    .filter(Boolean)
    .forEach((item) => tokens.add(item));

  [
    ...asTokenList(profile?.permissions),
    ...asTokenList(user?.app_metadata?.permissions),
    ...asTokenList(user?.user_metadata?.permissions),
    ...asTokenList(user?.app_metadata?.roles),
    ...asTokenList(user?.user_metadata?.roles),
  ].forEach((item) => tokens.add(item));

  return Array.from(tokens);
}

function canAccessCustomerService(email?: string | null, tokens: string[] = []) {
  const lowerEmail = (email ?? "").toLowerCase();

  if (lowerEmail === "md@britiumexpress.com") return true;

  return tokens.some(
    (token) =>
      ACCESS_ROLE_TOKENS.has(token) || ACCESS_PERMISSION_TOKENS.has(token),
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, string> = {
    OPEN: "bg-amber-100 text-amber-800",
    IN_PROGRESS: "bg-sky-100 text-sky-800",
    PENDING_CUSTOMER: "bg-violet-100 text-violet-800",
    ESCALATED: "bg-rose-100 text-rose-800",
    RESOLVED: "bg-emerald-100 text-emerald-800",
    CLOSED: "bg-slate-200 text-slate-700",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${map[status]}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function PriorityPill({ priority }: { priority: TicketPriority }) {
  const map: Record<TicketPriority, string> = {
    LOW: "bg-slate-100 text-slate-700",
    MEDIUM: "bg-sky-100 text-sky-800",
    HIGH: "bg-amber-100 text-amber-800",
    CRITICAL: "bg-rose-100 text-rose-800",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${map[priority]}`}>
      {priority}
    </span>
  );
}

function Card({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-3 text-slate-700">
        {icon}
        <span className="text-xs font-black uppercase tracking-[0.2em]">{title}</span>
      </div>
      <div className="mt-4 text-3xl font-black text-slate-900">{value}</div>
      {subtitle ? <div className="mt-2 text-xs font-bold text-slate-500">{subtitle}</div> : null}
    </div>
  );
}

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-black/10 bg-white/60 p-6 shadow-sm backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-2xl bg-[#05080F] px-4 py-3 text-xs font-black uppercase tracking-wider text-white"
          : "rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-white/90"
      }
    >
      {children}
    </button>
  );
}

function LanguageToggle({
  value,
  onChange,
}: {
  value: UiLanguage;
  onChange: (value: UiLanguage) => void;
}) {
  const items: Array<{ value: UiLanguage; label: string }> = [
    { value: "en", label: "EN" },
    { value: "my", label: "မြန်မာ" },
    { value: "both", label: "EN + မြန်မာ" },
  ];

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 bg-white/70 p-2 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
        <Globe2 size={14} />
        <span>Language</span>
      </div>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={
              active
                ? "rounded-xl bg-[#0d2c54] px-3 py-2 text-sm font-semibold text-white shadow"
                : "rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default function CustomerServicePortalPage() {
  const [language, setLanguage] = useState<UiLanguage>("both");
  const [view, setView] = useState<PortalView>("dashboard");
  const [query, setQuery] = useState("");
  const [authResolved, setAuthResolved] = useState(false);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [authRole, setAuthRole] = useState("GUEST");
  const [actorName, setActorName] = useState("Customer Service");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(TICKET_SEED[0]?.id || "");

  const activeTicket = useMemo(
    () => TICKET_SEED.find((ticket) => ticket.id === selectedTicketId) || TICKET_SEED[0],
    [selectedTicketId],
  );

  useEffect(() => {
    let mounted = true;

    const loadAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setAuthRole("GUEST");
          setActorName("Customer Service");
          setAccessAllowed(false);
          setAuthResolved(true);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role, role_code, app_role, user_role, permissions")
          .eq("id", user.id)
          .maybeSingle();

        const tokens = buildAccessTokens(user, profile);
        const effectiveRole =
          tokens.find((token) => ACCESS_ROLE_TOKENS.has(token)) || "GUEST";

        setActorName(
          profile?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "Customer Service",
        );
        setAuthRole(effectiveRole);
        setAccessAllowed(canAccessCustomerService(user.email, tokens));
        setAuthResolved(true);
      } catch {
        if (!mounted) return;
        setAuthRole("GUEST");
        setActorName("Customer Service");
        setAccessAllowed(false);
        setAuthResolved(true);
      }
    };

    void loadAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadAccess();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    const open = TICKET_SEED.filter((t) => t.status === "OPEN").length;
    const progress = TICKET_SEED.filter((t) => t.status === "IN_PROGRESS").length;
    const escalated = TICKET_SEED.filter((t) => t.status === "ESCALATED").length;
    const resolved = TICKET_SEED.filter((t) => t.status === "RESOLVED").length;

    return { open, progress, escalated, resolved };
  }, []);

  const filteredTickets = useMemo(() => {
    if (!query.trim()) return TICKET_SEED;

    const q = query.toLowerCase();
    return TICKET_SEED.filter((ticket) =>
      [
        ticket.ticketNo,
        ticket.awbNo,
        ticket.customerName,
        ticket.customerPhone,
        ticket.subject,
        ticket.category,
        ticket.township,
        ticket.city,
        ticket.assignedAgent,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  const filteredKnowledge = useMemo(() => {
    if (!query.trim()) return KNOWLEDGE_SEED;

    const q = query.toLowerCase();
    return KNOWLEDGE_SEED.filter((article) =>
      [article.title, article.category, article.body].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  const refreshPortal = async () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 700);
  };

  if (!authResolved) {
    return (
      <div className="grid min-h-[calc(100vh-8rem)] place-items-center">
        <div className="rounded-[28px] border border-black/10 bg-white/70 px-6 py-4 text-sm font-bold text-slate-800 backdrop-blur-md">
          Loading customer service access...
        </div>
      </div>
    );
  }

  if (!accessAllowed) {
    return (
      <div className="grid min-h-[calc(100vh-8rem)] place-items-start">
        <div className="w-full rounded-[32px] border border-black/10 bg-white/70 p-8 shadow-sm backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-slate-100 p-3">
              <ShieldCheck className="h-6 w-6 text-slate-800" />
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-950">
                Customer Service Portal Access Restricted
              </h1>
              <p className="mt-3 max-w-3xl text-base text-slate-700">
                This portal is only for authorized customer service, call center, NDR,
                supervisor, admin, and system users.
              </p>
              <p className="mt-3 text-sm font-bold text-slate-600">
                Current role: {authRole} • User: {actorName}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="rounded-[36px] border border-black/10 bg-white/55 p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-slate-500">
              <Headset className="h-4 w-4" />
              Customer Service Command Desk
            </div>
            <h1 className="mt-2 text-4xl font-black text-slate-950">
              Customer Service Portal
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-700">
              Resolve customer tickets, handle NDR follow-up, clarify delivery issues,
              and support merchant and receiver communication from one shared workspace.
            </p>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Active user: {actorName} • Role: {authRole}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageToggle value={language} onChange={setLanguage} />
            <button
              type="button"
              onClick={() => void refreshPortal()}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-800 hover:bg-white"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {t(language, "Refresh", "ပြန်လည်ရယူ")}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            title={t(language, "Open Tickets", "ဖွင့်ထားသော ticket များ")}
            value={String(stats.open)}
            icon={<Ticket className="h-5 w-5 text-amber-600" />}
            subtitle={t(language, "Awaiting first action", "ပထမဆုံး လုပ်ဆောင်ချက် စောင့်ဆိုင်း")}
          />
          <Card
            title={t(language, "In Progress", "ဆောင်ရွက်နေဆဲ")}
            value={String(stats.progress)}
            icon={<MessageSquare className="h-5 w-5 text-sky-600" />}
            subtitle={t(language, "Handled by active agents", "Agent များက ဆောင်ရွက်နေသည်")}
          />
          <Card
            title={t(language, "Escalated", "တိုးမြှင့်တင်ပြထားသည်")}
            value={String(stats.escalated)}
            icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
            subtitle={t(language, "Supervisor attention needed", "Supervisor စောင့်ကြည့်ရန်လို")}
          />
          <Card
            title={t(language, "Resolved Today", "ယနေ့ ဖြေရှင်းပြီး")}
            value={String(stats.resolved)}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            subtitle={t(language, "Closed with confirmation", "အတည်ပြုချက်နှင့် ပိတ်ပြီး")}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <TabButton active={view === "dashboard"} onClick={() => setView("dashboard")}>
            {t(language, "Overview", "အနှစ်ချုပ်")}
          </TabButton>
          <TabButton active={view === "tickets"} onClick={() => setView("tickets")}>
            {t(language, "Ticket Queue", "Ticket စာရင်း")}
          </TabButton>
          <TabButton active={view === "lookup"} onClick={() => setView("lookup")}>
            {t(language, "Customer Lookup", "Customer ရှာဖွေရန်")}
          </TabButton>
          <TabButton active={view === "knowledge"} onClick={() => setView("knowledge")}>
            {t(language, "Knowledge Base", "Knowledge Base")}
          </TabButton>
        </div>
      </div>

      <div className="mt-6 relative max-w-xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(
            language,
            "Search AWB, ticket, customer, township, category...",
            "AWB, ticket, customer, township, category ဖြင့်ရှာရန်...",
          )}
          className="w-full rounded-2xl border border-black/10 bg-white/75 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-[#05080F]"
        />
      </div>

      {view === "dashboard" && (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel title={t(language, "Priority Queue", "ဦးစားပေး စာရင်း")}>
            <div className="space-y-3">
              {filteredTickets.slice(0, 4).map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setView("tickets");
                  }}
                  className="w-full rounded-2xl border border-black/10 bg-white/70 p-4 text-left hover:bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs font-black uppercase text-slate-500">
                        {ticket.ticketNo} • {ticket.awbNo || "NO AWB"}
                      </div>
                      <div className="mt-1 text-lg font-black text-slate-900">
                        {ticket.subject}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {ticket.customerName} • {ticket.customerPhone} • {ticket.township}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <PriorityPill priority={ticket.priority} />
                      <StatusPill status={ticket.status} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title={t(language, "Quick Support Actions", "အမြန် ဆောင်ရွက်ချက်များ")}>
            <div className="grid gap-3">
              <button className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/70 px-4 py-4 text-left hover:bg-white">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-sky-600" />
                  <div>
                    <div className="font-black text-slate-900">
                      {t(language, "Call Customer", "Customer ကိုခေါ်မည်")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t(language, "Direct issue clarification", "ပြဿနာကို တိုက်ရိုက် ရှင်းလင်းရန်")}
                    </div>
                  </div>
                </div>
              </button>

              <button className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/70 px-4 py-4 text-left hover:bg-white">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-black text-slate-900">
                      {t(language, "Request Redelivery", "Redelivery တောင်းမည်")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t(language, "Update rider and dispatch note", "Rider နှင့် dispatch note ပြင်ဆင်ရန်")}
                    </div>
                  </div>
                </div>
              </button>

              <button className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/70 px-4 py-4 text-left hover:bg-white">
                <div className="flex items-center gap-3">
                  <Send className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-black text-slate-900">
                      {t(language, "Escalate Case", "Case တိုးမြှင့်တင်ပြမည်")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t(language, "Forward to supervisor queue", "Supervisor queue သို့ပို့ရန်")}
                    </div>
                  </div>
                </div>
              </button>

              <button className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/70 px-4 py-4 text-left hover:bg-white">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-violet-600" />
                  <div>
                    <div className="font-black text-slate-900">
                      {t(language, "Send Status Update", "Status update ပို့မည်")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t(language, "Notify customer or merchant", "Customer သို့ merchant ကိုအသိပေးရန်")}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </Panel>
        </div>
      )}

      {view === "tickets" && activeTicket && (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_420px]">
          <Panel title={t(language, "Ticket Queue", "Ticket စာရင်း")}>
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full rounded-2xl border p-4 text-left ${
                    selectedTicketId === ticket.id
                      ? "border-[#0d2c54] bg-white"
                      : "border-black/10 bg-white/70 hover:bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs font-black uppercase text-slate-500">
                        {ticket.ticketNo}
                      </div>
                      <div className="mt-1 text-lg font-black text-slate-900">
                        {ticket.subject}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {ticket.customerName} • {ticket.customerPhone}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {ticket.category} • {ticket.assignedAgent} • {ticket.lastUpdatedAt}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <PriorityPill priority={ticket.priority} />
                      <StatusPill status={ticket.status} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title={t(language, "Ticket Detail", "Ticket အသေးစိတ်")}>
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/80 p-4">
                <div className="font-mono text-xs font-black uppercase text-slate-500">
                  {activeTicket.ticketNo} • {activeTicket.awbNo || "NO AWB"}
                </div>
                <div className="mt-2 text-2xl font-black text-slate-950">
                  {activeTicket.subject}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PriorityPill priority={activeTicket.priority} />
                  <StatusPill status={activeTicket.status} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    <UserCircle2 className="h-4 w-4" />
                    Customer
                  </div>
                  <div className="mt-2 font-black text-slate-900">{activeTicket.customerName}</div>
                  <div className="mt-1 text-sm text-slate-600">{activeTicket.customerPhone}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {activeTicket.township}, {activeTicket.city}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    <Ticket className="h-4 w-4" />
                    Case Info
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-700">
                    Category: <span className="text-slate-900">{activeTicket.category}</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    Agent: <span className="text-slate-900">{activeTicket.assignedAgent}</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    Updated: <span className="text-slate-900">{activeTicket.lastUpdatedAt}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/70 p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Latest Note
                </div>
                <div className="mt-2 text-sm text-slate-700">{activeTicket.latestNote}</div>
              </div>

              <div className="rounded-2xl bg-white/70 p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Activity Timeline
                </div>

                <div className="space-y-3">
                  {activeTicket.activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-4 w-4 text-slate-500" />
                      <div>
                        <div className="text-sm font-black text-slate-900">{activity.type}</div>
                        <div className="text-sm text-slate-600">{activity.note}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {activity.actorName} • {activity.createdAt}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {view === "lookup" && (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_420px]">
          <Panel title={t(language, "Customer Lookup", "Customer ရှာဖွေရန်")}>
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-900">{ticket.customerName}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {ticket.customerPhone} • {ticket.township}, {ticket.city}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {ticket.ticketNo} • {ticket.awbNo || "NO AWB"} • {ticket.subject}
                      </div>
                    </div>
                    <StatusPill status={ticket.status} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={t(language, "Lookup Notes", "ရှာဖွေမှု မှတ်ချက်")}>
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/70 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  <FileSearch className="h-4 w-4" />
                  Search Guidance
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>• Search by AWB, ticket number, customer phone, township, or subject.</li>
                  <li>• Use results to identify unresolved cases before escalating.</li>
                  <li>• Confirm phone and address updates before sending redelivery instructions.</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-white/70 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  <MapPin className="h-4 w-4" />
                  Common Support Fields
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div>• Township and landmark confirmation</div>
                  <div>• Alternate receiver phone number</div>
                  <div>• Preferred redelivery time window</div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {view === "knowledge" && (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_420px]">
          <Panel title={t(language, "Knowledge Base", "Knowledge Base")}>
            <div className="space-y-3">
              {filteredKnowledge.map((article) => (
                <div key={article.id} className="rounded-2xl border border-black/10 bg-white/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-black text-slate-900">{article.title}</div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-700">
                      {article.category}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-700">{article.body}</div>
                  <div className="mt-3 text-xs text-slate-500">
                    Updated: {article.updatedAt}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={t(language, "Support Quality Rules", "Support Quality စည်းမျဉ်း")}>
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/70 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  <Star className="h-4 w-4" />
                  Service Standard
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  Always verify receiver identity, confirm location details, and log the final action
                  taken in the ticket timeline.
                </div>
              </div>

              <div className="rounded-2xl bg-white/70 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  <BookOpen className="h-4 w-4" />
                  Escalation Rule
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  Escalate COD, routing, or repeated failed delivery issues when they cannot be
                  resolved on first-line contact.
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
