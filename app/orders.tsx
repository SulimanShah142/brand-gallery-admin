import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, 
  RefreshControl, ActivityIndicator, Alert, Modal, ScrollView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/lib/config';

export default function AdminOrders() {
  const router = useRouter();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [deliverers, setDeliverers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
   const [packagers, setPackagers] = useState<any[]>([]);
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // 🎯 NEW: TIMELINE TIMESTAMPS HOOK SETS
  const [timeScope, setTimeScope] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('today');
  const [customYear, setCustomYear] = useState('');
  const [customMonth, setCustomMonth] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [assignModal, setAssignModal] = useState(false);

  // 🎯 RE-ENGINEERED HTTP TIMELINE CONTEXT GETTER
  const fetchScopedOrdersList = useCallback(async () => {
    setLoading(true);
    try {
      let targetUrl = `${API_URL}/api/admin/orders?timeline=${timeScope}`;
      if (timeScope === 'custom' && customYear) {
        targetUrl += `&year=${customYear.trim()}&month=${customMonth.trim()}`;
      }

      const res = await fetch(targetUrl);
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("❌ Timeline compilation lookup failure:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeScope, customYear, customMonth]);

const fetchStaff = useCallback(async () => {
  try {
    const res = await fetch(`${API_URL}/api/admin/deliverers`);
    if (!res.ok) return;

    const data = await res.json();

    const allStaff =
      Array.isArray(data)
        ? data
        : Array.isArray(data.staff)
          ? data.staff
          : [];

    setDeliverers(allStaff.filter(s => s.role === 'deliverer'));
    setPackagers(allStaff.filter(s => s.role === 'packager'));
  } catch (e) {
    console.error("staff fetch failed", e);
  }
}, []);
const assignToPackager = async (orderId: string, packagerId: string) => {
  try {
    const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/assign-packager`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packagerId,
        status: 'awaiting_packaging'
      })
    });

    if (res.ok) {
      Alert.alert("Success", "Sent to packager!");
      setAssignModal(false);
      fetchScopedOrdersList();
    }
  } catch (e) {
    Alert.alert("Error", "Packager assignment failed");
  }
};


useEffect(() => {
  fetchScopedOrdersList();
}, [timeScope, customYear, customMonth]);

useEffect(() => {
  fetchStaff();
}, []);


  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchesStatus = statusFilter === 'ALL' || order.status?.toLowerCase() === statusFilter.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        order.id?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.address?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchQuery, statusFilter]);

const assignToDeliverer = async (
  orderId: string,
  driverId: string
) => {
  try {
    const isRefundOrder =
      selectedOrder?.status === 'refund_approved';

    const res = await fetch(
      `${API_URL}/api/admin/orders/${orderId}/assign`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delivererId: driverId,
          status: isRefundOrder
            ? 'refund_pickup_in_progress'
            : 'assigned_to_deliverer',
        }),
      }
    );

    if (res.ok) {
      Alert.alert(
        'Success',
        isRefundOrder
          ? 'Refund job assigned!'
          : 'Order assigned!'
      );

      setAssignModal(false);
      fetchScopedOrdersList();
    }
  } catch (e) {
    Alert.alert(
      'Error',
      'Assignment failed'
    );
  }
};

useEffect(() => {
  console.log("PACKAGERS:", packagers);
  console.log("DELIVERERS:", deliverers);
}, [packagers, deliverers]);
  const cancelAssignment = async (orderId: string) => {
    Alert.alert("Cancel Delivery", "Move order back to pending status?", [
      { text: "No" },
      { text: "Yes", onPress: async () => {
          await fetch(`${API_URL}/api/admin/orders/${orderId}/assign`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delivererId: null, status: 'pending' })
          });
          fetchScopedOrdersList();
      }}
    ]);
  };


  const getCanonicalStatusStyle = (status: string) => {
  switch (status) {
    case 'pending':
      return { color: '#FF9500', bg: '#FFF9E6', label: 'pending' };

    case 'confirmed':
      return { color: '#007AFF', bg: '#EAF3FF', label: 'confirmed' };

    case 'picked_up':
      return { color: '#5E5CE6', bg: '#F2F2FE', label: 'picked_up' };

    case 'delivered':
      return { color: '#28A745', bg: '#EAF6ED', label: 'delivered' };

    case 'cancelled':
      return { color: '#FF3B30', bg: '#FFF2F2', label: 'cancelled' };

    case 'refunded':
      return { color: '#0EA5E9', bg: '#E0F2FE', label: 'refunded' };

    default:
      return { color: '#8E8E93', bg: '#F2F2F7', label: 'pending' };
  }
};


const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await fetchScopedOrdersList();
  setRefreshing(false);
}, [fetchScopedOrdersList]);

    // 🎯 HIGH-PERFORMANCE ORDER CELL CARRIER SYSTEM (COLOR ALIGNED + RE-ASSIGN LOCKED)
 const renderOrder = ({ item }: { item: any }) => {
  const rawStatus = String(item.status || 'pending')
    .trim()
    .toLowerCase();

  const statusLabelConfig = (() => {
    switch (rawStatus) {
      case 'pending':
        return { color: '#FF9500', bg: '#FFF9E6' };

      case 'awaiting_packaging':
        return { color: '#007AFF', bg: '#EAF3FF' };

      case 'packaging':
        return { color: '#AF52DE', bg: '#F6EDFF' };

      case 'packaged':
        return { color: '#34C759', bg: '#EAF8EE' };

      case 'assigned_to_deliverer':
        return { color: '#5856D6', bg: '#F2F2FE' };

      case 'picked_up':
        return { color: '#5E5CE6', bg: '#F2F2FE' };

      case 'out_for_delivery':
        return { color: '#007AFF', bg: '#EAF3FF' };

      case 'delivered':
        return { color: '#28A745', bg: '#EAF6ED' };
  case 'refund_requested':
  return {
    color: '#F59E0B',
    bg: '#FEF3C7',
  };

case 'refund_approved':
  return {
    color: '#0EA5E9',
    bg: '#E0F2FE',
  };

case 'refund_pickup_in_progress':
  return {
    color: '#0284C7',
    bg: '#DBEAFE',
  };

case 'refund_collected':
  return {
    color: '#7C3AED',
    bg: '#EDE9FE',
  };

case 'refunded':
  return {
    color: '#16A34A',
    bg: '#DCFCE7',
  };
      case 'rejected':
      case 'cancelled_by_user':
      case 'cancelled_by_packager':
      case 'cancelled_by_deliverer':
        return { color: '#FF3B30', bg: '#FFF2F2' };

      default:
        return { color: '#8E8E93', bg: '#F2F2F7' };
    }
  })();

const hardClosedStates = [
  'delivered',
  'rejected',
  'cancelled_by_user',
  'cancelled_by_packager',
  'cancelled_by_deliverer',
];

const refundStates = [
  'refund_requested',
  'refund_approved',
  'refund_pickup_in_progress',
  'refund_collected',
  'refunded',
];

const isOrderHardClosed = hardClosedStates.includes(rawStatus);
const isRefundState = refundStates.includes(rawStatus);
  return (
    <View style={styles.orderCard}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.cardMain}
        onPress={() => router.push(`orders/${item.id}`)}
      >
        <View style={styles.idRow}>
          <Text style={styles.orderId}>
            ORDER № {item.id.slice(0, 8).toUpperCase()}
          </Text>

          <View
            style={[
              styles.statusBadgeOverlay,
              { backgroundColor: statusLabelConfig.bg },
            ]}
          >
            <Text
              style={[
                styles.statusLabelText,
                { color: statusLabelConfig.color },
              ]}
            >
              {rawStatus.replaceAll('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName}>
          {item.customerName?.toUpperCase()}
        </Text>

        <Text style={styles.amount}>
          TOTAL: AFN {Math.round(item.totalAmount || 0).toLocaleString()}
        </Text>
      </TouchableOpacity>

      <View style={styles.actionArea}>
        {/* ================================= */}
        {/* PENDING */}
        {/* ================================= */}
        {rawStatus === 'pending' && (
          <TouchableOpacity
            style={styles.assignBtn}
            onPress={() => {
              setSelectedOrder(item);
              setAssignModal(true);
            }}
          >
            <Text style={styles.btnText}>
              SEND TO PACKAGING
            </Text>
          </TouchableOpacity>
        )}

        {/* ================================= */}
        {/* PACKAGING STATES */}
        {/* ================================= */}
        {[
          'awaiting_packaging',
          'packaging',
          'packaged',
        ].includes(rawStatus) && (
          <View style={styles.assignedRow}>
            <Text style={styles.assignedText}>
              {rawStatus === 'awaiting_packaging' &&
                'WAITING FOR PACKAGER'}

              {rawStatus === 'packaging' &&
                'CURRENTLY BEING PACKAGED'}

              {rawStatus === 'packaged' &&
                'READY FOR DELIVERY ASSIGNMENT'}
            </Text>

            {rawStatus === 'packaged' && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedOrder(item);
                  setAssignModal(true);
                }}
              >
                <Text style={styles.reassignLink}>
                  ASSIGN DRIVER
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ================================= */}
        {/* DELIVERY STATES */}
        {/* ================================= */}
        {[
          'assigned_to_deliverer',
          'picked_up',
          'out_for_delivery',
        ].includes(rawStatus) && (
          <View style={styles.assignedRow}>
            <Text
              style={styles.assignedText}
              numberOfLines={1}
            >
              DRIVER: {item.driverName?.toUpperCase() || 'UNASSIGNED'}
            </Text>

            <TouchableOpacity
              onPress={() => cancelAssignment(item.id)}
            >
              <Text style={styles.reassignLink}>
                REASSIGN
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================= */}
        {/* COMPLETED */}
        {/* ================================= */}
        {rawStatus === 'delivered' && (
          <View style={styles.assignedRow}>
            <Text style={styles.assignedText}>
              DELIVERED SUCCESSFULLY
            </Text>

            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#28A745"
            />
          </View>
        )}

        {/* ================================= */}
        {/* CANCELLED */}
        {/* ================================= */}
        {[
          'rejected',
          'cancelled_by_user',
          'cancelled_by_packager',
          'cancelled_by_deliverer',
        ].includes(rawStatus) && (
          <View style={styles.assignedRow}>
            <Text
              style={styles.assignedText}
              numberOfLines={2}
            >
              {rawStatus
                .replaceAll('_', ' ')
                .toUpperCase()}
            </Text>

            <Ionicons
              name="close-circle"
              size={16}
              color="#FF3B30"
            />
          </View>
        )}
      {rawStatus === 'refund_requested' && (
  <View style={styles.assignedRow}>
    <Text style={styles.assignedText}>
      REFUND WAITING FOR ADMIN REVIEW
    </Text>
  </View>
)}

{rawStatus === 'refund_approved' && (
  <View style={styles.assignedRow}>
    <Text style={styles.assignedText}>
      REFUND APPROVED - ASSIGN DRIVER
    </Text>

    <TouchableOpacity
      onPress={() => {
        setSelectedOrder(item);
        setAssignModal(true);
      }}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#0EA5E9',
        borderRadius: 6,
      }}
    >
      <Text
        style={{
          color: '#fff',
          fontWeight: '800',
        }}
      >
        ASSIGN DRIVER
      </Text>
    </TouchableOpacity>
  </View>
)}

{rawStatus === 'refund_pickup_in_progress' && (
  <View style={styles.assignedRow}>
    <Text style={styles.assignedText}>
      DRIVER COLLECTING RETURN
    </Text>
  </View>
)}

{rawStatus === 'refund_collected' && (
  <View style={styles.assignedRow}>
    <Text style={styles.assignedText}>
      PRODUCT RETURNED - WAITING PAYMENT
    </Text>
  </View>
)}

{rawStatus === 'refunded' && (
  <View style={styles.assignedRow}>
    <Text style={styles.assignedText}>
      REFUND COMPLETED
    </Text>

    <Ionicons
      name="cash"
      size={16}
      color="#0EA5E9"
    />
  </View>
)}

        {isOrderHardClosed && (
          <View style={styles.lockedStateBadgeIcon}>
            <Ionicons
              name="lock-closed"
              size={12}
              color="#8E8E93"
            />
          </View>
        )}
      </View>
    </View>
  );
};
  return (
    <View style={styles.container}>
      
      {/* FILTER SYSTEM DASHBOARD TRUNK */}
      <View style={styles.filterSection}>
        
        {/* Real-time search query text bar inputs */}
        <View style={styles.searchBarRow}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput 
            style={styles.searchInput}
            placeholder="SEARCH RECIPIENT NAME, ADDRESS OR ORDER ID..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* TIMELINE SCOPE TRIGGERS SLIDER PANEL */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineTabGroup} contentContainerStyle={{ gap: 6 }}>
          {[
            { code: 'today', label: 'TODAY' },
            { code: 'this_week', label: 'LAST 7 DAYS' },
            { code: 'this_month', label: 'THIS MONTH' },
            { code: 'all', label: 'ALL LOGS' },
            { code: 'custom', label: 'CUSTOM ARCHIVE' }
          ].map((scope) => (
            <TouchableOpacity 
              key={scope.code}
              style={[styles.timeTab, timeScope === scope.code && styles.timeTabActive]}
              onPress={() => setTimeScope(scope.code as any)}
            >
              <Text style={[styles.timeTabText, timeScope === scope.code && styles.timeTabTextActive]}>{scope.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* CUSTOM DATA SEARCH INPUT FIELDS GRID */}
        {timeScope === 'custom' && (
          <View style={styles.customDateInputRow}>
            <TextInput 
              style={styles.dateField} 
              placeholder="YEAR (E.G. 2025)" 
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={4}
              value={customYear}
              onChangeText={setCustomYear}
            />
            <TextInput 
              style={styles.dateField} 
              placeholder="MONTH (1-12)" 
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={2}
              value={customMonth}
              onChangeText={setCustomMonth}
            />
            <TouchableOpacity style={styles.dateSubmitBtn} onPress={fetchScopedOrdersList}>
              <Ionicons name="funnel-outline" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Sub Status categorization filters strip list */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 6 }} contentContainerStyle={{ gap: 8 }}>
          {/* 🎯 REJECTED CRITERION FILTER INJECTED INTO THE SEARCH TAB CAROUSEL ARRAY */}
          {['ALL', 'PENDING', 'CONFIRMED', 'PICKED_UP', 'DELIVERED', 'REJECTED'].map((st) => (
            <TouchableOpacity 
              key={st} 
              style={[styles.statusTab, statusFilter === st && styles.statusTabActive]} 
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.statusTabText, statusFilter === st && styles.statusTabActiveText]}>{st}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CORE FLATLIST DATA STREAM MONITOR */}
      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="small" color="#000" /></View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} refreshControl={
  <RefreshControl
    refreshing={refreshing}
    onRefresh={handleRefresh}
    tintColor="#000"
  />
} tintColor="#000" />}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="document-text-outline" size={44} color="#DDD" /><Text style={styles.emptyText}>NO MANIFEST ROWS FOUND WITHIN CHOSEN TIMELINE.</Text></View>}
        />
      )}

      {/* DISPATCH COURIER MODAL DRAWERS */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SELECT FLEET COURIER</Text>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
          {packagers.length > 0 && (
  <>
    <Text style={{ fontWeight: '900', marginTop: 10 }}>
      PACKAGERS
    </Text>

    {packagers.map((p) => (
      <TouchableOpacity
        key={p.id}
        style={styles.driverItem}
        onPress={() => assignToPackager(selectedOrder?.id, p.id)}
      >
        <Text>{p.name.toUpperCase()}</Text>
        <Text>PACKAGER</Text>
      </TouchableOpacity>
    ))}
  </>
)}

{deliverers.length > 0 && (
  <>
    <Text style={{ fontWeight: '900', marginTop: 10 }}>
      DELIVERY DRIVERS
    </Text>

    {deliverers.map((d) => (
      <TouchableOpacity
        key={d.id}
        style={styles.driverItem}
        onPress={() => assignToDeliverer(selectedOrder?.id, d.id)}
      >
        <Text>{d.name.toUpperCase()}</Text>
        <Text>DELIVERER</Text>
      </TouchableOpacity>
    ))}
  </>
)}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setAssignModal(false)}><Text style={styles.modalCloseText}>CLOSE CONTROL WINDOW</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statusBadgeOverlay: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabelText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  lockedStateBadgeIcon: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    opacity: 0.6,
  },

  // =========================
  // FILTER / SEARCH PANEL
  // =========================

  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,

    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FAFAFA',

    borderWidth: 1,
    borderColor: '#ECECEC',

    borderRadius: 14,

    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,

    gap: 10,
  },

  searchInput: {
    flex: 1,

    fontSize: 13,
    fontWeight: '600',

    color: '#111111',
  },

  // =========================
  // TIMELINE FILTERS
  // =========================

  timelineTabGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    marginTop: 14,
    gap: 8,
  },

  timeTab: {
    backgroundColor: '#F5F5F5',

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: '#ECECEC',
  },

  timeTabActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },

  timeTabText: {
    fontSize: 10,
    fontWeight: '800',

    color: '#777777',

    letterSpacing: 0.8,
  },

  timeTabTextActive: {
    color: '#FFFFFF',
  },

  customDateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,

    marginTop: 12,

    backgroundColor: '#FAFAFA',

    borderWidth: 1,
    borderColor: '#ECECEC',

    borderRadius: 12,

    padding: 10,
  },

  dateField: {
    flex: 1,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#ECECEC',

    borderRadius: 10,

    paddingHorizontal: 12,
    paddingVertical: 10,

    fontSize: 11,
    fontWeight: '700',

    color: '#000000',
  },

  dateSubmitBtn: {
    backgroundColor: '#000000',

    borderRadius: 10,

    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // =========================
  // STATUS FILTERS
  // =========================

  statusTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    marginTop: 14,
    gap: 10,
  },

  statusTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 999,

    backgroundColor: '#F5F5F5',
  },

  statusTabActive: {
    backgroundColor: '#000000',
  },

  statusTabText: {
    fontSize: 10,
    fontWeight: '800',

    color: '#777777',

    letterSpacing: 0.5,
  },

  statusTabActiveText: {
    color: '#FFFFFF',
  },

  // =========================
  // ORDER LIST
  // =========================

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
  },

  orderCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    padding: 18,

    marginBottom: 16,

    borderWidth: 1,
    borderColor: '#EFEFEF',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,

    elevation: 2,
  },

  cardMain: {
    gap: 8,
  },

  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F4',

    paddingBottom: 12,
    marginBottom: 8,
  },

  orderId: {
    fontSize: 12,
    fontWeight: '900',

    color: '#111111',

    letterSpacing: 0.6,
  },

  statusLabel: {
    fontSize: 10,
    fontWeight: '900',

    letterSpacing: 0.8,
  },

  customerName: {
    fontSize: 16,
    fontWeight: '900',

    color: '#111111',

    textTransform: 'uppercase',
  },

  amount: {
    fontSize: 13,
    fontWeight: '700',

    color: '#666666',
  },

  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    marginTop: 6,
  },

  metaLabel: {
    fontSize: 10,
    fontWeight: '700',

    color: '#999999',

    letterSpacing: 0.5,
  },

  metaValue: {
    fontSize: 11,
    fontWeight: '800',

    color: '#222222',
  },

  // =========================
  // ACTION AREA
  // =========================

  actionArea: {
    marginTop: 16,

    borderTopWidth: 1,
    borderTopColor: '#F4F4F4',

    paddingTop: 14,
  },

  assignBtn: {
    backgroundColor: '#000000',

    borderRadius: 14,

    paddingVertical: 14,

    justifyContent: 'center',
    alignItems: 'center',
  },

  btnText: {
    color: '#FFFFFF',

    fontSize: 11,
    fontWeight: '900',

    letterSpacing: 1,
  },

  assignedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  assignedText: {
    fontSize: 11,
    fontWeight: '800',

    color: '#666666',
  },

  reassignLink: {
    color: '#FF3B30',

    fontSize: 11,
    fontWeight: '900',
  },

  // =========================
  // DRIVER MODAL
  // =========================

  modalOverlay: {
    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.45)',

    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    padding: 24,
    paddingBottom: 40,
  },

  modalTitle: {
    fontSize: 12,
    fontWeight: '900',

    color: '#000000',

    letterSpacing: 1.5,

    marginBottom: 20,
  },

  driverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingVertical: 16,

    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  driverName: {
    fontSize: 14,
    fontWeight: '800',

    color: '#111111',
  },

  driverVehicle: {
    fontSize: 10,
    fontWeight: '700',

    color: '#999999',

    marginTop: 4,
  },

  modalClose: {
    backgroundColor: '#F5F5F5',

    borderRadius: 14,

    paddingVertical: 14,

    marginTop: 22,

    alignItems: 'center',
  },

  modalCloseText: {
    fontSize: 11,
    fontWeight: '900',

    color: '#666666',
  },

  // =========================
  // EMPTY STATE
  // =========================

  empty: {
    alignItems: 'center',

    marginTop: 140,

    paddingHorizontal: 40,
  },

  emptyText: {
    fontSize: 11,
    fontWeight: '800',

    color: '#B5B5B5',

    textAlign: 'center',

    letterSpacing: 0.8,
  },
});