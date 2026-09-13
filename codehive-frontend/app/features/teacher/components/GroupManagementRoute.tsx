import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { useAuth } from "~/core/providers/AuthProvider";
import { canManageGroups } from "~/shared/lib/group-management";
import { getDashboardRoute } from "~/shared/lib/role-routing";
import { Role } from "~/shared/types/model/User";

export function GroupManagementRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute roles={[Role.TEACHER, Role.STUDENT]}>
      <GroupManagementAccess>{children}</GroupManagementAccess>
    </ProtectedRoute>
  );
}

function GroupManagementAccess({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const allowed = canManageGroups(user);

  useEffect(() => {
    if (user && !allowed) navigate(getDashboardRoute(user.role), { replace: true });
  }, [allowed, navigate, user]);

  return allowed ? <>{children}</> : null;
}
