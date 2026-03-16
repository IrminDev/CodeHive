import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AuthService } from "~/services";
import type { User, Role, Scope } from "~/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Role[];
  scopes?: Scope[];
}

export function ProtectedRoute({ children, roles, scopes }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const token = AuthService.getToken();
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await AuthService.getMe();
        if (cancelled) return;
        const me = response.data;

        if (roles && roles.length > 0 && !roles.includes(me.role)) {
          navigate(getDashboardRoute(me.role), { replace: true });
          return;
        }

        if (scopes && scopes.length > 0) {
          const userScopes = me.scopes ?? [];
          if (!scopes.some((s) => userScopes.includes(s))) {
            navigate(getDashboardRoute(me.role), { replace: true });
            return;
          }
        }

        setUser(me);
      } catch {
        AuthService.removeToken();
        navigate("/login", { replace: true });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    checkAuth();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-azure dark:text-yellow" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

function getDashboardRoute(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
}
