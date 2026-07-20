import React, { useCallback, useState } from 'react';
import {
    View, Text, ScrollView, Pressable, Image, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, BadgeCheck, Star, Zap, Briefcase, MessageCircle, CalendarDays } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFlint, RADIUS } from '@/lib/useFlint';
import { useText } from '@/lib/useText';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { goBack } from '@/lib/nav';

// W13 — public profile (the trust surface). Read-only: verified badge,
// work history count, ★ rating, XP/rank, revealed reviews.

interface PublicProfile {
    id: string;
    display_name: string | null;
    name: string | null;
    surname: string | null;
    avatar_url: string | null;
    xp: number;
    rank_tier: string | null;
    rating_avg: number;
    rating_count: number;
    brigzy_verified: boolean;
    created_at: string;
}

interface Review {
    id: string;
    rating_overall: number | null;
    rating: number | null;
    comment: string | null;
    created_at: string;
    author: { display_name: string | null } | null;
}

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const C = useFlint();
    const text = useText();

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [completedJobs, setCompletedJobs] = useState<number>(0);
    const [postedJobs, setPostedJobs] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isMe, setIsMe] = useState(false);

    const load = useCallback(async () => {
        if (!id) return;
        try {
            const [{ data: { user: me } }, profileRes, reviewsRes, statsRes] = await Promise.all([
                supabase.auth.getUser(),
                supabase
                    .from('users')
                    .select('id, display_name, name, surname, avatar_url, xp, rank_tier, rating_avg, rating_count, brigzy_verified, created_at')
                    .eq('id', id)
                    .maybeSingle(),
                supabase
                    .from('reviews')
                    .select('id, rating_overall, rating, comment, created_at, author:from_user_id(display_name)')
                    .eq('to_user_id', id)
                    .not('revealed_at', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(20),
                supabase.rpc('get_public_profile_stats', { p_user_id: id }),
            ]);
            setIsMe(me?.id === id);
            setProfile(profileRes.data as PublicProfile | null);
            setReviews((reviewsRes.data ?? []) as unknown as Review[]);
            const stats = Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data;
            setCompletedJobs(Number(stats?.completed_as_worker ?? 0));
            setPostedJobs(Number(stats?.completed_as_poster ?? 0));
        } catch (e) {
            console.error('❌ [PublicProfile] load failed:', e);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.accent} />
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: '600' }}>{text.profileNotFound}</Text>
            </SafeAreaView>
        );
    }

    const displayName = profile.display_name || [profile.name, profile.surname].filter(Boolean).join(' ') || '—';
    const initial = displayName.charAt(0).toUpperCase();
    const memberSince = new Date(profile.created_at).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' });
    const hasRating = (profile.rating_count ?? 0) > 0;

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goBack(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <View style={[styles.backBtn, { backgroundColor: C.card2 }]}>
                        <ChevronLeft size={20} color={C.text} strokeWidth={2.2} />
                    </View>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>{displayName}</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Identity card */}
                <View style={[styles.identityCard, { backgroundColor: C.card, marginBottom: 16 }]}>
                    {profile.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: C.accent }]}>
                            <Text style={[styles.avatarInitial, { color: C.onAccent }]}>{initial}</Text>
                        </View>
                    )}
                    <View style={styles.nameRow}>
                        <Text style={[styles.name, { color: C.text }]}>{displayName}</Text>
                        {profile.brigzy_verified && <BadgeCheck size={20} color={C.accent} strokeWidth={2.2} />}
                    </View>
                    {profile.rank_tier && (
                        <Text style={[styles.rankTier, { color: C.accent }]}>{profile.rank_tier}</Text>
                    )}
                    <View style={styles.memberRow}>
                        <CalendarDays size={13} color={C.muted} strokeWidth={2} />
                        <Text style={[styles.memberText, { color: C.muted }]}>{text.memberSince} {memberSince}</Text>
                    </View>

                    {/* Stats */}
                    <View style={[styles.statsRow, { borderTopColor: C.divider }]}>
                        <View style={styles.statCol}>
                            <View style={styles.statValueRow}>
                                <Star size={15} color={C.star} strokeWidth={2.4} fill={C.star} />
                                <Text style={[styles.statValue, { color: C.text }]}>
                                    {hasRating ? Number(profile.rating_avg).toFixed(1) : '—'}
                                </Text>
                            </View>
                            <Text style={[styles.statLabel, { color: C.muted }]}>
                                {text.ratingLabel}{hasRating ? ` (${profile.rating_count})` : ''}
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: C.divider }]} />
                        <View style={styles.statCol}>
                            <View style={styles.statValueRow}>
                                <Zap size={15} color={C.accent} strokeWidth={2.4} />
                                <Text style={[styles.statValue, { color: C.text }]}>{profile.xp ?? 0}</Text>
                            </View>
                            <Text style={[styles.statLabel, { color: C.muted }]}>XP</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: C.divider }]} />
                        <View style={styles.statCol}>
                            <View style={styles.statValueRow}>
                                <Briefcase size={15} color={C.green} strokeWidth={2.4} />
                                <Text style={[styles.statValue, { color: C.text }]}>{completedJobs}</Text>
                            </View>
                            <Text style={[styles.statLabel, { color: C.muted }]}>{text.completedJobsLabel}</Text>
                        </View>
                    </View>
                    {postedJobs > 0 && (
                        <Text style={[styles.postedNote, { color: C.muted }]}>
                            {text.postedJobsLabel}: {postedJobs}
                        </Text>
                    )}
                </View>

                {/* Message CTA (not on own profile) */}
                {!isMe && (
                    <Button
                        label={text.sendMessage}
                        icon={<MessageCircle size={18} color={C.onAccent} strokeWidth={2.2} />}
                        onPress={() => router.push(`/messages/${profile.id}`)}
                        style={{ marginBottom: 22 }}
                    />
                )}

                {/* Reviews */}
                <Text style={[styles.sectionTitle, { color: C.text }]}>{text.reviewsTitle}</Text>
                {reviews.length === 0 ? (
                    <View style={styles.emptyReviews}>
                        <View style={[styles.emptyIconBox, { backgroundColor: C.card2 }]}>
                            <Star size={26} color={C.muted} strokeWidth={1.6} />
                        </View>
                        <Text style={[styles.emptyText, { color: C.muted }]}>{text.noReviewsYet}</Text>
                    </View>
                ) : (
                    reviews.map((r) => {
                        const stars = r.rating_overall ?? r.rating ?? 0;
                        return (
                            <View key={r.id} style={[styles.reviewCard, { backgroundColor: C.card, marginBottom: 10 }]}>
                                <View style={styles.reviewHeader}>
                                    <Text style={[styles.reviewAuthor, { color: C.text }]}>{r.author?.display_name ?? 'Anonym'}</Text>
                                    <View style={styles.reviewStars}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} size={13} color={C.star} strokeWidth={2}
                                                fill={s <= stars ? C.star : 'transparent'} />
                                        ))}
                                    </View>
                                </View>
                                {!!r.comment && <Text style={[styles.reviewComment, { color: C.muted }]}>{r.comment}</Text>}
                                <Text style={[styles.reviewDate, { color: C.muted }]}>
                                    {new Date(r.created_at).toLocaleDateString('sk-SK')}
                                </Text>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
    backBtn: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', flex: 1, letterSpacing: -0.3 },
    content: { padding: 20, paddingBottom: 48 },
    identityCard: { padding: 20, alignItems: 'center', borderRadius: RADIUS.lg },
    avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    avatarInitial: { fontSize: 34, fontWeight: '700' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    name: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4 },
    rankTier: { fontSize: 13, fontWeight: '700', marginTop: 3 },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
    memberText: { fontSize: 12.5, fontWeight: '600' },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, paddingTop: 16, borderTopWidth: 1, alignSelf: 'stretch' },
    statCol: { flex: 1, alignItems: 'center', gap: 3 },
    statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statValue: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
    statLabel: { fontSize: 11.5, fontWeight: '600' },
    statDivider: { width: 1, height: 32 },
    postedNote: { fontSize: 12, fontWeight: '600', marginTop: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginBottom: 12 },
    emptyReviews: { alignItems: 'center', paddingVertical: 28, gap: 12 },
    emptyIconBox: { width: 56, height: 56, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 13.5, fontWeight: '500' },
    reviewCard: { padding: 14, borderRadius: RADIUS.md },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    reviewAuthor: { fontSize: 14, fontWeight: '700' },
    reviewStars: { flexDirection: 'row', gap: 2 },
    reviewComment: { fontSize: 13.5, lineHeight: 19, fontWeight: '500', marginBottom: 6 },
    reviewDate: { fontSize: 11.5, fontWeight: '500' },
});
