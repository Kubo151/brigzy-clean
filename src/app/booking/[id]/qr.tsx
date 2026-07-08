import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Phone, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useClay } from '@/lib/useClay';
import { useText } from '@/lib/useText';
import { supabase } from '@/lib/supabase';
import { ClaySurface, ClayButton } from '@/components/clay';
import { goBack } from '@/lib/nav';

// W7 — worker shows a big, auto-rotating QR for the poster to scan (S6).
// The nonce refreshes silently every 60s; the worker doesn't have to do anything.

const REFRESH_MS = 60_000;

interface BookingInfo {
    id: string;
    check_in_at: string | null;
    check_out_at: string | null;
    poster: { display_name: string | null; phone: string | null } | null;
}

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

const workedLabel = (checkIn: string, checkOut?: string | null) => {
    const end = checkOut ? new Date(checkOut).getTime() : Date.now();
    const minutes = Math.max(Math.floor((end - new Date(checkIn).getTime()) / 60000), 0);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

export default function QrShowScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const C = useClay();
    const text = useText();

    const [booking, setBooking] = useState<BookingInfo | null>(null);
    const [payload, setPayload] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(60);
    const [isOffline, setIsOffline] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [now, setNow] = useState(Date.now());

    const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadBooking = useCallback(async () => {
        if (!id) return;
        const { data } = await supabase
            .from('bookings')
            .select('id, check_in_at, check_out_at, poster:poster_user_id(display_name, phone)')
            .eq('id', id)
            .maybeSingle();
        setBooking(data as unknown as BookingInfo);
    }, [id]);

    const refreshNonce = useCallback(async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase.functions.invoke('qr-nonce', {
                body: { booking_id: id },
            });
            if (error || data?.error) throw error ?? new Error(data.error);
            setPayload(data.payload);
            setIsOffline(false);
            setCountdown(60);
        } catch (e) {
            console.error('❌ [QrShow] refresh failed:', e);
            setIsOffline(true);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useFocusEffect(useCallback(() => {
        loadBooking();
        refreshNonce();
        refreshTimer.current = setInterval(refreshNonce, REFRESH_MS);
        countdownTimer.current = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
        const clockTimer = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            if (refreshTimer.current) clearInterval(refreshTimer.current);
            if (countdownTimer.current) clearInterval(countdownTimer.current);
            clearInterval(clockTimer);
        };
    }, [loadBooking, refreshNonce]));

    // Poll booking state so check-in/out (scanned by poster) reflects live
    useEffect(() => {
        const poll = setInterval(loadBooking, 4000);
        return () => clearInterval(poll);
    }, [loadBooking]);

    if (isLoading || !booking) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.accent} />
            </SafeAreaView>
        );
    }

    const isCheckedOut = !!booking.check_out_at;
    const isCheckedIn = !!booking.check_in_at && !isCheckedOut;
    const statusLabel = isCheckedOut
        ? text.checkedOutSummary
        : isCheckedIn
            ? `${text.workingSinceQr} ${formatTime(booking.check_in_at!)}`
            : text.waitingForCheckIn;

    const brigyEarned = isCheckedIn
        ? Math.floor(((now - new Date(booking.check_in_at!).getTime()) / 3600000) * 10)
        : 0;

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>{text.showQr}</Text>
                {booking.poster?.phone && (
                    <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                        style={({ pressed }) => [styles.sosBtn, { backgroundColor: C.red + '1E' }, pressed && { opacity: 0.8 }]}
                    >
                        <Phone size={15} color={C.red} strokeWidth={2.2} />
                        <Text style={[styles.sosText, { color: C.red }]}>{text.sosContact}</Text>
                    </Pressable>
                )}
            </View>

            <View style={styles.qrWrap}>
                {isCheckedOut ? (
                    <View style={styles.summaryWrap}>
                        <Text style={[styles.summaryTitle, { color: C.text }]}>{text.checkedOutSummary}</Text>
                        <Text style={[styles.summaryTime, { color: C.accent }]}>
                            {workedLabel(booking.check_in_at!, booking.check_out_at)}
                        </Text>
                    </View>
                ) : payload ? (
                    <ClaySurface radius={28} contentStyle={styles.qrCard}>
                        <QRCode value={payload} size={250} backgroundColor="#FFFFFF" color="#000000" />
                    </ClaySurface>
                ) : (
                    <ActivityIndicator size="large" color={C.accent} />
                )}
            </View>

            {!isCheckedOut && (
                <>
                    <Text style={[styles.status, { color: isCheckedIn ? C.green : C.muted }]}>{statusLabel}</Text>

                    {isCheckedIn && (
                        <View style={styles.tickerRow}>
                            <Text style={[styles.workedTime, { color: C.text }]}>
                                {workedLabel(booking.check_in_at!)}
                            </Text>
                            <View style={[styles.brigyPill, { backgroundColor: C.accentDim }]}>
                                <Zap size={13} color={C.accent} strokeWidth={2.4} />
                                <Text style={[styles.brigyText, { color: C.accent }]}>+{brigyEarned} Brigy</Text>
                            </View>
                        </View>
                    )}

                    <Text style={[styles.countdown, { color: C.muted }]}>
                        {isOffline ? text.offlineQrWarning : `${text.qrRefreshesIn} ${countdown}s`}
                    </Text>
                </>
            )}

            <ClayButton label={text.closeAction} variant="ghost" onPress={() => goBack()} style={{ marginTop: 20 }} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingVertical: 12 },
    title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
    sosBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    sosText: { fontSize: 12.5, fontWeight: '800' },
    qrWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    qrCard: { padding: 20 },
    summaryWrap: { alignItems: 'center', gap: 8 },
    summaryTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
    summaryTime: { fontSize: 32, fontWeight: '800', letterSpacing: -0.6 },
    status: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 10 },
    tickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    workedTime: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    brigyPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    brigyText: { fontSize: 12.5, fontWeight: '800' },
    countdown: { fontSize: 12.5, fontWeight: '600', marginBottom: 10 },
});
