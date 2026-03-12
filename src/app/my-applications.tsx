import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, MapPin, FileText, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useText } from "@/lib/useText";
import { supabase } from "@/lib/supabase";
import useAppStore from "@/lib/state/app-store";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";

type ApplicationStatus = "pending" | "accepted" | "rejected" | "completed";
type TabType = "pending" | "accepted" | "history";

interface Application {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  job: {
    id: string;
    title: string;
    company_name: string;
    location: string;
    pay_type: "hourly" | "fixed";
    pay_amount: number;
  };
}

export default function MyApplicationsScreen() {
  const router = useRouter();
  const C = useColors();
  const text = useText();
  const currentUser = useAppStore((s) => s.currentUser);
  const st = useMemo(() => makeStyles(C), [C]);

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApps, setPendingApps] = useState<Application[]>([]);
  const [acceptedApps, setAcceptedApps] = useState<Application[]>([]);
  const [historyApps, setHistoryApps] = useState<Application[]>([]);

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      let userId: string | null = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) userId = session.user.id;
      else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
      }
      if (!userId && currentUser?.id) userId = currentUser.id;
      if (!userId) { setIsLoading(false); return; }

      const { data: applications, error } = await supabase
        .from('applications')
        .select(`*, job:jobs (id, title, company_name, location, pay_type, pay_amount)`)
        .eq('worker_id', userId)
        .order('created_at', { ascending: false });

      if (error) { console.error("Fetch error:", error.message); setIsLoading(false); return; }
      if (applications) {
        setPendingApps(applications.filter(a => a.status === 'pending'));
        setAcceptedApps(applications.filter(a => a.status === 'accepted'));
        setHistoryApps(applications.filter(a => ['rejected', 'completed'].includes(a.status)));
      }
    } catch (e) { console.error("Exception:", e); }
    finally { setIsLoading(false); }
  };

  const getTimeAgo = (dateString: string): string => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `pred ${diffDays}d`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return `pred ${diffHours}h`;
  };

  const getStatusInfo = (status: ApplicationStatus) => {
    switch (status) {
      case "pending": return { label: "Čaká", color: C.yellow };
      case "accepted": return { label: "Prijaté", color: C.green };
      case "rejected": return { label: "Odmietnuté", color: C.red };
      case "completed": return { label: "Dokončené", color: C.secondaryLabel as string };
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'pending', label: 'Čakajúce' },
    { id: 'accepted', label: 'Prijaté' },
    { id: 'history', label: 'História' },
  ];

  const activeApplications = activeTab === 'pending' ? pendingApps : activeTab === 'accepted' ? acceptedApps : historyApps;

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      {/* Header */}
      <View style={st.header}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={({ pressed }) => [st.backBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
          <ChevronLeft size={22} color={C.text} />
        </Pressable>
        <Text style={st.headerTitle}>Moje prihlášky</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Segmented tabs */}
      <View style={[st.tabRow, { backgroundColor: C.surface, borderColor: C.separator }]}>
        {tabs.map(tab => (
          <Pressable
            key={tab.id}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
            style={[st.tabBtn, activeTab === tab.id && st.tabBtnActive]}
          >
            <Text style={[st.tabText, {
              color: activeTab === tab.id ? '#FFF' : C.secondaryLabel,
              fontWeight: activeTab === tab.id ? '600' : '400',
            }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={C.purple} />
        </View>
      ) : activeApplications.length === 0 ? (
        <View style={st.emptyWrap}>
          <View style={[st.emptyIcon, { backgroundColor: C.purpleDim }]}>
            <FileText size={42} color={C.purple} strokeWidth={1.5} />
          </View>
          <Text style={[st.emptyTitle, { color: C.text }]}>Žiadne prihlášky</Text>
          <Text style={[st.emptyDesc, { color: C.secondaryLabel }]}>Hľadajte prácu a prihlasujte sa</Text>
          <Pressable onPress={() => router.push("/(tabs)/")}
            style={({ pressed }) => [st.emptyBtn, { opacity: pressed ? 0.85 : 1 }]}>
            <LinearGradient colors={['#9333EA', '#7C3AED', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.emptyBtnGrad}>
              <Text style={st.emptyBtnText}>Nájsť brigády</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}>
          <View style={st.cardGroup}>
            {activeApplications.map((app, index) => {
              const info = getStatusInfo(app.status);
              return (
                <React.Fragment key={app.id}>
                  {index > 0 && <View style={st.divider} />}
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/job/${app.job.id}`); }}
                    style={({ pressed }) => [st.appRow, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <View style={[st.statusDot, { backgroundColor: info.color }]} />
                        <Text style={[st.statusLabel, { color: info.color }]}>{info.label}</Text>
                        <Text style={[st.timeAgo, { color: C.tertiaryLabel }]}>{getTimeAgo(app.created_at)}</Text>
                      </View>
                      <Text style={[st.appTitle, { color: C.text }]} numberOfLines={1}>{app.job.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} color={C.tertiaryLabel} />
                        <Text style={[st.appLocation, { color: C.secondaryLabel }]} numberOfLines={1}>{app.job.location}</Text>
                        <Text style={[st.appPay, { color: C.purple }]}>€{app.job.pay_amount}{app.job.pay_type === "hourly" ? "/hr" : ""}</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={C.tertiaryLabel} strokeWidth={1.8} />
                  </Pressable>
                </React.Fragment>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 4, gap: 4, marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#7C3AED' },
  tabText: { fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { borderRadius: 16, overflow: 'hidden' },
  emptyBtnGrad: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  emptyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cardGroup: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 16 },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  timeAgo: { fontSize: 11, marginLeft: 'auto' },
  appTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  appLocation: { fontSize: 14, marginRight: 'auto' },
  appPay: { fontSize: 15, fontWeight: '700' },
});
