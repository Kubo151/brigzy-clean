import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useColors } from '@/lib/useColors';
import { Search, Briefcase, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Home() {
    const router = useRouter();
    const C = useColors();
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
            Alert.alert('Chyba', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading || hasRole) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: C.bg }]}>
                <ActivityIndicator size="large" color={C.purple} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            <View style={styles.content}>
                {/* Branded gradient logo */}
                <View style={styles.logoContainer}>
                    <LinearGradient
                        colors={['#9333EA', '#7C3AED', '#6D28D9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.logo}
                    >
                        <Text style={styles.logoText}>B</Text>
                    </LinearGradient>
                </View>

                <Text style={[styles.title, { color: C.text }]}>Brigzy</Text>
                <Text style={[styles.subtitle, { color: C.secondaryLabel }]}>Čo hľadáte?</Text>

                {/* Role selection cards */}
                <View style={styles.cardsContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.card,
                            {
                                backgroundColor: C.surface,
                                borderColor: C.separator,
                                opacity: pressed ? 0.85 : 1,
                                transform: [{ scale: pressed ? 0.98 : 1 }],
                            }
                        ]}
                        onPress={() => selectRole('worker')}
                        disabled={loading}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: C.purpleDim }]}>
                            <Search size={26} color={C.purple} strokeWidth={1.8} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, { color: C.text }]}>Hľadám prácu</Text>
                            <Text style={[styles.cardDescription, { color: C.secondaryLabel }]}>
                                Prezerajte a uchádzajte sa o práce
                            </Text>
                        </View>
                        <ChevronRight size={20} color={C.tertiaryLabel} strokeWidth={1.8} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.card,
                            {
                                backgroundColor: C.surface,
                                borderColor: C.separator,
                                opacity: pressed ? 0.85 : 1,
                                transform: [{ scale: pressed ? 0.98 : 1 }],
                            }
                        ]}
                        onPress={() => selectRole('employer')}
                        disabled={loading}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: C.purpleDim }]}>
                            <Briefcase size={26} color={C.purple} strokeWidth={1.8} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, { color: C.text }]}>Ponúkam prácu</Text>
                            <Text style={[styles.cardDescription, { color: C.secondaryLabel }]}>
                                Nájmajte pracovníkov a spravujte práce
                            </Text>
                        </View>
                        <ChevronRight size={20} color={C.tertiaryLabel} strokeWidth={1.8} />
                    </Pressable>
                </View>

                <Text style={[styles.footerText, { color: C.tertiaryLabel }]}>
                    Svoju rolu môžete kedykoľvek zmeniť v Nastaveniach
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 42,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: 0.37,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 48,
    },
    cardsContainer: {
        width: '100%',
        gap: 12,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    footerText: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 32,
        paddingHorizontal: 32,
    },
});
