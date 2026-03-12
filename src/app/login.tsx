import { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, Pressable, Alert,
    KeyboardAvoidingView, Platform, ActivityIndicator,
    ScrollView, StyleSheet, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { AsYouType } from 'libphonenumber-js';
import useAppStore from '../lib/state/app-store';
import type { User } from '../lib/types';
import { useColors } from '@/lib/useColors';
import type { AppColors } from '@/lib/useColors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
    Mail, Lock, UserCircle, Phone, ChevronDown, AtSign, Eye, EyeOff,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

type LoginMethod = 'email' | 'phone' | 'username';

// ── Reusable input field ──
function InputField({ icon: Icon, placeholder, value, onChangeText, secure, keyboard, editable = true, C, loading }: {
    icon: any; placeholder: string; value: string; onChangeText: (t: string) => void;
    secure?: boolean; keyboard?: string; editable?: boolean; C: AppColors; loading: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <View style={[styles.inputRow, { backgroundColor: C.surface, borderColor: C.separator }]}>
            <Icon size={18} color={C.tertiaryLabel} strokeWidth={1.8} />
            <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder={placeholder}
                placeholderTextColor={C.tertiaryLabel}
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
                        ? <EyeOff size={18} color={C.tertiaryLabel} strokeWidth={1.8} />
                        : <Eye size={18} color={C.tertiaryLabel} strokeWidth={1.8} />
                    }
                </Pressable>
            )}
        </View>
    );
}

// ── Login method tab ──
function MethodTab({ label, active, onPress, C }: {
    label: string; active: boolean; onPress: () => void; C: AppColors;
}) {
    return (
        <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
            style={{
                flex: 1, alignItems: 'center', paddingVertical: 12,
                borderBottomWidth: 2.5,
                borderBottomColor: active ? C.purple : 'transparent',
            }}
        >
            <Text style={{
                fontSize: 14, fontWeight: '600',
                color: active ? C.purple : C.tertiaryLabel,
            }}>{label}</Text>
        </Pressable>
    );
}

