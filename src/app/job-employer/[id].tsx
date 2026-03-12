import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    ChevronLeft,
    MapPin,
    Clock,
    Users,
    CheckCircle,
    XCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/lib/useColors";
import { useText } from "@/lib/useText";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";

interface Applicant {
    id: string;
    status: "pending" | "accepted" | "rejected";
    message: string;
    created_at: string;
    worker: {
        id: string;
        display_name: string;
        avatar_url?: string;
    };
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
    const C = useColors();
    const text = useText();
    const currentUser = useAppStore((s) => s.currentUser);

    const [job, setJob] = useState<JobDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<"new" | "accepted" | "rejected">("new");

    useEffect(() => {
        loadJobDetail();
    }, [id]);

    const loadJobDetail = async () => {
        if (!id) return;

        try {
            const { data, error } = await supabase
                .from("jobs")
                .select(`
          *,
          applications(
            id,
            status,
            message,
            created_at,
            worker:worker_id(id, display_name, avatar_url)
          )
        `)
                .eq("id", id)
                .single();

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

            const { error } = await supabase
                .from("applications")
                .update({ status: newStatus })
                .eq("id", applicationId);

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
            case "new":
                return job.applications.filter((app) => app.status === "pending");
            case "accepted":
                return job.applications.filter((app) => app.status === "accepted");
            case "rejected":
                return job.applications.filter((app) => app.status === "rejected");
            default:
                return [];
        }
    };

