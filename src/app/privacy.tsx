import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Eye, Phone, Mail, Lock, ShieldCheck, Download, Trash2 } from "lucide-react-native";
import { useFlint, RADIUS } from "@/lib/useFlint";
import { ListRow, Divider } from "@/components/ui";
import { goBack } from '@/lib/nav';
import { showAlert } from '@/lib/notify';

export default function PrivacyScreen() {
    const C = useFlint();
    const [publicProfile, setPublicProfile] = useState(true);
    const [showPhone, setShowPhone] = useState(false);
    const [showEmail, setShowEmail] = useState(true);

    const handleDeleteAccount = () => {
        showAlert('Vymazať účet', 'Táto akcia je nevratná. Naozaj chcete vymazať svoj účet?', [
            { text: 'Zrušiť', style: 'cancel' },
            { text: 'Vymazať', style: 'destructive', onPress: () => { } },
        ]);
    };

    const toggleTrack = { false: C.card2, true: C.accent };

    const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.muted }]}>{label}</Text>
            <View style={{ backgroundColor: C.card, borderRadius: RADIUS.lg }}>{children}</View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <View style={[styles.backBtn, { backgroundColor: C.card2 }]}>
                        <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
                    </View>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]}>Nastavenia súkromia</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}>
                <Section label="VIDITEĽNOSŤ PROFILU">
                    <ListRow
                        icon={<Eye size={18} color={C.accent} strokeWidth={2} />}
                        label="Verejný profil"
                        trailing={<Switch value={publicProfile} onValueChange={setPublicProfile} trackColor={toggleTrack} thumbColor="#FFF" ios_backgroundColor={C.card2} style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }} />}
                    />
                    <Divider />
                    <ListRow
                        icon={<Phone size={18} color={C.accent} strokeWidth={2} />}
                        label="Zobraziť telefón"
                        trailing={<Switch value={showPhone} onValueChange={setShowPhone} trackColor={toggleTrack} thumbColor="#FFF" ios_backgroundColor={C.card2} style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }} />}
                    />
                    <Divider />
                    <ListRow
                        icon={<Mail size={18} color={C.accent} strokeWidth={2} />}
                        label="Zobraziť email"
                        trailing={<Switch value={showEmail} onValueChange={setShowEmail} trackColor={toggleTrack} thumbColor="#FFF" ios_backgroundColor={C.card2} style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }} />}
                    />
                </Section>

                <Section label="BEZPEČNOSŤ">
                    <ListRow icon={<Lock size={18} color={C.accent} strokeWidth={2} />} label="Zmeniť heslo" onPress={() => { }} />
                    <Divider />
                    <ListRow icon={<ShieldCheck size={18} color={C.accent} strokeWidth={2} />} label="Dvojfaktorové overenie" onPress={() => { }} />
                </Section>

                <Section label="DÁTA">
                    <ListRow icon={<Download size={18} color={C.accent} strokeWidth={2} />} label="Stiahnuť moje dáta" onPress={() => { }} />
                    <Divider />
                    <ListRow icon={<Trash2 size={18} color={C.red} strokeWidth={2} />} label="Vymazať účet" onPress={handleDeleteAccount} danger />
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
    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12, marginLeft: 4 },
});
