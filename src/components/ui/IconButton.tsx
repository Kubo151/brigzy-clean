import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlint, EASE_OUT } from '@/lib/useFlint';

// ─────────────────────────────────────────────────────────────
// IconButton — circular icon action, optionally with a label
// underneath. New in Flint v3, modeled on Revolut's Home quick
// actions (Add money / Move / Details / More). Use for a row of
// 3–4 primary actions (wallet, booking hub), not as a generic
// button replacement.
// ─────────────────────────────────────────────────────────────

type Props = {
    icon: React.ReactNode;
    label?: string;
    onPress?: () => void;
    /** Accent-filled instead of the neutral card2 fill — use sparingly (one per screen at most). */
    accent?: boolean;
    size?: number;
};

export function IconButton({ icon, label, onPress, accent, size = 56 }: Props) {
    const C = useFlint();
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const onPressIn = () => {
        scale.value = withTiming(0.92, { duration: 140, easing: Easing.bezier(...EASE_OUT) });
    };
    const onPressOut = () => {
        scale.value = withTiming(1, { duration: 140, easing: Easing.bezier(...EASE_OUT) });
    };
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    return (
        <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ alignItems: 'center', gap: 8, flex: 1 }}>
            <Animated.View
                style={[
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: accent ? C.accent : C.card2,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    animStyle,
                ]}
            >
                {icon}
            </Animated.View>
            {label && (
                <View>
                    <Text style={{ fontSize: 11.5, fontWeight: '600', color: C.text, textAlign: 'center' }}>{label}</Text>
                </View>
            )}
        </Pressable>
    );
}
