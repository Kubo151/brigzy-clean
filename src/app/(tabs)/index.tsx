import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  TextInput,
  Animated,
  StyleSheet,
} from "react-native";
import {
  Bell,
  MapPin,
  Search,
  SlidersHorizontal,
  Clock,
  Heart,
  Users,
  Coffee,
  ShoppingBag,
  Briefcase,
  Truck,
  PartyPopper,
  Sparkles,
  Package,
  FileText,
  ChevronRight,
} from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { JobCategory, Job } from "@/lib/types";
import { JOB_CATEGORIES } from "@/lib/types";
import useAppStore from "@/lib/state/app-store";
import { supabase } from "@/lib/supabase";
import { useText } from "@/lib/useText";
import useThemeStore from "@/lib/state/theme-store";
import { useFlint, RADIUS } from "@/lib/useFlint";
import type { FlintColors } from "@/lib/useFlint";
import { Surface, Chip } from "@/components/ui";
import { PosterDashboard } from "@/components/PosterDashboard";

// ─── CATEGORY CONFIG ────────────────────────────────
const CATEGORIES: (JobCategory | "all")[] = [
  "all", "hospitality", "retail", "delivery", "events",
  "cleaning", "construction", "moving", "admin", "other",
];

const getCategoryLabel = (cat: string, lang: string) => {
  const labels: Record<string, Record<string, string>> = {
    all: { sk: 'Všetky', en: 'All' },
    hospitality: { sk: 'Pohostinstvo', en: 'Hospitality' },
    retail: { sk: 'Maloobchod', en: 'Retail' },
    delivery: { sk: 'Doručovanie', en: 'Delivery' },
    events: { sk: 'Eventy', en: 'Events' },
    cleaning: { sk: 'Upratovanie', en: 'Cleaning' },
    construction: { sk: 'Stavebníctvo', en: 'Construction' },
    moving: { sk: 'Sťahovanie', en: 'Moving' },
    admin: { sk: 'Administratíva', en: 'Admin' },
    other: { sk: 'Iné', en: 'Other' },
  };
  return labels[cat]?.[lang] || labels[cat]?.en || cat;
};

const getJobCardIcon = (category: string) => {
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

// ─── PULSING NOTIFICATION DOT ───────────────────────
function PulsingDot({ C }: { C: FlintColors }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', top: -1, right: -1,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: C.red,
      borderWidth: 1.5, borderColor: C.card,
      opacity: pulse,
    }} />
  );
}

// ─── JOB CARD ────────────────────────────────────────
function JobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const savedJobIds = useAppStore((s) => s.savedJobIds);
  const toggleSavedJob = useAppStore((s) => s.toggleSavedJob);
  const language = useThemeStore((s) => s.language);
  const C = useFlint();

  const isSaved = savedJobIds.includes(job.id);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const jobTitle = language === "sk" && job.title_sk ? job.title_sk : job.title;
  const jobLocation = language === "sk" && job.location_sk ? job.location_sk : job.location;
  const jobDuration = language === "sk" && job.duration_sk ? job.duration_sk : job.duration;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 8 }).start();
  };
  const handleSaveToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 70 }),
      Animated.spring(heartScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 35, bounciness: 10 }),
    ]).start();
    toggleSavedJob(job.id);
  };
  const formatSalary = () => job.salaryType === "hourly" ? `${job.salaryAmount} €/h` : `${job.salaryAmount} €`;

  const IconComponent = getJobCardIcon(job.category);
  const category = JOB_CATEGORIES.find((c) => c.id === job.category);
  const categoryName = language === 'sk' && category?.name_sk ? category.name_sk : category?.name || job.category;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 16 }}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={[styles.card, { backgroundColor: C.card, padding: 16 }]}>
          {/* Row 1: Icon + Title + Heart */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={[styles.iconBox, { backgroundColor: C.card2, marginRight: 12 }]}>
              <IconComponent size={22} color={C.accent} strokeWidth={1.9} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16.5,
                fontWeight: '700',
                color: C.text,
                letterSpacing: -0.3,
                marginBottom: 2,
              }} numberOfLines={1}>{jobTitle}</Text>
              <Text style={{ fontSize: 13, color: C.muted, fontWeight: '600' }}>{job.company || 'Unknown'}</Text>
            </View>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Pressable onPress={handleSaveToggle} hitSlop={12} style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: isSaved ? C.accentDim : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Heart
                  size={20}
                  color={isSaved ? C.accent : C.muted}
                  fill={isSaved ? C.accent : "transparent"}
                  strokeWidth={isSaved ? 2.2 : 1.7}
                />
              </Pressable>
            </Animated.View>
          </View>

          {/* Row 2: Meta */}
          <View style={{ flexDirection: 'row', marginBottom: 14, gap: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MapPin size={13} color={C.muted} strokeWidth={1.9} />
              <Text style={{ fontSize: 12.5, color: C.muted, fontWeight: '600' }}>{jobLocation}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Clock size={13} color={C.muted} strokeWidth={1.9} />
              <Text style={{ fontSize: 12.5, color: C.muted, fontWeight: '600' }}>{jobDuration}</Text>
            </View>
          </View>

          {/* Row 3: Footer — category tag + applicants + salary chip */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                backgroundColor: C.accentDim,
                paddingHorizontal: 11,
                paddingVertical: 5,
                borderRadius: 9,
              }}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: C.accent, letterSpacing: 0.1 }}>{categoryName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Users size={12} color={C.muted} strokeWidth={1.9} />
                <Text style={{ fontSize: 11.5, color: C.muted, fontWeight: '600' }}>{job.applicantsCount}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: C.accent }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.onAccent, letterSpacing: -0.2 }}>{formatSalary()}</Text>
              <ChevronRight size={14} color={C.onAccent} strokeWidth={2.4} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── HOME SCREEN ────────────────────────────────────
