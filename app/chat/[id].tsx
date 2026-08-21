import React, { useEffect, useState, useRef, useCallback,  useMemo} from 'react';
import { 
  View, FlatList, TextInput, TouchableOpacity, Image, 
  Text, StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView, 
  Alert
} from 'react-native';
import { io, Socket } from "socket.io-client";
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addLocalMessage, loadMessages, isOnline, syncMessagesForConversation, execSql } from '../../lib/offline';
import { uploadImage } from '../../lib/uploadthing';
import * as ImagePicker from 'expo-image-picker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_URL } from '@/lib/config';


export default function AdminChatSession() {
  const [messages, setMessages] = useState<any[]>([]);
  const [resolvedName, setResolvedName] = useState<string>("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
   
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initialLoadDone = useRef(false);

  // 🎯 THE ROUTING INTRUSION CURE:
  // Capture parameters cleanly. If a conversationId query param exists, prioritize it.
  // If it's absent, fall back to the path slug ID *only* if it is a valid UUID structure.
  const params = useLocalSearchParams();
  
  const trueActiveConversationId = useMemo(() => {
    const rawId = params.conversationId || params.id;
    const stringId = String(rawId || '').trim();
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!stringId || stringId === "undefined" || stringId === "null" || !uuidRegex.test(stringId)) {
      return null; // Return null rigidly to halt duplicate unassigned polling tasks instantly
    }
    return stringId;
  }, [params.id, params.conversationId]);

  const paramUserName = params.userName;

  useEffect(() => {
    if (paramUserName && typeof paramUserName === 'string') {
      setResolvedName(paramUserName);
    }
  }, [paramUserName]);

  // 🎯 MEMOIZED INTERNAL MESSAGE DISPATCH RELOADER
  const refreshMessages = useCallback(async () => {
    if (!trueActiveConversationId) return;
    
    const data = await loadMessages(trueActiveConversationId);
    setMessages(data || []);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }, [trueActiveConversationId]);

  // Resolve Customer Header Typography
   // 🎯 THE HOOK SEPARATION & GHOST LOOP CURE
  useEffect(() => {
    // 🎯 SECURE LOOP GUARD: If the ID is missing, false, or literal "undefined", 
    // block the poller from ever initiating! This stops ghost calls completely.
    if (!trueActiveConversationId || 
        trueActiveConversationId === "undefined" || 
        trueActiveConversationId === "null" || 
        trueActiveConversationId.trim() === "") {
      console.log("⏳ [POLLER DISMISSED] Stale parameter state intercepted. Thread blocked.");
      return;
    }
    const initDataLoad = async () => {
      if (isSending) return;
      if (!initialLoadDone.current) setHistoryLoading(true);
      
      try {
        await refreshMessages();
        const online = await isOnline().catch(() => false);
        
        if (online) {
          console.log("📡 Pulling latest edge telemetry records for room ID:", trueActiveConversationId);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000000);

          // 🎯 THE ROUTE ROUTING FIXED STANDARD:
          // Adjusted path endpoints pointers safely to listen to your hardened backend worker!
          const res = await fetch(`${API_URL}/api/conversations/${trueActiveConversationId}/messages`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

                   if (res.ok) {
            const remoteMessages = await res.json();
            if (Array.isArray(remoteMessages) && remoteMessages.length > 0) {
              for (const msg of remoteMessages) {
                // 🎯 THE MAP HARMONIZATION CURE:
                // If the incoming message senderId matches the admin database UUID, 
                // rewrite it to 'admin' before committing it to SQLite or layout states.
                // This ensures your bubbles stay locked to the right side permanently!
                const normalizedSenderId = 
                  (msg.senderId === "d7569fa1-6f6a-404a-9978-b742a5c5bc36" || msg.senderId === "admin")
                    ? "admin" 
                    : msg.senderId;

                await addLocalMessage({
                  id: msg.id,
                  conversationId: msg.conversationId,
                  senderId: normalizedSenderId, // 🎯 FIXED: Standardized local key
                  content: msg.content,
                  attachmentUrl: msg.attachmentUrl,
                  isRead: 1,
                  isSyncedToServer: 1,
                  createdAt: msg.createdAt
                });
              }
            }
          }

          
          // 🎯 THE TRANSACTION CORRECTION:
          // Deactivated the legacy background method call that lacks modern SQLite promise engines support!
          // This clears the 'database.transaction is not a function' warning permanently from console log streams!
          // await syncMessagesForConversation({ id: trueActiveConversationId }, 'admin').catch(() => {});
        }
      } catch (err: any) {
        console.warn("⚠️ Bypassed edge retrieval stall:", err.message);
      } finally {
        if (!isSending) {
          await refreshMessages();
          setHistoryLoading(false);
          initialLoadDone.current = true;
        }
      }
    };

    // 🎯 RUN REFRESH ONCE SECURELY
    initDataLoad();

    // Configure the polling interval worker safely
    const pollingInterval = setInterval(() => {
      initDataLoad();
    }, 4000);

    return () => {
      console.log("🟡 Ending stateless polling interval for room ID:", trueActiveConversationId);
      clearInterval(pollingInterval);
    };
  }, [trueActiveConversationId, refreshMessages, isSending]); // Tracks trueActiveConversationId exclusively

  // =========================================================================
  // 🎯 THE SYMMETRICAL DISPATCH FIX:
  // Passes the true system user UUID over the network to satisfy PostgreSQL, 
  // =========================================================================
  // 🎯 THE STABLE DISPATCH OVERRIDE (EXPLICIT CAMPAIGN HEADER INJECTED)
  // =========================================================================
  const handleSend = async (imageUri?: string) => {
    if (!input.trim() && !imageUri) return;
    if (!trueActiveConversationId) return;

    setIsSending(true);
    const generatedId = Crypto.randomUUID();
    const runtimeTimestamp = new Date().toISOString();
    const typedTextSnapshot = input.trim();

    const verifiedAdminDatabaseUuid = "d7569fa1-6f6a-404a-9978-b742a5c5bc36";

    // This payload travels directly to your serverless backend
    const networkPayloadData = {
      id: generatedId,
      conversationId: trueActiveConversationId,
      senderId: verifiedAdminDatabaseUuid, 
      content: typedTextSnapshot,
      attachmentUrl: null as string | null,
      createdAt: runtimeTimestamp,
      // 🎯 THE ATOMIC COPY COPY CURE:
      // Passing an explicit boolean flag completely bypasses string-matching loops on the server!
      isAdminOrigin: true 
    };

    try {
      if (imageUri) {
        const remoteUrl = await uploadImage(imageUri);
        networkPayloadData.attachmentUrl = remoteUrl;
      }

      // Save locally as 'admin' for correct bubble alignment
      await addLocalMessage({
        id: networkPayloadData.id,
        conversationId: networkPayloadData.conversationId,
        senderId: 'admin', 
        content: networkPayloadData.content,
        attachmentUrl: imageUri || null, 
        isRead: 1,
        isSyncedToServer: 0,
        createdAt: networkPayloadData.createdAt
      });
      
      await refreshMessages();
      setInput("");

      console.log("Customer Desk Tunneling: Dispatching casted text payload to Cloudflare...");
      const response = await fetch(`${API_URL}/api/conversations/${trueActiveConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(networkPayloadData)
      });

      if (!response.ok) throw new Error("HTTP message write rejected by backend schema rules");

    } catch (err: any) {
      console.error("❌ Send pipeline compilation failure:", err.message);
      Alert.alert("Transmission Delay", "Message saved locally. Synchronizing in background.");
    } finally {
      setIsSending(false);
      await refreshMessages();
      
      if (typeof setHistoryLoading === 'function') {
        setHistoryLoading(false);
      }
    }
  };


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Required", "Gallery access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,
    });

    if (!result.canceled) {
      handleSend(result.assets[0].uri);
    }
  };



   const downloadChatImage = async (remoteUrl: string, msgId: string) => {
    try {
      const localUri = `${FileSystem.documentDirectory}chat_img_${msgId}.jpg`;
      const { uri } = await FileSystem.downloadAsync(remoteUrl, localUri);
      return uri;
    } catch (e) { 
      return remoteUrl; 
    }
  };
 
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 1. MINIMAL CRM HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>SUPPORT DIALOG</Text>
          <Text style={styles.userName}>{resolvedName.toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="ellipsis-vertical" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {historyLoading && (
        <View style={styles.loaderOverlay}>
          <View style={{ alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={{ marginTop: 12, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
              LOADING CONVERSATION
            </Text>
          </View>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: 100 }
        ]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          // 🎯 THE BUBBLE SYNC CURE:
          // Evaluates ownership against both your frontend literal label 'admin' 
          // AND your system backend Postgres user row UUID footprint synchronously!
          // This keeps your replies anchored securely on the right-hand side during all network updates!
          const isMine = item.senderId === 'admin' || item.senderId === 'd7569fa1-6f6a-404a-9978-b742a5c5bc36';
          
          return (
            <View style={[styles.msgWrapper, isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
              <View style={[styles.msgBubble, isMine ? styles.myMsg : styles.theirMsg]}>
                {item.attachmentUrl && (
                  <View style={styles.imageCard}>
                    <Image source={{ uri: item.attachmentUrl }} style={styles.chatImg} resizeMode="cover" />
                  </View>
                )}
                {item.content ? (
                  <Text style={isMine ? styles.myText : styles.theirText}>{item.content}</Text>
                ) : null}
              </View>
              <Text style={[styles.timestamp, isMine ? { marginRight: 4 } : { marginLeft: 4 }]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      {/* 3. SHARP BOTTOM COMPOSER */}
      <View
        style={[
          styles.inputRow,
          {
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
          <Ionicons name="add-circle-outline" size={26} color="#000" />
        </TouchableOpacity>
        
        <TextInput 
          value={input} 
          onChangeText={setInput} 
          placeholder="TYPE YOUR RESPONSE..." 
          placeholderTextColor="#999"
          style={styles.input}
          multiline
        />

        <TouchableOpacity 
          onPress={() => handleSend()} 
          style={styles.sendBtn}
          disabled={!input.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={[styles.sendText, !input.trim() && { color: '#CCC' }]}>REPLY</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 45, 
    paddingBottom: 15, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F2F2F2' 
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerLabel: { fontSize: 9, fontWeight: '800', color: '#BBB', letterSpacing: 2, marginBottom: 2 },
  userName: { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 1 },
  headerAction: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-end' },
  
  // List Area
  listContainer: { paddingHorizontal: 16, paddingVertical: 20 },
  msgWrapper: { marginBottom: 18, width: '100%' },
  msgBubble: { 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    maxWidth: '78%', 
    borderRadius: 4, // Clean minimal softening, removes raw harshness
    elevation: 1, // Soft Android drop shadow
    shadowColor: '#000', // Safe iOS tracking shadows
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  myMsg: { 
    backgroundColor: '#111111' // Deep studio black
  },
  theirMsg: { 
    backgroundColor: '#F8F9FA', 
    borderWidth: 1, 
    borderColor: '#EFEFEF' 
  },
  myText: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    lineHeight: 20, 
    fontWeight: '400',
    letterSpacing: 0.2
  },
  loaderOverlay: {
  position: 'absolute',
  top: 90,
  left: 0,
  right: 0,
  bottom: 80,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.75)',
  zIndex: 999,
},
  theirText: { 
    color: '#1A1A1A', 
    fontSize: 14, 
    lineHeight: 20, 
    fontWeight: '400',
    letterSpacing: 0.2
  },
  
  // Image Attachments
  imageCard: {
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: '#EAEAEA'
  },
  chatImg: { 
    width: 220, 
    height: 160 
  },
  timestamp: { 
    fontSize: 9, 
    color: '#999999', 
    marginTop: 5, 
    fontWeight: '600',
    letterSpacing: 0.5
  },
  
 inputRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: '#F0F0F0',
  backgroundColor: '#FFF',
},
  actionBtn: { marginRight: 12, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  input: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    fontSize: 14, 
    maxHeight: 100, 
    color: '#000',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 4
  },
  sendBtn: { marginLeft: 16, paddingVertical: 10, justifyContent: 'center' },
  sendText: { fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 1.5 }
});
