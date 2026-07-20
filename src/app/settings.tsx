import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft, Sun, Moon, Monitor,
  Bell, Globe, ArrowLeftRight, User, Shield, Check,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import useThemeStore from "@/lib/state/theme-store";
import type { ThemeMode } from "@/lib/state/theme-store";
import useAppStore from "@/lib/state/app-store";
import { SUPPORTED_LANGUAGES } from "@/lib/texts";
import { useFlint, RADIUS } from "@/lib/useFlint";
import { ListRow, Divider } from "@/components/ui";
import { goBack } from '@/lib/nav';

const themeOptions: { mode: ThemeMode; icon: any; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Svetlý' },
  { mode: 'dark', icon: Moon, label: 'Tmavý' },
  { mode: 'system', icon: Monitor, label: 'Systém' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const C = useFlint();
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
          <View style={[styles.backBtn, { backgroundColor: C.card2 }]}>
            <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
          </View>
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
                  <View style={[styles.themeCard, { backgroundColor: active ? C.accent : C.card }]}>
                    <Icon size={22} color={active ? C.onAccent : C.muted} strokeWidth={2} />
                    <Text style={[styles.themeLabel, { color: active ? C.onAccent : C.muted }]}>{opt.label}</Text>
                    {active && (
                      <View style={styles.checkBadge}><Check size={12} color={C.onAccent} strokeWidth={3.2} /></View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Všeobecné */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>VŠEOBECNÉ</Text>
          <View style={[styles.card, { backgroundColor: C.card }]}>
            <ListRow icon={<Bell size={18} color={C.star} strokeWidth={2} />} label="Notifikácie" onPress={() => router.push('/notifications')} />
            <Divider />
            <ListRow icon={<Globe size={18} color={C.accent} strokeWidth={2} />} label="Jazyk" value={langName} onPress={() => router.push('/language')} />
            <Divider />
            <ListRow icon={<ArrowLeftRight size={18} color={C.accent} strokeWidth={2} />} label="Zmeniť režim" value={roleLabel} onPress={() => router.push('/role-switch')} />
          </View>
        </View>

        {/* Účet */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>ÚČET</Text>
          <View style={[styles.card, { backgroundColor: C.card }]}>
            <ListRow icon={<User size={18} color={C.accent} strokeWidth={2} />} label="Nastavenia profilu" onPress={() => router.push('/account-settings')} />
            <Divider />
            <ListRow icon={<Shield size={18} color={C.accent} strokeWidth={2} />} label="Nastavenia súkromia" onPress={() => router.push('/privacy')} />
          </View>
        </View>

        <Text style={[styles.version, { color: C.muted }]}>Brigzy v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  section: { paddingHorizontal: 20, marginBottom: 26 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12, marginLeft: 4 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeCard: { alignItems: 'center', paddingVertical: 20, borderRadius: RADIUS.md, gap: 8, position: 'relative' },
  themeLabel: { fontSize: 13, fontWeight: '600' },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: RADIUS.lg },
  version: { textAlign: 'center', fontSize: 13, marginTop: 8, fontWeight: '600' },
});
