import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import api from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("brightloop_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("brightloop_token")
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("brightloop_token", newToken);
    localStorage.setItem("brightloop_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("brightloop_token");
    localStorage.removeItem("brightloop_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get("/auth/me");
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem("brightloop_user", JSON.stringify(res.data.data));
      }
    } catch {
      // Token might be invalid
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        isLoading,
        loading: isLoading,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

