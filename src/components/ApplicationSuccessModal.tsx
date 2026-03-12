import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Button from "./Button";
import { useColorScheme } from "@/lib/useColorScheme";
import { useText } from "@/lib/useText";
import { cn } from "@/lib/cn";

interface ApplicationSuccessModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ApplicationSuccessModal({
  visible,
  onClose,
}: ApplicationSuccessModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const text = useText();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

        <View
          className={cn(
            "rounded-2xl p-6 w-full max-w-sm items-center",
            isDark ? "bg-zinc-800" : "bg-white"
          )}
          style={{ minWidth: 320 }}
        >
          {/* Success Icon */}
          <View
            className={cn(
              "w-20 h-20 rounded-full items-center justify-center mb-4",
              isDark ? "bg-green-500/20" : "bg-green-50"
            )}
          >
            <CheckCircle size={48} color="#10B981" />
          </View>

          {/* Header */}
          <Text
            className={cn(
              "text-2xl font-bold mb-3 text-center",
              isDark ? "text-white" : "text-text-primary"
            )}
          >
            {text.applicationSent}
          </Text>

          {/* Description */}
          <Text
            className={cn(
              "text-base text-center mb-6 leading-6",
              isDark ? "text-zinc-400" : "text-text-secondary"
            )}
          >
            {text.employerReceivedRequest}
          </Text>

          {/* Button */}
          <Button onPress={handleClose} className="w-full">
            {text.gotIt}
          </Button>
        </View>
      </View>
    </Modal>
  );
}
