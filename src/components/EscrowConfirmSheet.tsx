import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ShieldCheck, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFlint, RADIUS } from '@/lib/useFlint';
import { useText } from '@/lib/useText';
import { supabase } from '@/lib/supabase';
import { Sheet, Button } from '@/components/ui';

// S5 — escrow confirm sheet. Opens after P4 select; poster reviews the
// breakdown and funds the escrow (demo mode: simulated charge server-side).

export type EscrowBooking = {
    booking_id: string;
    amount_cents: number;
    service_fee_cents: number;
    total_cents: number;
    currency: string;
};

type Props = {
    visible: boolean;
    booking: EscrowBooking | null;
    onClose: () => void;
    /** Called after successful funding (sheet stays open showing success until dismissed) */
    onFunded: () => void;
};

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export function EscrowConfirmSheet({ visible, booking, onClose, onFunded }: Props) {
    const C = useFlint();
    const text = useText();
    const [isPaying, setIsPaying] = useState(false);
    const [isFunded, setIsFunded] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (visible) { setIsFunded(false); setErrorMsg(null); }
    }, [visible, booking?.booking_id]);

    const handlePay = async () => {
        if (!booking || isPaying) return;
        setIsPaying(true);
        setErrorMsg(null);
        try {
            const { data, error } = await supabase.functions.invoke('fund-escrow', {
                body: { booking_id: booking.booking_id },
            });
            if (error || data?.error) throw error ?? new Error(data.error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsFunded(true);
            onFunded();
        } catch (e) {
            console.error('❌ [EscrowConfirmSheet] fund failed:', e);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMsg(text.selectionFailed);
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <Sheet visible={visible} onClose={onClose} title={isFunded ? undefined : text.escrowConfirmTitle}>
            {!booking ? (
                <ActivityIndicator size="large" color={C.accent} style={{ marginVertical: 40 }} />
            ) : isFunded ? (
                <View style={styles.successWrap}>
                    <View style={[styles.successIcon, { backgroundColor: C.greenDim }]}>
                        <CheckCircle size={36} color={C.green} strokeWidth={1.8} />
                    </View>
                    <Text style={[styles.successTitle, { color: C.text }]}>{text.escrowFunded}</Text>
                    <Text style={[styles.note, { color: C.muted, textAlign: 'center' }]}>{text.escrowFundedNote}</Text>
                    <Button label={text.done} onPress={onClose} style={{ alignSelf: 'stretch', marginTop: 20 }} />
                </View>
            ) : (
                <View>
                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: C.muted }]}>{text.reward}</Text>
                        <Text style={[styles.rowValue, { color: C.text }]}>{eur(booking.amount_cents)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: C.muted }]}>{text.serviceFee}</Text>
                        <Text style={[styles.rowValue, { color: C.text }]}>{eur(booking.service_fee_cents)}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: C.divider }]} />
                    <View style={styles.row}>
                        <Text style={[styles.totalLabel, { color: C.text }]}>{text.totalToPay}</Text>
                        <Text style={[styles.totalValue, { color: C.text }]}>{eur(booking.total_cents)}</Text>
                    </View>

                    <View style={[styles.noteBox, { backgroundColor: C.accentDim }]}>
                        <ShieldCheck size={18} color={C.accent} strokeWidth={2} />
                        <Text style={[styles.note, { color: C.text, flex: 1 }]}>{text.escrowHeldNote}</Text>
                    </View>

                    {errorMsg && <Text style={[styles.error, { color: C.red }]}>{errorMsg}</Text>}

                    {isPaying ? (
                        <ActivityIndicator size="large" color={C.accent} style={{ marginVertical: 14 }} />
                    ) : (
                        <Button
                            label={`${text.payNow} · ${eur(booking.total_cents)}`}
                            onPress={handlePay}
                            style={{ marginTop: 4 }}
                        />
                    )}
                </View>
            )}
        </Sheet>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
    rowLabel: { fontSize: 14.5, fontWeight: '600' },
    rowValue: { fontSize: 15.5, fontWeight: '700' },
    divider: { height: 1, marginVertical: 8 },
    totalLabel: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
    totalValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
    noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: 14, marginTop: 16, marginBottom: 18 },
    note: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
    error: { fontSize: 13.5, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    successWrap: { alignItems: 'center', paddingTop: 10, gap: 14 },
    successIcon: { width: 72, height: 72, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
});
