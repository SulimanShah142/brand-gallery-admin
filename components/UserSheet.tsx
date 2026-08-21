import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '@/Contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useBadges } from '@/Contexts/BadgeContext';

interface AdminSheetProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'category' | 'product';
}

const AdminActionSheet: React.FC<AdminSheetProps> = ({
  isVisible,
  onClose,
  type,
}) => {
  // ============================================================
  // AUTHENTICATION
  // ============================================================

  const auth = useAuth();

  const logout = auth?.logout ?? (async () => {});

  // ============================================================
  // BADGES
  // ============================================================

  const {
    adminOrdersBadge,
    userChatBadge,
    clearAdminOrders,
    clearUserChat,
  } = useBadges();

  // ============================================================
  // GENERAL LOADING STATE
  // ============================================================

  const [loading, setLoading] = useState(false);

  // ============================================================
  // DELETE ACCOUNT LOADING STATE
  // ============================================================

  const [deletingAccount, setDeletingAccount] =
    useState(false);

  // ============================================================
  // FORM STATE
  // ============================================================

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] =
    useState<string | null>(null);

  // ============================================================
  // NAVIGATION LINKS
  // ============================================================

  const routeLinks = [
    {
      label: 'Home',
      href: '/',
    },
    {
      label: 'Analytics',
      href: '/analytics',
    },
    {
      label: 'Products',
      href: '/products',
    },
    {
      label: 'Categories',
      href: '/categories',
    },
    {
      label: 'Delivers',
      href: '/delivers',
    },
    {
      label: 'Settings',
      href: '/settings',
    },
    {
      label: 'Orders',
      href: '/orders',
    },
    {
      label: 'Chats',
      href: '/chat',
    },
    {
      label: 'Advertisements',
      href: '/advertisements',
    },
  ];

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleNavigate = (
    href: string,
    label: string,
  ) => {
    // Clear order badge when opening Orders
    if (label === 'Orders') {
      clearAdminOrders();
    }

    // Clear chat badge when opening Chats
    if (label === 'Chats') {
      clearUserChat();
    }

    router.push(href);

    onClose();
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogoutPress = () => {
    if (deletingAccount) return;

    Alert.alert(
      'Terminate Session',
      'Are you sure you want to log out of the administrator account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',

          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.log(
                'Logout error:',
                error,
              );
            } finally {
              onClose();

              router.replace('/login');
            }
          },
        },
      ],
    );
  };

  // ============================================================
  // DELETE ADMIN ACCOUNT — CONFIRMATION
  // ============================================================

  const handleDeleteAccountPress = () => {
    if (deletingAccount) return;

    Alert.alert(
      'Delete Administrator Account',

      'This will remove your administrator account from this device and clear your local administrator session and locally stored account data.\n\nYour business data, including products, orders, customers, reports, and other business records, will not be deleted.\n\nThis action cannot be undone.',

      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Delete Account',
          style: 'destructive',

          onPress: handleDeleteAccount,
        },
      ],
    );
  };

  // ============================================================
  // DELETE ADMIN ACCOUNT — LOCAL ONLY
  // ============================================================

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;

    setDeletingAccount(true);

    try {
      /*
       * ==========================================================
       * LOCAL ACCOUNT DELETION
       * ==========================================================
       *
       * NO BACKEND REQUEST IS MADE HERE.
       *
       * The administrator account is considered local.
       *
       * logout() should clear the locally stored authentication
       * credentials and reset the authentication context.
       *
       * This does NOT delete business data.
       */

      await logout();

      /*
       * ==========================================================
       * RESET LOCAL FORM STATE
       * ==========================================================
       */

      setName('');
      setDescription('');
      setPrice('');
      setImageUri(null);

      /*
       * ==========================================================
       * CLEAR LOCAL BADGE STATE
       * ==========================================================
       */

      clearAdminOrders();
      clearUserChat();

      /*
       * ==========================================================
       * CLOSE ACTION SHEET
       * ==========================================================
       */

      onClose();

      /*
       * ==========================================================
       * ACCOUNT DELETED MESSAGE
       * ==========================================================
       */

      Alert.alert(
        'Account Deleted',

        'Your administrator account and locally stored administrator session have been removed from this device.',

        [
          {
            text: 'OK',

            onPress: () => {
              router.replace('/login');
            },
          },
        ],
      );
    } catch (error) {
      console.log(
        'Local administrator account deletion error:',
        error,
      );

      Alert.alert(
        'Deletion Failed',

        'We could not remove the administrator account from this device. Please try again.',
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  // ============================================================
  // IMAGE PICKER
  // ============================================================

  const handlePickImage = async () => {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,

          allowsEditing: true,

          quality: 0.5,
        });

      if (!result.canceled) {
        setImageUri(
          result.assets[0].uri,
        );
      }
    } catch (error) {
      console.log(
        'Image picker error:',
        error,
      );
    }
  };

  // ============================================================
  // CREATE PRODUCT / CATEGORY
  // ============================================================

  const handleSubmit = async () => {
    if (
      !name.trim() ||
      !description.trim()
    ) {
      Alert.alert(
        'Error',
        'Please fill in all required fields.',
      );

      return;
    }

    if (type === 'product') {
      const parsedPrice =
        Number.parseFloat(price);

      if (
        !Number.isFinite(parsedPrice) ||
        parsedPrice < 0
      ) {
        Alert.alert(
          'Error',
          'Please enter a valid product price.',
        );

        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        type === 'category'
          ? '/api/admin/categories'
          : '/api/admin/products';

      const payload = {
        name: name.trim(),

        description:
          description.trim(),

        imageUrl: imageUri,

        ...(type === 'product' && {
          usdPrice:
            Number.parseFloat(price),
        }),
      };

      const response =
        await fetch(
          `https://workers.dev${endpoint}`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify(
              payload,
            ),
          },
        );

      if (!response.ok) {
        throw new Error(
          'Failed to save data.',
        );
      }

      Alert.alert(
        'Success',
        `${type} created successfully!`,
      );

      /*
       * Reset form
       */

      setName('');
      setDescription('');
      setPrice('');
      setImageUri(null);

      onClose();
    } catch (error) {
      console.log(
        'Create item error:',
        error,
      );

      Alert.alert(
        'Error',
        'Failed to save data. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // COMPONENT VISIBILITY
  // ============================================================

  if (!isVisible) {
    return null;
  }




  return (
    <View style={styles.overlay}>
      <View style={styles.sheetContent}>

        {/* ========================================================
            HEADER
        ======================================================== */}

        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>
              SYSTEM ACCESS
            </Text>

            <Text style={styles.title}>
              ADMIN ACTIONS
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons
              name="close"
              size={28}
              color="#000"
            />
          </TouchableOpacity>
        </View>

        {/* ========================================================
            NAVIGATION GRID
        ======================================================== */}

        <View style={styles.routeGrid}>
          {routeLinks.map((route) => {
            const isOrderCell =
              route.label === 'Orders';

            const isChatCell =
              route.label === 'Chats';

            const targetActiveBadgeCount =
              isOrderCell
                ? adminOrdersBadge
                : isChatCell
                ? userChatBadge
                : 0;

            return (
              <TouchableOpacity
                key={route.href}
                style={[
                  styles.routeBox,
                  {
                    position: 'relative',
                  },
                ]}
                onPress={() =>
                  handleNavigate(
                    route.href,
                    route.label,
                  )
                }
                activeOpacity={0.75}
              >
                <Text style={styles.routeBoxText}>
                  {route.label.toUpperCase()}
                </Text>

                {targetActiveBadgeCount > 0 && (
                  <View
                    style={
                      styles.sheetBadgeMarkerPill
                    }
                  >
                    <Text
                      style={
                        styles.sheetBadgeText
                      }
                    >
                      {targetActiveBadgeCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================================
            ACCOUNT ACTIONS
        ======================================================== */}

        <View style={styles.footer}>

          {/* LOGOUT */}

          <TouchableOpacity
            onPress={handleLogoutPress}
            style={styles.logoutBtn}
            disabled={deletingAccount}
          >
            <Ionicons
              name="log-out-outline"
              size={17}
              color="#777"
            />

            <Text style={styles.logoutText}>
              TERMINATE SECTOR SESSION
            </Text>
          </TouchableOpacity>

          {/* DELETE ACCOUNT */}

          <TouchableOpacity
            onPress={handleDeleteAccountPress}
            style={[
              styles.deleteAccountBtn,
              deletingAccount && {
                opacity: 0.6,
              },
            ]}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator
                size="small"
                color="#EF4444"
              />
            ) : (
              <Ionicons
                name="trash-outline"
                size={17}
                color="#EF4444"
              />
            )}

            <Text
              style={
                styles.deleteAccountText
              }
            >
              DELETE ADMINISTRATOR ACCOUNT
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: 'rgba(0,0,0,0.55)',

    justifyContent: 'flex-end',

    zIndex: 99999,
  },

  sheetContent: {
    backgroundColor: '#FFFFFF',

    height: '90%',

    padding: 20,

    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  // =========================
  // HEADER
  // =========================

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',

    marginBottom: 22,
  },

  headerLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#999',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,

    justifyContent: 'center',
    alignItems: 'center',
  },

  // =========================
  // NAV GRID
  // =========================

  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 12,

    paddingBottom: 16,

    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  routeBox: {
    width: '48%',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#EAEAEA',

    paddingVertical: 16,
    paddingHorizontal: 10,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,

    position: 'relative',
  },

  routeBoxText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',

    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // =========================
  // BADGES
  // =========================

  sheetBadgeMarkerPill: {
    position: 'absolute',
    top: -6,
    right: -6,

    minWidth: 18,
    height: 18,

    borderRadius: 9,

    backgroundColor: '#000',

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 5,

    borderWidth: 2,
    borderColor: '#FFF',
  },

  sheetBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },

  // =========================
  // ACCOUNT ACTIONS
  // =========================

  footer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
  },

  logoutBtn: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,
  },

  logoutText: {
    color: '#777',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textDecorationLine: 'underline',
  },

  deleteAccountBtn: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,
  },

  deleteAccountText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textDecorationLine: 'underline',
  },

  // =========================
  // OPTIONAL FORM SUPPORT
  // =========================

  form: {
    paddingBottom: 40,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',

    paddingVertical: 10,

    fontSize: 14,
    color: '#000',

    fontWeight: '600',
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  imagePicker: {
    height: 180,

    backgroundColor: '#F9F9F9',

    borderWidth: 1,
    borderColor: '#EEE',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 20,

    borderRadius: 12,
  },

  imagePickerText: {
    color: '#AAA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  submitBtn: {
    backgroundColor: '#000',

    paddingVertical: 16,

    alignItems: 'center',

    borderRadius: 14,
  },

  submitText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
  },
});

export default AdminActionSheet;

