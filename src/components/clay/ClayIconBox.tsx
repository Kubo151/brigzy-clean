import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useClay } from '@/lib/useClay';

// ─────────────────────────────────────────────────────────────
// ClayIconBox — the inset, accent-tinted icon tile used on cards,
// list rows and headers. `tint` overrides the accent (e.g. green
// for "done", red for SOS). Pass the icon as a child.
// ─────────────────────────────────────────────────────────────

type Props = {
    children: React.ReactNode;
    size?: number;
    radius?: number;
    tintBg?: string;
    style?: StyleProp<ViewStyle>;
};

export function ClayIconBox({ children, size = 44, radius = 14, tintBg, style }: Props) {
    const C = useClay();
    return (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: radius,
                    backgroundColor: tintBg ?? C.accentDim,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            {/* inset top-left shadow hint */}
            <LinearGradient
                colors={[C.sd, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
                style={[StyleSheet.absoluteFill, { opacity: C.isLight ? 0.35 : 0.5 }]}
                pointerEvents="none"
            />
            {children}
        </View>
    );
}
