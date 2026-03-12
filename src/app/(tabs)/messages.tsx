import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, Pressable, RefreshControl,
  Image, TextInput, StyleSheet, ActivityIndicator, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useText } from "@/lib/useText";
import { useColors } from "@/lib/useColors";
import { Search, MessageSquare, ChevronRight } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";

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

export default function MessagesScreen() {
  const C = useColors();
  const text = useText();
  const router = useRouter();
  const { employerId, jobId } = useLocalSearchParams<{ employerId?: string; jobId?: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadConversations();

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel('all-messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          loadConversations();
        })
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
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
        {/* iOS Large Title */}
        <View style={styles.header}>
          <Text style={[styles.largeTitle, { color: C.text }]}>
            {text.messages}
          </Text>
          <Text style={[styles.subtitle, { color: C.secondaryLabel }]}>
            {text.chatWithEmployersWorkers}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={[styles.searchBar, { backgroundColor: C.searchFill }]}>
            <Search size={18} color={C.tertiaryLabel} strokeWidth={1.8} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={text.searchConversations}
              placeholderTextColor={C.tertiaryLabel}
              style={[styles.searchInput, { color: C.text }]}
            />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} colors={[C.purple]} />
        }
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={C.purple} />
          </View>
        ) : filteredConversations.length > 0 ? (
          <View>
            {filteredConversations.map((conv) => (
              <Pressable
                key={conv.userId}
                onPress={() => router.push(`/messages/${conv.userId}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
                  {/* Avatar */}
                  <View style={{ width: 52, height: 52 }}>
                    {conv.otherUser.avatar_url ? (
                      <Image
                        source={{ uri: conv.otherUser.avatar_url }}
                        style={{ width: 52, height: 52, borderRadius: 26 }}
                      />
                    ) : (
                      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '700' }}>
                          {(conv.otherUser.display_name || conv.otherUser.name)?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {conv.unreadCount > 0 && (
                      <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: C.bg }}>
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{conv.unreadCount}</Text>
                      </View>
                    )}
                  </View>

                  {/* Text content */}
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                      <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: conv.unreadCount > 0 ? '700' : '600', color: C.text, marginRight: 8 }}>
                        {conv.otherUser.display_name || conv.otherUser.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: C.tertiaryLabel }}>{formatTime(conv.lastMessageTime)}</Text>
                    </View>
                    {conv.jobTitle && (
                      <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '500', color: C.purple, marginBottom: 2 }}>{conv.jobTitle}</Text>
                    )}
                    <Text numberOfLines={1} style={{ fontSize: 14, color: conv.unreadCount > 0 ? C.text : C.secondaryLabel, fontWeight: conv.unreadCount > 0 ? '500' : '400' }}>
                      {conv.lastMessage}
                    </Text>
                  </View>

                  {/* Chevron */}
                  <ChevronRight size={16} color={C.tertiaryLabel} strokeWidth={1.8} style={{ marginLeft: 4 }} />
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          /* Empty state */
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: C.purpleDim }]}>
              <MessageSquare size={36} color={C.purple} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text }]}>
              Zatiaľ žiadne správy
            </Text>
            <Text style={[styles.emptyDesc, { color: C.secondaryLabel }]}>
              Začnite aplikovať na brigády a spojte sa so zamestnávateľmi
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },

  // List
  listContent: {
    paddingBottom: 100,
  },
  centerState: {
    paddingVertical: 80,
    alignItems: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
});
