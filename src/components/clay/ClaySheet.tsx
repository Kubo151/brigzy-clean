import React, { useEffect, useRef } from 'react';
import {
    Modal, View, Animated, Pressable, Text, StyleSheet,
    Platform, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { useClay } from '@/lib/useClay';

type Props = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    /** Sheet height as a fraction of screen height (default 0.55) */
    heightFraction?: number;
    scrollable?: boolean;
};

export function ClaySheet({ visible, onClose, title, children, heightFraction = 0.55, scrollable = false }: Props) {
    const C = useClay();
    const translateY = useRef(new Animated.Value(600)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 4 }),
                Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, { toValue: 600, duration: 220, useNativeDriver: true }),
                Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const Content = scrollable ? ScrollView : View;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>
                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: C.cHi,
                            borderTopColor: C.hair,
                            transform: [{ translateY }],
                            ...Platform.select({
                                ios: {
                                    shadowColor: C.darkShadow.color,
                                    shadowOffset: { width: 0, height: -6 },
                                    shadowOpacity: C.darkShadow.opacity,
                                    shadowRadius: 18,
                                },
                                android: { elevation: 18 },
                            }),
                        },
                    ]}
                >
                    {/* drag handle */}
                    <View style={styles.handleWrap} pointerEvents="none">
                        <View style={[styles.handle, { backgroundColor: C.muted }]} />
                    </View>

                    {title && (
                        <Text style={[styles.title, { color: C.text }]}>{title}</Text>
                    )}

                    <Content style={scrollable ? styles.scrollContent : undefined}>
                        {children}
                    </Content>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        paddingBottom: 34,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    handleWrap: { alignItems: 'center', paddingVertical: 10 },
    handle: { width: 38, height: 4, borderRadius: 2, opacity: 0.35 },
    title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 18, marginTop: 4 },
    scrollContent: { flexGrow: 1 },
});
