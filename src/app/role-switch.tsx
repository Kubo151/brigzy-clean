import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Briefcase, Building2, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import useAppStore from "@/lib/state/app-store";
import { useFlint, RADIUS } from "@/lib/useFlint";
import { Surface, Button } from "@/components/ui";
import { goBack } from '@/lib/nav';

const ROLES = [
    { id: 'worker' as const, icon: Briefcase, label: 'Režim brigádnika', subtitle: 'Hľadám prácu' },
    { id: 'employer' as const, icon: Building2, label: 'Režim zamestnávateľa', subtitle: 'Ponúkam prácu' },
];

export default function RoleSwitchScreen() {
    const router = useRouter();
    const C = useFlint();
    const currentRole = useAppStore((s) => s.currentRole);
    const setCurrentRole = useAppStore((s) => s.setCurrentRole);
    const [selected, setSelected] = useState(currentRole);

    const handleConfirm = () => {
        setCurrentRole(selected);
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <View style={[styles.backBtn, { backgroundColor: C.card2 }]}>
                        <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
                    </View>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]}>Zmeniť režim</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, flexGrow: 1 }}>
                <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
                    {ROLES.map((role) => {
                        const active = selected === role.id;
                        const Icon = role.icon;
                        return (
                            <Pressable key={role.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(role.id); }}>
                                <Surface radius={RADIUS.lg} tone={active ? 'card2' : 'card'} style={active ? { backgroundColor: C.accentDim } : undefined}>
                                    <View style={styles.roleCard}>
                                        <View style={[styles.roleIcon, { backgroundColor: active ? C.card : C.card2 }]}>
                                            <Icon size={24} color={C.accent} strokeWidth={2} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 16 }}>
                                            <Text style={[styles.roleLabel, { color: C.text }]}>{role.label}</Text>
                                            <Text style={[styles.roleSub, { color: C.muted }]}>{role.subtitle}</Text>
                                        </View>
                                        {active && (
                                            <View style={[styles.checkCircle, { backgroundColor: C.accent }]}>
                                                <Check size={16} color={C.onAccent} strokeWidth={3.2} />
                                            </View>
                                        )}
                                    </View>
                                </Surface>
                            </Pressable>
                        );
                    })}
                </View>

                <Button label="Potvrdiť výber" onPress={handleConfirm} style={{ marginBottom: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '600' },
    roleCard: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    roleIcon: { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    roleLabel: { fontSize: 17, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3 },
    roleSub: { fontSize: 13.5, fontWeight: '500' },
    checkCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
