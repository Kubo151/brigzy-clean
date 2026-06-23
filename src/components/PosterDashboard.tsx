import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, Pressable, ActivityIndicator,
    StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    Bell, Plus, Users, Briefcase, CheckCircle,
    Clock, ChevronRight, Euro, Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import useAppStore from '@/lib/state/app-store';
import { useClay } from '@/lib/useClay';
import { ClaySurface, ClayIconBox, ClayStatusPill } from '@/components/clay';
import type { BookingStatus } from '@/components/clay';

type PostedJob = {
    id: string;
    title: string;
    status: string;
    applicant_count: number;
    pay_amount: number;
    pay_type: string;
    location: string;
    created_at: string;
};

// ─── STAT CARD ───────────────────────────────────────
function StatCard({ icon: Icon, value, label, color, C }: {
    icon: any; value: number; label: string; color: string;
    C: ReturnType<typeof useClay>;
}) {
    return (
        <ClaySurface radius={18} style={styles.statCard} contentStyle={styles.statInner}>
            <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
                <Icon size={18} color={color} strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, { color: C.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>{label}</Text>
        </ClaySurface>
    );
}

// ─── JOB ROW ─────────────────────────────────────────
function JobRow({ job, onPress, C }: {
    job: PostedJob; onPress: () => void;
    C: ReturnType<typeof useClay>;
}) {
    const pay = job.pay_type === 'hourly' ? `${job.pay_amount} €/h` : `${job.pay_amount} €`;
    const statusBadge: BookingStatus = job.status === 'active' ? 'in_progress'
        : job.status === 'completed' ? 'completed'
        : job.status === 'cancelled' ? 'cancelled'
        : 'pending';

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.82, transform: [{ scale: 0.99 }] }]}>
            <ClaySurface radius={18} style={styles.jobRow} contentStyle={styles.jobRowInner}>
                <ClayIconBox size={44} radius={14}>
                    <Briefcase size={20} color={C.accent} strokeWidth={1.9} />
                </ClayIconBox>
                <View style={styles.jobRowInfo}>
                    <Text style={[styles.jobTitle, { color: C.text }]} numberOfLines={1}>{job.title}</Text>
                    <View style={styles.jobMeta}>
                        <Text style={[styles.jobMetaText, { color: C.muted }]}>{job.location}</Text>
                        <Text style={[styles.jobMetaText, { color: C.muted }]}>·</Text>
                        <Text style={[styles.jobMetaText, { color: C.accent }]}>{pay}</Text>
                    </View>
                </View>
                <View style={styles.jobRowRight}>
                    <ClayStatusPill status={statusBadge} size="sm" />
                    {job.applicant_count > 0 && (
                        <View style={[styles.applicantBadge, { backgroundColor: C.accent }]}>
                            <Users size={10} color={C.onAccent} strokeWidth={2.5} />
                            <Text style={[styles.applicantCount, { color: C.onAccent }]}>{job.applicant_count}</Text>
                        </View>
                    )}
                </View>
            </ClaySurface>
        </Pressable>
    );
}

