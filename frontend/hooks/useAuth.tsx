"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AuthResponse, User } from "@/types";

const TOKEN_KEY = "workflex_token";
const USER_KEY = "workflex_user";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(USER_KEY);
      // Reading persisted session once on mount; localStorage is unavailable during SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {
      window.localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((data: AuthResponse) => {
    window.localStorage.setItem(TOKEN_KEY, data.accessToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      persist(data);
      router.push("/dashboard");
    },
    [persist, router],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        name,
        email,
        password,
      });
      persist(data);
      router.push("/dashboard");
    },
    [persist, router],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push("/");
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
