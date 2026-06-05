import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, TextInput, Pressable, ScrollView, StyleSheet,
    Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ChevronDown, Check, Landmark } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useClay } from '@/lib/useClay';
import type { ClayColors } from '@/lib/useClay';
import { ClaySurface, ClayInset, ClayIconBox } from '@/components/clay';

const SK_BANKS = [
    'Slovenská sporiteľňa', 'VÚB banka', 'Tatra banka', 'ČSOB', 'mBank',
    'Fio banka', 'UniCredit Bank', 'Poštová banka', 'Prima banka', '365.bank', 'Iná banka',
];

const formatIBAN = (value: string): string => {
    const clean = value.replace(/\s/g, '').toUpperCase();
    return clean.replace(/(.{4})/g, '$1 ').trim();
};
const isValidSKIBAN = (iban: string): boolean => {
    const clean = iban.replace(/\s/g, '');
    return /^SK\d{22}$/.test(clean);
};

export default function BankAccountScreen() {
    const C = useClay();
    const styles = useMemo(() => makeStyles(C), [C]);
    const [iban, setIban] = useState('');
    const [bankName, setBankName] = useState('');
    const [showBankPicker, setShowBankPicker] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadSavedData(); }, []);

    const loadSavedData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('users').select('bank_iban, bank_name').eq('id', user.id).single();
            if (data?.bank_iban) setIban(formatIBAN(data.bank_iban));
            if (data?.bank_name) setBankName(data.bank_name);
        } catch (e) {
            console.error('Error loading bank data:', e);
        }
    };

    const handleIBANChange = (text: string) => {
        const clean = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (clean.length <= 24) setIban(formatIBAN(clean));
    };

    const handleSave = async () => {
        const cleanIban = iban.replace(/\s/g, '');
        if (!isValidSKIBAN(cleanIban)) {
            Alert.alert('Neplatný IBAN', 'Zadaj platný slovenský IBAN (SK + 22 číslic)');
            return;
        }
        if (!bankName) { Alert.alert('Chýba banka', 'Vyber svoju banku'); return; }
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            const { error } = await supabase
                .from('users').update({ bank_iban: cleanIban, bank_name: bankName }).eq('id', user.id);
            if (error) throw error;
            Alert.alert('Uložené', 'Bankový účet bol uložený', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e) {
            console.error('Error saving bank data:', e);
            Alert.alert('Chyba', 'Nepodarilo sa uložiť údaje');
        } finally {
            setSaving(false);
        }
    };

    const cleanIban = iban.replace(/\s/g, '');
    const isValid = isValidSKIBAN(cleanIban) && bankName.length > 0;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={22} color={C.text} strokeWidth={2} />
                    </ClaySurface>
                </Pressable>
                <Text style={styles.headerTitle}>Bankový účet</Text>
                <View style={{ width: 42 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Info Card */}
                    <ClaySurface radius={18} style={{ marginBottom: 26 }} contentStyle={styles.infoCard}>
                        <ClayIconBox size={44} radius={14} style={{ marginRight: 12 }}><Landmark size={22} color={C.accent} strokeWidth={2} /></ClayIconBox>
                        <Text style={styles.infoText}>Pridaj bankový účet pre výber peňazí z peňaženky. Údaje sú bezpečne uložené.</Text>
                    </ClaySurface>

                    {/* Bank Name */}
                    <Text style={styles.label}>Banka</Text>
                    <Pressable onPress={() => setShowBankPicker(!showBankPicker)}>
                        <ClayInset radius={14} contentStyle={styles.dropdown}>
                            <Text style={[styles.dropdownText, !bankName && { color: C.muted }]}>{bankName || 'Vyber banku'}</Text>
                            <ChevronDown size={20} color={C.muted} strokeWidth={2} />
                        </ClayInset>
                    </Pressable>

                    {showBankPicker && (
                        <ClaySurface radius={14} style={{ marginTop: 8 }}>
                            {SK_BANKS.map((bank, i) => {
                                const active = bankName === bank;
                                return (
                                    <React.Fragment key={bank}>
                                        {i > 0 && <View style={{ height: 1, backgroundColor: C.hair, marginLeft: 16 }} />}
                                        <Pressable style={[styles.pickerItem, active && { backgroundColor: C.accentDim }]} onPress={() => { setBankName(bank); setShowBankPicker(false); }}>
                                            <Text style={[styles.pickerItemText, { color: active ? C.accent : C.text, fontWeight: active ? '800' : '600' }]}>{bank}</Text>
                                            {active && <Check size={18} color={C.accent} strokeWidth={2.6} />}
                                        </Pressable>
                                    </React.Fragment>
                                );
                            })}
                        </ClaySurface>
                    )}

                    {/* IBAN Input */}
                    <Text style={[styles.label, { marginTop: 24 }]}>IBAN</Text>
                    <ClayInset radius={14}>
                        <TextInput
                            style={styles.input}
                            value={iban}
                            onChangeText={handleIBANChange}
                            placeholder="SK89 0900 0000 0000 0000 0000"
                            placeholderTextColor={C.muted}
                            autoCapitalize="characters"
                            maxLength={29}
                            keyboardType="default"
                        />
                    </ClayInset>
                    {cleanIban.length > 0 && (
                        <Text style={[styles.validationText, { color: isValidSKIBAN(cleanIban) ? C.green : C.red }]}>
                            {isValidSKIBAN(cleanIban) ? '✓ Platný IBAN' : `${cleanIban.length}/24 znakov${!cleanIban.startsWith('SK') ? ' • musí začínať SK' : ''}`}
                        </Text>
                    )}

                    {/* Save Button */}
                    <Pressable onPress={handleSave} disabled={!isValid || saving} style={({ pressed }) => [styles.saveWrap, Platform.select({
                        ios: { shadowColor: C.accentShadow.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: isValid ? C.accentShadow.opacity : 0, shadowRadius: 14 },
                        android: { elevation: isValid ? 6 : 0 },
                    }), { opacity: !isValid ? 0.45 : pressed ? 0.9 : 1 }]}>
                        <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.saveButton}>
                            <LinearGradient colors={['rgba(255,255,255,0.28)', 'transparent']} style={styles.saveSheen} />
                            <Text style={styles.saveButtonText}>{saving ? 'Ukladám...' : 'Uložiť účet'}</Text>
                        </LinearGradient>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const makeStyles = (C: ClayColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
    content: { flex: 1, paddingHorizontal: 20 },
    infoCard: { flexDirection: 'row', padding: 16, alignItems: 'center' },
    infoText: { flex: 1, fontSize: 13.5, color: C.muted, lineHeight: 20, fontWeight: '500' },
    label: { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 8, letterSpacing: -0.2 },
    dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    dropdownText: { fontSize: 15, color: C.text, fontWeight: '600' },
    pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    pickerItemText: { fontSize: 15 },
    input: { padding: 16, fontSize: 17, fontWeight: '600', color: C.text, letterSpacing: 1 },
    validationText: { fontSize: 13, marginTop: 8, fontWeight: '700' },
    saveWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 32, marginBottom: 40 },
    saveButton: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', overflow: 'hidden' },
    saveSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
    saveButtonText: { fontSize: 15.5, fontWeight: '800', color: C.onAccent },
});
