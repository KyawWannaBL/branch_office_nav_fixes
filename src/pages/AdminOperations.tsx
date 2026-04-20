import React, { useState } from "react";
import {
  Activity,
  AlertOctagon,
  Truck,
  ShieldAlert,
  CheckCircle2,
  Map,
  Settings,
  Download,
  Search,
  Clock,
  Radio,
  BarChart3,
  ArrowRight,
} from "lucide-react";

type View = "dashboard" | "network" | "linehaul" | "exceptions";

type HubStatus = {
  id: string;
  name: string;
  type: "Main Sortation" | "Regional Hub" | "Transit Node";
  currentLoad: number;
  capacity: number;
  status: "Optimal" | "Warning" | "Critical";
};

type LinehaulRoute = {
  id: string;
  route: string;
  vehicleType: string;
  driver: string;
  departure: string;
  eta: string;
  status: "On Time" | "Delayed" | "Arrived";
};

type SystemException = {
  id: string;
  severity: "High" | "Medium" | "Low";
  category: "Routing" | "Capacity" | "System" | "Fleet";
  message: string;
  timestamp: string;
  resolved: boolean;
};

const HUB_SEED: HubStatus[] = [
  { id: "H-001", name: "Yangon Central Sortation", type: "Main Sortation", currentLoad: 45000, capacity: 50000, status: "Warning" },
  { id: "H-002", name: "Mandalay Regional Hub", type: "Regional Hub", currentLoad: 12000, capacity: 20000, status: "Optimal" },
  { id: "H-003", name: "Naypyidaw Transit", type: "Transit Node", currentLoad: 5500, capacity: 5000, status: "Critical" },
  { id: "H-004", name: "Bago Node", type: "Transit Node", currentLoad: 2100, capacity: 5000, status: "Optimal" },
];

const ROUTE_SEED: LinehaulRoute[] = [
  { id: "TRK-901", route: "Yangon -> Mandalay", vehicleType: "12-Wheeler", driver: "Ko Min Thu", departure: "18:00", eta: "04:30 (+1)", status: "On Time" },
  { id: "TRK-902", route: "Yangon -> Naypyidaw", vehicleType: "6-Wheeler", driver: "U Zaw", departure: "19:30", eta: "00:15 (+1)", status: "Delayed" },
  { id: "TRK-903", route: "Mandalay -> Taunggyi", vehicleType: "Box Truck", driver: "Sai Aung", departure: "06:00", eta: "11:00", status: "Arrived" },
];

const EXCEPTION_SEED: SystemException[] = [
  { id: "EX-1042", severity: "High", category: "Capacity", message: "Ahlone Branch Office exceeding 95% storage capacity. Dispatch emergency sweep.", timestamp: "10 mins ago", resolved: false },
  { id: "EX-1043", severity: "High", category: "Fleet", message: "Vehicle breakdown reported on TRK-902 (Yangon-Naypyidaw route).", timestamp: "25 mins ago", resolved: false },
  { id: "EX-1044", severity: "Medium", category: "Routing", message: "API failure from dynamic routing engine. Falling back to static routes.", timestamp: "1 hour ago", resolved: true },
];

