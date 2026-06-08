import React from 'react';
import { View, Platform, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useClay } from '@/lib/useClay';

// ─────────────────────────────────────────────────────────────
// ClaySurface — the base raised claymorphism panel.
// Renders a 145° gradient face with a dual soft shadow:
//   • iOS: two stacked shadow-casting layers (dark = depth,
//     light = top-left rim) — RN allows one shadow per view, so
//     we layer two views (the standard neumorphism trick).
//   • Android: single elevation (R-12 — light shadow faked away).
// A hairline rim-light border completes the "expensive soft-UI" look.
// ─────────────────────────────────────────────────────────────

type Props = {
    children?: React.ReactNode;
    radius?: number;
    style?: StyleProp<ViewStyle>;
    /** contentStyle controls inner padding / layout */
    contentStyle?: StyleProp<ViewStyle>;
};

export function ClaySurface({ children, radius = 22, style, contentStyle }: Props) {
    const C = useClay();
    const isIOS = Platform.OS === 'ios';

    return (
        <View style={[{ borderRadius: radius }, style]}>
            {/* iOS: light rim-light shadow layer (top-left) */}
            {isIOS && (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            borderRadius: radius,
                            backgroundColor: C.cLo,
                            shadowColor: C.lightShadow.color,
                            shadowOffset: C.lightShadow.offset,
                            shadowOpacity: C.lightShadow.opacity,
                            shadowRadius: C.lightShadow.radius,
                        },
                    ]}
                />
            )}
            {/* dark depth shadow layer (also carries Android elevation) */}
            <View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        borderRadius: radius,
                        backgroundColor: C.cLo,
                        ...Platform.select({
                            ios: {
                                shadowColor: C.darkShadow.color,
                                shadowOffset: C.darkShadow.offset,
                                shadowOpacity: C.darkShadow.opacity,
                                shadowRadius: C.darkShadow.radius,
                            },
                            android: { elevation: C.elevation },
                        }),
                    },
                ]}
            />
            {/* gradient face + rim-light hairline */}
            <LinearGradient
                colors={[C.cHi, C.cLo]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={[
                    StyleSheet.absoluteFill,
                    { borderRadius: radius, borderWidth: 1, borderColor: C.hair },
                ]}
            />
            {/* content */}
            <View style={contentStyle}>{children}</View>
        </View>
    );
}

// ─── ClayInset — "pressed" recessed element (fields, bars) ───
export function ClayInset({ children, radius = 14, style, contentStyle }: Props) {
    const C = useClay();
    return (
        <View
            style={[
                {
                    borderRadius: radius,
                    backgroundColor: C.cLo,
                    borderWidth: 1,
                    borderColor: C.hairIn,
                    // approximate inset depth with an inner top hairline + subtle border
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <LinearGradient
                colors={[C.sd, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.35, y: 0.35 }}
                style={[StyleSheet.absoluteFill, { opacity: C.isLight ? 0.5 : 0.6 }]}
                pointerEvents="none"
            />
            <View style={contentStyle}>{children}</View>
        </View>
    );
}
