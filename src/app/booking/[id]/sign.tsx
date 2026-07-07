import React, { useCallback, useState } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, FileSignature, AlertTriangle, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useClay } from '@/lib/useClay';
import { useText } from '@/lib/useText';
import { supabase } from '@/lib/supabase';
import { ClaySurface, ClayButton, ClayIconBox, ClayInset } from '@/components/clay';

// S3 — contract preview + mock-OTP sign. Full screen per UX-Spec (not a sheet).

interface SignBooking {
    id: string;
    worker_user_id: string;
    poster_user_id: string;
    status: string;
    agreed_amount_cents: number;
    currency: string;
    job: { title: string | null; location: string | null; company_name: string | null } | null;
    worker: { display_name: string | null } | null;
    poster: { display_name: string | null } | null;
}

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export default function ContractSignScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const C = useClay();
    const text = useText();

    const [booking, setBooking] = useState<SignBooking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [otp, setOtp] = useState('');
    const [isSigning, setIsSigning] = useState(false);
    const [isSigned, setIsSigned] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('id, worker_user_id, poster_user_id, status, agreed_amount_cents, currency, job:job_id(title, location, company_name), worker:worker_user_id(display_name), poster:poster_user_id(display_name)')
                .eq('id', id)
                .maybeSingle();
            if (error) throw error;
            setBooking(data as unknown as SignBooking);
        } catch (e) {
            console.error('❌ [ContractSign] load failed:', e);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const handleSign = async () => {
        if (!booking || isSigning || otp.length < 6) return;
        setIsSigning(true);
        setErrorMsg(null);
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { data, error } = await supabase.functions.invoke('sign-contract', {
                body: { booking_id: booking.id, otp },
            });
            if (error || data?.error) throw error ?? new Error(data.error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsSigned(true);
        } catch (e) {
            console.error('❌ [ContractSign] sign failed:', e);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMsg(text.signFailed);
        } finally {
            setIsSigning(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.accent} />
            </SafeAreaView>
        );
    }

    if (!booking) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{text.bookingNotFound}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={20} color={C.text} strokeWidth={2.2} />
                    </ClaySurface>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>{text.contractTitle}</Text>
            </View>

            {isSigned ? (
                <View style={styles.successWrap}>
                    <ClayIconBox size={72} radius={24}>
                        <CheckCircle size={36} color={C.green} strokeWidth={1.8} />
                    </ClayIconBox>
                    <Text style={[styles.successTitle, { color: C.text }]}>{text.done}</Text>
                    <ClayButton label={text.done} onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 16 }} />
                </View>
            ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* VZOR disclaimer */}
                    <View style={[styles.warnBox, { backgroundColor: C.star + '1E' }]}>
                        <AlertTriangle size={17} color={C.star} strokeWidth={2.2} />
                        <Text style={[styles.warnText, { color: C.text }]}>{text.contractSampleNote}</Text>
                    </View>

                    {/* Contract preview */}
                    <ClaySurface radius={20} style={{ marginBottom: 18 }} contentStyle={{ padding: 20 }}>
                        <Text style={[styles.contractHeading, { color: C.text }]}>Zmluva o dielo</Text>
                        <Text style={[styles.contractSub, { color: C.muted }]}>podľa § 631–643 Občianskeho zákonníka · VZOR</Text>

                        <View style={[styles.divider, { backgroundColor: C.hair }]} />

                        <Text style={[styles.clauseLabel, { color: C.muted }]}>Objednávateľ</Text>
                        <Text style={[styles.clauseValue, { color: C.text }]}>{booking.poster?.display_name ?? '—'}</Text>

                        <Text style={[styles.clauseLabel, { color: C.muted }]}>Zhotoviteľ</Text>
                        <Text style={[styles.clauseValue, { color: C.text }]}>{booking.worker?.display_name ?? '—'}</Text>

                        <Text style={[styles.clauseLabel, { color: C.muted }]}>Predmet diela</Text>
                        <Text style={[styles.clauseValue, { color: C.text }]}>{booking.job?.title ?? '—'}</Text>

                        <Text style={[styles.clauseLabel, { color: C.muted }]}>Miesto výkonu</Text>
                        <Text style={[styles.clauseValue, { color: C.text }]}>{booking.job?.location ?? '—'}</Text>

                        <Text style={[styles.clauseLabel, { color: C.muted }]}>Odmena</Text>
                        <Text style={[styles.clauseValue, { color: C.text }]}>{eur(booking.agreed_amount_cents)}</Text>

                        <View style={[styles.divider, { backgroundColor: C.hair }]} />
                        <Text style={[styles.contractBody, { color: C.muted }]}>
                            Zmluvné strany sa dohodli, že zhotoviteľ vykoná dielo osobne a riadne v dohodnutom
                            termíne. Odmena je zabezpečená v úschove (escrow) a bude uvoľnená po schválení
                            vykonaného diela objednávateľom. Podpisom obe strany potvrdzujú súhlas s podmienkami.
                        </Text>
                    </ClaySurface>

                    {/* OTP input */}
                    <Text style={[styles.otpLabel, { color: C.text }]}>{text.enterOtp}</Text>
                    <ClayInset radius={16} style={{ marginBottom: 8 }} contentStyle={styles.otpInputWrap}>
                        <TextInput
                            value={otp}
                            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholder="••••••"
                            placeholderTextColor={C.muted}
                            style={[styles.otpInput, { color: C.text }]}
                        />
                    </ClayInset>
                    <Text style={[styles.otpHint, { color: C.muted }]}>{text.otpDemoHint}</Text>

                    {errorMsg && <Text style={[styles.error, { color: C.red }]}>{errorMsg}</Text>}

                    {isSigning ? (
                        <ActivityIndicator size="large" color={C.accent} style={{ marginVertical: 14 }} />
                    ) : (
                        <ClayButton
                            label={text.confirmSign}
                            icon={<FileSignature size={18} color={C.onAccent} strokeWidth={2.2} />}
                            onPress={handleSign}
                            style={otp.length < 6 ? { opacity: 0.5 } : undefined}
                        />
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
    headerTitle: { fontSize: 19, fontWeight: '800', flex: 1, letterSpacing: -0.4 },
    content: { padding: 20, paddingBottom: 48 },
    warnBox: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 13, padding: 12, marginBottom: 16 },
    warnText: { fontSize: 12.5, fontWeight: '700', flex: 1, lineHeight: 17 },
    contractHeading: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
    contractSub: { fontSize: 12, fontWeight: '600', marginTop: 3 },
    divider: { height: 1, marginVertical: 14 },
    clauseLabel: { fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 10 },
    clauseValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
    contractBody: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
    otpLabel: { fontSize: 15, fontWeight: '800', marginBottom: 10, letterSpacing: -0.2 },
    otpInputWrap: { paddingHorizontal: 18, paddingVertical: 4 },
    otpInput: { fontSize: 24, fontWeight: '800', letterSpacing: 10, textAlign: 'center', paddingVertical: 10 },
    otpHint: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 18 },
    error: { fontSize: 13.5, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
    successTitle: { fontSize: 19, fontWeight: '800' },
});
