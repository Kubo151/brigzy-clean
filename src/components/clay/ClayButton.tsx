import React, { useRef } from 'react';
import { Pressable, Text, Animated, Platform, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useClay } from '@/lib/useClay';

// ─────────────────────────────────────────────────────────────
// ClayButton — primary (accent gradient + specular sheen) or
// ghost (clay surface). Springs + haptic on press.
// ─────────────────────────────────────────────────────────────

type Props = {
    label: string;
    onPress?: () => void;
    variant?: 'primary' | 'ghost';
    icon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    flex?: number;
};

export function ClayButton({ label, onPress, variant = 'primary', icon, style, flex }: Props) {
    const C = useClay();
    const scale = useRef(new Animated.Value(1)).current;

    const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
    const handle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
    };

    const isPrimary = variant === 'primary';

    return (
        <Pressable onPress={handle} onPressIn={onIn} onPressOut={onOut} style={flex ? { flex } : undefined}>
            <Animated.View
                style={[
                    styles.base,
                    isPrimary
                        ? {
                              ...Platform.select({
                                  ios: {
                                      shadowColor: C.accentShadow.color,
                                      shadowOffset: C.accentShadow.offset,
                                      shadowOpacity: C.accentShadow.opacity,
                                      shadowRadius: C.accentShadow.radius,
                                  },
                                  android: { elevation: 6 },
                              }),
                          }
                        : {
                              backgroundColor: C.cLo,
                              borderWidth: 1,
                              borderColor: C.hair,
                              ...Platform.select({
                                  ios: {
                                      shadowColor: C.darkShadow.color,
                                      shadowOffset: { width: 4, height: 5 },
                                      shadowOpacity: C.darkShadow.opacity,
                                      shadowRadius: 9,
                                  },
                                  android: { elevation: 3 },
                              }),
                          },
                    { transform: [{ scale }] },
                    style,
                ]}
            >
                {isPrimary && (
                    <>
                        <LinearGradient
                            colors={[C.accent2, C.accent]}
                            start={{ x: 0.2, y: 0 }}
                            end={{ x: 0.8, y: 1 }}
                            style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
                        />
                        {/* specular top sheen */}
                        <LinearGradient
                            colors={['rgba(255,255,255,0.28)', 'transparent']}
                            style={styles.sheen}
                        />
                    </>
                )}
                {icon}
                <Text
                    style={{
                        color: isPrimary ? C.onAccent : C.text,
                        fontSize: 15,
                        fontWeight: '800',
                        letterSpacing: -0.2,
                    }}
                >
                    {label}
                </Text>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        paddingHorizontal: 18,
        borderRadius: 18,
        overflow: 'hidden',
    },
    sheen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
    },
});
