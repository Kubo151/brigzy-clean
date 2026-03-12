import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import useThemeStore from "@/lib/state/theme-store";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";

const LANGUAGES = [
    { code: 'sk' as const, name: 'Slovenčina', flag: '🇸🇰' },
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
];

export default function LanguageScreen() {
    const router = useRouter();
    const C = useColors();
    const st = useMemo(() => makeStyles(C), [C]);
    const language = useThemeStore((s) => s.language);
    const setLanguage = useThemeStore((s) => s.setLanguage);

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <View style={st.header}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [st.backBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
                    <ChevronLeft size={22} color={C.text} />
                </Pressable>
                <Text style={st.headerTitle}>Jazyk</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
                <View style={st.menuGroup}>
                    {LANGUAGES.map((lang, i) => {
                        const active = language === lang.code;
                        return (
                            <React.Fragment key={lang.code}>
                                {i > 0 && <View style={st.divider} />}
                                <Pressable
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLanguage(lang.code); }}
                                    style={({ pressed }) => [st.langRow, pressed && { transform: [{ scale: 0.98 }] }]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Text style={st.flag}>{lang.flag}</Text>
                                        <Text style={[st.langName, active && { color: C.purple }]}>{lang.name}</Text>
                                    </View>
                                    {active && <Check size={20} color={C.purple} strokeWidth={3} />}
                                </Pressable>
                            </React.Fragment>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    menuGroup: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    divider: { height: 1, backgroundColor: C.border, marginLeft: 56 },
    langRow: { paddingHorizontal: 16, paddingVertical: 18 },
    flag: { fontSize: 24, marginRight: 14 },
    langName: { fontSize: 17, fontWeight: '600', color: C.text },
});
