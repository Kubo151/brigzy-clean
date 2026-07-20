import React from 'react';
import { View, Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useFlint, RADIUS, EASE_OUT } from '@/lib/useFlint';

// ─────────────────────────────────────────────────────────────
// Surface — the base Flint card. Differentiates from the
// background by FILL COLOR ONLY (see ADR-0006) — never a border,
// never a shadow, unless `elevated` is explicitly set (reserved
// for content genuinely floating above other content, e.g. inside
// a Sheet — not for regular list/feed cards).
// ─────────────────────────────────────────────────────────────

type Props = {
    children?: React.ReactNode;
    radius?: number;
    /** Secondary fill (card2) instead of the primary card fill — for nested fields. */
    tone?: 'card' | 'card2';
    elevated?: boolean;
    /** Adds press-scale feedback; use for tappable cards (job cards, rows). */
    pressable?: boolean;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
};

export function Surface({ children, radius = RADIUS.lg, tone = 'card', elevated, pressable, onPress, style }: Props) {
    const C = useFlint();

    const base: ViewStyle = {
        borderRadius: radius,
        backgroundColor: tone === 'card2' ? C.card2 : C.card,
        ...(elevated
            ? {
                  shadowColor: C.shadow,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 1,
                  shadowRadius: 26,
                  elevation: C.elevation,
              }
            : null),
    };

    if (!pressable) {
        return <View style={[base, style]}>{children}</View>;
    }

    return <PressableSurface baseStyle={base} onPress={onPress} style={style}>{children}</PressableSurface>;
}

function PressableSurface({
    children,
    baseStyle,
    onPress,
    style,
}: {
    children?: React.ReactNode;
    baseStyle: ViewStyle;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}) {
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const onPressIn = () => {
        scale.value = withTiming(0.98, { duration: 180, easing: Easing.bezier(...EASE_OUT) });
    };
    const onPressOut = () => {
        scale.value = withTiming(1, { duration: 180, easing: Easing.bezier(...EASE_OUT) });
    };

    return (
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
            <Animated.View style={[baseStyle, animStyle, style]}>{children}</Animated.View>
        </Pressable>
    );
}
