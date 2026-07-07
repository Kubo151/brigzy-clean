import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft, ChevronRight, Sun, Moon, Monitor,
  Bell, Globe, ArrowLeftRight, User, Shield, Check,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useThemeStore from "@/lib/state/theme-store";
import type { ThemeMode } from "@/lib/state/theme-store";
import useAppStore from "@/lib/state/app-store";
import { SUPPORTED_LANGUAGES } from "@/lib/texts";
import { useClay } from "@/lib/useClay";
import type { ClayColors } from "@/lib/useClay";
import { ClaySurface, ClayIconBox } from "@/components/clay";
import { goBack } from '@/lib/nav';

const themeOptions: { mode: ThemeMode; icon: any; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Svetlý' },
  { mode: 'dark', icon: Moon, label: 'Tmavý' },
  { mode: 'system', icon: Monitor, label: 'Systém' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const C = useClay();
  const themeMode = useThemeStore((s) => s.themeMode);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const language = useThemeStore((s) => s.language);
  const currentRole = useAppStore((s) => s.currentRole);

  const langName = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name ?? 'Slovenčina';
  const roleLabel = currentRole === 'employer' ? 'Režim zamestnávateľa' : 'Režim brigádnika';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
          <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
          </ClaySurface>
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]}>Nastavenia</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Theme */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>VZHĽAD</Text>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const active = themeMode === opt.mode;
              const Icon = opt.icon;
              return (
                <Pressable key={opt.mode} style={{ flex: 1 }}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setThemeMode(opt.mode); }}>
                  {active ? (
                    <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.themeCard}>
                      <Icon size={22} color={C.onAccent} strokeWidth={2} />
                      <Text style={[styles.themeLabel, { color: C.onAccent }]}>{opt.label}</Text>
                      <View style={styles.checkBadge}><Check size={12} color={C.onAccent} strokeWidth={3.2} /></View>
                    </LinearGradient>
                  ) : (
                    <ClaySurface radius={16} contentStyle={styles.themeCard}>
                      <Icon size={22} color={C.muted} strokeWidth={2} />
                      <Text style={[styles.themeLabel, { color: C.muted }]}>{opt.label}</Text>
                    </ClaySurface>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Všeobecné */}
        <Section label="VŠEOBECNÉ" C={C}>
          <MItem C={C} icon={<Bell size={18} color={C.star} strokeWidth={2} />} tintBg="rgba(255,179,0,0.15)" label="Notifikácie" onPress={() => router.push('/notifications')} first />
          <Divider C={C} />
          <MItem C={C} icon={<Globe size={18} color={C.accent} strokeWidth={2} />} label="Jazyk" subtitle={langName} onPress={() => router.push('/language')} />
          <Divider C={C} />
          <MItem C={C} icon={<ArrowLeftRight size={18} color={C.accent} strokeWidth={2} />} label="Zmeniť režim" subtitle={roleLabel} onPress={() => router.push('/role-switch')} last />
        </Section>

        {/* Účet */}
        <Section label="ÚČET" C={C}>
          <MItem C={C} icon={<User size={18} color={C.accent} strokeWidth={2} />} label="Nastavenia profilu" onPress={() => router.push('/account-settings')} first />
          <Divider C={C} />
          <MItem C={C} icon={<Shield size={18} color={C.accent} strokeWidth={2} />} label="Nastavenia súkromia" onPress={() => router.push('/privacy')} last />
        </Section>

        <Text style={[styles.version, { color: C.muted }]}>Brigzy v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, C, children }: { label: string; C: ClayColors; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: C.muted }]}>{label}</Text>
      <ClaySurface radius={18}>{children}</ClaySurface>
    </View>
  );
}

function Divider({ C }: { C: ClayColors }) {
  return <View style={{ height: 1, backgroundColor: C.hair, marginLeft: 70 }} />;
}

function MItem({ C, icon, tintBg, label, subtitle, onPress, first, last }: {
  C: ClayColors; icon: React.ReactNode; tintBg?: string; label: string; subtitle?: string; onPress?: () => void; first?: boolean; last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{
      paddingHorizontal: 14, paddingVertical: 14,
      borderTopLeftRadius: first ? 18 : 0, borderTopRightRadius: first ? 18 : 0,
      borderBottomLeftRadius: last ? 18 : 0, borderBottomRightRadius: last ? 18 : 0,
    }, pressed && { opacity: 0.7 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ClayIconBox size={42} radius={13} tintBg={tintBg ?? C.accentDim} style={{ marginRight: 14 }}>{icon}</ClayIconBox>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, letterSpacing: -0.2 }}>{label}</Text>
          {subtitle ? <Text style={{ fontSize: 13, color: C.muted, marginTop: 2, fontWeight: '500' }}>{subtitle}</Text> : null}
        </View>
        <ChevronRight size={18} color={C.muted} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  section: { paddingHorizontal: 20, marginBottom: 26 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 12, marginLeft: 4 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeCard: { alignItems: 'center', paddingVertical: 20, borderRadius: 16, gap: 8, position: 'relative' },
  themeLabel: { fontSize: 13, fontWeight: '700' },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  version: { textAlign: 'center', fontSize: 13, marginTop: 8, fontWeight: '600' },
});
