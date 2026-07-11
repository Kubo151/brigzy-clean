import React, { useEffect, useState, useRef, useMemo } from "react";
import {
    View, Text, ScrollView, TextInput, Pressable, AppState,
    KeyboardAvoidingView, Platform, Image, ActivityIndicator, StyleSheet, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Send, Paperclip, Mic, Square, Play, Pause, Pencil, Trash2, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import {
    useAudioRecorder, useAudioRecorderState, RecordingPresets,
    requestRecordingPermissionsAsync, useAudioPlayer, useAudioPlayerStatus,
} from "expo-audio";
import { supabase } from "@/lib/supabase";
import { useClay } from "@/lib/useClay";
import type { ClayColors } from "@/lib/useClay";
import * as Haptics from "expo-haptics";
import { ClaySurface, ClayInset } from "@/components/clay";
import { goBack } from '@/lib/nav';
import { showAlert } from '@/lib/notify';

interface Message {
    id: string; content: string; sender_id: string;
    receiver_id: string; created_at: string; read: boolean;
    message_type?: 'text' | 'system' | 'image' | 'audio';
    media_path?: string | null;
    media_duration_seconds?: number | null;
    edited_at?: string | null;
    deleted_at?: string | null;
}
interface UserProfile {
    id: string; name: string; display_name: string | null;
    avatar_url: string | null; role: string;
}
interface Reaction {
    id: string; message_id: string; user_id: string; emoji: string;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ChatScreen() {
    const { userId, jobId } = useLocalSearchParams<{ userId: string; jobId?: string }>();
    const router = useRouter();
    const C = useClay();
    const st = useMemo(() => makeStyles(C), [C]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [activeMessage, setActiveMessage] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    // The realtime callback must read the CURRENT user id — a state value would
    // be captured as null in the closure created before the session loads.
    const currentUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Realtime sockets die silently (mobile browsers kill them in the
        // background and they don't always come back), so belt & braces:
        // 1. resubscribe whenever the channel reports failure,
        // 2. refetch + resubscribe when the app returns to the foreground,
        // 3. quiet polling as the last-resort fallback.
        let channel: ReturnType<typeof supabase.channel> | null = null;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;
        let disposed = false;

        const subscribe = () => {
            if (disposed) return;
            if (channel) supabase.removeChannel(channel);
            channel = supabase.channel(`chat-${userId}-${Date.now()}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                    const newMsg = payload.new as Message;
                    const me = currentUserIdRef.current;
                    if ((newMsg.sender_id === userId && newMsg.receiver_id === me) ||
                        (newMsg.sender_id === me && newMsg.receiver_id === userId)) {
                        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                    }
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
                    const updated = payload.new as Message;
                    const me = currentUserIdRef.current;
                    if ((updated.sender_id === userId && updated.receiver_id === me) ||
                        (updated.sender_id === me && updated.receiver_id === userId)) {
                        setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
                    }
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, (payload) => {
                    const r = payload.new as Reaction;
                    setReactions(prev => prev.some(x => x.id === r.id) ? prev : [...prev, r]);
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'message_reactions' }, (payload) => {
                    const r = payload.new as Reaction;
                    setReactions(prev => prev.map(x => x.id === r.id ? r : x));
                })
                .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, (payload) => {
                    const r = payload.old as Reaction;
                    setReactions(prev => prev.filter(x => x.id !== r.id));
                })
                .subscribe((status) => {
                    if (disposed) return;
                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        if (retryTimer) clearTimeout(retryTimer);
                        retryTimer = setTimeout(subscribe, 3000);
                    }
                });
        };

        (async () => {
            await loadUserAndMessages();
            subscribe();
        })();

        const appStateSub = AppState.addEventListener('change', (state) => {
            if (state === 'active' && !disposed) {
                loadUserAndMessages();
                subscribe();
            }
        });
        const pollTimer = setInterval(() => { if (!disposed) loadUserAndMessages(); }, 10000);

        return () => {
            disposed = true;
            appStateSub.remove();
            clearInterval(pollTimer);
            if (retryTimer) clearTimeout(retryTimer);
            if (channel) supabase.removeChannel(channel);
        };
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
                const ids = messagesData.map(m => m.id);
                if (ids.length > 0) {
                    const { data: reactionsData } = await supabase.from('message_reactions').select('*').in('message_id', ids);
                    if (reactionsData) setReactions(reactionsData);
                }
            }
        } catch (e) { console.error('Error:', e); }
        finally { setLoading(false); }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUserId || sending) return;
        if (editingMessage) { await saveEdit(); return; }
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

    const startEdit = (message: Message) => {
        setActiveMessage(null);
        setEditingMessage(message);
        setNewMessage(message.content);
    };

    const cancelEdit = () => {
        setEditingMessage(null);
        setNewMessage("");
    };

    const saveEdit = async () => {
        if (!editingMessage || !newMessage.trim()) return;
        setSending(true);
        try {
            const trimmed = newMessage.trim();
            const { data: updated, error } = await supabase.from('messages')
                .update({ content: trimmed, edited_at: new Date().toISOString() })
                .eq('id', editingMessage.id).select().single();
            if (error) { showAlert('Chyba', 'Nepodarilo sa upraviť správu'); }
            else if (updated) {
                setMessages(prev => prev.map(m => m.id === updated.id ? updated as Message : m));
                setEditingMessage(null);
                setNewMessage("");
            }
        } catch (e) { console.error('Error:', e); }
        finally { setSending(false); }
    };

    const deleteMessage = (message: Message) => {
        setActiveMessage(null);
        showAlert('Vymazať správu?', 'Táto akcia sa nedá vrátiť späť.', [
            {
                text: 'Vymazať', style: 'destructive', onPress: async () => {
                    const { data: updated, error } = await supabase.from('messages')
                        .update({ deleted_at: new Date().toISOString(), content: '', media_path: null })
                        .eq('id', message.id).select().single();
                    if (!error && updated) setMessages(prev => prev.map(m => m.id === updated.id ? updated as Message : m));
                },
            },
            { text: 'Zrušiť', style: 'cancel' },
        ]);
    };

    const toggleReaction = async (messageId: string, emoji: string) => {
        if (!currentUserId) return;
        const mine = reactions.find(r => r.message_id === messageId && r.user_id === currentUserId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveMessage(null);
        if (mine && mine.emoji === emoji) {
            setReactions(prev => prev.filter(r => r.id !== mine.id));
            await supabase.from('message_reactions').delete().eq('id', mine.id);
        } else if (mine) {
            setReactions(prev => prev.map(r => r.id === mine.id ? { ...r, emoji } : r));
            await supabase.from('message_reactions').update({ emoji }).eq('id', mine.id);
        } else {
            const { data: inserted } = await supabase.from('message_reactions')
                .insert({ message_id: messageId, user_id: currentUserId, emoji }).select().single();
            if (inserted) setReactions(prev => [...prev, inserted as Reaction]);
        }
    };

    const sendMediaMessage = async (messageType: 'image' | 'audio', mediaPath: string, durationSeconds?: number) => {
        if (!currentUserId) return;
        const fallbackContent = messageType === 'image' ? '📷 Fotka' : `🎤 Hlasová správa${durationSeconds ? ` (${durationSeconds}s)` : ''}`;
        const { data: inserted, error } = await supabase.from('messages').insert({
            sender_id: currentUserId, receiver_id: userId,
            content: fallbackContent, job_id: jobId || null, read: false,
            message_type: messageType, media_path: mediaPath,
            media_duration_seconds: durationSeconds ?? null,
        }).select().single();
        if (error) { showAlert('Chyba', 'Nepodarilo sa odoslať správu'); return; }
        if (inserted) setMessages(prev => prev.some(m => m.id === inserted.id) ? prev : [...prev, inserted as Message]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const uploadChatMedia = async (uri: string, ext: string, contentType: string) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const path = `${currentUserId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from('chat-media').upload(path, blob, { contentType });
        if (error) throw error;
        return path;
    };

    const pickAndSendImage = async (useCamera: boolean) => {
        try {
            const { status } = useCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') { showAlert('Chyba', 'Je potrebné povolenie'); return; }
            const result = useCamera
                ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 })
                : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
            if (result.canceled || !result.assets[0]) return;
            setSending(true);
            const asset = result.assets[0];
            // asset.uri is a blob: URI on web (no real file extension in it) —
            // derive the extension from mimeType, never from the URI string.
            const mimeType = asset.mimeType || 'image/jpeg';
            const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
            const path = await uploadChatMedia(asset.uri, ext, mimeType);
            await sendMediaMessage('image', path);
        } catch { showAlert('Chyba', 'Nepodarilo sa nahrať fotku'); }
        finally { setSending(false); }
    };

    const attachPress = () => {
        // showAlert's web fallback is window.confirm() — only 2 outcomes, so a
        // 3-button native picker can't map cleanly to web. On web go straight
        // to the file/gallery picker (the common case); native gets the choice.
        if (Platform.OS === 'web') { pickAndSendImage(false); return; }
        showAlert('Pridať fotku', undefined, [
            { text: 'Fotoaparát', onPress: () => pickAndSendImage(true) },
            { text: 'Galéria', onPress: () => pickAndSendImage(false) },
            { text: 'Zrušiť', style: 'cancel' },
        ]);
    };

    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder, 200);

    const toggleRecording = async () => {
        if (recorderState.isRecording) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await audioRecorder.stop();
            const uri = audioRecorder.uri;
            const durationSeconds = Math.round((recorderState.durationMillis || 0) / 1000);
            if (uri && durationSeconds > 0) {
                setSending(true);
                try {
                    const ext = Platform.OS === 'web' ? 'webm' : 'm4a';
                    const contentType = Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
                    const path = await uploadChatMedia(uri, ext, contentType);
                    await sendMediaMessage('audio', path, durationSeconds);
                } catch { showAlert('Chyba', 'Nepodarilo sa odoslať hlasovú správu'); }
                finally { setSending(false); }
            }
            return;
        }
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) { showAlert('Chyba', 'Je potrebné povolenie na nahrávanie zvuku'); return; }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
    };

    const signedUrlCache = useRef<Map<string, string>>(new Map());
    const [, forceSignedUrlRerender] = useState(0);
    useEffect(() => {
        const missing = messages.filter(m => m.media_path && !signedUrlCache.current.has(m.media_path));
        if (missing.length === 0) return;
        (async () => {
            for (const m of missing) {
                if (!m.media_path) continue;
                const { data } = await supabase.storage.from('chat-media').createSignedUrl(m.media_path, 3600);
                if (data?.signedUrl) signedUrlCache.current.set(m.media_path, data.signedUrl);
            }
            forceSignedUrlRerender(n => n + 1);
        })();
    }, [messages]);

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
                            const signedUrl = message.media_path ? signedUrlCache.current.get(message.media_path) : undefined;
                            const msgReactions = reactions.filter(r => r.message_id === message.id);
                            const isDeleted = !!message.deleted_at;
                            return (
                                <View key={message.id} style={{ marginBottom: 8 }}>
                                    {showTime && <Text style={[st.timestamp, { color: C.muted }]}>{formatTime(message.created_at)}</Text>}
                                    <Pressable
                                        onLongPress={() => !isDeleted && setActiveMessage(message)}
                                        delayLongPress={350}
                                        style={{ flexDirection: 'row', justifyContent: isSent ? 'flex-end' : 'flex-start' }}
                                    >
                                        {isDeleted ? (
                                            <View style={[st.bubble, st.deletedBubble, { borderColor: C.hair }]}>
                                                <Text style={[st.bubbleText, { color: C.muted, fontStyle: 'italic' }]}>Správa bola vymazaná</Text>
                                            </View>
                                        ) : message.message_type === 'image' ? (
                                            <ImageMessageBubble url={signedUrl} isSent={isSent} C={C} />
                                        ) : message.message_type === 'audio' ? (
                                            <AudioMessageBubble url={signedUrl} durationSeconds={message.media_duration_seconds ?? 0} isSent={isSent} C={C} />
                                        ) : isSent ? (
                                            <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[st.bubble, { borderBottomRightRadius: 5 }]}>
                                                <Text style={[st.bubbleText, { color: C.onAccent }]}>{message.content}</Text>
                                                {message.edited_at && <Text style={[st.editedLabel, { color: C.onAccent }]}>upravené</Text>}
                                            </LinearGradient>
                                        ) : (
                                            <ClaySurface radius={18} style={{ maxWidth: '78%' }} contentStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                                                <Text style={[st.bubbleText, { color: C.text }]}>{message.content}</Text>
                                                {message.edited_at && <Text style={[st.editedLabel, { color: C.muted }]}>upravené</Text>}
                                            </ClaySurface>
                                        )}
                                    </Pressable>
                                    {!isDeleted && msgReactions.length > 0 && (
                                        <ReactionPills
                                            reactions={msgReactions} currentUserId={currentUserId}
                                            isSent={isSent} C={C}
                                            onToggle={(emoji) => toggleReaction(message.id, emoji)}
                                        />
                                    )}
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {editingMessage && (
                    <View style={[st.editingBar, { backgroundColor: C.cLo, borderTopColor: C.hair }]}>
                        <Pencil size={14} color={C.accent} strokeWidth={2.2} />
                        <Text style={[st.editingBarText, { color: C.text }]} numberOfLines={1}>Upravujete správu</Text>
                        <Pressable onPress={cancelEdit} accessibilityLabel="Zrušiť úpravu">
                            <X size={18} color={C.muted} strokeWidth={2.2} />
                        </Pressable>
                    </View>
                )}

                {/* Input */}
                <View style={[st.inputBar, { backgroundColor: C.bg, borderTopColor: C.hair }]}>
                    {recorderState.isRecording ? (
                        <>
                            <View style={[st.recordingIndicator, { backgroundColor: C.cLo, borderColor: C.hair }]}>
                                <View style={st.recordingDot} />
                                <Text style={[st.recordingText, { color: C.text }]}>
                                    Nahrávam... {Math.round((recorderState.durationMillis || 0) / 1000)}s
                                </Text>
                            </View>
                            <Pressable onPress={toggleRecording} accessibilityLabel="Zastaviť nahrávanie a odoslať">
                                <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={st.sendBtn}>
                                    <Square size={16} color={C.onAccent} strokeWidth={2.2} fill={C.onAccent} />
                                </LinearGradient>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            {!editingMessage && (
                                <Pressable onPress={attachPress} disabled={sending} accessibilityLabel="Priložiť fotku">
                                    <ClaySurface radius={22} style={{ width: 44, height: 44 }} contentStyle={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                                        <Paperclip size={19} color={C.muted} strokeWidth={2} />
                                    </ClaySurface>
                                </Pressable>
                            )}
                            <ClayInset radius={22} style={{ flex: 1 }} contentStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                                <TextInput
                                    value={newMessage} onChangeText={setNewMessage}
                                    placeholder="Napíšte správu..." placeholderTextColor={C.muted}
                                    multiline maxLength={500}
                                    style={[st.textInput, { color: C.text }]}
                                />
                            </ClayInset>
                            <Pressable
                                onPress={canSend ? sendMessage : (editingMessage ? undefined : toggleRecording)}
                                disabled={sending || (!canSend && !!editingMessage)}
                                accessibilityLabel={canSend ? (editingMessage ? 'Uložiť úpravu' : 'Odoslať správu') : 'Nahrať hlasovku'}
                            >
                                {canSend ? (
                                    <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={st.sendBtn}>
                                        {sending ? <ActivityIndicator size="small" color={C.onAccent} /> : <Send size={18} color={C.onAccent} strokeWidth={2.2} />}
                                    </LinearGradient>
                                ) : (
                                    <View style={[st.sendBtn, { backgroundColor: C.cLo, borderWidth: 1, borderColor: C.hair }]}>
                                        {sending ? <ActivityIndicator size="small" color={C.muted} /> : <Mic size={18} color={C.muted} strokeWidth={2} />}
                                    </View>
                                )}
                            </Pressable>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>

            <MessageActionSheet
                message={activeMessage}
                isOwn={!!activeMessage && activeMessage.sender_id === currentUserId}
                canEdit={!!activeMessage && activeMessage.sender_id === currentUserId && (!activeMessage.message_type || activeMessage.message_type === 'text')}
                onClose={() => setActiveMessage(null)}
                onReact={(emoji) => activeMessage && toggleReaction(activeMessage.id, emoji)}
                onEdit={() => activeMessage && startEdit(activeMessage)}
                onDelete={() => activeMessage && deleteMessage(activeMessage)}
                C={C}
            />
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
    recordingIndicator: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13 },
    recordingDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#ef4444' },
    recordingText: { fontSize: 14, fontWeight: '600' },
    deletedBubble: { borderWidth: 1, borderStyle: 'dashed' },
    editedLabel: { fontSize: 10, fontWeight: '600', opacity: 0.7, marginTop: 3 },
    editingBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
    editingBarText: { flex: 1, fontSize: 12.5, fontWeight: '600' },
});

function ImageMessageBubble({ url, isSent, C }: { url?: string; isSent: boolean; C: ClayColors }) {
    if (!url) {
        return (
            <View style={[chatMediaStyles.imageBubble, { backgroundColor: C.cLo, alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="small" color={C.muted} />
            </View>
        );
    }
    return (
        <Pressable onPress={() => Platform.OS === 'web' && typeof window !== 'undefined' && window.open(url, '_blank')}>
            <Image source={{ uri: url }} style={chatMediaStyles.imageBubble} resizeMode="cover" />
        </Pressable>
    );
}

function AudioMessageBubble({ url, durationSeconds, isSent, C }: { url?: string; durationSeconds: number; isSent: boolean; C: ClayColors }) {
    const player = useAudioPlayer(url ?? null);
    const status = useAudioPlayerStatus(player);
    const totalSeconds = status.duration > 0 ? status.duration : durationSeconds;
    const progress = totalSeconds > 0 ? Math.min((status.currentTime || 0) / totalSeconds, 1) : 0;

    const toggle = () => {
        if (!url) return;
        if (status.playing) player.pause();
        else { if (status.currentTime >= totalSeconds && totalSeconds > 0) player.seekTo(0); player.play(); }
    };

    const bg = isSent
        ? { backgroundColor: C.accent }
        : { backgroundColor: C.cLo, borderWidth: 1, borderColor: C.hair };
    const fg = isSent ? C.onAccent : C.text;

    return (
        <View style={[chatMediaStyles.audioBubble, bg]}>
            <Pressable onPress={toggle} style={[chatMediaStyles.audioPlayBtn, { backgroundColor: isSent ? 'rgba(255,255,255,0.25)' : C.cHi }]}>
                {!url ? <ActivityIndicator size="small" color={fg} /> : status.playing
                    ? <Pause size={15} color={fg} strokeWidth={2.4} fill={fg} />
                    : <Play size={15} color={fg} strokeWidth={2.4} fill={fg} />}
            </Pressable>
            <View style={{ flex: 1 }}>
                <View style={[chatMediaStyles.audioTrack, { backgroundColor: isSent ? 'rgba(255,255,255,0.3)' : C.hair }]}>
                    <View style={[chatMediaStyles.audioTrackFill, { width: `${progress * 100}%`, backgroundColor: fg }]} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: fg, marginTop: 5, opacity: 0.85 }}>
                    {Math.round(totalSeconds)}s
                </Text>
            </View>
        </View>
    );
}

const chatMediaStyles = StyleSheet.create({
    imageBubble: { width: 200, height: 200, borderRadius: 18, overflow: 'hidden' },
    audioBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, minWidth: 170 },
    audioPlayBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    audioTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
    audioTrackFill: { height: 3, borderRadius: 2 },
});

function ReactionPills({ reactions, currentUserId, isSent, onToggle, C }: {
    reactions: Reaction[]; currentUserId: string | null; isSent: boolean;
    onToggle: (emoji: string) => void; C: ClayColors;
}) {
    const groups = new Map<string, Reaction[]>();
    for (const r of reactions) groups.set(r.emoji, [...(groups.get(r.emoji) ?? []), r]);
    return (
        <View style={[st2.reactionRow, { justifyContent: isSent ? 'flex-end' : 'flex-start' }]}>
            {Array.from(groups.entries()).map(([emoji, group]) => {
                const mine = group.some(r => r.user_id === currentUserId);
                return (
                    <Pressable
                        key={emoji}
                        onPress={() => onToggle(emoji)}
                        style={[st2.reactionPill, {
                            backgroundColor: mine ? C.accentDim : C.cLo,
                            borderColor: mine ? C.accent : C.hair,
                        }]}
                    >
                        <Text style={st2.reactionEmoji}>{emoji}</Text>
                        {group.length > 1 && <Text style={[st2.reactionCount, { color: mine ? C.accent : C.muted }]}>{group.length}</Text>}
                    </Pressable>
                );
            })}
        </View>
    );
}

function MessageActionSheet({ message, isOwn, canEdit, onClose, onReact, onEdit, onDelete, C }: {
    message: Message | null; isOwn: boolean; canEdit: boolean;
    onClose: () => void; onReact: (emoji: string) => void;
    onEdit: () => void; onDelete: () => void; C: ClayColors;
}) {
    return (
        <Modal visible={!!message} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={st2.sheetBackdrop} onPress={onClose}>
                <Pressable style={[st2.sheetContent, { backgroundColor: C.bg }]} onPress={(e) => e.stopPropagation()}>
                    <View style={st2.sheetEmojiRow}>
                        {QUICK_REACTIONS.map(emoji => (
                            <Pressable key={emoji} onPress={() => onReact(emoji)} style={[st2.sheetEmojiBtn, { backgroundColor: C.cLo }]}>
                                <Text style={st2.sheetEmojiText}>{emoji}</Text>
                            </Pressable>
                        ))}
                    </View>
                    {isOwn && canEdit && (
                        <Pressable onPress={onEdit} style={[st2.sheetActionRow, { borderTopColor: C.hair }]}>
                            <Pencil size={18} color={C.text} strokeWidth={2} />
                            <Text style={[st2.sheetActionText, { color: C.text }]}>Upraviť</Text>
                        </Pressable>
                    )}
                    {isOwn && (
                        <Pressable onPress={onDelete} style={[st2.sheetActionRow, { borderTopColor: C.hair }]}>
                            <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                            <Text style={[st2.sheetActionText, { color: '#ef4444' }]}>Vymazať</Text>
                        </Pressable>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const st2 = StyleSheet.create({
    reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    reactionPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
    reactionEmoji: { fontSize: 12 },
    reactionCount: { fontSize: 11, fontWeight: '700' },
    sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheetContent: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 16, paddingBottom: 30, paddingHorizontal: 16 },
    sheetEmojiRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 14 },
    sheetEmojiBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    sheetEmojiText: { fontSize: 24 },
    sheetActionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth },
    sheetActionText: { fontSize: 15, fontWeight: '600' },
});
