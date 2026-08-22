import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, ScrollView, Platform , KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/lib/config'

export default function DeliversAndSellers() {
 const [delRole, setDelRole] = useState<'deliverer' | 'packager'>('deliverer');
  const [loading, setLoading] = useState(false);
  const [deliverers, setDeliverers] = useState<any[]>([]);

  // 🎯 TRANSLATOR METHOD FOR RTL ENVIRONMENT INDEX COUNT HOOKS

  // Form States
  const [delName, setDelName] = useState('');
  const [delEmail, setDelEmail] = useState('');
  const [delPass, setDelPass] = useState('');
  const [delPhone, setDelPhone] = useState('');
  const [delVehicle, setDelVehicle] = useState('Motorcycle');

  // 🎯 EDIT MODE CONTROLLER BUCKETS
  const [editingId, setEditingId] = useState<string | null>(null);
  const [secureTextEntryActive, setSecureTextEntryActive] = useState(true);

  useEffect(() => {
    fetchDeliverers();
  }, []);

  const fetchDeliverers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/deliverers`);
      if (res.ok) {
        const data = await res.json();
        setDeliverers(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch deliverers", e);
    }
  };

  const handleCreateOrUpdateDeliverer = async () => {
    if (!delEmail || !delName || !delPhone || (!editingId && !delPass)) {
      return Alert.alert("Error", "Please fill in all required operational fields.");
    }
    
    setLoading(true);
    try {
      // 🎯 CHOOSE METHOD PATH BASED ON ACTIVE MODE
      const endpointPath = editingId ? `${API_URL}/api/admin/deliverers/${editingId}` : `${API_URL}/api/admin/deliverers`;
      const HTTP_METHOD = editingId ? 'PATCH' : 'POST';

      const res = await fetch(endpointPath, {
        method: HTTP_METHOD,
        headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
  name: delName,
  email: delEmail.toLowerCase().trim(),
  password: delPass || undefined,
  phoneNumber: delPhone,
  vehicleType: delVehicle,
  role: delRole, // ✅ NEW FIELD
})
      });
      
      const result = await res.json();

      if (res.ok) {
        Alert.alert("Success", editingId ? "Deliverer details modified!" : "Deliverer account created!");
        resetForm();
        fetchDeliverers();
      } else {
        Alert.alert("Error", result.error || "Could not complete data sync transaction.");
      }
    } catch (e) {
      Alert.alert("Error", "Server unreachable. Verify local endpoints.");
    } finally {
      setLoading(false);
    }
  };

  const startEditMode = (item: any) => {
    setEditingId(item.id);
    setDelName(item.name || '');
    setDelEmail(item.email || '');
    setDelPhone(item.phoneNumber || '');
    setDelRole(item.role || 'deliverer');
    setDelVehicle(item.vehicleType || 'Motorcycle');
    setDelPass(''); // Clear password box so it only changes if type characters are added
  };

  const resetForm = () => {
    setEditingId(null);
    setDelName('');
    setDelEmail('');
    setDelPhone('');
    setDelPass('');
    setDelVehicle('Motorcycle');
  };

  const deleteDeliverer = (id: string) => {
    Alert.alert("Delete", "Are you sure you want to deactivate this fleet operator?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: async () => {
          const res = await fetch(`${API_URL}/api/admin/deliverers/${id}`, { method: 'DELETE' });
          if (res.ok) fetchDeliverers();
      }}
    ]);
  };

return (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Logistics Management</Text>
    </View>

    <ScrollView
      style={styles.scrollFormWindow}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContentLayoutContainer}
    >
      {/* FORM CARD */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {editingId ? "Modify Courier Profile" : "Add New Deliverer"}
        </Text>

        <TextInput style={styles.input} placeholder="Full Name" value={delName} onChangeText={setDelName} />
        <TextInput style={styles.input} placeholder="Email" value={delEmail} onChangeText={setDelEmail} />
        <TextInput style={styles.input} placeholder="Phone Number" value={delPhone} onChangeText={setDelPhone} />

        {/* VEHICLE */}
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.vehicleRow}>
          {['Motorcycle', 'Car', 'Bicycle'].map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.vBtn, delVehicle === v && styles.vBtnActive]}
              onPress={() => setDelVehicle(v)}
            >
              <Text style={[styles.vText, delVehicle === v && styles.vTextActive]}>
                {v.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
<Text style={styles.label}>Role</Text>

<View style={styles.vehicleRow}>
  {['deliverer', 'packager'].map(r => (
    <TouchableOpacity
      key={r}
      style={[styles.vBtn, delRole === r && styles.vBtnActive]}
      onPress={() => setDelRole(r as any)}
    >
      <Text style={[styles.vText, delRole === r && styles.vTextActive]}>
        {r.toUpperCase()}
      </Text>
    </TouchableOpacity>
  ))}
</View>
        {/* 🔥 PASSWORD FIELD FIXED */}
        <View style={styles.passwordBox}>
          <TextInput
            style={styles.passwordInput}
            placeholder={editingId ? "New Password (optional)" : "Password"}
            value={delPass}
            onChangeText={setDelPass}
            secureTextEntry={secureTextEntryActive}
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            onPress={() => setSecureTextEntryActive(!secureTextEntryActive)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={secureTextEntryActive ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* SAVE */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleCreateOrUpdateDeliverer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {editingId ? "SAVE REVISIONS" : "CREATE ACCOUNT"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* LIST TITLE */}
      <Text style={styles.sectionTitle}>
        Active Fleet ({deliverers.length})
      </Text>

      {/* LIST */}
      {deliverers.map(item => (
        <View key={item.id} style={styles.delivererCard}>
          <View style={styles.delInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name?.[0]?.toUpperCase() || 'D'}
              </Text>
            </View>

                      {/* 🎯 PLACE THIS EXACT SUBSECTION ROW UPDATED BOX INSIDE YOUR DELIVERERS.MAP() VIEW LOOP */}
            <View>
              <Text style={styles.delName}>{item.name}</Text>
              <Text style={styles.delDetail}>{item.email}</Text>
              <Text style={styles.delDetail}>
  ROLE: {(item.role || 'deliverer').toUpperCase()}
</Text>
              <Text style={styles.delDetail}>
                {/* 🎯 THE SAFE CASCADE PROPERTY FIX: 
                    Safely targets both property naming models, falling back to 'MOTORCYCLE' 
                    automatically instead of outputting an undefined string text leak onto the screen! */}
                {item.phoneNumber || item.phone_number || '--'} • {String(item.vehicleType || item.vehicle_type || 'Motorcycle').toUpperCase()}
              </Text>
            </View>
          </View>


          <View style={styles.cardActionContainerFrame}>
            <TouchableOpacity onPress={() => startEditMode(item)}>
              <Ionicons name="create-outline" size={20} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteDeliverer(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: 60 }} />
    </ScrollView>
  </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
  // =========================================================
  // PAGE
  // =========================================================

  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },

  // =========================================================
  // HEADER
  // =========================================================

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 18,

    backgroundColor: '#F7F7F8',

    alignItems: 'flex-start',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '900',

    letterSpacing: 1.8,

    textTransform: 'uppercase',

    color: '#111',
  },

  // =========================================================
  // SCROLL
  // =========================================================

  scrollFormWindow: {
    flex: 1,
  },

  scrollContentLayoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // =========================================================
  // FORM CARD
  // =========================================================

  formCard: {
    backgroundColor: '#FFFFFF',

    padding: 20,

    borderRadius: 18,

    marginBottom: 28,

    borderWidth: 1,
    borderColor: '#EAEAEA',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.03,
    shadowRadius: 8,

    elevation: 2,
  },

  formTitle: {
    fontSize: 11,

    fontWeight: '900',

    letterSpacing: 1.5,

    marginBottom: 16,

    textTransform: 'uppercase',

    color: '#111',
  },

  // =========================================================
  // STANDARD INPUT
  // =========================================================

  input: {
    borderBottomWidth: 1,

    borderBottomColor: '#E5E5E5',

    paddingVertical: 11,

    paddingHorizontal: 0,

    marginBottom: 16,

    fontSize: 14,

    fontWeight: '600',

    color: '#111',

    backgroundColor: '#FFFFFF',
  },

  // =========================================================
  // FIELD LABEL
  // =========================================================

  label: {
    fontSize: 9,

    fontWeight: '900',

    color: '#666',

    letterSpacing: 1,

    marginTop: 6,

    marginBottom: 7,

    textTransform: 'uppercase',
  },

  // =========================================================
  // VEHICLE / ROLE SEGMENTED CONTROL
  // =========================================================

  vehicleRow: {
    flexDirection: 'row',

    borderWidth: 1,

    borderColor: '#E5E5E5',

    borderRadius: 11,

    overflow: 'hidden',

    marginBottom: 18,

    backgroundColor: '#FAFAFA',
  },

  vBtn: {
    flex: 1,

    minHeight: 42,

    paddingVertical: 10,

    paddingHorizontal: 8,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FAFAFA',
  },

  vBtnActive: {
    backgroundColor: '#111',
  },

  vText: {
    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 0.8,

    color: '#111',

    textTransform: 'uppercase',
  },

  vTextActive: {
    color: '#FFFFFF',
  },

  // =========================================================
  // PASSWORD
  // =========================================================

  passwordBox: {
    flexDirection: 'row',

    alignItems: 'center',

    borderBottomWidth: 1,

    borderBottomColor: '#E5E5E5',

    height: 46,

    marginBottom: 20,

    backgroundColor: '#FFFFFF',
  },

  passwordInput: {
    flex: 1,

    fontSize: 14,

    fontWeight: '600',

    color: '#111',

    paddingVertical: 0,

    paddingHorizontal: 0,
  },

  eyeBtn: {
    padding: 8,

    marginRight: -4,
  },

  // =========================================================
  // PRIMARY SAVE BUTTON
  // =========================================================

  saveBtn: {
    backgroundColor: '#111',

    minHeight: 48,

    paddingVertical: 14,

    borderRadius: 13,

    alignItems: 'center',

    justifyContent: 'center',
  },

  saveBtnText: {
    color: '#FFFFFF',

    fontWeight: '900',

    fontSize: 11,

    letterSpacing: 1.3,

    textTransform: 'uppercase',
  },

  // =========================================================
  // LIST SECTION
  // =========================================================

  sectionTitle: {
    fontSize: 10,

    fontWeight: '900',

    letterSpacing: 1.8,

    marginBottom: 14,

    textTransform: 'uppercase',

    color: '#111',

    textAlign: 'left',
  },

  // =========================================================
  // DELIVERER CARD
  // =========================================================

  delivererCard: {
    backgroundColor: '#FFFFFF',

    padding: 18,

    borderRadius: 16,

    marginBottom: 12,

    borderWidth: 1,

    borderColor: '#EAEAEA',

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.02,

    shadowRadius: 6,

    elevation: 1,
  },

  // =========================================================
  // DELIVERER INFORMATION
  // =========================================================

  delInfo: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    flex: 1,

    paddingRight: 12,
  },

  avatar: {
    width: 42,

    height: 42,

    borderRadius: 12,

    backgroundColor: '#F3F3F3',

    justifyContent: 'center',

    alignItems: 'center',
  },

  avatarText: {
    fontSize: 14,

    fontWeight: '900',

    color: '#111',
  },

  delName: {
    fontWeight: '900',

    fontSize: 13,

    color: '#111',

    marginBottom: 3,
  },

  delDetail: {
    fontSize: 10,

    color: '#777',

    fontWeight: '600',

    lineHeight: 16,
  },

  // =========================================================
  // CARD ACTIONS
  // =========================================================

  cardActionContainerFrame: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    paddingLeft: 8,
  },
});