import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    FlatList,
    Modal,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell, Hourglass, CheckCircle, Building2, Plus, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/lib/useColors';
import type { AppColors } from '@/lib/useColors';

// Mock data
const MOCK_TRANSACTIONS = [
    {
        id: '1',
        title: 'Pomocník v sklade',
        company: 'Logistika SK',
        date: 'dnes',
        amount: 40.00,
        status: 'pending' as const,
    },
    {
        id: '2',
        title: 'Brigáda — kaviareň',
        company: 'Café Modrý Kameň',
        date: '5. feb',
        amount: 67.50,
        status: 'cleared' as const,
    },
    {
        id: '3',
        title: 'Výber na účet',
        company: 'IBAN •••• 4821',
        date: '3. feb',
        amount: -60.00,
        status: 'withdrawn' as const,
    },
];

const PRESET_AMOUNTS = [20, 50, 100];

// Mask IBAN: show first 4 and last 4, mask the rest
const maskIBAN = (iban: string): string => {
    const clean = iban.replace(/\s/g, '');
    if (clean.length < 8) return iban;
    const first = clean.slice(0, 4);
    const last = clean.slice(-4);
    const middleLen = clean.length - 8;
    const masked = '•'.repeat(middleLen);
    // Format with spaces
    const full = first + ' ' + masked.replace(/(.{4})/g, '$1 ').trim() + ' ' + last;
    return full;
};

