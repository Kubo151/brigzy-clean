import React, { useRef } from 'react';
import { Pressable, Text, Animated, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useClay } from '@/lib/useClay';

// ─────────────────────────────────────────────────────────────
// ClayPill — category / filter chip. `active` swaps to the
// accent gradient. Icon optional (slot before label).
// ─────────────────────────────────────────────────────────────

type Props = {
    label: string;
    active?: boolean;
    onPress?: () => void;
    icon?: React.ReactNode;
};

export function ClayPill({ label, active, onPress, icon }: Props) {
    const C = useClay();
    const scale = useRef(new Animated.Value(1)).current;

    const handle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.sequence([
            Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 60 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 35, bounciness: 8 }),
        ]).start();
        onPress?.();
    };

    return (
        <Pressable onPress={handle}>
            <Animated.View
                style={[
                    styles.pill,
                    active
                        ? {
                              ...Platform.select({
                                  ios: {
                                      shadowColor: C.accentShadow.color,
                                      shadowOffset: { width: 3, height: 4 },
                                      shadowOpacity: C.accentShadow.opacity,
                                      shadowRadius: 10,
                                  },
                                  android: { elevation: 4 },
                              }),
                          }
                        : {
                              backgroundColor: C.cLo,
                              borderWidth: 1,
                              borderColor: C.hair,
                              ...Platform.select({
                                  ios: {
                                      shadowColor: C.darkShadow.color,
                                      shadowOffset: { width: 3, height: 3 },
                                      shadowOpacity: C.darkShadow.opacity * 0.8,
                                      shadowRadius: 7,
                                  },
                                  android: { elevation: 2 },
                              }),
                          },
                    { transform: [{ scale }] },
                ]}
            >
                {active && (
                    <LinearGradient
                        colors={[C.accent2, C.accent]}
                        start={{ x: 0.2, y: 0 }}
                        end={{ x: 0.8, y: 1 }}
                        style={[StyleSheet.absoluteFillObject, { borderRadius: 13 }]}
                    />
                )}
                {icon}
                <Text
                    style={{
                        color: active ? C.onAccent : C.text,
                        fontSize: 12.5,
                        fontWeight: '700',
                        letterSpacing: 0.1,
                    }}
                >
                    {label}
                </Text>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 13,
        overflow: 'hidden',
    },
});
