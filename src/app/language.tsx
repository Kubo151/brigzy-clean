import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import useThemeStore from "@/lib/state/theme-store";
import { useClay } from "@/lib/useClay";
import { ClaySurface } from "@/components/clay";
import { goBack } from '@/lib/nav';

const LANGUAGES = [
    { code: 'sk' as const, name: 'Slovenčina', flag: '🇸🇰' },
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
];

export default function LanguageScreen() {
    const router = useRouter();
    const C = useClay();
    const language = useThemeStore((s) => s.language);
    const setLanguage = useThemeStore((s) => s.setLanguage);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
                    </ClaySurface>
                </Pressable>
                <Text style={[styles.headerTitle, { color: C.text }]}>Jazyk</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 8 }}>
                <ClaySurface radius={18}>
                    {LANGUAGES.map((lang, i) => {
                        const active = language === lang.code;
                        return (
                            <React.Fragment key={lang.code}>
                                {i > 0 && <View style={{ height: 1, backgroundColor: C.hair, marginLeft: 54 }} />}
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
                </ClaySurface>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    langRow: { paddingHorizontal: 16, paddingVertical: 17 },
    flag: { fontSize: 24, marginRight: 14 },
    langName: { fontSize: 16.5, fontWeight: '700', letterSpacing: -0.2 },
});
