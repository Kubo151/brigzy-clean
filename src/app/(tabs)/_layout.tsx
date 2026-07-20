import React, { useEffect } from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Briefcase, Plus, MessageSquare, User, Search, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolateColor,
    Easing,
} from 'react-native-reanimated';
import { GlassView, isLiquidGlassAvailable } from '@/lib/glassEffect';
import { useText } from '@/lib/useText';
import { useFlint, RADIUS, EASE_OUT } from '@/lib/useFlint';
import useAppStore from '@/lib/state/app-store';
import type { FlintColors } from '@/lib/useFlint';

const TAB_BAR_H = 66;
const CAPSULE_RADIUS = RADIUS.xl;
const CAPSULE_INSET = 16;

type TabItem = {
    name: string;
    icon: any;
    label: string;
    isCenter?: boolean;
};

// ─── TAB BUTTON ──────────────────────────────────────
// Highest-frequency interaction in the app (100+/day) — per
// docs/design/Flint-Motion-Spec.md, that means NO position/scale
// motion, just an instant-feeling color + background transition
// (150ms ease-out). The center FAB is the one exception (occasional,
// gets real press feedback) — see below.
function TabButton({ item, focused, onPress, C }: {
    item: TabItem; focused: boolean; onPress: () => void; C: FlintColors;
}) {
    const Icon = item.icon;
    const f = useSharedValue(focused ? 1 : 0);

    useEffect(() => {
        f.value = withTiming(focused ? 1 : 0, { duration: 150, easing: Easing.bezier(...EASE_OUT) });
    }, [focused]);

    const blobStyle = useAnimatedStyle(() => ({
        opacity: f.value,
    }));
    const iconColorStyle = useAnimatedStyle(() => ({
        color: interpolateColor(f.value, [0, 1], [C.muted, C.accent]),
    }));

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    if (item.isCenter) {
        return (
            <Pressable onPress={handlePress} style={styles.tabSlot}>
                <CenterButton C={C} Icon={Icon} />
            </Pressable>
        );
    }

    return (
        <Pressable onPress={handlePress} style={styles.tabSlot}>
            <View style={styles.tabContent}>
                <Animated.View style={[styles.activeBlob, { backgroundColor: C.accentDim }, blobStyle]} />
                <Icon size={22} color={focused ? C.accent : C.muted} strokeWidth={focused ? 2.2 : 1.8} />
                {focused && (
                    <Animated.Text numberOfLines={1} style={[styles.tabLabel, iconColorStyle]}>
                        {item.label}
                    </Animated.Text>
                )}
            </View>
        </Pressable>
    );
}

// Center FAB — the app's other deliberate "bold accent" moment
// alongside the wallet hero. Flat solid accent fill, single shadow,
// no gradient sheen (that was a clay-era flourish). Occasional
// interaction (not 100+/day like the surrounding tabs), so it does
// get real press feedback: scale(0.94), 140ms ease-out.
function CenterButton({ C, Icon }: { C: FlintColors; Icon: any }) {
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const onPressIn = () => {
        scale.value = withTiming(0.94, { duration: 140, easing: Easing.bezier(...EASE_OUT) });
    };
    const onPressOut = () => {
        scale.value = withTiming(1, { duration: 140, easing: Easing.bezier(...EASE_OUT) });
    };

    return (
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut} hitSlop={8}>
            <Animated.View
                style={[
                    styles.centerBtn,
                    {
                        backgroundColor: C.accent,
                        shadowColor: C.accentShadow.color,
                        shadowOffset: C.accentShadow.offset,
                        shadowOpacity: C.accentShadow.opacity,
                        shadowRadius: C.accentShadow.radius,
                    },
                    Platform.select({ android: { elevation: 8 } }),
                    animStyle,
                ]}
            >
                <Icon size={24} color={C.onAccent} strokeWidth={2.6} />
            </Animated.View>
        </Pressable>
    );
}

// ─── TAB BAR CONTAINER ───────────────────────────────
const glassAvailable = Platform.OS === 'ios' && isLiquidGlassAvailable();

