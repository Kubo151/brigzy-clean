import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { MessageCircle, Search, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useText } from '@/lib/useText';
import { useClay } from '@/lib/useClay';
import { ClaySurface, ClayInset, ClayIconBox } from '@/components/clay';

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
  const C = useClay();
  const text = useText();

  useEffect(() => {
    loadConversations();
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => { loadConversations(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(id, display_name, name, avatar_url), receiver:users!messages_receiver_id_fkey(id, display_name, name, avatar_url)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (!messages || messages.length === 0) { setConversations([]); return; }
    const grouped: Record<string, Conversation> = {};
    messages?.forEach((msg: any) => {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!grouped[otherUserId]) {
        grouped[otherUserId] = {
          otherUser: msg.sender_id === user.id ? msg.receiver : msg.sender,
          lastMessage: msg.content, lastMessageTime: msg.created_at, unreadCount: 0,
        };
      }
      if (msg.receiver_id === user.id && !msg.read) grouped[otherUserId].unreadCount++;
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
        <Text style={[styles.largeTitle, { color: C.text }]}>{text.messages || 'Správy'}</Text>
        <ClayInset radius={14} contentStyle={styles.searchBar}>
          <Search size={18} color={C.muted} strokeWidth={1.9} />
          <TextInput
            placeholder={text.searchConversations || 'Hľadať konverzácie...'}
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: C.text }]}
          />
        </ClayInset>
      </View>

      {filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <ClayIconBox size={88} radius={28}><MessageCircle size={40} color={C.accent} strokeWidth={1.6} /></ClayIconBox>
          <Text style={[styles.emptyTitle, { color: C.text }]}>Žiadne konverzácie</Text>
          <Text style={[styles.emptySubtitle, { color: C.muted }]}>Začnite konverzáciu s workerom alebo zamestnávateľom</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={({ item: [userId, conv] }) => (
            <Pressable onPress={() => router.push(`/messages/${userId}`)} style={({ pressed }) => [{ marginBottom: 12 }, pressed && { transform: [{ scale: 0.99 }], opacity: 0.9 }]}>
              <ClaySurface radius={20} contentStyle={styles.conversationRow}>
                <View style={{ position: 'relative' }}>
                  <LinearGradient colors={[C.accent2, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                    <Text style={[styles.avatarText, { color: C.onAccent }]}>{getInitials(conv.otherUser)}</Text>
                  </LinearGradient>
                  {conv.unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: C.red, borderColor: C.cHi }]}>
                      <Text style={styles.unreadText}>{conv.unreadCount}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.convInfo}>
                  <View style={styles.convHeader}>
                    <Text style={[styles.userName, { color: C.text }]} numberOfLines={1}>{conv.otherUser.display_name || conv.otherUser.name || 'User'}</Text>
                    <Text style={[styles.timeText, { color: C.muted }]}>{getTimeAgo(conv.lastMessageTime)}</Text>
                  </View>
                  <Text style={[styles.lastMsg, { color: C.muted }]} numberOfLines={1}>{conv.lastMessage}</Text>
                </View>

                <ChevronRight size={16} color={C.muted} strokeWidth={2} />
              </ClaySurface>
            </Pressable>
          )}
          keyExtractor={([userId]) => userId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  largeTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0, fontWeight: '500' },
  listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  conversationRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800' },
  unreadBadge: { position: 'absolute', top: -2, right: -2, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, borderWidth: 2 },
  unreadText: { color: 'white', fontSize: 11, fontWeight: '800' },
  convInfo: { flex: 1, justifyContent: 'center' },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontWeight: '800', fontSize: 15.5, flex: 1, marginRight: 8, letterSpacing: -0.3 },
  timeText: { fontSize: 12, fontWeight: '600' },
  lastMsg: { fontSize: 13.5, fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, marginTop: 20, letterSpacing: -0.4 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21, fontWeight: '500' },
});