// Role switch must not change the number of hooks rendered in one component,
// so the worker home lives in its own component below.
export default function HomeScreen() {
  const currentRole = useAppStore((s) => s.currentRole);
  return currentRole === 'employer' ? <PosterDashboard /> : <WorkerHome />;
}

function WorkerHome() {
  const router = useRouter();
  const text = useText();
  const language = useThemeStore((s) => s.language);
  const C = useFlint();

  const currentUser = useAppStore((s) => s.currentUser);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Load jobs from Supabase
  const loadJobs = async () => {
    try {
      const { data: jobsData, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ [Home] Fetch jobs error:", error);
      } else {
        const mappedJobs: Job[] = (jobsData || []).map((job) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          company: job.company_name,
          location: job.location,
          salaryType: job.pay_type as "hourly" | "fixed",
          salaryAmount: job.pay_amount,
          salaryCurrency: "EUR",
          duration: job.duration,
          category: job.category as JobCategory,
          postedAt: new Date(job.created_at).toISOString().split("T")[0],
          employerId: job.employer_id,
          applicantsCount: Array.isArray(job.applications) ? job.applications[0]?.count || 0 : 0,
          requiresIntroduction: job.requires_introduction || false,
          title_sk: job.title_sk,
          description_sk: job.description_sk,
          location_sk: job.location_sk,
          duration_sk: job.duration_sk,
        }));
        setJobs(mappedJobs);
      }
    } catch (error) {
      console.error("❌ [Home] Exception loading jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      loadJobs();
    }, [])
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || job.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [jobs, searchQuery, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleJobPress = (jobId: string) => {
    router.push(`/job/${jobId}`);
  };

  const firstName = currentUser?.name?.split(" ")[0] ?? "there";

  const EmptyState = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
    <View style={[styles.card, { backgroundColor: C.card, alignItems: 'center', paddingVertical: 50, paddingHorizontal: 28 }]}>
      {icon}
      <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginTop: 16, letterSpacing: -0.3 }}>{title}</Text>
      <Text style={{ fontSize: 14, color: C.muted, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>{subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
      >
        {/* ─── HEADER ─────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 4 }}>
                {language === 'sk' ? 'Tvoja poloha' : 'Your location'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <MapPin size={16} color={C.accent} strokeWidth={2.2} />
                <Text style={{ fontSize: 19, fontWeight: '700', color: C.text, letterSpacing: -0.4 }}>Bratislava · Staré Mesto</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Bell */}
              <Pressable onPress={() => router.push('/activity')}>
                <View style={[styles.roundIcon, { backgroundColor: C.card2 }]}>
                  <Bell size={18} color={C.text} strokeWidth={1.9} />
                  <PulsingDot C={C} />
                </View>
              </Pressable>

              {/* Avatar */}
              <Pressable onPress={() => router.push('/account-settings')} style={({ pressed }) => [pressed && { transform: [{ scale: 0.92 }], opacity: 0.8 }]}>
                {currentUser?.avatar ? (
                  <Image source={{ uri: currentUser.avatar }} style={{ width: 42, height: 42, borderRadius: 21 }} />
                ) : (
                  <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: C.accent }}>
                    <Text style={{ color: C.onAccent, fontWeight: '700', fontSize: 17 }}>
                      {firstName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* ─── SEARCH BAR ──────────────────────────── */}
          <View style={[styles.searchBar, { backgroundColor: C.card2, marginTop: 18 }]}>
            <Search size={18} color={C.muted} strokeWidth={1.9} />
            <TextInput
              style={{ flex: 1, fontSize: 15, fontWeight: '500', color: C.text }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={text.searchJobsPlaceholder}
              placeholderTextColor={C.muted}
            />
            <Pressable style={({ pressed }) => [{
              width: 34, height: 34, borderRadius: 10,
              backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center',
            }, pressed && { transform: [{ scale: 0.9 }] }]}>
              <SlidersHorizontal size={16} color={C.accent} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* ─── CATEGORIES ────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 9, paddingVertical: 4 }}
          style={{ flexGrow: 0, marginBottom: 22 }}
        >
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={getCategoryLabel(cat, language)}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>

        {/* ─── SECTION HEADER ────────────────────────── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 21, fontWeight: '700', color: C.text, letterSpacing: -0.5 }}>
            {selectedCategory === "all" ? text.availableJobs : getCategoryLabel(selectedCategory, language)}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.accent }}>
            {filteredJobs.length} {language === 'sk' ? 'pozícií' : 'jobs'}
          </Text>
        </View>

        {/* ─── JOBS LIST ──────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          {isLoading ? (
            <View style={[styles.card, { backgroundColor: C.card, alignItems: 'center', paddingVertical: 50 }]}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={{ fontSize: 14, color: C.muted, marginTop: 12, fontWeight: '600' }}>{text.loadingJobs}</Text>
            </View>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={<View style={[styles.iconBoxLg, { backgroundColor: C.card2 }]}><Briefcase size={26} color={C.accent} strokeWidth={1.6} /></View>}
              title={text.noJobsYet}
              subtitle={currentUser?.role === "employer" ? text.noJobsYetEmployer : text.noJobsYetWorker}
            />
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} onPress={() => handleJobPress(job.id)} />
            ))
          ) : (
            <EmptyState
              icon={<View style={[styles.iconBoxLg, { backgroundColor: C.card2 }]}><Search size={24} color={C.accent} strokeWidth={1.6} /></View>}
              title={text.noJobsFound}
              subtitle={text.tryAdjustingSearch}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg },
  iconBox: { width: 46, height: 46, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  iconBoxLg: { width: 56, height: 56, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  roundIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 50, gap: 10, borderRadius: RADIUS.md },
});
