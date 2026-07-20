import React, { useState, useEffect } from "react";
import {
    View, Text, ScrollView, Pressable, TextInput, ActivityIndicator,
    KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, MapPin, Building2, FileText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { useFlint, RADIUS } from "@/lib/useFlint";
import { useText } from "@/lib/useText";
import type { Job } from "@/lib/types";
import { goBack } from '@/lib/nav';
import { showAlert } from '@/lib/notify';

export default function ApplyScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const C = useFlint();
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
                job_id: job.id, worker_id: currentUser.id, worker_user_id: currentUser.id, status: "pending",
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
                <View style={[styles.successIcon, { backgroundColor: C.greenDim }]}>
                    <CheckCircle size={46} color={C.green} strokeWidth={1.8} />
                </View>
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
                    <View style={[styles.backBtn, { backgroundColor: C.card2 }]}>
                        <ArrowLeft size={20} color={C.text} strokeWidth={2} />
                    </View>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]}>{text.applyForJob}</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Job Info Card */}
                    <View style={[styles.jobCard, { backgroundColor: C.card }]}>
                        <Text style={[styles.jobTitle, { color: C.text }]}>{job.title}</Text>
                        <View style={styles.jobMeta}>
                            <Building2 size={14} color={C.muted} strokeWidth={1.9} />
                            <Text style={[styles.jobMetaText, { color: C.muted }]}>{job.company}</Text>
                        </View>
                        <View style={styles.jobMeta}>
                            <MapPin size={14} color={C.muted} strokeWidth={1.9} />
                            <Text style={[styles.jobMetaText, { color: C.muted }]}>{job.location}</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FileText size={16} color={C.accent} strokeWidth={2} />
                            <Text style={[styles.sectionTitle, { color: C.text }]}>{text.writeWhySuitable}</Text>
                        </View>
                        <Text style={[styles.sectionHint, { color: C.muted }]}>{text.minCharacters}</Text>

                        <View style={[styles.textAreaWrap, { backgroundColor: C.card2 }]}>
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
                        </View>
                        <Text style={[styles.charCount, { color: C.muted }]}>{message.length}/500</Text>
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        style={({ pressed }) => [
                            styles.submitBtn,
                            { backgroundColor: C.accent, opacity: canSubmit ? (pressed ? 0.9 : 1) : 0.5 },
                            pressed && canSubmit && { transform: [{ scale: 0.98 }] },
                        ]}
                    >
                        {isSubmitting ? <ActivityIndicator color={C.onAccent} /> : <Text style={[styles.submitText, { color: C.onAccent }]}>{text.sendApplication}</Text>}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
    successIcon: { width: 88, height: 88, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
    successTitle: { fontSize: 23, fontWeight: "700", textAlign: "center", marginBottom: 8, marginTop: 24, letterSpacing: -0.4 },
    successDesc: { fontSize: 15, textAlign: "center", lineHeight: 22, fontWeight: '500' },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
    backBtn: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    jobCard: { borderRadius: RADIUS.lg, padding: 18, marginBottom: 22 },
    jobTitle: { fontSize: 19, fontWeight: "700", marginBottom: 10, letterSpacing: -0.4 },
    jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    jobMetaText: { fontSize: 14, fontWeight: '600' },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    sectionTitle: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
    sectionHint: { fontSize: 13, marginBottom: 12, marginLeft: 24, fontWeight: '500' },
    textAreaWrap: { borderRadius: RADIUS.md },
    textArea: { padding: 16, fontSize: 15, minHeight: 150, textAlignVertical: "top", fontWeight: '500' },
    charCount: { fontSize: 12, marginTop: 8, textAlign: "right", fontWeight: '600' },
    submitBtn: { borderRadius: RADIUS.md, paddingVertical: 17, alignItems: "center", marginBottom: 20 },
    submitText: { fontSize: 16, fontWeight: "700" },
});
