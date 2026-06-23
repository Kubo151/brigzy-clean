import React, { useState } from "react";
import {
    View, Text, ScrollView, KeyboardAvoidingView, Platform,
    Pressable, TextInput, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    Briefcase, MapPin, Euro, Clock, FileText, CheckCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useAppStore from "@/lib/state/app-store";
import { supabase } from "@/lib/supabase";
import { useClay } from "@/lib/useClay";
import type { ClayColors } from "@/lib/useClay";
import type { JobCategory, SalaryType } from "@/lib/types";
import { useText } from "@/lib/useText";
import { JOB_CATEGORIES } from "@/lib/types";
import { ClaySurface, ClayInset, ClayIconBox } from "@/components/clay";

const CATEGORIES: JobCategory[] = [
    "hospitality", "retail", "delivery", "events",
    "cleaning", "construction", "moving", "admin", "other",
];

// ─── INPUT ROW (clay inset) ─────────────────────────
function FormInput({ icon: Icon, label, value, onChangeText, placeholder, C, multiline, keyboardType }: {
    icon: any; label: string; value: string; onChangeText: (t: string) => void;
    placeholder: string; C: ClayColors; multiline?: boolean; keyboardType?: any;
}) {
    return (
        <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: C.muted }]}>{label}</Text>
            <ClayInset radius={14} contentStyle={[styles.inputRow, multiline && { alignItems: 'flex-start', paddingTop: 14 }]}>
                <Icon size={18} color={C.muted} strokeWidth={1.9} />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={C.muted}
                    multiline={multiline}
                    numberOfLines={multiline ? 4 : 1}
                    textAlignVertical={multiline ? "top" : "center"}
                    keyboardType={keyboardType}
                    style={[styles.input, { color: C.text }, multiline && { minHeight: 100, paddingTop: 0 }]}
                />
            </ClayInset>
        </View>
    );
}

