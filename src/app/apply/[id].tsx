import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, MapPin, Building2, FileText } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { useColors } from "@/lib/useColors";
import { useText } from "@/lib/useText";
import type { Job } from "@/lib/types";

export default function ApplyScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const C = useColors();
    const text = useText();
    const currentUser = useAppStore((s) => s.currentUser);
    const addAppliedJob = useAppStore((s) => s.addAppliedJob);

    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadJob();
    }, [id]);

    const loadJob = async () => {
        if (!id) return;

        try {
            const { data: jobData, error } = await supabase
                .from("jobs")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error fetching job:", error);
                Alert.alert("Chyba", "Nepodarilo sa načítať brigádu");
                router.back();
                return;
            }

            if (jobData) {
                const mappedJob: Job = {
                    id: jobData.id,
                    title: jobData.title,
                    description: jobData.description,
                    company: jobData.company_name,
                    location: jobData.location,
                    salaryType: jobData.pay_type as "hourly" | "fixed",
                    salaryAmount: jobData.pay_amount,
                    salaryCurrency: "USD",
                    duration: jobData.duration,
                    category: jobData.category,
                    postedAt: new Date(jobData.created_at).toISOString().split("T")[0],
                    employerId: jobData.employer_id,
                    isUrgent: jobData.is_urgent,
                    applicantsCount: 0,
                    requirements: [],
                    benefits: [],
                    createdAt: jobData.created_at,
                };
                setJob(mappedJob);
            }
        } catch (error) {
            console.error("Exception loading job:", error);
            Alert.alert("Chyba", "Nepodarilo sa načítať brigádu");
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!job || !currentUser) return;
        if (message.trim().length < 20) {
            Alert.alert("Chyba", "Správa musí mať aspoň 20 znakov");
            return;
        }

        setIsSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { data: existingApp } = await supabase
                .from("applications")
                .select("id")
                .eq("job_id", job.id)
                .eq("worker_id", currentUser.id)
                .single();

            if (existingApp) {
                Alert.alert("Už ste aplikovali", "Na túto brigádu ste už aplikovali");
                setIsSubmitting(false);
                return;
            }

            const { error } = await supabase
                .from("applications")
                .insert({
                    job_id: job.id,
                    worker_id: currentUser.id,
                    status: "pending",
                    message: message.trim(),
                    created_at: new Date().toISOString(),
                });

            if (error) {
                console.error("Error creating application:", error);
                Alert.alert("Chyba", "Nepodarilo sa odoslať aplikáciu");
                setIsSubmitting(false);
                return;
            }

            addAppliedJob(job.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSuccess(true);

            setTimeout(() => {
                router.back();
            }, 2000);
        } catch (error) {
            console.error("Exception:", error);
            Alert.alert("Chyba", "Nepodarilo sa odoslať aplikáciu");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.purple} />
            </SafeAreaView>
        );
    }

    if (showSuccess) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <View style={[styles.successIconBg, { backgroundColor: '#D1FAE5' }]}>
                    <CheckCircle size={48} color="#10B981" strokeWidth={1.5} />
                </View>
                <Text style={[styles.successTitle, { color: C.text }]}>
                    {text.applicationSent}
                </Text>
                <Text style={[styles.successDesc, { color: C.secondaryLabel }]}>
                    {text.employerReceivedRequest}
                </Text>
            </SafeAreaView>
        );
    }

    if (!job) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <Text style={{ fontSize: 18, color: C.text }}>
                    Brigáda nenájdená
                </Text>
            </SafeAreaView>
        );
    }

    const canSubmit = message.trim().length >= 20 && !isSubmitting;

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={["top"]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: C.separator }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [
                        styles.backBtn,
                        { backgroundColor: C.surface, opacity: pressed ? 0.7 : 1 },
                    ]}
                >
                    <ArrowLeft size={20} color={C.text} strokeWidth={1.8} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]}>
                    {text.applyForJob}
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Job Info Card */}
                    <View style={[styles.jobCard, { backgroundColor: C.surface, borderColor: C.separator }]}>
                        <Text style={[styles.jobTitle, { color: C.text }]}>
                            {job.title}
                        </Text>
                        <View style={styles.jobMeta}>
                            <Building2 size={14} color={C.secondaryLabel} strokeWidth={1.8} />
                            <Text style={[styles.jobMetaText, { color: C.secondaryLabel }]}>
                                {job.company}
                            </Text>
                        </View>
                        <View style={styles.jobMeta}>
                            <MapPin size={14} color={C.secondaryLabel} strokeWidth={1.8} />
                            <Text style={[styles.jobMetaText, { color: C.secondaryLabel }]}>
                                {job.location}
                            </Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FileText size={16} color={C.text} strokeWidth={1.8} />
                            <Text style={[styles.sectionTitle, { color: C.text }]}>
                                {text.writeWhySuitable}
                            </Text>
                        </View>
                        <Text style={[styles.sectionHint, { color: C.tertiaryLabel }]}>
                            {text.minCharacters}
                        </Text>

                        <View style={[styles.textAreaWrap, { backgroundColor: C.surface, borderColor: C.separator }]}>
                            <TextInput
                                style={[styles.textArea, { color: C.text }]}
                                placeholder="Napíšte prečo ste vhodný pre túto prácu..."
                                placeholderTextColor={C.tertiaryLabel}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={500}
                                editable={!isSubmitting}
                            />
                        </View>
                        <Text style={[styles.charCount, { color: C.tertiaryLabel }]}>
                            {message.length}/500
                        </Text>
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        style={({ pressed }) => [
                            styles.submitBtn,
                            { opacity: pressed && canSubmit ? 0.85 : canSubmit ? 1 : 0.5 },
                        ]}
                    >
                        {canSubmit ? (
                            <LinearGradient
                                colors={['#9333EA', '#7C3AED', '#6D28D9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.submitGradient}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitText}>{text.sendApplication}</Text>
                                )}
                            </LinearGradient>
                        ) : (
                            <View style={[styles.submitGradient, { backgroundColor: C.surface2 }]}>
                                <Text style={[styles.submitText, { color: C.tertiaryLabel }]}>
                                    {text.sendApplication}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    successIconBg: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 8,
    },
    successDesc: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 22,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    jobCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: StyleSheet.hairlineWidth,
    },
    jobTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 10,
    },
    jobMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    jobMetaText: {
        fontSize: 14,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    sectionHint: {
        fontSize: 13,
        marginBottom: 12,
        marginLeft: 24,
    },
    textAreaWrap: {
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },
    textArea: {
        padding: 16,
        fontSize: 16,
        minHeight: 150,
        textAlignVertical: "top",
    },
    charCount: {
        fontSize: 12,
        marginTop: 8,
        textAlign: "right",
    },
    submitBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    submitGradient: {
        paddingVertical: 16,
        alignItems: "center",
        borderRadius: 16,
    },
    submitText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
