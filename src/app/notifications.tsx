import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, Mail, Smartphone } from "lucide-react-native";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";

function ToggleRow({ C, label, subtitle, value, onToggle }: {
    C: AppColors; label: string; subtitle: string; value: boolean; onToggle: (v: boolean) => void;
}) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: C.text }}>{label}</Text>
                <Text style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: C.surface2, true: C.purple }}
                thumbColor="#FFF"
                ios_backgroundColor={C.surface2}
                style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
            />
        </View>
    );
}

export default function NotificationsScreen() {
    const router = useRouter();
    const C = useColors();
    const st = useMemo(() => makeStyles(C), [C]);
    const [push, setPush] = useState({ newJobs: true, messages: true, applications: true });
    const [email, setEmail] = useState({ newsletter: false, weekly: true });
    const [inApp, setInApp] = useState({ sounds: true, vibrations: true });

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <View style={st.header}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [st.backBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
                    <ChevronLeft size={22} color={C.text} />
                </Pressable>
                <Text style={st.headerTitle}>Notifikácie</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={st.section}>
                    <View style={st.sectionHeader}>
                        <View style={[st.sectionIcon, { backgroundColor: C.purpleDim }]}><Bell size={16} color={C.purple} /></View>
                        <Text style={st.sectionLabel}>PUSH NOTIFIKÁCIE</Text>
                    </View>
                    <View style={st.menuGroup}>
                        <ToggleRow C={C} label="Nové brigády" subtitle="Upozornenia na nové pracovné ponuky" value={push.newJobs} onToggle={(v) => setPush({ ...push, newJobs: v })} />
                        <View style={st.divider} />
                        <ToggleRow C={C} label="Správy" subtitle="Nové správy od zamestnávateľov" value={push.messages} onToggle={(v) => setPush({ ...push, messages: v })} />
                        <View style={st.divider} />
                        <ToggleRow C={C} label="Prihlášky" subtitle="Akceptované alebo odmietnuté prihlášky" value={push.applications} onToggle={(v) => setPush({ ...push, applications: v })} />
                    </View>
                </View>

                <View style={st.section}>
                    <View style={st.sectionHeader}>
                        <View style={[st.sectionIcon, { backgroundColor: 'rgba(251,191,36,0.15)' }]}><Mail size={16} color={C.yellow} /></View>
                        <Text style={st.sectionLabel}>EMAIL NOTIFIKÁCIE</Text>
                    </View>
                    <View style={st.menuGroup}>
                        <ToggleRow C={C} label="Newsletter" subtitle="Novinky a aktualizácie Brigzy" value={email.newsletter} onToggle={(v) => setEmail({ ...email, newsletter: v })} />
                        <View style={st.divider} />
                        <ToggleRow C={C} label="Týždenný súhrn" subtitle="Prehľad vašej aktivity za týždeň" value={email.weekly} onToggle={(v) => setEmail({ ...email, weekly: v })} />
                    </View>
                </View>

                <View style={st.section}>
                    <View style={st.sectionHeader}>
                        <View style={[st.sectionIcon, { backgroundColor: 'rgba(96,165,250,0.15)' }]}><Smartphone size={16} color={C.blue} /></View>
                        <Text style={st.sectionLabel}>V APLIKÁCII</Text>
                    </View>
                    <View style={st.menuGroup}>
                        <ToggleRow C={C} label="Zvuky" subtitle="Zvukové efekty notifikácií" value={inApp.sounds} onToggle={(v) => setInApp({ ...inApp, sounds: v })} />
                        <View style={st.divider} />
                        <ToggleRow C={C} label="Vibrácie" subtitle="Vibračná odozva pri notifikáciách" value={inApp.vibrations} onToggle={(v) => setInApp({ ...inApp, vibrations: v })} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    section: { paddingHorizontal: 20, marginBottom: 28 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginLeft: 4 },
    sectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 1 },
    menuGroup: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    divider: { height: 1, backgroundColor: C.border, marginLeft: 16 },
});
