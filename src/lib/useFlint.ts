import { useColorScheme } from 'react-native';
import useThemeStore from '@/lib/state/theme-store';

// ─────────────────────────────────────────────────────────────
// FLINT TOKENS — the flat, Revolut-style design system replacing
// claymorphism. Ported 1:1 from docs/design/flint-mockups.html
// (v3, corrected against real Revolut reference screenshots) —
// see docs/adr/ADR-0006-flint-design-system.md.
//
// Key departure from useClay(): surfaces differentiate from the
// background by FILL COLOR ONLY, never a border. `shadow` /
// `accentShadow` exist for the rare cases that genuinely float
// above other content (Sheet, the tab-bar center FAB) — regular
// cards/rows must never use them (see ADR-0006's "no shadow on
// regular cards" rule).
// ─────────────────────────────────────────────────────────────

export type ShadowSpec = {
    color: string;
    offset: { width: number; height: number };
    opacity: number;
    radius: number;
};

export type FlintColors = {
    // base
    bg: string;
    card: string;
    card2: string;
    divider: string;
    // accent (brand)
    accent: string;
    accent2: string;
    onAccent: string;
    accentDim: string;
    accentShadow: ShadowSpec;
    // text
    text: string;
    muted: string;
    // elevation — reserved for Sheet / FAB only
    shadow: string;
    elevation: number;
    // semantic
    green: string;
    greenDim: string;
    red: string;
    redDim: string;
    star: string;
    verified: string;
    // meta
    isLight: boolean;
};

// ─── FLINT LIGHT ─────────────────────────────
const FLINT_LIGHT: FlintColors = {
    bg: '#FFFFFF',
    card: '#F2F2F3',
    card2: '#E8E8EB',
    divider: 'rgba(0,0,0,0.08)',
    accent: '#7C3AED',
    accent2: '#9863F2',
    onAccent: '#FFFFFF',
    accentDim: '#F0E7FD',
    accentShadow: { color: '#7C3AED', offset: { width: 0, height: 8 }, opacity: 0.28, radius: 20 },
    text: '#0A0A0A',
    muted: '#7C7C82',
    shadow: 'rgba(17,17,20,0.14)',
    elevation: 8,
    green: '#1FAA59',
    greenDim: '#E3F6EA',
    red: '#E5484D',
    redDim: '#FCEAEA',
    star: '#F5A623',
    verified: '#2E8FE0',
    isLight: true,
};

// ─── FLINT DARK (true black, not "near-black") ──
const FLINT_DARK: FlintColors = {
    bg: '#000000',
    card: '#1C1C1E',
    card2: '#2C2C2E',
    divider: 'rgba(255,255,255,0.08)',
    accent: '#A78BFA',
    accent2: '#8B6CF0',
    onAccent: '#17122A',
    accentDim: '#241C38',
    accentShadow: { color: '#A78BFA', offset: { width: 0, height: 8 }, opacity: 0.4, radius: 20 },
    text: '#FFFFFF',
    muted: '#8E8E93',
    shadow: 'rgba(0,0,0,0.7)',
    elevation: 10,
    green: '#33C46E',
    greenDim: '#0F2A1B',
    red: '#FF6B6B',
    redDim: '#341417',
    star: '#F5C043',
    verified: '#4FB2FF',
    isLight: false,
};

export function useFlint(): FlintColors {
    const themeMode = useThemeStore((s) => s.themeMode);
    const systemScheme = useColorScheme();

    if (themeMode === 'light') return FLINT_LIGHT;
    if (themeMode === 'dark') return FLINT_DARK;
    // system
    return systemScheme === 'light' ? FLINT_LIGHT : FLINT_DARK;
}

export const Flint = { FLINT_LIGHT, FLINT_DARK };

// ─── Theme-independent scale constants ──────────────────────

export const RADIUS = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const SPACE = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 } as const;

export const TYPE = {
    displayXl: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -1.4 },
    display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.6 },
    title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
    heading: { fontSize: 17, fontWeight: '600' as const, letterSpacing: 0 },
    body: { fontSize: 15, fontWeight: '500' as const, letterSpacing: 0 },
    bodyReg: { fontSize: 15, fontWeight: '400' as const, letterSpacing: 0 },
    caption: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0 },
    micro: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.7 },
} as const;

// Easing curves — see docs/design/Flint-Motion-Spec.md. Use with
// reanimated's `Easing.bezier(...)`, e.g.
// `withTiming(1, { duration: 160, easing: Easing.bezier(...EASE_OUT) })`.
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;
