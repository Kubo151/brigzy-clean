import { View, Text, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform, ActionSheetIOS, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
    ArrowLeft, User, Layers, Mail, Phone, MapPin, Calendar, Camera, Check,
} from 'lucide-react-native';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useClay } from '@/lib/useClay';
import { useText } from '../lib/useText';
import { supabase } from '../lib/supabase';
import useAuthStore from '../lib/state/auth-store';
import Avatar from '../components/Avatar';
import { ClaySurface } from '@/components/clay';
import { goBack } from '@/lib/nav';
import { showAlert } from '@/lib/notify';

/* ─── Types ─── */
interface UserProfile {
    display_name: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
    country: string;
    avatar_url: string | null;
    bio: string;
    date_of_birth: string | null;
}

export default function AccountSettings() {
    const C = useClay();
    const text = useText();
    const user = useAuthStore((s) => s.user);

    const [profile, setProfile] = useState<UserProfile>({
        display_name: '', name: '', surname: '', email: '',
        phone: '', country: '', avatar_url: null, bio: '', date_of_birth: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerDate, setDatePickerDate] = useState(new Date(2000, 0, 1));

    useEffect(() => { loadUserData(); }, [user]);

    const loadUserData = async () => {
        let currentUser = user;
        if (!currentUser) {
            const { data: { user: fetchedUser } } = await supabase.auth.getUser();
            if (!fetchedUser) return;
            currentUser = fetchedUser;
        }
        const { data: { user: userData } } = await supabase.auth.getUser();
        if (!userData?.user_metadata) return;
        const m = userData.user_metadata;
        setProfile({
            display_name: m.display_name || m.name || '',
            name: m.first_name || m.name || '',
            surname: m.last_name || m.surname || '',
            email: currentUser?.email || '',
            phone: m.phone_number || '',
            country: m.country || '',
            avatar_url: m.avatar_url || null,
            bio: m.bio || '',
            date_of_birth: m.date_of_birth || null,
        });
        if (m.date_of_birth) setDatePickerDate(new Date(m.date_of_birth));
    };

    const updateField = (key: keyof UserProfile, value: string) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
    };

    const pickImage = async (useCamera: boolean) => {
        try {
            const { status } = useCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') { showAlert(text.error, 'Permission required!'); return; }
            const result = useCamera
                ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 })
                : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 });
            if (!result.canceled && result.assets[0]) await uploadAvatar(result.assets[0].uri);
        } catch { showAlert(text.error, text.failedToUploadPhoto); }
    };

    const uploadAvatar = async (uri: string) => {
        try {
            setUploadingPhoto(true);
            const response = await fetch(uri);
            const blob = await response.blob();
            if (blob.size > 2 * 1024 * 1024) { showAlert(text.error, text.fileTooLarge); return; }
            const { data: { user: u } } = await supabase.auth.getUser();
            if (!u) throw new Error('No user');
            const ext = uri.split('.').pop();
            const fileName = `${u.id}/avatar.${ext}`;
            const { error: upErr } = await supabase.storage
                .from('avatars').upload(fileName, blob, { cacheControl: '3600', upsert: true, contentType: `image/${ext}` });
            if (upErr) throw upErr;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            const { error: updErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
            if (updErr) throw updErr;
            updateField('avatar_url', `${publicUrl}?t=${Date.now()}`);
            showAlert(text.ok, text.photoSuccessfullyChanged);
        } catch { showAlert(text.error, text.failedToUploadPhoto); }
        finally { setUploadingPhoto(false); }
    };

    const handlePhotoPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options: [text.cancel, text.takePhoto, text.selectPhoto], cancelButtonIndex: 0 },
                (i) => { if (i === 1) pickImage(true); else if (i === 2) pickImage(false); },
            );
        } else {
            showAlert(text.selectPhoto, '', [
                { text: text.cancel, style: 'cancel' },
                { text: text.takePhoto, onPress: () => pickImage(true) },
                { text: text.selectPhoto, onPress: () => pickImage(false) },
            ]);
        }
    };

    const handleSave = async () => {
        if (!profile.name.trim() || !profile.display_name.trim()) {
            showAlert(text.error, text.allFieldsRequired); return;
        }
        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { data: { user: u } } = await supabase.auth.getUser();
            if (!u) throw new Error('No user');
            await supabase.auth.updateUser({
                data: {
                    display_name: profile.display_name, first_name: profile.name, last_name: profile.surname,
                    phone_number: profile.phone, country: profile.country, bio: profile.bio, date_of_birth: profile.date_of_birth,
                },
            });
            await supabase.from('users').update({
                name: profile.name, surname: profile.surname, display_name: profile.display_name,
                phone: profile.phone, country: profile.country, bio: profile.bio,
            }).eq('id', u.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showAlert(text.ok, text.profileUpdated);
            goBack();
        } catch { showAlert(text.error, text.failedToSaveChanges); }
        finally { setIsLoading(false); }
    };

    const FormRow = ({ icon: Icon, iconColor, iconBg, label, value, onChangeText, placeholder, editable = true, multiline, onPress, displayValue, isLast }: any) => (
        <Pressable onPress={onPress} disabled={!onPress} style={[styles.formRow, !isLast && { borderBottomWidth: 1, borderBottomColor: C.hair }]}>
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Icon size={18} color={iconColor} strokeWidth={2} />
            </View>
            <View style={styles.formRowContent}>
                <Text style={[styles.formLabel, { color: C.muted }]}>{label}</Text>
                {onPress ? (
                    <Text style={[styles.formDisplayValue, { color: displayValue ? C.text : C.muted }]}>{displayValue || placeholder}</Text>
                ) : multiline ? (
                    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.muted} multiline style={[styles.formTextArea, { color: C.text }]} editable={!isLoading} />
                ) : (
                    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.muted} editable={editable && !isLoading} style={[styles.formInput, { color: editable ? C.text : C.muted }]} keyboardType={label.includes('Telefón') || label.includes('Phone') ? 'phone-pad' : 'default'} />
                )}
            </View>
            {onPress && <Text style={{ color: C.muted, fontSize: 18 }}>›</Text>}
        </Pressable>
    );

    const fullName = `${profile.name} ${profile.surname}`.trim();

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goBack(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                        <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowLeft size={20} color={C.text} strokeWidth={2} />
                        </ClaySurface>
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: C.text }]}>Nastavenia profilu</Text>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <Pressable onPress={handlePhotoPress} disabled={uploadingPhoto}>
                            <View style={{ position: 'relative' }}>
                                <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.avatarGradientRing}>
                                    <View style={[styles.avatarInner, { backgroundColor: C.bg }]}>
                                        <Avatar imageUrl={profile.avatar_url} name={fullName || 'U'} size={84} isDark={!C.isLight} />
                                    </View>
                                </LinearGradient>
                                <View style={[styles.cameraBadge, { backgroundColor: C.accent, borderColor: C.bg }]}>
                                    <Camera size={16} color={C.onAccent} strokeWidth={2} />
                                </View>
                            </View>
                        </Pressable>
                        <Pressable onPress={handlePhotoPress}>
                            <Text style={[styles.changePhotoText, { color: C.accent }]}>{uploadingPhoto ? 'Nahrávam...' : 'Zmeniť fotku'}</Text>
                        </Pressable>
                    </View>

                    {/* Section 1 */}
                    <Text style={[styles.sectionTitle, { color: C.muted }]}>ZÁKLADNÉ INFORMÁCIE</Text>
                    <View style={styles.cardWrap}>
                        <ClaySurface radius={16}>
                            <FormRow icon={User} iconColor={C.accent} iconBg={C.accentDim} label="Meno a priezvisko" value={fullName}
                                onChangeText={(val: string) => { const parts = val.split(' '); updateField('name', parts[0] || ''); updateField('surname', parts.slice(1).join(' ') || ''); }}
                                placeholder="Vaše meno" />
                            <FormRow icon={Layers} iconColor={C.accent} iconBg={C.accentDim} label="Display name (verejné meno)" value={profile.display_name} onChangeText={(v: string) => updateField('display_name', v)} placeholder="@username" isLast />
                        </ClaySurface>
                    </View>

                    {/* Section 2 */}
                    <Text style={[styles.sectionTitle, { color: C.muted }]}>KONTAKTNÉ ÚDAJE</Text>
                    <View style={styles.cardWrap}>
                        <ClaySurface radius={16}>
                            <FormRow icon={Mail} iconColor={C.verified} iconBg="rgba(46,168,255,0.13)" label="Email" value={profile.email} editable={false} placeholder="email@example.com" />
                            <FormRow icon={Phone} iconColor={C.green} iconBg={C.greenDim} label="Telefónne číslo" value={profile.phone} onChangeText={(v: string) => updateField('phone', v)} placeholder="+421 9XX XXX XXX" isLast />
                        </ClaySurface>
                    </View>

                    {/* Section 3 */}
                    <Text style={[styles.sectionTitle, { color: C.muted }]}>ĎALŠIE INFORMÁCIE</Text>
                    <View style={styles.cardWrap}>
                        <ClaySurface radius={16}>
                            <FormRow icon={MapPin} iconColor={C.star} iconBg="rgba(255,179,0,0.13)" label="Lokácia" value={profile.country} onChangeText={(v: string) => updateField('country', v)} placeholder="Mesto, Kraj" />
                            <FormRow icon={Calendar} iconColor={C.accent} iconBg={C.accentDim} label="Dátum narodenia" onPress={() => setShowDatePicker(true)}
                                displayValue={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                placeholder="Zvoliť dátum" />
                            <FormRow icon={User} iconColor={C.accent} iconBg={C.accentDim} label="O mne" value={profile.bio} onChangeText={(v: string) => updateField('bio', v)} placeholder="Napíšte niečo o sebe..." multiline isLast />
                        </ClaySurface>
                    </View>
                </ScrollView>

                {/* Bottom Save Bar */}
                <View style={[styles.bottomBar, { backgroundColor: C.bg, borderTopColor: C.hair }]}>
                    <Pressable onPress={handleSave} disabled={isLoading} style={({ pressed }) => [styles.saveBtn, Platform.select({
                        ios: { shadowColor: C.accentShadow.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: isLoading ? 0 : C.accentShadow.opacity, shadowRadius: 14 },
                        android: { elevation: isLoading ? 0 : 6 },
                    }), { opacity: pressed ? 0.9 : isLoading ? 0.5 : 1 }]}>
                        <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.saveBtnGradient}>
                            <LinearGradient colors={['rgba(255,255,255,0.25)', 'transparent']} style={styles.saveSheen} />
                            {!isLoading && <Check size={20} color={C.onAccent} strokeWidth={2.4} />}
                            <Text style={[styles.saveBtnText, { color: C.onAccent }]}>{isLoading ? 'Ukladám...' : 'Uložiť zmeny'}</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>

            {/* Date Picker Modal */}
            <Modal visible={showDatePicker} transparent animationType="fade">
                <Pressable style={styles.dateOverlay} onPress={() => setShowDatePicker(false)}>
                    <Pressable style={[styles.dateSheet, { backgroundColor: C.bg }]}>
                        <View style={[styles.dateHeader, { borderBottomColor: C.hair }]}>
                            <Text style={[styles.dateTitle, { color: C.text }]}>Dátum narodenia</Text>
                            <Pressable onPress={() => { updateField('date_of_birth', datePickerDate.toISOString().split('T')[0]); setShowDatePicker(false); Haptics.selectionAsync(); }}>
                                <Text style={[styles.dateDone, { color: C.accent }]}>Hotovo</Text>
                            </Pressable>
                        </View>
                        <DateTimePicker
                            value={datePickerDate} mode="date" display="spinner"
                            maximumDate={new Date()} minimumDate={new Date(1940, 0, 1)}
                            onChange={(_, date) => { if (date) setDatePickerDate(date); }}
                            textColor={C.text} style={{ height: 200 }}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
    headerTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
    scrollContent: { paddingBottom: 120 },
    avatarSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
    avatarGradientRing: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
    avatarInner: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    cameraBadge: { position: 'absolute', bottom: 0, right: -2, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
    changePhotoText: { fontSize: 14, fontWeight: '800', marginTop: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7, paddingHorizontal: 24, marginTop: 22, marginBottom: 8 },
    cardWrap: { marginHorizontal: 20 },
    formRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 14 },
    iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    formRowContent: { flex: 1 },
    formLabel: { fontSize: 11.5, fontWeight: '600', marginBottom: 2 },
    formInput: { fontSize: 15, fontWeight: '600', paddingVertical: 2 },
    formTextArea: { fontSize: 15, fontWeight: '600', minHeight: 80, textAlignVertical: 'top', paddingVertical: 2 },
    formDisplayValue: { fontSize: 15, fontWeight: '600' },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34, borderTopWidth: StyleSheet.hairlineWidth },
    saveBtn: { borderRadius: 18, overflow: 'hidden', height: 56 },
    saveBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 18, gap: 8, overflow: 'hidden' },
    saveSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
    saveBtnText: { fontSize: 16.5, fontWeight: '800' },
    dateOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    dateSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 },
    dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
    dateTitle: { fontSize: 17, fontWeight: '800' },
    dateDone: { fontSize: 17, fontWeight: '800' },
});
