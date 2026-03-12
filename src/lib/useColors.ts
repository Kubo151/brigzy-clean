import { useColorScheme } from 'react-native';
import useThemeStore from '@/lib/state/theme-store';

// ─── iOS 26 DARK PALETTE — Brigzy Purple Tint ────────
const DARK = {
    // Backgrounds
    bg: '#141420',
    surface: '#1E1E2E',
    surface2: '#2A2A3C',
    surface3: '#353548',
    cardBg: '#1E1E2E',

    // Labels
    text: '#FFFFFF',
    secondaryLabel: 'rgba(235,235,245,0.6)',
    tertiaryLabel: 'rgba(235,235,245,0.3)',
    quaternaryLabel: 'rgba(235,235,245,0.18)',
    muted: 'rgba(235,235,245,0.6)',
    muted2: 'rgba(235,235,245,0.3)',

    // Separators & Borders
    separator: 'rgba(255,255,255,0.08)',
    thinSeparator: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    cardBorder: 'rgba(255,255,255,0.06)',

    // Search
    searchFill: 'rgba(255,255,255,0.08)',

    // Glass material (tab bar, nav bar)
    glassMaterial: 'rgba(28,28,48,0.88)',
    glassBorder: 'rgba(255,255,255,0.12)',
    glassSpecular: 'rgba(255,255,255,0.15)',

    // Brand — Brigzy Purple
    purple: '#7C3AED',
    purpleLight: '#A78BFA',
    purpleDim: 'rgba(124,58,237,0.18)',
    purpleGlow: 'rgba(124,58,237,0.35)',

    // System tints
    green: '#30D158',
    red: '#FF453A',
    yellow: '#FFD60A',
    orange: '#FF9F0A',
    blue: '#0A84FF',
};

// ─── iOS 26 LIGHT PALETTE ────────────────────────────
const LIGHT = {
    // Backgrounds
    bg: '#F2F2F7',
    surface: '#FFFFFF',
    surface2: '#F2F2F7',
    surface3: '#E5E5EA',
    cardBg: '#FFFFFF',

    // Labels
    text: '#000000',
    secondaryLabel: 'rgba(60,60,67,0.6)',
    tertiaryLabel: 'rgba(60,60,67,0.3)',
    quaternaryLabel: 'rgba(60,60,67,0.18)',
    muted: 'rgba(60,60,67,0.6)',
    muted2: 'rgba(60,60,67,0.3)',

    // Separators & Borders
    separator: 'rgba(60,60,67,0.12)',
    thinSeparator: 'rgba(60,60,67,0.08)',
    border: 'rgba(60,60,67,0.12)',
    cardBorder: 'rgba(60,60,67,0.08)',

    // Search
    searchFill: 'rgba(120,120,128,0.12)',

    // Glass material
    glassMaterial: 'rgba(255,255,255,0.72)',
    glassBorder: 'rgba(0,0,0,0.06)',
    glassSpecular: 'rgba(255,255,255,0.9)',

    // Brand — Brigzy Purple
    purple: '#7C3AED',
    purpleLight: '#A78BFA',
    purpleDim: 'rgba(124,58,237,0.10)',
    purpleGlow: 'rgba(124,58,237,0.20)',

    // System tints
    green: '#34C759',
    red: '#FF3B30',
    yellow: '#FF9F0A',
    orange: '#FF9500',
    blue: '#007AFF',
};

export type AppColors = typeof DARK;

export function useColors(): AppColors {
    const themeMode = useThemeStore((s) => s.themeMode);
    const systemScheme = useColorScheme();

    if (themeMode === 'light') return LIGHT;
    if (themeMode === 'dark') return DARK;
    // system
    return systemScheme === 'light' ? LIGHT : DARK;
}

// Static export for non-hook contexts (defaults to dark)
export const Colors = { DARK, LIGHT };
