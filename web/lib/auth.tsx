"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface User {
  _id: string;
  email: string;
  name: string;
  orgId: string;
  orgName: string;
  orgCode: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUpWithOrg: (email: string, name: string, password: string, orgName: string) => Promise<void>;
  signUpJoinOrg: (email: string, name: string, password: string, orgCode: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";

// Helper to get token from localStorage (client-side only)
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize token from localStorage synchronously to avoid flash
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  const signInMutation = useMutation(api.auth.signIn);
  const signUpWithOrgMutation = useMutation(api.auth.signUpWithOrg);
  const signUpJoinOrgMutation = useMutation(api.auth.signUpJoinOrg);
  const signOutMutation = useMutation(api.auth.signOut);
  const currentUser = useQuery(api.auth.getCurrentUser, { token: token ?? undefined });

  // Mark as loaded after first render
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await signInMutation({ email, password });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
  };

  const signUpWithOrg = async (email: string, name: string, password: string, orgName: string) => {
    const result = await signUpWithOrgMutation({ email, name, password, orgName });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
  };

  const signUpJoinOrg = async (email: string, name: string, password: string, orgCode: string) => {
    const result = await signUpJoinOrgMutation({ email, name, password, orgCode });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
  };

  const signOut = async () => {
    if (token) {
      await signOutMutation({ token });
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  const user = currentUser as User | null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading: isLoading || currentUser === undefined,
        signIn,
        signUpWithOrg,
        signUpJoinOrg,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
