import React, { useState, useRef } from "react";
import { View, Text, TextInput, TextInputProps, Pressable, Animated, StyleSheet } from "react-native";
import { cn } from "@/lib/cn";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  isDark?: boolean;
}

export default function Input({
  label,
  error,
  icon,
  rightIcon,
  containerClassName,
  secureTextEntry,
  onFocus,
  onBlur,
  isDark = false,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(borderColorAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(borderColorAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const isPassword = secureTextEntry !== undefined;

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? "#EF4444" : (isDark ? "#3f3f46" : "#E5E7EB"), "#7C3AED"],
  });

  return (
    <View className={cn("mb-4", containerClassName)}>
      {label && (
        <Text className={cn(
          "text-sm font-medium mb-2",
          isDark ? "text-white" : "text-text-primary"
        )}>
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          isDark ? styles.darkBg : styles.lightBg,
        ]}
        className={cn(
          "flex-row items-center rounded-xl border-2 px-4",
          isDark ? "bg-zinc-800" : "bg-white"
        )}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={isDark ? "#71717A" : "#9CA3AF"}
          className={cn(
            "flex-1 py-3.5 text-base",
            isDark ? "text-white" : "text-text-primary"
          )}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} className="p-1">
            <Text style={{ fontSize: 20 }}>{showPassword ? "🙈" : "👁️"}</Text>
          </Pressable>
        )}
        {rightIcon && !isPassword && <View className="ml-3">{rightIcon}</View>}
      </Animated.View>
      {error && <Text className="text-sm text-red-500 mt-1">{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderWidth: 2,
  },
  darkBg: {
    backgroundColor: '#27272a',
  },
  lightBg: {
    backgroundColor: '#ffffff',
  },
});
