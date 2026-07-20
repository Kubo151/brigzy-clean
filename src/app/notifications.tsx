import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, Mail, Smartphone } from "lucide-react-native";
import { useFlint, RADIUS } from "@/lib/useFlint";
import type { FlintColors } from "@/lib/useFlint";
import { goBack } from '@/lib/nav';

function ToggleRow({ C, label, subtitle, value, onToggle }: {
    C: FlintColors; label: string; subtitle: string; value: boolean; onToggle: (v: boolean) => void;
}) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 15.5, fontWeight: '600', color: C.text, letterSpacing: -0.2 }}>{label}</Text>
                <Text style={{ fontSize: 12.5, color: C.muted, marginTop: 3, fontWeight: '500' }}>{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: C.card2, true: C.accent }}
                thumbColor="#FFF"
                ios_backgroundColor={C.card2}
                style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
            />
        </View>
    );
}

export default function NotificationsScreen() {
    const router = useRouter();
    const C = useFlint();
    const [push, setPush] = useState({ newJobs: true, messages: true, applications: true });
    const [email, setEmail] = useState({ newsletter: false, weekly: true });
    const [inApp, setInApp] = useState({ sounds: true, vibrations: true });

    const Section = ({ icon, iconBg, label, children }: { icon: React.ReactNode; iconBg: string; label: string; children: React.ReactNode }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: iconBg }]}>{icon}</View>
                <Text style={[styles.sectionLabel, { color: C.muted }]}>{label}</Text>
            </View>
            <View style={{ backgroundColor: C.card, borderRadius: RADIUS.lg }}>{children}</View>
        </View>
    );
    const Divider = () => <View style={{ height: 1, backgroundColor: C.divider, marginLeft: 16 }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <View style={[styles.backBtn, { backgroundColor: C.card2 }]}>
                        <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
                    </View>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]}>Notifikácie</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}>
                <Section icon={<Bell size={16} color={C.accent} strokeWidth={2} />} iconBg={C.accentDim} label="PUSH NOTIFIKÁCIE">
                    <ToggleRow C={C} label="Nové brigády" subtitle="Upozornenia na nové pracovné ponuky" value={push.newJobs} onToggle={(v) => setPush({ ...push, newJobs: v })} />
                    <Divider />
                    <ToggleRow C={C} label="Správy" subtitle="Nové správy od zamestnávateľov" value={push.messages} onToggle={(v) => setPush({ ...push, messages: v })} />
                    <Divider />
                    <ToggleRow C={C} label="Prihlášky" subtitle="Akceptované alebo odmietnuté prihlášky" value={push.applications} onToggle={(v) => setPush({ ...push, applications: v })} />
                </Section>

                <Section icon={<Mail size={16} color={C.star} strokeWidth={2} />} iconBg="rgba(245,166,35,0.15)" label="EMAIL NOTIFIKÁCIE">
                    <ToggleRow C={C} label="Newsletter" subtitle="Novinky a aktualizácie Brigzy" value={email.newsletter} onToggle={(v) => setEmail({ ...email, newsletter: v })} />
                    <Divider />
                    <ToggleRow C={C} label="Týždenný súhrn" subtitle="Prehľad vašej aktivity za týždeň" value={email.weekly} onToggle={(v) => setEmail({ ...email, weekly: v })} />
                </Section>

                <Section icon={<Smartphone size={16} color={C.verified} strokeWidth={2} />} iconBg="rgba(79,178,255,0.15)" label="V APLIKÁCII">
                    <ToggleRow C={C} label="Zvuky" subtitle="Zvukové efekty notifikácií" value={inApp.sounds} onToggle={(v) => setInApp({ ...inApp, sounds: v })} />
                    <Divider />
                    <ToggleRow C={C} label="Vibrácie" subtitle="Vibračná odozva pri notifikáciách" value={inApp.vibrations} onToggle={(v) => setInApp({ ...inApp, vibrations: v })} />
                </Section>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '600' },
    section: { paddingHorizontal: 20, marginBottom: 26 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 4 },
    sectionIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
});
