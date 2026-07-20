import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import useAppStore from '../lib/state/app-store';
import { useFlint } from '@/lib/useFlint';

export default function Index() {
    const router = useRouter();
    const C = useFlint();

    useEffect(() => {
        const route = async () => {
            // Wait for Zustand to hydrate from AsyncStorage/localStorage before reading state.
            // Without this, the closure always sees the pre-hydration default (false) on web refresh.
            if (!useAppStore.persist.hasHydrated()) {
                await new Promise<void>(resolve => {
                    const unsub = useAppStore.persist.onFinishHydration(() => { unsub(); resolve(); });
                });
            }
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.replace('/(tabs)');
            } else {
                router.replace('/login');
            }
        };
        route();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            <ActivityIndicator size="large" color={C.accent} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
