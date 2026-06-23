import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useClay } from '@/lib/useClay';

export type BookingStatus =
    | 'pending'
    | 'accepted'
    | 'in_progress'
    | 'completed'
    | 'escrow_pending'
    | 'escrow_funded'
    | 'cancelled'
    | 'disputed';

const STATUS_CONFIG: Record<BookingStatus, { labelSK: string; labelEN: string; colorKey: 'green' | 'accent' | 'muted' | 'red' | 'star' }> = {
    pending:        { labelSK: 'Čaká',         labelEN: 'Pending',      colorKey: 'muted' },
    accepted:       { labelSK: 'Prijatá',      labelEN: 'Accepted',     colorKey: 'accent' },
    in_progress:    { labelSK: 'Prebieha',     labelEN: 'In progress',  colorKey: 'green' },
    completed:      { labelSK: 'Hotovo',       labelEN: 'Completed',    colorKey: 'green' },
    escrow_pending: { labelSK: 'Platba čaká',  labelEN: 'Awaiting pay', colorKey: 'star' },
    escrow_funded:  { labelSK: 'Zaplatené',    labelEN: 'Funded',       colorKey: 'accent' },
    cancelled:      { labelSK: 'Zrušená',      labelEN: 'Cancelled',    colorKey: 'red' },
    disputed:       { labelSK: 'Spor',         labelEN: 'Disputed',     colorKey: 'red' },
};

type Props = {
    status: BookingStatus;
    lang?: 'sk' | 'en';
    size?: 'sm' | 'md';
};

export function ClayStatusPill({ status, lang = 'sk', size = 'md' }: Props) {
    const C = useClay();
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const label = lang === 'sk' ? cfg.labelSK : cfg.labelEN;
    const color = C[cfg.colorKey] as string;

    return (
        <View style={[
            styles.pill,
            { backgroundColor: color + (C.isLight ? '22' : '33') },
            size === 'sm' && styles.sm,
        ]}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.label, { color }, size === 'sm' && styles.labelSm]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
        alignSelf: 'flex-start',
    },
    sm: { paddingHorizontal: 8, paddingVertical: 3 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    label: { fontSize: 12.5, fontWeight: '700', letterSpacing: 0.1 },
    labelSm: { fontSize: 11 },
});
