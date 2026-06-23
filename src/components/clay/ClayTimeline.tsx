import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useClay } from '@/lib/useClay';

export type TimelineStep = {
    label: string;
    sublabel?: string;
    done: boolean;
    active?: boolean;
};

type Props = {
    steps: TimelineStep[];
};

export function ClayTimeline({ steps }: Props) {
    const C = useClay();

    return (
        <View style={styles.container}>
            {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                const dotColor = step.done ? C.green : step.active ? C.accent : C.muted;

                return (
                    <View key={i} style={styles.row}>
                        {/* Left: dot + connecting line */}
                        <View style={styles.track}>
                            <View style={[
                                styles.dot,
                                { borderColor: dotColor, backgroundColor: step.done ? dotColor : 'transparent' },
                                step.active && !step.done && { backgroundColor: C.accentDim },
                            ]}>
                                {step.done && <Check size={10} color={C.bg} strokeWidth={3} />}
                                {step.active && !step.done && (
                                    <View style={[styles.activePulse, { backgroundColor: C.accent }]} />
                                )}
                            </View>
                            {!isLast && (
                                <View style={[styles.line, { backgroundColor: step.done ? C.green : C.hair }]} />
                            )}
                        </View>

                        {/* Right: label */}
                        <View style={[styles.labelWrap, isLast && styles.labelLast]}>
                            <Text style={[
                                styles.label,
                                { color: step.active ? C.accent : step.done ? C.text : C.muted },
                                step.active && styles.labelActive,
                            ]}>
                                {step.label}
                            </Text>
                            {step.sublabel && (
                                <Text style={[styles.sublabel, { color: C.muted }]}>{step.sublabel}</Text>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 0 },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    track: { alignItems: 'center', width: 28 },
    dot: {
        width: 22, height: 22, borderRadius: 11, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
    },
    activePulse: { width: 8, height: 8, borderRadius: 4 },
    line: { width: 2, flex: 1, minHeight: 24, marginVertical: 2 },
    labelWrap: { flex: 1, paddingLeft: 10, paddingBottom: 20, paddingTop: 2 },
    labelLast: { paddingBottom: 4 },
    label: { fontSize: 14, fontWeight: '600' },
    labelActive: { fontWeight: '800' },
    sublabel: { fontSize: 12, marginTop: 2, fontWeight: '500' },
});
