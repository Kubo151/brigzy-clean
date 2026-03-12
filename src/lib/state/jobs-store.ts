import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Job } from "../types";

/**
 * Global jobs store - shared across all users
 * This store persists independently of user authentication
 * All posted jobs are visible to all users
 */
interface JobsStore {
  // All posted jobs (shared globally)
  globalJobs: Job[];
  addJob: (job: Job) => void;
  removeJob: (jobId: string) => void;
  getJobsByEmployer: (employerId: string) => Job[];
  incrementApplicantsCount: (jobId: string) => void;
}

const useJobsStore = create<JobsStore>()(
  persist(
    (set, get) => ({
      globalJobs: [],

      addJob: (job: Job) => {
        console.log("📝 [GlobalJobs] Adding job:", job.id, job.title);
        set((state) => ({
          globalJobs: [...state.globalJobs, job],
        }));
        console.log("✅ [GlobalJobs] Total jobs now:", get().globalJobs.length);
      },

      removeJob: (jobId: string) => {
        console.log("🗑️ [GlobalJobs] Removing job:", jobId);
        set((state) => ({
          globalJobs: state.globalJobs.filter((job) => job.id !== jobId),
        }));
      },

      getJobsByEmployer: (employerId: string) => {
        return get().globalJobs.filter((job) => job.employerId === employerId);
      },

      incrementApplicantsCount: (jobId: string) => {
        console.log("👤 [GlobalJobs] Incrementing applicants for job:", jobId);
        set((state) => ({
          globalJobs: state.globalJobs.map((job) =>
            job.id === jobId
              ? { ...job, applicantsCount: (job.applicantsCount || 0) + 1 }
              : job
          ),
        }));
        const updatedJob = get().globalJobs.find((j) => j.id === jobId);
        console.log("✅ [GlobalJobs] New applicants count:", updatedJob?.applicantsCount);
      },
    }),
    {
      name: "brigzy-global-jobs", // Separate storage key - never cleared on logout
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useJobsStore;
