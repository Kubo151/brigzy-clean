import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const SK_BANKS = [
    'Slovenská sporiteľňa',
    'VÚB banka',
    'Tatra banka',
    'ČSOB',
    'mBank',
    'Fio banka',
    'UniCredit Bank',
    'Poštová banka',
    'Prima banka',
    '365.bank',
    'Iná banka',
];



// Format IBAN with spaces every 4 chars
const formatIBAN = (value: string): string => {
    const clean = value.replace(/\s/g, '').toUpperCase();
    return clean.replace(/(.{4})/g, '$1 ').trim();
};

// Validate SK IBAN (basic: starts SK, 24 chars)
const isValidSKIBAN = (iban: string): boolean => {
    const clean = iban.replace(/\s/g, '');
    return /^SK\d{22}$/.test(clean);
};

export default function BankAccountScreen() {
    const [iban, setIban] = useState('');
    const [bankName, setBankName] = useState('');
    const [showBankPicker, setShowBankPicker] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSavedData();
    }, []);

    const loadSavedData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('users')
                .select('bank_iban, bank_name')
                .eq('id', user.id)
                .single();

            if (data?.bank_iban) setIban(formatIBAN(data.bank_iban));
            if (data?.bank_name) setBankName(data.bank_name);
        } catch (e) {
            console.error('Error loading bank data:', e);
        }
    };

    const handleIBANChange = (text: string) => {
        // Only allow alphanumeric
        const clean = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (clean.length <= 24) {
            setIban(formatIBAN(clean));
        }
    };

    const handleSave = async () => {
        const cleanIban = iban.replace(/\s/g, '');
        if (!isValidSKIBAN(cleanIban)) {
            Alert.alert('Neplatný IBAN', 'Zadaj platný slovenský IBAN (SK + 22 číslic)');
            return;
        }
        if (!bankName) {
            Alert.alert('Chýba banka', 'Vyber svoju banku');
            return;
        }

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('users')
                .update({ bank_iban: cleanIban, bank_name: bankName })
                .eq('id', user.id);

            if (error) throw error;

            Alert.alert('Uložené', 'Bankový účet bol uložený', [
                { text: 'OK', onPress: () => router.back() }
            ]);
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
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#F4F4F8" />
                </Pressable>
                <Text style={styles.headerTitle}>Bankový účet</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoIcon}>🏦</Text>
                        <Text style={styles.infoText}>
                            Pridaj bankový účet pre výber peňazí z peňaženky. Údaje sú bezpečne uložené.
                        </Text>
                    </View>

                    {/* Bank Name */}
                    <Text style={styles.label}>Banka</Text>
                    <Pressable
                        style={styles.dropdown}
                        onPress={() => setShowBankPicker(!showBankPicker)}
                    >
                        <Text style={[
                            styles.dropdownText,
                            !bankName && styles.dropdownPlaceholder
                        ]}>
                            {bankName || 'Vyber banku'}
                        </Text>
                        <ChevronDown size={20} color="#A1A1AA" />
                    </Pressable>

                    {showBankPicker && (
                        <View style={styles.pickerContainer}>
                            {SK_BANKS.map((bank) => (
                                <Pressable
                                    key={bank}
                                    style={[
                                        styles.pickerItem,
                                        bankName === bank && styles.pickerItemActive
                                    ]}
                                    onPress={() => {
                                        setBankName(bank);
                                        setShowBankPicker(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.pickerItemText,
                                        bankName === bank && styles.pickerItemTextActive
                                    ]}>
                                        {bank}
                                    </Text>
                                    {bankName === bank && (
                                        <Check size={18} color="#7c3aed" />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {/* IBAN Input */}
                    <Text style={[styles.label, { marginTop: 24 }]}>IBAN</Text>
                    <TextInput
                        style={styles.input}
                        value={iban}
                        onChangeText={handleIBANChange}
                        placeholder="SK89 0900 0000 0000 0000 0000"
                        placeholderTextColor="#52525B"
                        autoCapitalize="characters"
                        maxLength={29} // 24 chars + 5 spaces
                        keyboardType="default"
                    />
                    {cleanIban.length > 0 && (
                        <Text style={[
                            styles.validationText,
                            { color: isValidSKIBAN(cleanIban) ? '#22C55E' : '#EF4444' }
                        ]}>
                            {isValidSKIBAN(cleanIban)
                                ? '✓ Platný IBAN'
                                : `${cleanIban.length}/24 znakov${!cleanIban.startsWith('SK') ? ' • musí začínať SK' : ''}`
                            }
                        </Text>
                    )}

                    {/* Save Button */}
                    <Pressable
                        style={[
                            styles.saveButton,
                            !isValid && styles.saveButtonDisabled
                        ]}
                        onPress={handleSave}
                        disabled={!isValid || saving}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving ? 'Ukladám...' : 'Uložiť účet'}
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#141420',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F4F4F8',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#1e1e2e',
        borderRadius: 12,
        padding: 16,
        marginBottom: 28,
        alignItems: 'center',
    },
    infoIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#A1A1AA',
        lineHeight: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F4F4F8',
        marginBottom: 8,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1e1e2e',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2A2A3A',
    },
    dropdownText: {
        fontSize: 15,
        color: '#F4F4F8',
    },
    dropdownPlaceholder: {
        color: '#52525B',
    },
    pickerContainer: {
        backgroundColor: '#1e1e2e',
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#2A2A3A',
        overflow: 'hidden',
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A3A',
    },
    pickerItemActive: {
        backgroundColor: '#7c3aed15',
    },
    pickerItemText: {
        fontSize: 15,
        color: '#A1A1AA',
    },
    pickerItemTextActive: {
        color: '#F4F4F8',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#1e1e2e',
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        fontWeight: '500',
        color: '#F4F4F8',
        letterSpacing: 1,
        borderWidth: 1,
        borderColor: '#2A2A3A',
    },
    validationText: {
        fontSize: 13,
        marginTop: 8,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#7c3aed',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 40,
    },
    saveButtonDisabled: {
        backgroundColor: '#3F3F46',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});
