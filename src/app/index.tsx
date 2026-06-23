import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import useAppStore from '../lib/state/app-store';
import { useClay } from '@/lib/useClay';

export default function Index() {
    const router = useRouter();
    const C = useClay();
    const hasCompletedRoleSelection = useAppStore((s) => s.hasCompletedRoleSelection);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                if (hasCompletedRoleSelection) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/welcome');
                }
            } else {
                router.replace('/login');
            }
        });
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
