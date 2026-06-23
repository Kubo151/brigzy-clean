import React, { useEffect, useState } from "react";
import {
    View, Text, ScrollView, Pressable, Image, Alert, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    Settings, ChevronRight, CreditCard, User, UserCheck,
    Bell, Lock, HelpCircle, LogOut, Pencil, Star, ArrowLeftRight, Briefcase, Search,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useText } from "@/lib/useText";
import useAppStore from "@/lib/state/app-store";
import { supabase } from "@/lib/supabase";
import { useClay } from "@/lib/useClay";
import type { ClayColors } from "@/lib/useClay";
import { ClaySurface, ClayIconBox } from "@/components/clay";

// ─── PROFILE SCREEN ─────────────────────────────────
export default function ProfileScreen() {
    const router = useRouter();
    const text = useText();
    const C = useClay();
    const currentUser = useAppStore((s) => s.currentUser);
    const logout = useAppStore((s) => s.logout);
    const currentRole = useAppStore((s) => s.currentRole);
    const setCurrentRole = useAppStore((s) => s.setCurrentRole);

    const [stats, setStats] = useState({ completedJobs: 0, rating: 0, reviews: 0, earned: 0 });

    useEffect(() => { loadUserStats(); }, []);

    const loadUserStats = async () => {
        if (!currentUser?.id) return;
        try {
            const { data } = await supabase
                .from('users').select('rating, rating_count').eq('id', currentUser.id).single();
            if (data) {
                setStats({ completedJobs: 0, rating: data.rating || 0, reviews: data.rating_count || 0, earned: 0 });
            }
        } catch (e) {
            console.error('Error loading stats:', e);
        }
    };

    const handleLogout = () => {
        const doLogout = async () => {
            await supabase.auth.signOut();
            logout();
            router.replace('/login');
        };
        if (Platform.OS === 'web') {
            if (window.confirm('Naozaj sa chcete odhlásiť?')) doLogout();
        } else {
            Alert.alert('Odhlásiť sa', 'Naozaj sa chcete odhlásiť?', [
                { text: 'Zrušiť', style: 'cancel' },
                { text: 'Odhlásiť', style: 'destructive', onPress: doLogout },
            ]);
        }
    };

    const displayName = (currentUser as any)?.display_name || currentUser?.name || 'Používateľ';
    const email = currentUser?.email || '';
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: C.text }]}>Profil</Text>
                    <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                        <ClaySurface radius={15} style={{ width: 44, height: 44 }} contentStyle={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                            <Settings size={20} color={C.text} strokeWidth={2} />
                        </ClaySurface>
                    </Pressable>
                </View>

                {/* Profile card */}
                <View style={{ paddingHorizontal: 20 }}>
                    <ClaySurface radius={24} contentStyle={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
                        <View style={styles.avatarWrap}>
                            {(currentUser as any)?.avatar_url ? (
                                <Image source={{ uri: (currentUser as any).avatar_url }} style={styles.avatar} />
                            ) : (
                                <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.avatar}>
                                    <Text style={[styles.avatarText, { color: C.onAccent }]}>{initial}</Text>
                                </LinearGradient>
                            )}
                            <Pressable onPress={() => router.push('/account-settings')} style={({ pressed }) => [styles.editBadge, { backgroundColor: C.accent, borderColor: C.cHi }, pressed && { transform: [{ scale: 0.9 }] }]}>
                                <Pencil size={14} color={C.onAccent} strokeWidth={2.6} />
                            </Pressable>
                        </View>

                        <Text style={[styles.userName, { color: C.text }]}>{displayName}</Text>
                        <Text style={[styles.userEmail, { color: C.muted }]}>{email}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: C.text }]}>{stats.completedJobs}</Text>
                                <Text style={[styles.statLabel, { color: C.muted }]}>Brigády</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: C.hair }]} />
                            <View style={styles.statItem}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                    <Star size={15} color={C.star} fill={C.star} strokeWidth={0} />
                                    <Text style={[styles.statValue, { color: C.text }]}>{stats.rating.toFixed(1)}</Text>
                                </View>
                                <Text style={[styles.statLabel, { color: C.muted }]}>Hodnotenie</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: C.hair }]} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: C.text }]}>€{stats.earned}</Text>
                                <Text style={[styles.statLabel, { color: C.muted }]}>Zarobené</Text>
                            </View>
                        </View>

                        {/* Role switch pill */}
                        <Pressable
                            onPress={() => {
                                const next = currentRole === 'worker' ? 'employer' : 'worker';
                                setCurrentRole(next);
                            }}
                            style={({ pressed }) => [{
                                marginTop: 18,
                                flexDirection: 'row' as const,
                                alignItems: 'center' as const,
                                gap: 8,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                borderRadius: 20,
                                backgroundColor: C.accentDim,
                            }, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                        >
                            {currentRole === 'worker'
                                ? <Search size={15} color={C.accent} strokeWidth={2.2} />
                                : <Briefcase size={15} color={C.accent} strokeWidth={2.2} />}
                            <Text style={{ fontSize: 13.5, fontWeight: '800', color: C.accent }}>
                                {currentRole === 'worker' ? 'Brigádnik' : 'Zadávateľ'}
                            </Text>
                            <ArrowLeftRight size={13} color={C.muted} strokeWidth={2.2} />
                            <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted }}>
                                {currentRole === 'worker' ? 'prepnúť na Zadávateľa' : 'prepnúť na Brigádnika'}
                            </Text>
                        </Pressable>
                    </ClaySurface>
                </View>

                {/* ÚČET */}
                <Section label="ÚČET" C={C}>
                    <MenuItem C={C} icon={<CreditCard size={18} color={C.accent} strokeWidth={2} />} label="Peňaženka" subtitle="Dostupné prostriedky" onPress={() => router.push('/wallet')} first />
                    <Divider C={C} />
                    <MenuItem C={C} icon={<User size={18} color={C.accent} strokeWidth={2} />} label="Upraviť profil" onPress={() => router.push('/account-settings')} />
                    <Divider C={C} />
                    <MenuItem C={C} icon={<UserCheck size={18} color={C.green} strokeWidth={2} />} tintBg={C.greenDim} label="Moje prihlášky" subtitle={currentRole === 'employer' ? 'Moje brigády' : 'Aktívne prihlášky'} onPress={() => router.push(currentRole === 'employer' ? '/my-jobs' : '/my-applications')} last />
                </Section>

                {/* NASTAVENIA */}
                <Section label="NASTAVENIA" C={C}>
                    <MenuItem C={C} icon={<Bell size={18} color={C.star} strokeWidth={2} />} tintBg="rgba(255,179,0,0.15)" label="Notifikácie" onPress={() => router.push('/notifications')} first />
                    <Divider C={C} />
                    <MenuItem C={C} icon={<Lock size={18} color={C.accent} strokeWidth={2} />} label="Súkromie a bezpečnosť" onPress={() => router.push('/privacy')} />
                    <Divider C={C} />
                    <MenuItem C={C} icon={<HelpCircle size={18} color={C.accent} strokeWidth={2} />} label="Pomoc a podpora" onPress={() => { }} last />
                </Section>

                {/* LOGOUT */}
                <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
                    <ClaySurface radius={18}>
                        <MenuItem C={C} icon={<LogOut size={18} color={C.red} strokeWidth={2} />} tintBg="rgba(255,69,58,0.13)" label="Odhlásiť sa" onPress={handleLogout} danger first last />
                    </ClaySurface>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function Section({ label, C, children }: { label: string; C: ClayColors; children: React.ReactNode }) {
    return (
        <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
            <Text style={[styles.sectionLabel, { color: C.muted }]}>{label}</Text>
            <ClaySurface radius={18}>{children}</ClaySurface>
        </View>
    );
}

