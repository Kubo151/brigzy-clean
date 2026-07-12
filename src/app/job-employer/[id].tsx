import React, { useState, useEffect } from "react";
import {
    View, Text, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, MapPin, Clock, Users, XCircle, Star, Zap, BadgeCheck, ShieldCheck, MessageCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useClay } from "@/lib/useClay";
import { useText } from "@/lib/useText";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { ClaySurface, ClayIconBox } from "@/components/clay";
import { EscrowConfirmSheet, type EscrowBooking } from "@/components/EscrowConfirmSheet";
import { goBack } from '@/lib/nav';
import { showAlert } from '@/lib/notify';

interface Applicant {
    id: string;
    status: "pending" | "accepted" | "rejected";
    message: string;
    created_at: string;
    worker: {
        id: string;
        display_name: string;
        avatar_url?: string;
        xp?: number;
        rating_avg?: number;
        rating_count?: number;
        brigzy_verified?: boolean;
    };
}

interface JobBooking {
    id: string;
    worker_user_id: string;
    status: string;
    agreed_amount_cents: number;
    service_fee_cents: number;
    currency: string;
}

// P4 ranking (spec: XP + rating + verified)
const rankScore = (a: Applicant) =>
    (a.worker.brigzy_verified ? 500 : 0) +
    (a.worker.rating_avg ?? 0) * 100 +
    (a.worker.xp ?? 0);

interface JobDetail {
    id: string;
    title: string;
    description: string;
    company_name: string;
    location: string;
    pay_type: "hourly" | "fixed";
    pay_amount: number;
    duration: string;
    category: string;
    status: string;
    applications: Applicant[];
}

