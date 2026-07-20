import React, { useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform, ScrollView, KeyboardAvoidingView, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useFlint, RADIUS, EASE_DRAWER, EASE_OUT } from '@/lib/useFlint';

// ─────────────────────────────────────────────────────────────
// Sheet — replaces ClaySheet. Borderless (fill differentiation
// only), asymmetric enter/exit (380ms ease-drawer in / 200ms
// ease-out out — see docs/design/Flint-Motion-Spec.md §3), and
// drag-to-dismiss with a velocity threshold (a quick flick
// dismisses even if it didn't cross the distance threshold).
// ─────────────────────────────────────────────────────────────

const SCREEN_H = Dimensions.get('window').height;
const VELOCITY_DISMISS_THRESHOLD = 800; // px/s — reanimated velocity is px/s, not the CSS spec's px/ms(0.11)

type Props = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    heightFraction?: number;
    scrollable?: boolean;
};

export function Sheet({ visible, onClose, title, children, heightFraction = 0.55, scrollable = false }: Props) {
    const C = useFlint();
    const sheetHeight = SCREEN_H * heightFraction;
    const translateY = useSharedValue(sheetHeight);
    const backdropOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            translateY.value = withTiming(0, { duration: 380, easing: Easing.bezier(...EASE_DRAWER) });
            backdropOpacity.value = withTiming(1, { duration: 320, easing: Easing.bezier(...EASE_OUT) });
        } else {
            translateY.value = withTiming(sheetHeight, { duration: 200, easing: Easing.bezier(...EASE_OUT) });
            backdropOpacity.value = withTiming(0, { duration: 180, easing: Easing.bezier(...EASE_OUT) });
        }
    }, [visible, sheetHeight]);

    const closeFromGesture = () => onClose();

    const pan = Gesture.Pan()
        .onChange((e) => {
            const next = e.translationY;
            // Damping past the top boundary — resist, don't hard-stop (see Flint-Motion-Spec §5 performance/feel notes).
            translateY.value = next < 0 ? next * 0.3 : next;
        })
        .onEnd((e) => {
            const shouldDismiss = e.translationY > sheetHeight * 0.3 || e.velocityY > VELOCITY_DISMISS_THRESHOLD;
            if (shouldDismiss) {
                translateY.value = withTiming(sheetHeight, { duration: 200, easing: Easing.bezier(...EASE_OUT) });
                backdropOpacity.value = withTiming(0, { duration: 180, easing: Easing.bezier(...EASE_OUT) });
                runOnJS(closeFromGesture)();
            } else {
                translateY.value = withTiming(0, { duration: 220, easing: Easing.bezier(...EASE_OUT) });
            }
        });

    const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

    const Content = scrollable ? ScrollView : View;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Animated.View style={[styles.backdrop, backdropStyle]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>
                <GestureDetector gesture={pan}>
                    <Animated.View
                        style={[
                            styles.sheet,
                            {
                                backgroundColor: C.card,
                                shadowColor: C.shadow,
                                ...Platform.select({
                                    ios: { shadowOffset: { width: 0, height: -6 }, shadowOpacity: 1, shadowRadius: 24 },
                                    android: { elevation: C.elevation + 8 },
                                }),
                            },
                            sheetStyle,
                        ]}
                    >
                        <View style={styles.handleWrap} pointerEvents="none">
                            <View style={[styles.handle, { backgroundColor: C.card2 }]} />
                        </View>

                        {title && <Text style={[styles.title, { color: C.text }]}>{title}</Text>}

                        <Content style={scrollable ? styles.scrollContent : undefined}>{children}</Content>
                    </Animated.View>
                </GestureDetector>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        paddingBottom: 34,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    handleWrap: { alignItems: 'center', paddingVertical: 10 },
    handle: { width: 36, height: 4, borderRadius: 2 },
    title: { fontSize: 17, fontWeight: '600', marginBottom: 16, marginTop: 4 },
    scrollContent: { flexGrow: 1 },
});
