import React, { useRef } from 'react';
import { View, Pressable, Text, Animated, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Briefcase, Plus, MessageSquare, User, Search, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassView, isLiquidGlassAvailable } from '@/lib/glassEffect';
import { useText } from '@/lib/useText';
import { useClay } from '@/lib/useClay';
import useAppStore from '@/lib/state/app-store';
import type { ClayColors } from '@/lib/useClay';

const TAB_BAR_H = 66;
const CAPSULE_RADIUS = 26;
const CAPSULE_INSET = 16;

type TabItem = {
    name: string;
    icon: any;
    label: string;
    isCenter?: boolean;
};

// ─── TAB BUTTON ──────────────────────────────────────
function TabButton({ item, focused, onPress, C }: {
    item: TabItem; focused: boolean; onPress: () => void; C: ClayColors;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const Icon = item.icon;

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true, speed: 80, bounciness: 0 }),
            Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, speed: 28, bounciness: 10 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 35, bounciness: 6 }),
        ]).start();
        onPress();
    };

    if (item.isCenter) {
        return (
            <Pressable onPress={handlePress} style={styles.tabSlot}>
                <Animated.View style={[styles.centerWrap, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={[C.accent2, C.accent]}
                        start={{ x: 0.3, y: 0 }}
                        end={{ x: 0.7, y: 1 }}
                        style={[styles.centerBtn, Platform.select({
                            ios: {
                                shadowColor: C.accentShadow.color,
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: C.accentShadow.opacity,
                                shadowRadius: 14,
                            },
                            android: { elevation: 8 },
                        })]}
                    >
                        <LinearGradient
                            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.05)', 'transparent']}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 0.6 }}
                            style={styles.centerSpecular}
                        />
                        <Icon size={24} color={C.onAccent} strokeWidth={2.6} />
                    </LinearGradient>
                </Animated.View>
            </Pressable>
        );
    }

    return (
        <Pressable onPress={handlePress} style={styles.tabSlot}>
            <Animated.View style={[styles.tabContent, { transform: [{ scale: scaleAnim }] }]}>
                {focused && <View style={[styles.activeBlob, { backgroundColor: C.accentDim }]} />}
                <Icon
                    size={22}
                    color={focused ? C.accent : C.muted}
                    strokeWidth={focused ? 2.2 : 1.8}
                />
                {focused && (
                    <Text numberOfLines={1} style={[styles.tabLabel, { color: C.accent }]}>{item.label}</Text>
                )}
            </Animated.View>
        </Pressable>
    );
}

// ─── TAB BAR CONTAINER ───────────────────────────────
const glassAvailable = Platform.OS === 'ios' && isLiquidGlassAvailable();

function TabBarContainer({ C, children }: { C: ClayColors; children: React.ReactNode }) {
    return (
        <View style={styles.barWrapper} pointerEvents="box-none">
            <LinearGradient colors={['transparent', C.bg]} style={styles.fadeOverlay} pointerEvents="none" />
            <View style={[styles.capsuleOuter, Platform.select({
                ios: {
                    shadowColor: C.darkShadow.color,
                    shadowOffset: { width: 0, height: glassAvailable ? 12 : 8 },
                    shadowOpacity: glassAvailable ? 0.22 : (C.isLight ? 0.18 : 0.4),
                    shadowRadius: glassAvailable ? 20 : 14,
                },
                android: { elevation: 14 },
            })]}>
                {glassAvailable ? (
                    <GlassView
                        glassEffectStyle="regular"
                        colorScheme="auto"
                        isInteractive
                        style={[styles.capsuleFace, styles.glassFace]}
                    >
                        {children}
                    </GlassView>
                ) : (
                    <>
                        <View style={[StyleSheet.absoluteFill, { borderRadius: CAPSULE_RADIUS, backgroundColor: C.cLo }]} />
                        <LinearGradient
                            colors={[C.cHi, C.cLo]}
                            start={{ x: 0.1, y: 0 }}
                            end={{ x: 0.9, y: 1 }}
                            style={[styles.capsuleFace, { borderColor: C.hair }]}
                        >
                            {children}
                        </LinearGradient>
                    </>
                )}
            </View>
        </View>
    );
}

// ─── FLOATING TAB BAR ───────────────────────────────
function FloatingTabBar({ state, navigation, C, tabs }: { state: any; navigation: any; C: ClayColors; tabs: TabItem[] }) {
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
    const C = useClay();
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
        borderRadius: CAPSULE_RADIUS, borderWidth: 1, paddingHorizontal: 6,
    },
    glassFace: { borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
    tabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', height: TAB_BAR_H },
    tabContent: { alignItems: 'center', justifyContent: 'center', position: 'relative', paddingVertical: 6, paddingHorizontal: 8 },
    activeBlob: { ...StyleSheet.absoluteFill, borderRadius: 14 },
    tabLabel: { fontSize: 10, fontWeight: '800', marginTop: 2, letterSpacing: 0.1 },
    centerWrap: { marginTop: -22 },
    centerBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    centerSpecular: { position: 'absolute', top: 0, left: 4, right: 4, height: 26, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
});
