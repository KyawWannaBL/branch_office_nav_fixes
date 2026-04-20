import React, { useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Headphones,
  MapPin,
  Package2,
  Search,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";

type Language = "en" | "my" | "both";
type TabKey = "dashboard" | "tracking" | "orders" | "support" | "profile";

type ShipmentRow = {
  id: string;
  trackingNo: string;
  receiver: string;
  township: string;
  status: string;
  eta: string;
};

const shipments: ShipmentRow[] = [
  {
    id: "1",
    trackingNo: "BEX-C-240101",
    receiver: "Daw Ei Ei",
    township: "Sanchaung",
    status: "Out for Delivery",
    eta: "Today 4:00 PM - 6:00 PM",
  },
  {
    id: "2",
    trackingNo: "BEX-C-240102",
    receiver: "Ko Thant Zin",
    township: "Chanmyathazi",
    status: "In Transit",
    eta: "Tomorrow by 8:00 PM",
  },
  {
    id: "3",
    trackingNo: "BEX-C-240103",
    receiver: "Ma Su Su",
    township: "Bahan",
    status: "Delivered",
    eta: "Completed",
  },
];

function t(language: Language, en: string, my: string) {
  if (language === "en") return en;
  if (language === "my") return my;
  return `${en} / ${my}`;
}

export default function CustomerPortal() {
  const [language, setLanguage] = useState<Language>("both");
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter((row) =>
      [row.trackingNo, row.receiver, row.township, row.status].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
            Customer Self Service
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-[#0d2c54]">
            Customer Portal <span className="font-normal text-blue-500">/ ဖောက်သည်ပေါ်တယ်</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              language,
              "Track shipments, review delivery status, and reach support from one customer workspace.",
              "Shipment များကို ခြေရာခံပြီး delivery အခြေအနေများကို ကြည့်ရှုကာ support ကို ဆက်သွယ်နိုင်သော customer workspace ဖြစ်သည်။",
            )}
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {[
            { value: "en", label: "EN" },
            { value: "my", label: "မြန်မာ" },
            { value: "both", label: "EN + မြန်မာ" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setLanguage(item.value as Language)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                language === item.value
                  ? "bg-[#0d2c54] text-white shadow"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {[
          ["dashboard", t(language, "Dashboard", "အနှစ်ချုပ်")],
          ["tracking", t(language, "Tracking", "ခြေရာခံမှု")],
          ["orders", t(language, "My Orders", "ကျွန်ုပ်၏အော်ဒါများ")],
          ["support", t(language, "Support", "အကူအညီ")],
          ["profile", t(language, "Profile", "ပရိုဖိုင်")],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as TabKey)}
            className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider transition ${
              tab === key
                ? "bg-[#0d2c54] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package2} title={t(language, "Total Orders", "အော်ဒါစုစုပေါင်း")} value="24" />
        <StatCard icon={Truck} title={t(language, "In Progress", "လမ်းကြောင်းပေါ်")} value="6" accent="sky" />
        <StatCard icon={CheckCircle2} title={t(language, "Delivered", "ပို့ပြီး")} value="17" accent="emerald" />
        <StatCard icon={Clock3} title={t(language, "Pending", "စောင့်ဆိုင်းနေ")} value="1" accent="amber" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#0d2c54]">
                {t(language, "Shipment Tracking", "Shipment ခြေရာခံမှု")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t(
                  language,
                  "Search your tracking number, receiver, township, or status.",
                  "Tracking number, receiver, township သို့မဟုတ် status ဖြင့် ရှာဖွေနိုင်သည်။",
                )}
              </p>
            </div>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                language,
                "Search tracking number or receiver...",
                "Tracking number သို့ receiver ဖြင့် ရှာပါ...",
              )}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#0d2c54]"
            />
          </div>

          <div className="mt-5 space-y-3">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-black text-[#0d2c54]">{item.trackingNo}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {item.receiver} • {item.township}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-700">{item.status}</div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      ETA
                    </div>
                    <div className="mt-1 text-sm font-black text-[#0d2c54]">{item.eta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <InfoPanel
            icon={<Headphones size={18} className="text-[#0d2c54]" />}
            title={t(language, "Support Center", "အကူအညီစင်တာ")}
            body={t(
              language,
              "Need help with delayed delivery, address correction, or complaints? Reach customer service from here.",
              "Delivery နောက်ကျခြင်း၊ လိပ်စာပြင်ဆင်ခြင်း၊ complaint များအတွက် customer service ကို ဤနေရာမှ ဆက်သွယ်နိုင်သည်။",
            )}
          />
          <InfoPanel
            icon={<MapPin size={18} className="text-[#0d2c54]" />}
            title={t(language, "Live Delivery Visibility", "Live ပို့ဆောင်မှုမြင်ကွင်း")}
            body={t(
              language,
              "Use this portal to monitor route progress and last known delivery stage.",
              "Route progress နှင့် နောက်ဆုံးပို့ဆောင်မှုအဆင့်ကို စောင့်ကြည့်ရန် ဤ portal ကို အသုံးပြုပါ။",
            )}
          />
          <InfoPanel
            icon={<ShieldCheck size={18} className="text-[#0d2c54]" />}
            title={t(language, "Account & Safety", "အကောင့်နှင့် လုံခြုံရေး")}
            body={t(
              language,
              "Review your profile, contact details, and order-related notifications in one place.",
              "သင့်ပရိုဖိုင်၊ ဆက်သွယ်ရန်အချက်အလက်နှင့် order notification များကို တစ်နေရာတည်းတွင် ကြည့်ရှုနိုင်သည်။",
            )}
          />
          <InfoPanel
            icon={<Bell size={18} className="text-[#0d2c54]" />}
            title={t(language, "Notifications", "အသိပေးချက်များ")}
            body={t(
              language,
              "Delivery milestones, failed attempts, and support responses will appear here.",
              "Delivery milestone များ၊ failed attempt များနှင့် support response များကို ဤနေရာတွင် မြင်ရမည်။",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  accent = "default",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  accent?: "default" | "sky" | "amber" | "emerald";
}) {
  const iconClass =
    accent === "sky"
      ? "text-sky-500"
      : accent === "amber"
        ? "text-amber-500"
        : accent === "emerald"
          ? "text-emerald-500"
          : "text-[#0d2c54]";

  const valueClass =
    accent === "sky"
      ? "text-sky-600"
      : accent === "amber"
        ? "text-amber-600"
        : accent === "emerald"
          ? "text-emerald-600"
          : "text-slate-800";

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <Icon size={24} className={iconClass} />
      <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className={`mt-4 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function InfoPanel({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">{icon}</div>
        <div className="font-black text-[#0d2c54]">{title}</div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}
