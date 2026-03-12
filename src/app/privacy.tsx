import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Switch, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Eye, Phone, Mail, Lock, ShieldCheck, Download, Trash2 } from "lucide-react-native";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";

function ToggleRow({ C, label, icon, value, onToggle }: {
    C: AppColors; label: string; icon: React.ReactNode; value: boolean; onToggle: (v: boolean) => void;
}) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {icon}
                <Text style={{ fontSize: 17, fontWeight: '600', color: C.text, marginLeft: 14 }}>{label}</Text>
            </View>
            <Switch value={value} onValueChange={onToggle} trackColor={{ false: C.surface2, true: C.purple }} thumbColor="#FFF" ios_backgroundColor={C.surface2} style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }} />
        </View>
    );
}

function NavRow({ C, st, label, icon, iconBg, onPress, danger }: {
    C: AppColors; st: any; label: string; icon: React.ReactNode; iconBg: string; onPress: () => void; danger?: boolean;
}) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [{ paddingHorizontal: 16, paddingVertical: 16 }, pressed && { transform: [{ scale: 0.98 }] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[st.navIcon, { backgroundColor: iconBg }]}>{icon}</View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: danger ? C.red : C.text, flex: 1 }}>{label}</Text>
                {!danger && <ChevronRight size={18} color={C.muted} />}
            </View>
        </Pressable>
    );
}

export default function PrivacyScreen() {
    const router = useRouter();
    const C = useColors();
    const st = useMemo(() => makeStyles(C), [C]);
    const [publicProfile, setPublicProfile] = useState(true);
    const [showPhone, setShowPhone] = useState(false);
    const [showEmail, setShowEmail] = useState(true);

    const handleDeleteAccount = () => {
        Alert.alert('Vymazať účet', 'Táto akcia je nevratná. Naozaj chcete vymazať svoj účet?', [
            { text: 'Zrušiť', style: 'cancel' },
            { text: 'Vymazať', style: 'destructive', onPress: () => { } },
        ]);
    };

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <View style={st.header}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [st.backBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
                    <ChevronLeft size={22} color={C.text} />
                </Pressable>
                <Text style={st.headerTitle}>Nastavenia súkromia</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={st.section}>
                    <Text style={st.sectionLabel}>VIDITEĽNOSŤ PROFILU</Text>
                    <View style={st.menuGroup}>
                        <ToggleRow C={C} label="Verejný profil" icon={<Eye size={18} color={C.purple} />} value={publicProfile} onToggle={setPublicProfile} />
                        <View style={st.divider} />
                        <ToggleRow C={C} label="Zobraziť telefón" icon={<Phone size={18} color={C.purple} />} value={showPhone} onToggle={setShowPhone} />
                        <View style={st.divider} />
                        <ToggleRow C={C} label="Zobraziť email" icon={<Mail size={18} color={C.purple} />} value={showEmail} onToggle={setShowEmail} />
                    </View>
                </View>

                <View style={st.section}>
                    <Text style={st.sectionLabel}>BEZPEČNOSŤ</Text>
                    <View style={st.menuGroup}>
                        <NavRow C={C} st={st} icon={<Lock size={18} color={C.purple} />} iconBg={C.purpleDim} label="Zmeniť heslo" onPress={() => { }} />
                        <View style={st.divider} />
                        <NavRow C={C} st={st} icon={<ShieldCheck size={18} color={C.purple} />} iconBg={C.purpleDim} label="Dvojfaktorové overenie" onPress={() => { }} />
                    </View>
                </View>

                <View style={st.section}>
                    <Text style={st.sectionLabel}>DÁTA</Text>
                    <View style={st.menuGroup}>
                        <NavRow C={C} st={st} icon={<Download size={18} color={C.purple} />} iconBg={C.purpleDim} label="Stiahnuť moje dáta" onPress={() => { }} />
                        <View style={st.divider} />
                        <NavRow C={C} st={st} icon={<Trash2 size={18} color={C.red} />} iconBg="rgba(239,68,68,0.12)" label="Vymazať účet" onPress={handleDeleteAccount} danger />
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
    sectionLabel: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 1, marginBottom: 14, marginLeft: 4 },
    menuGroup: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    divider: { height: 1, backgroundColor: C.border, marginLeft: 16 },
    navIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
});
