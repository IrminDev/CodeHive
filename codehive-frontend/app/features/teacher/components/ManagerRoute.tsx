import type { ReactNode } from "react";

import { ProtectedRoute } from "~/core/components/ProtectedRoute";
import { Role, Scope } from "~/shared/types/model/User";

export function ManagerRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute roles={[Role.STUDENT, Role.TEACHER]} scopes={[Scope.CREATE_GROUP]}>
      {children}
    </ProtectedRoute>
  );
}
