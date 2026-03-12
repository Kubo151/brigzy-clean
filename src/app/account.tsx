import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Mail,
  CheckCircle,
  Camera,
  User,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import useAppStore from "@/lib/state/app-store";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/lib/useColors";
import { useText } from "@/lib/useText";
import { CountrySelector } from "@/components/CountrySelector";
import { PhoneNumberInput } from "@/components/PhoneNumberInput";
import { COUNTRIES, type Country, getCountryByName, validatePhoneNumber, formatPhoneNumber, parseInternationalNumber } from "@/lib/countries";

export default function AccountScreen() {
  const router = useRouter();
  const C = useColors();
  const text = useText();

  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsInitialLoading(true);
      try {
        let userId: string | null = null;

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user) {
          userId = session.user.id;
        } else {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) userId = authUser.id;
        }
        if (!userId && currentUser?.id) userId = currentUser.id;
        if (!userId) { setIsInitialLoading(false); return; }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError || !profile) { setIsInitialLoading(false); return; }

        const userProfile = {
          id: profile.id,
          email: profile.email,
          name: profile.display_name || profile.name || "User",
          firstName: profile.name || "",
          lastName: profile.surname || "",
          country: profile.country || "",
          phoneNumber: profile.phone || "",
          avatar: profile.avatar_url || undefined,
          bio: profile.bio || undefined,
          rating: profile.rating || 0,
          reviewCount: profile.review_count || 0,
          completedJobs: profile.completed_jobs || 0,
          role: profile.role || "worker",
          createdAt: profile.created_at ? new Date(profile.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        };

        setCurrentUser(userProfile);
        setDisplayName(profile.display_name || "");
        setFirstName(profile.name || "");
        setLastName(profile.surname || "");
        setAvatarUrl(profile.avatar_url || undefined);

        const userCountry = profile.country ? getCountryByName(profile.country) : COUNTRIES[0];
        setSelectedCountry(userCountry || COUNTRIES[0]);

        const parsedPhone = profile.phone ? parseInternationalNumber(profile.phone) : null;
        setPhoneNumber(parsedPhone?.number || "");
      } catch (error) {
        console.error("❌ [AccountSettings] Exception:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadUserProfile();
  }, [setCurrentUser]);

  const handleAvatarUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) return;

      setIsUploadingPhoto(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const image = result.assets[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = image.uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const response = await fetch(image.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: `image/${fileExt}`, upsert: true });

      if (uploadError) { setIsUploadingPhoto(false); return; }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) { setIsUploadingPhoto(false); return; }

      setAvatarUrl(publicUrl);
      if (currentUser) setCurrentUser({ ...currentUser, avatar: publicUrl });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsUploadingPhoto(false);
    } catch (error) {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (!displayName.trim() || !firstName.trim() || !lastName.trim() || !selectedCountry || !phoneNumber.trim()) return;
    if (!validatePhoneNumber(phoneNumber)) return;

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const internationalPhoneNumber = formatPhoneNumber(selectedCountry.dialCode, phoneNumber);

      let userId: string | null = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) userId = session.user.id;
      else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
      }
      if (!userId && currentUser?.id) userId = currentUser.id;
      if (!userId) { alert(text.notLoggedIn); return; }

      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName.trim(),
          name: firstName.trim(),
          surname: lastName.trim(),
          phone: internationalPhoneNumber,
          country: selectedCountry.name,
        })
        .eq('id', userId)
        .select();

      if (error) { alert('Chyba: ' + error.message); return; }

      setCurrentUser({
        ...currentUser,
        name: displayName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        country: selectedCountry.name,
        phoneNumber: internationalPhoneNumber,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert('Chyba: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Reusable Input Field ─── */
  const InputField = ({ icon: Icon, label, value, onChangeText, placeholder, editable = true, helperText }: any) => (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: C.secondaryLabel }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: C.surface, borderColor: C.separator }]}>
        <Icon size={18} color={C.tertiaryLabel} strokeWidth={1.8} />
        <TextInput
          style={[styles.input, { color: editable ? C.text : C.tertiaryLabel }]}
          placeholder={placeholder || label}
          placeholderTextColor={C.tertiaryLabel}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="words"
          editable={editable && !isLoading}
        />
      </View>
      {helperText && (
        <Text style={[styles.helperText, { color: C.tertiaryLabel }]}>{helperText}</Text>
      )}
    </View>
  );

  /* ─── Header component (reused across states) ─── */
  const Header = () => (
    <View style={[styles.header, { borderBottomColor: C.separator }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        style={({ pressed }) => [
          styles.backBtn,
          { backgroundColor: C.surface, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <ChevronLeft size={20} color={C.text} strokeWidth={1.8} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: C.text }]}>
        {text.accountSettings}
      </Text>
    </View>
  );

  /* ─── Loading state ─── */
  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={["top"]}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.purple} />
          <Text style={[styles.loadingText, { color: C.secondaryLabel }]}>
            Načítavam údaje...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ─── No user state ─── */
  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={["top"]}>
        <Header />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: C.secondaryLabel }]}>
            Nepodarilo sa načítať údaje účtu.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.retryBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={['#9333EA', '#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.retryBtnGradient}
            >
              <Text style={styles.retryBtnText}>Späť</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ─── Main form ─── */
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header />

        {/* Section Label */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionLabel, { color: C.secondaryLabel }]}>
            {text.editProfile}
          </Text>

          {/* Avatar Upload */}
          <View style={styles.avatarSection}>
            <Pressable onPress={handleAvatarUpload} disabled={isUploadingPhoto}>
              <View style={{ position: 'relative' }}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: C.purpleDim }]}>
                    <Text style={[styles.avatarInitial, { color: C.purple }]}>
                      {displayName?.charAt(0).toUpperCase() || firstName?.charAt(0).toUpperCase() || currentUser?.name?.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
                <View style={[styles.cameraBtn, { borderColor: C.bg, backgroundColor: isUploadingPhoto ? '#9CA3AF' : '#7C3AED' }]}>
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Camera size={16} color="#fff" strokeWidth={1.8} />
                  )}
                </View>
              </View>
            </Pressable>
            <Text style={[styles.avatarHint, { color: C.tertiaryLabel }]}>
              {isUploadingPhoto ? text.uploadingPhoto : text.tapToChangePhoto}
            </Text>
          </View>

          {/* Form Fields */}
          <InputField
            icon={User}
            label={text.displayName}
            value={displayName}
            onChangeText={setDisplayName}
            helperText={text.displayNameHelper}
          />

          <InputField
            icon={User}
            label={text.firstName}
            value={firstName}
            onChangeText={setFirstName}
          />

          <InputField
            icon={User}
            label={text.lastName}
            value={lastName}
            onChangeText={setLastName}
          />

          {/* Email (Read-only) */}
          <InputField
            icon={Mail}
            label={text.email}
            value={currentUser.email}
            editable={false}
          />

          {/* Country Selector */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: C.secondaryLabel }]}>
              {text.country}
            </Text>
            <CountrySelector
              selectedCountry={selectedCountry}
              onCountrySelect={setSelectedCountry}
              isDark={C.bg === '#141420'}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: C.secondaryLabel }]}>
              {text.phoneNumber}
            </Text>
            <PhoneNumberInput
              selectedCountry={selectedCountry}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              onCountryChange={setSelectedCountry}
              isDark={C.bg === '#141420'}
            />
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.saveBtn,
              { opacity: pressed ? 0.85 : isLoading ? 0.6 : 1 },
            ]}
          >
            <LinearGradient
              colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#9333EA', '#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtnGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{text.save}</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: C.surface }]}>
            <View style={styles.modalIconBg}>
              <CheckCircle size={32} color="#10B981" strokeWidth={1.5} />
            </View>
            <Text style={[styles.modalTitle, { color: C.text }]}>
              {text.profileUpdated}
            </Text>
            <Text style={[styles.modalDesc, { color: C.secondaryLabel }]}>
              {text.profileUpdateSuccess}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
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
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  retryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  retryBtnGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  avatarHint: {
    fontSize: 13,
    marginTop: 10,
  },
  fieldWrap: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  saveBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  modalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
