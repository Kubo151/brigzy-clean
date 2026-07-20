import React, { useState } from 'react';
import {
    View, Text, ScrollView, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft, Heart, MessageSquare, Briefcase,
    CheckCircle, XCircle, Star, Settings, Bell,
} from 'lucide-react-native';
import { useFlint, RADIUS } from '@/lib/useFlint';
import type { FlintColors } from '@/lib/useFlint';
import { goBack } from '@/lib/nav';

// ─── MOCK ACTIVITY DATA ─────────────────────────────
const MOCK_ACTIVITY = [
    { id: '1', type: 'application_accepted' as const, title: 'Prihláška prijatá', message: 'Vaša prihláška na pozíciu Čašník bola prijatá firmou jakub.', time: 'Pred 2h', read: false },
    { id: '2', type: 'new_message' as const, title: 'Nová správa', message: 'jakub vám poslal správu ohľadom brigády Barista.', time: 'Pred 5h', read: false },
    { id: '3', type: 'new_job' as const, title: 'Nová brigáda vo vašom okolí', message: 'Pomocník v sklade — Košice, €9/h', time: 'Včera', read: true },
    { id: '4', type: 'application_rejected' as const, title: 'Prihláška zamietnutá', message: 'Bohužiaľ, vaša prihláška na pozíciu Kuriér nebola prijatá.', time: 'Pred 2 dňami', read: true },
    { id: '5', type: 'review' as const, title: 'Nové hodnotenie', message: 'jakub vám dal hodnotenie ⭐ 5.0 za brigádu Čašník.', time: 'Pred 3 dňami', read: true },
];

const getActivityIcon = (type: string, C: FlintColors) => {
    switch (type) {
        case 'application_accepted': return { icon: CheckCircle, color: C.green, bg: C.greenDim };
        case 'application_rejected': return { icon: XCircle, color: C.red, bg: C.redDim };
        case 'new_message': return { icon: MessageSquare, color: C.verified, bg: C.card2 };
        case 'new_job': return { icon: Briefcase, color: C.accent, bg: C.accentDim };
        case 'review': return { icon: Star, color: C.star, bg: C.card2 };
        default: return { icon: Heart, color: C.accent, bg: C.accentDim };
    }
};

// ─── ACTIVITY ITEM ──────────────────────────────────
function ActivityItem({ item, C, onPress }: {
    item: typeof MOCK_ACTIVITY[0]; C: FlintColors; onPress: () => void;
}) {
    const { icon: Icon, color, bg } = getActivityIcon(item.type, C);
    return (
        <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }], opacity: 0.85 }]}
        >
            <View style={{ flexDirection: 'row', padding: 14, backgroundColor: item.read ? C.card : C.accentDim, borderRadius: RADIUS.lg }}>
                <View style={{ width: 46, height: 46, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, marginRight: 14 }}>
                    <Icon size={22} color={color} strokeWidth={1.9} />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, flex: 1, letterSpacing: -0.2 }} numberOfLines={1}>{item.title}</Text>
                        {!item.read && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: C.accent, marginLeft: 8 }} />}
                    </View>
                    <Text style={{ fontSize: 13.5, color: C.muted, lineHeight: 19, marginBottom: 6, fontWeight: '500' }} numberOfLines={2}>{item.message}</Text>
                    <Text style={{ fontSize: 11.5, color: C.muted, fontWeight: '600' }}>{item.time}</Text>
                </View>
            </View>
        </Pressable>
    );
}

// ─── ACTIVITY SCREEN ────────────────────────────────
export default function ActivityScreen() {
    const router = useRouter();
    const C = useFlint();
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
        else if (item.type === 'new_job') goBack();
        else if (item.type === 'application_accepted' || item.type === 'application_rejected') router.push('/my-applications');
    };

    const IconBtn = ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
        <Pressable onPress={onPress} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
            <View style={{ width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card2 }}>{children}</View>
        </Pressable>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
                <IconBtn onPress={() => goBack()}><ChevronLeft size={22} color={C.text} strokeWidth={2.2} /></IconBtn>
                <Text style={{ fontSize: 17, fontWeight: '600', color: C.text }}>Aktivita</Text>
                <IconBtn onPress={() => router.push('/notifications')}><Settings size={18} color={C.text} strokeWidth={2} /></IconBtn>
            </View>

            {/* Mark all read banner */}
            {unreadCount > 0 && (
                <Pressable onPress={markAllRead} style={({ pressed }) => [{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    marginHorizontal: 20, marginTop: 8, marginBottom: 18, paddingVertical: 12,
                    borderRadius: RADIUS.md, backgroundColor: C.accentDim, gap: 8,
                }, pressed && { opacity: 0.7 }]}>
                    <Bell size={15} color={C.accent} strokeWidth={2.2} />
                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: C.accent }}>{unreadCount} neprečítaných · Označiť všetky</Text>
                </Pressable>
            )}

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10, paddingTop: unreadCount > 0 ? 0 : 8 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
            >
                {activities.length > 0 ? (
                    activities.map((item) => (
                        <ActivityItem key={item.id} item={item} C={C} onPress={() => handleItemPress(item)} />
                    ))
                ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 }}>
                        <View style={{ width: 72, height: 72, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card2 }}>
                            <Bell size={32} color={C.accent} strokeWidth={1.6} />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8, marginTop: 20, letterSpacing: -0.4 }}>Žiadna aktivita</Text>
                        <Text style={{ fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21, fontWeight: '500' }}>Tu sa zobrazia vaše notifikácie, správy a aktualizácie prihlášok.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