export default function WalletScreen() {
    const C = useColors();
    const styles = useMemo(() => makeStyles(C), [C]);
    const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [savedIBAN, setSavedIBAN] = useState<string | null>(null);
    const [savedBankName, setSavedBankName] = useState<string | null>(null);

    const availableBalance = 127.50;
    const pendingAmount = 40.00;
    const thisMonthTotal = 215;
    const thisMonthJobs = 3;

    // Reload IBAN every time screen is focused (e.g. coming back from bank-account)
    useFocusEffect(
        useCallback(() => {
            loadBankData();
        }, [])
    );

    const loadBankData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('users')
                .select('bank_iban, bank_name')
                .eq('id', user.id)
                .single();

            if (data) {
                setSavedIBAN(data.bank_iban || null);
                setSavedBankName(data.bank_name || null);
            }
        } catch (e) {
            console.error('Error loading bank data:', e);
        }
    };

    const handleWithdraw = () => {
        setWithdrawalModalVisible(true);
    };

    const handleConfirmWithdrawal = () => {
        // TODO: Implement withdrawal logic with Supabase
        console.log('Withdrawing:', selectedAmount);
        setWithdrawalModalVisible(false);
        setSelectedAmount(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#EAB308';
            case 'cleared': return '#22C55E';
            case 'withdrawn': return '#EF4444';
            default: return '#A1A1AA';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Čaká';
            case 'cleared': return 'Pripísané';
            case 'withdrawn': return 'Vybrané';
            default: return '';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return Hourglass;
            case 'cleared': return CheckCircle;
            case 'withdrawn': return Building2;
            default: return CheckCircle;
        }
    };

    const renderTransaction = ({ item }: { item: typeof MOCK_TRANSACTIONS[0] }) => {
        const StatusIcon = getStatusIcon(item.status);
        const isNegative = item.amount < 0;

        return (
            <View style={styles.transactionItem}>
                <View style={[styles.transactionIcon, { backgroundColor: C.surface2 }]}>
                    <StatusIcon size={20} color={getStatusColor(item.status)} />
                </View>
                <View style={styles.transactionContent}>
                    <Text style={styles.transactionTitle}>{item.title}</Text>
                    <Text style={styles.transactionSubtitle}>{item.company} • {item.date}</Text>
                </View>
                <View style={styles.transactionRight}>
                    <Text style={[
                        styles.transactionAmount,
                        { color: isNegative ? '#EF4444' : '#22C55E' }
                    ]}>
                        {isNegative ? '' : '+'}€{Math.abs(item.amount).toFixed(2)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {getStatusText(item.status)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={C.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Peňaženka</Text>
                <Pressable style={styles.notificationButton}>
                    <Bell size={24} color={C.text} />
                </Pressable>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <LinearGradient
                    colors={['#7c3aed', '#a855f7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <View style={styles.balanceBadge}>
                        <View style={styles.badgeDot} />
                        <Text style={styles.badgeText}>Dostupné prostriedky</Text>
                    </View>

                    <View style={styles.balanceAmount}>
                        <Text style={styles.currencySymbol}>€</Text>
                        <Text style={styles.balanceMain}>{Math.floor(availableBalance)}</Text>
                        <Text style={styles.balanceCents}>.{(availableBalance % 1).toFixed(2).slice(2)}</Text>
                    </View>

                    <View style={styles.pendingRow}>
                        <View style={styles.pendingDot} />
                        <Text style={styles.pendingText}>
                            €{pendingAmount.toFixed(2)} čaká na potvrdenie brigády
                        </Text>
                    </View>

                    <View style={styles.balanceButtons}>
                        <Pressable style={styles.withdrawButton} onPress={handleWithdraw}>
                            <Text style={styles.withdrawButtonText}>💸 Vybrať peniaze</Text>
                        </Pressable>
                        <Pressable
                            style={styles.historyButton}
                            onPress={() => router.push('/wallet/history')}
                        >
                            <Text style={styles.historyButtonText}>História</Text>
                        </Pressable>
                    </View>
                </LinearGradient>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>💜</Text>
                        <Text style={styles.statLabel}>Tento mesiac</Text>
                        <Text style={styles.statValue}>€{thisMonthTotal}</Text>
                        <Text style={styles.statSubtext}>{thisMonthJobs} brigády hotové</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>⏳</Text>
                        <Text style={styles.statLabel}>Čakajúce</Text>
                        <Text style={styles.statValue}>€{pendingAmount.toFixed(0)}</Text>
                        <Text style={styles.statSubtext}>1 prebieha</Text>
                    </View>
                </View>

                {/* Transactions */}
                <View style={styles.transactionsSection}>
                    <View style={styles.transactionsHeader}>
                        <Text style={styles.transactionsTitle}>Posledné transakcie</Text>
                        <Pressable onPress={() => router.push('/wallet/history')}>
                            <Text style={styles.viewAllText}>Zobraziť všetky</Text>
                        </Pressable>
                    </View>

                    <FlatList
                        data={MOCK_TRANSACTIONS}
                        renderItem={renderTransaction}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    />
                </View>
            </ScrollView>

            {/* Withdrawal Modal */}
            <Modal
                visible={withdrawalModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setWithdrawalModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setWithdrawalModalVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHandle} />

                        <Text style={styles.modalTitle}>Výber peňazí</Text>

                        <View style={styles.modalBalance}>
                            <Text style={styles.modalBalanceLabel}>Dostupné na výber</Text>
                            <Text style={styles.modalBalanceAmount}>€{availableBalance.toFixed(2)}</Text>
                        </View>

                        <Text style={styles.modalSectionTitle}>Suma na výber</Text>
                        <View style={styles.presetButtons}>
                            {PRESET_AMOUNTS.map((amount) => (
                                <Pressable
                                    key={amount}
                                    style={[
                                        styles.presetButton,
                                        selectedAmount === amount && styles.presetButtonActive
                                    ]}
                                    onPress={() => setSelectedAmount(amount)}
                                >
                                    <Text style={[
                                        styles.presetButtonText,
                                        selectedAmount === amount && styles.presetButtonTextActive
                                    ]}>
                                        €{amount}
                                    </Text>
                                </Pressable>
                            ))}
                            <Pressable
                                style={[
                                    styles.presetButton,
                                    selectedAmount === availableBalance && styles.presetButtonActive
                                ]}
                                onPress={() => setSelectedAmount(availableBalance)}
                            >
                                <Text style={[
                                    styles.presetButtonText,
                                    selectedAmount === availableBalance && styles.presetButtonTextActive
                                ]}>
                                    Všetko
                                </Text>
                            </Pressable>
                        </View>

                        {/* Bank Account Row - conditional */}
                        {savedIBAN ? (
                            <Pressable
                                style={styles.bankAccountRow}
                                onPress={() => {
                                    setWithdrawalModalVisible(false);
                                    router.push('/wallet/bank-account');
                                }}
                            >
                                <Building2 size={20} color="#A1A1AA" />
                                <View style={styles.bankAccountInfo}>
                                    <Text style={styles.bankAccountLabel}>
                                        {savedBankName || 'Bankový účet'}
                                    </Text>
                                    <Text style={styles.bankAccountNumber}>
                                        {maskIBAN(savedIBAN)}
                                    </Text>
                                </View>
                                <ChevronRight size={18} color="#52525B" />
                            </Pressable>
                        ) : (
                            <Pressable
                                style={styles.addBankButton}
                                onPress={() => {
                                    setWithdrawalModalVisible(false);
                                    router.push('/wallet/bank-account');
                                }}
                            >
                                <Plus size={20} color="#7c3aed" />
                                <Text style={styles.addBankText}>Pridať bankový účet</Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={[
                                styles.confirmButton,
                                (!selectedAmount || !savedIBAN) && styles.confirmButtonDisabled
                            ]}
                            onPress={handleConfirmWithdrawal}
                            disabled={!selectedAmount || !savedIBAN}
                        >
                            <Text style={styles.confirmButtonText}>
                                {!savedIBAN
                                    ? 'Najprv pridaj bankový účet'
                                    : selectedAmount
                                        ? `Potvrdiť výber €${selectedAmount.toFixed(2)}`
                                        : 'Vyber sumu'
                                }
                            </Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
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
        color: C.text,
    },
    notificationButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    balanceCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
    },
    balanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFF',
        marginRight: 6,
    },
    badgeText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '500',
    },
    balanceAmount: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 4,
    },
    balanceMain: {
        fontSize: 64,
        fontWeight: '700',
        color: '#FFF',
        lineHeight: 64,
    },
    balanceCents: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 4,
    },
    pendingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    pendingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EAB308',
        marginRight: 8,
    },
    pendingText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    balanceButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    withdrawButton: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    withdrawButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#7c3aed',
    },
    historyButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    historyButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 16,
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 13,
        color: C.muted,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: C.text,
        marginBottom: 4,
    },
    statSubtext: {
        fontSize: 12,
        color: C.muted,
    },
    transactionsSection: {
        marginBottom: 24,
    },
    transactionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    transactionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: C.text,
    },
    viewAllText: {
        fontSize: 14,
        color: '#7c3aed',
        fontWeight: '500',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 12,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    transactionContent: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: C.text,
        marginBottom: 4,
    },
    transactionSubtitle: {
        fontSize: 13,
        color: C.muted,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: C.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: C.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: C.text,
        marginBottom: 20,
    },
    modalBalance: {
        backgroundColor: C.bg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    modalBalanceLabel: {
        fontSize: 13,
        color: C.muted,
        marginBottom: 4,
    },
    modalBalanceAmount: {
        fontSize: 28,
        fontWeight: '700',
        color: C.text,
    },
    modalSectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: C.text,
        marginBottom: 12,
    },
    presetButtons: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    presetButton: {
        flex: 1,
        backgroundColor: C.bg,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    presetButtonActive: {
        backgroundColor: '#7c3aed',
        borderColor: '#a855f7',
    },
    presetButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: C.muted,
    },
    presetButtonTextActive: {
        color: '#FFF',
    },
    bankAccountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.bg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    bankAccountInfo: {
        flex: 1,
        marginLeft: 12,
    },
    bankAccountLabel: {
        fontSize: 13,
        color: C.muted,
        marginBottom: 2,
    },
    bankAccountNumber: {
        fontSize: 15,
        fontWeight: '500',
        color: C.text,
    },
    addBankButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.bg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#7c3aed',
        borderStyle: 'dashed',
        gap: 8,
    },
    addBankText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#7c3aed',
    },
    confirmButton: {
        backgroundColor: '#7c3aed',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: C.border,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});
