import React, { useEffect, useState, useRef, useMemo } from "react";
import {
    View, Text, ScrollView, TextInput, Pressable,
    KeyboardAvoidingView, Platform, Image, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Send } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useClay } from "@/lib/useClay";
import type { ClayColors } from "@/lib/useClay";
import * as Haptics from "expo-haptics";
import { ClaySurface, ClayInset } from "@/components/clay";
import { goBack } from '@/lib/nav';

interface Message {
    id: string; content: string; sender_id: string;
    receiver_id: string; created_at: string; read: boolean;
}
interface UserProfile {
    id: string; name: string; display_name: string | null;
    avatar_url: string | null; role: string;
}

export default function ChatScreen() {
    const { userId, jobId } = useLocalSearchParams<{ userId: string; jobId?: string }>();
    const router = useRouter();
    const C = useClay();
    const st = useMemo(() => makeStyles(C), [C]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    // The realtime callback must read the CURRENT user id — a state value would
    // be captured as null in the closure created before the session loads.
    const currentUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        (async () => {
            await loadUserAndMessages();
            cleanup = setupRealtimeSubscription();
        })();
        return () => cleanup?.();
    }, [userId]);

    const loadUserAndMessages = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { goBack(); return; }
            setCurrentUserId(session.user.id);
            currentUserIdRef.current = session.user.id;
            const { data: userProfile } = await supabase.from('users')
                .select('id, name, display_name, avatar_url, role').eq('id', userId).single();
            if (userProfile) setOtherUser(userProfile);
            const { data: messagesData } = await supabase.from('messages').select('*')
                .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${session.user.id})`)
                .order('created_at', { ascending: true });
            if (messagesData) {
                setMessages(messagesData);
                const unreadIds = messagesData.filter(msg => msg.receiver_id === session.user.id && !msg.read).map(msg => msg.id);
                if (unreadIds.length > 0) await supabase.from('messages').update({ read: true }).in('id', unreadIds);
            }
        } catch (e) { console.error('Error:', e); }
        finally { setLoading(false); }
    };

    const setupRealtimeSubscription = () => {
        const channel = supabase.channel(`chat-${userId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new as Message;
                const me = currentUserIdRef.current;
                if ((newMsg.sender_id === userId && newMsg.receiver_id === me) ||
                    (newMsg.sender_id === me && newMsg.receiver_id === userId)) {
                    setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUserId || sending) return;
        setSending(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const { data: inserted, error } = await supabase.from('messages').insert({
                sender_id: currentUserId, receiver_id: userId,
                content: newMessage.trim(), job_id: jobId || null, read: false,
            }).select().single();
            if (error) { alert('Chyba pri odosielaní správy'); }
            else {
                // Append immediately — don't rely on the realtime event for own messages
                if (inserted) setMessages(prev => prev.some(m => m.id === inserted.id) ? prev : [...prev, inserted as Message]);
                setNewMessage("");
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            }
        } catch (e) { console.error('Error:', e); }
        finally { setSending(false); }
    };

    const formatTime = (d: string) => new Date(d).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const initial = (otherUser?.display_name || otherUser?.name)?.charAt(0).toUpperCase() || '?';
    const canSend = !!newMessage.trim() && !sending;

    if (loading) {
        return (
            <SafeAreaView style={st.container} edges={['top']}>
                <View style={st.center}><ActivityIndicator size="large" color={C.accent} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            {/* Header */}
            <View style={st.chatHeader}>
                <Pressable onPress={() => goBack()} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
                    </ClaySurface>
                </Pressable>
                <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/user/${userId}`); }}
                    style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }, pressed && { opacity: 0.7 }]}
                >
                    {otherUser?.avatar_url ? (
                        <Image source={{ uri: otherUser.avatar_url }} style={st.avatar} />
                    ) : (
                        <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.avatar}>
                            <Text style={[st.avatarLetter, { color: C.onAccent }]}>{initial}</Text>
                        </LinearGradient>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={st.chatName}>{otherUser?.display_name || otherUser?.name}</Text>
                        <Text style={st.chatRole}>{otherUser?.role === 'worker' ? 'Brigádnik' : 'Zamestnávateľ'}</Text>
                    </View>
                </Pressable>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={0}>
                <ScrollView ref={scrollViewRef} style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}>
                    {messages.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <Text style={[st.emptyText, { color: C.muted }]}>Zatiaľ žiadne správy.{'\n'}Začnite konverzáciu!</Text>
                        </View>
                    ) : (
                        messages.map((message, index) => {
                            const isSent = message.sender_id === currentUserId;
                            const showTime = index === 0 || new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000;
                            return (
                                <View key={message.id} style={{ marginBottom: 8 }}>
                                    {showTime && <Text style={[st.timestamp, { color: C.muted }]}>{formatTime(message.created_at)}</Text>}
                                    <View style={{ flexDirection: 'row', justifyContent: isSent ? 'flex-end' : 'flex-start' }}>
                                        {isSent ? (
                                            <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[st.bubble, { borderBottomRightRadius: 5 }]}>
                                                <Text style={[st.bubbleText, { color: C.onAccent }]}>{message.content}</Text>
                                            </LinearGradient>
                                        ) : (
                                            <ClaySurface radius={18} style={{ maxWidth: '78%' }} contentStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                                                <Text style={[st.bubbleText, { color: C.text }]}>{message.content}</Text>
                                            </ClaySurface>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {/* Input */}
                <View style={[st.inputBar, { backgroundColor: C.bg, borderTopColor: C.hair }]}>
                    <ClayInset radius={22} style={{ flex: 1 }} contentStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                        <TextInput
                            value={newMessage} onChangeText={setNewMessage}
                            placeholder="Napíšte správu..." placeholderTextColor={C.muted}
                            multiline maxLength={500}
                            style={[st.textInput, { color: C.text }]}
                        />
                    </ClayInset>
                    <Pressable onPress={sendMessage} disabled={!canSend}>
                        {canSend ? (
                            <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={st.sendBtn}>
                                {sending ? <ActivityIndicator size="small" color={C.onAccent} /> : <Send size={18} color={C.onAccent} strokeWidth={2.2} />}
                            </LinearGradient>
                        ) : (
                            <View style={[st.sendBtn, { backgroundColor: C.cLo, borderWidth: 1, borderColor: C.hair }]}>
                                <Send size={18} color={C.muted} strokeWidth={2} />
                            </View>
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const makeStyles = (C: ClayColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hair, gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarLetter: { fontSize: 16, fontWeight: '800' },
    chatName: { fontSize: 16.5, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
    chatRole: { fontSize: 12.5, fontWeight: '700', color: C.accent },
    emptyText: { textAlign: 'center', fontSize: 14, fontWeight: '500', lineHeight: 21 },
    timestamp: { textAlign: 'center', fontSize: 11, marginBottom: 8, fontWeight: '600' },
    bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleText: { fontSize: 14.5, lineHeight: 21, fontWeight: '500' },
    inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
    textInput: { fontSize: 15, maxHeight: 100, fontWeight: '500' },
    sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
