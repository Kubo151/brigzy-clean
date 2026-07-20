import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Pressable, Animated, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Briefcase, Search, ChevronRight, Zap } from "lucide-react-native";
import useAppStore from "@/lib/state/app-store";
import { useFlint, RADIUS } from "@/lib/useFlint";
import { useText } from "@/lib/useText";

export default function WelcomeScreen() {
  const router = useRouter();
  const C = useFlint();
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
      router.replace('/(tabs)');
    }, 300);
  };

  const RoleCard = ({ role, icon, title, desc }: {
    role: "worker" | "employer"; icon: React.ReactNode; title: string; desc: string;
  }) => {
    const active = selectedRole === role;
    return (
      <Pressable onPress={() => handleRoleSelection(role)} style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
        <View
          style={[
            styles.roleCard,
            { backgroundColor: active ? C.accent : C.card },
          ]}
        >
          <View style={[styles.roleIcon, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : C.card2 }]}>
            {React.isValidElement(icon) ? React.cloneElement(icon as any, { color: active ? C.onAccent : C.accent }) : icon}
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={[styles.roleTitle, { color: active ? C.onAccent : C.text }]}>{title}</Text>
            <Text style={[styles.roleDesc, { color: active ? 'rgba(255,255,255,0.75)' : C.muted }]}>{desc}</Text>
          </View>
          <ChevronRight size={18} color={active ? 'rgba(255,255,255,0.7)' : C.accent} strokeWidth={2.2} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          {/* Brand */}
          <Animated.View style={[styles.brandWrap, { opacity: fade1 }]}>
            <View style={[styles.brandCircle, { backgroundColor: C.accent }]}>
              <Zap size={36} color={C.onAccent} fill={C.onAccent} strokeWidth={0} />
            </View>
            <Text style={[styles.brandName, { color: C.text }]}>Brigzy</Text>
            <Text style={[styles.brandSub, { color: C.muted }]}>{text.welcomeSubtitle}</Text>
          </Animated.View>

          {/* Role cards */}
          <View style={styles.roleCards}>
            <Animated.View style={{ opacity: fade2 }}>
              <RoleCard role="worker" icon={<Search size={24} color={C.accent} strokeWidth={1.9} />} title={text.lookingForWork} desc={text.browseJobs} />
            </Animated.View>
            <Animated.View style={{ opacity: fade3 }}>
              <RoleCard role="employer" icon={<Briefcase size={24} color={C.accent} strokeWidth={1.9} />} title={text.postJob} desc={text.hireWorkers} />
            </Animated.View>
          </View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: fade4 }]}>
            <Text style={[styles.footerText, { color: C.muted }]}>{text.changeRoleAnytime}</Text>
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
  brandCircle: { width: 88, height: 88, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  brandName: { fontSize: 38, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  brandSub: { fontSize: 16, textAlign: 'center', fontWeight: '600' },

  // Role cards
  roleCards: { gap: 14 },
  roleCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderRadius: RADIUS.lg },
  roleIcon: { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  roleTextWrap: { flex: 1 },
  roleTitle: { fontSize: 17, fontWeight: '800', marginBottom: 3, letterSpacing: -0.3 },
  roleDesc: { fontSize: 13.5, fontWeight: '500' },

  // Footer
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },
});
