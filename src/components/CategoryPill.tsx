import React, { useRef } from "react";
import { Pressable, Text, Animated } from "react-native";
import { cn } from "@/lib/cn";
import type { JobCategory } from "@/lib/types";
import { JOB_CATEGORIES } from "@/lib/types";
import useThemeStore from "@/lib/state/theme-store";

interface CategoryPillProps {
  category: JobCategory | "all";
  isSelected: boolean;
  onPress: () => void;
  isDark?: boolean;
}

export default function CategoryPill({ category, isSelected, onPress, isDark = false }: CategoryPillProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const language = useThemeStore((s) => s.language);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const categoryData = JOB_CATEGORIES.find((cat) => cat.id === category);
  const emoji = category === "all" ? "📋" : categoryData?.icon || "📋";
  const label = category === "all"
    ? (language === "sk" ? "Všetky" : "All")
    : (language === "sk" && categoryData?.name_sk ? categoryData.name_sk : categoryData?.name || category);

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        transform: [{ scale: scaleAnim }],
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: isSelected ? '#7C3AED' : (isDark ? '#27272A' : '#FFFFFF'),
        shadowColor: isSelected ? '#7C3AED' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isSelected ? 0.3 : 0.05,
        shadowRadius: 4,
        elevation: isSelected ? 4 : 2,
      }}
    >
      <Text style={{ fontSize: 16, marginRight: 6 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: isSelected ? '600' : '500',
          color: isSelected ? '#FFFFFF' : (isDark ? '#E4E4E7' : '#3F3F46')
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
