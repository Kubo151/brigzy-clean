import { create } from "zustand";
import { supabase } from "../supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthStore {
  // Current session
  session: Session | null;
  user: User | null;
  loading: boolean;

  // Auth methods
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    country: string,
    phoneNumber: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  getCurrentUser: () => Promise<User | null>;

  // Session management
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;

  // Initialize auth listener
  initializeAuth: () => void;
}

const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (error) {
        return {
          success: false,
          error: error.message === "Invalid login credentials"
            ? "Nesprávny email alebo heslo."
            : "Chyba pri prihlásení. Skúste to znova.",
        };
      }

      if (data.session && data.user) {
        set({ session: data.session, user: data.user, loading: false });

        // Fetch and verify user profile exists
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (!profile && profileError && profileError.code !== "PGRST116") {
          console.warn("[Auth] Profile fetch error:", profileError.code);
        }

        return { success: true };
      }

      return {
        success: false,
        error: "Chyba pri prihlásení.",
      };
    } catch (error) {
      return {
        success: false,
        error: "Chyba pri prihlásení. Skúste to znova.",
      };
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    country: string,
    phoneNumber: string
  ) => {
    try {
      set({ loading: true });

      // Validate password length
      if (password.length < 6) {
        return {
          success: false,
          error: "Heslo musí mať aspoň 6 znakov.",
        };
      }

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (authError) {
        return {
          success: false,
          error: authError.message === "User already registered"
            ? "Účet s týmto emailom už existuje."
            : "Chyba pri registrácii. Skúste to znova.",
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: "Chyba pri registrácii.",
        };
      }

      // NOTE: Profile creation is handled by the caller (login.tsx)
      // Do NOT create profile here to avoid duplicate key errors

      set({ session: authData.session, user: authData.user, loading: false });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Chyba pri registrácii. Skúste to znova.",
      };
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: "Chyba pri odhlásení.",
        };
      }

      set({ session: null, user: null, loading: false });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Chyba pri odhlásení.",
      };
    } finally {
      set({ loading: false });
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        return null;
      }

      if (user) {
        set({ user });
        return user;
      }

      return null;
    } catch (error) {
      return null;
    }
  },

  setSession: (session: Session | null) => {
    set({ session });
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  initializeAuth: () => {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        set({ session, user: session.user, loading: false });
      } else if (event === "SIGNED_OUT") {
        set({ session: null, user: null, loading: false });
      } else if (event === "TOKEN_REFRESHED" && session) {
        set({ session, user: session.user });
      } else if (event === "USER_UPDATED" && session) {
        set({ session, user: session.user });
      }
    });

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user || null, loading: false });
    });
  },
}));

export default useAuthStore;
