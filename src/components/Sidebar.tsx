import { Link, useLocation } from "react-router-dom";
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  UserCircle2,
  Wallet,
  Package,
  Map,
  ShieldCheck,
  Database,
  Headset,
  Building2,
  Users,
  Truck,
  FileText,
  BarChart3,
  Settings,
  Briefcase,
  ClipboardCheck,
  BadgeCheck,
  Building,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  aliases?: string[];
};

const coreNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, aliases: ["/"] },
  { title: "Profile", url: "/profile", icon: UserCircle2 },
  { title: "Wallet Hub", url: "/wallet", icon: Wallet },
  { title: "Create Delivery", url: "/create-delivery", icon: Package },
  { title: "Way Management", url: "/way-management", icon: Map },
];

const portalNav: NavItem[] = [
  { title: "Supervisor Control", url: "/supervisor", icon: ShieldCheck },
  { title: "Data Entry Portal", url: "/data-entry", icon: Database },
  { title: "Customer Service", url: "/customer-service", icon: Headset },
  { title: "Customer Portal", url: "/customer", icon: Users },
  { title: "Merchant Portal", url: "/merchant", icon: Building2, aliases: ["/merchants"] },
  { title: "Branch Office", url: "/branch-office", icon: Building },
  { title: "Admin & HR Portal", url: "/admin-hr", icon: Users, aliases: ["/admin/hr-admin"] },
  { title: "HR Employees", url: "/admin-hr/employees", icon: Briefcase },
  { title: "HR Approvals", url: "/admin-hr/approvals", icon: ClipboardCheck },
  { title: "Admin Controls", url: "/admin-hr/admin", icon: BadgeCheck, aliases: ["/admin/operations"] },
  { title: "HR Reports", url: "/admin-hr/reports", icon: BarChart3 },
  { title: "Deliverymen", url: "/deliverymen", icon: Truck },
];

const systemNav: NavItem[] = [
  { title: "Waybill", url: "/waybill", icon: FileText, aliases: ["/receipts"] },
  { title: "Reporting", url: "/reporting", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

function isItemActive(pathname: string, item: NavItem) {
  const candidates = [item.url, ...(item.aliases || [])];
  return candidates.some((candidate) => {
    if (candidate === "/dashboard") return pathname === "/dashboard";
    return pathname === candidate || pathname.startsWith(`${candidate}/`);
  });
}

function SidebarSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="mt-6">
      <div className="px-6 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
        {title}
      </div>

      <div className="mt-3 space-y-1 px-3">
        {items.map((item) => {
          const active = isItemActive(pathname, item);

          return (
            <Link
              key={item.url}
              to={item.url}
              className={[
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active
                  ? "bg-cyan-500/15 text-cyan-200"
                  : "text-slate-100 hover:bg-white/10",
              ].join(" ")}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function getDisplayName(user: any) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Unknown User"
  );
}

function getRoleLabel(user: any) {
  return (
    user?.user_metadata?.roleCode ||
    user?.user_metadata?.role_code ||
    user?.user_metadata?.app_role ||
    user?.user_metadata?.user_role ||
    user?.user_metadata?.role ||
    "USER"
  );
}

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const displayName = getDisplayName(user);
  const roleLabel = getRoleLabel(user);

  return (
    <aside className="flex h-screen w-[264px] shrink-0 flex-col border-r border-white/10 bg-[linear-gradient(180deg,#061120_0%,#0A1830_100%)] text-white shadow-2xl">
      <div className="border-b border-white/10 p-3">
        <div className="rounded-2xl border border-cyan-500/15 bg-[linear-gradient(180deg,#081526_0%,#0b1e37_100%)] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-300">
            Enterprise Suite
          </div>
          <div className="mt-1 text-xl font-black text-white">
            Britium Operations
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <SidebarSection title="Core" items={coreNav} pathname={location.pathname} />
        <SidebarSection title="Portals" items={portalNav} pathname={location.pathname} />
        <SidebarSection title="System" items={systemNav} pathname={location.pathname} />
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
          Signed in as
          <div className="mt-1 truncate font-bold text-white">{displayName}</div>
          <div className="mt-1 truncate text-[11px] text-slate-300">{user?.email || "-"}</div>
          <div className="mt-1 text-[10px] uppercase tracking-widest opacity-60">
            Role: {String(roleLabel).toUpperCase()}
          </div>
        </div>
      </div>
    </aside>
  );
}