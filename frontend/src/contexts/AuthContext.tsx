import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, User } from "@/lib/api";

type Role = "admin" | "user";

interface AuthCtx {
  user: User | null;
  token: string | null;
  role: Role | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("auth_token") || null;
  });
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Check token validity on mount
  useEffect(() => {
    if (token) {
      authApi
        .getCurrentUser(token)
        .then((userData) => {
          setUser(userData);
          setRole(userData.role === "admin" ? "admin" : "user");
        })
        .catch(() => {
          localStorage.removeItem("auth_token");
          setToken(null);
          setUser(null);
          setRole(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { token: newToken, user: userData } = await authApi.login(email, password);
      localStorage.setItem("auth_token", newToken);
      setToken(newToken);
      setUser(userData);
      setRole(userData.role === "admin" ? "admin" : "user");
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { token: newToken, user: userData } = await authApi.register(email, password, name);
      localStorage.setItem("auth_token", newToken);
      setToken(newToken);
      setUser(userData);
      setRole(userData.role === "admin" ? "admin" : "user");
    } catch (error) {
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <Ctx.Provider value={{ user, token, role, loading, isAdmin: role === "admin", signOut, signIn, signUp }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
};
