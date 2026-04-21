import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Store,
  Settings as SettingsIcon,
  FileText,
  BarChart3,
  Map,
  Headset,
  UserSquare2,
  ShieldCheck,
  Database,
  Building,
  Warehouse,
  Archive,
  Layers3,
  QrCode,
  Truck,
  Wallet,
  UserCircle2,
  LogOut,
  Briefcase,
  ClipboardCheck,
  BadgeCheck,
  DollarSign,
} from "lucide-react";
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  title: string;
  path: string;
  icon: any;
};

const coreNav: NavItem[] = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", path: "/profile", icon: UserCircle2 },
  { title: "Wallet Hub", path: "/wallet", icon: Wallet },
  { title: "Create Delivery", path: "/create-delivery", icon: Package },
  { title: "Way Management", path: "/way-management", icon: Map },
];

const portalNav: NavItem[] = [
  { title: "Supervisor Control", path: "/supervisor", icon: ShieldCheck },
  { title: "Data Entry Portal", path: "/data-entry", icon: Database },
  { title: "Customer Service", path: "/customer-service", icon: Headset },
  { title: "Customer Portal", path: "/customer", icon: UserSquare2 },
  { title: "Merchant Portal", path: "/merchant", icon: Store },
  { title: "Branch Office", path: "/branch-office", icon: Building },
  { title: "Warehouse Portal", path: "/warehouse", icon: Warehouse },
  { title: "WH Inbound", path: "/warehouse/inbound", icon: Package },
  { title: "WH Staging", path: "/warehouse/staging", icon: Layers3 },
  { title: "WH Storage", path: "/warehouse/storage", icon: Archive },
  { title: "WH Outbound", path: "/warehouse/outbound", icon: Truck },
  { title: "WH QR Scanner", path: "/warehouse/qr", icon: QrCode },
  { title: "Admin & HR Portal", path: "/admin-hr", icon: Users },
  { title: "HR Employees", path: "/admin-hr/employees", icon: Briefcase },
  { title: "HR Approvals", path: "/admin-hr/approvals", icon: ClipboardCheck },
  { title: "Admin Controls", path: "/admin-hr/admin", icon: BadgeCheck },
  { title: "HR Reports", path: "/admin-hr/reports", icon: BarChart3 },
  { title: "Deliverymen", path: "/deliverymen", icon: Truck },
  { title: "Financial Center", path: "/finance", icon: DollarSign },
];

const systemNav: NavItem[] = [
  { title: "Waybill", path: "/waybill", icon: FileText },
  { title: "Reporting", path: "/reporting", icon: BarChart3 },
  { title: "Settings", path: "/settings", icon: SettingsIcon },
];

function normalizeRole(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

function mapDisplayRole(value?: string | null) {
  const normalized = normalizeRole(value);

  if (!normalized) return "USER";
  if (normalized === "SYS") return "SUPER_ADMIN";
  return normalized;
}

function pickRoleFromMetadata(user: any) {
  return (
    user?.user_metadata?.roleCode ||
    user?.user_metadata?.role_code ||
    user?.user_metadata?.app_role ||
    user?.user_metadata?.user_role ||
    user?.user_metadata?.role ||
    ""
  );
}

function displayName(user: any, profileName?: string | null) {
  return (
    profileName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Unknown User"
  );
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="mt-5">
      <div className="px-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
        {title}
      </div>

      <SidebarMenu className="mt-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.path || pathname.startsWith(`${item.path}/`);

          return (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                  "h-11 rounded-xl text-slate-800 hover:bg-sky-50 hover:text-sky-900 data-[active=true]:bg-sky-600 data-[active=true]:text-white",
                  "font-semibold"
                )}
              >
                <Link to={item.path} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resolvedRole, setResolvedRole] = useState("USER");
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  const userId = user?.id;

  useEffect(() => {
    let active = true;

    async function resolveIdentity() {
      const metaRole = pickRoleFromMetadata(user);
      const metaName =
        user?.user_metadata?.full_name || user?.user_metadata?.name || null;

      if (metaRole) {
        if (!active) return;
        setResolvedRole(mapDisplayRole(metaRole));
        setResolvedName(metaName);
        return;
      }

      if (!userId) {
        if (!active) return;
        setResolvedRole("USER");
        setResolvedName(metaName);
        return;
      }

      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, role, role_code, app_role, user_role")
          .eq("id", userId)
          .maybeSingle();

        if (!active) return;

        const profileRole =
          data?.role_code || data?.app_role || data?.user_role || data?.role;

        setResolvedRole(mapDisplayRole(profileRole));
        setResolvedName(data?.full_name || metaName);
      } catch {
        if (!active) return;
        setResolvedRole("USER");
        setResolvedName(metaName);
      }
    }

    void resolveIdentity();

    return () => {
      active = false;
    };
  }, [user, userId]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  const shownName = useMemo(
    () => displayName(user, resolvedName),
    [user, resolvedName]
  );

  return (
    <UISidebar className={className} variant="inset" collapsible="offcanvas">
      <SidebarHeader className="border-b border-slate-200 bg-white/90 p-3">
        <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] px-4 py-4 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-700">
            Enterprise Suite
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900">
            Britium Operations
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white px-3 py-3 overflow-y-auto">
        <NavSection title="Core" items={coreNav} pathname={location.pathname} />
        <NavSection title="Portals" items={portalNav} pathname={location.pathname} />
        <NavSection title="System" items={systemNav} pathname={location.pathname} />
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="bg-white p-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <div>Signed in as</div>
          <div className="mt-1 truncate font-bold text-slate-900">{shownName}</div>
          <div className="mt-1 truncate text-[11px] text-slate-500">{user?.email || "-"}</div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">
            Role: {resolvedRole}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </SidebarFooter>

      <SidebarRail />
    </UISidebar>
  );
}

export default Sidebar;