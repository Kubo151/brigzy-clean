import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Button from "./Button";
import { useColorScheme } from "@/lib/useColorScheme";
import { useText } from "@/lib/useText";
import { cn } from "@/lib/cn";
import type { Job } from "@/lib/types";
import useThemeStore from "@/lib/state/theme-store";

interface ApplyJobModalProps {
  visible: boolean;
  job: Job;
  onClose: () => void;
  onSubmit: (message?: string) => void;
  isLoading?: boolean;
}

export default function ApplyJobModal({
  visible,
  job,
  onClose,
  onSubmit,
  isLoading = false,
}: ApplyJobModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const text = useText();
  const language = useThemeStore((s) => s.language);

  const [introMessage, setIntroMessage] = useState<string>("");
  const requiresIntro = job.requiresIntroduction ?? false;
  const isMessageValid = !requiresIntro || introMessage.trim().length >= 20;

  const jobTitle = language === "sk" && job.title_sk ? job.title_sk : job.title;
  const jobLocation = language === "sk" && job.location_sk ? job.location_sk : job.location;

  const formatSalary = () => {
    const currency = job.salaryCurrency === "USD" ? "$" : "€";
    if (job.salaryType === "hourly") {
      return `${currency}${job.salaryAmount}/${language === "sk" ? "hod" : "hr"}`;
    }
    return `${currency}${job.salaryAmount}`;
  };

  const handleSubmit = () => {
    if (!isMessageValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(requiresIntro ? introMessage.trim() : undefined);
    setIntroMessage("");
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIntroMessage("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center px-5">
        <BlurView
          intensity={isDark ? 60 : 30}
          tint={isDark ? "dark" : "light"}
          className="absolute inset-0"
        />
        <Pressable
          className="absolute inset-0"
          onPress={handleClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            className={cn(
              "rounded-2xl p-6 w-full max-w-sm",
              isDark ? "bg-zinc-800" : "bg-white"
            )}
            style={{ minWidth: 320 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <Text
                className={cn(
                  "text-2xl font-bold mb-4",
                  isDark ? "text-white" : "text-text-primary"
                )}
              >
                {text.applyForJobQuestion}
              </Text>

              {/* Job Info */}
              <View
                className={cn(
                  "rounded-xl p-4 mb-4",
                  isDark ? "bg-zinc-700" : "bg-gray-50"
                )}
              >
                <Text
                  className={cn(
                    "text-base font-semibold mb-1",
                    isDark ? "text-white" : "text-text-primary"
                  )}
                >
                  {jobTitle}
                </Text>
                <Text
                  className={cn(
                    "text-sm mb-2",
                    isDark ? "text-zinc-400" : "text-text-secondary"
                  )}
                >
                  {job.company}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={cn(
                      "text-sm",
                      isDark ? "text-zinc-400" : "text-text-secondary"
                    )}
                  >
                    {jobLocation}
                  </Text>
                  <Text className="text-primary font-bold text-base">
                    {formatSalary()}
                  </Text>
                </View>
              </View>

              {/* Question Text */}
              <Text
                className={cn(
                  "text-base mb-4",
                  isDark ? "text-zinc-300" : "text-text-secondary"
                )}
              >
                {text.doYouWantToApply}
              </Text>

              {/* Introduction Input (if required) */}
              {requiresIntro && (
                <View className="mb-4">
                  <Text
                    className={cn(
                      "text-sm font-medium mb-2",
                      isDark ? "text-white" : "text-text-primary"
                    )}
                  >
                    {text.writeWhySuitable}
                  </Text>
                  <TextInput
                    value={introMessage}
                    onChangeText={setIntroMessage}
                    multiline
                    numberOfLines={5}
                    placeholder={text.writeWhySuitable}
                    placeholderTextColor={isDark ? "#71717A" : "#9CA3AF"}
                    className={cn(
                      "rounded-xl p-3 text-base border",
                      isDark
                        ? "bg-zinc-900 border-zinc-600 text-white"
                        : "bg-white border-gray-300 text-text-primary"
                    )}
                    style={{ minHeight: 100, textAlignVertical: "top" }}
                  />
                  <Text
                    className={cn(
                      "text-xs mt-1",
                      introMessage.length >= 20
                        ? isDark
                          ? "text-green-400"
                          : "text-green-600"
                        : isDark
                        ? "text-zinc-500"
                        : "text-text-muted"
                    )}
                  >
                    {text.minCharacters} ({introMessage.length}/20)
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View className="flex-row gap-2">
                <Button
                  variant="outline"
                  onPress={handleClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {text.cancel}
                </Button>
                <Button
                  onPress={handleSubmit}
                  disabled={!isMessageValid}
                  loading={isLoading}
                  className="flex-1"
                >
                  {requiresIntro ? text.sendApplication : text.confirmApplication}
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
