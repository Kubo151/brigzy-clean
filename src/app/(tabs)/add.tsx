import React, { useState } from "react";
import {
    View, Text, ScrollView, KeyboardAvoidingView, Platform,
    Pressable, TextInput, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    Briefcase, MapPin, DollarSign, Clock, FileText, CheckCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useAppStore from "@/lib/state/app-store";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/lib/useColors";
import type { JobCategory, SalaryType } from "@/lib/types";
import { useText } from "@/lib/useText";
import { JOB_CATEGORIES } from "@/lib/types";

const CATEGORIES: JobCategory[] = [
    "hospitality", "retail", "delivery", "events",
    "cleaning", "construction", "moving", "admin", "other",
];

// ─── INPUT ROW ──────────────────────────────────────
function FormInput({ icon: Icon, label, value, onChangeText, placeholder, C, multiline, keyboardType }: any) {
    return (
        <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: C.text }]}>{label}</Text>
            <View style={[styles.inputRow, {
                backgroundColor: C.surface,
                borderColor: C.separator,
            }]}>
                <Icon size={18} color={C.tertiaryLabel} strokeWidth={1.8} />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={C.tertiaryLabel}
                    multiline={multiline}
                    numberOfLines={multiline ? 4 : 1}
                    textAlignVertical={multiline ? "top" : "center"}
                    keyboardType={keyboardType}
                    style={[
                        styles.input,
                        { color: C.text },
                        multiline && { minHeight: 100, paddingTop: 0 },
                    ]}
                />
            </View>
        </View>
    );
}

export default function AddJobScreen() {
    const router = useRouter();
    const C = useColors();
    const text = useText();
    const currentUser = useAppStore((s) => s.currentUser);

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
                <View style={[styles.successIcon, { backgroundColor: 'rgba(48,209,88,0.12)' }]}>
                    <CheckCircle size={56} color={C.green} strokeWidth={1.5} />
                </View>
                <Text style={[styles.successTitle, { color: C.text }]}>{text.jobPosted}</Text>
                <Text style={[styles.successDesc, { color: C.secondaryLabel }]}>{text.jobPostedSuccess}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg }}>
                <View style={styles.header}>
                    <Text style={[styles.largeTitle, { color: C.text }]}>{text.postJob}</Text>
                    <Text style={[styles.subtitle, { color: C.secondaryLabel }]}>{text.findIdealWorker}</Text>
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Form fields */}
                    <FormInput icon={Briefcase} label={text.jobTitle} value={title}
                        onChangeText={setTitle} placeholder={text.jobTitlePlaceholder} C={C} />
                    <FormInput icon={FileText} label={text.description} value={description}
                        onChangeText={setDescription} placeholder={text.descriptionPlaceholder} C={C} multiline />
                    <FormInput icon={MapPin} label={text.location} value={location}
                        onChangeText={setLocation} placeholder={text.locationPlaceholder} C={C} />

                    {/* Salary Type Toggle */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: C.text }]}>{text.salaryType}</Text>
                        <View style={[styles.toggleRow, { backgroundColor: C.surface, borderColor: C.separator }]}>
                            {(['hourly', 'fixed'] as SalaryType[]).map(type => (
                                <Pressable
                                    key={type}
                                    onPress={() => { Haptics.selectionAsync(); setSalaryType(type); }}
                                    style={[styles.toggleBtn, salaryType === type && styles.toggleBtnActive]}
                                >
                                    <Text style={[styles.toggleText, {
                                        color: salaryType === type ? '#FFF' : C.secondaryLabel,
                                        fontWeight: salaryType === type ? '600' : '400',
                                    }]}>
                                        {type === 'hourly' ? text.hourly : text.fixed}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <FormInput icon={DollarSign}
                        label={salaryType === "hourly" ? text.hourlyRate : text.fixedAmount}
                        value={salary} onChangeText={setSalary}
                        placeholder="napr. 10" C={C} keyboardType="numeric" />
                    <FormInput icon={Clock} label={text.duration} value={duration}
                        onChangeText={setDuration} placeholder={text.durationPlaceholder} C={C} />

                    {/* Category Selection */}
                    <View style={[styles.fieldGroup, { marginBottom: 28 }]}>
                        <Text style={[styles.fieldLabel, { color: C.text }]}>{text.category}</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map((category) => {
                                const cat = JOB_CATEGORIES.find(c => c.id === category);
                                const isSelected = selectedCategory === category;
                                return (
                                    <Pressable
                                        key={category}
                                        onPress={() => { Haptics.selectionAsync(); setSelectedCategory(category); }}
                                        style={[styles.categoryChip, {
                                            backgroundColor: isSelected ? C.purple : C.surface,
                                            borderColor: isSelected ? C.purple : C.separator,
                                        }]}
                                    >
                                        <Text style={{ fontSize: 15, marginRight: 5 }}>{cat?.icon || '📋'}</Text>
                                        <Text style={[styles.categoryChipText, {
                                            color: isSelected ? '#FFF' : C.text,
                                            fontWeight: isSelected ? '600' : '400',
                                        }]}>
                                            {cat?.name || category}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Submit */}
                    <Pressable
                        onPress={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        style={({ pressed }) => [
                            styles.submitBtn,
                            { opacity: (!isFormValid || isSubmitting) ? 0.4 : pressed ? 0.85 : 1 },
                        ]}
                    >
                        <LinearGradient
                            colors={(!isFormValid || isSubmitting)
                                ? [C.surface2, C.surface2]
                                : ['#9333EA', '#7C3AED', '#6D28D9']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.submitGradient}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={[styles.submitText, {
                                    color: (!isFormValid || isSubmitting) ? C.tertiaryLabel : '#FFF',
                                }]}>
                                    Pridať prácu
                                </Text>
                            )}
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

    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    largeTitle: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: 0.2,
        marginBottom: 4,
    },
    subtitle: { fontSize: 15 },

    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
    },

    // Form fields
    fieldGroup: { marginBottom: 18 },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },

    // Toggle
    toggleRow: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 4,
        gap: 4,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    toggleBtnActive: {
        backgroundColor: '#7C3AED',
    },
    toggleText: { fontSize: 15 },

    // Categories
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    categoryChipText: { fontSize: 14 },

    // Submit
    submitBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    submitGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 16,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
    },

    // Success
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    successDesc: {
        fontSize: 15,
        textAlign: 'center',
    },
});