export default function AddJobScreen() {
    const router = useRouter();
    const C = useClay();
    const text = useText();
    const currentUser = useAppStore((s) => s.currentUser);
    const currentRole = useAppStore((s) => s.currentRole);

    // Workers: redirect to home instead of showing post form
    if (currentRole !== 'employer') {
        return (
            <View style={[styles.center, { backgroundColor: C.bg, flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <Briefcase size={40} color={C.muted} strokeWidth={1.5} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.text, marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
                    Táto sekcia je pre zadávateľov
                </Text>
                <Text style={{ fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                    Prepnite na rolu Zadávateľa v profile a budete môcť pridávať brigády.
                </Text>
                <Pressable onPress={() => router.push('/(tabs)')} style={{ backgroundColor: C.accentDim, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 16 }}>
                    <Text style={{ color: C.accent, fontWeight: '800', fontSize: 15 }}>Späť na domov</Text>
                </Pressable>
            </View>
        );
    }

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [salary, setSalary] = useState("");
    const [duration, setDuration] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null);
    const [salaryType, setSalaryType] = useState<SalaryType>("hourly");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const isFormValid = title.trim() && description.trim() && location.trim() && salary.trim() && duration.trim() && selectedCategory;

    const handleSubmit = async () => {
        if (!isFormValid) return;
        setIsSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            let userId: string | null = null;
            const { data: { user } } = await supabase.auth.getUser();
            if (user) userId = user.id;
            if (!userId && currentUser?.id) userId = currentUser.id;
            if (!userId) { alert(text.mustBeLoggedIn); setIsSubmitting(false); return; }

            const { error } = await supabase.from("jobs").insert({
                employer_id: userId,
                title: title.trim(),
                description: description.trim(),
                company_name: currentUser?.name ?? "Your Company",
                location: location.trim(),
                category: selectedCategory,
                pay_type: salaryType,
                pay_amount: parseFloat(salary) || 0,
                duration: duration.trim(),
                is_urgent: false,
                requires_introduction: false,
                status: "active",
            }).select();

            if (error) { alert("Chyba: " + error.message); setIsSubmitting(false); return; }

            setIsSubmitting(false);
            setShowSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setTimeout(() => {
                setShowSuccess(false);
                setTitle(""); setDescription(""); setLocation("");
                setSalary(""); setDuration(""); setSelectedCategory(null);
                router.push("/(tabs)");
            }, 2000);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            alert("Chyba: " + msg);
            setIsSubmitting(false);
        }
    };

    // ── Success State ──
    if (showSuccess) {
        return (
            <View style={[styles.center, { backgroundColor: C.bg }]}>
                <ClayIconBox size={100} radius={32} tintBg={C.greenDim}>
                    <CheckCircle size={52} color={C.green} strokeWidth={1.8} />
                </ClayIconBox>
                <Text style={[styles.successTitle, { color: C.text }]}>{text.jobPosted}</Text>
                <Text style={[styles.successDesc, { color: C.muted }]}>{text.jobPostedSuccess}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg }}>
                <View style={styles.header}>
                    <Text style={[styles.largeTitle, { color: C.text }]}>{text.postJob}</Text>
                    <Text style={[styles.subtitle, { color: C.muted }]}>{text.findIdealWorker}</Text>
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
                    <FormInput icon={Briefcase} label={text.jobTitle} value={title} onChangeText={setTitle} placeholder={text.jobTitlePlaceholder} C={C} />
                    <FormInput icon={FileText} label={text.description} value={description} onChangeText={setDescription} placeholder={text.descriptionPlaceholder} C={C} multiline />
                    <FormInput icon={MapPin} label={text.location} value={location} onChangeText={setLocation} placeholder={text.locationPlaceholder} C={C} />

                    {/* Salary Type Toggle */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: C.muted }]}>{text.salaryType}</Text>
                        <ClayInset radius={14} contentStyle={styles.toggleRow}>
                            {(['hourly', 'fixed'] as SalaryType[]).map(type => {
                                const active = salaryType === type;
                                return (
                                    <Pressable key={type} onPress={() => { Haptics.selectionAsync(); setSalaryType(type); }} style={{ flex: 1 }}>
                                        {active ? (
                                            <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.toggleBtn}>
                                                <Text style={[styles.toggleText, { color: C.onAccent, fontWeight: '800' }]}>{type === 'hourly' ? text.hourly : text.fixed}</Text>
                                            </LinearGradient>
                                        ) : (
                                            <View style={styles.toggleBtn}>
                                                <Text style={[styles.toggleText, { color: C.muted, fontWeight: '600' }]}>{type === 'hourly' ? text.hourly : text.fixed}</Text>
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </ClayInset>
                    </View>

                    <FormInput icon={Euro} label={salaryType === "hourly" ? text.hourlyRate : text.fixedAmount} value={salary} onChangeText={setSalary} placeholder="napr. 10" C={C} keyboardType="numeric" />
                    <FormInput icon={Clock} label={text.duration} value={duration} onChangeText={setDuration} placeholder={text.durationPlaceholder} C={C} />

                    {/* Category Selection */}
                    <View style={[styles.fieldGroup, { marginBottom: 28 }]}>
                        <Text style={[styles.fieldLabel, { color: C.muted }]}>{text.category}</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map((category) => {
                                const cat = JOB_CATEGORIES.find(c => c.id === category);
                                const isSelected = selectedCategory === category;
                                return (
                                    <Pressable key={category} onPress={() => { Haptics.selectionAsync(); setSelectedCategory(category); }}>
                                        {isSelected ? (
                                            <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.categoryChip}>
                                                <Text style={{ fontSize: 15, marginRight: 5 }}>{cat?.icon || '📋'}</Text>
                                                <Text style={[styles.categoryChipText, { color: C.onAccent, fontWeight: '800' }]}>{cat?.name || category}</Text>
                                            </LinearGradient>
                                        ) : (
                                            <View style={[styles.categoryChip, { backgroundColor: C.cLo, borderWidth: 1, borderColor: C.hair }]}>
                                                <Text style={{ fontSize: 15, marginRight: 5 }}>{cat?.icon || '📋'}</Text>
                                                <Text style={[styles.categoryChipText, { color: C.text, fontWeight: '600' }]}>{cat?.name || category}</Text>
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Submit */}
                    <Pressable onPress={handleSubmit} disabled={!isFormValid || isSubmitting} style={({ pressed }) => [styles.submitBtn, Platform.select({
                        ios: { shadowColor: C.accentShadow.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: isFormValid ? C.accentShadow.opacity : 0, shadowRadius: 14 },
                        android: { elevation: isFormValid ? 6 : 0 },
                        web: { boxShadow: isFormValid ? `3px 6px 16px ${C.accentSd}` : 'none' } as any,
                    }), { opacity: (!isFormValid || isSubmitting) ? 0.45 : pressed ? 0.9 : 1 }]}>
                        <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.submitGradient}>
                            <LinearGradient colors={['rgba(255,255,255,0.28)', 'transparent']} style={styles.submitSheen} />
                            {isSubmitting ? <ActivityIndicator color={C.onAccent} /> : <Text style={[styles.submitText, { color: C.onAccent }]}>Pridať brigádu</Text>}
                        </LinearGradient>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    largeTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
    subtitle: { fontSize: 14, fontWeight: '600' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 130 },
    fieldGroup: { marginBottom: 18 },
    fieldLabel: { fontSize: 11, fontWeight: '800', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.7 },
    inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
    input: { flex: 1, fontSize: 16, fontWeight: '500' },
    toggleRow: { flexDirection: 'row', padding: 4, gap: 4 },
    toggleBtn: { paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
    toggleText: { fontSize: 14.5 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    categoryChipText: { fontSize: 14 },
    submitBtn: { borderRadius: 18, overflow: 'hidden', marginBottom: 20 },
    submitGradient: { paddingVertical: 17, alignItems: 'center', borderRadius: 18, overflow: 'hidden' },
    submitSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
    submitText: { fontSize: 16, fontWeight: '800' },
    successTitle: { fontSize: 23, fontWeight: '800', marginBottom: 8, marginTop: 24, letterSpacing: -0.4 },
    successDesc: { fontSize: 14, textAlign: 'center', fontWeight: '500' },
});
