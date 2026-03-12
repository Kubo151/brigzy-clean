import { useCallback } from 'react';
import useThemeStore from '@/lib/state/theme-store';
import { Language, getTranslation } from '@/lib/translations';

export function useI18n() {
  // Subscribe to language changes in store - this will trigger re-renders
  const language = useThemeStore((s) => s.language);
  const setLanguage = useThemeStore((s) => s.setLanguage);

  // Create translation function that uses current language
  const t = useCallback(
    (key: string): string => {
      return getTranslation(language as Language, key);
    },
    [language]
  );

  return { t, language, setLanguage };
}
