import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, useReducedMotion, Easing } from 'react-native-reanimated';
import { useFlint, EASE_IN_OUT } from '@/lib/useFlint';

export type TimelineStep = {
    label: string;
    sublabel?: string;
    done: boolean;
    active?: boolean;
};

type Props = {
    steps: TimelineStep[];
};

// Flat connected-line stepper — replaces ClayTimeline's raised-node
// look. The active step's dot gets a slow pulsing ring (see
// docs/design/Flint-Motion-Spec.md: ambient status indicator, not
// feedback to an action — deliberately slow/subtle, and the one
// looping animation that must fully disable under reduced motion).
export function Timeline({ steps }: Props) {
    const C = useFlint();

    return (
        <View>
            {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                return (
                    <View key={i} style={styles.row}>
                        <View style={styles.track}>
                            <StepDot step={step} index={i} />
                            {!isLast && (
                                <View style={[styles.line, { backgroundColor: step.done ? C.accent : C.card2 }]} />
                            )}
                        </View>
                        <View style={[styles.labelWrap, isLast && styles.labelLast]}>
                            <Text
                                style={[
                                    styles.label,
                                    { color: step.active ? C.accent : step.done ? C.text : C.muted },
                                ]}
                            >
                                {step.label}
                            </Text>
                            {step.sublabel && <Text style={[styles.sublabel, { color: C.muted }]}>{step.sublabel}</Text>}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

function StepDot({ step, index }: { step: TimelineStep; index: number }) {
    const C = useFlint();
    const reducedMotion = useReducedMotion();
    const ring = useSharedValue(0);

    useEffect(() => {
        if (!step.active || step.done || reducedMotion) return;
        ring.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.bezier(...EASE_IN_OUT) }), -1, true);
    }, [step.active, step.done, reducedMotion]);

    const ringStyle = useAnimatedStyle(() => ({
        opacity: step.active && !step.done && !reducedMotion ? 0.35 + ring.value * 0.35 : 0,
        transform: [{ scale: 1 + ring.value * 0.25 }],
    }));

    return (
        <View style={styles.dotWrap}>
            {step.active && !step.done && (
                <Animated.View style={[styles.ring, { backgroundColor: C.accentDim }, ringStyle]} />
            )}
            <View
                style={[
                    styles.dot,
                    { backgroundColor: step.done ? C.accent : C.card2 },
                ]}
            >
                {step.done ? (
                    <Check size={12} color={C.onAccent} strokeWidth={3} />
                ) : (
                    <Text style={{ fontSize: 10, fontWeight: '700', color: step.active ? C.accent : C.muted }}>
                        {index + 1}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    track: { alignItems: 'center', width: 28 },
    dotWrap: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    ring: { position: 'absolute', width: 28, height: 28, borderRadius: 14 },
    line: { width: 2, flex: 1, minHeight: 22, marginTop: 2 },
    labelWrap: { flex: 1, paddingLeft: 10, paddingBottom: 16, paddingTop: 1 },
    labelLast: { paddingBottom: 2 },
    label: { fontSize: 15, fontWeight: '500' },
    sublabel: { fontSize: 13, marginTop: 2, fontWeight: '500' },
});
