import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { getDefaultRouteForRole, useAuth } from '@/contexts/AuthContext';
import {
  canRoleAccessNavItem,
  findNavItemForPath,
  normalizeRole,
} from '@/components/Sidebar';

type RoleGuardProps = {
  path?: string;
  roles?: string[];
  children: ReactNode;
  fallbackPath?: string;
};

function FullScreenLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-background text-foreground">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

function mustChangeRoute(next: string) {
  const safeNext = next.startsWith('/') && !next.startsWith('/login') && !next.startsWith('/reset-password')
    ? next
    : '/dashboard';
  return `/must-change-password?next=${encodeURIComponent(safeNext)}`;
}

export default function RoleGuard({ path, roles, children, fallbackPath }: RoleGuardProps) {
  const location = useLocation();
  const { user, profile, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (profile?.mustChangePassword && location.pathname !== '/must-change-password') {
    return <Navigate to={mustChangeRoute(location.pathname)} replace />;
  }

  const checkedPath = path || location.pathname;
  const role = normalizeRole(profile?.role);
  const navItem = roles?.length ? { roles } : findNavItemForPath(checkedPath);

  if (!canRoleAccessNavItem(navItem, role)) {
    const defaultRoute = getDefaultRouteForRole(role, false) || '/dashboard';
    return <Navigate to={fallbackPath || defaultRoute} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
