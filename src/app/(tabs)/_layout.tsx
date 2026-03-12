import React, { useRef } from 'react';
import { View, Pressable, Text, Animated, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Home, Heart, Plus, MessageSquare, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useText } from '@/lib/useText';
import { useColors } from '@/lib/useColors';
import type { AppColors } from '@/lib/useColors';

const TAB_BAR_H = 64;
const CAPSULE_RADIUS = 24;
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
    item: typeof TAB_ITEMS[0]; focused: boolean; onPress: () => void; C: AppColors; label: string;
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

    // ── Center Plus button ──
    if (isCenter) {
        return (
            <Pressable onPress={handlePress} style={styles.tabSlot}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <LinearGradient
                        colors={['#9333EA', '#7C3AED', '#6D28D9']}
                        start={{ x: 0.3, y: 0 }}
                        end={{ x: 0.7, y: 1 }}
                        style={styles.centerBtn}
                    >
                        <LinearGradient
                            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.05)', 'transparent']}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 0.6 }}
                            style={styles.centerSpecular}
                        />
                        <Plus size={21} color="#FFF" strokeWidth={2.5} />
                    </LinearGradient>
                </Animated.View>
            </Pressable>
        );
    }

    // ── Regular tab ──
    const isIOS = Platform.OS === 'ios';

    return (
        <Pressable onPress={handlePress} style={styles.tabSlot}>
            <Animated.View style={[styles.tabContent, { transform: [{ scale: scaleAnim }] }]}>
                {focused && (
                    isIOS ? (
                        <View style={[styles.activeBlob, { backgroundColor: C.purpleDim }]} />
                    ) : (
                        <View style={[styles.activePill, { backgroundColor: C.purpleDim }]} />
                    )
                )}
                <Icon
                    size={isIOS ? 21 : 22}
                    color={focused ? C.purple : C.tertiaryLabel}
                    strokeWidth={focused ? 2 : 1.5}
                    fill={item.name === 'favorites' && focused ? C.purple : 'transparent'}
                />
                {(isIOS ? focused : true) && (
                    <Text
                        numberOfLines={1}
                        style={[
                            styles.tabLabel,
                            { color: focused ? C.purple : C.tertiaryLabel },
                            !isIOS && styles.tabLabelAndroid,
                        ]}
                    >{label}</Text>
                )}
            </Animated.View>
        </Pressable>
    );
}

// ─── TAB BAR CONTAINERS ─────────────────────────────
function TabBarContainer({ C, children }: { C: AppColors; children: React.ReactNode }) {
    const isLight = C.bg === '#F2F2F7';
    if (Platform.OS === 'ios') {
        return (
            <View style={styles.barWrapper} pointerEvents="box-none">
                <View style={styles.iosCapsuleShadow}>
                    <BlurView intensity={100} tint={isLight ? 'light' : 'dark'} style={styles.iosCapsuleBlur}>
                        <View style={[styles.iosCapsule, { backgroundColor: C.glassMaterial, borderColor: C.glassBorder }]}>
                            <LinearGradient colors={['transparent', C.glassSpecular, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.iosSpecular} />
                            <LinearGradient colors={['rgba(255,255,255,0.05)', 'transparent', 'rgba(0,0,0,0.03)']} style={[StyleSheet.absoluteFill, { borderRadius: CAPSULE_RADIUS }]} />
                            {children}
                        </View>
                    </BlurView>
                </View>
            </View>
        );
    }
    return (
        <View style={styles.barWrapper} pointerEvents="box-none">
            <LinearGradient colors={['transparent', C.bg]} style={styles.fadeOverlay} pointerEvents="none" />
            <View style={styles.androidBarShadow}>
                <View style={[styles.androidBar, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <View style={[styles.androidTopLine, { backgroundColor: C.thinSeparator }]} />
                    {children}
                </View>
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
    const C = useColors();
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
    fadeOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 50,
    },
    iosCapsuleShadow: {
        marginHorizontal: CAPSULE_INSET, marginBottom: 30,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20,
    },
    iosCapsuleBlur: { borderRadius: CAPSULE_RADIUS, overflow: 'hidden' },
    iosCapsule: {
        flexDirection: 'row', alignItems: 'center', height: TAB_BAR_H,
        borderRadius: CAPSULE_RADIUS, borderWidth: 0.5, paddingHorizontal: 4,
    },
    iosSpecular: { position: 'absolute', top: 0, left: 30, right: 30, height: 0.5 },
    androidBarShadow: {
        marginHorizontal: CAPSULE_INSET, marginBottom: 16, elevation: 16, borderRadius: CAPSULE_RADIUS,
    },
    androidBar: {
        flexDirection: 'row', alignItems: 'center', height: TAB_BAR_H,
        borderRadius: CAPSULE_RADIUS, borderWidth: 1, paddingHorizontal: 4, overflow: 'hidden',
    },
    androidTopLine: {
        position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    },
    tabSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', height: TAB_BAR_H },
    tabContent: {
        alignItems: 'center', justifyContent: 'center', position: 'relative', paddingVertical: 6, paddingHorizontal: 8,
    },
    activeBlob: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
    activePill: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
    tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 0.2 },
    tabLabelAndroid: { fontSize: 11, fontWeight: '500', marginTop: 3 },
    centerBtn: {
        width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 14 },
            android: { elevation: 8 },
        }),
    },
    centerSpecular: {
        position: 'absolute', top: 0, left: 4, right: 4, height: 22, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    },
});
