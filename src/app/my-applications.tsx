import React, { useState, useEffect } from "react";
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
import { useClay } from "@/lib/useClay";
import type { ClayColors } from "@/lib/useClay";
import { ClaySurface, ClayInset, ClayIconBox, ClayButton } from "@/components/clay";
import { goBack } from '@/lib/nav';

type ApplicationStatus = "pending" | "accepted" | "rejected" | "completed";
type TabType = "pending" | "accepted" | "history";

interface Application {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  job: { id: string; title: string; company_name: string; location: string; pay_type: "hourly" | "fixed"; pay_amount: number; };
}

export default function MyApplicationsScreen() {
  const router = useRouter();
  const C = useClay();
  const text = useText();
  const currentUser = useAppStore((s) => s.currentUser);

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApps, setPendingApps] = useState<Application[]>([]);
  const [acceptedApps, setAcceptedApps] = useState<Application[]>([]);
  const [historyApps, setHistoryApps] = useState<Application[]>([]);
  const [bookingsByJob, setBookingsByJob] = useState<Record<string, string>>({});

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

      // Accepted applications may have a booking — those cards open the booking hub
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, job_id')
        .eq('worker_user_id', userId)
        .neq('status', 'cancelled');
      if (bookings) {
        const map: Record<string, string> = {};
        for (const b of bookings) map[b.job_id] = b.id;
        setBookingsByJob(map);
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
      case "pending": return { label: "Čaká", color: C.star };
      case "accepted": return { label: "Prijaté", color: C.green };
      case "rejected": return { label: "Odmietnuté", color: C.red };
      case "completed": return { label: "Dokončené", color: C.muted };
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'pending', label: 'Čakajúce' },
    { id: 'accepted', label: 'Prijaté' },
    { id: 'history', label: 'História' },
  ];

  const activeApplications = activeTab === 'pending' ? pendingApps : activeTab === 'accepted' ? acceptedApps : historyApps;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goBack(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
          <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
          </ClaySurface>
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]}>Moje prihlášky</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Segmented tabs */}
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <ClayInset radius={14} contentStyle={styles.tabRow}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <Pressable key={tab.id} onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }} style={{ flex: 1 }}>
                {active ? (
                  <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.tabBtn}>
                    <Text style={[styles.tabText, { color: C.onAccent, fontWeight: '800' }]}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabBtn}><Text style={[styles.tabText, { color: C.muted, fontWeight: '700' }]}>{tab.label}</Text></View>
                )}
              </Pressable>
            );
          })}
        </ClayInset>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /></View>
      ) : activeApplications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <ClayIconBox size={88} radius={28}><FileText size={40} color={C.accent} strokeWidth={1.6} /></ClayIconBox>
          <Text style={[styles.emptyTitle, { color: C.text }]}>Žiadne prihlášky</Text>
          <Text style={[styles.emptyDesc, { color: C.muted }]}>Hľadajte prácu a prihlasujte sa</Text>
          <ClayButton label="Nájsť brigády" onPress={() => router.push("/(tabs)/")} style={{ paddingHorizontal: 28 }} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}>
          <ClaySurface radius={18}>
            {activeApplications.map((app, index) => {
              const info = getStatusInfo(app.status);
              const bookingId = bookingsByJob[app.job.id];
              return (
                <React.Fragment key={app.id}>
                  {index > 0 && <View style={{ height: 1, backgroundColor: C.hair, marginLeft: 16 }} />}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      // Accepted + booked → booking hub (W6); otherwise job detail
                      router.push(bookingId ? `/booking/${bookingId}` : `/job/${app.job.id}`);
                    }}
                    style={({ pressed }) => [styles.appRow, pressed && { opacity: 0.7 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <View style={[styles.statusDot, { backgroundColor: info.color }]} />
                        <Text style={[styles.statusLabel, { color: info.color }]}>{info.label}</Text>
                        <Text style={[styles.timeAgo, { color: C.muted }]}>{getTimeAgo(app.created_at)}</Text>
                      </View>
                      <Text style={[styles.appTitle, { color: C.text }]} numberOfLines={1}>{app.job.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} color={C.muted} strokeWidth={1.9} />
                        <Text style={[styles.appLocation, { color: C.muted }]} numberOfLines={1}>{app.job.location}</Text>
                        <Text style={[styles.appPay, { color: C.accent }]}>€{app.job.pay_amount}{app.job.pay_type === "hourly" ? "/h" : ""}</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={C.muted} strokeWidth={2} />
                  </Pressable>
                </React.Fragment>
              );
            })}
          </ClaySurface>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  tabRow: { flexDirection: 'row', padding: 4, gap: 4 },
  tabBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 13.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 0 },
  emptyTitle: { fontSize: 21, fontWeight: '800', marginBottom: 8, marginTop: 20, letterSpacing: -0.4 },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginBottom: 24, fontWeight: '500' },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 11.5, fontWeight: '800' },
  timeAgo: { fontSize: 11, marginLeft: 'auto', fontWeight: '600' },
  appTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  appLocation: { fontSize: 13, marginRight: 'auto', fontWeight: '500' },
  appPay: { fontSize: 14, fontWeight: '800' },
});