function Card({
  title,
  value,
  icon,
  trend,
  alert,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-[28px] border bg-white p-5 shadow-sm transition-all ${alert ? "border-rose-200 shadow-rose-100" : "border-slate-200"}`}>
      <div className="flex items-center justify-between text-slate-500">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-black uppercase tracking-[0.2em]">{title}</span>
        </div>
        {alert ? <span className="flex h-2 w-2 animate-pulse rounded-full bg-rose-500"></span> : null}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className={`text-3xl font-black ${alert ? "text-rose-600" : "text-slate-900"}`}>{value}</div>
        {trend ? (
          <div className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
            {trend}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
  action,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
          {badge}
        </div>
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
          ? "rounded-xl bg-[#0B101B] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all"
          : "rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
      }
    >
      {children}
    </button>
  );
}

export default function AdminOperationsPage() {
  const [view, setView] = useState<View>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const activeExceptions = EXCEPTION_SEED.filter((e) => !e.resolved).length;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200 p-6 md:p-8">
      <div className="rounded-[36px] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              <Activity className="h-4 w-4" />
              Central Command
            </div>
            <h1 className="mt-2 text-4xl font-black text-slate-950">Operations Administration</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
              System-wide overview of the Britium Express logistics network. Monitor sortation hubs,
              linehaul routing, fleet utilization, and resolve critical network exceptions.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50">
              <Settings className="h-4 w-4" />
              System Config
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-[#0B101B] px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-slate-800">
              <Download className="h-4 w-4" />
              Export Logs
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card title="System Health" value="98.2%" icon={<Activity className="h-5 w-5 text-emerald-500" />} trend="+0.4%" />
          <Card title="Active Linehauls" value="24" icon={<Truck className="h-5 w-5 text-blue-500" />} />
          <Card title="Network Load" value="64k / 80k" icon={<BarChart3 className="h-5 w-5 text-amber-500" />} />
          <Card title="Critical Exceptions" value={String(activeExceptions)} icon={<AlertOctagon className="h-5 w-5 text-rose-500" />} alert={activeExceptions > 0} />
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
          <TabButton active={view === "dashboard"} onClick={() => setView("dashboard")}>
            Command Center
          </TabButton>
          <TabButton active={view === "network"} onClick={() => setView("network")}>
            Hub Network
          </TabButton>
          <TabButton active={view === "linehaul"} onClick={() => setView("linehaul")}>
            Linehaul Routing
          </TabButton>
          <TabButton active={view === "exceptions"} onClick={() => setView("exceptions")}>
            Exception Queue
          </TabButton>
        </div>
      </div>

      {view === "dashboard" && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Panel title="Live Network Map (Yangon - Mandalay Corridor)">
              <div className="relative flex h-[300px] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                ></div>
                <div className="z-10 text-center">
                  <Map className="mx-auto mb-2 h-12 w-12 text-slate-400" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                    Map Render Engine Active
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Tracking 24 active linehaul units</p>
                </div>
              </div>
            </Panel>

            <Panel title="Recent System Broadcasts">
              <div className="space-y-3">
                <div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <Radio className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">API Gateway Upgraded</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Successfully rolled out v2.4 to all branch routing nodes. Latency reduced by 14ms.
                    </div>
                    <div className="mt-2 text-xs text-slate-400">System • 2 hours ago</div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              title="Action Required"
              badge={
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-700">
                  {activeExceptions}
                </span>
              }
            >
              <div className="space-y-3">
                {EXCEPTION_SEED.filter((e) => !e.resolved).map((exception) => (
                  <div key={exception.id} className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-600" />
                      <span className="text-xs font-black uppercase text-rose-800">
                        {exception.category}
                      </span>
                    </div>
                    <p className="text-sm font-bold leading-snug text-slate-900">
                      {exception.message}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-600/70">
                        {exception.timestamp}
                      </span>
                      <button className="text-xs font-black uppercase text-rose-700 underline underline-offset-2 hover:text-rose-900">
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full rounded-xl bg-slate-100 py-3 text-xs font-black uppercase tracking-wider text-slate-600 transition-colors hover:bg-slate-200">
                View All Exceptions
              </button>
            </Panel>
          </div>
        </div>
      )}

      {view === "network" && (
        <div className="mt-6">
          <Panel title="Sortation & Hub Network Status">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-500">
                    <th className="pb-4 pl-4">Hub Name</th>
                    <th className="pb-4">Classification</th>
                    <th className="pb-4">Current Load</th>
                    <th className="pb-4">Capacity Utilization</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {HUB_SEED.map((hub) => {
                    const utilization = (hub.currentLoad / hub.capacity) * 100;
                    return (
                      <tr key={hub.id} className="transition-colors hover:bg-slate-50">
                        <td className="py-4 pl-4 font-bold text-slate-900">{hub.name}</td>
                        <td className="py-4 text-slate-600">{hub.type}</td>
                        <td className="py-4 font-mono text-slate-700">
                          {hub.currentLoad.toLocaleString()} parcels
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full ${
                                  utilization > 90
                                    ? "bg-rose-500"
                                    : utilization > 75
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                }`}
                                style={{ width: `${utilization}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-slate-600">
                              {utilization.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                              hub.status === "Optimal"
                                ? "bg-emerald-100 text-emerald-800"
                                : hub.status === "Warning"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {hub.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <button className="text-sm font-bold text-blue-600 hover:text-blue-800">
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {view === "linehaul" && (
        <div className="mt-6">
          <Panel title="Active Linehaul Routes (Trunking)">
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search route, truck ID, or driver..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ROUTE_SEED.filter(
                (r) =>
                  r.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.driver.toLowerCase().includes(searchQuery.toLowerCase()),
              ).map((route) => (
                <div key={route.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-400">
                        {route.id}
                      </span>
                      <h3 className="mt-1 flex items-center gap-2 font-bold text-slate-900">
                        {route.route.split("->")[0].trim()}
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        {route.route.split("->")[1].trim()}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                        route.status === "On Time"
                          ? "bg-emerald-100 text-emerald-800"
                          : route.status === "Delayed"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {route.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400">Vehicle / Driver</span>
                      <span className="font-medium text-slate-900">
                        {route.vehicleType} • {route.driver}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400">Departure</span>
                      <span className="font-medium text-slate-900">{route.departure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ETA</span>
                      <span className={`font-bold ${route.status === "Delayed" ? "text-rose-600" : "text-slate-900"}`}>
                        {route.eta}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-black uppercase text-slate-700 hover:bg-slate-200">
                      Track GPS
                    </button>
                    <button className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-black uppercase text-slate-700 hover:bg-slate-50">
                      Contact Driver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {view === "exceptions" && (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_300px]">
          <Panel title="System Exception Queue">
            <div className="space-y-4">
              {EXCEPTION_SEED.map((exception) => (
                <div
                  key={exception.id}
                  className={`flex items-start justify-between rounded-2xl border p-5 transition-all ${
                    exception.resolved
                      ? "border-slate-200 bg-slate-50 opacity-60"
                      : exception.severity === "High"
                        ? "border-rose-200 bg-white shadow-sm"
                        : "border-amber-200 bg-white shadow-sm"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {exception.resolved ? (
                        <CheckCircle2 className="h-6 w-6 text-slate-400" />
                      ) : (
                        <AlertOctagon
                          className={`h-6 w-6 ${
                            exception.severity === "High" ? "text-rose-500" : "text-amber-500"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {exception.id}
                        </span>
                        <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">
                          {exception.category}
                        </span>
                        {exception.severity === "High" && !exception.resolved ? (
                          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700">
                            Urgent
                          </span>
                        ) : null}
                      </div>
                      <h3
                        className={`text-base font-bold ${
                          exception.resolved ? "text-slate-600 line-through" : "text-slate-900"
                        }`}
                      >
                        {exception.message}
                      </h3>
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        Reported {exception.timestamp}
                      </p>
                    </div>
                  </div>

                  {!exception.resolved ? (
                    <button className="whitespace-nowrap rounded-xl bg-[#0B101B] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800">
                      Take Action
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Exception Metrics">
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                <div className="text-xs font-black uppercase text-slate-500">Resolution SLA</div>
                <div className="mt-1 text-2xl font-black text-emerald-600">94.2%</div>
                <div className="mt-1 text-xs text-slate-400">Target: &gt; 90%</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                <div className="text-xs font-black uppercase text-slate-500">
                  Avg Time to Resolve
                </div>
                <div className="mt-1 text-2xl font-black text-blue-600">14m</div>
                <div className="mt-1 text-xs text-slate-400">-2m from last week</div>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
