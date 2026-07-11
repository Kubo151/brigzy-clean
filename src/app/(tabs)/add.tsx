import React, { useEffect, useMemo, useState } from "react";
import {
    View, Text, ScrollView, KeyboardAvoidingView, Platform,
    Pressable, TextInput, ActivityIndicator, StyleSheet, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    Briefcase, MapPin, Euro, Clock, FileText, CheckCircle, ChevronLeft,
    Building2, User, Zap, Users, Eye, EyeOff, Sparkles,
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
import { ClaySurface, ClayInset, ClayIconBox, ClayButton } from "@/components/clay";
import { showAlert } from "@/lib/notify";

const CATEGORIES: JobCategory[] = [
    "hospitality", "retail", "delivery", "events",
    "cleaning", "construction", "moving", "admin", "other",
];

const FEE_FIXED_CENTS = 200;
const FEE_PCT = 0.10;
const TOTAL_STEPS = 7;

type TaskNature = "result" | "activity";
type PostingAs = "individual" | "company";

// ─── Small building blocks (clay inset input, section title) ───
function FieldInput({ icon: Icon, label, value, onChangeText, placeholder, C, multiline, keyboardType }: {
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

function StepTitle({ children, C }: { children: string; C: ClayColors }) {
    return <Text style={[styles.stepTitle, { color: C.text }]}>{children}</Text>;
}

function ChoiceCard({ selected, icon: Icon, title, subtitle, onPress, C }: {
    selected: boolean; icon: any; title: string; subtitle?: string; onPress: () => void; C: ClayColors;
}) {
    return (
        <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }} style={{ marginBottom: 10 }}>
            {selected ? (
                <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.choiceCard}>
                    <Icon size={20} color={C.onAccent} strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.choiceTitle, { color: C.onAccent }]}>{title}</Text>
                        {!!subtitle && <Text style={[styles.choiceSubtitle, { color: C.onAccent, opacity: 0.85 }]}>{subtitle}</Text>}
                    </View>
                    <CheckCircle size={19} color={C.onAccent} strokeWidth={2.2} />
                </LinearGradient>
            ) : (
                <View style={[styles.choiceCard, { backgroundColor: C.cLo, borderWidth: 1, borderColor: C.hair }]}>
                    <Icon size={20} color={C.muted} strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.choiceTitle, { color: C.text }]}>{title}</Text>
                        {!!subtitle && <Text style={[styles.choiceSubtitle, { color: C.muted }]}>{subtitle}</Text>}
                    </View>
                </View>
            )}
        </Pressable>
    );
}

// Role switch must not change the number of hooks rendered in one component,
// so the worker guard and the post wizard are separate components.
export default function AddJobScreen() {
    const currentRole = useAppStore((s) => s.currentRole);
    return currentRole === 'employer' ? <PostJobWizard /> : <WorkerGuard />;
}

