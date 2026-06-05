import { useColorScheme } from 'react-native';
import useThemeStore from '@/lib/state/theme-store';

// ─────────────────────────────────────────────────────────────
// CLAYMORPHISM TOKENS — Purple Clay (light) + Dark Clay (dark)
// Ported 1:1 from docs/design/claymorphism-mockups.html (v3).
// These are the design-approved tokens. `sd` = shadow-dark,
// `sl` = shadow-light, `cHi`/`cLo` = surface gradient stops,
// `hair` = rim-light hairline border.
// ─────────────────────────────────────────────────────────────

export type ShadowSpec = {
    color: string;
    offset: { width: number; height: number };
    opacity: number;
    radius: number;
};

export type ClayColors = {
    // base
    bg: string;
    cHi: string;
    cLo: string;
    // shadows (for the dual-shadow clay surfaces)
    sd: string;
    sl: string;
    darkShadow: ShadowSpec;   // bottom-right (depth)
    lightShadow: ShadowSpec;  // top-left (rim light) — iOS only
    elevation: number;        // Android fallback
    // hairline rim borders
    hair: string;
    hairIn: string;
    // accent (brand)
    accent: string;
    accent2: string;
    accentDim: string;
    accentSd: string;
    accentGlow: string;
    onAccent: string;
    accentShadow: ShadowSpec;
    // text
    text: string;
    muted: string;
    // map
    mapBg: string;
    mapLine: string;
    mapHi: string;
    // semantic
    green: string;
    greenDim: string;
    red: string;
    sosFrom: string;
    sosTo: string;
    star: string;
    verified: string;
    // meta
    isLight: boolean;
};

// ─── PURPLE CLAY (LIGHT) ─────────────────────────────
const PURPLE_CLAY: ClayColors = {
    bg: '#ECE9F5',
    cHi: '#F8F6FD',
    cLo: '#ECE9F6',
    sd: '#C9C3DF',
    sl: '#FFFFFF',
    darkShadow: { color: '#B9B1D6', offset: { width: 6, height: 7 }, opacity: 0.9, radius: 10 },
    lightShadow: { color: '#FFFFFF', offset: { width: -5, height: -5 }, opacity: 1, radius: 9 },
    elevation: 4,
    hair: 'rgba(255,255,255,0.7)',
    hairIn: 'rgba(255,255,255,0.45)',
    accent: '#7C3AED',
    accent2: '#9863F2',
    accentDim: '#E7DEFB',
    accentSd: 'rgba(124,58,237,0.28)',
    accentGlow: 'rgba(124,58,237,0.38)',
    onAccent: '#FFFFFF',
    accentShadow: { color: '#7C3AED', offset: { width: 3, height: 6 }, opacity: 0.32, radius: 14 },
    text: '#2A2440',
    muted: '#8C86A6',
    mapBg: '#E1DEF0',
    mapLine: 'rgba(124,58,237,0.06)',
    mapHi: 'rgba(124,58,237,0.11)',
    green: '#1FA463',
    greenDim: 'rgba(52,199,89,0.14)',
    red: '#FF3B30',
    sosFrom: '#FF6B5E',
    sosTo: '#FF3B30',
    star: '#FFB300',
    verified: '#2EA8FF',
    isLight: true,
};

// ─── DARK CLAY (DARK) ────────────────────────────────
const DARK_CLAY: ClayColors = {
    bg: '#15121E',
    cHi: '#272234',
    cLo: '#1D1928',
    sd: '#0A0810',
    sl: '#332C46',
    darkShadow: { color: '#000000', offset: { width: 6, height: 7 }, opacity: 0.55, radius: 12 },
    lightShadow: { color: '#3B3352', offset: { width: -4, height: -4 }, opacity: 0.55, radius: 9 },
    elevation: 6,
    hair: 'rgba(255,255,255,0.06)',
    hairIn: 'rgba(255,255,255,0.03)',
    accent: '#A78BFA',
    accent2: '#8B6CF0',
    accentDim: '#2C2540',
    accentSd: 'rgba(167,139,250,0.3)',
    accentGlow: 'rgba(167,139,250,0.42)',
    onAccent: '#17132A',
    accentShadow: { color: '#8B6CF0', offset: { width: 3, height: 6 }, opacity: 0.45, radius: 14 },
    text: '#F1EEFA',
    muted: '#9A91B4',
    mapBg: '#1A1626',
    mapLine: 'rgba(167,139,250,0.08)',
    mapHi: 'rgba(167,139,250,0.12)',
    green: '#34C759',
    greenDim: 'rgba(52,199,89,0.16)',
    red: '#FF453A',
    sosFrom: '#FF6B5E',
    sosTo: '#FF3B30',
    star: '#FFB300',
    verified: '#2EA8FF',
    isLight: false,
};

export function useClay(): ClayColors {
    const themeMode = useThemeStore((s) => s.themeMode);
    const systemScheme = useColorScheme();

    if (themeMode === 'light') return PURPLE_CLAY;
    if (themeMode === 'dark') return DARK_CLAY;
    // system
    return systemScheme === 'light' ? PURPLE_CLAY : DARK_CLAY;
}

export const Clay = { PURPLE_CLAY, DARK_CLAY };
