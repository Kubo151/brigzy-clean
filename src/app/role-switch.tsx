import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Briefcase, Building2, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useAppStore from "@/lib/state/app-store";
import { useClay } from "@/lib/useClay";
import { ClaySurface, ClayIconBox } from "@/components/clay";
import { goBack } from '@/lib/nav';

const ROLES = [
    { id: 'worker' as const, icon: Briefcase, label: 'Režim brigádnika', subtitle: 'Hľadám prácu' },
    { id: 'employer' as const, icon: Building2, label: 'Režim zamestnávateľa', subtitle: 'Ponúkam prácu' },
];

export default function RoleSwitchScreen() {
    const router = useRouter();
    const C = useClay();
    const currentRole = useAppStore((s) => s.currentRole);
    const setCurrentRole = useAppStore((s) => s.setCurrentRole);
    const [selected, setSelected] = useState(currentRole);

    const handleConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCurrentRole(selected);
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
                    </ClaySurface>
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
                                <ClaySurface radius={20} style={active ? styles.activeWrap : undefined} contentStyle={[styles.roleCard, active && { borderRadius: 20, borderWidth: 2, borderColor: C.accent, backgroundColor: C.accentDim }]}>
                                    <ClayIconBox size={52} radius={16} tintBg={active ? undefined : C.cLo}>
                                        <Icon size={24} color={C.accent} strokeWidth={2} />
                                    </ClayIconBox>
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <Text style={[styles.roleLabel, { color: C.text }]}>{role.label}</Text>
                                        <Text style={[styles.roleSub, { color: C.muted }]}>{role.subtitle}</Text>
                                    </View>
                                    {active && (
                                        <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.checkCircle}>
                                            <Check size={16} color={C.onAccent} strokeWidth={3.2} />
                                        </LinearGradient>
                                    )}
                                </ClaySurface>
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable onPress={handleConfirm} style={({ pressed }) => [styles.confirmWrap, Platform.select({
                    ios: { shadowColor: C.accentShadow.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: C.accentShadow.opacity, shadowRadius: 14 },
                    android: { elevation: 6 },
                }), pressed && { transform: [{ scale: 0.97 }] }]}>
                    <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.confirmBtn}>
                        <LinearGradient colors={['rgba(255,255,255,0.28)', 'transparent']} style={styles.confirmSheen} />
                        <Text style={[styles.confirmText, { color: C.onAccent }]}>Potvrdiť výber</Text>
                    </LinearGradient>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    activeWrap: {},
    roleCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20 },
    roleLabel: { fontSize: 17, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
    roleSub: { fontSize: 13.5, fontWeight: '500' },
    checkCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    confirmWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 20 },
    confirmBtn: { paddingVertical: 17, borderRadius: 18, alignItems: 'center', overflow: 'hidden' },
    confirmSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
    confirmText: { fontSize: 16, fontWeight: '800' },
});
