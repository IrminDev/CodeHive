import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import { AuthService } from "~/services";
import type { User, Role, Scope } from "~/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: Role) => boolean;
  hasScope: (scope: Scope) => boolean;
  hasAnyRole: (...roles: Role[]) => boolean;
  hasAnyScope: (...scopes: Scope[]) => boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    const token = AuthService.getToken();
    console.log("AuthProvider fetchUser: token =", token ? "present" : "null");
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await AuthService.getMe();
      console.log("AuthProvider fetchUser: getMe success", response.data);
      setUser(response.data);
    } catch (error) {
      console.error("AuthProvider fetchUser: getMe failed", error);
      AuthService.removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("AuthProvider: useEffect fired");
    fetchUser();
  }, [fetchUser]);

  const hasRole = useCallback(
    (role: Role) => user?.role === role,
    [user]
  );

  const hasScope = useCallback(
    (scope: Scope) => user?.scopes?.includes(scope) ?? false,
    [user]
  );

  const hasAnyRole = useCallback(
    (...roles: Role[]) => roles.some((r) => user?.role === r),
    [user]
  );

  const hasAnyScope = useCallback(
    (...scopes: Scope[]) => scopes.some((s) => user?.scopes?.includes(s) ?? false),
    [user]
  );

  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        hasRole,
        hasScope,
        hasAnyRole,
        hasAnyScope,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
