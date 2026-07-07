import { router } from 'expo-router';

/**
 * Back navigation that also works on web: with a deep link or page refresh
 * there is no history entry, so router.back() would silently do nothing.
 * Falls back to the tab navigator (or a given route) in that case.
 */
export function goBack(fallback: string = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}