// ── Social login button ──
function SocialButton({ label, iconType, C, onPress }: {
    label: string; iconType: 'apple' | 'google'; C: AppColors; onPress: () => void;
}) {
    const isDark = C.text === '#FFFFFF';
    const btnBg = isDark ? '#1C1C2E' : '#F2F2F7';
    const btnBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
    const txtColor = isDark ? '#FFFFFF' : '#000000';

    return (
        <Pressable
            onPress={onPress}
            style={{
                height: 54,
                borderRadius: 14,
                borderWidth: 1,
                backgroundColor: btnBg,
                borderColor: btnBorder,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
            }}>
                {iconType === 'apple' ? (
                    <Svg width={18} height={22} viewBox="0 0 384 512" fill={txtColor}>
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
                <Text style={{ fontSize: 16, fontWeight: '600', color: txtColor }}>{label}</Text>
            </View>
        </Pressable>
    );
}

export default function Login() {
    const C = useColors();
    const router = useRouter();
    const setCurrentUser = useAppStore((s) => s.setCurrentUser);
    const setAuthenticated = useAppStore((s) => s.setAuthenticated);

    // State
    const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState<CountryCode>('SK');
    const [callingCode, setCallingCode] = useState('421');
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);

    // Registration fields
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [displayName, setDisplayName] = useState('');

    // OTP cooldown timer
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        if (otpCooldown > 0) {
            cooldownRef.current = setInterval(() => {
                setOtpCooldown((prev) => {
                    if (prev <= 1) {
                        if (cooldownRef.current) clearInterval(cooldownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
    }, [otpCooldown > 0]);

    const handleCountrySelect = (country: Country) => {
        setCountryCode(country.cca2);
        setCallingCode(country.callingCode[0]);
        setCountryPickerVisible(false);
    };

    const formatPhoneNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        try {
            const formatter = new AsYouType(countryCode);
            setPhoneNumber(formatter.input(cleaned));
        } catch { setPhoneNumber(cleaned); }
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

    // ── Email login ──
    const handleEmailLogin = async () => {
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
            router.replace('/home');
        } catch (error: any) {
            Alert.alert('Chyba', error.message);
        } finally { setLoading(false); }
    };

    // ── Username login ──
    const handleUsernameLogin = async () => {
        if (!username || !password) { Alert.alert('Chyba', 'Vyplňte používateľské meno a heslo'); return; }
        setLoading(true);
        try {
            // Lookup email by display_name
            const { data: userRow, error: lookupErr } = await supabase
                .from('users').select('email').eq('display_name', username).single();
            if (lookupErr || !userRow) throw new Error('Nesprávne prihlasovacie údaje');
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: userRow.email, password,
            });
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
            router.replace('/home');
        } catch (error: any) {
            Alert.alert('Chyba', error.message);
        } finally { setLoading(false); }
    };

    // ── Phone OTP login ──
    const handlePhoneSendOtp = async () => {
        const fullPhone = `+${callingCode}${phoneNumber.replace(/\D/g, '')}`;
        if (!phoneNumber) { Alert.alert('Chyba', 'Zadajte telefónne číslo'); return; }
        if (otpCooldown > 0) { Alert.alert('Počkajte', `Nový kód môžete odoslať za ${otpCooldown}s`); return; }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
            if (error) throw error;
            setOtpSent(true);
            setOtpCooldown(60);
            Alert.alert('Kód odoslaný', `SMS kód bol odoslaný na ${fullPhone}`);
        } catch (error: any) {
            Alert.alert('Chyba', error.message);
        } finally { setLoading(false); }
    };

    const handlePhoneVerifyOtp = async () => {
        const fullPhone = `+${callingCode}${phoneNumber.replace(/\D/g, '')}`;
        if (!otp) { Alert.alert('Chyba', 'Zadajte overovací kód'); return; }
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                phone: fullPhone, token: otp, type: 'sms',
            });
            if (error) throw error;
            if (data.user) {
                const { data: userProfile } = await supabase.from('users')
                    .select('*').eq('id', data.user.id).single();
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
            router.replace('/home');
        } catch (error: any) {
            Alert.alert('Chyba', error.message);
        } finally { setLoading(false); }
    };

    const handleLogin = () => {
        if (loginMethod === 'email') handleEmailLogin();
        else if (loginMethod === 'username') handleUsernameLogin();
        else if (loginMethod === 'phone') {
            if (otpSent) handlePhoneVerifyOtp();
            else handlePhoneSendOtp();
        }
    };

    // ── Sign Up ──
    const handleSignUp = async () => {
        if (!email || !password || !name || !surname || !displayName || !phoneNumber) {
            Alert.alert('Chyba', 'Vyplňte všetky polia'); return;
        }
        setLoading(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email, password,
                options: {
                    emailRedirectTo: undefined,
                    data: { display_name: displayName, surname, country_code: countryCode, calling_code: callingCode, phone_number: phoneNumber },
                },
            });
            if (authError) throw authError;
            const fullPhone = `+${callingCode}${phoneNumber.replace(/\D/g, '')}`;
            const { error: profileError } = await supabase.from('users').insert({
                id: authData.user?.id, email, name, surname,
                display_name: displayName, phone: fullPhone,
                country: countryCode, role: null, created_at: new Date().toISOString(),
            });
            if (profileError) throw profileError;

            if (authData.user) {
                const newUser: User = {
                    id: authData.user.id, email, name, firstName: name,
                    lastName: surname, phoneNumber: fullPhone, country: countryCode,
                    role: 'worker' as const, avatar: undefined, bio: '',
                    rating: 0, reviewCount: 0, completedJobs: 0,
                    createdAt: new Date().toISOString(),
                };
                setCurrentUser(newUser);
                setAuthenticated(true);
            }
            router.replace('/home');
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
                        <LinearGradient colors={[C.purpleDim, 'transparent']} style={styles.brandCircle}>
                            <Text style={styles.brandLetter}>B</Text>
                        </LinearGradient>
                        <Text style={[styles.brandName, { color: C.purple }]}>Brigzy</Text>
                        <Text style={[styles.brandSub, { color: C.secondaryLabel }]}>Vytvorte si účet</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <InputField icon={UserCircle} placeholder="Meno" value={name} onChangeText={setName} C={C} loading={loading} />
                        <InputField icon={UserCircle} placeholder="Priezvisko" value={surname} onChangeText={setSurname} C={C} loading={loading} />
                        <InputField icon={AtSign} placeholder="Používateľské meno" value={displayName} onChangeText={setDisplayName} C={C} loading={loading} />
                        <InputField icon={Mail} placeholder="Email" value={email} onChangeText={setEmail} keyboard="email-address" C={C} loading={loading} />
                        <InputField icon={Lock} placeholder="Heslo" value={password} onChangeText={setPassword} secure C={C} loading={loading} />

                        <Text style={[styles.phoneLabel, { color: C.text }]}>Telefónne číslo</Text>
                        <View style={[styles.phoneRow, { backgroundColor: C.surface, borderColor: C.separator }]}>
                            <Pressable onPress={() => setCountryPickerVisible(true)} style={[styles.countryBtn, { borderRightColor: C.separator }]}>
                                <CountryPicker countryCode={countryCode} withFlag withCallingCode withEmoji onSelect={handleCountrySelect} visible={countryPickerVisible} onClose={() => setCountryPickerVisible(false)} theme={{ backgroundColor: C.surface, onBackgroundTextColor: C.text, fontSize: 15, filterPlaceholderTextColor: C.tertiaryLabel as string, activeOpacity: 0.7 }} />
                                <Text style={[styles.callingCode, { color: C.text }]}>+{callingCode}</Text>
                                <ChevronDown size={14} color={C.tertiaryLabel} />
                            </Pressable>
                            <TextInput style={[styles.phoneInput, { color: C.text }]} placeholder="XXX XXX XXX" placeholderTextColor={C.tertiaryLabel} value={phoneNumber} onChangeText={formatPhoneNumber} keyboardType="phone-pad" editable={!loading} />
                        </View>

                        <Pressable onPress={handleSignUp} disabled={loading} style={({ pressed }) => [styles.submitBtn, { opacity: loading ? 0.5 : pressed ? 0.85 : 1 }]}>
                            <LinearGradient colors={['#9333EA', '#7C3AED', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitGradient}>
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Registrovať</Text>}
                            </LinearGradient>
                        </Pressable>

                        <Pressable onPress={() => setIsSignUp(false)} disabled={loading}>
                            <Text style={[styles.switchText, { color: C.purple }]}>Už máte účet? Prihláste sa</Text>
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
                    <LinearGradient colors={[C.purpleDim, 'transparent']} style={styles.brandCircle}>
                        <Text style={styles.brandLetter}>B</Text>
                    </LinearGradient>
                    <Text style={[styles.brandName, { color: C.purple }]}>Brigzy</Text>
                    <Text style={[styles.brandSub, { color: C.secondaryLabel }]}>Nájdi prácu. Zarábaj.</Text>
                </View>

                {/* Method tabs */}
                <View style={[styles.methodRow, { borderBottomColor: C.separator }]}>
                    <MethodTab label="Email" active={loginMethod === 'email'} onPress={() => { setLoginMethod('email'); setOtpSent(false); }} C={C} />
                    <MethodTab label="Používateľ" active={loginMethod === 'username'} onPress={() => { setLoginMethod('username'); setOtpSent(false); }} C={C} />
                    <MethodTab label="Telefón" active={loginMethod === 'phone'} onPress={() => { setLoginMethod('phone'); setOtpSent(false); }} C={C} />
                </View>

                {/* Form */}
                <View style={styles.formGroup}>
                    {loginMethod === 'email' && (
                        <>
                            <InputField icon={Mail} placeholder="Email" value={email} onChangeText={setEmail} keyboard="email-address" C={C} loading={loading} />
                            <InputField icon={Lock} placeholder="Heslo" value={password} onChangeText={setPassword} secure C={C} loading={loading} />
                            <Pressable onPress={handleForgotPassword} disabled={loading} style={{ alignSelf: 'flex-end', marginTop: -6 }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: C.purple }}>Zabudli ste heslo?</Text>
                            </Pressable>
                        </>
                    )}

                    {loginMethod === 'username' && (
                        <>
                            <InputField icon={AtSign} placeholder="Používateľské meno" value={username} onChangeText={setUsername} C={C} loading={loading} />
                            <InputField icon={Lock} placeholder="Heslo" value={password} onChangeText={setPassword} secure C={C} loading={loading} />
                        </>
                    )}

                    {loginMethod === 'phone' && (
                        <>
                            <View style={[styles.phoneRow, { backgroundColor: C.surface, borderColor: C.separator }]}>
                                <Pressable onPress={() => setCountryPickerVisible(true)} style={[styles.countryBtn, { borderRightColor: C.separator }]}>
                                    <CountryPicker countryCode={countryCode} withFlag withCallingCode withEmoji onSelect={handleCountrySelect} visible={countryPickerVisible} onClose={() => setCountryPickerVisible(false)} theme={{ backgroundColor: C.surface, onBackgroundTextColor: C.text, fontSize: 15, filterPlaceholderTextColor: C.tertiaryLabel as string, activeOpacity: 0.7 }} />
                                    <Text style={[styles.callingCode, { color: C.text }]}>+{callingCode}</Text>
                                    <ChevronDown size={14} color={C.tertiaryLabel} />
                                </Pressable>
                                <TextInput style={[styles.phoneInput, { color: C.text }]} placeholder="XXX XXX XXX" placeholderTextColor={C.tertiaryLabel} value={phoneNumber} onChangeText={formatPhoneNumber} keyboardType="phone-pad" editable={!loading && !otpSent} />
                            </View>
                            {otpSent && (
                                <InputField icon={Lock} placeholder="Overovací kód z SMS" value={otp} onChangeText={setOtp} keyboard="number-pad" C={C} loading={loading} />
                            )}
                        </>
                    )}

                    {/* Submit */}
                    <Pressable onPress={handleLogin} disabled={loading} style={({ pressed }) => [styles.submitBtn, { opacity: loading ? 0.5 : pressed ? 0.85 : 1 }]}>
                        <LinearGradient colors={['#9333EA', '#7C3AED', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitGradient}>
                            {loading ? <ActivityIndicator color="#FFF" /> : (
                                <Text style={styles.submitText}>
                                    {loginMethod === 'phone' && !otpSent ? 'Odoslať kód' : 'Prihlásiť sa'}
                                </Text>
                            )}
                        </LinearGradient>
                    </Pressable>

                    {/* Switch to register */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                        <Text style={{ fontSize: 14, color: C.secondaryLabel }}>Nemáte účet?</Text>
                        <Pressable onPress={() => setIsSignUp(true)} disabled={loading}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: C.purple }}>Registrujte sa</Text>
                        </Pressable>
                    </View>

                    {loginMethod === 'phone' && otpSent && (
                        <Pressable
                            onPress={() => { setOtpSent(false); setOtp(''); handlePhoneSendOtp(); }}
                            disabled={otpCooldown > 0}
                        >
                            <Text style={[styles.switchText, { color: otpCooldown > 0 ? C.tertiaryLabel : C.purple }]}>
                                {otpCooldown > 0 ? `Odoslať znova za ${otpCooldown}s` : 'Odoslať kód znova'}
                            </Text>
                        </Pressable>
                    )}
                </View>

                {/* Divider */}
                <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { backgroundColor: C.separator }]} />
                    <Text style={[styles.dividerText, { color: C.tertiaryLabel }]}>alebo</Text>
                    <View style={[styles.dividerLine, { backgroundColor: C.separator }]} />
                </View>

                {/* Social logins */}
                <View style={styles.socialGroup}>
                    <SocialButton label="Sign in with Apple" iconType="apple" C={C} onPress={() => Alert.alert('Čoskoro', 'Prihlásenie cez Apple bude dostupné čoskoro.')} />
                    <SocialButton label="Sign in with Google" iconType="google" C={C} onPress={() => Alert.alert('Čoskoro', 'Prihlásenie cez Google bude dostupné čoskoro.')} />
                </View>

                {/* Terms */}
                <Text style={{ fontSize: 12, color: C.tertiaryLabel, textAlign: 'center', marginTop: 16, lineHeight: 18 }}>
                    By continuing, you agree to our{' '}
                    <Text style={{ color: C.purple, fontWeight: '500' }} onPress={() => Linking.openURL('https://brigzy.sk/terms')}>Terms</Text> and{' '}
                    <Text style={{ color: C.purple, fontWeight: '500' }} onPress={() => Linking.openURL('https://brigzy.sk/privacy')}>Privacy Policy</Text>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40 },
    loginScroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },

    // Brand
    brandWrap: { alignItems: 'center', marginBottom: 36 },
    brandCircle: {
        width: 80, height: 80, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    brandLetter: { fontSize: 36, fontWeight: '800', color: '#7C3AED' },
    brandName: { fontSize: 42, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
    brandSub: { fontSize: 17 },

    // Method tabs
    methodRow: {
        flexDirection: 'row', marginBottom: 24,
        borderBottomWidth: 0.5,
    },

    // Form
    formGroup: { gap: 14 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 14, paddingVertical: 14, gap: 10,
    },
    input: { flex: 1, fontSize: 16 },

    // Phone
    phoneLabel: { fontSize: 13, fontWeight: '600', marginBottom: -6, marginLeft: 4 },
    phoneRow: {
        flexDirection: 'row', borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
    },
    countryBtn: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 14,
        borderRightWidth: StyleSheet.hairlineWidth, gap: 6,
    },
    callingCode: { fontSize: 15, fontWeight: '500' },
    phoneInput: { flex: 1, paddingHorizontal: 14, fontSize: 16 },

    // Submit
    submitBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
    submitGradient: { paddingVertical: 17, alignItems: 'center', borderRadius: 16 },
    submitText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

    // Divider
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 14 },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
    dividerText: { fontSize: 13, fontWeight: '500' },

    // Social
    socialGroup: { gap: 12, marginBottom: 8 },

    // Switch
    switchText: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 4 },
});
