import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Briefcase, Building2, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useAppStore from "@/lib/state/app-store";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";

const ROLES = [
    { id: 'worker' as const, icon: Briefcase, label: 'Režim brigádnika', subtitle: 'Hľadám prácu' },
    { id: 'employer' as const, icon: Building2, label: 'Režim zamestnávateľa', subtitle: 'Ponúkam prácu' },
];

export default function RoleSwitchScreen() {
    const router = useRouter();
    const C = useColors();
    const st = useMemo(() => makeStyles(C), [C]);
    const currentRole = useAppStore((s) => s.currentRole);
    const setCurrentRole = useAppStore((s) => s.setCurrentRole);
    const [selected, setSelected] = useState(currentRole);

    const handleConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCurrentRole(selected);
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <View style={st.header}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [st.backBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
                    <ChevronLeft size={22} color={C.text} />
                </Pressable>
                <Text style={st.headerTitle}>Zmeniť režim</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, flex: 1 }}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    {ROLES.map((role) => {
                        const active = selected === role.id;
                        const Icon = role.icon;
                        return (
                            <Pressable
                                key={role.id}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(role.id); }}
                                style={[st.roleCard, active && { borderColor: C.purple, backgroundColor: C.purpleDim }]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[st.roleIcon, { backgroundColor: active ? C.purple : C.surface2 }]}>
                                        <Icon size={24} color={active ? '#FFF' : C.muted} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={st.roleLabel}>{role.label}</Text>
                                        <Text style={st.roleSub}>{role.subtitle}</Text>
                                    </View>
                                    {active && (
                                        <View style={st.checkCircle}>
                                            <Check size={16} color="#FFF" strokeWidth={3} />
                                        </View>
                                    )}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable onPress={handleConfirm} style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}>
                    <LinearGradient colors={['#7c3aed', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.confirmBtn}>
                        <Text style={st.confirmText}>Potvrdiť výber</Text>
                    </LinearGradient>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    roleCard: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 2, borderColor: C.border, padding: 20, marginBottom: 16 },
    roleIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    roleLabel: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 4 },
    roleSub: { fontSize: 14, color: C.muted },
    checkCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
    confirmBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
    confirmText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
});
