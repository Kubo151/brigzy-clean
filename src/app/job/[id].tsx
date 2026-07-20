import React, { useEffect, useState } from "react";
import {
    View, Text, ScrollView, Pressable, ActivityIndicator,
    Share, StyleSheet, Animated, Linking, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
    ChevronLeft, MoreHorizontal, Heart, MapPin, Clock,
    Briefcase, Euro, Users, MessageSquare, Check, Shield, Star,
    Coffee, ShoppingBag, Truck, PartyPopper, Sparkles,
    Package, FileText, Zap,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { useText } from "@/lib/useText";
import type { Job } from "@/lib/types";
import { JOB_CATEGORIES } from "@/lib/types";
import useThemeStore from "@/lib/state/theme-store";
import { useFlint, RADIUS } from "@/lib/useFlint";
import type { FlintColors } from "@/lib/useFlint";
import { Button } from "@/components/ui";
import JobLocationMap from "@/components/JobLocationMap";
import { goBack } from '@/lib/nav';

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'hospitality': return Coffee;
        case 'retail': return ShoppingBag;
        case 'delivery': return Truck;
        case 'events': return PartyPopper;
        case 'cleaning': return Sparkles;
        case 'construction': return Briefcase;
        case 'moving': return Package;
        case 'admin': return FileText;
        default: return Briefcase;
    }
};

// ─── small round flat icon button (header) ───
function HeaderIconButton({ children, onPress, active, C }: {
    children: React.ReactNode; onPress: () => void; active?: boolean; C: FlintColors;
}) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 }]}>
            <View style={{
                width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? C.accentDim : C.card2, borderRadius: RADIUS.md,
            }}>
                {children}
            </View>
        </Pressable>
    );
}

