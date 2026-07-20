import React, { useCallback, useState } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, ShieldCheck, FileSignature, QrCode, CheckCircle, XCircle, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFlint, RADIUS } from '@/lib/useFlint';
import { useText } from '@/lib/useText';
import { supabase } from '@/lib/supabase';
import { Button, Timeline, type TimelineStep } from '@/components/ui';
import { EscrowConfirmSheet, type EscrowBooking } from '@/components/EscrowConfirmSheet';
import { goBack } from '@/lib/nav';
import { showAlert } from '@/lib/notify';

// P5 (poster) / W6 (worker) — booking hub. One screen, role decided by which
// side of the booking the signed-in user is on.

interface BookingDetail {
    id: string;
    job_id: string;
    worker_user_id: string;
    poster_user_id: string;
    status: string;
    agreed_amount_cents: number;
    service_fee_cents: number;
    currency: string;
    escrow_id: string | null;
    contract_id: string | null;
    check_in_at: string | null;
    check_out_at: string | null;
    job: { title: string | null; company_name: string | null; pay_type: string | null } | null;
    worker: { display_name: string | null } | null;
    poster: { display_name: string | null } | null;
}

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

const workedLabel = (checkIn: string, checkOut: string) => {
    const minutes = Math.max(Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000), 0);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

interface ContractState {
    signed_by_poster_at: string | null;
    signed_by_worker_at: string | null;
}

interface MyReview {
    id: string;
    rating_overall: number | null;
    revealed_at: string | null;
}

