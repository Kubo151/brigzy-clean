import { useState } from 'react';
import {
    View, Text, TextInput, Pressable, Alert,
    KeyboardAvoidingView, Platform, ActivityIndicator,
    ScrollView, StyleSheet, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { AsYouType } from 'libphonenumber-js';
import { supabase } from '../lib/supabase';
import useAppStore from '../lib/state/app-store';
import type { User } from '../lib/types';
import { useClay } from '@/lib/useClay';
import type { ClayColors } from '@/lib/useClay';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Mail, Lock, UserCircle, Phone, ChevronDown, AtSign, Eye, EyeOff, Zap } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { ClaySurface, ClayInset } from '@/components/clay';

// ── Reusable input field ──
function InputField({ icon: Icon, placeholder, value, onChangeText, secure, keyboard, editable = true, C, loading }: {
    icon: any; placeholder: string; value: string; onChangeText: (t: string) => void;
    secure?: boolean; keyboard?: string; editable?: boolean; C: ClayColors; loading: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <ClayInset radius={15} contentStyle={styles.inputRow}>
            <Icon size={18} color={C.muted} strokeWidth={1.9} />
            <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder={placeholder}
                placeholderTextColor={C.muted}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secure && !showPassword}
                autoCapitalize={keyboard === 'email-address' ? 'none' : secure ? 'none' : 'sentences'}
                keyboardType={keyboard as any}
                editable={editable && !loading}
            />
            {secure && (
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    {showPassword
                        ? <EyeOff size={18} color={C.muted} strokeWidth={1.9} />
                        : <Eye size={18} color={C.muted} strokeWidth={1.9} />
                    }
                </Pressable>
            )}
        </ClayInset>
    );
}

// ── Brand logo ──
function BrandLogo({ C }: { C: ClayColors }) {
    return (
        <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.logo}>
            <LinearGradient colors={['rgba(255,255,255,0.4)', 'transparent']} style={styles.logoSpecular} />
            <Zap size={30} color={C.onAccent} fill={C.onAccent} strokeWidth={0} />
        </LinearGradient>
    );
}

