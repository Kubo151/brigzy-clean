import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft, ChevronRight, Sun, Moon, Monitor,
  Bell, Globe, ArrowLeftRight, User, Shield, Check,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import useThemeStore from "@/lib/state/theme-store";
import type { ThemeMode } from "@/lib/state/theme-store";
import useAppStore from "@/lib/state/app-store";
import { SUPPORTED_LANGUAGES } from "@/lib/texts";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";

const themeOptions: { mode: ThemeMode; icon: any; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Svetlý' },
  { mode: 'dark', icon: Moon, label: 'Tmavý' },
  { mode: 'system', icon: Monitor, label: 'Systém' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const C = useColors();
  const themeMode = useThemeStore((s) => s.themeMode);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const language = useThemeStore((s) => s.language);
  const currentRole = useAppStore((s) => s.currentRole);
  const st = useMemo(() => makeStyles(C), [C]);

  const langName = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name ?? 'Slovenčina';
  const roleLabel = currentRole === 'employer' ? 'Režim zamestnávateľa' : 'Režim brigádnika';

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <View style={st.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [st.backBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
          <ChevronLeft size={22} color={C.text} />
        </Pressable>
        <Text style={st.headerTitle}>Nastavenia</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Theme */}
        <View style={st.section}>
          <Text style={st.sectionLabel}>VZHĽAD</Text>
          <View style={st.themeRow}>
            {themeOptions.map((opt) => {
              const active = themeMode === opt.mode;
              const Icon = opt.icon;
              return (
                <Pressable
                  key={opt.mode}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setThemeMode(opt.mode); }}
                  style={[st.themeCard, active && st.themeCardActive]}
                >
                  <Icon size={22} color={active ? '#FFF' : C.muted2} />
                  <Text style={[st.themeLabel, active && { color: '#FFF' }]}>{opt.label}</Text>
                  {active && (
                    <View style={st.checkBadge}>
                      <Check size={12} color="#FFF" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Všeobecné */}
        <View style={st.section}>
          <Text style={st.sectionLabel}>VŠEOBECNÉ</Text>
          <View style={st.menuGroup}>
            <MItem C={C} st={st} icon={<Bell size={18} color={C.yellow} />} iconBg="rgba(251,191,36,0.15)" label="Notifikácie" onPress={() => router.push('/notifications')} />
            <View style={st.divider} />
            <MItem C={C} st={st} icon={<Globe size={18} color={C.purple} />} iconBg={C.purpleDim} label="Jazyk" subtitle={langName} onPress={() => router.push('/language')} />
            <View style={st.divider} />
            <MItem C={C} st={st} icon={<ArrowLeftRight size={18} color={C.purple} />} iconBg={C.purpleDim} label="Zmeniť režim" subtitle={roleLabel} onPress={() => router.push('/role-switch')} />
          </View>
        </View>

        {/* Účet */}
        <View style={st.section}>
          <Text style={st.sectionLabel}>ÚČET</Text>
          <View style={st.menuGroup}>
            <MItem C={C} st={st} icon={<User size={18} color={C.purple} />} iconBg={C.purpleDim} label="Nastavenia profilu" onPress={() => router.push('/account-settings')} />
            <View style={st.divider} />
            <MItem C={C} st={st} icon={<Shield size={18} color={C.purple} />} iconBg={C.purpleDim} label="Nastavenia súkromia" onPress={() => router.push('/privacy')} />
          </View>
        </View>

        <Text style={st.version}>Brigzy v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MItem({ C, st, icon, iconBg, label, subtitle, onPress }: {
  C: AppColors; st: any; icon: React.ReactNode; iconBg: string; label: string; subtitle?: string; onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ paddingHorizontal: 16, paddingVertical: 16 }, pressed && { transform: [{ scale: 0.98 }] }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[st.menuIcon, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={st.menuLabel}>{label}</Text>
          {subtitle ? <Text style={st.menuSub}>{subtitle}</Text> : null}
        </View>
        <ChevronRight size={18} color={C.muted} />
      </View>
    </Pressable>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 1, marginBottom: 14, marginLeft: 4 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeCard: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, gap: 8, position: 'relative' },
  themeCardActive: { backgroundColor: C.purple, borderColor: C.purple },
  themeLabel: { fontSize: 13, fontWeight: '600', color: C.muted2 },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  menuGroup: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 72 },
  menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuLabel: { fontSize: 17, fontWeight: '600', color: C.text },
  menuSub: { fontSize: 14, color: C.muted, marginTop: 3 },
  version: { textAlign: 'center', fontSize: 13, color: C.muted, marginTop: 8 },
});
