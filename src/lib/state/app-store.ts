import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User, UserRole } from "../types";

interface AppStore {
  // Authentication
  isAuthenticated: boolean;
  hasCompletedRoleSelection: boolean;
  setAuthenticated: (value: boolean) => void;
  setRoleSelectionComplete: (value: boolean) => void;
  logout: () => void;

  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Role switching
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  // Saved jobs
  savedJobIds: string[];
  toggleSavedJob: (jobId: string) => Promise<void>;
  isJobSaved: (jobId: string) => boolean;

  // Applied jobs
  appliedJobIds: string[];
  addAppliedJob: (jobId: string) => void;
  hasApplied: (jobId: string) => boolean;
}

const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Authentication
      isAuthenticated: false,
      hasCompletedRoleSelection: false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setRoleSelectionComplete: (value) => set({ hasCompletedRoleSelection: value }),
      logout: () => set({
        isAuthenticated: false,
        hasCompletedRoleSelection: false,
        currentUser: null,
        currentRole: 'worker',
        savedJobIds: [],
        appliedJobIds: [],
      }),

      // User state
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // Role switching
      currentRole: 'worker',
      setCurrentRole: (role) => set({ currentRole: role }),

      // Saved jobs
      savedJobIds: [],
      toggleSavedJob: async (jobId) => {
        const state = get();
        const userId = state.currentUser?.id;

        if (!userId) {
          console.warn("Cannot save job: user not logged in");
          return;
        }

        const isSaved = state.savedJobIds.includes(jobId);

        try {
          if (isSaved) {
            // Remove from saved jobs
            const { error } = await import("@/lib/supabase").then((mod) =>
              mod.supabase
                .from("saved_jobs")
                .delete()
                .eq("user_id", userId)
                .eq("job_id", jobId)
            );

            if (error) {
              console.error("Error removing saved job:", error);
              return;
            }

            // Update local state
            set({
              savedJobIds: state.savedJobIds.filter((id) => id !== jobId),
            });
          } else {
            // Add to saved jobs
            const { error } = await import("@/lib/supabase").then((mod) =>
              mod.supabase
                .from("saved_jobs")
                .insert({
                  user_id: userId,
                  job_id: jobId,
                })
            );

            if (error) {
              console.error("Error saving job:", error);
              return;
            }

            // Update local state
            set({
              savedJobIds: [...state.savedJobIds, jobId],
            });
          }
        } catch (error) {
          console.error("Exception toggling saved job:", error);
        }
      },
      isJobSaved: (jobId) => get().savedJobIds.includes(jobId),

      // Applied jobs
      appliedJobIds: [],
      addAppliedJob: (jobId) => set((state) => ({
        appliedJobIds: state.appliedJobIds.includes(jobId)
          ? state.appliedJobIds
          : [...state.appliedJobIds, jobId],
      })),
      hasApplied: (jobId) => get().appliedJobIds.includes(jobId),
    }),
    {
      name: "brigzy-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAppStore;
