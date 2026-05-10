import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { signIn, signUp, signOut } from "@/lib/auth-client";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  systemRole?: string;
  companyId?: string;
  companyRole?: string;
  departmentId?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  clearError: () => void;
  fetchSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await signIn.email({
            email,
            password,
          });

          if (result.error) {
            set({ isLoading: false, error: result.error.message || "Login failed" });
            return;
          }

          await get().fetchSession();
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: err instanceof Error ? err.message : "Login failed" });
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await signUp.email({
            name,
            email,
            password,
          });

          if (result.error) {
            set({ isLoading: false, error: result.error.message || "Registration failed" });
            return;
          }

          await get().fetchSession();
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: err instanceof Error ? err.message : "Registration failed" });
        }
      },

      logout: async () => {
        try {
          await signOut();
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: true }),
      clearError: () => set({ error: null }),

      fetchSession: async () => {
        try {
          const response = await fetch("/api/auth/get-session", {
            credentials: "include",
          });
          if (response.ok) {
            const session = await response.json();
            if (session?.user) {
              set({
                user: {
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.name,
                  avatar: session.user.image || undefined,
                  systemRole: session.user.systemRole,
                  companyId: session.user.companyId,
                  companyRole: session.user.companyRole,
                },
                isAuthenticated: true,
              });
            } else {
              set({ user: null, isAuthenticated: false });
            }
          } else if (response.status === 401) {
            set({ user: null, isAuthenticated: false });
          }
        } catch {
          /* keep existing session state on transient errors */
        }
      },
    }),
    { name: "agency-erp-auth" }
  )
);
