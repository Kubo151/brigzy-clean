import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { MessageCircle, Search, ChevronRight } from 'lucide-react-native';
import { useText } from '@/lib/useText';
import { useColors } from '@/lib/useColors';

interface OtherUser {
  id: string;
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  otherUser: OtherUser;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<[string, Conversation][]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const C = useColors();
  const text = useText();

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(id, display_name, name, avatar_url), receiver:users!messages_receiver_id_fkey(id, display_name, name, avatar_url)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!messages || messages.length === 0) {
      setConversations([]);
      return;
    }

    const grouped: Record<string, Conversation> = {};
    messages?.forEach((msg: any) => {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!grouped[otherUserId]) {
        grouped[otherUserId] = {
          otherUser: msg.sender_id === user.id ? msg.receiver : msg.sender,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
        };
      }
      if (msg.receiver_id === user.id && !msg.read) {
        grouped[otherUserId].unreadCount++;
      }
    });

    setConversations(Object.entries(grouped));
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Teraz';
    if (diffMins < 60) return `Pred ${diffMins} min`;
    if (diffHours < 24) return `Pred ${diffHours} hod`;
    return `Pred ${diffDays} dňami`;
  };

  const getInitials = (user: OtherUser): string => {
    if (user.display_name) return user.display_name.charAt(0).toUpperCase();
    if (user.name) return user.name.charAt(0).toUpperCase();
    return 'U';
  };

  const filteredConversations = conversations.filter(([userId, conv]) => {
    const userName = (conv.otherUser.display_name || conv.otherUser.name || '').toLowerCase();
    return userName.includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.largeTitle, { color: C.text }]}>
          {text.messages || 'Správy'}
        </Text>

        <View style={[styles.searchBar, { backgroundColor: C.searchFill }]}>
          <Search size={18} color={C.tertiaryLabel} strokeWidth={1.8} />
          <TextInput
            placeholder={text.searchConversations || 'Hľadať konverzácie...'}
            placeholderTextColor={C.tertiaryLabel}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: C.text }]}
          />
        </View>
      </View>

      {filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: C.surface }]}>
            <MessageCircle size={42} color={C.tertiaryLabel} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: C.text }]}>
            Žiadne konverzácie
          </Text>
          <Text style={[styles.emptySubtitle, { color: C.secondaryLabel }]}>
            Začnite konverzáciu s workerom alebo zamestnávateľom
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={({ item: [userId, conv], index }) => (
            <Pressable
              onPress={() => router.push(`/messages/${userId}`)}
              style={({ pressed }) => [
                styles.conversationRow,
                { backgroundColor: pressed ? C.surface2 : 'transparent' },
                index < filteredConversations.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: C.separator,
                },
              ]}
            >
              {/* Avatar */}
              <View style={{ position: 'relative' }}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(conv.otherUser)}
                  </Text>
                </View>
                {conv.unreadCount > 0 && (
                  <View style={[styles.unreadBadge, { borderColor: C.bg }]}>
                    <Text style={styles.unreadText}>{conv.unreadCount}</Text>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.convInfo}>
                <View style={styles.convHeader}>
                  <Text style={[styles.userName, { color: C.text }]} numberOfLines={1}>
                    {conv.otherUser.display_name || conv.otherUser.name || 'User'}
                  </Text>
                  <Text style={[styles.timeText, { color: C.tertiaryLabel }]}>
                    {getTimeAgo(conv.lastMessageTime)}
                  </Text>
                </View>
                <Text
                  style={[styles.lastMsg, { color: C.secondaryLabel }]}
                  numberOfLines={1}
                >
                  {conv.lastMessage}
                </Text>
              </View>

              <ChevronRight size={16} color={C.tertiaryLabel} strokeWidth={1.8} />
            </Pressable>
          )}
          keyExtractor={([userId]) => userId}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.37,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  convInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 13,
  },
  lastMsg: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
});
