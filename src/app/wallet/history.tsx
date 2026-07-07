import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { ArrowLeft, Hourglass, CheckCircle, Building2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useClay } from '@/lib/useClay';
import type { ClayColors } from '@/lib/useClay';
import { ClaySurface } from '@/components/clay';
import { goBack } from '@/lib/nav';

type TransactionStatus = 'pending' | 'cleared' | 'withdrawn';
type FilterType = 'all' | 'cleared' | 'withdrawn' | 'pending';

type TxItem = {
    id: string;
    title: string;
    company: string;
    date: string;
    amount: number; // EUR, signed
    status: TransactionStatus;
};

const formatTxDate = (iso: string): string => {
    const d = new Date(iso);
    if (d.toDateString() === new Date().toDateString()) return 'dnes';
    return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' });
};

const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Všetky' },
    { key: 'cleared', label: 'Prijaté' },
    { key: 'withdrawn', label: 'Vybrané' },
    { key: 'pending', label: 'Čakajúce' },
];

export default function HistoryScreen() {
    const C = useClay();
    const styles = useMemo(() => makeStyles(C), [C]);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [transactions, setTransactions] = useState<TxItem[]>([]);

    const loadHistory = useCallback(async () => {
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
            type LedgerRow = {
                id: string; entry_type: string; amount_cents: number;
                description: string | null; created_at: string;
                booking: { job: { title: string | null; company_name: string | null } | null } | null;
            };
            type PendingRow = {
                id: string; agreed_amount_cents: number; created_at: string;
                job: { title: string | null; company_name: string | null } | null;
            };
            const pendingTx: TxItem[] = ((pendingRes.data ?? []) as unknown as PendingRow[]).map((b) => ({
                id: `pending-${b.id}`,
                title: b.job?.title || 'Brigáda',
                company: b.job?.company_name || 'Brigzy',
                date: formatTxDate(b.created_at),
                amount: b.agreed_amount_cents / 100,
                status: 'pending',
            }));
            const ledgerTx: TxItem[] = ((ledgerRes.data ?? []) as unknown as LedgerRow[]).map((r) => ({
                id: r.id,
                title: r.entry_type === 'payout' ? 'Výber na účet' : r.booking?.job?.title || r.description || 'Transakcia',
                company: r.entry_type === 'payout' ? (r.description || 'Bankový účet') : r.booking?.job?.company_name || 'Brigzy',
                date: formatTxDate(r.created_at),
                amount: r.amount_cents / 100,
                status: r.amount_cents < 0 ? 'withdrawn' : 'cleared',
            }));
            setTransactions([...pendingTx, ...ledgerTx]);
        } catch (e) {
            console.error('❌ [WalletHistory] load failed:', e);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

    const filteredTransactions = activeFilter === 'all'
        ? transactions
        : transactions.filter(t => t.status === activeFilter);

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
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={22} color={C.text} strokeWidth={2} />
                    </ClaySurface>
                </Pressable>
                <Text style={styles.headerTitle}>História transakcií</Text>
                <View style={{ width: 42 }} />
            </View>

            <View style={styles.filterRow}>
                {FILTERS.map((filter) => {
                    const active = activeFilter === filter.key;
                    return (
                        <Pressable key={filter.key} onPress={() => setActiveFilter(filter.key)}>
                            {active ? (
                                <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.filterButton}>
                                    <Text style={[styles.filterText, { color: C.onAccent, fontWeight: '800' }]}>{filter.label}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={[styles.filterButton, { backgroundColor: C.cHi, borderWidth: 1, borderColor: C.hair }]}>
                                    <Text style={[styles.filterText, { color: C.muted, fontWeight: '700' }]}>{filter.label}</Text>
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>

            <FlatList
                data={filteredTransactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>Žiadne transakcie</Text>
                        <Text style={styles.emptySubtext}>V tejto kategórii nie sú žiadne transakcie</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const makeStyles = (C: ClayColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
    filterRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8, flexWrap: 'wrap' },
    filterButton: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 11 },
    filterText: { fontSize: 13 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cHi, borderRadius: 16, padding: 13, borderWidth: 1, borderColor: C.hair },
    transactionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    transactionContent: { flex: 1 },
    transactionTitle: { fontSize: 14.5, fontWeight: '700', color: C.text, marginBottom: 3 },
    transactionSubtitle: { fontSize: 12.5, color: C.muted, fontWeight: '500' },
    transactionRight: { alignItems: 'flex-end' },
    transactionAmount: { fontSize: 15.5, fontWeight: '800', marginBottom: 4 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
    statusText: { fontSize: 10.5, fontWeight: '800' },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: C.muted, fontWeight: '500' },
});