    const getTabCount = (status: "pending" | "accepted" | "rejected") => {
        if (!job) return 0;
        return job.applications.filter((app) => app.status === status).length;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.purple} />
            </SafeAreaView>
        );
    }

    if (!job) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: C.bg }]}>
                <Text style={{ color: C.text, fontSize: 16 }}>{text.jobNotFound}</Text>
            </SafeAreaView>
        );
    }

    const filteredApplicants = getFilteredApplicants();

    const tabs: { key: typeof selectedTab; label: string; status: "pending" | "accepted" | "rejected"; color: string; bgColor: string }[] = [
        { key: "new", label: text.new, status: "pending", color: "#F59E0B", bgColor: "#FEF3C7" },
        { key: "accepted", label: text.accepted, status: "accepted", color: "#10B981", bgColor: "#D1FAE5" },
        { key: "rejected", label: text.rejected, status: "rejected", color: "#EF4444", bgColor: "#FEE2E2" },
    ];

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={["top"]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: C.separator }]}>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    style={({ pressed }) => [
                        styles.backBtn,
                        { backgroundColor: C.surface, opacity: pressed ? 0.7 : 1 },
                    ]}
                >
                    <ChevronLeft size={20} color={C.text} strokeWidth={1.8} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>
                    {job.title}
                </Text>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Job Info Card */}
                <View style={styles.cardSection}>
                    <View style={[styles.jobCard, { backgroundColor: C.surface, borderColor: C.separator }]}>
                        <Text style={[styles.companyName, { color: C.secondaryLabel }]}>
                            {job.company_name}
                        </Text>

                        <View style={styles.metaRow}>
                            <MapPin size={15} color={C.secondaryLabel} strokeWidth={1.8} />
                            <Text style={[styles.metaText, { color: C.secondaryLabel }]}>
                                {job.location}
                            </Text>
                        </View>

                        <View style={styles.metaRow}>
                            <Clock size={15} color={C.secondaryLabel} strokeWidth={1.8} />
                            <Text style={[styles.metaText, { color: C.secondaryLabel }]}>
                                {job.duration}
                            </Text>
                        </View>

                        {/* Pay badge */}
                        <View style={[styles.payBadge, { backgroundColor: C.purpleDim }]}>
                            <Text style={[styles.payAmount, { color: C.purple }]}>
                                €{job.pay_amount}
                            </Text>
                            <Text style={[styles.payType, { color: C.purple }]}>
                                {job.pay_type === "hourly" ? text.perHour : text.fixedPrice}
                            </Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={[styles.sectionLabel, { color: C.text }]}>
                        {text.aboutThisJob}
                    </Text>
                    <Text style={[styles.descText, { color: C.secondaryLabel }]}>
                        {job.description}
                    </Text>
                </View>

                {/* Applicants Section */}
                <View style={styles.applicantSection}>
                    <Text style={[styles.applicantTitle, { color: C.text }]}>
                        {text.applicants} ({job.applications.length})
                    </Text>

                    {/* Segmented Tabs */}
                    <View style={[styles.segControl, { backgroundColor: C.surface }]}>
                        {tabs.map((tab) => {
                            const isActive = selectedTab === tab.key;
                            return (
                                <Pressable
                                    key={tab.key}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedTab(tab.key);
                                    }}
                                    style={[
                                        styles.segTab,
                                        isActive && { backgroundColor: tab.bgColor },
                                    ]}
                                >
                                    <Text style={[
                                        styles.segTabText,
                                        { color: isActive ? tab.color : C.secondaryLabel },
                                    ]}>
                                        ● {tab.label} ({getTabCount(tab.status)})
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Applicants List */}
                    {filteredApplicants.length === 0 ? (
                        <View style={styles.emptyApplicants}>
                            <Users size={36} color={C.tertiaryLabel} strokeWidth={1.5} />
                            <Text style={[styles.emptyText, { color: C.tertiaryLabel }]}>
                                {text.noApplicantsInCategory}
                            </Text>
                        </View>
                    ) : (
                        filteredApplicants.map((applicant) => (
                            <View
                                key={applicant.id}
                                style={[styles.applicantCard, { backgroundColor: C.surface, borderColor: C.separator }]}
                            >
                                {/* Avatar + Info */}
                                <View style={styles.applicantHeader}>
                                    <View style={[styles.applicantAvatar, { backgroundColor: C.purpleDim }]}>
                                        <Text style={[styles.applicantInitial, { color: C.purple }]}>
                                            {applicant.worker.display_name?.[0]?.toUpperCase() || "?"}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.applicantName, { color: C.text }]}>
                                            {applicant.worker.display_name || "Unknown"}
                                        </Text>
                                        <Text style={[styles.applicantDate, { color: C.tertiaryLabel }]}>
                                            {text.applied} {new Date(applicant.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Message */}
                                {applicant.message && (
                                    <Text style={[styles.applicantMsg, { color: C.secondaryLabel }]}>
                                        {applicant.message}
                                    </Text>
                                )}

                                {/* Action Buttons */}
                                {applicant.status === "pending" && (
                                    <View style={styles.actionRow}>
                                        <Pressable
                                            onPress={() => updateApplicationStatus(applicant.id, "accepted")}
                                            style={({ pressed }) => [
                                                styles.actionBtn,
                                                styles.acceptBtn,
                                                { opacity: pressed ? 0.8 : 1 },
                                            ]}
                                        >
                                            <CheckCircle size={18} color="#FFFFFF" strokeWidth={1.8} />
                                            <Text style={styles.actionBtnText}>{text.accept}</Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => updateApplicationStatus(applicant.id, "rejected")}
                                            style={({ pressed }) => [
                                                styles.actionBtn,
                                                { backgroundColor: C.surface2, opacity: pressed ? 0.8 : 1 },
                                            ]}
                                        >
                                            <XCircle size={18} color={C.text} strokeWidth={1.8} />
                                            <Text style={[styles.actionBtnText, { color: C.text }]}>
                                                {text.reject}
                                            </Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
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
        flex: 1,
    },
    cardSection: {
        padding: 20,
    },
    jobCard: {
        borderRadius: 16,
        padding: 18,
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: 20,
    },
    companyName: {
        fontSize: 14,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 6,
    },
    metaText: {
        fontSize: 14,
    },
    payBadge: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        marginTop: 14,
    },
    payAmount: {
        fontSize: 20,
        fontWeight: "700",
    },
    payType: {
        fontSize: 13,
        marginTop: 2,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    descText: {
        fontSize: 14,
        lineHeight: 21,
    },
    applicantSection: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    applicantTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 14,
    },
    segControl: {
        flexDirection: "row",
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
    },
    segTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: "center",
    },
    segTabText: {
        fontSize: 12,
        fontWeight: "600",
    },
    emptyApplicants: {
        alignItems: "center",
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
    },
    applicantCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    applicantHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    applicantAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    applicantInitial: {
        fontSize: 20,
        fontWeight: "600",
    },
    applicantName: {
        fontSize: 16,
        fontWeight: "600",
    },
    applicantDate: {
        fontSize: 12,
        marginTop: 2,
    },
    applicantMsg: {
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    acceptBtn: {
        backgroundColor: "#10B981",
    },
    actionBtnText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
});
