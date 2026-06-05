import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Hourglass, CheckCircle, Building2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useClay } from '@/lib/useClay';
import type { ClayColors } from '@/lib/useClay';
import { ClaySurface } from '@/components/clay';

type TransactionStatus = 'pending' | 'cleared' | 'withdrawn';
type FilterType = 'all' | 'cleared' | 'withdrawn' | 'pending';

const ALL_TRANSACTIONS = [
    { id: '1', title: 'Pomocník v sklade', company: 'Logistika SK', date: 'dnes', amount: 40.00, status: 'pending' as TransactionStatus },
    { id: '2', title: 'Brigáda — kaviareň', company: 'Café Modrý Kameň', date: '5. feb', amount: 67.50, status: 'cleared' as TransactionStatus },
    { id: '3', title: 'Výber na účet', company: 'IBAN •••• 4821', date: '3. feb', amount: -60.00, status: 'withdrawn' as TransactionStatus },
    { id: '4', title: 'Upratovanie kancelárie', company: 'CleanPro s.r.o.', date: '1. feb', amount: 55.00, status: 'cleared' as TransactionStatus },
    { id: '5', title: 'Výber na účet', company: 'IBAN •••• 4821', date: '28. jan', amount: -45.00, status: 'withdrawn' as TransactionStatus },
    { id: '6', title: 'Event staff — koncert', company: 'LiveEvents SK', date: '25. jan', amount: 92.00, status: 'cleared' as TransactionStatus },
    { id: '7', title: 'Doručovanie balíkov', company: 'QuickDeliver', date: '20. jan', amount: 48.00, status: 'pending' as TransactionStatus },
];

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

    const filteredTransactions = activeFilter === 'all'
        ? ALL_TRANSACTIONS
        : ALL_TRANSACTIONS.filter(t => t.status === activeFilter);

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

    const renderTransaction = ({ item }: { item: typeof ALL_TRANSACTIONS[0] }) => {
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
                <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
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
