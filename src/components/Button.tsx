import React, { useRef } from "react";
import { Text, Pressable, ActivityIndicator, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/cn";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className,
  icon,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const baseStyles = "flex-row items-center justify-center rounded-2xl";

  const variantStyles = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    outline: "bg-transparent border-2 border-primary",
    ghost: "bg-transparent",
  };

  const sizeStyles = {
    sm: "px-4 py-2",
    md: "px-6 py-3.5",
    lg: "px-8 py-4",
  };

  const textVariantStyles = {
    primary: "text-white",
    secondary: "text-text-primary",
    outline: "text-primary",
    ghost: "text-primary",
  };

  const textSizeStyles = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={{ transform: [{ scale: scaleAnim }] }}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#fff" : "#7C3AED"}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            className={cn(
              "font-semibold",
              textVariantStyles[variant],
              textSizeStyles[size],
              icon && "ml-2"
            )}
          >
            {children}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