interface MyDispute {
    id: string;
    status: string;
}

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export default function BookingHubScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const C = useFlint();
    const text = useText();

    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [contract, setContract] = useState<ContractState | null>(null);
    const [myUserId, setMyUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReleasing, setIsReleasing] = useState(false);
    const [isAttending, setIsAttending] = useState(false);
    const [s5Visible, setS5Visible] = useState(false);
    const [myReview, setMyReview] = useState<MyReview | null>(null);
    const [reviewStars, setReviewStars] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [myDispute, setMyDispute] = useState<MyDispute | null>(null);
    const [disputeFormVisible, setDisputeFormVisible] = useState(false);
    const [disputeDescription, setDisputeDescription] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

    const load = useCallback(async () => {
        if (!id) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setMyUserId(user?.id ?? null);

            const [bookingRes, contractRes, reviewRes, disputeRes] = await Promise.all([
                supabase
                    .from('bookings')
                    .select('id, job_id, worker_user_id, poster_user_id, status, agreed_amount_cents, service_fee_cents, currency, escrow_id, contract_id, check_in_at, check_out_at, job:job_id(title, company_name, pay_type), worker:worker_user_id(display_name), poster:poster_user_id(display_name)')
                    .eq('id', id)
                    .maybeSingle(),
                supabase
                    .from('contracts')
                    .select('signed_by_poster_at, signed_by_worker_at')
                    .eq('booking_id', id)
                    .maybeSingle(),
                user
                    ? supabase
                        .from('reviews')
                        .select('id, rating_overall, revealed_at')
                        .eq('booking_id', id)
                        .eq('from_user_id', user.id)
                        .maybeSingle()
                    : Promise.resolve({ data: null }),
                user
                    ? supabase
                        .from('disputes')
                        .select('id, status')
                        .eq('booking_id', id)
                        .eq('raised_by', user.id)
                        .in('status', ['open', 'info_requested'])
                        .maybeSingle()
                    : Promise.resolve({ data: null }),
            ]);
            if (bookingRes.error) throw bookingRes.error;
            setBooking(bookingRes.data as unknown as BookingDetail);
            setContract((contractRes.data as ContractState) ?? null);
            setMyReview((reviewRes.data as MyReview) ?? null);
            setMyDispute((disputeRes.data as MyDispute) ?? null);
        } catch (e) {
            console.error('❌ [BookingHub] load failed:', e);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const handleAttendance = async (action: 'check_in' | 'check_out') => {
        if (!booking || isAttending) return;
        setIsAttending(true);
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { data, error } = await supabase.functions.invoke('attendance', {
                body: { booking_id: booking.id, action },
            });
            if (error || data?.error) throw error ?? new Error(data.error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await load();
        } catch (e) {
            console.error('❌ [BookingHub] attendance failed:', e);
            showAlert(text.error, text.selectionFailed);
        } finally {
            setIsAttending(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!booking || isSubmittingReview || reviewStars < 1) return;
        setIsSubmittingReview(true);
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { data, error } = await supabase.functions.invoke('submit-review', {
                body: { booking_id: booking.id, rating: reviewStars, comment: reviewComment },
            });
            if (error || data?.error) throw error ?? new Error(data.error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await load();
        } catch (e) {
            console.error('❌ [BookingHub] review failed:', e);
            showAlert(text.error, text.reviewFailed);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleRelease = async () => {
        if (!booking || isReleasing) return;
        setIsReleasing(true);
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { data, error } = await supabase.functions.invoke('release-escrow', {
                body: { booking_id: booking.id },
            });
            if (error || data?.error) throw error ?? new Error(data.error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await load();
        } catch (e) {
            console.error('❌ [BookingHub] release failed:', e);
            showAlert(text.error, text.selectionFailed);
        } finally {
            setIsReleasing(false);
        }
    };

    const handleSubmitDispute = async () => {
        if (!booking || !myUserId || isSubmittingDispute || disputeDescription.trim().length < 3) return;
        setIsSubmittingDispute(true);
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const raisedAgainst = myUserId === booking.worker_user_id ? booking.poster_user_id : booking.worker_user_id;
            const { error } = await supabase.from('disputes').insert({
                booking_id: booking.id,
                raised_by: myUserId,
                raised_against: raisedAgainst,
                category: 'other',
                description: disputeDescription.trim(),
                status: 'open',
            });
            if (error) throw error;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setDisputeFormVisible(false);
            setDisputeDescription('');
            showAlert(text.reportProblem, text.reportProblemSubmitted);
            await load();
        } catch (e) {
            console.error('❌ [BookingHub] dispute submit failed:', e);
            showAlert(text.error, text.reportProblemFailed);
        } finally {
            setIsSubmittingDispute(false);
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

    const isPoster = myUserId === booking.poster_user_id;
    const status = booking.status;
    const posterSigned = !!contract?.signed_by_poster_at;
    const workerSigned = !!contract?.signed_by_worker_at;
    const escrowDone = status !== 'draft' && status !== 'escrow_pending';
    const contractDone = ['in_progress', 'completed', 'cleared'].includes(status);
    const released = status === 'cleared';

    // Fund -> sign ordering is a hard functional constraint (ADR-0006) — the
    // timeline step order below must stay: escrow, contract, work, release.
    const steps: TimelineStep[] = [
        { label: text.stepEscrow, sublabel: eur(booking.agreed_amount_cents + booking.service_fee_cents), done: escrowDone, active: status === 'escrow_pending' },
        {
            label: text.stepContract,
            sublabel: status === 'awaiting_signatures'
                ? (posterSigned ? text.waitingForWorkerSign : text.waitingForPosterSign)
                : undefined,
            done: contractDone,
            active: status === 'awaiting_signatures',
        },
        {
            label: text.stepWork,
            sublabel: booking.check_in_at && booking.check_out_at
                ? `${text.workedTime}: ${workedLabel(booking.check_in_at, booking.check_out_at)}`
                : booking.check_in_at
                    ? `${text.workingSince} ${formatTime(booking.check_in_at)}`
                    : text.qrComingSoon,
            done: released || !!booking.check_out_at,
            active: status === 'in_progress' && !booking.check_out_at,
        },
        { label: text.stepRelease, done: released, active: status === 'completed' },
    ];

    const otherName = isPoster
        ? booking.worker?.display_name ?? text.workerLabel
        : booking.poster?.display_name ?? text.posterLabel;

    const canISign = status === 'awaiting_signatures' && (
        isPoster ? !posterSigned : (posterSigned && !workerSigned)
    );

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goBack(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <View style={[styles.backBtn, { backgroundColor: C.card2 }]}>
                        <ChevronLeft size={20} color={C.text} strokeWidth={2.2} />
                    </View>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>{text.bookingTitle}</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Job + parties card */}
                <View style={[styles.card, { backgroundColor: C.card, padding: 18, marginBottom: 16 }]}>
                    <Text style={[styles.jobTitle, { color: C.text }]}>{booking.job?.title ?? '—'}</Text>
                    <Text style={[styles.partyText, { color: C.muted }]}>
                        {(isPoster ? text.workerLabel : text.posterLabel)}: {otherName}
                    </Text>
                    <View style={[styles.payBadge, { backgroundColor: C.accent }]}>
                        <Text style={[styles.payAmount, { color: C.onAccent }]}>{eur(booking.agreed_amount_cents)}</Text>
                        {isPoster && (
                            <Text style={[styles.payFee, { color: C.onAccent }]}>+ {eur(booking.service_fee_cents)} {text.serviceFee.toLowerCase()}</Text>
                        )}
                    </View>
                </View>

                {/* Escrow loop timeline — order (fund -> sign) is a fixed business rule, do not reorder */}
                <View style={[styles.card, { backgroundColor: C.card, padding: 18, marginBottom: 16 }]}>
                    <Timeline steps={steps} />
                </View>

                {/* Status actions */}
                {status === 'cancelled' && (
                    <View style={[styles.infoBox, { backgroundColor: C.redDim }]}>
                        <XCircle size={18} color={C.red} strokeWidth={2} />
                        <Text style={[styles.infoText, { color: C.red }]}>{text.bookingCancelled}</Text>
                    </View>
                )}
                {status === 'disputed' && (
                    <View style={[styles.infoBox, { backgroundColor: C.redDim }]}>
                        <XCircle size={18} color={C.red} strokeWidth={2} />
                        <Text style={[styles.infoText, { color: C.red }]}>{text.bookingDisputed}</Text>
                    </View>
                )}

                {status === 'escrow_pending' && isPoster && (
                    <Button
                        label={text.fundEscrow}
                        icon={<ShieldCheck size={18} color={C.onAccent} strokeWidth={2.2} />}
                        onPress={() => setS5Visible(true)}
                    />
                )}
                {status === 'escrow_pending' && !isPoster && (
                    <View style={[styles.infoBox, { backgroundColor: C.accentDim }]}>
                        <ShieldCheck size={18} color={C.accent} strokeWidth={2} />
                        <Text style={[styles.infoText, { color: C.text }]}>{text.stepEscrow}…</Text>
                    </View>
                )}

                {status === 'awaiting_signatures' && (
                    canISign ? (
                        <Button
                            label={text.signContract}
                            icon={<FileSignature size={18} color={C.onAccent} strokeWidth={2.2} />}
                            onPress={() => router.push(`/booking/${booking.id}/sign`)}
                        />
                    ) : (
                        <View style={[styles.infoBox, { backgroundColor: C.accentDim }]}>
                            <FileSignature size={18} color={C.accent} strokeWidth={2} />
                            <Text style={[styles.infoText, { color: C.text }]}>
                                {posterSigned ? text.waitingForWorkerSign : text.waitingForPosterSign}
                            </Text>
                        </View>
                    )
                )}

                {(status === 'in_progress' || status === 'completed') && (
                    isPoster ? (
                        (isReleasing || isAttending) ? (
                            <ActivityIndicator size="large" color={C.accent} style={{ marginVertical: 14 }} />
                        ) : !booking.check_in_at ? (
                            <View style={{ gap: 10 }}>
                                <Button
                                    label={text.scanQr}
                                    icon={<QrCode size={18} color={C.onAccent} strokeWidth={2.2} />}
                                    onPress={() => router.push(`/booking/${booking.id}/scan`)}
                                />
                                <Button
                                    label={text.checkInWorker}
                                    variant="ghost"
                                    onPress={() => handleAttendance('check_in')}
                                />
                            </View>
                        ) : !booking.check_out_at ? (
                            <View style={{ gap: 12 }}>
                                <View style={[styles.infoBox, { backgroundColor: C.accentDim }]}>
                                    <QrCode size={18} color={C.accent} strokeWidth={2} />
                                    <Text style={[styles.infoText, { color: C.text }]}>
                                        {text.workingSince} {formatTime(booking.check_in_at)}
                                    </Text>
                                </View>
                                <Button
                                    label={text.scanQr}
                                    icon={<QrCode size={18} color={C.onAccent} strokeWidth={2.2} />}
                                    onPress={() => router.push(`/booking/${booking.id}/scan`)}
                                />
                                <Button
                                    label={text.checkOutWorker}
                                    variant="ghost"
                                    onPress={() => handleAttendance('check_out')}
                                />
                            </View>
                        ) : (
                            <Button
                                label={text.approveAndRelease}
                                icon={<CheckCircle size={18} color={C.onAccent} strokeWidth={2.2} />}
                                onPress={handleRelease}
                            />
                        )
                    ) : (
                        <View style={{ gap: 12 }}>
                            <View style={[styles.infoBox, { backgroundColor: C.accentDim }]}>
                                <QrCode size={18} color={C.accent} strokeWidth={2} />
                                <Text style={[styles.infoText, { color: C.text }]}>
                                    {booking.check_in_at && !booking.check_out_at
                                        ? `${text.workingSince} ${formatTime(booking.check_in_at)}`
                                        : text.waitingForRelease}
                                </Text>
                            </View>
                            {!booking.check_out_at && (
                                <Button
                                    label={text.showQr}
                                    icon={<QrCode size={18} color={C.onAccent} strokeWidth={2.2} />}
                                    onPress={() => router.push(`/booking/${booking.id}/qr`)}
                                />
                            )}
                        </View>
                    )
                )}

                {released && (
                    <View style={styles.releasedWrap}>
                        <View style={[styles.releasedIcon, { backgroundColor: C.greenDim }]}>
                            <CheckCircle size={30} color={C.green} strokeWidth={1.8} />
                        </View>
                        <Text style={[styles.releasedTitle, { color: C.text }]}>{text.paymentReleased}</Text>
                        <Text style={[styles.releasedNote, { color: C.muted }]}>{text.paymentReleasedNote}</Text>
                    </View>
                )}

                {/* S7 — blind two-way review */}
                {released && !myReview && (
                    <View style={[styles.card, { backgroundColor: C.card, padding: 18, marginTop: 8 }]}>
                        <Text style={[styles.reviewTitle, { color: C.text }]}>
                            {text.leaveReviewTitle} · {otherName}
                        </Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Pressable key={s} onPress={() => { Haptics.selectionAsync(); setReviewStars(s); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.9 }] }]}>
                                    <Star
                                        size={34}
                                        color={C.star}
                                        strokeWidth={1.8}
                                        fill={s <= reviewStars ? C.star : 'transparent'}
                                    />
                                </Pressable>
                            ))}
                        </View>
                        <TextInput
                            value={reviewComment}
                            onChangeText={setReviewComment}
                            placeholder={text.reviewCommentPlaceholder}
                            placeholderTextColor={C.muted}
                            multiline
                            style={[styles.reviewInput, { color: C.text, backgroundColor: C.card2 }]}
                        />
                        {isSubmittingReview ? (
                            <ActivityIndicator size="large" color={C.accent} style={{ marginVertical: 10 }} />
                        ) : (
                            <Button
                                label={text.submitReview}
                                icon={<Star size={17} color={C.onAccent} strokeWidth={2.2} />}
                                onPress={handleSubmitReview}
                                style={reviewStars < 1 ? { opacity: 0.5 } : undefined}
                            />
                        )}
                        <Text style={[styles.blindNote, { color: C.muted }]}>{text.reviewBlindNote}</Text>
                    </View>
                )}
                {released && myReview && (
                    <View style={[styles.infoBox, { backgroundColor: C.greenDim, marginTop: 8 }]}>
                        <Star size={18} color={C.star} strokeWidth={2} fill={C.star} />
                        <Text style={[styles.infoText, { color: C.text }]}>
                            {text.reviewThanks} {myReview.revealed_at ? text.reviewRevealedNote : text.reviewBlindNote}
                        </Text>
                    </View>
                )}

                {/* S8 stub — raise a dispute, once escrow is funded and not already cancelled/disputed */}
                {escrowDone && status !== 'cancelled' && status !== 'disputed' && (
                    myDispute ? (
                        <View style={[styles.infoBox, { backgroundColor: C.redDim, marginTop: 12 }]}>
                            <XCircle size={18} color={C.red} strokeWidth={2} />
                            <Text style={[styles.infoText, { color: C.red }]}>{text.reportProblemAlreadyOpen}</Text>
                        </View>
                    ) : disputeFormVisible ? (
                        <View style={[styles.card, { backgroundColor: C.card, padding: 18, marginTop: 12 }]}>
                            <Text style={[styles.reviewTitle, { color: C.text }]}>{text.reportProblemTitle}</Text>
                            <TextInput
                                value={disputeDescription}
                                onChangeText={setDisputeDescription}
                                placeholder={text.reportProblemDescriptionPlaceholder}
                                placeholderTextColor={C.muted}
                                multiline
                                maxLength={2000}
                                style={[styles.reviewInput, { color: C.text, backgroundColor: C.card2 }]}
                            />
                            {isSubmittingDispute ? (
                                <ActivityIndicator size="large" color={C.accent} style={{ marginVertical: 10 }} />
                            ) : (
                                <Button
                                    label={text.reportProblemSubmit}
                                    icon={<XCircle size={17} color={C.onAccent} strokeWidth={2.2} />}
                                    onPress={handleSubmitDispute}
                                    style={disputeDescription.trim().length < 3 ? { opacity: 0.5 } : undefined}
                                />
                            )}
                        </View>
                    ) : (
                        <Pressable
                            onPress={() => { Haptics.selectionAsync(); setDisputeFormVisible(true); }}
                            style={({ pressed }) => [styles.reportProblemLink, pressed && { opacity: 0.6 }]}
                        >
                            <Text style={[styles.reportProblemLinkText, { color: C.muted }]}>{text.reportProblem}</Text>
                        </Pressable>
                    )
                )}
            </ScrollView>

            {/* S5 — fund sheet (poster, escrow_pending) */}
            <EscrowConfirmSheet
                visible={s5Visible}
                booking={{
                    booking_id: booking.id,
                    amount_cents: booking.agreed_amount_cents,
                    service_fee_cents: booking.service_fee_cents,
                    total_cents: booking.agreed_amount_cents + booking.service_fee_cents,
                    currency: booking.currency,
                } satisfies EscrowBooking}
                onClose={() => setS5Visible(false)}
                onFunded={() => { load(); }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
    backBtn: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '600', flex: 1 },
    content: { padding: 20, paddingBottom: 48 },
    card: { borderRadius: RADIUS.lg },
    jobTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4, marginBottom: 6 },
    partyText: { fontSize: 13.5, fontWeight: '600', marginBottom: 12 },
    payBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md },
    payAmount: { fontSize: 19, fontWeight: '700', letterSpacing: -0.4 },
    payFee: { fontSize: 11.5, marginTop: 1, fontWeight: '600', opacity: 0.9 },
    infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: RADIUS.md, padding: 14 },
    infoText: { fontSize: 13.5, lineHeight: 19, fontWeight: '600', flex: 1 },
    releasedWrap: { alignItems: 'center', gap: 10, paddingVertical: 18 },
    releasedIcon: { width: 64, height: 64, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
    releasedTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
    releasedNote: { fontSize: 13.5, fontWeight: '500', textAlign: 'center' },
    reviewTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginBottom: 14 },
    starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
    reviewInput: { borderRadius: RADIUS.md, padding: 13, fontSize: 14, minHeight: 76, textAlignVertical: 'top', marginBottom: 14 },
    blindNote: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 12 },
    reportProblemLink: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
    reportProblemLinkText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});
