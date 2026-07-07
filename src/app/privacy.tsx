import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Eye, Phone, Mail, Lock, ShieldCheck, Download, Trash2 } from "lucide-react-native";
import { useClay } from "@/lib/useClay";
import type { ClayColors } from "@/lib/useClay";
import { ClaySurface, ClayIconBox } from "@/components/clay";
import { goBack } from '@/lib/nav';
import { showAlert } from '@/lib/notify';

function ToggleRow({ C, label, icon, value, onToggle }: {
    C: ClayColors; label: string; icon: React.ReactNode; value: boolean; onToggle: (v: boolean) => void;
}) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 }}>
            <ClayIconBox size={42} radius={13} style={{ marginRight: 14 }}>{icon}</ClayIconBox>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, flex: 1, letterSpacing: -0.2 }}>{label}</Text>
            <Switch value={value} onValueChange={onToggle} trackColor={{ false: C.cLo, true: C.accent }} thumbColor="#FFF" ios_backgroundColor={C.cLo} style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }} />
        </View>
    );
}

function NavRow({ C, label, icon, tintBg, onPress, danger }: {
    C: ClayColors; label: string; icon: React.ReactNode; tintBg?: string; onPress: () => void; danger?: boolean;
}) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [{ paddingHorizontal: 14, paddingVertical: 13 }, pressed && { opacity: 0.7 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ClayIconBox size={42} radius={13} tintBg={tintBg ?? C.accentDim} style={{ marginRight: 14 }}>{icon}</ClayIconBox>
                <Text style={{ fontSize: 16, fontWeight: '700', color: danger ? C.red : C.text, flex: 1, letterSpacing: -0.2 }}>{label}</Text>
                {!danger && <ChevronRight size={18} color={C.muted} strokeWidth={2} />}
            </View>
        </Pressable>
    );
}

export default function PrivacyScreen() {
    const router = useRouter();
    const C = useClay();
    const [publicProfile, setPublicProfile] = useState(true);
    const [showPhone, setShowPhone] = useState(false);
    const [showEmail, setShowEmail] = useState(true);

    const handleDeleteAccount = () => {
        showAlert('Vymazať účet', 'Táto akcia je nevratná. Naozaj chcete vymazať svoj účet?', [
            { text: 'Zrušiť', style: 'cancel' },
            { text: 'Vymazať', style: 'destructive', onPress: () => { } },
        ]);
    };

    const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.muted }]}>{label}</Text>
            <ClaySurface radius={18}>{children}</ClaySurface>
        </View>
    );
    const Divider = () => <View style={{ height: 1, backgroundColor: C.hair, marginLeft: 70 }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
                    </ClaySurface>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]}>Nastavenia súkromia</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}>
                <Section label="VIDITEĽNOSŤ PROFILU">
                    <ToggleRow C={C} label="Verejný profil" icon={<Eye size={18} color={C.accent} strokeWidth={2} />} value={publicProfile} onToggle={setPublicProfile} />
                    <Divider />
                    <ToggleRow C={C} label="Zobraziť telefón" icon={<Phone size={18} color={C.accent} strokeWidth={2} />} value={showPhone} onToggle={setShowPhone} />
                    <Divider />
                    <ToggleRow C={C} label="Zobraziť email" icon={<Mail size={18} color={C.accent} strokeWidth={2} />} value={showEmail} onToggle={setShowEmail} />
                </Section>

                <Section label="BEZPEČNOSŤ">
                    <NavRow C={C} icon={<Lock size={18} color={C.accent} strokeWidth={2} />} label="Zmeniť heslo" onPress={() => { }} />
                    <Divider />
                    <NavRow C={C} icon={<ShieldCheck size={18} color={C.accent} strokeWidth={2} />} label="Dvojfaktorové overenie" onPress={() => { }} />
                </Section>

                <Section label="DÁTA">
                    <NavRow C={C} icon={<Download size={18} color={C.accent} strokeWidth={2} />} label="Stiahnuť moje dáta" onPress={() => { }} />
                    <Divider />
                    <NavRow C={C} icon={<Trash2 size={18} color={C.red} strokeWidth={2} />} tintBg="rgba(255,69,58,0.13)" label="Vymazať účet" onPress={handleDeleteAccount} danger />
                </Section>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    section: { paddingHorizontal: 20, marginBottom: 26 },
    sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 12, marginLeft: 4 },
});
