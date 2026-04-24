import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bike,
  Building2,
  Database,
  FilePlus2,
  Headset,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  QrCode,
  Settings2,
  ShieldCheck,
  Store,
  Truck,
  UserCircle2,
  Users,
  Warehouse,
  X,
  BarChart3,
  Megaphone,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

type NavItem = {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Supervisor', path: '/supervisor', icon: Users, roles: ['super-admin', 'admin', 'supervisor'] },
  { title: 'Wayplan', path: '/wayplan', icon: Map, roles: ['super-admin', 'admin', 'branch-office', 'wayplan'] },
  { title: 'Driver', path: '/driver', icon: Truck, roles: ['super-admin', 'admin', 'driver'] },
  { title: 'Rider', path: '/rider', icon: Bike, roles: ['super-admin', 'admin', 'branch-office', 'rider'] },
  { title: 'Warehouse', path: '/warehouse', icon: Warehouse, roles: ['super-admin', 'admin', 'branch-office', 'warehouse-staff'] },
  { title: 'Data Entry', path: '/data-entry', icon: Database, roles: ['super-admin', 'admin', 'branch-office', 'data-entry'] },
  { title: 'Customer Service', path: '/customer-service', icon: Headset, roles: ['super-admin', 'admin', 'branch-office', 'customer-service'] },
  { title: 'Marketing', path: '/marketing', icon: Megaphone, roles: ['super-admin', 'admin', 'marketing'] },
  { title: 'HR', path: '/hr', icon: Users, roles: ['super-admin', 'admin', 'hr'] },
  { title: 'Finance', path: '/finance', icon: BarChart3, roles: ['super-admin', 'admin', 'branch-office', 'finance'] },
  { title: 'Merchant', path: '/merchant', icon: Store, roles: ['super-admin', 'admin', 'merchant'] },
  { title: 'Create Delivery', path: '/create-delivery', icon: FilePlus2, roles: ['super-admin', 'admin', 'branch-office'] },
  { title: 'Branch Office', path: '/branch-office', icon: Building2, roles: ['super-admin', 'admin', 'branch-office'] },
  { title: 'QR Code', path: '/qr-code', icon: QrCode, roles: ['super-admin', 'admin', 'branch-office'] },
  { title: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['super-admin', 'admin', 'branch-office', 'finance'] },
  { title: 'Settings', path: '/settings', icon: Settings2 },
];

const normalizeRole = (role?: string | null) =>
  String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');

function prettifyPath(pathname: string) {
  if (pathname === '/' || pathname === '/dashboard') return 'Dashboard';

  const segment = pathname
    .split('/')
    .filter(Boolean)
    .slice(-1)[0]
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return segment || 'Workspace';
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = useMemo(() => prettifyPath(location.pathname), [location.pathname]);

  const role = normalizeRole(profile?.role);
  const showAll = role === 'super-admin' || role === 'admin';

  const items = NAV_ITEMS.filter((item) => {
    if (showAll) return true;
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(role);
  });

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email ||
    'Britium User';

  const displayRole = (profile?.role || 'authenticated-user')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const SidebarNav = (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 overflow-hidden">
          <img src="/images/logo.png" alt="Britium Express" className="h-9 w-auto shrink-0" />
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="truncate text-xs font-bold uppercase tracking-[0.22em] text-primary">
                Britium Express
              </div>
              <div className="truncate text-sm font-semibold text-foreground">
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
              onClick={() => setMobileOpen(false)}
              className={[
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                !sidebarOpen ? 'justify-center px-2' : '',
              ].join(' ')}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span className="truncate">{item.title}</span>}
            </NavLink>
          );
        })}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {displayRole}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                Access controlled by role
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className={sidebarOpen ? 'fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border lg:block' : 'fixed inset-y-0 left-0 z-40 hidden w-24 border-r border-border lg:block'}>
        {SidebarNav}
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close mobile menu overlay"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border lg:hidden">
            <div className="flex h-16 items-center justify-end border-b border-border bg-card px-3">
              <Button type="button" variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {SidebarNav}
          </div>
        </>
      )}

      <div className={sidebarOpen ? 'min-h-screen transition-[padding] duration-300 lg:pl-72' : 'min-h-screen transition-[padding] duration-300 lg:pl-24'}>
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Button type="button" variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>

              <Button type="button" variant="ghost" size="icon" onClick={() => setSidebarOpen((prev) => !prev)} className="hidden lg:inline-flex">
                <Menu className="h-5 w-5" />
              </Button>

              <div>
                <div className="text-sm font-semibold text-muted-foreground">
                  Britium Express
                </div>
                <div className="text-lg font-bold text-foreground">
                  {pageTitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <Button type="button" variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>

              <div className="hidden items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 md:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {displayRole}
                  </div>
                </div>
              </div>

              <Button type="button" variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
