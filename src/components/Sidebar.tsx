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

export type NavItem = {
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

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Supervisor', path: '/supervisor', icon: Users, roles: ['super-admin', 'admin', 'supervisor'] },
  { title: 'Wayplan', path: '/wayplan', icon: Waypoints, roles: ['super-admin', 'admin', 'branch-office', 'wayplan'] },
  { title: 'Driver', path: '/driver', icon: Truck, roles: ['super-admin', 'admin', 'driver'] },
  { title: 'Rider', path: '/rider', icon: Bike, roles: ['super-admin', 'admin', 'branch-office', 'rider'] },
  { title: 'Warehouse', path: '/warehouse', icon: Warehouse, roles: ['super-admin', 'admin', 'branch-office', 'warehouse-staff'] },
  { title: 'Data Entry', path: '/data-entry', icon: Database, roles: ['super-admin', 'admin', 'branch-office', 'data-entry'] },
  { title: 'Customer Service', path: '/customer-service', icon: Headset, roles: ['super-admin', 'admin', 'branch-office', 'customer-service'] },
  { title: 'Marketing', path: '/marketing', icon: Megaphone, roles: ['super-admin', 'admin', 'marketing'] },
  { title: 'HR', path: '/hr', icon: Users, roles: ['super-admin', 'admin', 'hr'] },
  { title: 'Finance', path: '/finance', icon: BarChart3, roles: ['super-admin', 'admin', 'branch-office', 'finance'] },
  { title: 'Merchant', path: '/merchant', icon: Store, roles: ['super-admin', 'admin', 'merchant'] },
  { title: 'Customer', path: '/customer', icon: UserRound, roles: ['super-admin', 'admin', 'customer'] },
  { title: 'Create Delivery', path: '/create-delivery', icon: FilePlus2, roles: ['super-admin', 'admin', 'branch-office'] },
  { title: 'Branch Office', path: '/branch-office', icon: Building2, roles: ['super-admin', 'admin', 'branch-office'] },
  { title: 'QR Code', path: '/qr-code', icon: QrCode, roles: ['super-admin', 'admin', 'branch-office'] },
  { title: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['super-admin', 'admin', 'branch-office', 'finance'] },
  { title: 'Master Data', path: '/master-data', icon: Package, roles: ['super-admin', 'admin'] },
  { title: 'Settings', path: '/settings', icon: Settings2 },
];

export const normalizeRole = (role?: string | null) =>
  String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');

export function isPrivilegedRole(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'super-admin' || normalizedRole === 'admin';
}

export function canRoleAccessNavItem(role: string | null | undefined, item: NavItem | null | undefined) {
  if (!item) return true;
  if (isPrivilegedRole(role)) return true;
  if (!item.roles || item.roles.length === 0) return true;

  return item.roles.map(normalizeRole).includes(normalizeRole(role));
}

export function findNavItemForPath(pathname: string) {
  const normalizedPath = pathname || '/dashboard';

  return [...NAV_ITEMS]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => normalizedPath === item.path || normalizedPath.startsWith(item.path + '/'));
}

export function getVisibleNavItems(role?: string | null) {
  return NAV_ITEMS.filter((item) => canRoleAccessNavItem(role, item));
}

const prettifyRole = (role?: string | null) =>
  String(role || 'authenticated-user')
    .replace(/_/g, '-')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function Sidebar({
  collapsed = false,
  mobile = false,
  onNavigate,
}: SidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();

  const role = normalizeRole(profile?.role);
  const showText = mobile || !collapsed;
  const items = getVisibleNavItems(role);

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className="flex h-16 items-center border-b border-slate-800 px-4">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className={[
            'flex min-w-0 items-center gap-3 rounded-2xl px-1 py-1 text-slate-100 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400',
            !showText ? 'justify-center' : '',
          ].join(' ')}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500 text-lg font-black text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-300/40">
            BX
          </div>

          {showText ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-black uppercase tracking-[0.16em] text-white">
                Britium Express
              </div>
              <div className="truncate text-xs font-medium text-slate-400">
                Logistics Portal
              </div>
            </div>
          ) : null}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
              title={!showText ? item.title : undefined}
              className={[
                'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-cyan-400',
                active
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-950/40'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
                !showText ? 'justify-center px-2' : '',
              ].join(' ')}
            >
              <Icon
                className={[
                  'h-5 w-5 shrink-0',
                  active ? 'text-white' : 'text-slate-400 group-hover:text-cyan-200',
                ].join(' ')}
              />
              {showText ? <span className="truncate">{item.title}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div
          className={[
            'flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-3',
            !showText ? 'justify-center px-2' : '',
          ].join(' ')}
        >
          <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-300" />
          {showText ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {prettifyRole(profile?.role)}
              </div>
              <div className="truncate text-xs text-slate-400">
                Access controlled by role
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
