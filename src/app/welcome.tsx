import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Pressable, Animated, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Briefcase, Search, ChevronRight } from "lucide-react-native";
import useAppStore from "@/lib/state/app-store";
import { useColors } from "@/lib/useColors";
import { useText } from "@/lib/useText";

export default function WelcomeScreen() {
  const router = useRouter();
  const C = useColors();
  const text = useText();
  const [selectedRole, setSelectedRole] = useState<"worker" | "employer" | null>(null);
  const setCurrentRole = useAppStore((s) => s.setCurrentRole);
  const setRoleSelectionComplete = useAppStore((s) => s.setRoleSelectionComplete);

  // Stagger fade-in
  const fade1 = useRef(new Animated.Value(0)).current;
  const fade2 = useRef(new Animated.Value(0)).current;
  const fade3 = useRef(new Animated.Value(0)).current;
  const fade4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(fade1, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(fade2, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(fade3, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(fade4, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRoleSelection = (role: "worker" | "employer") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRole(role);
    setCurrentRole(role);
    setRoleSelectionComplete(true);
    setTimeout(() => {
      router.replace(role === "worker" ? "/(tabs)" : "/(tabs)/post");
    }, 300);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          {/* Brand */}
          <Animated.View style={[styles.brandWrap, { opacity: fade1 }]}>
            <LinearGradient
              colors={[C.purpleDim, 'transparent']}
              style={styles.brandCircle}
            >
              <Text style={styles.brandLetter}>B</Text>
            </LinearGradient>
            <Text style={[styles.brandName, { color: C.text }]}>Brigzy</Text>
            <Text style={[styles.brandSub, { color: C.secondaryLabel }]}>
              {text.welcomeSubtitle}
            </Text>
          </Animated.View>

          {/* Role cards */}
          <View style={styles.roleCards}>
            {/* Worker */}
            <Animated.View style={{ opacity: fade2 }}>
              <Pressable
                onPress={() => handleRoleSelection("worker")}
                style={({ pressed }) => [
                  styles.roleCard,
                  {
                    backgroundColor: selectedRole === "worker" ? C.purple : C.surface,
                    borderColor: selectedRole === "worker" ? C.purple : C.separator,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <View style={[styles.roleIcon, {
                  backgroundColor: selectedRole === "worker" ? 'rgba(255,255,255,0.15)' : C.purpleDim,
                }]}>
                  <Search
                    size={24}
                    color={selectedRole === "worker" ? '#FFF' : C.purple}
                    strokeWidth={1.8}
                  />
                </View>
                <View style={styles.roleTextWrap}>
                  <Text style={[styles.roleTitle, {
                    color: selectedRole === "worker" ? '#FFF' : C.text,
                  }]}>
                    {text.lookingForWork}
                  </Text>
                  <Text style={[styles.roleDesc, {
                    color: selectedRole === "worker" ? 'rgba(255,255,255,0.7)' : C.secondaryLabel,
                  }]}>
                    {text.browseJobs}
                  </Text>
                </View>
                <ChevronRight
                  size={18}
                  color={selectedRole === "worker" ? 'rgba(255,255,255,0.6)' : C.tertiaryLabel}
                  strokeWidth={1.8}
                />
              </Pressable>
            </Animated.View>

            {/* Employer */}
            <Animated.View style={{ opacity: fade3 }}>
              <Pressable
                onPress={() => handleRoleSelection("employer")}
                style={({ pressed }) => [
                  styles.roleCard,
                  {
                    backgroundColor: selectedRole === "employer" ? C.purple : C.surface,
                    borderColor: selectedRole === "employer" ? C.purple : C.separator,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <View style={[styles.roleIcon, {
                  backgroundColor: selectedRole === "employer" ? 'rgba(255,255,255,0.15)' : C.purpleDim,
                }]}>
                  <Briefcase
                    size={24}
                    color={selectedRole === "employer" ? '#FFF' : C.purple}
                    strokeWidth={1.8}
                  />
                </View>
                <View style={styles.roleTextWrap}>
                  <Text style={[styles.roleTitle, {
                    color: selectedRole === "employer" ? '#FFF' : C.text,
                  }]}>
                    {text.postJob}
                  </Text>
                  <Text style={[styles.roleDesc, {
                    color: selectedRole === "employer" ? 'rgba(255,255,255,0.7)' : C.secondaryLabel,
                  }]}>
                    {text.hireWorkers}
                  </Text>
                </View>
                <ChevronRight
                  size={18}
                  color={selectedRole === "employer" ? 'rgba(255,255,255,0.6)' : C.tertiaryLabel}
                  strokeWidth={1.8}
                />
              </Pressable>
            </Animated.View>
          </View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: fade4 }]}>
            <Text style={[styles.footerText, { color: C.tertiaryLabel }]}>
              {text.changeRoleAnytime}
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  // Brand
  brandWrap: { alignItems: 'center', marginBottom: 48 },
  brandCircle: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  brandLetter: { fontSize: 40, fontWeight: '800', color: '#7C3AED' },
  brandName: { fontSize: 38, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  brandSub: { fontSize: 16, textAlign: 'center' },

  // Role cards
  roleCards: { gap: 14 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  roleIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  roleTextWrap: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: '700', marginBottom: 3 },
  roleDesc: { fontSize: 14 },

  // Footer
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 13, textAlign: 'center' },
});
