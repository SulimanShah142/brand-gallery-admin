import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAdminSession,
  saveAdminSession,
  clearAdminSession,
} from "../lib/session";

type AuthContextType = {
  isAdmin: boolean;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔒 SAFE SESSION RESTORE (prevents flicker + blank screens)
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const session = await getAdminSession();

        if (!mounted) return;

        setIsAdmin(!!session);
      } catch (err) {
        console.log("Session restore error:", err);
        setIsAdmin(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  // 🔐 LOGIN (lightweight + safe)
  const login = async (u: string, p: string) => {
    try {
      const email = u.trim().toLowerCase();
      const password = p.trim();

      // your current hardcoded admin
      if (
        email === "muzamilmohammadi215@gmail.com" &&
        password === "M12345678"
      ) {
        await saveAdminSession("dummy-admin-token");
        setIsAdmin(true);
        return true;
      }

      return false;
    } catch (err) {
      console.log("Login error:", err);
      return false;
    }
  };

  // 🚪 LOGOUT
  const logout = async () => {
    try {
      await clearAdminSession();
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 🔒 SAFE HOOK (THIS FIXES YOUR BLANK SCREEN CRASH)
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>. Check your app layout."
    );
  }

  return ctx;
}