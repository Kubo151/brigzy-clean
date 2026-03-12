import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    FlatList,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Hourglass, CheckCircle, Building2 } from 'lucide-react-native';

type TransactionStatus = 'pending' | 'cleared' | 'withdrawn';
type FilterType = 'all' | 'cleared' | 'withdrawn' | 'pending';

const ALL_TRANSACTIONS = [
    {
        id: '1',
        title: 'Pomocník v sklade',
        company: 'Logistika SK',
        date: 'dnes',
        amount: 40.00,
        status: 'pending' as TransactionStatus,
    },
    {
        id: '2',
        title: 'Brigáda — kaviareň',
        company: 'Café Modrý Kameň',
        date: '5. feb',
        amount: 67.50,
        status: 'cleared' as TransactionStatus,
    },
    {
        id: '3',
        title: 'Výber na účet',
        company: 'IBAN •••• 4821',
        date: '3. feb',
        amount: -60.00,
        status: 'withdrawn' as TransactionStatus,
    },
    {
        id: '4',
        title: 'Upratovanie kancelárie',
        company: 'CleanPro s.r.o.',
        date: '1. feb',
        amount: 55.00,
        status: 'cleared' as TransactionStatus,
    },
    {
        id: '5',
        title: 'Výber na účet',
        company: 'IBAN •••• 4821',
        date: '28. jan',
        amount: -45.00,
        status: 'withdrawn' as TransactionStatus,
    },
    {
        id: '6',
        title: 'Event staff — koncert',
        company: 'LiveEvents SK',
        date: '25. jan',
        amount: 92.00,
        status: 'cleared' as TransactionStatus,
    },
    {
        id: '7',
        title: 'Doručovanie balíkov',
        company: 'QuickDeliver',
        date: '20. jan',
        amount: 48.00,
        status: 'pending' as TransactionStatus,
    },
];

const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Všetky' },
    { key: 'cleared', label: 'Prijaté' },
    { key: 'withdrawn', label: 'Vybrané' },
    { key: 'pending', label: 'Čakajúce' },
];

export default function HistoryScreen() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    const filteredTransactions = activeFilter === 'all'
        ? ALL_TRANSACTIONS
        : ALL_TRANSACTIONS.filter(t => t.status === activeFilter);

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

    const renderTransaction = ({ item }: { item: typeof ALL_TRANSACTIONS[0] }) => {
        const StatusIcon = getStatusIcon(item.status);
        const isNegative = item.amount < 0;

        return (
            <View style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
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
                    <ArrowLeft size={24} color="#F4F4F8" />
                </Pressable>
                <Text style={styles.headerTitle}>História transakcií</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {FILTERS.map((filter) => (
                    <Pressable
                        key={filter.key}
                        style={[
                            styles.filterButton,
                            activeFilter === filter.key && styles.filterButtonActive,
                        ]}
                        onPress={() => setActiveFilter(filter.key)}
                    >
                        <Text style={[
                            styles.filterText,
                            activeFilter === filter.key && styles.filterTextActive,
                        ]}>
                            {filter.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Transactions List */}
            <FlatList
                data={filteredTransactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#1e1e2e',
    },
    filterButtonActive: {
        backgroundColor: '#7c3aed',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#A1A1AA',
    },
    filterTextActive: {
        color: '#FFF',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e1e2e',
        borderRadius: 12,
        padding: 14,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2A2A3A',
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
        color: '#F4F4F8',
        marginBottom: 4,
    },
    transactionSubtitle: {
        fontSize: 13,
        color: '#A1A1AA',
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
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F4F4F8',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#71717A',
    },
});
