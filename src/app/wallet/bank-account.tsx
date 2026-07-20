import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, TextInput, Pressable, ScrollView, StyleSheet,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Check, Landmark } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useFlint, RADIUS } from '@/lib/useFlint';
import type { FlintColors } from '@/lib/useFlint';
import { Button, Divider } from '@/components/ui';
import { goBack } from '@/lib/nav';
import { showAlert } from '@/lib/notify';

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
    const C = useFlint();
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
            showAlert('Neplatný IBAN', 'Zadaj platný slovenský IBAN (SK + 22 číslic)');
            return;
        }
        if (!bankName) { showAlert('Chýba banka', 'Vyber svoju banku'); return; }
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            const { error } = await supabase
                .from('users').update({ bank_iban: cleanIban, bank_name: bankName }).eq('id', user.id);
            if (error) throw error;
            showAlert('Uložené', 'Bankový účet bol uložený', [{ text: 'OK', onPress: () => goBack() }]);
        } catch (e) {
            console.error('Error saving bank data:', e);
            showAlert('Chyba', 'Nepodarilo sa uložiť údaje');
        } finally {
            setSaving(false);
        }
    };

    const cleanIban = iban.replace(/\s/g, '');
    const isValid = isValidSKIBAN(cleanIban) && bankName.length > 0;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <View style={styles.backBtn}>
                        <ArrowLeft size={22} color={C.text} strokeWidth={2} />
                    </View>
                </Pressable>
                <Text style={styles.headerTitle}>Bankový účet</Text>
                <View style={{ width: 42 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoIcon}><Landmark size={22} color={C.accent} strokeWidth={2} /></View>
                        <Text style={styles.infoText}>Pridaj bankový účet pre výber peňazí z peňaženky. Údaje sú bezpečne uložené.</Text>
                    </View>

                    {/* Bank Name */}
                    <Text style={styles.label}>Banka</Text>
                    <Pressable onPress={() => setShowBankPicker(!showBankPicker)}>
                        <View style={styles.dropdown}>
                            <Text style={[styles.dropdownText, !bankName && { color: C.muted }]}>{bankName || 'Vyber banku'}</Text>
                            <ChevronDown size={20} color={C.muted} strokeWidth={2} />
                        </View>
                    </Pressable>

                    {showBankPicker && (
                        <View style={styles.pickerCard}>
                            {SK_BANKS.map((bank, i) => {
                                const active = bankName === bank;
                                return (
                                    <React.Fragment key={bank}>
                                        {i > 0 && <Divider />}
                                        <Pressable style={[styles.pickerItem, active && { backgroundColor: C.accentDim }]} onPress={() => { setBankName(bank); setShowBankPicker(false); }}>
                                            <Text style={[styles.pickerItemText, { color: active ? C.accent : C.text, fontWeight: active ? '700' : '600' }]}>{bank}</Text>
                                            {active && <Check size={18} color={C.accent} strokeWidth={2.6} />}
                                        </Pressable>
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    )}

                    {/* IBAN Input */}
                    <Text style={[styles.label, { marginTop: 24 }]}>IBAN</Text>
                    <View style={styles.ibanField}>
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
                    </View>
                    {cleanIban.length > 0 && (
                        <Text style={[styles.validationText, { color: isValidSKIBAN(cleanIban) ? C.green : C.red }]}>
                            {isValidSKIBAN(cleanIban) ? '✓ Platný IBAN' : `${cleanIban.length}/24 znakov${!cleanIban.startsWith('SK') ? ' • musí začínať SK' : ''}`}
                        </Text>
                    )}

                    {/* Save Button */}
                    <Button
                        label={saving ? 'Ukladám...' : 'Uložiť účet'}
                        onPress={handleSave}
                        disabled={!isValid || saving}
                        style={{ marginTop: 32, marginBottom: 40 }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const makeStyles = (C: FlintColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card2 },
    headerTitle: { fontSize: 17, fontWeight: '600', color: C.text },
    content: { flex: 1, paddingHorizontal: 20 },
    infoCard: { flexDirection: 'row', padding: 16, alignItems: 'center', backgroundColor: C.card, borderRadius: RADIUS.lg, marginBottom: 26 },
    infoIcon: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: C.accentDim, marginRight: 12 },
    infoText: { flex: 1, fontSize: 13.5, color: C.muted, lineHeight: 20, fontWeight: '500' },
    label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
    dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: C.card2, borderRadius: RADIUS.md },
    dropdownText: { fontSize: 15, color: C.text, fontWeight: '600' },
    pickerCard: { marginTop: 8, backgroundColor: C.card, borderRadius: RADIUS.md, overflow: 'hidden' },
    pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    pickerItemText: { fontSize: 15 },
    ibanField: { backgroundColor: C.card2, borderRadius: RADIUS.md },
    input: { padding: 16, fontSize: 17, fontWeight: '600', color: C.text, letterSpacing: 1 },
    validationText: { fontSize: 13, marginTop: 8, fontWeight: '700' },
});