export default function JobDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const text = useText();
    const C = useFlint();
    const language = useThemeStore((s) => s.language);

    const currentUser = useAppStore((s) => s.currentUser);
    const savedJobIds = useAppStore((s) => s.savedJobIds);
    const toggleSavedJob = useAppStore((s) => s.toggleSavedJob);

    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isApplied, setIsApplied] = useState(false);
    const heartScale = React.useRef(new Animated.Value(1)).current;

    const isSaved = job ? savedJobIds.includes(job.id) : false;

    useEffect(() => { loadJobDetails(); }, [id]);
    useEffect(() => { checkIfApplied(); }, [id, currentUser?.id]);

    const checkIfApplied = async () => {
        if (!id || !currentUser?.id) return;
        try {
            const { data } = await supabase.from('applications').select('id')
                .eq('job_id', id).eq('worker_id', currentUser.id).maybeSingle();
            setIsApplied(!!data);
        } catch { setIsApplied(false); }
    };

    const loadJobDetails = async () => {
        if (!id) return;
        try {
            setIsLoading(true); setError(null);
            const { data: jobData, error: jobError } = await supabase
                .from("jobs").select("*").eq("id", id).single();
            if (jobError) { setError("Nepodarilo sa načítať detail"); return; }
            if (jobData) {
                setJob({
                    id: jobData.id, title: jobData.title, description: jobData.description,
                    company: jobData.company_name, location: jobData.location,
                    salaryType: jobData.pay_type as "hourly" | "fixed",
                    salaryAmount: jobData.pay_amount, salaryCurrency: "EUR",
                    duration: jobData.duration, category: jobData.category,
                    postedAt: new Date(jobData.created_at).toISOString().split("T")[0],
                    employerId: jobData.employer_id,
                    applicantsCount: jobData.applicants_count || 0,
                    requiresIntroduction: jobData.requires_introduction || false,
                    isUrgent: jobData.is_urgent || false,
                    requirements: jobData.requirements || [],
                    title_sk: jobData.title_sk, description_sk: jobData.description_sk,
                    location_sk: jobData.location_sk, duration_sk: jobData.duration_sk,
                    requirements_sk: jobData.requirements_sk || [],
                });
            }
        } catch { setError("Nastala chyba"); }
        finally { setIsLoading(false); }
    };

    const handleSaveToggle = () => {
        if (!job) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.sequence([
            Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true }),
            Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
        ]).start();
        toggleSavedJob(job.id);
    };

    const handleShare = async () => {
        if (!job) return;
        try { await Share.share({ message: `Pozri túto brigádu: ${job.title} v ${job.company}` }); }
        catch { }
    };

    const handleApply = () => {
        if (!job) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/apply/${job.id}`);
    };

    const openInMaps = (location: string) => {
        const encoded = encodeURIComponent(location);
        if (Platform.OS === 'ios') {
            Linking.openURL(`maps://maps.apple.com/?q=${encoded}`).catch(() => {
                Linking.openURL(`https://maps.google.com/?q=${encoded}`);
            });
        } else {
            Linking.openURL(`geo:0,0?q=${encoded}`).catch(() => {
                Linking.openURL(`https://maps.google.com/?q=${encoded}`);
            });
        }
    };

    // ── Loading ──
    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={C.accent} />
            </SafeAreaView>
        );
    }

    // ── Error ──
    if (error || !job) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 16 }}>{error || "Pozícia sa nenašla"}</Text>
                <Button label="Späť" onPress={() => goBack()} />
            </SafeAreaView>
        );
    }

    const categoryInfo = JOB_CATEGORIES.find((c) => c.id === job.category);
    const categoryName = categoryInfo ? (language === "sk" && categoryInfo.name_sk ? categoryInfo.name_sk : categoryInfo.name) : job.category;
    const jobTitle = language === "sk" && job.title_sk ? job.title_sk : job.title;
    const jobDesc = language === "sk" && job.description_sk ? job.description_sk : job.description;
    const jobLocation = language === "sk" && job.location_sk ? job.location_sk : job.location;
    const jobDuration = language === "sk" && job.duration_sk ? job.duration_sk : job.duration;
    const jobRequirements = language === "sk" && job.requirements_sk?.length ? job.requirements_sk : job.requirements || [];
    const CategoryIcon = getCategoryIcon(job.category);
    const formatSalary = () => job.salaryType === "hourly" ? `${job.salaryAmount} €/h` : `${job.salaryAmount} €`;

    const SectionLabel = ({ children }: { children: string }) => (
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>{children}</Text>
    );

    const InfoCell = ({ icon, label, value, big }: { icon: React.ReactNode; label: string; value: string; big?: boolean }) => (
        <View style={{ flex: 1, backgroundColor: C.card, borderRadius: RADIUS.lg, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                {icon}
                <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>{label}</Text>
            </View>
            <Text style={{ fontSize: big ? 19 : 15, fontWeight: '700', color: C.text, letterSpacing: -0.3 }} numberOfLines={1}>{value}</Text>
        </View>
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <HeaderIconButton onPress={() => goBack()} C={C}>
                        <ChevronLeft size={20} color={C.text} strokeWidth={2.2} />
                    </HeaderIconButton>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <HeaderIconButton onPress={handleShare} C={C}>
                            <MoreHorizontal size={20} color={C.text} strokeWidth={2.2} />
                        </HeaderIconButton>
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <HeaderIconButton onPress={handleSaveToggle} active={isSaved} C={C}>
                                <Heart size={20} color={isSaved ? C.accent : C.muted} fill={isSaved ? C.accent : "transparent"} strokeWidth={2} />
                            </HeaderIconButton>
                        </Animated.View>
                    </View>
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
                    {/* Hero card */}
                    <View style={{ marginTop: 6, backgroundColor: C.card, borderRadius: RADIUS.lg, padding: 18 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ width: 52, height: 52, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: C.accentDim }}>
                                <CategoryIcon size={26} color={C.accent} strokeWidth={1.9} />
                            </View>
                            <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: C.accent }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: C.onAccent, letterSpacing: -0.3 }}>{formatSalary()}</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 21, fontWeight: '700', color: C.text, letterSpacing: -0.5, marginTop: 14 }}>{jobTitle}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                            <MapPin size={15} color={C.muted} strokeWidth={2} />
                            <Text style={{ fontSize: 13.5, color: C.muted, fontWeight: '600' }}>{jobLocation}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                            <View style={{ flexDirection: 'row', gap: 1 }}>
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <Star key={i} size={13} color={C.star} fill={C.star} strokeWidth={0} />
                                ))}
                            </View>
                            <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>{job.company} · </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Shield size={13} color={C.verified} strokeWidth={2.2} />
                                <Text style={{ fontSize: 12, color: C.verified, fontWeight: '700' }}>overený</Text>
                            </View>
                        </View>
                        {/* tags */}
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                            <View style={{ backgroundColor: C.accentDim, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9 }}>
                                <Text style={{ fontSize: 11.5, fontWeight: '700', color: C.accent }}>{categoryName}</Text>
                            </View>
                            {job.isUrgent && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9, backgroundColor: C.red }}>
                                    <Zap size={12} color="#FFF" fill="#FFF" strokeWidth={0} />
                                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#FFF' }}>URGENTNÉ</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Info grid */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                        <Pressable style={{ flex: 1 }} onPress={() => openInMaps(jobLocation)}>
                            <InfoCell icon={<MapPin size={15} color={C.accent} strokeWidth={2} />} label="Lokácia" value={jobLocation} />
                        </Pressable>
                        <InfoCell icon={<Clock size={15} color={C.muted} strokeWidth={2} />} label="Čas" value={jobDuration} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <InfoCell icon={<Briefcase size={15} color={C.muted} strokeWidth={2} />} label="Typ" value={job.salaryType === "hourly" ? "Hodinová" : "Fixná"} />
                        <InfoCell icon={<Euro size={15} color={C.muted} strokeWidth={2} />} label="Mzda" value={formatSalary()} big />
                    </View>

                    {/* Description */}
                    <View style={{ marginTop: 14, backgroundColor: C.card, borderRadius: RADIUS.lg, padding: 16 }}>
                        <SectionLabel>Popis pozície</SectionLabel>
                        <Text style={{ fontSize: 14, lineHeight: 22, color: C.muted, fontWeight: '500' }}>{jobDesc}</Text>
                    </View>

                    {/* Requirements */}
                    <View style={{ marginTop: 14, backgroundColor: C.card, borderRadius: RADIUS.lg, padding: 16 }}>
                        <SectionLabel>Požiadavky</SectionLabel>
                        <View style={{ gap: 12 }}>
                            {(jobRequirements.length > 0
                                ? jobRequirements
                                : [
                                    `Dostupnosť: ${jobDuration}`,
                                    `Lokácia: ${jobLocation}`,
                                    ...(job.requiresIntroduction ? ['Vyžaduje sa úvodná správa'] : []),
                                ]
                            ).map((req, i) => (
                                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                                    <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                                        <Check size={15} color={C.accent} strokeWidth={2.6} />
                                    </View>
                                    <Text style={{ flex: 1, fontSize: 14, color: C.text, fontWeight: '600', lineHeight: 20 }}>{req}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Map — out of scope for this redesign pass, left on the legacy color system */}
                    <View style={{ marginTop: 14 }}>
                        <SectionLabel>Lokácia</SectionLabel>
                        <View style={{ borderRadius: RADIUS.lg, overflow: 'hidden' }}>
                            <JobLocationMap location={jobLocation} height={190} />
                        </View>
                    </View>

                    {/* Applicants */}
                    <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: C.card, borderRadius: RADIUS.lg }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 }}>{job.applicantsCount} uchádzačov</Text>
                            <Text style={{ fontSize: 12.5, color: C.muted, fontWeight: '600' }}>{job.applicantsCount === 0 ? 'Buď prvý kto sa prihlási' : 'Už sa prihlásili'}</Text>
                        </View>
                        <View style={{ width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: C.accentDim }}>
                            <Users size={20} color={C.accent} strokeWidth={2} />
                        </View>
                    </View>

                    <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', marginTop: 16 }}>Zverejnené {job.postedAt}</Text>
                </ScrollView>

                {/* Bottom bar */}
                <View style={[styles.bottomBar, { backgroundColor: C.bg }]}>
                    <Pressable onPress={() => router.push(`/messages/${job.employerId}${job.id ? `?jobId=${job.id}` : ''}`)}
                        style={({ pressed }) => [pressed && { transform: [{ scale: 0.96 }] }]}
                        accessibilityLabel="Napísať správu zadávateľovi">
                        <View style={{ width: 54, height: 54, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card2 }}>
                            <MessageSquare size={22} color={C.text} strokeWidth={2} />
                        </View>
                    </Pressable>
                    {isApplied ? (
                        <View style={{ flex: 1, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.greenDim, borderRadius: RADIUS.lg }}>
                            <Check size={20} color={C.green} strokeWidth={2.6} />
                            <Text style={{ fontSize: 15, fontWeight: '700', color: C.green }}>Prihlásené</Text>
                        </View>
                    ) : (
                        <Button label="Prihlásiť sa" onPress={handleApply} flex={1} style={{ height: 54 }} />
                    )}
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
    bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 12 },
});
