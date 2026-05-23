/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TOKEN_KEY } from "@/lib/api";
import { decodeJwt, type JwtPayload, type Role } from "@/lib/jwt";

interface AuthContextValue {
  token: string | null;
  user: JwtPayload | null;
  role: Role | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const user = useMemo(() => (token ? decodeJwt(token) : null), [token]);
  const role = (user?.role as Role | undefined) ?? null;

  // Auto-logout on token expiry
  useEffect(() => {
    if (!user?.exp) return;
    const ms = user.exp * 1000 - Date.now();
    if (ms <= 0) {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    const t = setTimeout(() => {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
    }, ms);
    return () => clearTimeout(t);
  }, [user?.exp]);

  const login = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const value: AuthContextValue = {
    token,
    user,
    role,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
