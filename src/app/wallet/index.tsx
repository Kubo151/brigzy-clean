import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, ScrollView, Pressable, FlatList, Modal, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell, Hourglass, CheckCircle, Building2, Plus, ChevronRight, Wallet as WalletIcon, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useFlint, RADIUS } from '@/lib/useFlint';
import type { FlintColors } from '@/lib/useFlint';
import { IconButton, Button } from '@/components/ui';
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
    const C = useFlint();
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

    const renderTransaction = ({ item, index }: { item: TxItem; index: number }) => {
        const StatusIcon = getStatusIcon(item.status);
        const isNegative = item.amount < 0;
        return (
            <>
                {index > 0 && <View style={styles.txDivider} />}
                <View style={styles.transactionItem}>
                    <View style={[styles.transactionIcon, { backgroundColor: getStatusColor(item.status) + '22' }]}>
                        <StatusIcon size={18} color={getStatusColor(item.status)} strokeWidth={2} />
                    </View>
                    <View style={styles.transactionContent}>
                        <Text style={styles.transactionTitle}>{item.title}</Text>
                        <Text style={styles.transactionSubtitle}>{item.company} • {item.date}</Text>
                    </View>
                    <View style={styles.transactionRight}>
                        <Text style={[styles.transactionAmount, { color: isNegative ? C.red : C.green }]}>
                            {isNegative ? '−' : '+'}€{Math.abs(item.amount).toFixed(2)}
                        </Text>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusText(item.status)}</Text>
                    </View>
                </View>
            </>
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
                {/* Balance — giant centered number floating on bg, per Flint v3 recipe (no card behind it) */}
                <View style={styles.balanceWrap}>
                    <Text style={styles.balanceLabel}>Disponibilný zostatok</Text>
                    <View style={styles.balanceAmount}>
                        <Text style={styles.currencySymbol}>€</Text>
                        <Text style={styles.balanceMain}>{Math.floor(availableBalance)}</Text>
                        <Text style={styles.balanceCents}>.{(availableBalance % 1).toFixed(2).slice(2)}</Text>
                    </View>
                    {pendingAmount > 0 && (
                        <Text style={styles.pendingText}>€{pendingAmount.toFixed(2)} čaká na potvrdenie brigády</Text>
                    )}
                </View>

                {/* Quick actions — circular icon buttons, the app's other deliberate accent moment */}
                <View style={styles.actionRow}>
                    <IconButton icon={<WalletIcon size={20} color={C.text} strokeWidth={2} />} label="Vybrať" onPress={handleWithdraw} />
                    <IconButton icon={<Clock size={20} color={C.text} strokeWidth={2} />} label="História" onPress={() => router.push('/wallet/history')} />
                </View>

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
                    {transactions.length === 0 ? (
                        <Text style={{ color: C.muted, fontSize: 13.5, fontWeight: '500', textAlign: 'center', paddingVertical: 24 }}>
                            Zatiaľ žiadne transakcie
                        </Text>
                    ) : (
                        <View style={styles.transactionsCard}>
                            <FlatList
                                data={transactions}
                                renderItem={renderTransaction}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
                        </View>
                    )}
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

                        <Button
                            label={!savedIBAN ? 'Najprv pridaj bankový účet' : selectedAmount ? `Potvrdiť výber €${selectedAmount.toFixed(2)}` : 'Vyber sumu'}
                            onPress={handleConfirmWithdrawal}
                            disabled={!selectedAmount || !savedIBAN}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const makeStyles = (C: FlintColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '600', color: C.text },
    content: { flex: 1, paddingHorizontal: 20 },

    balanceWrap: { alignItems: 'center', paddingVertical: 12, marginBottom: 24 },
    balanceLabel: { fontSize: 13, fontWeight: '600', color: C.muted, marginBottom: 6 },
    balanceAmount: { flexDirection: 'row', alignItems: 'flex-start' },
    currencySymbol: { fontSize: 26, fontWeight: '800', color: C.text, marginTop: 6 },
    balanceMain: { fontSize: 48, fontWeight: '800', color: C.text, lineHeight: 52, letterSpacing: -1.4 },
    balanceCents: { fontSize: 26, fontWeight: '800', color: C.text, marginTop: 6 },
    pendingText: { fontSize: 12.5, color: C.muted, fontWeight: '600', marginTop: 6 },

    actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 28 },

    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
    statCard: { flex: 1, backgroundColor: C.card, borderRadius: RADIUS.lg, padding: 16 },
    statIconBox: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statLabel: { fontSize: 12.5, color: C.muted, marginBottom: 4, fontWeight: '600' },
    statValue: { fontSize: 23, fontWeight: '700', color: C.text, marginBottom: 4, letterSpacing: -0.5 },
    statSubtext: { fontSize: 11.5, color: C.muted, fontWeight: '500' },

    transactionsSection: { marginBottom: 24 },
    transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    transactionsTitle: { fontSize: 17, fontWeight: '600', color: C.text },
    viewAllText: { fontSize: 13, color: C.accent, fontWeight: '700' },
    transactionsCard: { backgroundColor: C.card, borderRadius: RADIUS.lg, paddingHorizontal: 4 },
    txDivider: { height: 1, backgroundColor: C.divider, marginLeft: 52 },
    transactionItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    transactionIcon: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    transactionContent: { flex: 1 },
    transactionTitle: { fontSize: 14.5, fontWeight: '600', color: C.text, marginBottom: 3 },
    transactionSubtitle: { fontSize: 12.5, color: C.muted, fontWeight: '500' },
    transactionRight: { alignItems: 'flex-end' },
    transactionAmount: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    statusText: { fontSize: 11, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: C.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: 24, paddingBottom: 40 },
    modalHandle: { width: 36, height: 4, backgroundColor: C.card2, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 19, fontWeight: '700', color: C.text, marginBottom: 20 },
    modalBalance: { backgroundColor: C.card2, borderRadius: RADIUS.md, padding: 16, marginBottom: 24 },
    modalBalanceLabel: { fontSize: 12.5, color: C.muted, marginBottom: 4, fontWeight: '600' },
    modalBalanceAmount: { fontSize: 28, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
    modalSectionTitle: { fontSize: 14.5, fontWeight: '700', color: C.text, marginBottom: 12 },
    presetButtons: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    presetButton: { flex: 1, backgroundColor: C.card2, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' },
    presetButtonActive: { backgroundColor: C.accent },
    presetButtonText: { fontSize: 14.5, fontWeight: '600', color: C.muted },
    presetButtonTextActive: { color: C.onAccent },
    bankAccountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderRadius: RADIUS.md, padding: 16, marginBottom: 24 },
    bankAccountInfo: { flex: 1, marginLeft: 12 },
    bankAccountLabel: { fontSize: 12.5, color: C.muted, marginBottom: 2, fontWeight: '600' },
    bankAccountNumber: { fontSize: 14.5, fontWeight: '600', color: C.text },
    addBankButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.accentDim, borderRadius: RADIUS.md, padding: 16, marginBottom: 24, gap: 8 },
    addBankText: { fontSize: 14.5, fontWeight: '700', color: C.accent },
});
