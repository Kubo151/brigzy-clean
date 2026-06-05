import React, { useState, useEffect } from "react";
import {
    View, Text, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, MapPin, Clock, Users, CheckCircle, XCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useClay } from "@/lib/useClay";
import { useText } from "@/lib/useText";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { ClaySurface, ClayIconBox } from "@/components/clay";

interface Applicant {
    id: string;
    status: "pending" | "accepted" | "rejected";
    message: string;
    created_at: string;
    worker: { id: string; display_name: string; avatar_url?: string; };
}

interface JobDetail {
    id: string;
    title: string;
    description: string;
    company_name: string;
    location: string;
    pay_type: "hourly" | "fixed";
    pay_amount: number;
    duration: string;
    category: string;
    status: string;
    applications: Applicant[];
}

export default function EmployerJobDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const C = useClay();
    const text = useText();
    const currentUser = useAppStore((s) => s.currentUser);

    const [job, setJob] = useState<JobDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<"new" | "accepted" | "rejected">("new");

    useEffect(() => { loadJobDetail(); }, [id]);

    const loadJobDetail = async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from("jobs")
                .select(`*, applications( id, status, message, created_at, worker:worker_id(id, display_name, avatar_url) )`)
                .eq("id", id).single();
            if (error) {
                console.error("❌ [EmployerJobDetail] Error:", error);
                Alert.alert(text.error, text.failedToLoadJob);
            } else {
                setJob(data as JobDetail);
            }
        } catch (error) {
            console.error("❌ [EmployerJobDetail] Exception:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateApplicationStatus = async (applicationId: string, newStatus: "accepted" | "rejected") => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", applicationId);
            if (error) throw error;
            await loadJobDetail();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error("❌ [EmployerJobDetail] Error updating status:", error);
            Alert.alert(text.error, text.failedToUpdateStatus);
        }
    };

    const getFilteredApplicants = () => {
        if (!job) return [];
        switch (selectedTab) {
            case "new": return job.applications.filter((app) => app.status === "pending");
            case "accepted": return job.applications.filter((app) => app.status === "accepted");
            case "rejected": return job.applications.filter((app) => app.status === "rejected");
            default: return [];
        }
    };

    const getTabCount = (status: "pending" | "accepted" | "rejected") => {
        if (!job) return 0;
        return job.applications.filter((app) => app.status === status).length;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.accent} />
            </SafeAreaView>
        );
    }

    if (!job) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{text.jobNotFound}</Text>
            </SafeAreaView>
        );
    }

    const filteredApplicants = getFilteredApplicants();

    const tabs: { key: typeof selectedTab; label: string; status: "pending" | "accepted" | "rejected"; color: string }[] = [
        { key: "new", label: text.new, status: "pending", color: C.star },
        { key: "accepted", label: text.accepted, status: "accepted", color: C.green },
        { key: "rejected", label: text.rejected, status: "rejected", color: C.red },
    ];

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={20} color={C.text} strokeWidth={2.2} />
                    </ClaySurface>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>{job.title}</Text>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Job Info Card */}
                <View style={styles.cardSection}>
                    <ClaySurface radius={20} style={{ marginBottom: 20 }} contentStyle={{ padding: 18 }}>
                        <Text style={[styles.companyName, { color: C.muted }]}>{job.company_name}</Text>
                        <View style={styles.metaRow}>
                            <MapPin size={15} color={C.muted} strokeWidth={1.9} />
                            <Text style={[styles.metaText, { color: C.muted }]}>{job.location}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Clock size={15} color={C.muted} strokeWidth={1.9} />
                            <Text style={[styles.metaText, { color: C.muted }]}>{job.duration}</Text>
                        </View>
                        <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.payBadge}>
                            <Text style={[styles.payAmount, { color: C.onAccent }]}>€{job.pay_amount}</Text>
                            <Text style={[styles.payType, { color: C.onAccent }]}>{job.pay_type === "hourly" ? text.perHour : text.fixedPrice}</Text>
                        </LinearGradient>
                    </ClaySurface>

                    <Text style={[styles.sectionLabel, { color: C.text }]}>{text.aboutThisJob}</Text>
                    <Text style={[styles.descText, { color: C.muted }]}>{job.description}</Text>
                </View>

                {/* Applicants Section */}
                <View style={styles.applicantSection}>
                    <Text style={[styles.applicantTitle, { color: C.text }]}>{text.applicants} ({job.applications.length})</Text>

                    {/* Segmented Tabs */}
                    <ClaySurface radius={14} style={{ marginBottom: 16 }} contentStyle={styles.segControl}>
                        {tabs.map((tab) => {
                            const isActive = selectedTab === tab.key;
                            return (
                                <Pressable key={tab.key} onPress={() => { Haptics.selectionAsync(); setSelectedTab(tab.key); }}
                                    style={[styles.segTab, isActive && { backgroundColor: tab.color + '22' }]}>
                                    <Text style={[styles.segTabText, { color: isActive ? tab.color : C.muted }]}>● {tab.label} ({getTabCount(tab.status)})</Text>
                                </Pressable>
                            );
                        })}
                    </ClaySurface>

                    {filteredApplicants.length === 0 ? (
                        <View style={styles.emptyApplicants}>
                            <ClayIconBox size={64} radius={20}><Users size={30} color={C.accent} strokeWidth={1.6} /></ClayIconBox>
                            <Text style={[styles.emptyText, { color: C.muted }]}>{text.noApplicantsInCategory}</Text>
                        </View>
                    ) : (
                        filteredApplicants.map((applicant) => (
                            <ClaySurface key={applicant.id} radius={18} style={{ marginBottom: 12 }} contentStyle={{ padding: 16 }}>
                                <View style={styles.applicantHeader}>
                                    <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.applicantAvatar}>
                                        <Text style={[styles.applicantInitial, { color: C.onAccent }]}>{applicant.worker.display_name?.[0]?.toUpperCase() || "?"}</Text>
                                    </LinearGradient>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.applicantName, { color: C.text }]}>{applicant.worker.display_name || "Unknown"}</Text>
                                        <Text style={[styles.applicantDate, { color: C.muted }]}>{text.applied} {new Date(applicant.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                {applicant.message && <Text style={[styles.applicantMsg, { color: C.muted }]}>{applicant.message}</Text>}
                                {applicant.status === "pending" && (
                                    <View style={styles.actionRow}>
                                        <Pressable onPress={() => updateApplicationStatus(applicant.id, "accepted")} style={({ pressed }) => [styles.actionBtn, { backgroundColor: C.green }, pressed && { opacity: 0.85 }]}>
                                            <CheckCircle size={18} color="#FFFFFF" strokeWidth={2} />
                                            <Text style={styles.actionBtnText}>{text.accept}</Text>
                                        </Pressable>
                                        <Pressable onPress={() => updateApplicationStatus(applicant.id, "rejected")} style={({ pressed }) => [styles.actionBtn, { backgroundColor: C.cLo, borderWidth: 1, borderColor: C.hair }, pressed && { opacity: 0.85 }]}>
                                            <XCircle size={18} color={C.text} strokeWidth={2} />
                                            <Text style={[styles.actionBtnText, { color: C.text }]}>{text.reject}</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </ClaySurface>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
    headerTitle: { fontSize: 19, fontWeight: "800", flex: 1, letterSpacing: -0.4 },
    cardSection: { padding: 20 },
    companyName: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    metaText: { fontSize: 14, fontWeight: '500' },
    payBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 13, marginTop: 14 },
    payAmount: { fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
    payType: { fontSize: 12, marginTop: 1, fontWeight: '600' },
    sectionLabel: { fontSize: 16, fontWeight: "800", marginBottom: 8, letterSpacing: -0.3 },
    descText: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
    applicantSection: { paddingHorizontal: 20, paddingBottom: 40 },
    applicantTitle: { fontSize: 18, fontWeight: "800", marginBottom: 14, letterSpacing: -0.3 },
    segControl: { flexDirection: "row", padding: 4 },
    segTab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" },
    segTabText: { fontSize: 11.5, fontWeight: "800" },
    emptyApplicants: { alignItems: "center", paddingVertical: 40, gap: 14 },
    emptyText: { fontSize: 14, fontWeight: '500' },
    applicantHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
    applicantAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    applicantInitial: { fontSize: 20, fontWeight: "800" },
    applicantName: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
    applicantDate: { fontSize: 12, marginTop: 2, fontWeight: '500' },
    applicantMsg: { fontSize: 14, lineHeight: 21, marginBottom: 12, fontWeight: '500' },
    actionRow: { flexDirection: "row", gap: 10 },
    actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    actionBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
