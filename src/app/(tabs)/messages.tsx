import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, Pressable, RefreshControl, AppState,
  Image, TextInput, StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useText } from "@/lib/useText";
import { useClay } from "@/lib/useClay";
import { Search, MessageSquare, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ClaySurface, ClayInset, ClayIconBox } from "@/components/clay";

interface Conversation {
  userId: string;
  otherUser: {
    id: string;
    display_name: string | null;
    name: string;
    avatar_url: string | null;
    rating: number | null;
    role: string;
  };
  jobTitle?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface PersonResult {
  id: string;
  display_name: string | null;
  name: string | null;
  surname: string | null;
  avatar_url: string | null;
  brigzy_verified: boolean;
  rating_avg: number;
  rating_count: number;
}

export default function MessagesScreen() {
  const C = useClay();
  const text = useText();
  const router = useRouter();
  const { employerId, jobId } = useLocalSearchParams<{ employerId?: string; jobId?: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [people, setPeople] = useState<PersonResult[]>([]);

  // People search — find any user by name and open their public profile (W13)
  useEffect(() => {
    // Strip PostgREST filter metacharacters — q is interpolated into .or()
    const q = searchQuery.trim().replace(/[,()*%\\".]/g, '');
    if (q.length < 2) { setPeople([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase
          .from('users')
          .select('id, display_name, name, surname, avatar_url, brigzy_verified, rating_avg, rating_count')
          .or(`display_name.ilike.%${q}%,name.ilike.%${q}%,surname.ilike.%${q}%`)
          .neq('id', user?.id ?? '')
          .limit(8);
        setPeople((data ?? []) as PersonResult[]);
      } catch (e) {
        console.error('People search failed:', e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadConversations();

    // Same resilience as the chat thread: resubscribe on channel failure,
    // refetch on foreground, quiet polling as fallback.
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const subscribe = () => {
      if (disposed) return;
      if (channel) supabase.removeChannel(channel);
      channel = supabase
        .channel(`all-messages-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          loadConversations();
        })
        .subscribe((status) => {
          if (disposed) return;
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            if (retryTimer) clearTimeout(retryTimer);
            retryTimer = setTimeout(subscribe, 3000);
          }
        });
    };
    subscribe();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !disposed) {
        loadConversations();
        subscribe();
      }
    });
    const pollTimer = setInterval(() => { if (!disposed) loadConversations(); }, 15000);

    return () => {
      disposed = true;
      appStateSub.remove();
      clearInterval(pollTimer);
      if (retryTimer) clearTimeout(retryTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (employerId && !loading) {
      router.push(`/messages/${employerId}${jobId ? `?jobId=${jobId}` : ''}`);
    }
  }, [employerId, loading]);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setConversations([]); setLoading(false); setRefreshing(false); return; }
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`*, sender:users!messages_sender_id_fkey(id, display_name, name, avatar_url, rating, role), receiver:users!messages_receiver_id_fkey(id, display_name, name, avatar_url, rating, role), job:jobs(id, title)`)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error || !allMessages?.length) { setConversations([]); setLoading(false); setRefreshing(false); return; }

      const conversationsMap = new Map<string, Conversation>();
      allMessages.forEach((msg: any) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            userId: otherUserId, otherUser, jobTitle: msg.job?.title,
            lastMessage: msg.content, lastMessageTime: msg.created_at, unreadCount: 0,
          });
        }
        if (msg.receiver_id === user.id && !msg.read) {
          const conv = conversationsMap.get(otherUserId);
          if (conv) conv.unreadCount++;
        }
      });
      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadConversations(); };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'teraz';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' });
  };

  const filteredConversations = conversations.filter(conv =>
    (conv.otherUser.display_name || conv.otherUser.name)
      ?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg }}>
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: C.text }]}>{text.messages}</Text>
          <Text style={[styles.subtitle, { color: C.muted }]}>{text.chatWithEmployersWorkers}</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <ClayInset radius={14} contentStyle={styles.searchBar}>
            <Search size={18} color={C.muted} strokeWidth={1.9} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={text.searchConversations}
              placeholderTextColor={C.muted}
              style={[styles.searchInput, { color: C.text }]}
            />
          </ClayInset>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />}
      >
        {/* People results (search across all users → public profile) */}
        {people.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>
              {text.peopleSection}
            </Text>
            <ClaySurface radius={18}>
              {people.map((p, i) => {
                const pName = p.display_name || [p.name, p.surname].filter(Boolean).join(' ') || '—';
                return (
                  <React.Fragment key={p.id}>
                    {i > 0 && <View style={{ height: 1, backgroundColor: C.hair, marginLeft: 16 }} />}
                    <Pressable
                      onPress={() => router.push(`/user/${p.id}`)}
                      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', padding: 13 }, pressed && { opacity: 0.7 }]}
                    >
                      {p.avatar_url ? (
                        <Image source={{ uri: p.avatar_url }} style={{ width: 42, height: 42, borderRadius: 21 }} />
                      ) : (
                        <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: C.onAccent, fontSize: 17, fontWeight: '800' }}>{pName.charAt(0).toUpperCase()}</Text>
                        </LinearGradient>
                      )}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: -0.2 }}>
                          {pName}{p.brigzy_verified ? ' ✓' : ''}
                        </Text>
                        <Text style={{ fontSize: 12.5, color: C.muted, fontWeight: '500' }}>
                          {(p.rating_count ?? 0) > 0 ? `★ ${Number(p.rating_avg).toFixed(1)} (${p.rating_count}) · ` : ''}{text.viewProfile}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={C.muted} strokeWidth={2} />
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </ClaySurface>
          </View>
        )}

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={C.accent} />
          </View>
        ) : filteredConversations.length > 0 ? (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {filteredConversations.map((conv) => (
              <Pressable
                key={conv.userId}
                onPress={() => router.push(`/messages/${conv.userId}`)}
                style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }], opacity: 0.9 }]}
              >
                <ClaySurface radius={20} contentStyle={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                  {/* Avatar */}
                  <View style={{ width: 52, height: 52 }}>
                    {conv.otherUser.avatar_url ? (
                      <Image source={{ uri: conv.otherUser.avatar_url }} style={{ width: 52, height: 52, borderRadius: 26 }} />
                    ) : (
                      <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: C.onAccent, fontSize: 20, fontWeight: '800' }}>
                          {(conv.otherUser.display_name || conv.otherUser.name)?.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                    {conv.unreadCount > 0 && (
                      <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: C.red, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: C.cHi }}>
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>{conv.unreadCount}</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                      <Text numberOfLines={1} style={{ flex: 1, fontSize: 15.5, fontWeight: conv.unreadCount > 0 ? '800' : '700', color: C.text, marginRight: 8, letterSpacing: -0.3 }}>
                        {conv.otherUser.display_name || conv.otherUser.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>{formatTime(conv.lastMessageTime)}</Text>
                    </View>
                    {conv.jobTitle && (
                      <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: '700', color: C.accent, marginBottom: 2 }}>{conv.jobTitle}</Text>
                    )}
                    <Text numberOfLines={1} style={{ fontSize: 13.5, color: conv.unreadCount > 0 ? C.text : C.muted, fontWeight: conv.unreadCount > 0 ? '600' : '500' }}>
                      {conv.lastMessage}
                    </Text>
                  </View>

                  <ChevronRight size={16} color={C.muted} strokeWidth={2} style={{ marginLeft: 4 }} />
                </ClaySurface>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ClayIconBox size={80} radius={26}><MessageSquare size={36} color={C.accent} strokeWidth={1.6} /></ClayIconBox>
            <Text style={[styles.emptyTitle, { color: C.text }]}>Zatiaľ žiadne správy</Text>
            <Text style={[styles.emptyDesc, { color: C.muted }]}>Začnite aplikovať na brigády a spojte sa so zamestnávateľmi</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  largeTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, fontWeight: '600' },
  searchWrapper: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 46, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  listContent: { paddingTop: 4, paddingBottom: 120 },
  centerState: { paddingVertical: 80, alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, marginTop: 20, letterSpacing: -0.4 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21, fontWeight: '500' },
});
