import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlint, RADIUS, EASE_OUT } from '@/lib/useFlint';

// ─────────────────────────────────────────────────────────────
// Chip — filter/category pill. Flat card2 fill when unselected,
// accent fill when `active`. Replaces ClayPill (no gradient/shadow).
// ─────────────────────────────────────────────────────────────

type Props = {
    label: string;
    active?: boolean;
    onPress?: () => void;
    icon?: React.ReactNode;
    /** Override text/icon color, e.g. red for an "URGENT" chip. */
    tintColor?: string;
};

export function Chip({ label, active, onPress, icon, tintColor }: Props) {
    const C = useFlint();
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const handle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withSequence(
            withTiming(0.92, { duration: 90, easing: Easing.bezier(...EASE_OUT) }),
            withTiming(1, { duration: 160, easing: Easing.bezier(...EASE_OUT) }),
        );
        onPress?.();
    };

    const color = active ? C.onAccent : (tintColor ?? C.text);

    return (
        <Pressable onPress={handle}>
            <Animated.View
                style={[
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 13,
                        paddingVertical: 8,
                        borderRadius: RADIUS.pill,
                        backgroundColor: active ? C.accent : C.card2,
                    },
                    animStyle,
                ]}
            >
                {icon}
                <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
            </Animated.View>
        </Pressable>
    );
}
