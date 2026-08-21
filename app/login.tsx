import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useAuth } from '../Contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const PRIVACY_POLICY_URL = 'https://sites.google.com/view/brandgallery-privacy-center/privacy-policy';

export default function LoginScreen() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!user.trim() || !pass.trim()) {
      return;
    }

    if (!acceptedPrivacy) {
      alert('Please review and accept the Privacy Policy before continuing.');
      return;
    }

    setLoading(true);

    try {
      const success = await login(
        user.trim().toLowerCase(),
        pass.trim()
      );

      if (success) {
        router.replace('/');
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      console.log('Admin login error:', err);
      alert('Unable to authorize access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = async () => {
    try {
      const supported = await Linking.canOpenURL(PRIVACY_POLICY_URL);

      if (supported) {
        await Linking.openURL(PRIVACY_POLICY_URL);
      } else {
        alert('Unable to open the Privacy Policy.');
      }
    } catch (error) {
      console.log('Privacy Policy link error:', error);
      alert('Unable to open the Privacy Policy.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.brandTitle}>
                BG ADMIN
              </Text>

              <View style={styles.line} />

              <Text style={styles.subTitle}>
                CENTRAL MANAGEMENT SYSTEM
              </Text>
            </View>

            {/* FORM */}
            <View style={styles.form}>

              {/* ADMIN ID */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  ADMINISTRATOR ID
                </Text>

                <TextInput
                  placeholder="admin@brandgallery.com"
                  placeholderTextColor="#BBB"
                  value={user}
                  onChangeText={setUser}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              {/* SECURITY KEY */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  SECURITY KEY
                </Text>

                <View style={styles.passwordBox}>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#BBB"
                    secureTextEntry={!showPass}
                    value={pass}
                    onChangeText={setPass}
                    style={styles.passwordInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPass(prev => !prev)}
                    style={styles.eyeBtn}
                    disabled={loading}
                  >
                    <Ionicons
                      name={
                        showPass
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={20}
                      color="#000"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* PRIVACY POLICY CONSENT */}
              <TouchableOpacity
                style={styles.consentRow}
                activeOpacity={0.8}
                onPress={() =>
                  setAcceptedPrivacy(prev => !prev)
                }
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedPrivacy && styles.checkboxChecked,
                  ]}
                >
                  {acceptedPrivacy && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#FFFFFF"
                    />
                  )}
                </View>

                <Text style={styles.consentText}>
                  I acknowledge that I have read and agree to the{' '}
                  <Text
                    style={styles.privacyLink}
                    onPress={openPrivacyPolicy}
                  >
                    Privacy Policy
                  </Text>
                  {' '}for the BG ADMIN management system.
                </Text>
              </TouchableOpacity>

              {/* LOGIN */}
              <TouchableOpacity
                style={[
                  styles.loginBtn,
                  (
                    loading ||
                    !acceptedPrivacy
                  ) && styles.loginBtnDisabled,
                ]}
                onPress={handleLogin}
                disabled={
                  loading ||
                  !acceptedPrivacy
                }
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>
                    AUTHORIZE ACCESS
                  </Text>
                )}
              </TouchableOpacity>

              {/* PRIVACY POLICY LINK */}
              <TouchableOpacity
                style={styles.policyButton}
                onPress={openPrivacyPolicy}
                disabled={loading}
              >
                <Text style={styles.policyButtonText}>
                  VIEW PRIVACY POLICY
                </Text>

                <Ionicons
                  name="open-outline"
                  size={14}
                  color="#666"
                />
              </TouchableOpacity>

            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                AUTHORIZED PERSONNEL ONLY
              </Text>
            </View>

          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 42,
  },

  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -1,
  },

  line: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
    marginTop: 14,
    marginBottom: 14,
  },

  subTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8A8A',
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,

    elevation: 3,
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#555555',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  input: {
    height: 52,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },

  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 14,
    paddingHorizontal: 16,
  },

  passwordInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },

  eyeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* PRIVACY CONSENT */

  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    marginBottom: 18,
    gap: 10,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D4D4D4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },

  consentText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: '#777777',
    fontWeight: '500',
  },

  privacyLink: {
    color: '#000000',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },

  /* LOGIN BUTTON */

  loginBtn: {
    height: 56,
    backgroundColor: '#000000',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,

    elevation: 4,
  },

  loginBtnDisabled: {
    opacity: 0.45,
  },

  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },

  /* POLICY BUTTON */

  policyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 8,
  },

  policyButtonText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '800',
    letterSpacing: 1,
  },

  footer: {
    marginTop: 30,
    alignItems: 'center',
  },

  footerText: {
    fontSize: 10,
    color: '#A0A0A0',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
});