// ── Submit button ──
function SubmitButton({ label, onPress, loading, C }: {
    label: string; onPress: () => void; loading: boolean; C: ClayColors;
}) {
    return (
        <Pressable onPress={onPress} disabled={loading} style={({ pressed }) => [styles.submitBtn, Platform.select({
            ios: { shadowColor: C.accentShadow.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: C.accentShadow.opacity, shadowRadius: 14 },
            android: { elevation: 6 },
            web: { boxShadow: `3px 6px 16px ${C.accentSd}` } as any,
        }), { opacity: loading ? 0.6 : pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.submitGradient}>
                <LinearGradient colors={['rgba(255,255,255,0.28)', 'transparent']} style={styles.submitSheen} />
                {loading ? <ActivityIndicator color={C.onAccent} /> : <Text style={[styles.submitText, { color: C.onAccent }]}>{label}</Text>}
            </LinearGradient>
        </Pressable>
    );
}

// ── Social login button ──
function SocialButton({ label, iconType, C, onPress }: {
    label: string; iconType: 'apple' | 'google'; C: ClayColors; onPress: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
            <ClaySurface radius={16} contentStyle={styles.socialBtn}>
                {iconType === 'apple' ? (
                    <Svg width={18} height={22} viewBox="0 0 384 512" fill={C.text}>
                        <Path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                    </Svg>
                ) : (
                    <Svg width={20} height={20} viewBox="0 0 48 48">
                        <Path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 33.4 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z" />
                        <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.5 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                        <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.2 0-9.6-2.6-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                        <Path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.2-2.7-.4-3.9z" />
                    </Svg>
                )}
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>{label}</Text>
            </ClaySurface>
        </Pressable>
    );
}

export default function Login() {
    const C = useClay();
    const router = useRouter();
    const setCurrentUser = useAppStore((s) => s.setCurrentUser);
    const setAuthenticated = useAppStore((s) => s.setAuthenticated);
    const setCurrentRole = useAppStore((s) => s.setCurrentRole);
    const setRoleSelectionComplete = useAppStore((s) => s.setRoleSelectionComplete);

    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    // Login fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Register fields
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState<CountryCode>('SK');
    const [callingCode, setCallingCode] = useState('421');
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);

    const handleCountrySelect = (country: Country) => {
        setCountryCode(country.cca2);
        setCallingCode(country.callingCode[0]);
        setCountryPickerVisible(false);
    };

    const formatPhoneNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        try {
            const formatter = new AsYouType(countryCode as unknown as import('libphonenumber-js').CountryCode);
            setPhoneNumber(formatter.input(cleaned));
        } catch { setPhoneNumber(cleaned); }
    };

    const countryTheme = {
        backgroundColor: C.cLo, onBackgroundTextColor: C.text, fontSize: 15,
        filterPlaceholderTextColor: C.muted, activeOpacity: 0.7,
    };

    // ── Forgot password ──
    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Zadajte email', 'Najprv vyplňte emailovú adresu a potom kliknite na "Zabudli ste heslo?"');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'brigzy://reset-password',
            });
            if (error) throw error;
            Alert.alert('Email odoslaný', `Na adresu ${email} sme vám poslali odkaz na obnovenie hesla.`);
        } catch (error: any) {
            Alert.alert('Chyba', error.message);
        } finally { setLoading(false); }
    };

    // ── Login ──
    const handleLogin = async () => {
        if (!email || !password) { Alert.alert('Chyba', 'Vyplňte email a heslo'); return; }
        setLoading(true);
        try {
            const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (authData.user) {
                const { data: userProfile } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
                if (userProfile) {
                    const user: User = {
                        id: userProfile.id, email: userProfile.email, name: userProfile.name,
                        firstName: userProfile.name, lastName: userProfile.surname || '',
                        phoneNumber: userProfile.phone || '', country: userProfile.country,
                        role: userProfile.role, avatar: userProfile.avatar, bio: '',
                        rating: 0, reviewCount: 0, completedJobs: 0, createdAt: userProfile.created_at,
                    };
                    setCurrentUser(user);
                    setAuthenticated(true);
                }
            }
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Chyba', error.message);
        } finally { setLoading(false); }
    };

    // ── Sign Up ──
    const handleSignUp = async () => {
        if (!name || !surname || !displayName || !regEmail || !regPassword || !confirmPassword || !phoneNumber) {
            Alert.alert('Chyba', 'Vyplňte všetky polia'); return;
        }
        if (regPassword !== confirmPassword) {
            Alert.alert('Chyba', 'Heslá sa nezhodujú'); return;
        }
        if (regPassword.length < 6) {
            Alert.alert('Chyba', 'Heslo musí mať aspoň 6 znakov'); return;
        }
        setLoading(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: regEmail, password: regPassword,
                options: {
                    emailRedirectTo: undefined,
                    data: { display_name: displayName, surname, country_code: countryCode, calling_code: callingCode, phone_number: phoneNumber },
                },
            });
            if (authError) throw authError;
            const fullPhone = `+${callingCode}${phoneNumber.replace(/\D/g, '')}`;
            const { error: profileError } = await supabase.from('users').insert({
                id: authData.user?.id, email: regEmail, name, surname,
                display_name: displayName, phone: fullPhone,
                country: countryCode, role: null, created_at: new Date().toISOString(),
            });
            if (profileError) throw profileError;

            if (authData.user) {
                const newUser: User = {
                    id: authData.user.id, email: regEmail, name, firstName: name,
                    lastName: surname, phoneNumber: fullPhone, country: countryCode,
                    role: 'worker' as const, avatar: undefined, bio: '',
                    rating: 0, reviewCount: 0, completedJobs: 0,
                    createdAt: new Date().toISOString(),
                };
                setCurrentUser(newUser);
                setAuthenticated(true);
                setCurrentRole('worker');
                setRoleSelectionComplete(true);
            }
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Chyba', error.message);
        } finally { setLoading(false); }
    };

    // ══════════ SIGN UP ══════════
    if (isSignUp) {
        return (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.flex, { backgroundColor: C.bg }]}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.brandWrap}>
                        <BrandLogo C={C} />
                        <Text style={[styles.brandName, { color: C.text }]}>Brigzy</Text>
                        <Text style={[styles.brandSub, { color: C.muted }]}>Vytvorte si účet</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <InputField icon={UserCircle} placeholder="Meno" value={name} onChangeText={setName} C={C} loading={loading} />
                        <InputField icon={UserCircle} placeholder="Priezvisko" value={surname} onChangeText={setSurname} C={C} loading={loading} />
                        <InputField icon={AtSign} placeholder="Používateľské meno" value={displayName} onChangeText={setDisplayName} C={C} loading={loading} />
                        <InputField icon={Mail} placeholder="Email" value={regEmail} onChangeText={setRegEmail} keyboard="email-address" C={C} loading={loading} />
                        <InputField icon={Lock} placeholder="Heslo" value={regPassword} onChangeText={setRegPassword} secure C={C} loading={loading} />
                        <InputField icon={Lock} placeholder="Potvrď heslo" value={confirmPassword} onChangeText={setConfirmPassword} secure C={C} loading={loading} />

                        <Text style={[styles.phoneLabel, { color: C.text }]}>Telefónne číslo</Text>
                        <ClayInset radius={15} contentStyle={styles.phoneRow}>
                            <Pressable onPress={() => setCountryPickerVisible(true)} style={[styles.countryBtn, { borderRightColor: C.hair }]}>
                                <CountryPicker countryCode={countryCode} withFlag withCallingCode withEmoji onSelect={handleCountrySelect} visible={countryPickerVisible} onClose={() => setCountryPickerVisible(false)} theme={countryTheme} />
                                <Text style={[styles.callingCode, { color: C.text }]}>+{callingCode}</Text>
                                <ChevronDown size={14} color={C.muted} />
                            </Pressable>
                            <TextInput style={[styles.phoneInput, { color: C.text }]} placeholder="XXX XXX XXX" placeholderTextColor={C.muted} value={phoneNumber} onChangeText={formatPhoneNumber} keyboardType="phone-pad" editable={!loading} />
                        </ClayInset>

                        <SubmitButton label="Registrovať" onPress={handleSignUp} loading={loading} C={C} />

                        <Pressable onPress={() => setIsSignUp(false)} disabled={loading}>
                            <Text style={[styles.switchText, { color: C.accent }]}>Už máte účet? Prihláste sa</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // ══════════ LOGIN ══════════
    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.flex, { backgroundColor: C.bg }]}>
            <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
                {/* Brand */}
                <View style={styles.brandWrap}>
                    <BrandLogo C={C} />
                    <Text style={[styles.brandName, { color: C.text }]}>Brigzy</Text>
                    <Text style={[styles.brandSub, { color: C.muted }]}>Nájdi prácu. Zarábaj.</Text>
                </View>

                {/* Form */}
                <View style={styles.formGroup}>
                    <InputField icon={Mail} placeholder="Email" value={email} onChangeText={setEmail} keyboard="email-address" C={C} loading={loading} />
                    <InputField icon={Lock} placeholder="Heslo" value={password} onChangeText={setPassword} secure C={C} loading={loading} />

                    <Pressable onPress={handleForgotPassword} disabled={loading} style={{ alignSelf: 'flex-end', marginTop: -6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: C.accent }}>Zabudli ste heslo?</Text>
                    </Pressable>

                    <SubmitButton label="Prihlásiť sa" onPress={handleLogin} loading={loading} C={C} />

                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                        <Text style={{ fontSize: 14, color: C.muted, fontWeight: '600' }}>Nemáte účet?</Text>
                        <Pressable onPress={() => setIsSignUp(true)} disabled={loading}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: C.accent }}>Registrujte sa</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { backgroundColor: C.hair }]} />
                    <Text style={[styles.dividerText, { color: C.muted }]}>alebo</Text>
                    <View style={[styles.dividerLine, { backgroundColor: C.hair }]} />
                </View>

                {/* Social logins */}
                <View style={styles.socialGroup}>
                    <SocialButton label="Sign in with Apple" iconType="apple" C={C} onPress={() => Alert.alert('Čoskoro', 'Prihlásenie cez Apple bude dostupné čoskoro.')} />
                    <SocialButton label="Sign in with Google" iconType="google" C={C} onPress={() => Alert.alert('Čoskoro', 'Prihlásenie cez Google bude dostupné čoskoro.')} />
                </View>

                {/* Terms */}
                <Text style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 16, lineHeight: 18 }}>
                    Pokračovaním súhlasíte s našimi{' '}
                    <Text style={{ color: C.accent, fontWeight: '700' }} onPress={() => Linking.openURL('https://brigzy.sk/terms')}>Podmienkami</Text> a{' '}
                    <Text style={{ color: C.accent, fontWeight: '700' }} onPress={() => Linking.openURL('https://brigzy.sk/privacy')}>Ochranou súkromia</Text>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40 },
    loginScroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },

    brandWrap: { alignItems: 'center', marginBottom: 36 },
    logo: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
    logoSpecular: { position: 'absolute', top: 0, left: 0, right: 0, height: 34 },
    brandName: { fontSize: 40, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
    brandSub: { fontSize: 16, fontWeight: '600' },

    formGroup: { gap: 14 },
    inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
    input: { flex: 1, fontSize: 16, fontWeight: '500' },

    phoneLabel: { fontSize: 13, fontWeight: '700', marginBottom: -6, marginLeft: 4 },
    phoneRow: { flexDirection: 'row', alignItems: 'center' },
    countryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: 1, gap: 6 },
    callingCode: { fontSize: 15, fontWeight: '600' },
    phoneInput: { flex: 1, paddingHorizontal: 14, fontSize: 16, fontWeight: '500' },

    submitBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
    submitGradient: { paddingVertical: 17, alignItems: 'center', borderRadius: 18, overflow: 'hidden' },
    submitSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
    submitText: { fontSize: 16, fontWeight: '800' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 14 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { fontSize: 13, fontWeight: '600' },

    socialGroup: { gap: 12, marginBottom: 8 },
    socialBtn: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 16 },

    switchText: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginTop: 4 },
});
