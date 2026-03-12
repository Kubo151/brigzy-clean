import React from "react";
import { View, Text, Pressable, Image, Animated } from "react-native";
import { MapPin, Clock, Heart, Users } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/cn";
import type { Job } from "@/lib/types";
import { JOB_CATEGORIES } from "@/lib/types";
import useAppStore from "@/lib/state/app-store";
import { useText } from "@/lib/useText";
import useThemeStore from "@/lib/state/theme-store";

interface JobCardProps {
  job: Job;
  onPress: () => void;
  variant?: "default" | "compact";
  isDark?: boolean;
}

export default function JobCard({ job, onPress, variant = "default", isDark = false }: JobCardProps) {
  const savedJobIds = useAppStore((s) => s.savedJobIds);
  const toggleSavedJob = useAppStore((s) => s.toggleSavedJob);
  const text = useText();
  const language = useThemeStore((s) => s.language);

  const isSaved = savedJobIds.includes(job.id);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const heartScaleAnim = React.useRef(new Animated.Value(1)).current;

  // Get localized job data
  const jobTitle = language === "sk" && job.title_sk ? job.title_sk : job.title;
  const jobLocation = language === "sk" && job.location_sk ? job.location_sk : job.location;
  const jobDuration = language === "sk" && job.duration_sk ? job.duration_sk : job.duration;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleSaveToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(heartScaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      Animated.spring(heartScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    toggleSavedJob(job.id);
  };

  const formatSalary = () => {
    if (job.salaryType === "hourly") {
      return `$${job.salaryAmount}/hr`;
    }
    return `$${job.salaryAmount}`;
  };

  const category = JOB_CATEGORIES.find((cat) => cat.id === job.category);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: isDark ? '#27272A' : '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Header Row */}
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          {/* Company Logo */}
          {job.companyLogo ? (
            <Image
              source={{ uri: job.companyLogo }}
              style={{ width: 48, height: 48, borderRadius: 12, marginRight: 12 }}
            />
          ) : (
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              marginRight: 12,
              backgroundColor: isDark ? '#3F3F46' : '#F4F4F5',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? '#A1A1AA' : '#71717A' }}>
                {job.company?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}

          {/* Job Title and Company */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: isDark ? '#FFFFFF' : '#18181B',
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {jobTitle}
            </Text>
            <Text style={{ fontSize: 14, color: isDark ? '#A1A1AA' : '#71717A' }}>
              {job.company || 'Unknown Company'}
            </Text>
          </View>

          {/* Urgent Badge & Heart */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            {job.isUrgent && (
              <View style={{
                backgroundColor: '#FEF2F2',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}>
                <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '600' }}>
                  {text.urgent || "Urgent"}
                </Text>
              </View>
            )}
            <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
              <Pressable onPress={handleSaveToggle} style={{ padding: 4 }}>
                <Heart
                  size={22}
                  color={isSaved ? "#7C3AED" : isDark ? "#71717A" : "#D1D5DB"}
                  fill={isSaved ? "#7C3AED" : "transparent"}
                />
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {/* Location & Duration */}
        <View style={{ flexDirection: 'row', marginBottom: 12, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MapPin size={16} color={isDark ? "#71717A" : "#9CA3AF"} />
            <Text style={{ fontSize: 13, marginLeft: 6, color: isDark ? '#A1A1AA' : '#6B7280' }}>
              {jobLocation}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Clock size={16} color={isDark ? "#71717A" : "#9CA3AF"} />
            <Text style={{ fontSize: 13, marginLeft: 6, color: isDark ? '#A1A1AA' : '#6B7280' }}>
              {jobDuration}
            </Text>
          </View>
        </View>

        {/* Category Badge */}
        <View style={{ marginBottom: 12 }}>
          <View style={{
            backgroundColor: '#F5F3FF',
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }}>
            <Text style={{ color: '#7C3AED', fontSize: 13, fontWeight: '600' }}>
              {category?.name || job.category}
            </Text>
          </View>
        </View>

        {/* Footer - Applicants & Salary */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#3F3F46' : '#F4F4F5',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Users size={16} color={isDark ? "#71717A" : "#9CA3AF"} />
            <Text style={{ fontSize: 13, marginLeft: 6, color: isDark ? '#A1A1AA' : '#71717A' }}>
              {job.applicantsCount} {language === "sk" ? "uchádzačov" : "applicants"}
            </Text>
          </View>
          <View style={{
            backgroundColor: '#F5F3FF',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}>
            <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 15 }}>
              {formatSalary()}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