function WorkerGuard() {
    const router = useRouter();
    const C = useClay();
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

// ─── P2 — Post a job wizard (7 steps, auto-derives contract type) ───
function PostJobWizard() {
    const router = useRouter();
    const C = useClay();
    const text = useText();
    const currentUser = useAppStore((s) => s.currentUser);

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Step 1
    const [category, setCategory] = useState<JobCategory | null>(null);
    // Step 2
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [taskNature, setTaskNature] = useState<TaskNature>("result");
    const [postingAs, setPostingAs] = useState<PostingAs>("individual");
    const [existingCompanyId, setExistingCompanyId] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState("");
    const [companyIco, setCompanyIco] = useState("");
    const [companyDic, setCompanyDic] = useState("");
    // Step 3
    const [salaryType, setSalaryType] = useState<SalaryType>("hourly");
    const [salary, setSalary] = useState("");
    const [estimatedHours, setEstimatedHours] = useState("");
    // Step 4
    const [location, setLocation] = useState("");
    // Step 5
    const [slotsTotal, setSlotsTotal] = useState("1");
    const [duration, setDuration] = useState("");
    const [recurring, setRecurring] = useState(false);
    // Step 6
    const [isSos, setIsSos] = useState(false);
    const [visibility, setVisibility] = useState<'public' | 'invite_only'>('public');

    // Prefill from an existing company on file (Data-Model: one company per B2B poster for MVP)
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('companies')
                .select('id, name, ico, dic')
                .eq('owner_user_id', user.id)
                .maybeSingle();
            if (data) {
                setExistingCompanyId(data.id);
                setCompanyName(data.name ?? '');
                setCompanyIco(data.ico ?? '');
                setCompanyDic(data.dic ?? '');
                setPostingAs('company');
            }
        })();
    }, []);

    const isB2B = postingAs === 'company';
    const showRecurring = isB2B && taskNature === 'activity';

    const contractType = useMemo(() => {
        if (!isB2B) return { name: 'Zmluva o dielo', ref: '§ 631–643 OZ' };
        return taskNature === 'activity'
            ? { name: 'DoPČ', ref: '§ 228a ZP' }
            : { name: 'DoVP', ref: '§ 226 ZP' };
    }, [isB2B, taskNature]);

    const salaryNum = parseFloat(salary.replace(',', '.')) || 0;
    const hoursNum = parseFloat(estimatedHours.replace(',', '.')) || 0;
    const rewardCents = salaryType === 'hourly'
        ? Math.round(salaryNum * 100 * Math.max(hoursNum, 1))
        : Math.round(salaryNum * 100);
    const feeCents = rewardCents > 0 ? FEE_FIXED_CENTS + Math.round(rewardCents * FEE_PCT) : 0;

    const stepValid = useMemo(() => {
        switch (step) {
            case 1: return !!category;
            case 2: return !!title.trim() && !!description.trim()
                && (!isB2B || (!!companyName.trim() && !!companyIco.trim()));
            case 3: return salaryNum > 0 && (salaryType !== 'hourly' || hoursNum > 0);
            case 4: return !!location.trim();
            case 5: return (parseInt(slotsTotal, 10) || 0) >= 1 && !!duration.trim();
            case 6: return true;
            default: return true;
        }
    }, [step, category, title, description, isB2B, companyName, companyIco, salaryNum, salaryType, hoursNum, location, slotsTotal, duration]);

    const goNext = () => {
        if (!stepValid) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showAlert(text.error, text.wizardValidationError);
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    };
    const goBackStep = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step === 1) router.back();
        else setStep((s) => Math.max(s - 1, 1));
    };

    const handlePublish = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id ?? currentUser?.id;
            if (!userId) { showAlert(text.error, text.mustBeLoggedIn); setIsSubmitting(false); return; }

            let companyId: string | null = null;
            if (isB2B) {
                if (existingCompanyId) {
                    companyId = existingCompanyId;
                    await supabase.from('companies').update({
                        name: companyName.trim(), ico: companyIco.trim(), dic: companyDic.trim() || null,
                    }).eq('id', existingCompanyId);
                } else {
                    const { data: created, error: companyError } = await supabase
                        .from('companies')
                        .insert({ owner_user_id: userId, name: companyName.trim(), ico: companyIco.trim(), dic: companyDic.trim() || null })
                        .select('id')
                        .single();
                    if (companyError) throw companyError;
                    companyId = created.id;
                    setExistingCompanyId(created.id);
                }
            }

            const { error } = await supabase.from("jobs").insert({
                employer_id: userId,
                poster_user_id: userId,
                company_id: companyId,
                title: title.trim(),
                description: description.trim(),
                company_name: isB2B ? companyName.trim() : (currentUser?.name ?? "Súkromná osoba"),
                location: location.trim(),
                category,
                task_nature: isB2B ? taskNature : null,
                pay_type: salaryType,
                pay_amount: salaryNum,
                estimated_hours: salaryType === 'hourly' ? hoursNum : null,
                duration: duration.trim(),
                slots_total: parseInt(slotsTotal, 10) || 1,
                is_urgent: isSos,
                is_sos: isSos,
                visibility,
                requires_introduction: false,
                status: "active",
            });

            if (error) { showAlert(text.error, error.message); setIsSubmitting(false); return; }

            setIsSubmitting(false);
            setShowSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => router.push("/(tabs)"), 1800);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            showAlert(text.error, msg);
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <View style={[styles.center, { backgroundColor: C.bg }]}>
                <ClayIconBox size={100} radius={32} tintBg={C.greenDim}>
                    <CheckCircle size={52} color={C.green} strokeWidth={1.8} />
                </ClayIconBox>
                <Text style={[styles.successTitle, { color: C.text }]}>{text.jobPublishedTitle}</Text>
                <Text style={[styles.successDesc, { color: C.muted }]}>{text.jobPostedSuccess}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg }}>
                <View style={styles.header}>
                    <Pressable onPress={goBackStep} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                        <ClaySurface radius={14} style={{ width: 40, height: 40 }} contentStyle={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronLeft size={19} color={C.text} strokeWidth={2.2} />
                        </ClaySurface>
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.stepCounter, { color: C.muted }]}>{text.wizardStepOf} {step}/{TOTAL_STEPS}</Text>
                        <View style={[styles.progressTrack, { backgroundColor: C.hair }]}>
                            <View style={[styles.progressFill, { backgroundColor: C.accent, width: `${(step / TOTAL_STEPS) * 100}%` }]} />
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>

                    {/* Step 1 — Kategória */}
                    {step === 1 && (
                        <>
                            <StepTitle C={C}>{text.stepCategoryTitle}</StepTitle>
                            <View style={styles.categoryGrid}>
                                {CATEGORIES.map((cat) => {
                                    const catData = JOB_CATEGORIES.find(c => c.id === cat);
                                    const isSelected = category === cat;
                                    return (
                                        <Pressable key={cat} onPress={() => { Haptics.selectionAsync(); setCategory(cat); }}>
                                            {isSelected ? (
                                                <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.categoryChip}>
                                                    <Text style={{ fontSize: 15, marginRight: 5 }}>{catData?.icon || '📋'}</Text>
                                                    <Text style={[styles.categoryChipText, { color: C.onAccent, fontWeight: '800' }]}>{catData?.name || cat}</Text>
                                                </LinearGradient>
                                            ) : (
                                                <View style={[styles.categoryChip, { backgroundColor: C.cLo, borderWidth: 1, borderColor: C.hair }]}>
                                                    <Text style={{ fontSize: 15, marginRight: 5 }}>{catData?.icon || '📋'}</Text>
                                                    <Text style={[styles.categoryChipText, { color: C.text, fontWeight: '600' }]}>{catData?.name || cat}</Text>
                                                </View>
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* Step 2 — Popis úlohy + Firma/Súkromná osoba */}
                    {step === 2 && (
                        <>
                            <StepTitle C={C}>{text.stepDescriptionTitle}</StepTitle>
                            <FieldInput icon={Briefcase} label={text.jobTitle} value={title} onChangeText={setTitle} placeholder={text.jobTitlePlaceholder} C={C} />
                            <FieldInput icon={FileText} label={text.description} value={description} onChangeText={setDescription} placeholder={text.descriptionPlaceholder} C={C} multiline />

                            <Text style={[styles.fieldLabel, { color: C.muted, marginTop: 4 }]}>{text.taskNatureLabel}</Text>
                            <ChoiceCard C={C} icon={Sparkles} selected={taskNature === 'result'} title={text.taskNatureResult} subtitle={text.taskNatureResultHint} onPress={() => setTaskNature('result')} />
                            <ChoiceCard C={C} icon={Clock} selected={taskNature === 'activity'} title={text.taskNatureActivity} subtitle={text.taskNatureActivityHint} onPress={() => setTaskNature('activity')} />

                            <Text style={[styles.fieldLabel, { color: C.muted, marginTop: 10 }]}>{text.postingAsLabel}</Text>
                            <ChoiceCard C={C} icon={User} selected={!isB2B} title={text.postingAsIndividual} onPress={() => setPostingAs('individual')} />
                            <ChoiceCard C={C} icon={Building2} selected={isB2B} title={text.postingAsCompany} onPress={() => setPostingAs('company')} />

                            {isB2B && (
                                <View style={{ marginTop: 4 }}>
                                    <FieldInput icon={Building2} label={text.companyNameLabel} value={companyName} onChangeText={setCompanyName} placeholder="s.r.o." C={C} />
                                    <FieldInput icon={FileText} label={text.companyIcoLabel} value={companyIco} onChangeText={setCompanyIco} placeholder="12345678" C={C} keyboardType="numeric" />
                                    <FieldInput icon={FileText} label={text.companyDicLabel} value={companyDic} onChangeText={setCompanyDic} placeholder="2012345678" C={C} keyboardType="numeric" />
                                </View>
                            )}
                        </>
                    )}

                    {/* Step 3 — Odmena + fee preview */}
                    {step === 3 && (
                        <>
                            <StepTitle C={C}>{text.stepPayTitle}</StepTitle>
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
                            <FieldInput icon={Euro} label={salaryType === "hourly" ? text.hourlyRate : text.fixedAmount} value={salary} onChangeText={setSalary} placeholder="napr. 10" C={C} keyboardType="numeric" />
                            {salaryType === 'hourly' && (
                                <View>
                                    <FieldInput icon={Clock} label={text.estimatedHoursLabel} value={estimatedHours} onChangeText={setEstimatedHours} placeholder="napr. 6" C={C} keyboardType="numeric" />
                                    <Text style={{ color: C.muted, fontSize: 12, fontWeight: '500', marginTop: -10, marginBottom: 16, paddingHorizontal: 4 }}>
                                        {text.estimatedHoursHint}
                                    </Text>
                                </View>
                            )}

                            {rewardCents > 0 && (
                                <ClaySurface radius={16} contentStyle={{ padding: 16 }}>
                                    <View style={styles.feeRow}>
                                        <Text style={[styles.feeLabel, { color: C.muted }]}>{text.feeGross}</Text>
                                        <Text style={[styles.feeValue, { color: C.text }]}>€{(rewardCents / 100).toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.feeRow}>
                                        <Text style={[styles.feeLabel, { color: C.muted }]}>{text.feeService}</Text>
                                        <Text style={[styles.feeValue, { color: C.text }]}>€{(feeCents / 100).toFixed(2)}</Text>
                                    </View>
                                    <View style={[styles.feeDivider, { backgroundColor: C.hair }]} />
                                    <View style={styles.feeRow}>
                                        <Text style={[styles.feeLabelBold, { color: C.text }]}>{text.totalToPay}</Text>
                                        <Text style={[styles.feeValueBold, { color: C.accent }]}>€{((rewardCents + feeCents) / 100).toFixed(2)}</Text>
                                    </View>
                                </ClaySurface>
                            )}
                        </>
                    )}

                    {/* Step 4 — Miesto */}
                    {step === 4 && (
                        <>
                            <StepTitle C={C}>{text.stepLocationTitle}</StepTitle>
                            <FieldInput icon={MapPin} label={text.location} value={location} onChangeText={setLocation} placeholder={text.locationPlaceholder} C={C} />
                        </>
                    )}

                    {/* Step 5 — Počet miest & rozvrh */}
                    {step === 5 && (
                        <>
                            <StepTitle C={C}>{text.stepScheduleTitle}</StepTitle>
                            <FieldInput icon={Users} label={text.slotsCountLabel} value={slotsTotal} onChangeText={(v) => setSlotsTotal(v.replace(/\D/g, ''))} placeholder="1" C={C} keyboardType="numeric" />
                            <FieldInput icon={Clock} label={text.duration} value={duration} onChangeText={setDuration} placeholder={text.durationPlaceholder} C={C} />
                            {showRecurring && (
                                <View style={[styles.switchRow, { backgroundColor: C.cLo, borderColor: C.hair }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.switchLabel, { color: C.text }]}>{text.recurringLabel}</Text>
                                        <Text style={[styles.switchHint, { color: C.muted }]}>{text.recurringHint}</Text>
                                    </View>
                                    <Switch value={recurring} onValueChange={(v) => { Haptics.selectionAsync(); setRecurring(v); }} trackColor={{ false: C.hair, true: C.accent }} />
                                </View>
                            )}
                        </>
                    )}

                    {/* Step 6 — Nastavenia (SOS, visibility) */}
                    {step === 6 && (
                        <>
                            <StepTitle C={C}>{text.stepSettingsTitle}</StepTitle>
                            <View style={[styles.switchRow, { backgroundColor: C.cLo, borderColor: C.hair }]}>
                                <ClayIconBox size={38} radius={12} tintBg={C.red + '1E'}><Zap size={17} color={C.red} strokeWidth={2.2} /></ClayIconBox>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.switchLabel, { color: C.text }]}>{text.sosSettingLabel}</Text>
                                    <Text style={[styles.switchHint, { color: C.muted }]}>{text.sosSettingHint}</Text>
                                </View>
                                <Switch value={isSos} onValueChange={(v) => { Haptics.selectionAsync(); setIsSos(v); }} trackColor={{ false: C.hair, true: C.red }} />
                            </View>

                            <Text style={[styles.fieldLabel, { color: C.muted, marginTop: 14 }]}>{text.visibilityLabel}</Text>
                            <ChoiceCard C={C} icon={Eye} selected={visibility === 'public'} title={text.visibilityPublic} onPress={() => setVisibility('public')} />
                            <ChoiceCard C={C} icon={EyeOff} selected={visibility === 'invite_only'} title={text.visibilityInviteOnly} onPress={() => setVisibility('invite_only')} />
                        </>
                    )}

                    {/* Step 7 — Súhrn & publikovanie */}
                    {step === 7 && (
                        <>
                            <StepTitle C={C}>{text.stepSummaryTitle}</StepTitle>
                            <ClaySurface radius={18} style={{ marginBottom: 14 }} contentStyle={{ padding: 16 }}>
                                <Text style={[styles.summaryJobTitle, { color: C.text }]}>{title || '—'}</Text>
                                <View style={styles.metaRow}><MapPin size={14} color={C.muted} strokeWidth={1.9} /><Text style={[styles.metaText, { color: C.muted }]}>{location || '—'}</Text></View>
                                <View style={styles.metaRow}><Clock size={14} color={C.muted} strokeWidth={1.9} /><Text style={[styles.metaText, { color: C.muted }]}>{duration || '—'}</Text></View>
                                <View style={styles.metaRow}><Users size={14} color={C.muted} strokeWidth={1.9} /><Text style={[styles.metaText, { color: C.muted }]}>{slotsTotal} {text.slotsCountLabel.toLowerCase()}</Text></View>
                            </ClaySurface>

                            <ClaySurface radius={18} style={{ marginBottom: 14 }} contentStyle={{ padding: 16 }}>
                                <View style={styles.feeRow}>
                                    <Text style={[styles.feeLabel, { color: C.muted }]}>{text.contractTypePreview}</Text>
                                    <Text style={[styles.feeValueBold, { color: C.accent }]}>{contractType.name}</Text>
                                </View>
                                <Text style={[styles.switchHint, { color: C.muted, marginTop: 2 }]}>{contractType.ref}</Text>
                            </ClaySurface>

                            <ClaySurface radius={18} style={{ marginBottom: 14 }} contentStyle={{ padding: 16 }}>
                                <View style={styles.feeRow}>
                                    <Text style={[styles.feeLabel, { color: C.muted }]}>{text.feeGross}</Text>
                                    <Text style={[styles.feeValue, { color: C.text }]}>€{(rewardCents / 100).toFixed(2)}</Text>
                                </View>
                                <View style={styles.feeRow}>
                                    <Text style={[styles.feeLabel, { color: C.muted }]}>{text.feeService}</Text>
                                    <Text style={[styles.feeValue, { color: C.text }]}>€{(feeCents / 100).toFixed(2)}</Text>
                                </View>
                                <View style={[styles.feeDivider, { backgroundColor: C.hair }]} />
                                <View style={styles.feeRow}>
                                    <Text style={[styles.feeLabelBold, { color: C.text }]}>{text.totalToPay}</Text>
                                    <Text style={[styles.feeValueBold, { color: C.accent }]}>€{((rewardCents + feeCents) / 100).toFixed(2)}</Text>
                                </View>
                            </ClaySurface>
                        </>
                    )}

                    {/* Nav buttons */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                        {step < TOTAL_STEPS ? (
                            <ClayButton label={text.wizardNext} onPress={goNext} flex={1} style={!stepValid ? { opacity: 0.5 } : undefined} />
                        ) : isSubmitting ? (
                            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}>
                                <ActivityIndicator size="large" color={C.accent} />
                            </View>
                        ) : (
                            <ClayButton label={text.wizardPublish} onPress={handlePublish} flex={1} />
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12 },
    stepCounter: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
    progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 5, borderRadius: 3 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
    stepTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 18 },
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
    choiceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16 },
    choiceTitle: { fontSize: 14.5, fontWeight: '800' },
    choiceSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    switchRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
    switchLabel: { fontSize: 14.5, fontWeight: '800' },
    switchHint: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    feeLabel: { fontSize: 13.5, fontWeight: '600' },
    feeValue: { fontSize: 14.5, fontWeight: '700' },
    feeDivider: { height: 1, marginVertical: 8 },
    feeLabelBold: { fontSize: 15, fontWeight: '800' },
    feeValueBold: { fontSize: 17, fontWeight: '800' },
    summaryJobTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
    metaText: { fontSize: 13, fontWeight: '500' },
    successTitle: { fontSize: 23, fontWeight: '800', marginBottom: 8, marginTop: 24, letterSpacing: -0.4 },
    successDesc: { fontSize: 14, textAlign: 'center', fontWeight: '500' },
});
