import { getCurrentRole } from "@/lib/roleAccess";
import { canPerformAction, type AppAction } from "@/lib/rolePermissions";

export function useRoleAccess() {
  const role = getCurrentRole();

  return {
    role,
    can: (action: AppAction) => canPerformAction(action, role),
  };
}
