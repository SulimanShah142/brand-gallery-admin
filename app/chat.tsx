import React, { useState, useEffect, useCallback, useMemo , useRef} from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  ActivityIndicator, RefreshControl, Platform, TextInput 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { API_URL } from '@/lib/config';

// Mock helper for background avatar colors matching original setup
const getAvatarBgColor = (name: string) => {
  const charCode = name ? name.charCodeAt(0) : 65;
  const colors = ['#F3F4F6', '#E5E7EB', '#EEF2F6', '#F4F4F5', '#F5F5F7'];
  return colors[charCode % colors.length];
};

export default function AdminChatList() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
 const isNavigatingRef = useRef(false);
const lastTapRef = useRef(0);

const fetchChats = useCallback(async (showSilentSpinner = false) => {
  if (showSilentSpinner) {
    setRefreshing(true);
  }

  try {
    const res = await fetch(
      `${API_URL}/api/admin/conversations`
    );

    if (!res.ok) {
      throw new Error(
        "Cloud database rejected conversation compilation"
      );
    }

    const data = await res.json();

    console.log(
      "📨 CHAT LIST:",
      JSON.stringify(data, null, 2)
    );

    setConversations(
      Array.isArray(data)
        ? data
        : []
    );

  } catch (e) {

    console.error(
      "❌ Error fetching admin chat list:",
      e
    );

  } finally {

    setLoading(false);
    setRefreshing(false);

  }
}, []);

useEffect(() => {
  fetchChats();
}, [fetchChats]);

useFocusEffect(
  useCallback(() => {
    fetchChats(false);
  }, [fetchChats])
);

const onRefresh = () => {
  fetchChats(true);
};

const whatsappSortedConversations = useMemo(() => {
  const deduped = Array.isArray(conversations)
    ? Array.from(
        new Map(
          conversations.map((chat: any) => [
            String(chat.conversationId ?? chat.conversation_id ?? chat.id),
            chat,
          ])
        ).values()
      )
    : [];

  return [...deduped].sort((a, b) => {

    const aUnread = Number(a.unreadCount ?? 0);
    const bUnread = Number(b.unreadCount ?? 0);

    // unread first
    if (aUnread > 0 && bUnread === 0) return -1;
    if (bUnread > 0 && aUnread === 0) return 1;

    // 🔥 USE FALLBACK SAFE TIME
    const aTime =
      new Date(a.updatedAt || a.lastMessageTime || 0).getTime();

    const bTime =
      new Date(b.updatedAt || b.lastMessageTime || 0).getTime();

    return bTime - aTime;
  });
}, [conversations]);

const filteredConversations = useMemo(() => {
  const query = searchQuery.trim().toLocaleLowerCase();

  return whatsappSortedConversations.filter((conversation: any) => {
    const unreadCount = Number(conversation.unreadCount ?? conversation.unreadcount ?? 0);
    if (conversationFilter === 'unread' && unreadCount === 0) return false;
    if (conversationFilter === 'read' && unreadCount > 0) return false;
    if (!query) return true;

    const searchableFields = [
      conversation.userName,
      conversation.username,
      conversation.userEmail,
      conversation.phoneNumber,
      conversation.lastMessage,
      conversation.lastmessage,
    ];
    return searchableFields.some((value) => String(value || '').toLocaleLowerCase().includes(query));
  });
}, [whatsappSortedConversations, searchQuery, conversationFilter]);





