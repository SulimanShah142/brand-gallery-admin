import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, TouchableOpacity, InteractionManager } from 'react-native';
import { useRouter, useSegments, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LanguageProvider } from '@/Contexts/LanguageContext';
// 🎯 DIRECT HARDWARE MODULE IMPORT
import { OneSignal } from 'react-native-onesignal';

// Providers & Contexts
import { AuthProvider, useAuth } from '@/Contexts/AuthContext';
import { BadgeProvider, useBadges } from '@/Contexts/BadgeContext';
import { initOfflineDb } from '@/lib/offline';
import { preloadVisualEmbeddingModel } from '@/lib/visualEmbedding';
import { initOneSignal } from '@/lib/notiifcations';

// Action Sheet Component Ingestion
import AdminActionSheet from "@/components/UserSheet"; // 🎯 Ensure the filename case matches your path exactly!

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function AdminLayout() {
  const [nativeBridgeReady, setNativeBridgeReady] = useState(false);
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initializeNativeContext() {
      try {
        console.log("⚙️ [COCKPIT GATEWAY] Booting baseline native window constraints...");
        
        try {
          await SplashScreen.hideAsync().catch(() => {});
        } catch {}

        await new Promise((resolve) => setTimeout(resolve, 150));

        if (mounted) {
          setNativeBridgeReady(true);
        }
      } catch (e) {
        if (mounted) setNativeBridgeReady(true);
      }
    }

    initializeNativeContext();

    initOneSignal()
      .catch((error) => {
        console.warn('OneSignal admin initialization failed:', error);
      })
      .finally(() => {
        if (mounted) setOneSignalReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!nativeBridgeReady || !oneSignalReady) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="small" color="#000000" />
      </View>
    );
  }

  return (
       <LanguageProvider>
    <AuthProvider>
      <BadgeProvider>
        <AdminLayoutContent />
      </BadgeProvider>
    </AuthProvider>
       </LanguageProvider>
  );
}

