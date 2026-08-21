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
  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },

  header: {
    paddingTop: 60,
    paddingBottom: 14,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },

  scrollFormWindow: {
    flex: 1,
  },

  scrollContentLayoutContainer: {
    padding: 18,
    paddingBottom: 120,
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 18,
  },

  formTitle: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 14,
  },

  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontWeight: "600",
  },

  label: {
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
    color: "#666",
  },

  vehicleRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14,
  },

  vBtn: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  vBtnActive: {
    backgroundColor: "#000",
  },

  vText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#000",
  },

  vTextActive: {
    color: "#fff",
  },

  /* 🔥 FIXED PASSWORD FIELD */
  passwordBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 46,
    marginBottom: 14,
    backgroundColor: "#fff",
  },

  passwordInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
  },

  eyeBtn: {
    padding: 6,
  },

  saveBtn: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  saveBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1.5,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    marginVertical: 12,
    textAlign: "center",
  },

  delivererCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  delInfo: {
    flexDirection: "row",
    gap: 10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontWeight: "900",
  },

  delName: {
    fontWeight: "800",
    fontSize: 13,
  },

  delDetail: {
    fontSize: 11,
    color: "#777",
  },

  cardActionContainerFrame: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
});