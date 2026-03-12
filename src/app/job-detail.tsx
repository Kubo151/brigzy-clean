import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';

interface Job {
    id: string;
    title: string;
    description: string;
    company_name: string;
    location: string;
    pay_amount: number;
    pay_type: string;
    category: string;
    is_urgent: boolean;
    duration?: string;
    requires_introduction: boolean;
}

export default function JobDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    useEffect(() => {
        loadJob();
        checkIfApplied();
    }, [id]);

    const loadJob = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setJob(data);
        } catch (error) {
            console.error('Error loading job:', error);
            Alert.alert('Chyba', 'Nepodarilo sa načítať prácu');
        } finally {
            setLoading(false);
        }
    };

    const checkIfApplied = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('applications')
                .select('id')
                .eq('job_id', id)
                .eq('worker_id', user.id)
                .single();

            setHasApplied(!!data);
        } catch (error) {
            // No application found
        }
    };

    const handleApply = async () => {
        try {
            setApplying(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Chyba', 'Musíte byť prihlásený');
                return;
            }

            const { error } = await supabase
                .from('applications')
                .insert({
                    job_id: id,
                    worker_id: user.id,
                    status: 'pending',
                    message: null,
                });

            if (error) throw error;

            setHasApplied(true);
            Alert.alert(
                'Úspech! 🎉',
                'Vaša prihláška bola odoslaná. Zamestnávateľ vás bude kontaktovať.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Chyba', error.message);
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
        );
    }

    if (!job) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Práca sa nenašla</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Späť</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail práce</Text>
                <TouchableOpacity style={styles.favoriteBtn}>
                    <Text style={styles.favoriteIcon}>🤍</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.companyCard}>
                    <View style={styles.companyAvatar}>
                        <Text style={styles.companyAvatarText}>
                            {job.company_name[0]}
                        </Text>
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{job.company_name}</Text>
                        <View style={styles.locationRow}>
                            <Text style={styles.locationIcon}>📍</Text>
                            <Text style={styles.location}>{job.location}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.titleSection}>
                    <View style={styles.titleRow}>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                        {job.is_urgent && (
                            <View style={styles.urgentBadge}>
                                <Text style={styles.urgentText}>Urgentné</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{job.category}</Text>
                    </View>
                </View>

                <View style={styles.infoCards}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Plat</Text>
                        <Text style={styles.infoValue}>
                            ${job.pay_amount}/{job.pay_type === 'hourly' ? 'hod' : 'deň'}
                        </Text>
                    </View>
                    {job.duration && (
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Trvanie</Text>
                            <Text style={styles.infoValue}>{job.duration}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Popis práce</Text>
                    <Text style={styles.description}>{job.description}</Text>
                </View>

                {job.requires_introduction && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Požiadavky</Text>
                        <View style={styles.requirement}>
                            <Text style={styles.requirementIcon}>✓</Text>
                            <Text style={styles.requirementText}>
                                Potrebné motivačné slovo pri prihlásení
                            </Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
                {hasApplied ? (
                    <View style={styles.appliedButton}>
                        <Text style={styles.appliedButtonText}>✓ Už ste sa prihlásili</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={handleApply}
                        disabled={applying}
                    >
                        {applying ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.applyButtonText}>Uchádzať sa o prácu</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 20 },
    errorText: { fontSize: 18, color: '#6B7280', marginBottom: 20 },
    backButton: { backgroundColor: '#8B5CF6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    backButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, paddingTop: 60, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    backIcon: { fontSize: 24, color: '#111827' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    favoriteBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    favoriteIcon: { fontSize: 24 },
    companyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 20, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    companyAvatar: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    companyAvatarText: { fontSize: 28, fontWeight: 'bold', color: '#8B5CF6' },
    companyInfo: { flex: 1 },
    companyName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    locationIcon: { fontSize: 14, marginRight: 4 },
    location: { fontSize: 14, color: '#6B7280' },
    titleSection: { paddingHorizontal: 20, marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    jobTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', flex: 1 },
    urgentBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
    urgentText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    categoryText: { fontSize: 14, color: '#8B5CF6', fontWeight: '600' },
    infoCards: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 12 },
    infoCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    infoValue: { fontSize: 18, fontWeight: 'bold', color: '#8B5CF6' },
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
    description: { fontSize: 15, color: '#4B5563', lineHeight: 24 },
    requirement: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    requirementIcon: { fontSize: 16, color: '#10B981', marginRight: 8, marginTop: 2 },
    requirementText: { flex: 1, fontSize: 15, color: '#4B5563', lineHeight: 22 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    applyButton: { backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    applyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    appliedButton: { backgroundColor: '#F3F4F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    appliedButtonText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
});
