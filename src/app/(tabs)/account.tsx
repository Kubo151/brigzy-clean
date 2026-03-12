import React, { useEffect, useState, useMemo } from "react";
import {
    View, Text, ScrollView, Pressable, Image, Alert, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    Settings, ChevronRight, CreditCard, User, UserCheck,
    Bell, Lock, HelpCircle, LogOut, Pencil, Star,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useText } from "@/lib/useText";
import useAppStore from "@/lib/state/app-store";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";

// ─── PROFILE SCREEN ─────────────────────────────────
export default function ProfileScreen() {
    const router = useRouter();
    const text = useText();
    const C = useColors();
    const currentUser = useAppStore((s) => s.currentUser);
    const logout = useAppStore((s) => s.logout);
    const currentRole = useAppStore((s) => s.currentRole);

    const [stats, setStats] = useState({
        completedJobs: 0,
        rating: 0,
        reviews: 0,
        earned: 0,
    });

    useEffect(() => { loadUserStats(); }, []);

    const loadUserStats = async () => {
        if (!currentUser?.id) return;
        try {
            const { data } = await supabase
                .from('users')
                .select('rating, reviews_count')
                .eq('id', currentUser.id)
                .single();
            if (data) {
                setStats({
                    completedJobs: 0,
                    rating: data.rating || 0,
                    reviews: data.reviews_count || 0,
                    earned: 0,
                });
            }
        } catch (e) {
            console.error('Error loading stats:', e);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Odhlásiť sa',
            'Naozaj sa chcete odhlásiť?',
            [
                { text: 'Zrušiť', style: 'cancel' },
                {
                    text: 'Odhlásiť',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.auth.signOut();
                        logout();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    const displayName = (currentUser as any)?.display_name || currentUser?.name || 'Používateľ';
    const email = currentUser?.email || '';
    const initial = displayName.charAt(0).toUpperCase();

    const st = useMemo(() => makeStyles(C), [C]);

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* ─── HEADER ────────────────────────── */}
                <View style={st.header}>
                    <Text style={st.headerTitle}>Profil</Text>
                    <Pressable
                        onPress={() => router.push('/settings')}
                        style={({ pressed }) => [st.settingsBtn, pressed && { transform: [{ scale: 0.97 }] }]}
                    >
                        <Settings size={20} color={C.text} />
                    </Pressable>
                </View>

                {/* ─── PROFILE HEADER ────────────────── */}
                <View style={st.profileSection}>
                    <View style={st.avatarWrap}>
                        {(currentUser as any)?.avatar_url ? (
                            <Image source={{ uri: (currentUser as any).avatar_url }} style={st.avatar} />
                        ) : (
                            <LinearGradient
                                colors={['#7c3aed', '#a78bfa']}
                                style={st.avatar}
                            >
                                <Text style={st.avatarText}>{initial}</Text>
                            </LinearGradient>
                        )}
                        <Pressable
                            onPress={() => router.push('/account-settings')}
                            style={({ pressed }) => [st.editBadge, pressed && { transform: [{ scale: 0.9 }] }]}
                        >
                            <Pencil size={14} color="#FFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    <Text style={st.userName}>{displayName}</Text>
                    <Text style={st.userEmail}>{email}</Text>

                    <View style={st.statsRow}>
                        <View style={st.statItem}>
                            <Text style={st.statValue}>{stats.completedJobs}</Text>
                            <Text style={st.statLabel}>Brigády</Text>
                        </View>
                        <View style={st.statDivider} />
                        <View style={st.statItem}>
                            <Text style={st.statValue}>
                                <Star size={14} color={C.yellow} /> {stats.rating.toFixed(1)}
                            </Text>
                            <Text style={st.statLabel}>Hodnotenie</Text>
                        </View>
                        <View style={st.statDivider} />
                        <View style={st.statItem}>
                            <Text style={st.statValue}>€{stats.earned}</Text>
                            <Text style={st.statLabel}>Zarobené</Text>
                        </View>
                    </View>
                </View>

                {/* ─── SECTION: ÚČET ─────────────────── */}
                <View style={st.sectionWrap}>
                    <Text style={st.sectionLabel}>ÚČET</Text>
                    <View style={st.menuGroup}>
                        <MenuItem C={C} st={st} icon={<CreditCard size={18} color={C.purple} />} iconBg={C.purpleDim} label="Peňaženka" subtitle="Dostupné prostriedky" onPress={() => router.push('/wallet')} />
                        <View style={st.menuDivider} />
                        <MenuItem C={C} st={st} icon={<User size={18} color={C.purple} />} iconBg={C.purpleDim} label="Upraviť profil" onPress={() => router.push('/account-settings')} />
                        <View style={st.menuDivider} />
                        <MenuItem C={C} st={st} icon={<UserCheck size={18} color={C.green} />} iconBg="rgba(52,211,153,0.15)" label="Moje prihlášky" subtitle={currentRole === 'employer' ? 'Moje brigády' : 'Aktívne prihlášky'} onPress={() => router.push(currentRole === 'employer' ? '/my-jobs' : '/my-applications')} />
                    </View>
                </View>

                {/* ─── SECTION: NASTAVENIA ───────────── */}
                <View style={st.sectionWrap}>
                    <Text style={st.sectionLabel}>NASTAVENIA</Text>
                    <View style={st.menuGroup}>
                        <MenuItem C={C} st={st} icon={<Bell size={18} color={C.yellow} />} iconBg="rgba(251,191,36,0.15)" label="Notifikácie" onPress={() => router.push('/notifications')} />
                        <View style={st.menuDivider} />
                        <MenuItem C={C} st={st} icon={<Lock size={18} color={C.purple} />} iconBg={C.purpleDim} label="Súkromie a bezpečnosť" onPress={() => router.push('/privacy')} />
                        <View style={st.menuDivider} />
                        <MenuItem C={C} st={st} icon={<HelpCircle size={18} color={C.purpleLight} />} iconBg={C.purpleDim} label="Pomoc a podpora" onPress={() => { }} />
                    </View>
                </View>

                {/* ─── LOGOUT ────────────────────────── */}
                <View style={st.sectionWrap}>
                    <View style={st.menuGroup}>
                        <MenuItem C={C} st={st} icon={<LogOut size={18} color={C.red} />} iconBg="rgba(239,68,68,0.12)" label="Odhlásiť sa" onPress={handleLogout} danger />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* ─── MENU ITEM ─────────────────────────────── */
function MenuItem({ C, st, icon, iconBg, label, subtitle, badge, onPress, danger }: {
    C: AppColors; st: any; icon: React.ReactNode; iconBg: string; label: string;
    subtitle?: string; badge?: string; onPress?: () => void; danger?: boolean;
}) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [{ paddingHorizontal: 18, paddingVertical: 18 }, pressed && { transform: [{ scale: 0.98 }] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[st.menuIcon, { backgroundColor: iconBg }]}>{icon}</View>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[st.menuLabel, danger && { color: C.red }]}>{label}</Text>
                    {subtitle ? <Text style={st.menuSub}>{subtitle}</Text> : null}
                </View>
                {badge ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={st.badge}><Text style={st.badgeText}>{badge}</Text></View>
                        <ChevronRight size={18} color={C.muted} />
                    </View>
                ) : !danger ? (
                    <ChevronRight size={18} color={C.muted} />
                ) : null}
            </View>
        </Pressable>
    );
}

/* ─── STYLES FACTORY ────────────────────────── */
const makeStyles = (C: AppColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    headerTitle: { fontSize: 30, fontWeight: '700', color: C.text },
    settingsBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    profileSection: { alignItems: 'center', paddingTop: 12, paddingBottom: 24, paddingHorizontal: 20 },
    avatarWrap: { position: 'relative', marginBottom: 16 },
    avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarText: { color: '#FFF', fontSize: 32, fontWeight: '700' },
    editBadge: { position: 'absolute', bottom: -2, right: -2, width: 34, height: 34, borderRadius: 17, backgroundColor: C.bg === '#F2F2F7' ? '#1C1C1E' : C.purple, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.bg, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }, android: { elevation: 6 } }) },
    userName: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 4 },
    userEmail: { fontSize: 15, color: C.muted, marginBottom: 24 },
    statsRow: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 16, paddingVertical: 24, paddingHorizontal: 8, borderWidth: 1, borderColor: C.border, width: '100%' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 6 },
    statLabel: { fontSize: 14, color: C.muted, fontWeight: '500' },
    statDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },
    sectionWrap: { paddingHorizontal: 20, marginBottom: 28 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 1, marginBottom: 14, marginLeft: 4 },
    menuGroup: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    menuDivider: { height: 1, backgroundColor: C.border, marginLeft: 72 },
    menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    menuLabel: { fontSize: 17, fontWeight: '600', color: C.text },
    menuSub: { fontSize: 14, color: C.muted, marginTop: 3 },
    badge: { backgroundColor: C.purple, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, minWidth: 24, alignItems: 'center' },
    badgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
});
