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
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { useText } from "@/lib/useText";
import type { Job } from "@/lib/types";
import { JOB_CATEGORIES } from "@/lib/types";
import useThemeStore from "@/lib/state/theme-store";
import { useClay } from "@/lib/useClay";
import type { ClayColors } from "@/lib/useClay";
import { ClaySurface, ClayInset, ClayButton, ClayPill, ClayIconBox } from "@/components/clay";
import JobLocationMap from "@/components/JobLocationMap";

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

// ─── small round clay icon button (header) ───
function ClayIconButton({ children, onPress, active, C }: {
    children: React.ReactNode; onPress: () => void; active?: boolean; C: ClayColors;
}) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 }]}>
            <ClaySurface radius={15} style={{ width: 44, height: 44 }} contentStyle={{
                width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? C.accentDim : 'transparent', borderRadius: 15,
            }}>
                {children}
            </ClaySurface>
        </Pressable>
    );
}

export default function JobDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const text = useText();
    const C = useClay();
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

    useEffect(() => { loadJobDetails(); checkIfApplied(); }, [id]);

    const checkIfApplied = async () => {
        if (!id || !currentUser?.id) return;
        try {
            const { data } = await supabase.from('applications').select('id')
                .eq('job_id', id).eq('worker_id', currentUser.id).single();
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
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 16 }}>{error || "Pozícia sa nenašla"}</Text>
                <ClayButton label="Späť" onPress={() => router.back()} />
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
        <Text style={{ fontSize: 10.5, fontWeight: '800', color: C.muted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>{children}</Text>
    );

    const InfoCell = ({ icon, label, value, big }: { icon: React.ReactNode; label: string; value: string; big?: boolean }) => (
        <ClaySurface radius={18} style={{ flex: 1 }} contentStyle={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                {icon}
                <Text style={{ fontSize: 12, color: C.muted, fontWeight: '700' }}>{label}</Text>
            </View>
            <Text style={{ fontSize: big ? 19 : 15, fontWeight: '800', color: C.text, letterSpacing: -0.3 }} numberOfLines={1}>{value}</Text>
        </ClaySurface>
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <ClayIconButton onPress={() => router.back()} C={C}>
                        <ChevronLeft size={20} color={C.text} strokeWidth={2.2} />
                    </ClayIconButton>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <ClayIconButton onPress={handleShare} C={C}>
                            <MoreHorizontal size={20} color={C.text} strokeWidth={2.2} />
                        </ClayIconButton>
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <ClayIconButton onPress={handleSaveToggle} active={isSaved} C={C}>
                                <Heart size={20} color={isSaved ? C.accent : C.muted} fill={isSaved ? C.accent : "transparent"} strokeWidth={2} />
                            </ClayIconButton>
                        </Animated.View>
                    </View>
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
                    {/* Hero card */}
                    <ClaySurface radius={22} style={{ marginTop: 6 }} contentStyle={{ padding: 18 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ClayIconBox size={52} radius={17}>
                                <CategoryIcon size={26} color={C.accent} strokeWidth={1.9} />
                            </ClayIconBox>
                            <LinearGradient
                                colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: '800', color: C.onAccent, letterSpacing: -0.3 }}>{formatSalary()}</Text>
                            </LinearGradient>
                        </View>
                        <Text style={{ fontSize: 21, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginTop: 14 }}>{jobTitle}</Text>
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
                                <Text style={{ fontSize: 11.5, fontWeight: '800', color: C.accent }}>{categoryName}</Text>
                            </View>
                            {job.isUrgent && (
                                <LinearGradient colors={[C.sosFrom, C.sosTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9 }}>
                                    <Zap size={12} color="#FFF" fill="#FFF" strokeWidth={0} />
                                    <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#FFF' }}>URGENTNÉ</Text>
                                </LinearGradient>
                            )}
                        </View>
                    </ClaySurface>

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
                    <ClaySurface radius={22} style={{ marginTop: 14 }} contentStyle={{ padding: 16 }}>
                        <SectionLabel>Popis pozície</SectionLabel>
                        <Text style={{ fontSize: 14, lineHeight: 22, color: C.muted, fontWeight: '500' }}>{jobDesc}</Text>
                    </ClaySurface>

                    {/* Requirements */}
                    <ClaySurface radius={22} style={{ marginTop: 14 }} contentStyle={{ padding: 16 }}>
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
                    </ClaySurface>

                    {/* Map */}
                    <View style={{ marginTop: 14 }}>
                        <SectionLabel>Lokácia</SectionLabel>
                        <View style={{ borderRadius: 20, overflow: 'hidden' }}>
                            <JobLocationMap location={jobLocation} height={190} />
                        </View>
                    </View>

                    {/* Applicants */}
                    <ClaySurface radius={22} style={{ marginTop: 14 }} contentStyle={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 4 }}>{job.applicantsCount} uchádzačov</Text>
                            <Text style={{ fontSize: 12.5, color: C.muted, fontWeight: '600' }}>{job.applicantsCount === 0 ? 'Buď prvý kto sa prihlási' : 'Už sa prihlásili'}</Text>
                        </View>
                        <ClayIconBox size={42} radius={13}><Users size={20} color={C.accent} strokeWidth={2} /></ClayIconBox>
                    </ClaySurface>

                    <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', marginTop: 16 }}>Zverejnené {job.postedAt}</Text>
                </ScrollView>

                {/* Bottom bar */}
                <View style={[styles.bottomBar, { backgroundColor: C.bg, borderTopColor: C.hair }]}>
                    <Pressable onPress={() => router.push(`/messages/${job.employerId}${job.id ? `?jobId=${job.id}` : ''}`)}
                        style={({ pressed }) => [pressed && { transform: [{ scale: 0.96 }] }]}>
                        <ClaySurface radius={16} style={{ width: 54, height: 54 }} contentStyle={{ width: 54, height: 54, alignItems: 'center', justifyContent: 'center' }}>
                            <MessageSquare size={22} color={C.text} strokeWidth={2} />
                        </ClaySurface>
                    </Pressable>
                    {isApplied ? (
                        <ClaySurface radius={18} style={{ flex: 1 }} contentStyle={{ height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Check size={20} color={C.green} strokeWidth={2.6} />
                            <Text style={{ fontSize: 15, fontWeight: '800', color: C.green }}>Prihlásené</Text>
                        </ClaySurface>
                    ) : (
                        <ClayButton label="Prihlásiť sa" onPress={handleApply} flex={1} style={{ height: 54 }} />
                    )}
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
    bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
