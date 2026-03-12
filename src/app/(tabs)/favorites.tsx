import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, Pressable, ActivityIndicator,
    Animated, StyleSheet, Platform, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, MapPin, Clock, Users, ChevronRight, Briefcase } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import useAppStore from '../../lib/state/app-store';
import useThemeStore from '@/lib/state/theme-store';
import { useText } from '@/lib/useText';
import { useColors } from '@/lib/useColors';
import { JOB_CATEGORIES } from '@/lib/types';

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
function SavedJobCard({ job, onPress, C }: { job: Job; onPress: () => void; C: any }) {
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
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
                onPress={onPress}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
                style={[styles.card, {
                    backgroundColor: C.surface,
                    ...Platform.select({
                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16 },
                        android: { elevation: 4 },
                    }),
                }]}
            >
                {/* Header row — icon, title, heart */}
                <View style={styles.cardHeader}>
                    <LinearGradient
                        colors={[C.purpleDim, 'transparent']}
                        style={styles.cardIcon}
                    >
                        <Briefcase size={18} color={C.purple} strokeWidth={1.8} />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>
                            {jobTitle}
                        </Text>
                        <Text style={[styles.cardCompany, { color: C.secondaryLabel }]}>
                            {job.company_name || 'Unknown'}
                        </Text>
                    </View>
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                        <Pressable onPress={handleSave} hitSlop={12}>
                            <Heart
                                size={20}
                                color={isSaved ? C.purple : C.tertiaryLabel}
                                fill={isSaved ? C.purple : 'transparent'}
                                strokeWidth={1.8}
                            />
                        </Pressable>
                    </Animated.View>
                </View>

                {/* Meta row */}
                <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                        <MapPin size={14} color={C.tertiaryLabel} strokeWidth={1.8} />
                        <Text style={[styles.metaText, { color: C.secondaryLabel }]}>{jobLocation}</Text>
                    </View>
                    {job.is_urgent && (
                        <View style={[styles.urgentBadge, { backgroundColor: 'rgba(255,69,58,0.12)' }]}>
                            <Text style={{ color: C.red, fontSize: 11, fontWeight: '600' }}>Urgent</Text>
                        </View>
                    )}
                </View>

                {/* Category pill */}
                <View style={[styles.categoryPill, { backgroundColor: C.purpleDim }]}>
                    <Text style={[styles.categoryText, { color: C.purple }]}>
                        {category?.name || job.category}
                    </Text>
                </View>

                {/* Footer */}
                <View style={[styles.cardFooter, { borderTopColor: C.separator }]}>
                    <View style={styles.metaItem}>
                        <Users size={14} color={C.tertiaryLabel} strokeWidth={1.8} />
                        <Text style={[styles.metaText, { color: C.secondaryLabel }]}>
                            {job.applicants_count || 0} uchádzačov
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.salary, { color: C.purple }]}>
                            €{job.pay_amount}/{job.pay_type === 'hourly' ? 'h' : ''}
                        </Text>
                        <ChevronRight size={14} color={C.tertiaryLabel} strokeWidth={1.8} />
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

// ─── FAVORITES SCREEN ───────────────────────────────
export default function Favorites() {
    const router = useRouter();
    const C = useColors();
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

            // Sync savedJobIds in app-store with server truth
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

    // ── Loading ──
    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.purple} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg }}>
                {/* iOS Large Title Header */}
                <View style={styles.header}>
                    <Text style={[styles.largeTitle, { color: C.text }]}>
                        {text.savedJobs}
                    </Text>
                    <Text style={[styles.subtitle, { color: C.secondaryLabel }]}>
                        {savedJobs.length} {savedJobs.length === 1 ? 'pozícia' : 'pozícií'}
                    </Text>
                </View>
            </SafeAreaView>

            {savedJobs.length === 0 ? (
                /* ── Empty State ── */
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIcon, { backgroundColor: C.purpleDim }]}>
                        <Heart size={42} color={C.purple} strokeWidth={1.5} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: C.text }]}>
                        {text.noSavedJobsYet}
                    </Text>
                    <Text style={[styles.emptyDesc, { color: C.secondaryLabel }]}>
                        {text.tapHeartToSave}
                    </Text>
                    <Pressable
                        onPress={() => router.push('/(tabs)')}
                        style={({ pressed }) => [
                            styles.emptyBtn,
                            { opacity: pressed ? 0.85 : 1 },
                        ]}
                    >
                        <LinearGradient
                            colors={['#9333EA', '#7C3AED', '#6D28D9']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.emptyBtnGradient}
                        >
                            <Text style={styles.emptyBtnText}>{text.browseJobs}</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            ) : (
                /* ── Job List ── */
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={C.purple}
                            colors={[C.purple]}
                        />
                    }
                >
                    {savedJobs.map(job => (
                        <SavedJobCard
                            key={job.id}
                            job={job}
                            onPress={() => router.push(`/job/${job.id}`)}
                            C={C}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

// ─── STYLES ─────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    largeTitle: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: 0.2,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '400',
    },

    // List
    list: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 100,
    },

    // Card
    card: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    cardIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    cardCompany: {
        fontSize: 13,
        fontWeight: '400',
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 10,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 13,
    },
    urgentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    categoryPill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        marginBottom: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    salary: {
        fontSize: 16,
        fontWeight: '700',
    },

    // Empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 100,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyDesc: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    emptyBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    emptyBtnGradient: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
    },
    emptyBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        textAlign: 'center',
    },
});