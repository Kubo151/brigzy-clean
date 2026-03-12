import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#6366f1',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="login"
                options={{
                    title: 'Prihlásenie',
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="home"
                options={{
                    title: 'Brigzy',
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="(tabs)"
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="settings"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="notifications"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="privacy"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="language"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="role-switch"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="account-settings"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="activity"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}
