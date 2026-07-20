import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useFlint, RADIUS } from '@/lib/useFlint';

// ─────────────────────────────────────────────────────────────
// Input — text field. Flat card2 fill, no border by default; a
// focus-state accent border is the one deliberate exception to
// "no borders" (an interactive focus affordance, not a static
// card differentiator — see ADR-0006 Addendum 2).
// ─────────────────────────────────────────────────────────────

type Props = TextInputProps & {
    label?: string;
    error?: string;
};

export function Input({ label, error, style, onFocus, onBlur, ...rest }: Props) {
    const C = useFlint();
    const [focused, setFocused] = useState(false);

    return (
        <View style={{ gap: 6 }}>
            {label && <Text style={[styles.label, { color: C.muted }]}>{label}</Text>}
            <View
                style={[
                    styles.field,
                    {
                        backgroundColor: C.card2,
                        borderColor: focused ? C.accent : 'transparent',
                    },
                ]}
            >
                <TextInput
                    placeholderTextColor={C.muted}
                    style={[styles.input, { color: C.text }, style]}
                    onFocus={(e) => {
                        setFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    {...rest}
                />
            </View>
            {error && <Text style={[styles.error, { color: C.red }]}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' },
    field: { borderRadius: RADIUS.md, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 2 },
    input: { fontSize: 15, fontWeight: '500', paddingVertical: 10 },
    error: { fontSize: 12.5, fontWeight: '500' },
});
