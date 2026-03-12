import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Index() {
    const router = useRouter();

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
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#6366f1" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
