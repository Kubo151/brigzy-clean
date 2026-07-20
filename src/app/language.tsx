import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import useThemeStore from "@/lib/state/theme-store";
import { useFlint, RADIUS } from "@/lib/useFlint";
import { Divider } from "@/components/ui";
import { goBack } from '@/lib/nav';

const LANGUAGES = [
    { code: 'sk' as const, name: 'Slovenčina', flag: '🇸🇰' },
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
];

export default function LanguageScreen() {
    const router = useRouter();
    const C = useFlint();
    const language = useThemeStore((s) => s.language);
    const setLanguage = useThemeStore((s) => s.setLanguage);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <View style={[styles.backBtn, { backgroundColor: C.card2 }]}>
                        <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
                    </View>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]}>Jazyk</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 8 }}>
                <View style={{ backgroundColor: C.card, borderRadius: RADIUS.lg }}>
                    {LANGUAGES.map((lang, i) => {
                        const active = language === lang.code;
                        return (
                            <React.Fragment key={lang.code}>
                                {i > 0 && <Divider />}
                                <Pressable
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLanguage(lang.code); }}
                                    style={({ pressed }) => [styles.langRow, pressed && { opacity: 0.7 }]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Text style={styles.flag}>{lang.flag}</Text>
                                        <Text style={[styles.langName, { color: active ? C.accent : C.text }]}>{lang.name}</Text>
                                    </View>
                                    {active && <Check size={20} color={C.accent} strokeWidth={3} />}
                                </Pressable>
                            </React.Fragment>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '600' },
    langRow: { paddingHorizontal: 16, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    flag: { fontSize: 24, marginRight: 14 },
    langName: { fontSize: 16.5, fontWeight: '600', letterSpacing: -0.2 },
});
