import React, { useEffect, useState, useRef, useMemo } from "react";
import {
    View, Text, ScrollView, TextInput, Pressable,
    KeyboardAvoidingView, Platform, Image, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Send } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/lib/useColors";
import type { AppColors } from "@/lib/useColors";
import * as Haptics from "expo-haptics";

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
    const C = useColors();
    const st = useMemo(() => makeStyles(C), [C]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => { loadUserAndMessages(); setupRealtimeSubscription(); }, [userId]);

    const loadUserAndMessages = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.back(); return; }
            setCurrentUserId(session.user.id);
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
                if ((newMsg.sender_id === userId && newMsg.receiver_id === currentUserId) ||
                    (newMsg.sender_id === currentUserId && newMsg.receiver_id === userId)) {
                    setMessages(prev => [...prev, newMsg]);
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
            const { error } = await supabase.from('messages').insert({
                sender_id: currentUserId, receiver_id: userId,
                content: newMessage.trim(), job_id: jobId || null, read: false,
            });
            if (error) { alert('Chyba pri odosielaní správy'); }
            else { setNewMessage(""); setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); }
        } catch (e) { console.error('Error:', e); }
        finally { setSending(false); }
    };

    const formatTime = (d: string) => new Date(d).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const initial = (otherUser?.display_name || otherUser?.name)?.charAt(0).toUpperCase() || '?';

    if (loading) {
        return (
            <SafeAreaView style={st.container} edges={['top']}>
                <View style={st.center}><ActivityIndicator size="large" color={C.purple} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            {/* Header */}
            <View style={st.chatHeader}>
                <Pressable onPress={() => router.back()} style={({ pressed }) => [st.backBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
                    <ChevronLeft size={22} color={C.text} />
                </Pressable>
                {otherUser?.avatar_url ? (
                    <Image source={{ uri: otherUser.avatar_url }} style={st.avatar} />
                ) : (
                    <View style={[st.avatar, { backgroundColor: C.purpleDim }]}>
                        <Text style={[st.avatarLetter, { color: C.purple }]}>{initial}</Text>
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={st.chatName}>{otherUser?.display_name || otherUser?.name}</Text>
                    <Text style={st.chatRole}>{otherUser?.role === 'worker' ? 'Brigádnik' : 'Zamestnávateľ'}</Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={0}>
                {/* Messages */}
                <ScrollView ref={scrollViewRef} style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}>
                    {messages.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <Text style={[st.emptyText, { color: C.tertiaryLabel }]}>Zatiaľ žiadne správy.{'\n'}Začnite konverzáciu!</Text>
                        </View>
                    ) : (
                        messages.map((message, index) => {
                            const isSent = message.sender_id === currentUserId;
                            const showTime = index === 0 || new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000;
                            return (
                                <View key={message.id} style={{ marginBottom: 8 }}>
                                    {showTime && <Text style={[st.timestamp, { color: C.tertiaryLabel }]}>{formatTime(message.created_at)}</Text>}
                                    <View style={{ flexDirection: 'row', justifyContent: isSent ? 'flex-end' : 'flex-start' }}>
                                        <View style={[
                                            st.bubble,
                                            isSent
                                                ? { backgroundColor: C.purple, borderBottomRightRadius: 4 }
                                                : { backgroundColor: C.surface, borderColor: C.separator, borderWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: 4 },
                                        ]}>
                                            <Text style={[st.bubbleText, { color: isSent ? '#FFF' : C.text }]}>{message.content}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {/* Input */}
                <View style={[st.inputBar, { backgroundColor: C.bg, borderTopColor: C.separator }]}>
                    <View style={[st.inputWrap, { backgroundColor: C.surface }]}>
                        <TextInput
                            value={newMessage} onChangeText={setNewMessage}
                            placeholder="Napíšte správu..." placeholderTextColor={C.tertiaryLabel}
                            multiline maxLength={500}
                            style={[st.textInput, { color: C.text }]}
                        />
                    </View>
                    <Pressable onPress={sendMessage} disabled={!newMessage.trim() || sending}
                        style={[st.sendBtn, { backgroundColor: (!newMessage.trim() || sending) ? C.surface2 : C.purple }]}>
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Send size={18} color={(!newMessage.trim() || sending) ? C.tertiaryLabel as string : '#FFF'} />
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    chatHeader: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator, gap: 12,
    },
    backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarLetter: { fontSize: 16, fontWeight: '700' },
    chatName: { fontSize: 17, fontWeight: '700', color: C.text },
    chatRole: { fontSize: 13, fontWeight: '500', color: C.purple },
    emptyText: { textAlign: 'center', fontSize: 15 },
    timestamp: { textAlign: 'center', fontSize: 11, marginBottom: 8 },
    bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleText: { fontSize: 15, lineHeight: 21 },
    inputBar: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
        paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 8,
    },
    inputWrap: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10 },
    textInput: { fontSize: 15, maxHeight: 100 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
