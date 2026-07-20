import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useFlint } from '@/lib/useFlint';

// ─────────────────────────────────────────────────────────────
// ListRow — icon + label + trailing (chevron/value/custom) row.
// Meant to be used as repeated children inside a single `Surface`
// with `Divider` between them (the "grouped menu card" pattern
// from the Revolut reference — see flint-mockups.html screens
// 8/9). Not a standalone card itself.
// ─────────────────────────────────────────────────────────────

type Props = {
    icon?: React.ReactNode;
    label: string;
    /** Trailing value text (e.g. "Slovenčina") shown before the chevron. */
    value?: string;
    /** Custom trailing element (e.g. a Switch) — replaces the chevron. */
    trailing?: React.ReactNode;
    onPress?: () => void;
    danger?: boolean;
};

export function ListRow({ icon, label, value, trailing, onPress, danger }: Props) {
    const C = useFlint();

    const content = (
        <View style={styles.row}>
            {icon && (
                <View style={[styles.icon, { backgroundColor: C.card2 }]}>{icon}</View>
            )}
            <Text style={[styles.label, { color: danger ? C.red : C.text }]}>{label}</Text>
            {value && <Text style={[styles.value, { color: C.muted }]}>{value}</Text>}
            {trailing ?? (onPress ? <ChevronRight size={16} color={C.muted} /> : null)}
        </View>
    );

    if (!onPress) return content;
    return <Pressable onPress={onPress}>{content}</Pressable>;
}

export function Divider() {
    const C = useFlint();
    return <View style={{ height: 1, backgroundColor: C.divider }} />;
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16 },
    icon: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    label: { flex: 1, fontSize: 15, fontWeight: '500' },
    value: { fontSize: 13, fontWeight: '500' },
});
