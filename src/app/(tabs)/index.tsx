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
  Platform,
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
  Star,
  ChevronRight,
} from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import type { JobCategory, Job } from "@/lib/types";
import { JOB_CATEGORIES } from "@/lib/types";
import useAppStore from "@/lib/state/app-store";
import { supabase } from "@/lib/supabase";
import { useText } from "@/lib/useText";
import useThemeStore from "@/lib/state/theme-store";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";

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
function PulsingDot() {
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
      backgroundColor: '#FF453A',
      borderWidth: 1.5, borderColor: '#141420',
      opacity: pulse,
    }} />
  );
}

// ─── CATEGORY PILL ──────────────────────────────────
function CategoryPill({ label, active, onPress, C }: {
  label: string; active: boolean; onPress: () => void; C: AppColors;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 60 }),
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, speed: 30, bounciness: 10 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[
        {
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 100,
          backgroundColor: active ? C.purple : C.surface,
          borderWidth: active ? 0 : 0.5,
          borderColor: C.cardBorder,
        },
        active && Platform.OS === 'ios' && {
          shadowColor: '#7C3AED',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
        },
        { transform: [{ scale: scaleAnim }] },
      ]}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: active ? '#FFFFFF' : C.secondaryLabel,
          letterSpacing: -0.1,
        }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── JOB CARD — iOS 26 ─────────────────────────────
function JobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const savedJobIds = useAppStore((s) => s.savedJobIds);
  const toggleSavedJob = useAppStore((s) => s.toggleSavedJob);
  const language = useThemeStore((s) => s.language);
  const C = useColors();

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
  const formatSalary = () => job.salaryType === "hourly" ? `€${job.salaryAmount}/h` : `€${job.salaryAmount}`;

  const IconComponent = getJobCardIcon(job.category);
  const category = JOB_CATEGORIES.find((c) => c.id === job.category);
  const categoryName = language === 'sk' && category?.name_sk ? category.name_sk : category?.name || job.category;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 12 }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: C.cardBg,
          borderRadius: 20,
          borderWidth: 0.5,
          borderColor: C.cardBorder,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
            },
            android: { elevation: 2 },
          }),
        }}
      >
        {/* Accent top glow */}
        <LinearGradient
          colors={['rgba(124,58,237,0.12)', 'transparent']}
          style={{ height: 3, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        />

        {/* Card body */}
        <View style={{ padding: 16 }}>
          {/* Row 1: Icon + Title + Heart */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <LinearGradient
              colors={['rgba(124,58,237,0.15)', 'rgba(124,58,237,0.08)']}
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <IconComponent size={22} color={C.purpleLight} strokeWidth={1.8} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: C.text,
                letterSpacing: -0.3,
                marginBottom: 2,
              }} numberOfLines={1}>{jobTitle}</Text>
              <Text style={{
                fontSize: 14,
                color: C.secondaryLabel,
                letterSpacing: -0.1,
              }}>{job.company || 'Unknown'}</Text>
            </View>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Pressable onPress={handleSaveToggle} hitSlop={12} style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isSaved ? C.purpleDim : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Heart
                  size={20}
                  color={isSaved ? C.purple : C.tertiaryLabel}
                  fill={isSaved ? C.purple : "transparent"}
                  strokeWidth={isSaved ? 2.2 : 1.5}
                />
              </Pressable>
            </Animated.View>
          </View>

          {/* Row 2: Meta */}
          <View style={{ flexDirection: 'row', marginBottom: 14, gap: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MapPin size={13} color={C.tertiaryLabel} strokeWidth={1.8} />
              <Text style={{ fontSize: 13, color: C.tertiaryLabel, letterSpacing: -0.1 }}>{jobLocation}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Clock size={13} color={C.tertiaryLabel} strokeWidth={1.8} />
              <Text style={{ fontSize: 13, color: C.tertiaryLabel, letterSpacing: -0.1 }}>{jobDuration}</Text>
            </View>
          </View>

          {/* Row 3: Tag */}
          <View style={{ marginBottom: 14 }}>
            <View style={{
              alignSelf: 'flex-start',
              backgroundColor: C.purpleDim,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 8,
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: C.purpleLight,
                letterSpacing: -0.1,
              }}>{categoryName}</Text>
            </View>
          </View>
        </View>

        {/* Footer — separator + salary + applicants */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderTopWidth: 0.5,
          borderTopColor: C.separator,
          backgroundColor: 'rgba(255,255,255,0.02)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Users size={13} color={C.tertiaryLabel} strokeWidth={1.8} />
            <Text style={{ fontSize: 13, color: C.tertiaryLabel }}>
              {job.applicantsCount} {language === "sk" ? "uchádzačov" : "applicants"}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: C.purple,
              letterSpacing: -0.3,
            }}>{formatSalary()}</Text>
            <ChevronRight size={14} color={C.quaternaryLabel} strokeWidth={2} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── HOME SCREEN ────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const text = useText();
  const language = useThemeStore((s) => s.language);
  const C = useColors();

  const currentUser = useAppStore((s) => s.currentUser);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | "all">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} />
        }
      >
        {/* ─── HEADER ─────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 34,
                fontWeight: '800',
                color: C.text,
                letterSpacing: 0.3,
                marginBottom: 6,
              }}>Brigzy</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color={C.purple} strokeWidth={2.2} />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: C.secondaryLabel,
                  letterSpacing: -0.1,
                }}>Bratislava, SK</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6 }}>
              {/* Bell */}
              <Pressable
                onPress={() => router.push('/activity')}
                style={({ pressed }) => [{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: C.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 0.5,
                  borderColor: C.cardBorder,
                }, pressed && { transform: [{ scale: 0.9 }], opacity: 0.7 }]}
              >
                <Bell size={19} color={C.text} strokeWidth={1.7} />
                <PulsingDot />
              </Pressable>

              {/* Avatar */}
              <Pressable onPress={() => router.push('/account-settings')} style={({ pressed }) => [pressed && { transform: [{ scale: 0.9 }], opacity: 0.7 }]}>
              {currentUser?.avatar ? (
                <Image source={{ uri: currentUser.avatar }} style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                }} />
              ) : (
                <LinearGradient
                  colors={['#7C3AED', '#A855F7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 17 }}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
              </Pressable>
            </View>
          </View>

          {/* ─── SEARCH BAR ──────────────────────────── */}
          <Pressable
            style={[{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: C.searchFill,
              borderRadius: 14,
              paddingHorizontal: 14,
              height: 46,
              gap: 10,
              marginTop: 20,
              borderWidth: 0.5,
              borderColor: searchFocused ? C.purple : 'transparent',
            }, searchFocused && { backgroundColor: C.surface }]}
          >
            <Search size={18} color={C.tertiaryLabel} strokeWidth={1.8} />
            <TextInput
              style={{
                flex: 1,
                fontSize: 17,
                fontWeight: '400',
                color: C.text,
                letterSpacing: -0.3,
              }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={text.searchJobsPlaceholder}
              placeholderTextColor={C.tertiaryLabel}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <Pressable
              style={({ pressed }) => [{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: C.purpleDim,
                alignItems: 'center',
                justifyContent: 'center',
              }, pressed && { transform: [{ scale: 0.9 }] }]}
            >
              <SlidersHorizontal size={16} color={C.purple} strokeWidth={2} />
            </Pressable>
          </Pressable>
        </View>

        {/* ─── CATEGORIES ────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          style={{ flexGrow: 0, marginBottom: 28 }}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={getCategoryLabel(cat, language)}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
              C={C}
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
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            color: C.text,
            letterSpacing: -0.4,
          }}>
            {selectedCategory === "all"
              ? text.availableJobs
              : getCategoryLabel(selectedCategory, language)}
          </Text>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: C.purple,
          }}>{filteredJobs.length} pozícií</Text>
        </View>

        {/* ─── JOBS LIST ──────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          {isLoading ? (
            <View style={{
              alignItems: 'center',
              paddingVertical: 60,
              backgroundColor: C.cardBg,
              borderRadius: 20,
              borderWidth: 0.5,
              borderColor: C.cardBorder,
            }}>
              <ActivityIndicator size="large" color={C.purple} />
              <Text style={{ fontSize: 15, color: C.secondaryLabel, marginTop: 12 }}>{text.loadingJobs}</Text>
            </View>
          ) : jobs.length === 0 ? (
            <View style={{
              alignItems: 'center',
              paddingVertical: 60,
              backgroundColor: C.cardBg,
              borderRadius: 20,
              borderWidth: 0.5,
              borderColor: C.cardBorder,
            }}>
              <Briefcase size={40} color={C.tertiaryLabel} strokeWidth={1.3} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, marginTop: 16 }}>{text.noJobsYet}</Text>
              <Text style={{
                fontSize: 15,
                color: C.secondaryLabel,
                marginTop: 6,
                textAlign: 'center',
                paddingHorizontal: 32,
              }}>
                {currentUser?.role === "employer" ? text.noJobsYetEmployer : text.noJobsYetWorker}
              </Text>
            </View>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} onPress={() => handleJobPress(job.id)} />
            ))
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: 60,
              backgroundColor: C.cardBg,
              borderRadius: 20,
              borderWidth: 0.5,
              borderColor: C.cardBorder,
            }}>
              <Search size={32} color={C.tertiaryLabel} strokeWidth={1.3} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, marginTop: 16 }}>{text.noJobsFound}</Text>
              <Text style={{
                fontSize: 15,
                color: C.secondaryLabel,
                marginTop: 6,
                textAlign: 'center',
                paddingHorizontal: 32,
              }}>{text.tryAdjustingSearch}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
