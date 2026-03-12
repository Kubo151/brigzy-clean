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
import { useColors } from '@/lib/useColors';
import { useText } from '../lib/useText';
import { supabase } from '../lib/supabase';
import useAuthStore from '../lib/state/auth-store';
import Avatar from '../components/Avatar';

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
    const C = useColors();
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

    /* ─── Data ─── */
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

        if (m.date_of_birth) {
            setDatePickerDate(new Date(m.date_of_birth));
        }
    };

    const updateField = (key: keyof UserProfile, value: string) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
    };

    /* ─── Avatar ─── */
    const pickImage = async (useCamera: boolean) => {
        try {
            const { status } = useCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') { Alert.alert(text.error, 'Permission required!'); return; }

            const result = useCamera
                ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 })
                : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 });

            if (!result.canceled && result.assets[0]) await uploadAvatar(result.assets[0].uri);
        } catch { Alert.alert(text.error, text.failedToUploadPhoto); }
    };

    const uploadAvatar = async (uri: string) => {
        try {
            setUploadingPhoto(true);
            const response = await fetch(uri);
            const blob = await response.blob();
            if (blob.size > 2 * 1024 * 1024) { Alert.alert(text.error, text.fileTooLarge); return; }

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
            Alert.alert(text.ok, text.photoSuccessfullyChanged);
        } catch { Alert.alert(text.error, text.failedToUploadPhoto); }
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
            Alert.alert(text.selectPhoto, '', [
                { text: text.cancel, style: 'cancel' },
                { text: text.takePhoto, onPress: () => pickImage(true) },
                { text: text.selectPhoto, onPress: () => pickImage(false) },
            ]);
        }
    };

    /* ─── Save ─── */
    const handleSave = async () => {
        if (!profile.name.trim() || !profile.display_name.trim()) {
            Alert.alert(text.error, text.allFieldsRequired); return;
        }
        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { data: { user: u } } = await supabase.auth.getUser();
            if (!u) throw new Error('No user');

            await supabase.auth.updateUser({
                data: {
                    display_name: profile.display_name,
                    first_name: profile.name,
                    last_name: profile.surname,
                    phone_number: profile.phone,
                    country: profile.country,
                    bio: profile.bio,
                    date_of_birth: profile.date_of_birth,
                },
            });

            await supabase.from('users').update({
                name: profile.name,
                surname: profile.surname,
                display_name: profile.display_name,
                phone: profile.phone,
                country: profile.country,
                bio: profile.bio,
            }).eq('id', u.id);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(text.ok, text.profileUpdated);
            router.back();
        } catch { Alert.alert(text.error, text.failedToSaveChanges); }
        finally { setIsLoading(false); }
    };

    /* ─── Form Row ─── */
    const FormRow = ({ icon: Icon, iconColor, iconBg, label, value, onChangeText, placeholder, editable = true, multiline, onPress, displayValue, isLast }: any) => (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={[
                styles.formRow,
                !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
            ]}
        >
            {/* Icon box */}
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Icon size={18} color={iconColor} strokeWidth={1.8} />
            </View>

            {/* Label + Input */}
            <View style={styles.formRowContent}>
                <Text style={[styles.formLabel, { color: C.muted }]}>{label}</Text>
                {onPress ? (
                    <Text style={[styles.formDisplayValue, { color: displayValue ? C.text : C.tertiaryLabel }]}>
                        {displayValue || placeholder}
                    </Text>
                ) : multiline ? (
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={C.tertiaryLabel}
                        multiline
                        style={[styles.formTextArea, { color: C.text }]}
                        editable={!isLoading}
                    />
                ) : (
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={C.tertiaryLabel}
                        editable={editable && !isLoading}
                        style={[styles.formInput, { color: editable ? C.text : C.tertiaryLabel }]}
                        keyboardType={label.includes('Telefón') || label.includes('Phone') ? 'phone-pad' : 'default'}
                    />
                )}
            </View>

            {/* Arrow for tap rows */}
            {onPress && (
                <Text style={{ color: C.tertiaryLabel, fontSize: 18 }}>›</Text>
            )}
        </Pressable>
    );

    const fullName = `${profile.name} ${profile.surname}`.trim();

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* ─── Header ─── */}
                <View style={[styles.header, { borderBottomColor: C.separator }]}>
                    <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
                        style={({ pressed }) => [styles.backBtn, { backgroundColor: C.surface, opacity: pressed ? 0.7 : 1 }]}
                    >
                        <ArrowLeft size={20} color={C.text} strokeWidth={1.8} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: C.text }]}>Nastavenia profilu</Text>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ─── Avatar Section ─── */}
                    <View style={styles.avatarSection}>
                        <Pressable onPress={handlePhotoPress} disabled={uploadingPhoto}>
                            <View style={{ position: 'relative' }}>
                                <LinearGradient
                                    colors={['#9333EA', '#7C3AED', '#6D28D9']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.avatarGradientRing}
                                >
                                    <View style={[styles.avatarInner, { backgroundColor: C.bg }]}>
                                        <Avatar
                                            imageUrl={profile.avatar_url}
                                            name={fullName || 'U'}
                                            size={84}
                                            isDark={C.bg === '#141420'}
                                        />
                                    </View>
                                </LinearGradient>
                                <View style={[styles.cameraBadge, { borderColor: C.bg }]}>
                                    <Camera size={16} color="#FFFFFF" strokeWidth={2} />
                                </View>
                            </View>
                        </Pressable>
                        <Pressable onPress={handlePhotoPress}>
                            <Text style={[styles.changePhotoText, { color: C.purpleLight }]}>
                                {uploadingPhoto ? 'Nahrávam...' : 'Zmeniť fotku'}
                            </Text>
                        </Pressable>
                    </View>

                    {/* ─── Section 1: Základné informácie ─── */}
                    <Text style={[styles.sectionTitle, { color: C.muted }]}>ZÁKLADNÉ INFORMÁCIE</Text>
                    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.separator }]}>
                        <FormRow
                            icon={User}
                            iconColor={C.purple}
                            iconBg={C.purpleDim}
                            label="Meno a priezvisko"
                            value={fullName}
                            onChangeText={(val: string) => {
                                const parts = val.split(' ');
                                updateField('name', parts[0] || '');
                                updateField('surname', parts.slice(1).join(' ') || '');
                            }}
                            placeholder="Vaše meno"
                        />
                        <FormRow
                            icon={Layers}
                            iconColor={C.purple}
                            iconBg={C.purpleDim}
                            label="Display name (verejné meno)"
                            value={profile.display_name}
                            onChangeText={(v: string) => updateField('display_name', v)}
                            placeholder="@username"
                            isLast
                        />
                    </View>

                    {/* ─── Section 2: Kontaktné údaje ─── */}
                    <Text style={[styles.sectionTitle, { color: C.muted }]}>KONTAKTNÉ ÚDAJE</Text>
                    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.separator }]}>
                        <FormRow
                            icon={Mail}
                            iconColor={C.blue}
                            iconBg="rgba(59,130,246,0.12)"
                            label="Email"
                            value={profile.email}
                            editable={false}
                            placeholder="email@example.com"
                        />
                        <FormRow
                            icon={Phone}
                            iconColor={C.green}
                            iconBg="rgba(48,209,88,0.12)"
                            label="Telefónne číslo"
                            value={profile.phone}
                            onChangeText={(v: string) => updateField('phone', v)}
                            placeholder="+421 9XX XXX XXX"
                            isLast
                        />
                    </View>

                    {/* ─── Section 3: Ďalšie informácie ─── */}
                    <Text style={[styles.sectionTitle, { color: C.muted }]}>ĎALŠIE INFORMÁCIE</Text>
                    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.separator }]}>
                        <FormRow
                            icon={MapPin}
                            iconColor={C.yellow}
                            iconBg="rgba(255,214,10,0.12)"
                            label="Lokácia"
                            value={profile.country}
                            onChangeText={(v: string) => updateField('country', v)}
                            placeholder="Mesto, Kraj"
                        />
                        <FormRow
                            icon={Calendar}
                            iconColor={C.purple}
                            iconBg={C.purpleDim}
                            label="Dátum narodenia"
                            onPress={() => setShowDatePicker(true)}
                            displayValue={profile.date_of_birth
                                ? new Date(profile.date_of_birth).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })
                                : ''
                            }
                            placeholder="Zvoliť dátum"
                        />
                        <FormRow
                            icon={User}
                            iconColor={C.purple}
                            iconBg={C.purpleDim}
                            label="O mne"
                            value={profile.bio}
                            onChangeText={(v: string) => updateField('bio', v)}
                            placeholder="Napíšte niečo o sebe..."
                            multiline
                            isLast
                        />
                    </View>
                </ScrollView>

                {/* ─── Bottom Save Bar ─── */}
                <View style={[styles.bottomBar, { backgroundColor: C.bg, borderTopColor: C.separator }]}>
                    <Pressable
                        onPress={handleSave}
                        disabled={isLoading}
                        style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.85 : isLoading ? 0.5 : 1 }]}
                    >
                        <LinearGradient
                            colors={isLoading ? ['#6B6B8A', '#6B6B8A'] : ['#9333EA', '#7C3AED', '#6D28D9']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.saveBtnGradient}
                        >
                            {!isLoading && <Check size={20} color="#FFFFFF" strokeWidth={2} />}
                            <Text style={styles.saveBtnText}>
                                {isLoading ? 'Ukladám...' : 'Uložiť zmeny'}
                            </Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>

            {/* ─── Date Picker Modal ─── */}
            <Modal visible={showDatePicker} transparent animationType="fade">
                <Pressable style={styles.dateOverlay} onPress={() => setShowDatePicker(false)}>
                    <Pressable style={[styles.dateSheet, { backgroundColor: C.surface }]}>
                        <View style={[styles.dateHeader, { borderBottomColor: C.separator }]}>
                            <Text style={[styles.dateTitle, { color: C.text }]}>Dátum narodenia</Text>
                            <Pressable onPress={() => {
                                updateField('date_of_birth', datePickerDate.toISOString().split('T')[0]);
                                setShowDatePicker(false);
                                Haptics.selectionAsync();
                            }}>
                                <Text style={[styles.dateDone, { color: C.purple }]}>Hotovo</Text>
                            </Pressable>
                        </View>
                        <DateTimePicker
                            value={datePickerDate}
                            mode="date"
                            display="spinner"
                            maximumDate={new Date()}
                            minimumDate={new Date(1940, 0, 1)}
                            onChange={(_, date) => { if (date) setDatePickerDate(date); }}
                            textColor={C.text}
                            style={{ height: 200 }}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },

    scrollContent: {
        paddingBottom: 120,
    },

    /* Avatar */
    avatarSection: {
        alignItems: 'center',
        paddingTop: 28,
        paddingBottom: 24,
    },
    avatarGradientRing: {
        width: 92,
        height: 92,
        borderRadius: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInner: {
        width: 86,
        height: 86,
        borderRadius: 43,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: -2,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    changePhotoText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
    },

    /* Sections */
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.8,
        paddingHorizontal: 36,
        marginTop: 24,
        marginBottom: 8,
    },
    card: {
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },

    /* Form Row */
    formRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formRowContent: {
        flex: 1,
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    formInput: {
        fontSize: 15,
        fontWeight: '500',
        paddingVertical: 2,
    },
    formTextArea: {
        fontSize: 15,
        fontWeight: '500',
        minHeight: 80,
        textAlignVertical: 'top',
        paddingVertical: 2,
    },
    formDisplayValue: {
        fontSize: 15,
        fontWeight: '500',
    },

    /* Bottom Bar */
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 34,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    saveBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 58,
    },
    saveBtnGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        gap: 8,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },

    /* Date Picker Modal */
    dateOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    dateSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dateTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    dateDone: {
        fontSize: 17,
        fontWeight: '600',
    },
});
