import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { MANROPE_FONTS, patchTextWithManrope } from '../lib/fonts';
import useAppStore from '../lib/state/app-store';

export default function RootLayout() {
    const [session, setSession] = useState<Session | null>(null);
    const [fontsLoaded] = useFonts(MANROPE_FONTS);
    const setCurrentUser = useAppStore((s) => s.setCurrentUser);

    useEffect(() => {
        if (fontsLoaded) patchTextWithManrope();
    }, [fontsLoaded]);

    useEffect(() => {
        const syncUser = async (userId: string | undefined) => {
            if (!userId) { setCurrentUser(null); return; }
            const { data } = await supabase.from('users').select('*').eq('id', userId).single();
            if (data) setCurrentUser(data as any);
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            syncUser(session?.user?.id);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            syncUser(session?.user?.id);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Hold render until Manrope is ready so text doesn't flash in the system font.
    if (!fontsLoaded) return null;

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
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
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
