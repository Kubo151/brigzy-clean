import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { useClay } from '@/lib/useClay';

export default function Index() {
    const router = useRouter();
    const C = useClay();

    useEffect(() => {
        // Validate user session with the server
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                router.replace('/home');
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
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
