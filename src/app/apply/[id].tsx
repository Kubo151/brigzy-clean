import React, { useState, useEffect } from "react";
import {
    View, Text, ScrollView, Pressable, TextInput, ActivityIndicator,
    KeyboardAvoidingView, Platform, Alert, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, MapPin, Building2, FileText } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { useClay } from "@/lib/useClay";
import { useText } from "@/lib/useText";
import type { Job } from "@/lib/types";
import { ClaySurface, ClayInset, ClayIconBox } from "@/components/clay";
import { goBack } from '@/lib/nav';
import { showAlert } from '@/lib/notify';

export default function ApplyScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const C = useClay();
    const text = useText();
    const currentUser = useAppStore((s) => s.currentUser);
    const addAppliedJob = useAppStore((s) => s.addAppliedJob);

    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { loadJob(); }, [id]);

    const loadJob = async () => {
        if (!id) return;
        try {
            const { data: jobData, error } = await supabase
                .from("jobs").select("*").eq("id", id).single();
            if (error) {
                console.error("Error fetching job:", error);
                showAlert("Chyba", "Nepodarilo sa načítať brigádu");
                goBack();
                return;
            }
            if (jobData) {
                const mappedJob: Job = {
                    id: jobData.id, title: jobData.title, description: jobData.description,
                    company: jobData.company_name, location: jobData.location,
                    salaryType: jobData.pay_type as "hourly" | "fixed",
                    salaryAmount: jobData.pay_amount, salaryCurrency: "USD",
                    duration: jobData.duration, category: jobData.category,
                    postedAt: new Date(jobData.created_at).toISOString().split("T")[0],
                    employerId: jobData.employer_id, isUrgent: jobData.is_urgent,
                    applicantsCount: 0, requirements: [],
                };
                setJob(mappedJob);
            }
        } catch (error) {
            console.error("Exception loading job:", error);
            showAlert("Chyba", "Nepodarilo sa načítať brigádu");
            goBack();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!job || !currentUser) return;
        if (message.trim().length < 20) {
            showAlert("Chyba", "Správa musí mať aspoň 20 znakov");
            return;
        }
        setIsSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { data: existingApp } = await supabase
                .from("applications").select("id")
                .eq("job_id", job.id).eq("worker_id", currentUser.id).single();
            if (existingApp) {
                showAlert("Už ste aplikovali", "Na túto brigádu ste už aplikovali");
                setIsSubmitting(false);
                return;
            }
            const { error } = await supabase.from("applications").insert({
                job_id: job.id, worker_id: currentUser.id, status: "pending",
                message: message.trim(), created_at: new Date().toISOString(),
            });
            if (error) {
                console.error("Error creating application:", error);
                showAlert("Chyba", "Nepodarilo sa odoslať aplikáciu");
                setIsSubmitting(false);
                return;
            }
            addAppliedJob(job.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSuccess(true);
            setTimeout(() => { router.replace('/my-applications'); }, 2000);
        } catch (error) {
            console.error("Exception:", error);
            showAlert("Chyba", "Nepodarilo sa odoslať aplikáciu");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.accent} />
            </SafeAreaView>
        );
    }

    if (showSuccess) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <ClayIconBox size={88} radius={28} tintBg={C.greenDim}>
                    <CheckCircle size={46} color={C.green} strokeWidth={1.8} />
                </ClayIconBox>
                <Text style={[styles.successTitle, { color: C.text }]}>{text.applicationSent}</Text>
                <Text style={[styles.successDesc, { color: C.muted }]}>{text.employerReceivedRequest}</Text>
            </SafeAreaView>
        );
    }

    if (!job) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <Text style={{ fontSize: 18, color: C.text, fontWeight: '700' }}>Brigáda nenájdená</Text>
            </SafeAreaView>
        );
    }

    const canSubmit = message.trim().length >= 20 && !isSubmitting;

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={20} color={C.text} strokeWidth={2} />
                    </ClaySurface>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]}>{text.applyForJob}</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Job Info Card */}
                    <ClaySurface radius={20} style={{ marginBottom: 22 }} contentStyle={{ padding: 18 }}>
                        <Text style={[styles.jobTitle, { color: C.text }]}>{job.title}</Text>
                        <View style={styles.jobMeta}>
                            <Building2 size={14} color={C.muted} strokeWidth={1.9} />
                            <Text style={[styles.jobMetaText, { color: C.muted }]}>{job.company}</Text>
                        </View>
                        <View style={styles.jobMeta}>
                            <MapPin size={14} color={C.muted} strokeWidth={1.9} />
                            <Text style={[styles.jobMetaText, { color: C.muted }]}>{job.location}</Text>
                        </View>
                    </ClaySurface>

                    {/* Message Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FileText size={16} color={C.accent} strokeWidth={2} />
                            <Text style={[styles.sectionTitle, { color: C.text }]}>{text.writeWhySuitable}</Text>
                        </View>
                        <Text style={[styles.sectionHint, { color: C.muted }]}>{text.minCharacters}</Text>

                        <ClayInset radius={16}>
                            <TextInput
                                style={[styles.textArea, { color: C.text }]}
                                placeholder="Napíšte prečo ste vhodný pre túto prácu..."
                                placeholderTextColor={C.muted}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={500}
                                editable={!isSubmitting}
                            />
                        </ClayInset>
                        <Text style={[styles.charCount, { color: C.muted }]}>{message.length}/500</Text>
                    </View>

                    {/* Submit Button */}
                    <Pressable onPress={handleSubmit} disabled={!canSubmit} style={({ pressed }) => [styles.submitBtn, Platform.select({
                        ios: { shadowColor: C.accentShadow.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: canSubmit ? C.accentShadow.opacity : 0, shadowRadius: 14 },
                        android: { elevation: canSubmit ? 6 : 0 },
                        web: { boxShadow: canSubmit ? `3px 6px 16px ${C.accentSd}` : 'none' } as any,
                    }), { opacity: pressed && canSubmit ? 0.9 : canSubmit ? 1 : 0.5 }]}>
                        <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.submitGradient}>
                            <LinearGradient colors={['rgba(255,255,255,0.28)', 'transparent']} style={styles.submitSheen} />
                            {isSubmitting ? <ActivityIndicator color={C.onAccent} /> : <Text style={[styles.submitText, { color: C.onAccent }]}>{text.sendApplication}</Text>}
                        </LinearGradient>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
    successTitle: { fontSize: 23, fontWeight: "800", textAlign: "center", marginBottom: 8, marginTop: 24, letterSpacing: -0.4 },
    successDesc: { fontSize: 15, textAlign: "center", lineHeight: 22, fontWeight: '500' },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
    headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    jobTitle: { fontSize: 19, fontWeight: "800", marginBottom: 10, letterSpacing: -0.4 },
    jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    jobMetaText: { fontSize: 14, fontWeight: '600' },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    sectionTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
    sectionHint: { fontSize: 13, marginBottom: 12, marginLeft: 24, fontWeight: '500' },
    textArea: { padding: 16, fontSize: 15, minHeight: 150, textAlignVertical: "top", fontWeight: '500' },
    charCount: { fontSize: 12, marginTop: 8, textAlign: "right", fontWeight: '600' },
    submitBtn: { borderRadius: 18, overflow: 'hidden', marginBottom: 20 },
    submitGradient: { paddingVertical: 17, alignItems: "center", borderRadius: 18, overflow: 'hidden' },
    submitSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
    submitText: { fontSize: 16, fontWeight: "800" },
});
