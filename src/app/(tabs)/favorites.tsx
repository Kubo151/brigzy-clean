import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, Pressable, ActivityIndicator,
    Animated, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, MapPin, ChevronRight, Briefcase } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import useAppStore from '../../lib/state/app-store';
import useThemeStore from '@/lib/state/theme-store';
import { useText } from '@/lib/useText';
import { useFlint, RADIUS } from '@/lib/useFlint';
import type { FlintColors } from '@/lib/useFlint';
import { JOB_CATEGORIES } from '@/lib/types';
import { Button } from '@/components/ui';

interface Job {
    id: string;
    title: string;
    title_sk?: string;
    company_name: string;
    location: string;
    location_sk?: string;
    pay_amount: number;
    pay_type: string;
    category: string;
    is_urgent: boolean;
    applicants_count?: number;
    duration?: string;
    duration_sk?: string;
}

// ─── SAVED JOB CARD ─────────────────────────────────
function SavedJobCard({ job, onPress, C }: { job: Job; onPress: () => void; C: FlintColors }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const savedJobIds = useAppStore((s) => s.savedJobIds);
    const toggleSavedJob = useAppStore((s) => s.toggleSavedJob);
    const language = useThemeStore((s) => s.language);
    const isSaved = savedJobIds.includes(job.id);
    const heartScale = useRef(new Animated.Value(1)).current;

    const jobTitle = language === 'sk' && job.title_sk ? job.title_sk : job.title;
    const jobLocation = language === 'sk' && job.location_sk ? job.location_sk : job.location;
    const category = JOB_CATEGORIES.find((cat) => cat.id === job.category);

    const handleSave = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.sequence([
            Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
            Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
        ]).start();
        toggleSavedJob(job.id);
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 14 }}>
            <Pressable
                onPress={onPress}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
            >
                <View style={[styles.card, { backgroundColor: C.card, padding: 16 }]}>
                    {/* Header row */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: C.card2 }]}>
                            <Briefcase size={20} color={C.accent} strokeWidth={1.9} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>{jobTitle}</Text>
                            <Text style={[styles.cardCompany, { color: C.muted }]}>{job.company_name || 'Unknown'}</Text>
                        </View>
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <Pressable onPress={handleSave} hitSlop={12} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: isSaved ? C.accentDim : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                                <Heart size={20} color={isSaved ? C.accent : C.muted} fill={isSaved ? C.accent : 'transparent'} strokeWidth={isSaved ? 2.2 : 1.8} />
                            </Pressable>
                        </Animated.View>
                    </View>

                    {/* Footer: category + applicants + salary */}
                    <View style={styles.cardFooterRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={[styles.categoryPill, { backgroundColor: C.accentDim }]}>
                                <Text style={[styles.categoryText, { color: C.accent }]}>{category?.name || job.category}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <MapPin size={12} color={C.muted} strokeWidth={1.9} />
                                <Text style={[styles.metaText, { color: C.muted }]} numberOfLines={1}>{jobLocation}</Text>
                            </View>
                        </View>
                        <View style={[styles.salaryChip, { backgroundColor: C.accent }]}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: C.onAccent }}>€{job.pay_amount}{job.pay_type === 'hourly' ? '/h' : ''}</Text>
                            <ChevronRight size={14} color={C.onAccent} strokeWidth={2.4} />
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

// ─── FAVORITES SCREEN ───────────────────────────────
export default function Favorites() {
    const router = useRouter();
    const C = useFlint();
    const text = useText();

    const [savedJobs, setSavedJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const appStoreSavedJobIds = useAppStore((s) => s.savedJobIds);

    useEffect(() => { loadSavedJobs(); }, []);
    useEffect(() => {
        setSavedJobs(prev => prev.filter(job => appStoreSavedJobIds.includes(job.id)));
    }, [appStoreSavedJobIds]);

    const loadSavedJobs = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: savedData } = await supabase
                .from('saved_jobs').select('job_id').eq('user_id', user.id);
            const jobIds = savedData?.map(item => item.job_id) || [];
            useAppStore.setState({ savedJobIds: jobIds });
            if (jobIds.length > 0) {
                const { data: jobs } = await supabase
                    .from('jobs').select('*').in('id', jobIds).eq('status', 'active');
                setSavedJobs(jobs || []);
            } else {
                setSavedJobs([]);
            }
        } catch (error) {
            console.error('Error loading saved jobs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => { setRefreshing(true); loadSavedJobs(); };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.accent} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg }}>
                <View style={styles.header}>
                    <Text style={[styles.largeTitle, { color: C.text }]}>{text.savedJobs}</Text>
                    <Text style={[styles.subtitle, { color: C.muted }]}>
                        {savedJobs.length} {savedJobs.length === 1 ? 'pozícia' : 'pozícií'}
                    </Text>
                </View>
            </SafeAreaView>

            {savedJobs.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.iconBoxLg, { backgroundColor: C.card2 }]}><Heart size={42} color={C.accent} strokeWidth={1.6} /></View>
                    <Text style={[styles.emptyTitle, { color: C.text }]}>{text.noSavedJobsYet}</Text>
                    <Text style={[styles.emptyDesc, { color: C.muted }]}>{text.tapHeartToSave}</Text>
                    <Button label={text.browseJobs} onPress={() => router.push('/(tabs)')} style={{ marginTop: 28, paddingHorizontal: 32 }} />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />}
                >
                    {savedJobs.map(job => (
                        <SavedJobCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} C={C} />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    largeTitle: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
    subtitle: { fontSize: 14, fontWeight: '600' },
    list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
    card: { borderRadius: RADIUS.lg },
    iconBox: { width: 46, height: 46, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    iconBoxLg: { width: 100, height: 100, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2, letterSpacing: -0.3 },
    cardCompany: { fontSize: 13, fontWeight: '600' },
    cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '600', maxWidth: 90 },
    categoryPill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 9 },
    categoryText: { fontSize: 11.5, fontWeight: '700' },
    salaryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 100 },
    emptyTitle: { fontSize: 21, fontWeight: '700', marginBottom: 8, marginTop: 24, textAlign: 'center', letterSpacing: -0.4 },
    emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21, fontWeight: '500' },
});
