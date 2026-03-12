import React, { useEffect, useState, useMemo } from "react";
import {
    View, Text, ScrollView, Pressable, ActivityIndicator,
    Share, StyleSheet, Animated, Linking, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
    ChevronLeft, MoreHorizontal, Heart, MapPin, Clock,
    Briefcase, DollarSign, Users, MessageSquare, CheckCircle,
    Coffee, ShoppingBag, Truck, PartyPopper, Sparkles,
    Package, FileText, Star,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { useText } from "@/lib/useText";
import type { Job } from "@/lib/types";
import { JOB_CATEGORIES } from "@/lib/types";
import useThemeStore from "@/lib/state/theme-store";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";
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

export default function JobDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const text = useText();
    const C = useColors();
    const language = useThemeStore((s) => s.language);
    const st = useMemo(() => makeStyles(C), [C]);

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
            // Try Apple Maps first, fallback to Google Maps
            Linking.openURL(`maps://maps.apple.com/?q=${encoded}`).catch(() => {
                Linking.openURL(`https://maps.google.com/?q=${encoded}`);
            });
        } else {
            // Android: try Google Maps app, fallback to web
            Linking.openURL(`geo:0,0?q=${encoded}`).catch(() => {
                Linking.openURL(`https://maps.google.com/?q=${encoded}`);
            });
        }
    };

    // ── Loading ──
    if (isLoading) {
        return (
            <SafeAreaView style={[st.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={C.purple} />
            </SafeAreaView>
        );
    }

    // ── Error ──
    if (error || !job) {
        return (
            <SafeAreaView style={[st.container, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }]}>
                <Text style={[st.errorText, { color: C.text }]}>{error || "Pozícia sa nenašla"}</Text>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [st.errorBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
                    <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 15 }}>Späť</Text>
                </Pressable>
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
    const formatSalary = () => job.salaryType === "hourly" ? `€${job.salaryAmount}/hr` : `€${job.salaryAmount}`;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={st.container} edges={['top']}>
                {/* Header */}
                <View style={st.header}>
                    <Pressable onPress={() => router.back()} style={({ pressed }) => [st.headerBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
                        <ChevronLeft size={20} color={C.text} />
                    </Pressable>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable onPress={handleShare} style={({ pressed }) => [st.headerBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
                            <MoreHorizontal size={20} color={C.text} />
                        </Pressable>
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <Pressable onPress={handleSaveToggle}
                                style={({ pressed }) => [st.headerBtn, isSaved && { backgroundColor: C.purpleDim }, pressed && { transform: [{ scale: 0.97 }] }]}>
                                <Heart size={20} color={isSaved ? C.purple : C.secondaryLabel as string} fill={isSaved ? C.purple : "transparent"} />
                            </Pressable>
                        </Animated.View>
                    </View>
                </View>

                {/* Scroll Content */}
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
                    {/* Company */}
                    <View style={st.companySection}>
                        <View style={st.companyRow}>
                            <View style={st.companyLogo}><CategoryIcon size={28} color={C.purpleLight} /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={st.companyName}>{job.company}</Text>
                                <Text style={st.jobTitle}>{jobTitle}</Text>
                            </View>
                        </View>
                        <View style={st.tagsRow}>
                            <View style={st.tag}><Text style={st.tagText}>{categoryName}</Text></View>
                            {job.isUrgent && <View style={st.urgentTag}><Text style={st.urgentTagText}>Urgentné</Text></View>}
                        </View>
                    </View>

                    {/* Info Grid */}
                    <View style={st.infoGrid}>
                        <View style={st.infoRow}>
                            <Pressable onPress={() => openInMaps(jobLocation)} style={({ pressed }) => [st.infoCard, pressed && { opacity: 0.8 }]}>
                                <View style={st.infoIconRow}><MapPin size={16} color={C.purple} /><Text style={st.infoLabel}>Lokácia</Text></View>
                                <Text style={st.infoValue}>{jobLocation}</Text>
                            </Pressable>
                            <View style={st.infoCard}>
                                <View style={st.infoIconRow}><Clock size={16} color={C.secondaryLabel as string} /><Text style={st.infoLabel}>Čas</Text></View>
                                <Text style={st.infoValue}>{jobDuration}</Text>
                            </View>
                        </View>
                        <View style={st.infoRow}>
                            <View style={st.infoCard}>
                                <View style={st.infoIconRow}><Briefcase size={16} color={C.secondaryLabel as string} /><Text style={st.infoLabel}>Typ</Text></View>
                                <Text style={st.infoValue}>{job.salaryType === "hourly" ? "Hodinová" : "Fixná"}</Text>
                            </View>
                            <View style={st.infoCard}>
                                <View style={st.infoIconRow}><DollarSign size={16} color={C.secondaryLabel as string} /><Text style={st.infoLabel}>Mzda</Text></View>
                                <Text style={st.infoValueBig}>{formatSalary()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={st.section}>
                        <Text style={st.sectionTitle}>Popis pozície</Text>
                        <View style={st.descCard}><Text style={st.descText}>{jobDesc}</Text></View>
                    </View>

                    {/* Requirements */}
                    <View style={st.section}>
                        <Text style={st.sectionTitle}>Požiadavky</Text>
                        <View style={st.reqCard}>
                            {jobRequirements.length > 0 ? (
                                jobRequirements.map((req, i) => (
                                    <View key={i} style={st.reqItem}>
                                        <CheckCircle size={20} color={C.purple} /><Text style={st.reqText}>{req}</Text>
                                    </View>
                                ))
                            ) : (
                                <>
                                    <View style={st.reqItem}><CheckCircle size={20} color={C.purple} /><Text style={st.reqText}>Dostupnosť: {jobDuration}</Text></View>
                                    <View style={st.reqItem}><CheckCircle size={20} color={C.purple} /><Text style={st.reqText}>Lokácia: {jobLocation}</Text></View>
                                    {job.requiresIntroduction && (
                                        <View style={st.reqItem}><CheckCircle size={20} color={C.purple} /><Text style={st.reqText}>Vyžaduje sa úvodná správa</Text></View>
                                    )}
                                </>
                            )}
                        </View>
                    </View>

                    {/* Location / Map */}
                    <View style={st.section}>
                        <Text style={st.sectionTitle}>Lokácia</Text>
                        <JobLocationMap location={jobLocation} height={200} />
                    </View>

                    {/* Applicants */}
                    <View style={st.section}>
                        <Text style={st.sectionTitle}>Uchádzači</Text>
                        <View style={st.applicantsCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={st.applicantsCount}>{job.applicantsCount} uchádzačov</Text>
                                <Text style={st.applicantsSub}>{job.applicantsCount === 0 ? 'Buď prvý kto sa prihlási' : 'Už sa prihlásili'}</Text>
                            </View>
                            <Users size={22} color={C.secondaryLabel as string} />
                        </View>
                    </View>

                    <View style={[st.section, { marginBottom: 0 }]}>
                        <Text style={{ fontSize: 13, color: C.secondaryLabel }}>Zverejnené {job.postedAt}</Text>
                    </View>
                </ScrollView>

                {/* Bottom bar */}
                <View style={st.bottomBar}>
                    <Pressable onPress={() => router.push(`/messages/${job.employerId}${job.id ? `?jobId=${job.id}` : ''}`)}
                        style={({ pressed }) => [st.msgBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
                        <MessageSquare size={22} color={C.text} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <Pressable onPress={isApplied ? undefined : handleApply} disabled={isApplied}
                            style={({ pressed }) => [pressed && !isApplied && { transform: [{ scale: 0.97 }] }]}>
                            <LinearGradient
                                colors={isApplied ? [C.surface2, C.surface2] : ['#9333EA', '#7C3AED', '#6D28D9']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={st.applyBtn}>
                                <Text style={[st.applyText, isApplied && { color: C.secondaryLabel }]}>
                                    {isApplied ? "✓ Prihlásené" : "Prihlásiť sa"}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    errorText: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    errorBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: C.purple, borderRadius: 14 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    headerBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },

    companySection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
    companyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    companyLogo: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    companyName: { fontSize: 14, color: C.secondaryLabel, marginBottom: 4 },
    jobTitle: { fontSize: 22, fontWeight: '700', color: C.text },
    tagsRow: { flexDirection: 'row', gap: 8 },
    tag: { backgroundColor: C.purpleDim, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
    tagText: { fontSize: 13, fontWeight: '600', color: C.purpleLight },
    urgentTag: { backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
    urgentTagText: { fontSize: 13, fontWeight: '600', color: C.green },

    infoGrid: { paddingHorizontal: 20, marginBottom: 24, gap: 10 },
    infoRow: { flexDirection: 'row', gap: 10 },
    infoCard: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
    infoIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    infoLabel: { fontSize: 13, color: C.secondaryLabel },
    infoValue: { fontSize: 16, fontWeight: '700', color: C.text },
    infoValueBig: { fontSize: 20, fontWeight: '700', color: C.text },

    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 12 },
    descCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
    descText: { fontSize: 15, lineHeight: 24, color: C.secondaryLabel },
    reqCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 12 },
    reqItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reqText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 20 },

    applicantsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
    applicantsCount: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
    applicantsSub: { fontSize: 13, color: C.secondaryLabel },

    bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 12, backgroundColor: C.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
    msgBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    applyBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    applyText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
