import React from 'react';
import { Pressable, Text, ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlint, RADIUS, EASE_OUT } from '@/lib/useFlint';

// ─────────────────────────────────────────────────────────────
// Button — flat, no gradient sheen (that was a clay-era flourish).
// Press feedback: scale(0.97) over 160ms ease-out, per
// docs/design/Flint-Motion-Spec.md. Haptic: medium for primary/
// destructive, light for secondary/ghost — same convention
// ClayButton used, just swapped to reanimated.
// ─────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type Props = {
    label: string;
    onPress?: () => void;
    variant?: Variant;
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    flex?: number;
};

export function Button({ label, onPress, variant = 'primary', disabled, icon, style, flex }: Props) {
    const C = useFlint();
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const onPressIn = () => {
        scale.value = withTiming(0.97, { duration: 160, easing: Easing.bezier(...EASE_OUT) });
    };
    const onPressOut = () => {
        scale.value = withTiming(1, { duration: 160, easing: Easing.bezier(...EASE_OUT) });
    };
    const handlePress = () => {
        if (disabled) return;
        Haptics.impactAsync(
            variant === 'primary' || variant === 'destructive'
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light,
        );
        onPress?.();
    };

    const bg =
        variant === 'primary'
            ? C.accent
            : variant === 'destructive'
              ? C.red
              : variant === 'secondary'
                ? C.card2
                : 'transparent';
    const textColor = variant === 'primary' || variant === 'destructive' ? C.onAccent : C.text;

    return (
        <Pressable
            onPress={handlePress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={disabled}
            style={flex ? { flex } : undefined}
        >
            <Animated.View
                style={[
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingVertical: 15,
                        paddingHorizontal: 18,
                        borderRadius: RADIUS.md,
                        backgroundColor: bg,
                        opacity: disabled ? 0.5 : 1,
                    },
                    animStyle,
                    style,
                ]}
            >
                {icon}
                <Text style={{ color: textColor, fontSize: 15, fontWeight: '700', letterSpacing: -0.1 }}>{label}</Text>
            </Animated.View>
        </Pressable>
    );
}
