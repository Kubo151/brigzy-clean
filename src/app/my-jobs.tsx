import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, MapPin, Briefcase, Users, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useText } from "@/lib/useText";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { useClay } from "@/lib/useClay";
import type { JobCategory } from "@/lib/types";
import { ClaySurface, ClayIconBox, ClayButton } from "@/components/clay";

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
  const C = useClay();
  const text = useText();
  const currentUser = useAppStore((s) => s.currentUser);

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    try {
      if (!currentUser?.id) { setIsLoading(false); return; }
      const { data: jobsData, error } = await supabase
        .from("jobs").select(`*, applications(count)`)
        .eq("employer_id", currentUser.id).order("created_at", { ascending: false });
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
      case "in_progress": return C.verified;
      case "completed": return C.muted;
      case "cancelled": return C.red;
      default: return C.muted;
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
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
          <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
          </ClaySurface>
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]}>{text.myJobs}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={[styles.loadingText, { color: C.muted }]}>{text.loadingJobs}</Text>
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <ClayIconBox size={88} radius={28}><Briefcase size={40} color={C.accent} strokeWidth={1.6} /></ClayIconBox>
            <Text style={[styles.emptyTitle, { color: C.text }]}>{text.noJobsPostedYet}</Text>
            <Text style={[styles.emptyDesc, { color: C.muted }]}>{text.postYourFirstJob}</Text>
            <ClayButton label={text.postAJob} onPress={() => router.push("/(tabs)/add")} style={{ paddingHorizontal: 28 }} />
          </View>
        ) : (
          <View style={styles.listWrap}>
            <ClaySurface radius={18}>
              {jobs.map((job, index) => (
                <React.Fragment key={job.id}>
                  {index > 0 && <View style={{ height: 1, backgroundColor: C.hair, marginLeft: 16 }} />}
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/job-employer/${job.id}`); }}
                    style={({ pressed }) => [styles.jobRow, pressed && { opacity: 0.7 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(job.status) }]} />
                        <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>{getStatusLabel(job.status)}</Text>
                        {!!job.applications_count && job.applications_count > 0 && (
                          <View style={[styles.appBadge, { backgroundColor: C.accentDim }]}>
                            <Users size={10} color={C.accent} strokeWidth={2.2} />
                            <Text style={[styles.appBadgeText, { color: C.accent }]}>{job.applications_count}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.jobTitle, { color: C.text }]}>{job.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} color={C.muted} strokeWidth={1.9} />
                        <Text style={[styles.jobLocation, { color: C.muted }]}>{job.location}</Text>
                        <Text style={[styles.jobPay, { color: C.accent }]}>€{job.pay_amount}{job.pay_type === "hourly" ? "/h" : ""}</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={C.muted} strokeWidth={2} />
                  </Pressable>
                </React.Fragment>
              ))}
            </ClaySurface>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  loadingText: { marginTop: 16, fontSize: 14, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 21, fontWeight: '800', marginBottom: 8, marginTop: 20, letterSpacing: -0.4 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginBottom: 24, fontWeight: '500' },
  listWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  jobRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11.5, fontWeight: '800' },
  appBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  appBadgeText: { fontSize: 11, fontWeight: '800' },
  jobTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  jobLocation: { fontSize: 13, marginRight: 'auto', fontWeight: '500' },
  jobPay: { fontSize: 14, fontWeight: '800' },
});
