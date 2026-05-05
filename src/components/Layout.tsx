import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, UserCircle2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';

function prettifyPath(pathname: string) {
  if (pathname === '/' || pathname === '/dashboard') return 'Dashboard';

  const segment = pathname
    .split('/')
    .filter(Boolean)
    .slice(-1)[0]
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return segment || 'Workspace';
}

function prettifyRole(role?: string | null) {
  return String(role || 'authenticated-user')
    .replace(/_/g, '-')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = useMemo(() => prettifyPath(location.pathname), [location.pathname]);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email ||
    'Britium User';

  const displayRole = prettifyRole(profile?.role);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800 bg-slate-950 shadow-2xl transition-[width] duration-300 lg:block',
          sidebarCollapsed ? 'w-20' : 'w-72',
        ].join(' ')}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </aside>

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Close mobile menu"
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[86vw] border-r border-slate-800 bg-slate-950 shadow-2xl lg:hidden">
            <div className="flex h-16 items-center justify-end border-b border-slate-800 px-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="text-slate-100 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      ) : null}

      <div
        className={[
          'min-h-screen transition-[padding] duration-300',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72',
        ].join(' ')}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="text-slate-700 hover:bg-slate-100 hover:text-slate-950 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed((value) => !value)}
                className="hidden text-slate-700 hover:bg-slate-100 hover:text-slate-950 lg:inline-flex"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="min-w-0">
                <div className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                  Britium Express
                </div>
                <div className="truncate text-lg font-bold text-slate-950">
                  {pageTitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                <Bell className="h-5 w-5" />
              </Button>

              <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-900 px-3 py-2 text-white shadow-md md:flex">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {displayName}
                  </div>
                  <div className="truncate text-xs text-slate-300">
                    {displayRole}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 text-slate-950 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
