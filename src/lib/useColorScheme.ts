import { useColorScheme as useSystemColorScheme } from "react-native";
import useThemeStore from "./state/theme-store";

export function useColorScheme(): "light" | "dark" {
  const systemColorScheme = useSystemColorScheme();
  const themeMode = useThemeStore((s) => s.themeMode);

  if (themeMode === "system") {
    return (systemColorScheme ?? "light") as "light" | "dark";
  }

  return themeMode;
}
