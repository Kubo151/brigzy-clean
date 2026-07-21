import React, { useEffect, useState, useRef, useMemo } from "react";
import {
    View, Text, ScrollView, TextInput, Pressable, AppState,
    KeyboardAvoidingView, Platform, Image, ActivityIndicator, StyleSheet, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Send, Paperclip, Mic, Square, Play, Pause, Pencil, Trash2, X, Handshake, Check, Clock3 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import {
    useAudioRecorder, useAudioRecorderState, RecordingPresets,
    requestRecordingPermissionsAsync, useAudioPlayer, useAudioPlayerStatus,
} from "expo-audio";
import { supabase } from "@/lib/supabase";
import { useFlint, RADIUS } from "@/lib/useFlint";
import type { FlintColors } from "@/lib/useFlint";
import * as Haptics from "expo-haptics";
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
interface Negotiation {
    id: string; application_id: string; round: number;
    proposed_by: 'worker' | 'poster'; rate_cents: number;
    rate_type: 'hourly' | 'fixed'; note: string | null;
    currency: string; status: 'pending' | 'accepted' | 'rejected' | 'expired';
    created_at: string;
}
interface NegotiationApp {
    id: string; status: string; negotiated_rate_cents: number | null;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ChatScreen() {
    const { userId, jobId } = useLocalSearchParams<{ userId: string; jobId?: string }>();
    const router = useRouter();
    const C = useFlint();
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

    // S2 price negotiation (only when this chat is scoped to a job via ?jobId=)
    const [negotiationApp, setNegotiationApp] = useState<NegotiationApp | null>(null);
    const [myNegRole, setMyNegRole] = useState<'worker' | 'poster' | null>(null);
    const [jobPayType, setJobPayType] = useState<'hourly' | 'fixed'>('hourly');
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [proposeVisible, setProposeVisible] = useState(false);
    const [proposeAmount, setProposeAmount] = useState('');
    const [proposeNote, setProposeNote] = useState('');
    const [proposeRateType, setProposeRateType] = useState<'hourly' | 'fixed'>('hourly');
    const [negotiating, setNegotiating] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    // The realtime callback must read the CURRENT user id — a state value would
    // be captured as null in the closure created before the session loads.
    const currentUserIdRef = useRef<string | null>(null);
    const negotiationAppIdRef = useRef<string | null>(null);
    useEffect(() => { negotiationAppIdRef.current = negotiationApp?.id ?? null; }, [negotiationApp]);

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
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'price_negotiations' }, (payload) => {
                    const n = payload.new as Negotiation;
                    if (n.application_id !== negotiationAppIdRef.current) return;
                    setNegotiations(prev => prev.some(x => x.id === n.id) ? prev : [...prev, n]);
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'price_negotiations' }, (payload) => {
                    const n = payload.new as Negotiation;
                    if (n.application_id !== negotiationAppIdRef.current) return;
                    setNegotiations(prev => prev.map(x => x.id === n.id ? n : x));
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

    // S2: resolve which party is worker/poster for this job + load the
    // application + its negotiation history. Runs once jobId+currentUserId
    // are known (not on every poll — negotiation state updates via realtime).
    useEffect(() => {
        if (!jobId || !currentUserId) return;
        (async () => {
            const { data: job } = await supabase.from('jobs')
                .select('id, poster_user_id, employer_id, pay_type').eq('id', jobId).maybeSingle();
            if (!job) return;
            const posterUserId = job.poster_user_id ?? job.employer_id;
            setJobPayType((job.pay_type as 'hourly' | 'fixed') ?? 'hourly');
            setProposeRateType((job.pay_type as 'hourly' | 'fixed') ?? 'hourly');

            let role: 'worker' | 'poster' | null = null;
            let workerId: string | null = null;
            if (currentUserId === posterUserId) { role = 'poster'; workerId = userId as string; }
            else if (userId === posterUserId) { role = 'worker'; workerId = currentUserId; }
            if (!role || !workerId) return;
            setMyNegRole(role);

            const { data: app } = await supabase.from('applications')
                .select('id, status, negotiated_rate_cents')
                .eq('job_id', jobId)
                .or(`worker_id.eq.${workerId},worker_user_id.eq.${workerId}`)
                .maybeSingle();
            if (!app) return;
            setNegotiationApp(app);

            const { data: negs } = await supabase.from('price_negotiations')
                .select('*').eq('application_id', app.id).order('round', { ascending: true });
            if (negs) setNegotiations(negs);
        })();
    }, [jobId, currentUserId, userId]);

    const latestNegotiation = negotiations.length > 0 ? negotiations[negotiations.length - 1] : null;

    const submitProposal = async () => {
        if (!negotiationApp || negotiating) return;
        const eur = parseFloat(proposeAmount.replace(',', '.'));
        if (!eur || eur <= 0) { showAlert('Chyba', 'Zadajte platnú sumu'); return; }
        setNegotiating(true);
        try {
            const { data, error } = await supabase.functions.invoke('negotiate-price', {
                body: {
                    application_id: negotiationApp.id, action: 'propose',
                    rate_cents: Math.round(eur * 100), rate_type: proposeRateType,
                    note: proposeNote.trim() || undefined,
                },
            });
            if (error || data?.error) throw error ?? new Error(data.error);
            setNegotiations(prev => [...prev, data.negotiation]);
            setProposeVisible(false);
            setProposeAmount(''); setProposeNote('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) { console.error(e); showAlert('Chyba', 'Nepodarilo sa odoslať návrh'); }
        finally { setNegotiating(false); }
    };

    const respondToProposal = async (action: 'accept' | 'reject') => {
        if (!negotiationApp || !latestNegotiation || negotiating) return;
        setNegotiating(true);
        try {
            const { data, error } = await supabase.functions.invoke('negotiate-price', {
                body: { application_id: negotiationApp.id, action, negotiation_id: latestNegotiation.id },
            });
            if (error || data?.error) throw error ?? new Error(data.error);
            setNegotiations(prev => prev.map(n => n.id === data.negotiation.id ? data.negotiation : n));
            if (data.application) setNegotiationApp(prev => prev ? { ...prev, negotiated_rate_cents: data.application.negotiated_rate_cents } : prev);
            Haptics.notificationAsync(action === 'accept' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
        } catch (e) { console.error(e); showAlert('Chyba', 'Akcia zlyhala'); }
        finally { setNegotiating(false); }
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
                    <View style={[st.backBtn, { backgroundColor: C.card2 }]}>
                        <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
                    </View>
                </Pressable>
                <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/user/${userId}`); }}
                    style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }, pressed && { opacity: 0.7 }]}
                >
                    {otherUser?.avatar_url ? (
                        <Image source={{ uri: otherUser.avatar_url }} style={st.avatar} />
                    ) : (
                        <View style={[st.avatar, { backgroundColor: C.accent }]}>
                            <Text style={[st.avatarLetter, { color: C.onAccent }]}>{initial}</Text>
                        </View>
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
                                            <View style={[st.bubble, st.deletedBubble, { borderColor: C.divider, backgroundColor: C.card2 }]}>
                                                <Text style={[st.bubbleText, { color: C.muted, fontStyle: 'italic' }]}>Správa bola vymazaná</Text>
                                            </View>
                                        ) : message.message_type === 'image' ? (
                                            <ImageMessageBubble url={signedUrl} isSent={isSent} C={C} />
                                        ) : message.message_type === 'audio' ? (
                                            <AudioMessageBubble url={signedUrl} durationSeconds={message.media_duration_seconds ?? 0} isSent={isSent} C={C} />
                                        ) : isSent ? (
                                            <View style={[st.bubble, { borderBottomRightRadius: 5, backgroundColor: C.accent }]}>
                                                <Text style={[st.bubbleText, { color: C.onAccent }]}>{message.content}</Text>
                                                {message.edited_at && <Text style={[st.editedLabel, { color: C.onAccent }]}>upravené</Text>}
                                            </View>
                                        ) : (
                                            <View style={[st.bubble, { maxWidth: '78%', backgroundColor: C.card2, borderBottomLeftRadius: 5 }]}>
                                                <Text style={[st.bubbleText, { color: C.text }]}>{message.content}</Text>
                                                {message.edited_at && <Text style={[st.editedLabel, { color: C.muted }]}>upravené</Text>}
                                            </View>
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

                {negotiationApp && negotiationApp.status === 'pending' && (
                    <View style={[st.negBar, { backgroundColor: C.card2, borderTopColor: C.divider }]}>
                        {!latestNegotiation ? (
                            <Pressable onPress={() => setProposeVisible(true)} style={st.negRow}>
                                <Handshake size={16} color={C.accent} strokeWidth={2.2} />
                                <Text style={[st.negText, { color: C.accent }]}>Navrhnúť sumu</Text>
                            </Pressable>
                        ) : latestNegotiation.status === 'accepted' ? (
                            <View style={st.negRow}>
                                <Check size={16} color={C.green} strokeWidth={2.4} />
                                <Text style={[st.negText, { color: C.green }]}>
                                    Dohodnutá suma: €{(latestNegotiation.rate_cents / 100).toFixed(2)}{latestNegotiation.rate_type === 'hourly' ? '/h' : ''}
                                </Text>
                            </View>
                        ) : latestNegotiation.status === 'pending' && latestNegotiation.proposed_by === myNegRole ? (
                            <View style={st.negRow}>
                                <Clock3 size={16} color={C.muted} strokeWidth={2.2} />
                                <Text style={[st.negText, { color: C.muted }]}>
                                    Čakáte na odpoveď — €{(latestNegotiation.rate_cents / 100).toFixed(2)}{latestNegotiation.rate_type === 'hourly' ? '/h' : ''}
                                </Text>
                            </View>
                        ) : latestNegotiation.status === 'pending' ? (
                            <View>
                                <Text style={[st.negText, { color: C.text, marginBottom: 8 }]}>
                                    Návrh: €{(latestNegotiation.rate_cents / 100).toFixed(2)}{latestNegotiation.rate_type === 'hourly' ? '/h' : ''}
                                    {latestNegotiation.note ? ` — ${latestNegotiation.note}` : ''}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <Pressable disabled={negotiating} onPress={() => respondToProposal('accept')} style={[st.negBtn, { backgroundColor: C.green }]}>
                                        <Text style={st.negBtnText}>Prijať</Text>
                                    </Pressable>
                                    <Pressable disabled={negotiating} onPress={() => respondToProposal('reject')} style={[st.negBtn, { backgroundColor: C.red }]}>
                                        <Text style={st.negBtnText}>Odmietnuť</Text>
                                    </Pressable>
                                    <Pressable disabled={negotiating} onPress={() => setProposeVisible(true)} style={[st.negBtn, { backgroundColor: C.card }]}>
                                        <Text style={[st.negBtnText, { color: C.text }]}>Protinávrh</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : negotiations.length >= 3 ? (
                            <Text style={[st.negText, { color: C.muted }]}>Maximálny počet kôl vyjednávania dosiahnutý</Text>
                        ) : (
                            <Pressable onPress={() => setProposeVisible(true)} style={st.negRow}>
                                <Handshake size={16} color={C.accent} strokeWidth={2.2} />
                                <Text style={[st.negText, { color: C.accent }]}>Posledný návrh zamietnutý — navrhnúť novú sumu</Text>
                            </Pressable>
                        )}
                    </View>
                )}

                {editingMessage && (
                    <View style={[st.editingBar, { backgroundColor: C.card2, borderTopColor: C.divider }]}>
                        <Pencil size={14} color={C.accent} strokeWidth={2.2} />
                        <Text style={[st.editingBarText, { color: C.text }]} numberOfLines={1}>Upravujete správu</Text>
                        <Pressable onPress={cancelEdit} accessibilityLabel="Zrušiť úpravu">
                            <X size={18} color={C.muted} strokeWidth={2.2} />
                        </Pressable>
                    </View>
                )}

                {/* Input */}
                <View style={[st.inputBar, { backgroundColor: C.bg, borderTopColor: C.divider }]}>
                    {recorderState.isRecording ? (
                        <>
                            <View style={[st.recordingIndicator, { backgroundColor: C.card2 }]}>
                                <View style={st.recordingDot} />
                                <Text style={[st.recordingText, { color: C.text }]}>
                                    Nahrávam... {Math.round((recorderState.durationMillis || 0) / 1000)}s
                                </Text>
                            </View>
                            <Pressable onPress={toggleRecording} accessibilityLabel="Zastaviť nahrávanie a odoslať">
                                <View style={[st.sendBtn, { backgroundColor: C.accent }]}>
                                    <Square size={16} color={C.onAccent} strokeWidth={2.2} fill={C.onAccent} />
                                </View>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            {!editingMessage && (
                                <Pressable onPress={attachPress} disabled={sending} accessibilityLabel="Priložiť fotku">
                                    <View style={[st.attachBtn, { backgroundColor: C.card2 }]}>
                                        <Paperclip size={19} color={C.muted} strokeWidth={2} />
                                    </View>
                                </Pressable>
                            )}
                            <View style={[st.textInputWrap, { backgroundColor: C.card2 }]}>
                                <TextInput
                                    value={newMessage} onChangeText={setNewMessage}
                                    placeholder="Napíšte správu..." placeholderTextColor={C.muted}
                                    multiline maxLength={500}
                                    style={[st.textInput, { color: C.text }]}
                                />
                            </View>
                            <Pressable
                                onPress={canSend ? sendMessage : (editingMessage ? undefined : toggleRecording)}
                                disabled={sending || (!canSend && !!editingMessage)}
                                accessibilityLabel={canSend ? (editingMessage ? 'Uložiť úpravu' : 'Odoslať správu') : 'Nahrať hlasovku'}
                            >
                                {canSend ? (
                                    <View style={[st.sendBtn, { backgroundColor: C.accent }]}>
                                        {sending ? <ActivityIndicator size="small" color={C.onAccent} /> : <Send size={18} color={C.onAccent} strokeWidth={2.2} />}
                                    </View>
                                ) : (
                                    <View style={[st.sendBtn, { backgroundColor: C.card2 }]}>
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

            <Modal visible={proposeVisible} transparent animationType="fade" onRequestClose={() => setProposeVisible(false)}>
                <Pressable style={st.sheetBackdropAlt} onPress={() => setProposeVisible(false)}>
                    <Pressable style={[st.proposeSheet, { backgroundColor: C.bg }]} onPress={(e) => e.stopPropagation()}>
                        <Text style={[st.proposeTitle, { color: C.text }]}>Navrhnúť sumu</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                            {(['hourly', 'fixed'] as const).map(t => (
                                <Pressable key={t} onPress={() => setProposeRateType(t)}
                                    style={[st.rateTypeBtn, { backgroundColor: proposeRateType === t ? C.accent : C.card2 }]}>
                                    <Text style={[st.rateTypeText, { color: proposeRateType === t ? C.onAccent : C.text }]}>
                                        {t === 'hourly' ? 'Na hodinu' : 'Pevná suma'}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        <View style={[st.proposeInputWrap, { backgroundColor: C.card2, marginBottom: 10 }]}>
                            <TextInput
                                value={proposeAmount} onChangeText={setProposeAmount}
                                placeholder="Suma v €" placeholderTextColor={C.muted}
                                keyboardType="decimal-pad"
                                style={[st.proposeInput, { color: C.text }]}
                            />
                        </View>
                        <View style={[st.proposeInputWrap, { backgroundColor: C.card2, marginBottom: 16 }]}>
                            <TextInput
                                value={proposeNote} onChangeText={setProposeNote}
                                placeholder="Poznámka (nepovinné)" placeholderTextColor={C.muted}
                                maxLength={200}
                                style={[st.proposeInput, { color: C.text }]}
                            />
                        </View>
                        <Pressable disabled={negotiating} onPress={submitProposal} style={[st.negBtn, { backgroundColor: C.accent, paddingVertical: 13 }]}>
                            {negotiating ? <ActivityIndicator size="small" color={C.onAccent} /> : <Text style={st.negBtnText}>Odoslať návrh</Text>}
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const makeStyles = (C: FlintColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.divider, gap: 12 },
    backBtn: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarLetter: { fontSize: 16, fontWeight: '700' },
    chatName: { fontSize: 16.5, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
    chatRole: { fontSize: 12.5, fontWeight: '600', color: C.accent },
    emptyText: { textAlign: 'center', fontSize: 14, fontWeight: '500', lineHeight: 21 },
    timestamp: { textAlign: 'center', fontSize: 11, marginBottom: 8, fontWeight: '600' },
    bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleText: { fontSize: 14.5, lineHeight: 21, fontWeight: '500' },
    inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
    attachBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    textInputWrap: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10 },
    textInput: { fontSize: 15, maxHeight: 100, fontWeight: '500' },
    sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    recordingIndicator: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 13 },
    recordingDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#ef4444' },
    recordingText: { fontSize: 14, fontWeight: '600' },
    deletedBubble: { borderWidth: 1, borderStyle: 'dashed' },
    editedLabel: { fontSize: 10, fontWeight: '600', opacity: 0.7, marginTop: 3 },
    editingBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
    editingBarText: { flex: 1, fontSize: 12.5, fontWeight: '600' },
    negBar: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
    negRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    negText: { fontSize: 13.5, fontWeight: '600', flexShrink: 1 },
    negBtn: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    negBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    sheetBackdropAlt: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    proposeSheet: { width: '100%', maxWidth: 380, borderRadius: RADIUS.lg, padding: 20 },
    proposeTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
    rateTypeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    rateTypeText: { fontSize: 13, fontWeight: '600' },
    proposeInputWrap: { borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10 },
    proposeInput: { fontSize: 15, fontWeight: '500' },
});

function ImageMessageBubble({ url, isSent, C }: { url?: string; isSent: boolean; C: FlintColors }) {
    if (!url) {
        return (
            <View style={[chatMediaStyles.imageBubble, { backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }]}>
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

function AudioMessageBubble({ url, durationSeconds, isSent, C }: { url?: string; durationSeconds: number; isSent: boolean; C: FlintColors }) {
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
        : { backgroundColor: C.card2 };
    const fg = isSent ? C.onAccent : C.text;

    return (
        <View style={[chatMediaStyles.audioBubble, bg]}>
            <Pressable onPress={toggle} style={[chatMediaStyles.audioPlayBtn, { backgroundColor: isSent ? 'rgba(255,255,255,0.25)' : C.card }]}>
                {!url ? <ActivityIndicator size="small" color={fg} /> : status.playing
                    ? <Pause size={15} color={fg} strokeWidth={2.4} fill={fg} />
                    : <Play size={15} color={fg} strokeWidth={2.4} fill={fg} />}
            </Pressable>
            <View style={{ flex: 1 }}>
                <View style={[chatMediaStyles.audioTrack, { backgroundColor: isSent ? 'rgba(255,255,255,0.3)' : C.divider }]}>
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
    onToggle: (emoji: string) => void; C: FlintColors;
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
                            backgroundColor: mine ? C.accentDim : C.card2,
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
    onEdit: () => void; onDelete: () => void; C: FlintColors;
}) {
    return (
        <Modal visible={!!message} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={st2.sheetBackdrop} onPress={onClose}>
                <Pressable style={[st2.sheetContent, { backgroundColor: C.card }]} onPress={(e) => e.stopPropagation()}>
                    <View style={st2.sheetEmojiRow}>
                        {QUICK_REACTIONS.map(emoji => (
                            <Pressable key={emoji} onPress={() => onReact(emoji)} style={[st2.sheetEmojiBtn, { backgroundColor: C.card2 }]}>
                                <Text style={st2.sheetEmojiText}>{emoji}</Text>
                            </Pressable>
                        ))}
                    </View>
                    {isOwn && canEdit && (
                        <Pressable onPress={onEdit} style={[st2.sheetActionRow, { borderTopColor: C.divider }]}>
                            <Pencil size={18} color={C.text} strokeWidth={2} />
                            <Text style={[st2.sheetActionText, { color: C.text }]}>Upraviť</Text>
                        </Pressable>
                    )}
                    {isOwn && (
                        <Pressable onPress={onDelete} style={[st2.sheetActionRow, { borderTopColor: C.divider }]}>
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
    reactionPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
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
