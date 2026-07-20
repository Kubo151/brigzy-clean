import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, useReducedMotion, Easing } from 'react-native-reanimated';
import { useFlint, EASE_IN_OUT } from '@/lib/useFlint';

export type BookingStatus =
    | 'pending'
    | 'accepted'
    | 'in_progress'
    | 'completed'
    | 'escrow_pending'
    | 'escrow_funded'
    | 'cancelled'
    | 'disputed';

const STATUS_CONFIG: Record<
    BookingStatus,
    { labelSK: string; labelEN: string; colorKey: 'green' | 'accent' | 'muted' | 'red' | 'star'; pulse?: boolean }
> = {
    pending: { labelSK: 'Čaká', labelEN: 'Pending', colorKey: 'muted' },
    accepted: { labelSK: 'Prijatá', labelEN: 'Accepted', colorKey: 'accent', pulse: true },
    in_progress: { labelSK: 'Prebieha', labelEN: 'In progress', colorKey: 'green', pulse: true },
    completed: { labelSK: 'Hotovo', labelEN: 'Completed', colorKey: 'green' },
    escrow_pending: { labelSK: 'Platba čaká', labelEN: 'Awaiting pay', colorKey: 'star', pulse: true },
    escrow_funded: { labelSK: 'Zaplatené', labelEN: 'Funded', colorKey: 'accent', pulse: true },
    cancelled: { labelSK: 'Zrušená', labelEN: 'Cancelled', colorKey: 'red' },
    disputed: { labelSK: 'Spor', labelEN: 'Disputed', colorKey: 'red' },
};

type Props = {
    status: BookingStatus;
    lang?: 'sk' | 'en';
    size?: 'sm' | 'md';
};

export function StatusPill({ status, lang = 'sk', size = 'md' }: Props) {
    const C = useFlint();
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const label = lang === 'sk' ? cfg.labelSK : cfg.labelEN;
    const color = C[cfg.colorKey] as string;
    const tintBg = cfg.colorKey === 'muted' ? C.card2 : color + (C.isLight ? '1f' : '33');

    return (
        <View style={[styles.pill, { backgroundColor: tintBg }, size === 'sm' && styles.sm]}>
            <StatusDot color={color} pulse={cfg.pulse} />
            <Text style={[styles.label, { color }, size === 'sm' && styles.labelSm]}>{label}</Text>
        </View>
    );
}

function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
    const reducedMotion = useReducedMotion();
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (!pulse || reducedMotion) return;
        opacity.value = withRepeat(
            withTiming(0.35, { duration: 900, easing: Easing.bezier(...EASE_IN_OUT) }),
            -1,
            true,
        );
    }, [pulse, reducedMotion]);

    const animStyle = useAnimatedStyle(() => ({ opacity: pulse && !reducedMotion ? opacity.value : 1 }));

    return <Animated.View style={[styles.dot, { backgroundColor: color }, animStyle]} />;
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        alignSelf: 'flex-start',
    },
    sm: { paddingHorizontal: 8, paddingVertical: 3 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    label: { fontSize: 12.5, fontWeight: '700', letterSpacing: 0.1 },
    labelSm: { fontSize: 11 },
});
