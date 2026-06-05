import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Pressable, Animated, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Briefcase, Search, ChevronRight, Zap } from "lucide-react-native";
import useAppStore from "@/lib/state/app-store";
import { useClay } from "@/lib/useClay";
import { useText } from "@/lib/useText";
import { ClaySurface, ClayIconBox } from "@/components/clay";

export default function WelcomeScreen() {
  const router = useRouter();
  const C = useClay();
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

  const RoleCard = ({ role, icon, title, desc }: {
    role: "worker" | "employer"; icon: React.ReactNode; title: string; desc: string;
  }) => {
    const active = selectedRole === role;
    return (
      <Pressable onPress={() => handleRoleSelection(role)} style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
        {active ? (
          <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.roleCardActive}>
            <View style={[styles.roleIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              {React.isValidElement(icon) ? React.cloneElement(icon as any, { color: C.onAccent }) : icon}
            </View>
            <View style={styles.roleTextWrap}>
              <Text style={[styles.roleTitle, { color: C.onAccent }]}>{title}</Text>
              <Text style={[styles.roleDesc, { color: 'rgba(255,255,255,0.75)' }]}>{desc}</Text>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.7)" strokeWidth={2.2} />
          </LinearGradient>
        ) : (
          <ClaySurface radius={20} contentStyle={styles.roleCard}>
            <ClayIconBox size={52} radius={16}>{icon}</ClayIconBox>
            <View style={styles.roleTextWrap}>
              <Text style={[styles.roleTitle, { color: C.text }]}>{title}</Text>
              <Text style={[styles.roleDesc, { color: C.muted }]}>{desc}</Text>
            </View>
            <ChevronRight size={18} color={C.accent} strokeWidth={2.2} />
          </ClaySurface>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          {/* Brand */}
          <Animated.View style={[styles.brandWrap, { opacity: fade1 }]}>
            <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.brandCircle}>
              <LinearGradient colors={['rgba(255,255,255,0.4)', 'transparent']} style={styles.brandSpecular} />
              <Zap size={36} color={C.onAccent} fill={C.onAccent} strokeWidth={0} />
            </LinearGradient>
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
  brandCircle: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
  brandSpecular: { position: 'absolute', top: 0, left: 0, right: 0, height: 44 },
  brandName: { fontSize: 38, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  brandSub: { fontSize: 16, textAlign: 'center', fontWeight: '600' },

  // Role cards
  roleCards: { gap: 14 },
  roleCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderRadius: 20 },
  roleCardActive: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderRadius: 20,
    ...Platform.select({
      ios: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 16 },
      android: { elevation: 6 },
    }),
  },
  roleIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  roleTextWrap: { flex: 1 },
  roleTitle: { fontSize: 17, fontWeight: '800', marginBottom: 3, letterSpacing: -0.3 },
  roleDesc: { fontSize: 13.5, fontWeight: '500' },

  // Footer
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 13, textAlign: 'center', fontWeight: '500' },
});