// ─── POSTER DASHBOARD ────────────────────────────────
export function PosterDashboard() {
    const router = useRouter();
    const C = useClay();
    const currentUser = useAppStore((s) => s.currentUser);

    const [jobs, setJobs] = useState<PostedJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const firstName = currentUser?.name?.split(' ')[0] ?? 'Zadávateľ';

    const loadJobs = async () => {
        if (!currentUser?.id) return;
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('id, title, status, pay_amount, pay_type, location, created_at')
                .eq('employer_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) { console.error('PosterDashboard:', error); return; }

            const jobIds = (data || []).map((j) => j.id);
            let applicantCounts: Record<string, number> = {};

            if (jobIds.length > 0) {
                const { data: apps } = await supabase
                    .from('applications')
                    .select('job_id')
                    .in('job_id', jobIds);
                (apps || []).forEach((a) => {
                    applicantCounts[a.job_id] = (applicantCounts[a.job_id] || 0) + 1;
                });
            }

            setJobs((data || []).map((j) => ({ ...j, applicant_count: applicantCounts[j.id] || 0 })));
        } catch (e) {
            console.error('PosterDashboard exception:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadJobs(); }, [currentUser?.id]);
    useFocusEffect(useCallback(() => { loadJobs(); }, [currentUser?.id]));

    const activeJobs = jobs.filter((j) => j.status === 'active' || j.status === 'open');
    const totalApplicants = jobs.reduce((sum, j) => sum + j.applicant_count, 0);
    const pendingApplicants = jobs.filter((j) => j.applicant_count > 0).length;

    const onRefresh = () => { setRefreshing(true); loadJobs(); };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 130 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
            >
                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.greeting, { color: C.muted }]}>Dobrý deň,</Text>
                        <Text style={[styles.name, { color: C.text }]}>{firstName} 👋</Text>
                    </View>
                    <Pressable onPress={() => router.push('/activity')}>
                        <ClaySurface radius={20} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                            <Bell size={18} color={C.text} strokeWidth={1.9} />
                        </ClaySurface>
                    </Pressable>
                </View>

                {/* ─── STATS ROW ─── */}
                <View style={styles.statsRow}>
                    <StatCard icon={Briefcase} value={activeJobs.length} label="Aktívne" color={C.accent} C={C} />
                    <StatCard icon={Users} value={totalApplicants} label="Žiadosti" color={C.green} C={C} />
                    <StatCard icon={CheckCircle} value={jobs.filter((j) => j.status === 'completed').length} label="Hotové" color={C.muted} C={C} />
                </View>

                {/* ─── QUICK POST BUTTON ─── */}
                <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/add'); }}
                    style={({ pressed }) => [styles.postBtn, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
                >
                    <LinearGradient
                        colors={[C.accent2, C.accent]}
                        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                        style={styles.postBtnGrad}
                    >
                        <LinearGradient
                            colors={['rgba(255,255,255,0.28)', 'transparent']}
                            style={styles.postBtnSheen}
                        />
                        <View style={[styles.postBtnIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Plus size={20} color={C.onAccent} strokeWidth={2.6} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.postBtnTitle, { color: C.onAccent }]}>Pridať novú brigádu</Text>
                            <Text style={[styles.postBtnSub, { color: 'rgba(255,255,255,0.7)' }]}>Nájdi brigádnikov rýchlo</Text>
                        </View>
                        <Zap size={20} color={C.onAccent} strokeWidth={2} />
                    </LinearGradient>
                </Pressable>

                {/* ─── MY JOBS ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: C.text }]}>Moje brigády</Text>
                        {pendingApplicants > 0 && (
                            <View style={[styles.pendingBadge, { backgroundColor: C.accent }]}>
                                <Text style={[styles.pendingBadgeText, { color: C.onAccent }]}>{pendingApplicants} nových</Text>
                            </View>
                        )}
                    </View>

                    {loading ? (
                        <ActivityIndicator color={C.accent} style={{ marginTop: 24 }} />
                    ) : jobs.length === 0 ? (
                        <ClaySurface radius={20} contentStyle={styles.emptyState}>
                            <Briefcase size={32} color={C.muted} strokeWidth={1.5} />
                            <Text style={[styles.emptyTitle, { color: C.text }]}>Zatiaľ žiadne brigády</Text>
                            <Text style={[styles.emptyDesc, { color: C.muted }]}>Pridajte prvú brigádu a nájdite brigádnikov</Text>
                        </ClaySurface>
                    ) : (
                        <View style={styles.jobList}>
                            {jobs.map((job) => (
                                <JobRow
                                    key={job.id}
                                    job={job}
                                    C={C}
                                    onPress={() => router.push(`/job-employer/${job.id}`)}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
    greeting: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
    name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },

    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 18 },
    statCard: { flex: 1 },
    statInner: { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
    statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
    statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

    postBtn: { marginHorizontal: 20, marginBottom: 28, borderRadius: 22, overflow: 'hidden' },
    postBtnGrad: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14, borderRadius: 22 },
    postBtnSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', borderTopLeftRadius: 22, borderTopRightRadius: 22 },
    postBtnIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    postBtnTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 2 },
    postBtnSub: { fontSize: 12.5, fontWeight: '500' },

    section: { paddingHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
    sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
    pendingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    pendingBadgeText: { fontSize: 11, fontWeight: '800' },

    jobList: { gap: 12 },
    jobRow: { marginBottom: 0 },
    jobRowInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    jobRowInfo: { flex: 1 },
    jobTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginBottom: 4 },
    jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    jobMetaText: { fontSize: 12.5, fontWeight: '600' },
    jobRowRight: { alignItems: 'flex-end', gap: 6 },
    applicantBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
    applicantCount: { fontSize: 11, fontWeight: '800' },

    emptyState: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 24 },
    emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 14, marginBottom: 6 },
    emptyDesc: { fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
});
