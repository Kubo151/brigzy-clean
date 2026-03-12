import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft, Heart, MessageSquare, Briefcase,
    CheckCircle, XCircle, Star, Settings, Bell,
} from 'lucide-react-native';
import { useColors } from '@/lib/useColors';
import type { AppColors } from '@/lib/useColors';

// ─── MOCK ACTIVITY DATA ─────────────────────────────
const MOCK_ACTIVITY = [
    {
        id: '1', type: 'application_accepted' as const,
        title: 'Prihláška prijatá',
        message: 'Vaša prihláška na pozíciu Čašník bola prijatá firmou jakub.',
        time: 'Pred 2h', read: false,
    },
    {
        id: '2', type: 'new_message' as const,
        title: 'Nová správa',
        message: 'jakub vám poslal správu ohľadom brigády Barista.',
        time: 'Pred 5h', read: false,
    },
    {
        id: '3', type: 'new_job' as const,
        title: 'Nová brigáda vo vašom okolí',
        message: 'Pomocník v sklade — Košice, €9/h',
        time: 'Včera', read: true,
    },
    {
        id: '4', type: 'application_rejected' as const,
        title: 'Prihláška zamietnutá',
        message: 'Bohužiaľ, vaša prihláška na pozíciu Kuriér nebola prijatá.',
        time: 'Pred 2 dňami', read: true,
    },
    {
        id: '5', type: 'review' as const,
        title: 'Nové hodnotenie',
        message: 'jakub vám dal hodnotenie ⭐ 5.0 za brigádu Čašník.',
        time: 'Pred 3 dňami', read: true,
    },
];

const getActivityIcon = (type: string, C: AppColors) => {
    switch (type) {
        case 'application_accepted':
            return { icon: CheckCircle, color: C.green, bg: 'rgba(52,211,153,0.15)' };
        case 'application_rejected':
            return { icon: XCircle, color: C.red, bg: 'rgba(239,68,68,0.12)' };
        case 'new_message':
            return { icon: MessageSquare, color: C.blue, bg: 'rgba(59,130,246,0.15)' };
        case 'new_job':
            return { icon: Briefcase, color: C.purple, bg: C.purpleDim };
        case 'review':
            return { icon: Star, color: C.yellow, bg: 'rgba(251,191,36,0.15)' };
        default:
            return { icon: Heart, color: C.purple, bg: C.purpleDim };
    }
};

// ─── ACTIVITY ITEM ──────────────────────────────────
function ActivityItem({ item, C, onPress }: {
    item: typeof MOCK_ACTIVITY[0]; C: AppColors; onPress: () => void;
}) {
    const { icon: Icon, color, bg } = getActivityIcon(item.type, C);
    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
            style={({ pressed }) => [{
                flexDirection: 'row',
                padding: 16,
                backgroundColor: item.read ? C.cardBg : C.purpleDim,
                borderRadius: 16,
                borderWidth: 0.5,
                borderColor: item.read ? C.cardBorder : 'rgba(124,58,237,0.25)',
                ...Platform.select({
                    ios: {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.06,
                        shadowRadius: 4,
                    },
                    android: { elevation: 1 },
                }),
            }, pressed && { transform: [{ scale: 0.98 }], opacity: 0.8 }]}
        >
            <LinearGradient
                colors={[bg, bg]}
                style={{
                    width: 46, height: 46, borderRadius: 14,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 14,
                }}
            >
                <Icon size={22} color={color} strokeWidth={1.8} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, flex: 1 }} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {!item.read && (
                        <View style={{
                            width: 10, height: 10, borderRadius: 5,
                            backgroundColor: C.purple,
                            marginLeft: 8,
                        }} />
                    )}
                </View>
                <Text style={{
                    fontSize: 14, color: C.secondaryLabel,
                    lineHeight: 20, marginBottom: 6,
                }} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={{ fontSize: 12, color: C.tertiaryLabel, fontWeight: '500' }}>
                    {item.time}
                </Text>
            </View>
        </Pressable>
    );
}

// ─── ACTIVITY SCREEN ────────────────────────────────
export default function ActivityScreen() {
    const router = useRouter();
    const C = useColors();
    const [refreshing, setRefreshing] = useState(false);
    const [activities, setActivities] = useState(MOCK_ACTIVITY);

    const unreadCount = activities.filter(a => !a.read).length;

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    };

    const markAllRead = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActivities(prev => prev.map(a => ({ ...a, read: true })));
    };

    const handleItemPress = (item: typeof MOCK_ACTIVITY[0]) => {
        setActivities(prev => prev.map(a => a.id === item.id ? { ...a, read: true } : a));
        if (item.type === 'new_message') router.push('/messages');
        else if (item.type === 'new_job') router.back();
        else if (item.type === 'application_accepted' || item.type === 'application_rejected') {
            router.push('/my-applications');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            {/* Header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 20, paddingVertical: 12,
            }}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [{
                        width: 42, height: 42, borderRadius: 14,
                        backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 0.5, borderColor: C.cardBorder,
                    }, pressed && { transform: [{ scale: 0.95 }] }]}
                >
                    <ChevronLeft size={22} color={C.text} />
                </Pressable>
                <Text style={{ fontSize: 18, fontWeight: '700', color: C.text }}>Aktivita</Text>
                <Pressable
                    onPress={() => router.push('/notifications')}
                    style={({ pressed }) => [{
                        width: 42, height: 42, borderRadius: 14,
                        backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 0.5, borderColor: C.cardBorder,
                    }, pressed && { transform: [{ scale: 0.95 }] }]}
                >
                    <Settings size={18} color={C.text} />
                </Pressable>
            </View>

            {/* Mark all read banner */}
            {unreadCount > 0 && (
                <Pressable
                    onPress={markAllRead}
                    style={({ pressed }) => [{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginHorizontal: 20,
                        marginTop: 8,
                        marginBottom: 20,
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: C.purpleDim,
                        gap: 8,
                    }, pressed && { opacity: 0.7 }]}
                >
                    <Bell size={15} color={C.purple} strokeWidth={2} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: C.purple }}>
                        {unreadCount} neprečítaných · Označiť všetky
                    </Text>
                </Pressable>
            )}

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} />}
            >
                {activities.length > 0 ? (
                    activities.map((item) => (
                        <ActivityItem
                            key={item.id}
                            item={item}
                            C={C}
                            onPress={() => handleItemPress(item)}
                        />
                    ))
                ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 }}>
                        <View style={{
                            width: 72, height: 72, borderRadius: 36,
                            backgroundColor: C.purpleDim,
                            alignItems: 'center', justifyContent: 'center',
                            marginBottom: 20,
                        }}>
                            <Bell size={32} color={C.purple} strokeWidth={1.5} />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 }}>
                            Žiadna aktivita
                        </Text>
                        <Text style={{ fontSize: 15, color: C.secondaryLabel, textAlign: 'center', lineHeight: 22 }}>
                            Tu sa zobrazia vaše notifikácie, správy a aktualizácie prihlášok.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