const renderItem = ({ item }: { item: any }) => {

  const targetConvId =
    item.conversationId || item.conversation_id || item.id;

  const unreadCountValue = Number(
    item.unreadCount ?? item.unreadcount ?? 0
  );

  const isUnreadActive =
    unreadCountValue > 0;

  const customerNameString =
    item.userName ||
    item.username ||
    "Guest Customer";
  const customerContact = item.phoneNumber || item.userEmail || '';

  const avatarLetter =
    customerNameString.charAt(0).toUpperCase();
const rawTimestamp =
  item.lastMessageTime ??
  item.lastmessagetime ??
  item.last_message_time;

let formattedTimestamp = "";

if (rawTimestamp) {
  try {
    let fixedTimestamp = String(rawTimestamp);

    if (typeof rawTimestamp === 'string') {
      fixedTimestamp = fixedTimestamp.replace(' ', 'T').replace('+00', 'Z');
    }

    const date = new Date(fixedTimestamp);

    if (!isNaN(date.getTime())) {
      const today = new Date();

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      formattedTimestamp = isToday
        ? date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : date.toLocaleDateString('en-AF', {
            day: 'numeric',
            month: 'short',
          });
    }
  } catch (err) {
    console.log('Date parse failed', err);
  }
}

  return (
    <TouchableOpacity
      style={[
        styles.chatCard,
        isUnreadActive &&
          styles.unreadChatCardTint,
      ]}
      activeOpacity={0.75}
       onPress={async () => {
      if (!targetConvId) return;

      // 🚫 BLOCK MULTI-CLICK NAVIGATION
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      // ⚡ INSTANT UI UPDATE (NO AWAIT)
      setConversations(prev =>
        prev.map((c: any) => {
          const id = c.conversationId || c.conversation_id || c.id;

          if (String(id) === String(targetConvId)) {
            return {
              ...c,
              unreadCount: 0,
              unreadcount: 0,
            };
          }
          return c;
        })
      );

      const now = Date.now();
      if (now - lastTapRef.current < 500) return;
      lastTapRef.current = now;

      // 🚀 NAVIGATE IMMEDIATELY
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: String(targetConvId),
          userName: customerNameString,
          conversationId: targetConvId,
        },
      });

      // 🔥 BACKGROUND SYNC (DO NOT BLOCK UI)
      try {
        await fetch(
          `${API_URL}/api/admin/conversations/${targetConvId}/mark-read`,
          {
            method: 'POST',
          }
        );
      } catch (err) {
        console.log('mark-read failed', err);
      } finally {
        // allow next navigation after short delay
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 400);
      }
    }}
    >
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatarCircle,
            {
              backgroundColor:
                getAvatarBgColor(
                  customerNameString
                ),
            },
          ]}
        >
          <Text style={styles.avatarText}>
            {avatarLetter}
          </Text>
        </View>
      </View>

      <View style={styles.chatInfo}>

        <View style={styles.chatHeaderRow}>

          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {customerNameString}
          </Text>

          <Text style={styles.time}>
            {formattedTimestamp}
          </Text>

        </View>

        {!!customerContact && (
          <Text style={styles.contact} numberOfLines={1}>
            {customerContact}
          </Text>
        )}

          <View style={styles.chatFooterRow}>
            <Text
              style={[
                styles.lastMsg,
                isUnreadActive &&
                  styles.unreadLastMsgTextBold,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage ||
                item.lastmessage ||
                "Click to start chatting"}
            </Text>

            {isUnreadActive && (
              <View style={styles.unreadBadge}>
                <Text
                  style={styles.unreadCountText}
                >
                  {unreadCountValue}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.chatMetaRow}>
            <TouchableOpacity
              onPress={async () => {
                const id = String(targetConvId);
                setConversations(prev =>
                  prev.filter((c: any) =>
                    String(c.conversationId || c.conversation_id || c.id) !== id
                  )
                );
                try {
                  await fetch(`${API_URL}/api/admin/conversations/${id}`, {
                    method: "DELETE",
                  });
                } catch (err) {
                  console.error("Failed to remove chat", err);
                }
              }}
            >
              <Text style={styles.removeChatText}>Remove</Text>
            </TouchableOpacity>
          </View>

      </View>
    </TouchableOpacity>
  );
};

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#000000" />
      </View>
    );
  }

  const VISIBLE_COUNT = 8;

  const hasActiveSearchOrFilter = Boolean(searchQuery.trim()) || conversationFilter !== 'all';
  const displayedConversations = showAllContacts || hasActiveSearchOrFilter
    ? filteredConversations
    : filteredConversations.slice(0, VISIBLE_COUNT);

  return (
    <View style={styles.container}>
      <Text style={[styles.header]}>CUSTOMER MESSAGES</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#777777" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search name, email, phone, or message"
          placeholderTextColor="#999999"
          style={styles.searchInput}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search customer conversations"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear conversation search">
            <Ionicons name="close-circle" size={18} color="#888888" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.filterRow}>
        {([
          ['all', 'All'],
          ['unread', 'Unread'],
          ['read', 'Read'],
        ] as const).map(([filter, label]) => (
          <TouchableOpacity
            key={filter}
            onPress={() => {
              setConversationFilter(filter);
              setShowAllContacts(false);
            }}
            style={[styles.filterButton, conversationFilter === filter && styles.filterButtonActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: conversationFilter === filter }}
          >
            <Text style={[styles.filterButtonText, conversationFilter === filter && styles.filterButtonTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.resultCount}>{filteredConversations.length}</Text>
      </View>
      <FlatList
        data={displayedConversations}
    keyExtractor={(item) =>
  String(
    item.conversationId ||
    item.conversation_id ||
    item.id
  )
}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="chatbox-outline" size={36} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {searchQuery.trim() || conversationFilter !== 'all'
                ? 'No conversations match your search or filter.'
                : 'No customer conversations found.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          !hasActiveSearchOrFilter && filteredConversations.length > VISIBLE_COUNT ? (
            <View style={styles.footerShowMore}>
              <TouchableOpacity
                onPress={() => setShowAllContacts(prev => !prev)}
                style={styles.showMoreBtn}
              >
                <Text style={styles.showMoreText}>{showAllContacts ? 'Show less' : 'Show more'}</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F8',
  },
  header: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 22,
  },
  searchBox: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: '#111111',
    fontSize: 13,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  filterButton: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  filterButtonText: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '700',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  resultCount: {
    marginLeft: 'auto',
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 40,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadChatCardTint: {
    backgroundColor: '#FAFAFA',
    borderColor: '#DADADA',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F4F4F4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  avatarText: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  chatFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: 0.1,
  },
  contact: {
    color: '#777777',
    fontSize: 11,
    marginBottom: 5,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999999',
  },
  lastMsg: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#666666',
    fontWeight: '500',
  },
  unreadLastMsgTextBold: {
    color: '#000000',
    fontWeight: '800',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyBox: {
    marginTop: 180,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 40,
  },
  chatMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  viewMoreText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '700',
  },
  removeChatText: {
    color: '#C92A2A',
    fontSize: 12,
    fontWeight: '800',
  },
  footerShowMore: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  showMoreBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  showMoreText: {
    color: '#FFF',
    fontWeight: '900',
  },
});