function Divider({ C }: { C: ClayColors }) {
    return <View style={{ height: 1, backgroundColor: C.hair, marginLeft: 70 }} />;
}

function MenuItem({ C, icon, tintBg, label, subtitle, onPress, danger, first, last }: {
    C: ClayColors; icon: React.ReactNode; tintBg?: string; label: string;
    subtitle?: string; onPress?: () => void; danger?: boolean; first?: boolean; last?: boolean;
}) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [{
            paddingHorizontal: 14, paddingVertical: 14,
            borderTopLeftRadius: first ? 18 : 0, borderTopRightRadius: first ? 18 : 0,
            borderBottomLeftRadius: last ? 18 : 0, borderBottomRightRadius: last ? 18 : 0,
        }, pressed && { opacity: 0.7 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ClayIconBox size={42} radius={13} tintBg={tintBg ?? C.accentDim} style={{ marginRight: 14 }}>{icon}</ClayIconBox>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: danger ? C.red : C.text, letterSpacing: -0.2 }}>{label}</Text>
                    {subtitle ? <Text style={{ fontSize: 13, color: C.muted, marginTop: 2, fontWeight: '500' }}>{subtitle}</Text> : null}
                </View>
                {!danger && <ChevronRight size={18} color={C.muted} strokeWidth={2} />}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
    headerTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    avatarWrap: { position: 'relative', marginBottom: 14 },
    avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarText: { fontSize: 32, fontWeight: '800' },
    editBadge: { position: 'absolute', bottom: -2, right: -2, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 }, android: { elevation: 6 } }) },
    userName: { fontSize: 23, fontWeight: '800', marginBottom: 4, letterSpacing: -0.4 },
    userEmail: { fontSize: 14, marginBottom: 20, fontWeight: '500' },
    statsRow: { flexDirection: 'row', width: '100%', paddingTop: 6 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', marginBottom: 5, letterSpacing: -0.5 },
    statLabel: { fontSize: 12.5, fontWeight: '600' },
    statDivider: { width: 1, marginVertical: 2 },
    sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 12, marginLeft: 4 },
});