function TabBarContainer({ C, children }: { C: FlintColors; children: React.ReactNode }) {
    return (
        <View style={styles.barWrapper} pointerEvents="box-none">
            <LinearGradient
                colors={[`${C.bg}00`, C.bg]}
                style={styles.fadeOverlay}
                pointerEvents="none"
            />
            <View
                style={[
                    styles.capsuleOuter,
                    glassAvailable
                        ? Platform.select({
                              ios: { shadowColor: C.shadow, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 20 },
                          })
                        : {
                              backgroundColor: C.card,
                              ...Platform.select({
                                  ios: { shadowColor: C.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 14 },
                                  android: { elevation: 14 },
                              }),
                          },
                ]}
            >
                {glassAvailable ? (
                    <GlassView glassEffectStyle="regular" colorScheme="auto" isInteractive style={styles.capsuleFace}>
                        {children}
                    </GlassView>
                ) : (
                    <View style={styles.capsuleFace}>{children}</View>
                )}
            </View>
        </View>
    );
}

// ─── FLOATING TAB BAR ───────────────────────────────
function FloatingTabBar({ state, navigation, C, tabs }: { state: any; navigation: any; C: FlintColors; tabs: TabItem[] }) {
    return (
        <TabBarContainer C={C}>
            {state.routes.map((route: any, index: number) => {
                const focused = state.index === index;
                const item = tabs[index];
                if (!item) return null;
                return (
                    <TabButton
                        key={route.key}
                        item={item}
                        focused={focused}
                        onPress={() => {
                            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                        }}
                        C={C}
                    />
                );
            })}
        </TabBarContainer>
    );
}

// ─── LAYOUT EXPORT ──────────────────────────────────
export default function TabLayout() {
    const text = useText();
    const C = useFlint();
    const currentRole = useAppStore((s) => s.currentRole);
    const isWorker = currentRole === 'worker';

    const workerTabs: TabItem[] = [
        { name: 'index', icon: Home, label: text.home },
        { name: 'favorites', icon: Heart, label: text.savedJobs },
        { name: 'add', icon: Search, label: '', isCenter: true },
        { name: 'messages', icon: MessageSquare, label: text.messages },
        { name: 'account', icon: User, label: text.profile },
    ];

    const posterTabs: TabItem[] = [
        { name: 'index', icon: Home, label: text.home },
        { name: 'favorites', icon: Briefcase, label: text.myJobs },
        { name: 'add', icon: Plus, label: '', isCenter: true },
        { name: 'messages', icon: MessageSquare, label: text.messages },
        { name: 'account', icon: User, label: text.profile },
    ];

    const tabs = isWorker ? workerTabs : posterTabs;

    return (
        <Tabs
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <FloatingTabBar {...props} C={C} tabs={tabs} />}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="favorites" />
            <Tabs.Screen name="add" />
            <Tabs.Screen name="messages" />
            <Tabs.Screen name="account" />
        </Tabs>
    );
}

// ─── STYLES ─────────────────────────────────────────
const styles = StyleSheet.create({
    barWrapper: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 130, justifyContent: 'flex-end', alignItems: 'stretch',
    },
    fadeOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 50 },
    capsuleOuter: { marginHorizontal: CAPSULE_INSET, marginBottom: 28, borderRadius: CAPSULE_RADIUS },
    capsuleFace: {
        flexDirection: 'row', alignItems: 'center', height: TAB_BAR_H,
        borderRadius: CAPSULE_RADIUS, paddingHorizontal: 6, overflow: 'hidden',
    },
    tabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', height: TAB_BAR_H },
    tabContent: { alignItems: 'center', justifyContent: 'center', position: 'relative', paddingVertical: 6, paddingHorizontal: 8 },
    activeBlob: { ...StyleSheet.absoluteFill, borderRadius: RADIUS.md },
    tabLabel: { fontSize: 10, fontWeight: '800', marginTop: 2, letterSpacing: 0.1 },
    centerBtn: { width: 52, height: 52, borderRadius: 26, marginTop: -22, alignItems: 'center', justifyContent: 'center' },
});
