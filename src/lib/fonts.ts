import React from 'react';
import { Text, StyleSheet } from 'react-native';
import {
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

// ─────────────────────────────────────────────────────────────
// Global Manrope wiring.
// @expo-google-fonts ships each weight as a *separate* font family,
// so `fontWeight: '700'` alone won't switch to the bold cut. We
// load all weights, then monkeypatch <Text> to pick the matching
// Manrope family from the resolved fontWeight. This applies the
// typeface app-wide without editing any screen.
// ─────────────────────────────────────────────────────────────

export const MANROPE_FONTS = {
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
};

const FAMILY_BY_WEIGHT: Record<string, string> = {
    '100': 'Manrope_400Regular',
    '200': 'Manrope_400Regular',
    '300': 'Manrope_400Regular',
    '400': 'Manrope_400Regular',
    normal: 'Manrope_400Regular',
    '500': 'Manrope_500Medium',
    '600': 'Manrope_600SemiBold',
    '700': 'Manrope_700Bold',
    bold: 'Manrope_700Bold',
    '800': 'Manrope_800ExtraBold',
    '900': 'Manrope_800ExtraBold',
};

let patched = false;

/** Override Text rendering so every <Text> renders in the correct Manrope cut. */
export function patchTextWithManrope() {
    if (patched) return;
    patched = true;

    const TextAny = Text as any;
    const originalRender = TextAny.render;
    if (typeof originalRender !== 'function') return;

    TextAny.render = function patchedRender(...args: any[]) {
        const origin = originalRender.apply(this, args);
        const flat = StyleSheet.flatten(origin.props?.style) || {};
        // Respect an explicit fontFamily if a caller set one.
        if (flat.fontFamily) return origin;
        const weight = flat.fontWeight != null ? String(flat.fontWeight) : '400';
        const family = FAMILY_BY_WEIGHT[weight] || 'Manrope_400Regular';
        return React.cloneElement(origin, {
            style: [origin.props.style, { fontFamily: family, fontWeight: undefined }],
        });
    };
}
