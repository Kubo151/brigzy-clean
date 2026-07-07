import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useClay } from '@/lib/useClay';
import { Search, Briefcase, ChevronRight, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClaySurface, ClayIconBox } from '@/components/clay';
import { showAlert } from '@/lib/notify';

export default function Home() {
    const router = useRouter();
    const C = useClay();
    const [loading, setLoading] = useState(true);
    const [hasRole, setHasRole] = useState(false);

    useEffect(() => {
        checkUserRole();
    }, []);

    const checkUserRole = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role) {
                setHasRole(true);
                router.replace('/(tabs)');
            } else {
                setHasRole(false);
            }
        } catch (error) {
            console.error('Error checking role:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectRole = async (role: 'worker' | 'employer') => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('users')
                .update({ role })
                .eq('id', user.id);

            if (error) throw error;

            router.replace('/(tabs)');
        } catch (error: any) {
            showAlert('Chyba', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading || hasRole) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.accent} />
            </View>
        );
    }

    const RoleCard = ({ role, icon, title, desc }: {
        role: 'worker' | 'employer'; icon: React.ReactNode; title: string; desc: string;
    }) => (
        <Pressable onPress={() => selectRole(role)} disabled={loading} style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
            <ClaySurface radius={20} contentStyle={styles.card}>
                <ClayIconBox size={52} radius={16}>{icon}</ClayIconBox>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: C.text }]}>{title}</Text>
                    <Text style={[styles.cardDescription, { color: C.muted }]}>{desc}</Text>
                </View>
                <ChevronRight size={20} color={C.accent} strokeWidth={2.2} />
            </ClaySurface>
        </Pressable>
    );

    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            <View style={styles.content}>
                {/* Branded gradient logo */}
                <LinearGradient
                    colors={[C.accent2, C.accent]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={styles.logo}
                >
                    <LinearGradient colors={['rgba(255,255,255,0.4)', 'transparent']} style={styles.logoSpecular} />
                    <Zap size={34} color={C.onAccent} fill={C.onAccent} strokeWidth={0} />
                </LinearGradient>

                <Text style={[styles.title, { color: C.text }]}>Brigzy</Text>
                <Text style={[styles.subtitle, { color: C.muted }]}>Čo hľadáte?</Text>

                {/* Role selection cards */}
                <View style={styles.cardsContainer}>
                    <RoleCard role="worker" icon={<Search size={26} color={C.accent} strokeWidth={1.9} />} title="Hľadám prácu" desc="Prezerajte a uchádzajte sa o práce" />
                    <RoleCard role="employer" icon={<Briefcase size={26} color={C.accent} strokeWidth={1.9} />} title="Ponúkam prácu" desc="Nájmajte pracovníkov a spravujte práce" />
                </View>

                <Text style={[styles.footerText, { color: C.muted }]}>
                    Svoju rolu môžete kedykoľvek zmeniť v Nastaveniach
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    logo: { width: 80, height: 80, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden' },
    logoSpecular: { position: 'absolute', top: 0, left: 0, right: 0, height: 40 },
    title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8 },
    subtitle: { fontSize: 16, marginBottom: 44, fontWeight: '600' },
    cardsContainer: { width: '100%', gap: 12 },
    card: { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
    cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
    cardDescription: { fontSize: 13.5, lineHeight: 19, fontWeight: '500' },
    footerText: { fontSize: 13, textAlign: 'center', marginTop: 32, paddingHorizontal: 32, fontWeight: '500' },
});
