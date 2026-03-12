import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Language } from "@/lib/texts";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeStore {
  // Theme state
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  // Settings
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  // Language
  language: Language;
  setLanguage: (language: Language) => void;
}

const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      // Theme state - default to system
      themeMode: "system",
      setThemeMode: (mode) => set({ themeMode: mode }),

      // Notifications
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      // Language - detect device language, persisted to AsyncStorage
      language: (typeof window !== 'undefined' && navigator?.language?.startsWith('sk')) ? 'sk' : 'en',
      setLanguage: (language) => {
        console.log('🌍 [ThemeStore] Setting language to:', language);
        set({ language });
      },
    }),
    {
      name: "brigzy-theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useThemeStore;
