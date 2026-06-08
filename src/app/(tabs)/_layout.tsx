import React, { useRef } from 'react';
import { View, Pressable, Text, Animated, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Heart, Plus, MessageSquare, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useText } from '@/lib/useText';
import { useClay } from '@/lib/useClay';
import type { ClayColors } from '@/lib/useClay';

const TAB_BAR_H = 66;
const CAPSULE_RADIUS = 26;
const CAPSULE_INSET = 16;

// ─── TAB CONFIG ──────────────────────────────────────
const TAB_ITEMS = [
    { name: 'index', icon: Home, labelKey: 'home' as const },
    { name: 'favorites', icon: Heart, labelKey: 'favorites' as const },
    { name: 'add', icon: Plus, labelKey: null },
    { name: 'messages', icon: MessageSquare, labelKey: 'messages' as const },
    { name: 'account', icon: User, labelKey: 'profile' as const },
];

// ─── TAB BUTTON ──────────────────────────────────────
function TabButton({ item, focused, onPress, C, label }: {
    item: typeof TAB_ITEMS[0]; focused: boolean; onPress: () => void; C: ClayColors; label: string;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isCenter = item.name === 'add';
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

    // ── Center Plus button (raised accent) ──
    if (isCenter) {
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
                        <Plus size={24} color={C.onAccent} strokeWidth={2.6} />
                    </LinearGradient>
                </Animated.View>
            </Pressable>
        );
    }

    // ── Regular tab ──
    return (
        <Pressable onPress={handlePress} style={styles.tabSlot}>
            <Animated.View style={[styles.tabContent, { transform: [{ scale: scaleAnim }] }]}>
                {focused && <View style={[styles.activeBlob, { backgroundColor: C.accentDim }]} />}
                <Icon
                    size={22}
                    color={focused ? C.accent : C.muted}
                    strokeWidth={focused ? 2.2 : 1.8}
                    fill={item.name === 'favorites' && focused ? C.accent : 'transparent'}
                />
                {focused && (
                    <Text numberOfLines={1} style={[styles.tabLabel, { color: C.accent }]}>{label}</Text>
                )}
            </Animated.View>
        </Pressable>
    );
}

// ─── TAB BAR CONTAINER — glass on iOS 26+, clay elsewhere ───
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
                        {/* clay shadow backing */}
                        <View style={[StyleSheet.absoluteFill, {
                            borderRadius: CAPSULE_RADIUS,
                            backgroundColor: C.cLo,
                        }]} />
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
function FloatingTabBar({ state, navigation, C, text }: any) {
    return (
        <TabBarContainer C={C}>
            {state.routes.map((route: any, index: number) => {
                const focused = state.index === index;
                const item = TAB_ITEMS[index];
                if (!item) return null;
                const label = item.labelKey ? (text as any)[item.labelKey] || item.name : '';
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
                        label={label}
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
    return (
        <Tabs
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <FloatingTabBar {...props} C={C} text={text} />}
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
    glassFace: {
        borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden',
    },
    tabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', height: TAB_BAR_H },
    tabContent: { alignItems: 'center', justifyContent: 'center', position: 'relative', paddingVertical: 6, paddingHorizontal: 8 },
    activeBlob: { ...StyleSheet.absoluteFill, borderRadius: 14 },
    tabLabel: { fontSize: 10, fontWeight: '800', marginTop: 2, letterSpacing: 0.1 },
    centerWrap: { marginTop: -22 },
    centerBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    centerSpecular: { position: 'absolute', top: 0, left: 4, right: 4, height: 26, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
});
