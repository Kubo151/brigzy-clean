import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, ScrollView, Pressable, FlatList, Modal, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell, Hourglass, CheckCircle, Building2, Plus, ChevronRight, Wallet as WalletIcon, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useClay } from '@/lib/useClay';
import type { ClayColors } from '@/lib/useClay';
import { goBack } from '@/lib/nav';

const PRESET_AMOUNTS = [20, 50, 100];

type TxItem = {
    id: string;
    title: string;
    company: string;
    date: string;
    amount: number; // EUR, signed
    status: 'pending' | 'cleared' | 'withdrawn';
};

type LedgerRow = {
    id: string;
    entry_type: 'credit' | 'debit' | 'payout' | 'fee' | 'adjustment';
    amount_cents: number;
    description: string | null;
    created_at: string;
    booking: { job: { title: string | null; company_name: string | null } | null } | null;
};

type PendingBooking = {
    id: string;
    agreed_amount_cents: number;
    created_at: string;
    job: { title: string | null; company_name: string | null } | null;
};

const formatTxDate = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'dnes';
    return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' });
};

const maskIBAN = (iban: string): string => {
    const clean = iban.replace(/\s/g, '');
    if (clean.length < 8) return iban;
    const first = clean.slice(0, 4);
    const last = clean.slice(-4);
    const middleLen = clean.length - 8;
    const masked = '•'.repeat(middleLen);
    return first + ' ' + masked.replace(/(.{4})/g, '$1 ').trim() + ' ' + last;
};

