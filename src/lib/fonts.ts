import React from 'react';
import { Text, StyleSheet } from 'react-native';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

// ─────────────────────────────────────────────────────────────
// Global Inter wiring (Flint design system — see ADR-0006).
// @expo-google-fonts ships each weight as a *separate* font family,
// so `fontWeight: '700'` alone won't switch to the bold cut. We
// load all weights, then monkeypatch <Text> to pick the matching
// Inter family from the resolved fontWeight. This applies the
// typeface app-wide without editing any screen.
// ─────────────────────────────────────────────────────────────

export const INTER_FONTS = {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
};

const FAMILY_BY_WEIGHT: Record<string, string> = {
    '100': 'Inter_400Regular',
    '200': 'Inter_400Regular',
    '300': 'Inter_400Regular',
    '400': 'Inter_400Regular',
    normal: 'Inter_400Regular',
    '500': 'Inter_500Medium',
    '600': 'Inter_600SemiBold',
    '700': 'Inter_700Bold',
    bold: 'Inter_700Bold',
    '800': 'Inter_800ExtraBold',
    '900': 'Inter_800ExtraBold',
};

let patched = false;

/** Override Text rendering so every <Text> renders in the correct Inter cut. */
export function patchTextWithInter() {
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
        const family = FAMILY_BY_WEIGHT[weight] || 'Inter_400Regular';
        return React.cloneElement(origin, {
            style: [origin.props.style, { fontFamily: family, fontWeight: undefined }],
        });
    };
}