function AdminLayoutContent() {
  // 🎯 THE DUPLICATE FIX: Unified your loose state trackers into a single clean flag parameter variable!
  const [isSheetVisible, setSheetVisible] = useState(false);
  
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { adminOrdersBadge, clearAdminOrders } = useBadges();

  const [appIsReady, setAppIsReady] = useState(false);
  const [isBootComplete, setIsBootComplete] = useState(false);
  
  const initialRedirectDone = useRef(false);

  // ==========================================
  // 🎯 UNIFIED PARALLEL SECURED ADMIN INITIALIZATION ENGINE
  // ==========================================
  useEffect(() => {
    let mounted = true;

    async function prepareFleetSystem() {
      try {
        console.log("⚙️ Booting administrative infrastructure systems...");

        OneSignal.login("admin_global_channel");
        OneSignal.User.addTag("role", "ADMIN");
        
        await initOfflineDb().catch(() => {});
        InteractionManager.runAfterInteractions(() => {
          preloadVisualEmbeddingModel().catch((error) => {
            console.warn('Admin visual model preload failed:', error);
          });
        });
        console.log("✅ Offline Ledger Matrix Tables Sync Checked.");

        await new Promise(resolve => setTimeout(resolve, 1200));

      } catch (e) {
        console.warn("⚠️ App bootstrap skipped an init error:", e);
      } finally {
        if (!mounted) return;
        setIsBootComplete(true);

        setTimeout(() => {
          if (mounted) {
            setAppIsReady(true);
          }
        }, 300); 
      }
    }

    prepareFleetSystem();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================
  // 🎯 HIGH-UTILITY ADMINISTRATIVE SECURITY ROUTING GUARD
  // ==========================================
  useEffect(() => {
    if (!isBootComplete || !appIsReady || authLoading) return;

    const activeRoutePath = segments[segments.length - 1] || '';
    const isCurrentlyOnLoginScreen = activeRoutePath === 'login';

    if (!initialRedirectDone.current) {
      initialRedirectDone.current = true;
      if (!isAdmin) {
        console.log("🔏 [BOOT MOUNT ROUTE] Steering unauthenticated operator to Login.");
        router.replace('/login');
      } else if (isCurrentlyOnLoginScreen) {
        console.log("🔓 [BOOT MOUNT ROUTE] Steering verified admin straight to main cockpit panel.");
        router.replace('/');
      }
      return;
    }

    if (isCurrentlyOnLoginScreen) {
      console.log("ℹ️ Admin Guard: Operator is on the login view window. Intercept skipped.");
      return;
    }

    if (!isAdmin) {
      console.log("🔒 Security Guard Intercept: Non-Admin operator rejected. Evicting to Auth Stack.");
      router.replace('/login'); 
    }
  }, [isAdmin, authLoading, appIsReady, isBootComplete, segments]);

  // ==========================================
  // 🎯 HIGH-UTILITY ADMINISTRATIVE NAVIGATION HEADER
  // ==========================================
  // Guarded menu press to avoid missed taps on initial load
  const lastMenuPress = useRef(0);
  const handleMenuPress = () => {
    const now = Date.now();
    if (now - lastMenuPress.current < 500) return; // debounce double calls
    lastMenuPress.current = now;
    clearAdminOrders(); // Resets orders counter badge to 0 instantly when panel sheet slides open
    setSheetVisible(true);
  };

  const renderHeader = () => {
    const activeRoutePath = segments[segments.length - 1] || '';
    const isCurrentlyOnLoginScreen = activeRoutePath === 'login';

    if (isCurrentlyOnLoginScreen) return null;

    return (
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandCluster}>
          {/* 🎯 THE RESIZ FIXED IMAGE ASSET BOUNDARY MATRIX */}
          <Image 
            source={require('@/assets/images/app-icon.jpeg')} 
            style={styles.headerLogoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandTitleText}>Brand Gallery</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>CONTROL</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPressIn={handleMenuPress}
          onPress={handleMenuPress}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessible
        >
          <Ionicons name="menu-outline" size={26} color="black" />
          
          {/* FLOATING NOTIFICATION BADGE CONTROLLER MARKER */}
          {Number(adminOrdersBadge || 0) > 0 && (
            <View style={styles.floatingBadgeMarker}>
              <Text style={styles.badgeText}>{adminOrdersBadge}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // --- PREMIUM CUSTOM SPLASH SCREEN RENDER ---
  if (!appIsReady || !isBootComplete) {
    return (
      <View style={styles.splashContainer}>
        <Image 
          source={require('@/assets/images/splash-image.jpg')} 
          style={styles.splashImage}
          resizeMode="contain"
        />
        <View style={styles.splashFooter}>
          <ActivityIndicator size="small" color="#000000" />
          <Text style={styles.splashSubtitle}>INITIALIZING CORE DATA SYSTEMS...</Text>
        </View>
      </View>
    );
  }

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // 🎯 THE NATIVE CONTAINER FIX:
  // Using a plain Slot element viewport directly layout maps matching child files 
  // without triggering duplicate registration container errors!
  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <Slot />

      {isSheetVisible && (
        <AdminActionSheet
          isVisible={isSheetVisible}
          onClose={() => setSheetVisible(false)}
          type="category"
        />
      )}
    </View>
  );
}

// ==========================================
// 🎨 HARDENED STRUCTURAL STYLESHEET DICTIONARY
// ==========================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  splashContainer: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  splashImage: { 
    width: '70%', 
    height: '35%' 
  },
  splashFooter: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: 12,
  },
  splashSubtitle: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#666666', 
    letterSpacing: 1.5, 
    textTransform: 'uppercase', 
    marginTop: 14 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    zIndex: 50,
    elevation: 6,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 10,
  },
  brandTitleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  adminBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  menuButton: {
    position: 'relative',
    padding: 4,
    zIndex: 60,
    elevation: 8,
  },
  floatingBadgeMarker: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
  },
});
