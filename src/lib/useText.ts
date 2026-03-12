import useThemeStore from '@/lib/state/theme-store';
import { getTexts } from '@/lib/texts';

/**
 * Hook that returns all text strings for the current language.
 * Automatically re-renders when language changes.
 */
export function useText() {
  // Subscribe to language changes - triggers re-render when language changes
  const language = useThemeStore((s) => s.language);

  // Return text map for current language
  return getTexts(language);
}

export default useText;