export default function WalletScreen() {
    const C = useClay();
    const styles = useMemo(() => makeStyles(C), [C]);
    const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [savedIBAN, setSavedIBAN] = useState<string | null>(null);
    const [savedBankName, setSavedBankName] = useState<string | null>(null);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [thisMonthTotal, setThisMonthTotal] = useState(0);
    const [thisMonthJobs, setThisMonthJobs] = useState(0);
    const [transactions, setTransactions] = useState<TxItem[]>([]);

    useFocusEffect(useCallback(() => { loadBankData(); loadWallet(); }, []));

    const loadWallet = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [ledgerRes, pendingRes] = await Promise.all([
                supabase
                    .from('wallet_ledger')
                    .select('id, entry_type, amount_cents, description, created_at, booking:ref_booking_id(job:job_id(title, company_name))')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('bookings')
                    .select('id, agreed_amount_cents, created_at, job:job_id(title, company_name)')
                    .eq('worker_user_id', user.id)
                    .in('status', ['awaiting_signatures', 'in_progress', 'completed']),
            ]);

            const ledger = (ledgerRes.data ?? []) as unknown as LedgerRow[];
            const pendingBookings = (pendingRes.data ?? []) as unknown as PendingBooking[];

            // Ledger amounts are stored signed: credits positive, payouts/debits/fees negative.
            setAvailableBalance(ledger.reduce((sum, r) => sum + r.amount_cents, 0) / 100);
            setPendingAmount(pendingBookings.reduce((sum, b) => sum + b.agreed_amount_cents, 0) / 100);
            setPendingCount(pendingBookings.length);

            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            const monthCredits = ledger.filter(
                (r) => r.entry_type === 'credit' && new Date(r.created_at) >= monthStart,
            );
            setThisMonthTotal(monthCredits.reduce((sum, r) => sum + r.amount_cents, 0) / 100);
            setThisMonthJobs(monthCredits.length);

            const pendingTx: TxItem[] = pendingBookings.map((b) => ({
                id: `pending-${b.id}`,
                title: b.job?.title || 'Brigáda',
                company: b.job?.company_name || 'Brigzy',
                date: formatTxDate(b.created_at),
                amount: b.agreed_amount_cents / 100,
                status: 'pending',
            }));
            const ledgerTx: TxItem[] = ledger.map((r) => ({
                id: r.id,
                title: r.entry_type === 'payout'
                    ? 'Výber na účet'
                    : r.booking?.job?.title || r.description || 'Transakcia',
                company: r.entry_type === 'payout'
                    ? (r.description || 'Bankový účet')
                    : r.booking?.job?.company_name || 'Brigzy',
                date: formatTxDate(r.created_at),
                amount: r.amount_cents / 100,
                status: r.amount_cents < 0 ? 'withdrawn' : 'cleared',
            }));
            setTransactions([...pendingTx, ...ledgerTx].slice(0, 5));
        } catch (e) {
            console.error('Error loading wallet:', e);
        }
    };

    const loadBankData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('users').select('bank_iban, bank_name').eq('id', user.id).single();
            if (data) {
                setSavedIBAN(data.bank_iban || null);
                setSavedBankName(data.bank_name || null);
            }
        } catch (e) {
            console.error('Error loading bank data:', e);
        }
    };

    const handleWithdraw = () => setWithdrawalModalVisible(true);
    const handleConfirmWithdrawal = () => {
        console.log('Withdrawing:', selectedAmount);
        setWithdrawalModalVisible(false);
        setSelectedAmount(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return C.star;
            case 'cleared': return C.green;
            case 'withdrawn': return C.red;
            default: return C.muted;
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

    const renderTransaction = ({ item }: { item: TxItem }) => {
        const StatusIcon = getStatusIcon(item.status);
        const isNegative = item.amount < 0;
        return (
            <View style={styles.transactionItem}>
                <View style={[styles.transactionIcon, { backgroundColor: getStatusColor(item.status) + '22' }]}>
                    <StatusIcon size={20} color={getStatusColor(item.status)} strokeWidth={2} />
                </View>
                <View style={styles.transactionContent}>
                    <Text style={styles.transactionTitle}>{item.title}</Text>
                    <Text style={styles.transactionSubtitle}>{item.company} • {item.date}</Text>
                </View>
                <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: isNegative ? C.red : C.green }]}>
                        {isNegative ? '−' : '+'}€{Math.abs(item.amount).toFixed(2)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusText(item.status)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={styles.iconBtn}>
                    <ArrowLeft size={22} color={C.text} strokeWidth={2} />
                </Pressable>
                <Text style={styles.headerTitle}>Peňaženka</Text>
                <Pressable style={styles.iconBtn}>
                    <Bell size={22} color={C.text} strokeWidth={2} />
                </Pressable>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Balance Card */}
                <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.balanceCard}>
                    <LinearGradient colors={['rgba(255,255,255,0.22)', 'transparent']} style={styles.balanceSheen} />
                    <View style={styles.balanceBadge}>
                        <View style={styles.badgeDot} />
                        <Text style={styles.badgeText}>Dostupné prostriedky</Text>
                    </View>
                    <View style={styles.balanceAmount}>
                        <Text style={styles.currencySymbol}>€</Text>
                        <Text style={styles.balanceMain}>{Math.floor(availableBalance)}</Text>
                        <Text style={styles.balanceCents}>.{(availableBalance % 1).toFixed(2).slice(2)}</Text>
                    </View>
                    {pendingAmount > 0 ? (
                        <View style={styles.pendingRow}>
                            <View style={styles.pendingDot} />
                            <Text style={styles.pendingText}>€{pendingAmount.toFixed(2)} čaká na potvrdenie brigády</Text>
                        </View>
                    ) : (
                        <View style={{ marginBottom: 20 }} />
                    )}
                    <View style={styles.balanceButtons}>
                        <Pressable style={styles.withdrawButton} onPress={handleWithdraw}>
                            <WalletIcon size={17} color={C.accent} strokeWidth={2.2} />
                            <Text style={styles.withdrawButtonText}>Vybrať peniaze</Text>
                        </Pressable>
                        <Pressable style={styles.historyButton} onPress={() => router.push('/wallet/history')}>
                            <Text style={styles.historyButtonText}>História</Text>
                        </Pressable>
                    </View>
                </LinearGradient>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: C.accentDim }]}><WalletIcon size={18} color={C.accent} strokeWidth={2} /></View>
                        <Text style={styles.statLabel}>Tento mesiac</Text>
                        <Text style={styles.statValue}>€{thisMonthTotal}</Text>
                        <Text style={styles.statSubtext}>{thisMonthJobs} brigády hotové</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: C.star + '22' }]}><Clock size={18} color={C.star} strokeWidth={2} /></View>
                        <Text style={styles.statLabel}>Čakajúce</Text>
                        <Text style={styles.statValue}>€{pendingAmount.toFixed(0)}</Text>
                        <Text style={styles.statSubtext}>{pendingCount === 1 ? '1 prebieha' : `${pendingCount} prebieha`}</Text>
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
                        data={transactions}
                        renderItem={renderTransaction}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        ListEmptyComponent={
                            <Text style={{ color: C.muted, fontSize: 13.5, fontWeight: '500', textAlign: 'center', paddingVertical: 24 }}>
                                Zatiaľ žiadne transakcie
                            </Text>
                        }
                    />
                </View>
            </ScrollView>

            {/* Withdrawal Modal */}
            <Modal visible={withdrawalModalVisible} transparent animationType="slide" onRequestClose={() => setWithdrawalModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setWithdrawalModalVisible(false)}>
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
                                <Pressable key={amount} style={[styles.presetButton, selectedAmount === amount && styles.presetButtonActive]} onPress={() => setSelectedAmount(amount)}>
                                    <Text style={[styles.presetButtonText, selectedAmount === amount && styles.presetButtonTextActive]}>€{amount}</Text>
                                </Pressable>
                            ))}
                            <Pressable style={[styles.presetButton, selectedAmount === availableBalance && styles.presetButtonActive]} onPress={() => setSelectedAmount(availableBalance)}>
                                <Text style={[styles.presetButtonText, selectedAmount === availableBalance && styles.presetButtonTextActive]}>Všetko</Text>
                            </Pressable>
                        </View>

                        {savedIBAN ? (
                            <Pressable style={styles.bankAccountRow} onPress={() => { setWithdrawalModalVisible(false); router.push('/wallet/bank-account'); }}>
                                <Building2 size={20} color={C.muted} strokeWidth={2} />
                                <View style={styles.bankAccountInfo}>
                                    <Text style={styles.bankAccountLabel}>{savedBankName || 'Bankový účet'}</Text>
                                    <Text style={styles.bankAccountNumber}>{maskIBAN(savedIBAN)}</Text>
                                </View>
                                <ChevronRight size={18} color={C.muted} strokeWidth={2} />
                            </Pressable>
                        ) : (
                            <Pressable style={styles.addBankButton} onPress={() => { setWithdrawalModalVisible(false); router.push('/wallet/bank-account'); }}>
                                <Plus size={20} color={C.accent} strokeWidth={2.4} />
                                <Text style={styles.addBankText}>Pridať bankový účet</Text>
                            </Pressable>
                        )}

                        <Pressable style={[styles.confirmButton, (!selectedAmount || !savedIBAN) && styles.confirmButtonDisabled]} onPress={handleConfirmWithdrawal} disabled={!selectedAmount || !savedIBAN}>
                            <Text style={styles.confirmButtonText}>
                                {!savedIBAN ? 'Najprv pridaj bankový účet' : selectedAmount ? `Potvrdiť výber €${selectedAmount.toFixed(2)}` : 'Vyber sumu'}
                            </Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const makeStyles = (C: ClayColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 19, fontWeight: '800', color: C.text, letterSpacing: -0.4 },
    content: { flex: 1, paddingHorizontal: 20 },
    balanceCard: { borderRadius: 24, padding: 24, marginBottom: 18, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: C.accentShadow.color, shadowOffset: { width: 0, height: 10 }, shadowOpacity: C.accentShadow.opacity, shadowRadius: 20 }, android: { elevation: 8 } }) },
    balanceSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%' },
    balanceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 16 },
    badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.onAccent, marginRight: 6 },
    badgeText: { fontSize: 11.5, color: C.onAccent, fontWeight: '700' },
    balanceAmount: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    currencySymbol: { fontSize: 30, fontWeight: '800', color: C.onAccent, marginTop: 6 },
    balanceMain: { fontSize: 56, fontWeight: '800', color: C.onAccent, lineHeight: 60, letterSpacing: -1 },
    balanceCents: { fontSize: 30, fontWeight: '800', color: C.onAccent, marginTop: 6 },
    pendingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD60A', marginRight: 8 },
    pendingText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
    balanceButtons: { flexDirection: 'row', gap: 12 },
    withdrawButton: { flex: 1, flexDirection: 'row', gap: 7, backgroundColor: '#FFF', paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    withdrawButtonText: { fontSize: 14.5, fontWeight: '800', color: C.accent },
    historyButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    historyButtonText: { fontSize: 14.5, fontWeight: '800', color: '#FFF' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
    statCard: { flex: 1, backgroundColor: C.cHi, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.hair, ...Platform.select({ ios: { shadowColor: C.darkShadow.color, shadowOffset: { width: 3, height: 4 }, shadowOpacity: C.darkShadow.opacity * 0.7, shadowRadius: 9 }, android: { elevation: 2 } }) },
    statIconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statLabel: { fontSize: 12.5, color: C.muted, marginBottom: 4, fontWeight: '600' },
    statValue: { fontSize: 23, fontWeight: '800', color: C.text, marginBottom: 4, letterSpacing: -0.5 },
    statSubtext: { fontSize: 11.5, color: C.muted, fontWeight: '500' },
    transactionsSection: { marginBottom: 24 },
    transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    transactionsTitle: { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
    viewAllText: { fontSize: 13, color: C.accent, fontWeight: '700' },
    transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cHi, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.hair },
    transactionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    transactionContent: { flex: 1 },
    transactionTitle: { fontSize: 14.5, fontWeight: '700', color: C.text, marginBottom: 3 },
    transactionSubtitle: { fontSize: 12.5, color: C.muted, fontWeight: '500' },
    transactionRight: { alignItems: 'flex-end' },
    transactionAmount: { fontSize: 15.5, fontWeight: '800', marginBottom: 4 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
    statusText: { fontSize: 10.5, fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
    modalHandle: { width: 40, height: 4, backgroundColor: C.hair, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 21, fontWeight: '800', color: C.text, marginBottom: 20, letterSpacing: -0.4 },
    modalBalance: { backgroundColor: C.cHi, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: C.hair },
    modalBalanceLabel: { fontSize: 12.5, color: C.muted, marginBottom: 4, fontWeight: '600' },
    modalBalanceAmount: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    modalSectionTitle: { fontSize: 14.5, fontWeight: '800', color: C.text, marginBottom: 12 },
    presetButtons: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    presetButton: { flex: 1, backgroundColor: C.cHi, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: C.hair },
    presetButtonActive: { backgroundColor: C.accentDim, borderColor: C.accent },
    presetButtonText: { fontSize: 14.5, fontWeight: '700', color: C.muted },
    presetButtonTextActive: { color: C.accent },
    bankAccountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cHi, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: C.hair },
    bankAccountInfo: { flex: 1, marginLeft: 12 },
    bankAccountLabel: { fontSize: 12.5, color: C.muted, marginBottom: 2, fontWeight: '600' },
    bankAccountNumber: { fontSize: 14.5, fontWeight: '700', color: C.text },
    addBankButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.accentDim, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: C.accent, borderStyle: 'dashed', gap: 8 },
    addBankText: { fontSize: 14.5, fontWeight: '800', color: C.accent },
    confirmButton: { backgroundColor: C.accent, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    confirmButtonDisabled: { backgroundColor: C.hair },
    confirmButtonText: { fontSize: 15.5, fontWeight: '800', color: C.onAccent },
});
