import { Link, NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bike,
  Building2,
  Database,
  FilePlus2,
  Headset,
  LayoutDashboard,
  Megaphone,
  Package,
  QrCode,
  Settings2,
  Store,
  Truck,
  UserRound,
  Users,
  Warehouse,
  Waypoints,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

type NavItem = {
  title: string;
  path: string;
  icon: LucideIcon;
  roles?: string[];
};

type SidebarProps = {
  collapsed?: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
};

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  {
    title: 'Supervisor',
    path: '/supervisor',
    icon: Users,
    roles: ['super-admin', 'admin', 'supervisor'],
  },
  {
    title: 'Wayplan',
    path: '/wayplan',
    icon: Waypoints,
    roles: ['super-admin', 'admin', 'branch-office'],
  },
  {
    title: 'Driver',
    path: '/driver',
    icon: Truck,
    roles: ['super-admin', 'admin', 'driver'],
  },
  {
    title: 'Rider',
    path: '/rider',
    icon: Bike,
    roles: ['super-admin', 'admin', 'branch-office', 'rider'],
  },
  {
    title: 'Warehouse',
    path: '/warehouse',
    icon: Warehouse,
    roles: ['super-admin', 'admin', 'branch-office', 'warehouse-staff'],
  },
  {
    title: 'Data Entry',
    path: '/data-entry',
    icon: Database,
    roles: ['super-admin', 'admin', 'branch-office'],
  },
  {
    title: 'Customer Service',
    path: '/customer-service',
    icon: Headset,
    roles: ['super-admin', 'admin', 'branch-office', 'customer-service'],
  },
  {
    title: 'Marketing',
    path: '/marketing',
    icon: Megaphone,
    roles: ['super-admin', 'admin', 'marketing'],
  },
  {
    title: 'HR',
    path: '/hr',
    icon: Users,
    roles: ['super-admin', 'admin', 'hr'],
  },
  {
    title: 'Finance',
    path: '/finance',
    icon: BarChart3,
    roles: ['super-admin', 'admin', 'branch-office', 'finance'],
  },
  {
    title: 'Merchant',
    path: '/merchant',
    icon: Store,
    roles: ['super-admin', 'admin', 'merchant'],
  },
  {
    title: 'Customer',
    path: '/customer',
    icon: UserRound,
    roles: ['super-admin', 'admin', 'customer'],
  },
  {
    title: 'Create Delivery',
    path: '/create-delivery',
    icon: FilePlus2,
    roles: ['super-admin', 'admin', 'branch-office'],
  },
  {
    title: 'Branch Office',
    path: '/branch-office',
    icon: Building2,
    roles: ['super-admin', 'admin', 'branch-office'],
  },
  {
    title: 'QR Code',
    path: '/qr-code',
    icon: QrCode,
    roles: ['super-admin', 'admin', 'branch-office'],
  },
  {
    title: 'Analytics',
    path: '/analytics',
    icon: BarChart3,
    roles: ['super-admin', 'admin', 'branch-office', 'finance'],
  },
  {
    title: 'Master Data',
    path: '/master-data',
    icon: Package,
    roles: ['super-admin', 'admin'],
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings2,
  },
];

const normalizeRole = (role?: string | null) =>
  String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');

export default function Sidebar({
  collapsed = false,
  mobile = false,
  onNavigate,
}: SidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();

  const role = normalizeRole(profile?.role);
  const showText = mobile || !collapsed;
  const showAll = role === 'super-admin' || role === 'admin';

  const items = NAV_ITEMS.filter((item) => {
    if (showAll) return true;
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(role);
  });

  return (
<aside className="flex h-full flex-col bg-card">
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 overflow-hidden"
        >
          {/* Text-based Logo Icon for collapsed state */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-sm">
            BX
          </div>
          
          {/* Full Text for expanded state */}
          {showText && (
            <div className="min-w-0 flex flex-col justify-center">
              <div className="truncate text-sm font-bold tracking-[0.1em] text-foreground">
                BRITIUM EXPRESS
              </div>
              <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Logistics Portal
              </div>
            </div>
          )}
        </Link>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={[
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                !showText ? 'justify-center px-2' : '',
              ].join(' ')}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {showText && <span className="truncate">{item.title}</span>}
            </NavLink>
          );
        })}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {showText && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {profile?.role ? profile.role : 'authenticated-user'}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                Access controlled by role
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}