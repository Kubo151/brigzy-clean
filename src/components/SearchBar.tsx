import React, { useRef } from "react";
import { View, TextInput, Pressable, Animated } from "react-native";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { cn } from "@/lib/cn";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  isDark?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  onFilterPress,
  isDark = false,
}: SearchBarProps) {
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(borderColorAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(borderColorAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? "#3F3F46" : "#E5E7EB", "#7C3AED"],
  });

  return (
    <Animated.View
      style={{
        borderColor: borderColor,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#27272A' : '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Search size={20} color={isDark ? "#71717A" : "#9CA3AF"} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#71717A" : "#9CA3AF"}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          flex: 1,
          paddingVertical: 12,
          paddingHorizontal: 12,
          fontSize: 15,
          color: isDark ? '#FFFFFF' : '#18181B',
        }}
      />
      {onFilterPress && (
        <Pressable
          onPress={onFilterPress}
          style={{
            padding: 8,
            borderRadius: 12,
            backgroundColor: isDark ? '#3F3F46' : '#F4F4F5',
          }}
        >
          <SlidersHorizontal size={18} color={isDark ? "#A1A1AA" : "#6B7280"} />
        </Pressable>
      )}
    </Animated.View>
  );
}
