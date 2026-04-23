import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { canAccessPath } from "@/lib/roleAccess";

export default function RoleGuard({ path, children }: { path: string; children: React.ReactNode }) {
  const location = useLocation();
  const ok = canAccessPath(path);

  if (!ok) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