export default function EmployerJobDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const C = useClay();
    const text = useText();
    const currentUser = useAppStore((s) => s.currentUser);

    const [job, setJob] = useState<JobDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<"new" | "accepted" | "rejected">("new");
    const [bookingsByWorker, setBookingsByWorker] = useState<Record<string, JobBooking>>({});
    const [selectingId, setSelectingId] = useState<string | null>(null);
    const [s5Visible, setS5Visible] = useState(false);
    const [s5Booking, setS5Booking] = useState<EscrowBooking | null>(null);

    useEffect(() => { loadJobDetail(); }, [id]);

    const loadJobDetail = async () => {
        if (!id) return;
        try {
            const [jobRes, bookingsRes] = await Promise.all([
                supabase
                    .from("jobs")
                    .select(`*, applications( id, status, message, created_at, worker:worker_id(id, display_name, avatar_url, xp, rating_avg, rating_count, brigzy_verified) )`)
                    .eq("id", id).single(),
                supabase
                    .from("bookings")
                    .select("id, worker_user_id, status, agreed_amount_cents, service_fee_cents, currency")
                    .eq("job_id", id)
                    .neq("status", "cancelled"),
            ]);
            if (jobRes.error) {
                console.error("❌ [EmployerJobDetail] Error:", jobRes.error);
                showAlert(text.error, text.failedToLoadJob);
            } else {
                setJob(jobRes.data as JobDetail);
            }
            if (bookingsRes.error) {
                console.error("❌ [EmployerJobDetail] Bookings error:", bookingsRes.error);
            } else {
                const map: Record<string, JobBooking> = {};
                for (const b of (bookingsRes.data ?? []) as JobBooking[]) map[b.worker_user_id] = b;
                setBookingsByWorker(map);
            }
        } catch (error) {
            console.error("❌ [EmployerJobDetail] Exception:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // P4 select → creates booking server-side, then opens S5 escrow sheet
    const selectApplicant = async (applicant: Applicant) => {
        if (selectingId) return;
        setSelectingId(applicant.id);
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { data, error } = await supabase.functions.invoke("select-applicant", {
                body: { application_id: applicant.id },
            });
            if (error || data?.error) throw error ?? new Error(data.error);
            setS5Booking(data as EscrowBooking);
            setS5Visible(true);
            await loadJobDetail();
        } catch (error) {
            console.error("❌ [EmployerJobDetail] Select failed:", error);
            showAlert(text.error, text.selectionFailed);
        } finally {
            setSelectingId(null);
        }
    };

    // Re-open S5 for an existing unfunded booking
    const openFundSheet = (booking: JobBooking) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setS5Booking({
            booking_id: booking.id,
            amount_cents: booking.agreed_amount_cents,
            service_fee_cents: booking.service_fee_cents,
            total_cents: booking.agreed_amount_cents + booking.service_fee_cents,
            currency: booking.currency,
        });
        setS5Visible(true);
    };

    const updateApplicationStatus = async (applicationId: string, newStatus: "accepted" | "rejected") => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", applicationId);
            if (error) throw error;
            await loadJobDetail();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error("❌ [EmployerJobDetail] Error updating status:", error);
            showAlert(text.error, text.failedToUpdateStatus);
        }
    };

    const getFilteredApplicants = () => {
        if (!job) return [];
        const byStatus = (s: Applicant["status"]) =>
            job.applications
                .filter((app) => app.status === s)
                .sort((a, b) => rankScore(b) - rankScore(a));
        switch (selectedTab) {
            case "new": return byStatus("pending");
            case "accepted": return byStatus("accepted");
            case "rejected": return byStatus("rejected");
            default: return [];
        }
    };

    const getTabCount = (status: "pending" | "accepted" | "rejected") => {
        if (!job) return 0;
        return job.applications.filter((app) => app.status === status).length;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.accent} />
            </SafeAreaView>
        );
    }

    if (!job) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{text.jobNotFound}</Text>
            </SafeAreaView>
        );
    }

    const filteredApplicants = getFilteredApplicants();

    const tabs: { key: typeof selectedTab; label: string; status: "pending" | "accepted" | "rejected"; color: string }[] = [
        { key: "new", label: text.new, status: "pending", color: C.star },
        { key: "accepted", label: text.accepted, status: "accepted", color: C.green },
        { key: "rejected", label: text.rejected, status: "rejected", color: C.red },
    ];

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goBack(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={20} color={C.text} strokeWidth={2.2} />
                    </ClaySurface>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>{job.title}</Text>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Job Info Card */}
                <View style={styles.cardSection}>
                    <ClaySurface radius={20} style={{ marginBottom: 20 }} contentStyle={{ padding: 18 }}>
                        <Text style={[styles.companyName, { color: C.muted }]}>{job.company_name}</Text>
                        <View style={styles.metaRow}>
                            <MapPin size={15} color={C.muted} strokeWidth={1.9} />
                            <Text style={[styles.metaText, { color: C.muted }]}>{job.location}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Clock size={15} color={C.muted} strokeWidth={1.9} />
                            <Text style={[styles.metaText, { color: C.muted }]}>{job.duration}</Text>
                        </View>
                        <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.payBadge}>
                            <Text style={[styles.payAmount, { color: C.onAccent }]}>€{job.pay_amount}</Text>
                            <Text style={[styles.payType, { color: C.onAccent }]}>{job.pay_type === "hourly" ? text.perHour : text.fixedPrice}</Text>
                        </LinearGradient>
                    </ClaySurface>

                    <Text style={[styles.sectionLabel, { color: C.text }]}>{text.aboutThisJob}</Text>
                    <Text style={[styles.descText, { color: C.muted }]}>{job.description}</Text>
                </View>

                {/* Applicants Section */}
                <View style={styles.applicantSection}>
                    <Text style={[styles.applicantTitle, { color: C.text }]}>{text.applicants} ({job.applications.length})</Text>

                    {/* Segmented Tabs */}
                    <ClaySurface radius={14} style={{ marginBottom: 16 }} contentStyle={styles.segControl}>
                        {tabs.map((tab) => {
                            const isActive = selectedTab === tab.key;
                            return (
                                <Pressable key={tab.key} onPress={() => { Haptics.selectionAsync(); setSelectedTab(tab.key); }}
                                    style={[styles.segTab, isActive && { backgroundColor: tab.color + '22' }]}>
                                    <Text style={[styles.segTabText, { color: isActive ? tab.color : C.muted }]}>● {tab.label} ({getTabCount(tab.status)})</Text>
                                </Pressable>
                            );
                        })}
                    </ClaySurface>

                    {filteredApplicants.length === 0 ? (
                        <View style={styles.emptyApplicants}>
                            <ClayIconBox size={64} radius={20}><Users size={30} color={C.accent} strokeWidth={1.6} /></ClayIconBox>
                            <Text style={[styles.emptyText, { color: C.muted }]}>{text.noApplicantsInCategory}</Text>
                        </View>
                    ) : (
                        filteredApplicants.map((applicant) => {
                            const booking = bookingsByWorker[applicant.worker.id];
                            const isSelecting = selectingId === applicant.id;
                            return (
                                <ClaySurface key={applicant.id} radius={18} style={{ marginBottom: 12 }} contentStyle={{ padding: 16 }}>
                                    <View style={styles.applicantHeader}>
                                        {/* Spec P4: tap worker name/avatar → W13 public profile */}
                                        <Pressable
                                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/user/${applicant.worker.id}`); }}
                                            style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }, pressed && { opacity: 0.7 }]}
                                        >
                                            <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.applicantAvatar}>
                                                <Text style={[styles.applicantInitial, { color: C.onAccent }]}>{applicant.worker.display_name?.[0]?.toUpperCase() || "?"}</Text>
                                            </LinearGradient>
                                            <View style={{ flex: 1 }}>
                                                <View style={styles.nameRow}>
                                                    <Text style={[styles.applicantName, { color: C.text }]}>{applicant.worker.display_name || "Unknown"}</Text>
                                                    {applicant.worker.brigzy_verified && (
                                                        <BadgeCheck size={17} color={C.accent} strokeWidth={2.2} />
                                                    )}
                                                </View>
                                                <Text style={[styles.applicantDate, { color: C.muted }]}>{text.applied} {new Date(applicant.created_at).toLocaleDateString()}</Text>
                                            </View>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/messages/${applicant.worker.id}?jobId=${job.id}`); }}
                                            hitSlop={8}
                                        >
                                            <ClaySurface radius={12} style={{ width: 38, height: 38 }} contentStyle={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
                                                <MessageCircle size={17} color={C.accent} strokeWidth={2} />
                                            </ClaySurface>
                                        </Pressable>
                                    </View>

                                    {/* P4 rank stats: rating · XP · verified */}
                                    <View style={styles.statsRow}>
                                        <View style={[styles.statChip, { backgroundColor: C.star + '1E' }]}>
                                            <Star size={13} color={C.star} strokeWidth={2.4} fill={C.star} />
                                            <Text style={[styles.statChipText, { color: C.text }]}>
                                                {(applicant.worker.rating_avg ?? 0) > 0 ? Number(applicant.worker.rating_avg).toFixed(1) : '—'}
                                                {(applicant.worker.rating_count ?? 0) > 0 && (
                                                    <Text style={{ color: C.muted }}> ({applicant.worker.rating_count})</Text>
                                                )}
                                            </Text>
                                        </View>
                                        <View style={[styles.statChip, { backgroundColor: C.accentDim }]}>
                                            <Zap size={13} color={C.accent} strokeWidth={2.4} />
                                            <Text style={[styles.statChipText, { color: C.text }]}>{applicant.worker.xp ?? 0} XP</Text>
                                        </View>
                                        {applicant.worker.brigzy_verified && (
                                            <View style={[styles.statChip, { backgroundColor: C.green + '1E' }]}>
                                                <BadgeCheck size={13} color={C.green} strokeWidth={2.4} />
                                                <Text style={[styles.statChipText, { color: C.green }]}>{text.verifiedBadge}</Text>
                                            </View>
                                        )}
                                    </View>

                                    {applicant.message && <Text style={[styles.applicantMsg, { color: C.muted }]}>{applicant.message}</Text>}

                                    {booking ? (
                                        booking.status === "escrow_pending" ? (
                                            <Pressable onPress={() => openFundSheet(booking)} style={({ pressed }) => [styles.actionBtn, { backgroundColor: C.accent }, pressed && { opacity: 0.85 }]}>
                                                <ShieldCheck size={18} color="#FFFFFF" strokeWidth={2} />
                                                <Text style={styles.actionBtnText}>{text.fundEscrow}</Text>
                                            </Pressable>
                                        ) : (
                                            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/booking/${booking.id}`); }} style={({ pressed }) => [styles.bookingPill, { backgroundColor: C.green + '1E' }, pressed && { opacity: 0.8 }]}>
                                                <ShieldCheck size={15} color={C.green} strokeWidth={2.2} />
                                                <Text style={[styles.bookingPillText, { color: C.green }]}>{text.awaitingSignatures}</Text>
                                            </Pressable>
                                        )
                                    ) : applicant.status !== "rejected" ? (
                                        <View style={styles.actionRow}>
                                            <Pressable disabled={isSelecting} onPress={() => selectApplicant(applicant)} style={({ pressed }) => [styles.actionBtn, { backgroundColor: C.green }, (pressed || isSelecting) && { opacity: 0.7 }]}>
                                                {isSelecting
                                                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                                                    : <>
                                                        <BadgeCheck size={18} color="#FFFFFF" strokeWidth={2} />
                                                        <Text style={styles.actionBtnText}>{text.selectWorker}</Text>
                                                    </>}
                                            </Pressable>
                                            {applicant.status === "pending" && (
                                                <Pressable onPress={() => updateApplicationStatus(applicant.id, "rejected")} style={({ pressed }) => [styles.actionBtn, { backgroundColor: C.cLo, borderWidth: 1, borderColor: C.hair }, pressed && { opacity: 0.85 }]}>
                                                    <XCircle size={18} color={C.text} strokeWidth={2} />
                                                    <Text style={[styles.actionBtnText, { color: C.text }]}>{text.reject}</Text>
                                                </Pressable>
                                            )}
                                        </View>
                                    ) : null}
                                </ClaySurface>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* S5 — escrow confirm sheet */}
            <EscrowConfirmSheet
                visible={s5Visible}
                booking={s5Booking}
                onClose={() => { setS5Visible(false); setS5Booking(null); }}
                onFunded={() => { loadJobDetail(); }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
    headerTitle: { fontSize: 19, fontWeight: "800", flex: 1, letterSpacing: -0.4 },
    cardSection: { padding: 20 },
    companyName: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    metaText: { fontSize: 14, fontWeight: '500' },
    payBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 13, marginTop: 14 },
    payAmount: { fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
    payType: { fontSize: 12, marginTop: 1, fontWeight: '600' },
    sectionLabel: { fontSize: 16, fontWeight: "800", marginBottom: 8, letterSpacing: -0.3 },
    descText: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
    applicantSection: { paddingHorizontal: 20, paddingBottom: 40 },
    applicantTitle: { fontSize: 18, fontWeight: "800", marginBottom: 14, letterSpacing: -0.3 },
    segControl: { flexDirection: "row", padding: 4 },
    segTab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" },
    segTabText: { fontSize: 11.5, fontWeight: "800" },
    emptyApplicants: { alignItems: "center", paddingVertical: 40, gap: 14 },
    emptyText: { fontSize: 14, fontWeight: '500' },
    applicantHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
    statChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statChipText: { fontSize: 12.5, fontWeight: "800" },
    bookingPill: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 11, borderRadius: 13 },
    bookingPillText: { fontSize: 13.5, fontWeight: "800" },
    applicantAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    applicantInitial: { fontSize: 20, fontWeight: "800" },
    applicantName: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
    applicantDate: { fontSize: 12, marginTop: 2, fontWeight: '500' },
    applicantMsg: { fontSize: 14, lineHeight: 21, marginBottom: 12, fontWeight: '500' },
    actionRow: { flexDirection: "row", gap: 10 },
    actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    actionBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
