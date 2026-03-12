import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, MapPin, Briefcase, Users, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useText } from "@/lib/useText";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";
import type { JobCategory } from "@/lib/types";

type JobStatus = "open" | "in_progress" | "completed" | "cancelled";

interface EmployerJob {
  id: string;
  title: string;
  company_name: string;
  location: string;
  pay_type: "hourly" | "fixed";
  pay_amount: number;
  status: JobStatus;
  category: JobCategory;
  created_at: string;
  applications_count?: number;
}

export default function MyJobsScreen() {
  const router = useRouter();
  const C = useColors();
  const text = useText();
  const currentUser = useAppStore((s) => s.currentUser);
  const st = useMemo(() => makeStyles(C), [C]);

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    try {
      if (!currentUser?.id) { setIsLoading(false); return; }
      const { data: jobsData, error } = await supabase
        .from("jobs")
        .select(`*, applications(count)`)
        .eq("employer_id", currentUser.id)
        .order("created_at", { ascending: false });
      if (error) { console.error("Error loading jobs:", error); }
      else {
        setJobs((jobsData || []).map((job) => ({
          id: job.id, title: job.title, company_name: job.company_name,
          location: job.location, pay_type: job.pay_type, pay_amount: job.pay_amount,
          status: job.status || "open", category: job.category, created_at: job.created_at,
          applications_count: Array.isArray(job.applications) ? job.applications[0]?.count || 0 : 0,
        })));
      }
    } catch (e) { console.error("Exception:", e); }
    finally { setIsLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); loadJobs(); };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case "open": return C.green;
      case "in_progress": return C.blue;
      case "completed": return C.secondaryLabel;
      case "cancelled": return C.red;
      default: return C.secondaryLabel;
    }
  };

  const getStatusLabel = (status: JobStatus) => {
    switch (status) {
      case "open": return text.open;
      case "in_progress": return text.inProgress;
      case "completed": return text.completedStatus;
      case "cancelled": return text.cancelled;
      default: return status;
    }
  };

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      {/* Header */}
      <View style={st.header}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={({ pressed }) => [st.backBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
          <ChevronLeft size={22} color={C.text} />
        </Pressable>
        <Text style={st.headerTitle}>{text.myJobs}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} />}
      >
        {isLoading ? (
          <View style={st.center}>
            <ActivityIndicator size="large" color={C.purple} />
            <Text style={[st.loadingText, { color: C.secondaryLabel }]}>{text.loadingJobs}</Text>
          </View>
        ) : jobs.length === 0 ? (
          <View style={st.emptyWrap}>
            <View style={[st.emptyIcon, { backgroundColor: C.purpleDim }]}>
              <Briefcase size={42} color={C.purple} strokeWidth={1.5} />
            </View>
            <Text style={[st.emptyTitle, { color: C.text }]}>{text.noJobsPostedYet}</Text>
            <Text style={[st.emptyDesc, { color: C.secondaryLabel }]}>{text.postYourFirstJob}</Text>
            <Pressable onPress={() => router.push("/(tabs)/add")}
              style={({ pressed }) => [st.emptyBtn, { opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient colors={['#9333EA', '#7C3AED', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.emptyBtnGrad}>
                <Text style={st.emptyBtnText}>{text.postAJob}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={st.listWrap}>
            <View style={st.cardGroup}>
              {jobs.map((job, index) => (
                <React.Fragment key={job.id}>
                  {index > 0 && <View style={st.divider} />}
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/job-employer/${job.id}`); }}
                    style={({ pressed }) => [st.jobRow, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <View style={[st.statusDot, { backgroundColor: getStatusColor(job.status) }]} />
                        <Text style={[st.statusText, { color: getStatusColor(job.status) }]}>{getStatusLabel(job.status)}</Text>
                        {!!job.applications_count && job.applications_count > 0 && (
                          <View style={[st.appBadge, { backgroundColor: C.purpleDim }]}>
                            <Users size={10} color={C.purple} />
                            <Text style={[st.appBadgeText, { color: C.purple }]}>{job.applications_count}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[st.jobTitle, { color: C.text }]}>{job.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} color={C.tertiaryLabel} />
                        <Text style={[st.jobLocation, { color: C.secondaryLabel }]}>{job.location}</Text>
                        <Text style={[st.jobPay, { color: C.purple }]}>€{job.pay_amount}{job.pay_type === "hourly" ? "/hr" : ""}</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={C.tertiaryLabel} strokeWidth={1.8} />
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  loadingText: { marginTop: 16, fontSize: 15 },
  emptyWrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { borderRadius: 16, overflow: 'hidden' },
  emptyBtnGrad: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  emptyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  listWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  cardGroup: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 16 },
  jobRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  appBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  appBadgeText: { fontSize: 11, fontWeight: '600' },
  jobTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  jobLocation: { fontSize: 14, marginRight: 'auto' },
  jobPay: { fontSize: 15, fontWeight: '700' },
});
