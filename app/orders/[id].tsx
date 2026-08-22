import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator,KeyboardAvoidingView, Platform, Pressable , TouchableOpacity, Alert, TextInput, Modal, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UnifiedMap from '@/components/UnifiedMap';
import { API_URL } from '@/lib/config';




const openWhatsApp = async (phoneNumber?: string | null) => {
  try {
    console.log('📱 WhatsApp raw number:', phoneNumber);

    if (!phoneNumber) {
      Alert.alert(
        'WhatsApp unavailable',
        'No WhatsApp number is available for this customer.'
      );
      return;
    }

    // Normalize the number
    let phone = String(phoneNumber)
      .trim()
      .replace(/[^\d+]/g, '');

    console.log('📱 WhatsApp cleaned number:', phone);

    // Remove + if present
    phone = phone.replace(/^\+/, '');

    // Afghanistan local number:
    // 0745772237 -> 93745772237
    if (phone.startsWith('0')) {
      phone = `93${phone.slice(1)}`;
    }

    // If someone stored 0093XXXXXXXXX
    if (phone.startsWith('0093')) {
      phone = phone.slice(2);
    }

    console.log('📱 WhatsApp final international number:', phone);

    if (!phone || phone.length < 10) {
      Alert.alert(
        'Invalid WhatsApp number',
        `The stored WhatsApp number appears to be invalid:\n${phoneNumber}`
      );
      return;
    }

    // First try the WhatsApp native scheme.
    const whatsappUrl = `whatsapp://send?phone=${phone}`;

    try {
      console.log('📱 Opening WhatsApp app:', whatsappUrl);

      await Linking.openURL(whatsappUrl);

      return;
    } catch (whatsappError) {
      console.warn(
        '⚠️ WhatsApp app scheme failed, falling back to web:',
        whatsappError
      );
    }

    // Fallback: WhatsApp web/deep link
    const webUrl = `https://wa.me/${phone}`;

    console.log('🌐 Opening WhatsApp web URL:', webUrl);

    await Linking.openURL(webUrl);

  } catch (error) {
    console.error(
      '❌ Failed to open WhatsApp:',
      error
    );

    Alert.alert(
      'WhatsApp unavailable',
      'Unable to open WhatsApp for this customer.'
    );
  }
};

export const STATUS_CANONICAL_MAP: Record<string, string> = {
  pending: 'pending',

  accepted: 'confirmed',
  confirmed: 'confirmed',
  processing: 'confirmed',

 awaiting_packaging: 'awaiting_packaging',
packaging: 'packaging',
packaged: 'packaged',
assigned_to_deliverer: 'assigned_to_deliverer',

  shipped: 'picked_up',
  transit: 'picked_up',
  picked_up: 'picked_up',
  out_for_delivery: 'picked_up',

  delivered: 'delivered',
  completed: 'delivered',

  cancelled: 'cancelled',
  canceled: 'cancelled',
  rejected: 'cancelled',

  cancelled_by_user: 'cancelled',
  cancelled_by_packager: 'cancelled',
  cancelled_by_deliverer: 'cancelled',

  refund_requested: 'refund_requested',
  refund_rejected: 'refund_rejected',
  refund_approved: 'refund_approved',
  refunded: 'refunded',
};


export const normalizeStatus = (status?: string) => {
  if (!status) return 'pending';

  const normalized = String(status)
    .trim()
    .toLowerCase();

  return STATUS_CANONICAL_MAP[normalized] || normalized;
};

export default function UserOrderDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // 1. Structural States
  const [order, setOrder] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liveDriverCoords, setLiveDriverCoords] = useState<[number, number] | null>(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
// Inside your primary Admin Order Details component function header:
const [rejectionReason, setRejectionReason] = useState("");
const [statusSubmitting, setStatusSubmitting] = useState(false);
const [modalVisible, setModalVisible] = useState(false);
const [modalType, setModalType] = useState<'order_reject' | 'refund_reject' | null>(null);
const [reasonModalVisible, setReasonModalVisible] = useState(false);

const [reasonType, setReasonType] = useState<
  'refund' | 'reject'
>('refund');

const [reasonText, setReasonText] = useState('');
  // 2. Parallel Resource Fetch Initializer
  // 1. DATA SEEDING INITIALIZER: Parallel Resource Data Fetch Engine
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        const [orderRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/api/orders/${id}`),
          fetch(`${API_URL}/api/admin/settings`)
        ]);

        const orderData = await orderRes.json();
        const settingsData = await settingsRes.json();

        setOrder(normalizeOrder(orderData));
        setSettings(settingsData);

        // 🎯 FIX: Verify numeric parameters fields safely to handle text strings out of your Neon table data rows
        if (orderData?.driverLat && orderData?.driverLng) {
          const initLat = parseFloat(orderData.driverLat);
          const initLng = parseFloat(orderData.driverLng);
          if (!isNaN(initLat) && !isNaN(initLng)) {
            setLiveDriverCoords([initLat, initLng]);
          }
        }
      } catch (err) {
        console.error("❌ Order details retrieval crash:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);


  const approveRefund = async () => {
  try {
    setStatusSubmitting(true);

    const res = await fetch(
      `${API_URL}/api/admin/orders/${id}/refund/approve`,
      { method: 'POST' }
    );

   const rawOrder = await res.json();

const cleanOrder =
  rawOrder?.order ||
  rawOrder?.data ||
  rawOrder;

setOrder(normalizeOrder(cleanOrder));

    Alert.alert('Success', 'Refund approved');
  } finally {
    setStatusSubmitting(false);
  }
};

const rejectRefund = async (reasonFromModal?: string) => {
  try {
    setStatusSubmitting(true);

    const res = await fetch(
      `${API_URL}/api/admin/orders/${id}/refund/reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: (reasonFromModal || rejectionReason || '').trim(),
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || 'Request failed');
    }
console.log(
  'SUBMITTING REFUND REJECTION:',
  rejectionReason
);
    setOrder(data.order);
    Alert.alert('Success', 'Refund rejected');
  } finally {
    setStatusSubmitting(false);
  }
};
  // 2. 🎯 AUTOMATED HEARTBEAT TELEMETRY LOOP (RECONCILED GATES FIXED)
  useEffect(() => {
    let trackingTimer: ReturnType<typeof setInterval>;

    // 🎯 THE STATUS GAP REPAIR: Activate tracking for BOTH 'confirmed' and 'picked_up' states!
    // This forces the admin map view to fetch telemetry coordinates as soon as the driver is assigned.
 const isLiveTrackingActive = [
  'assigned_to_deliverer',
  'picked_up',
  'out_for_delivery'
].includes(order?.status);

    if (isLiveTrackingActive) {
      console.log(`📡 [ADMIN APP] Live tracking loop activated for status: ${order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase().toUpperCase()}`);
      
      const pollDriverLocation = async () => {
        try {
          const res = await fetch(`${API_URL}/api/orders/${id}/driver-location`);
          if (res.ok) {
            const gpsNode = await res.json();
            
            // Validate that the returned parameters contain real values before updating state
            if (gpsNode?.lat !== null && gpsNode?.lng !== null) {
              const nextLat = parseFloat(gpsNode.lat);
              const nextLng = parseFloat(gpsNode.lng);

              if (!isNaN(nextLat) && !isNaN(nextLng)) {
                console.log(`📍 [ADMIN TELEMETRY UPDATE] Lat: ${nextLat}, Lng: ${nextLng}`);
                setLiveDriverCoords([nextLat, nextLng]);
              }
            }
          }
        } catch (e) {
          console.warn("⚠️ Courier tracking poll failed:", e);
        }
      };

      // Run once immediately on status shift to prevent layout stuttering gaps
      pollDriverLocation();

      // Configure clean 12-second snapshot intervals
      trackingTimer = setInterval(pollDriverLocation, 12000); 
    }

    return () => {
      if (trackingTimer) {
        console.log("🟡 Ending admin tracking interval for room:", id);
        clearInterval(trackingTimer);
      }
    };
  }, [order?.status, id]); // Closed loop stays tight and stable

const updateStatus = async (
  newStatus: string,
  reason?: string
) => {
  try {
    setStatusSubmitting(true);
  const payload: any = {
    status: newStatus,
  };

  if (
    [
      'rejected',
      'cancelled_by_user',
      'cancelled_by_packager',
      'cancelled_by_deliverer',
    ].includes(newStatus)
  ) {
    payload.rejectionReason =
      reason?.trim() || null;
  }

  console.log(
    'PATCH PAYLOAD:',
    JSON.stringify(payload, null, 2)
  );


    const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || 'Status update failed');
    }

    const freshOrder = await fetch(
      `${API_URL}/api/orders/${id}`
    ).then(r => r.json());

    setOrder(freshOrder);

    if (freshOrder?.driverLat && freshOrder?.driverLng) {
      const lat = parseFloat(freshOrder.driverLat);
      const lng = parseFloat(freshOrder.driverLng);

      if (!isNaN(lat) && !isNaN(lng)) {
        setLiveDriverCoords([lat, lng]);
      }
    }

    Alert.alert(
      'Success',
      `Order moved to ${newStatus.replaceAll('_', ' ').toUpperCase()}`
    );
  } catch (e: any) {
    Alert.alert(
      'Update Failed',
      e?.message || 'Unable to update order status.'
    );
  } finally {
    setStatusSubmitting(false);
  }
};


const handleReasonSubmit = async () => {
  try {
    if (!order?.id) {
      Alert.alert(
        'Error',
        'Order not loaded yet.'
      );
      return;
    }

    if (!reasonText.trim()) {
      Alert.alert(
        'Reason Required',
        'Please enter a reason.'
      );
      return;
    }

    setStatusSubmitting(true);

    // ORDER REJECTION
    if (reasonType === 'reject') {
      await updateStatus(
        'rejected',
        reasonText.trim()
      );
    }

    // REFUND REJECTION
    if (reasonType === 'refund') {
      await rejectRefund(
        reasonText.trim()
      );
    }

    setReasonModalVisible(false);
    setReasonText('');

  } catch (err) {
    console.error(err);

    Alert.alert(
      'Error',
      'Failed to submit decision.'
    );
  } finally {
    setStatusSubmitting(false);
  }
};

const normalizeOrder = (order: any) => ({
  ...order,

  refundReason:
    order?.refundReason ??
    order?.refund_reason ??
    null,

  refundAdminNote:
    order?.refundAdminNote ??
    order?.refund_admin_note ??
    null,

  refundProcessedAt:
    order?.refundProcessedAt ??
    order?.refund_processed_at ??
    null,

  rejectionReason:
    order?.rejectionReason ??
    order?.rejection_reason ??
    null,
});
const openOrderRejectModal = () => {
  setModalType('order_reject');
  setModalVisible(true);
};

const openRefundRejectModal = () => {
  setModalType('refund_reject');
  setModalVisible(true);
};

const closeModal = () => {
  setModalVisible(false);
  setModalType(null);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#FF9500';

    case 'confirmed':
      return '#007AFF';

    case 'awaiting_packaging':
      return '#8E8E93';

    case 'packaging':
      return '#AF52DE';

    case 'packaged':
      return '#5856D6';

    case 'assigned_to_deliverer':
      return '#00AEEF';

    case 'picked_up':
      return '#34C759';

    case 'out_for_delivery':
      return '#FFCC00';

    case 'delivered':
      return '#22C55E';

    case 'cancelled_by_user':
    case 'cancelled_by_packager':
    case 'cancelled_by_deliverer':
    case 'rejected':
      return '#FF3B30';

    default:
      return '#8E8E93';
  }
};
 const rawStatus = String(order?.status || '')
  .trim()
  .toLowerCase();
  const canonicalStatus = normalizeStatus(rawStatus);
  
  const statusConfig = getStatusColor(canonicalStatus);
  

  // 4. MEMOIZED COORDINATES COMPILATION GATES
  const warehouseCoords = useMemo<[number, number]>(() => {
    const lat = parseFloat(settings?.warehouseLat || settings?.warehouse_lat || "34.5330");
    const lng = parseFloat(settings?.warehouseLng || settings?.warehouse_lng || "69.1660");
    return [lat, lng];
  }, [settings]);

  const customerCoords = useMemo<[number, number]>(() => {
    const lat = parseFloat(order?.latitude || "34.5553");
    const lng = parseFloat(order?.longitude || "69.2075");
    return [lat, lng];
  }, [order]);

  // 6. Early Render Guards
  if (loading && !order) return <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>;
  if (!order) return <View style={styles.center}><Text style={styles.errorText}>ORDER NOT FOUND</Text></View>;

const isRefundJob =
  !!order?.refundProcessedAt &&
  order?.status === 'refunded';

  return (
  <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

    {mapFullscreen && (
      <View style={styles.fullscreenOverlay}>
        <UnifiedMap
          role="ADMIN"
          destinationCoords={customerCoords}
          warehouseCoords={warehouseCoords}
          driverCoords={liveDriverCoords}
          isFullscreen={true}
          setIsFullscreen={setMapFullscreen}
        />
      </View>
    )}

    {/* 🎯 MAP OUTSIDE SCROLLVIEW */}
    <View style={styles.mapContainer}>
      <UnifiedMap
        role="ADMIN"
        destinationCoords={customerCoords}
        warehouseCoords={warehouseCoords}
        driverCoords={liveDriverCoords}
        isFullscreen={mapFullscreen}
        setIsFullscreen={setMapFullscreen}
      />
    </View>
    

    {/* 🎯 ONLY CONTENT SCROLLS */}
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: 60
      }}
    >

      {isRefundJob && (
  <View
    style={{
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 10,
      backgroundColor: '#FEF3C7',
      borderWidth: 1,
      borderColor: '#F59E0B',
      borderRadius: 14,
      padding: 16,
    }}
  >
    <Text
      style={{
        fontSize: 18,
        fontWeight: '800',
        color: '#92400E',
      }}
    >
      💰 REFUND OPERATION
    </Text>

    <Text
      style={{
        marginTop: 6,
        color: '#92400E',
        fontWeight: '600',
      }}
    >
      Customer refund approved.
    </Text>

    <Text
      style={{
        marginTop: 4,
        color: '#92400E',
      }}
    >
      Deliverer must:
    </Text>

    <Text
      style={{
        marginTop: 6,
        color: '#92400E',
      }}
    >
      • Collect product from customer
    </Text>

    <Text
      style={{
        color: '#92400E',
      }}
    >
      • Return cash to customer
    </Text>

    <Text
      style={{
        color: '#92400E',
      }}
    >
      • Bring returned product back
    </Text>

    {!!order.refundReason && (
      <Text
        style={{
          marginTop: 12,
          color: '#92400E',
          fontWeight: '700',
        }}
      >
        Reason: {order.refundReason}
      </Text>
    )}
  </View>
)}



      {/* 🎯 CUSTOMER MANIFEST */}
  <View style={styles.card}>
  <Text style={styles.sectionTitle}>
    Customer Manifest
  </Text>

  <Text style={styles.detailText}>
    <Text style={styles.detailLabel}>
      NAME:
    </Text>{' '}
    {(
      order?.customerName ||
      order?.name ||
      'N/A'
    ).toUpperCase()}
  </Text>

  <Text style={styles.detailText}>
    <Text style={styles.detailLabel}>
      PHONE:
    </Text>{' '}
    {order?.phoneNumber || order?.phone || 'N/A'}
  </Text>

  <Text style={styles.detailText}>
    <Text style={styles.detailLabel}>
      ADDRESS:
    </Text>{' '}
    {(order?.address || 'N/A').toUpperCase()}
  </Text>

  {/* WHATSAPP CONTACT */}
  <TouchableOpacity
    disabled={!order?.whatsappNumber}
    onPress={() =>
      openWhatsApp(order?.whatsappNumber)
    }
    style={{
      marginTop: 14,
      backgroundColor: '#25D366',
      borderRadius: 12,
      paddingVertical: 13,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    }}
  >
    <Ionicons
      name="logo-whatsapp"
      size={19}
      color="#FFFFFF"
    />

    <Text
      style={{
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 8,
      }}
    >
      {order?.whatsappNumber
        ? `WHATSAPP • ${order.whatsappNumber}`
        : 'WHATSAPP UNAVAILABLE'}
    </Text>
  </TouchableOpacity>
</View>

      {/* 🎯 ITEMS */}
           {/* 🎯 ITEMS CARD WITH INTEGRATED CONFIRM/REJECT CONTROLS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Items ({order.items?.length || 0})
        </Text>

        {order.items?.map((item: any) => (
          <View key={`item-${item.id}`} style={styles.itemRow}>
            <Image
              source={{ uri: item.productImage || item.imageUrl }}
              style={styles.thumb}
            />

            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.itemName}>
                {item.productName || item.name}
              </Text>

              <Text style={styles.itemMeta}>
                QTY: {item.quantity} | SIZE:{' '}
                <Text style={styles.attributeValueHighlight}>
                  {item.selectedSize || item.size || 'STANDARD'}
                </Text>{' '}
                | COLOR:{' '}
                <Text style={styles.attributeValueHighlight}>
                  {(item.selectedColor || item.color || 'N/A').toUpperCase()}
                </Text>
              </Text>
            </View>

            <Text style={styles.price}>
              AFN {(Number(item.price) || 0).toLocaleString()}
            </Text>
          </View>
        ))}

        {/* 🎯 EDITORIAL ACTION ROW CONTAINER BLOCK (CONFIRM & REJECT WITH REASON) */}
       {/* =======================================================
   ADMIN WORKFLOW ACTIONS
======================================================= */}

{[
  'refund_requested',
  'refund_approved',
  'refund_rejected',
  'refunded',
].includes(rawStatus) && (
  <View
    style={{
      marginTop: 12,
      padding: 14,
      borderRadius: 12,
      backgroundColor: statusConfig.bg,
    }}
  >
    <Text
      style={{
        color: statusConfig.color,
        fontWeight: '800',
      }}
    >
      {(
        (`status_${rawStatus}`) ||
        rawStatus.replace(/_/g, ' ')
      ).toUpperCase()}
    </Text>

    {!!order?.refundReason && (
      <Text style={{ marginTop: 8 }}>
        Refund Reason: {order.refundReason}
      </Text>
    )}

    {!!order?.refundAdminNote && (
      <Text
        style={{
          marginTop: 8,
          fontWeight: '700',
        }}
      >
        Admin Note: {order.refundAdminNote}
      </Text>
    )}
  </View>
)}

{[
  'refund_requested',
  'refund_approved',
  'refund_rejected',
  'refunded',
].includes(order.status) && (
  <View style={styles.refundActionBox}>

    <Text style={styles.inputLabelFieldTitle}>
      REFUND WORKFLOW
    </Text>

    {!!order.refundReason && (
      <>
        <Text style={styles.rejectionSummaryTitleLabel}>
          CUSTOMER REASON
        </Text>

        <Text style={styles.refundReasonText}>
          {order.refundReason}
        </Text>
      </>
    )}

    {!!order.refundAdminNote && (
      <>
        <Text
          style={[
            styles.rejectionSummaryTitleLabel,
            { marginTop: 12 }
          ]}
        >
          ADMIN NOTE
        </Text>

        <Text style={styles.refundReasonText}>
          {order.refundAdminNote}
        </Text>
      </>
    )}

    {order.status === 'refund_requested' && (
      <View style={styles.actionButtonSplitRow}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={openRefundRejectModal}
        >
          <Text style={styles.rejectBtnText}>
            REJECT REFUND
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={approveRefund}
        >
          <Text style={styles.confirmBtnText}>
            APPROVE REFUND
          </Text>
        </TouchableOpacity>
      </View>
    )}

    {order.status === 'refund_approved' && (
      <>
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            REFUND APPROVED
          </Text>
        </View>

        <TouchableOpacity
          style={styles.confirmBtn}
          disabled={statusSubmitting}
          onPress={() => updateStatus('refunded')}
        >
          <Ionicons
            name="cash-outline"
            size={16}
            color="#FFF"
          />

          <Text style={styles.confirmBtnText}>
            MARK AS REFUNDED
          </Text>
        </TouchableOpacity>
      </>
    )}

    {order.status === 'refund_rejected' && (
      <View style={styles.rejectionReasonSummaryBox}>
        <Text style={styles.rejectionSummaryTitleLabel}>
          REFUND REJECTED
        </Text>

        <Text style={styles.rejectionSummaryBodyText}>
          {order.refundAdminNote || 'No reason provided'}
        </Text>
      </View>
    )}

    {order.status === 'refunded' && (
      <View style={styles.deliveryCompletedBanner}>
        <Ionicons
          name="checkmark-circle"
          size={18}
          color="#22C55E"
        />

        <Text style={styles.deliveryCompletedText}>
          REFUND COMPLETED
        </Text>
      </View>
    )}

  </View>
)}

<View style={styles.adminActionContainerSlot}>

  {[
    'pending',
    'confirmed',
    'awaiting_packaging',
    'packaging',
    'packaged',
    'assigned_to_deliverer',
    'picked_up',
    'out_for_delivery'
  ].includes(order.status) && (
    <>
      <Text style={styles.inputLabelFieldTitle}>
        CANCELLATION / REJECTION REASON
      </Text>

      <TextInput
        placeholder="Provide operational reason..."
        placeholderTextColor="#AAAAAA"
        value={rejectionReason}
        onChangeText={setRejectionReason}
        style={styles.rejectionReasonInputField}
        multiline
        editable={!statusSubmitting}
      />
    </>
  )}

  {/* =========================
      PENDING
  ========================= */}

  {order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'pending' && (
    <View style={styles.actionButtonSplitRow}>

      <TouchableOpacity
        style={[
          styles.rejectBtn,
          (!rejectionReason.trim() || statusSubmitting) && {
            backgroundColor: '#F2F2F7',
            borderColor: '#F2F2F7'
          }
        ]}
        disabled={!rejectionReason.trim() || statusSubmitting}
       onPress={openOrderRejectModal}
      >
        <Ionicons
          name="close-circle-outline"
          size={15}
          color={rejectionReason.trim() ? "#FF3B30" : "#999"}
        />

        <Text
          style={[
            styles.rejectBtnText,
            !rejectionReason.trim() && { color: '#999' }
          ]}
        >
          REJECT
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.confirmBtn}
        disabled={statusSubmitting}
        onPress={() =>
          updateStatus('confirmed')
        }
      >
        <Ionicons
          name="checkmark-circle"
          size={15}
          color="#FFF"
        />

        <Text style={styles.confirmBtnText}>
          CONFIRM
        </Text>
      </TouchableOpacity>

    </View>
  )}

  {/* =========================
      CONFIRMED
  ========================= */}

  {order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'confirmed' && (
    <TouchableOpacity
      style={styles.confirmBtn}
      disabled={statusSubmitting}
      onPress={() =>
        updateStatus('awaiting_packaging')
      }
    >
      <Ionicons
        name="cube-outline"
        size={16}
        color="#FFF"
      />

      <Text style={styles.confirmBtnText}>
        SEND TO PACKAGING
      </Text>
    </TouchableOpacity>
  )}

  {/* =========================
      PACKAGING STATES
  ========================= */}

  {order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'awaiting_packaging' && (
    <View style={styles.infoBanner}>
      <Text style={styles.infoBannerText}>
        WAITING FOR PACKAGER
      </Text>
    </View>
  )}

  {order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'packaging' && (
    <View style={styles.infoBanner}>
      <Text style={styles.infoBannerText}>
        CURRENTLY BEING PACKAGED
      </Text>
    </View>
  )}

  {/* =========================
      READY FOR DELIVERY
  ========================= */}

  {order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'packaged' && (
    <View style={styles.infoBanner}>
      <Text style={styles.infoBannerText}>
        READY FOR DRIVER ASSIGNMENT
      </Text>
    </View>
  )}

  {/* =========================
      DELIVERY STATES
  ========================= */}

  {order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'assigned_to_deliverer' && (
    <View style={styles.infoBanner}>
      <Text style={styles.infoBannerText}>
        DRIVER ASSIGNED
      </Text>
    </View>
  )}

  {order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'picked_up' && (
    <View style={styles.infoBanner}>
      <Text style={styles.infoBannerText}>
        PACKAGE PICKED UP
      </Text>
    </View>
  )}

  {order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'out_for_delivery' && (
    <View style={styles.infoBanner}>
      <Text style={styles.infoBannerText}>
        OUT FOR DELIVERY
      </Text>
    </View>
  )}

{order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'refund_approved' && (
  <View style={styles.refundActionBox}>
    <Text style={styles.inputLabelFieldTitle}>
      REFUND APPROVED
    </Text>

    <Text style={styles.refundReasonText}>
      Waiting for driver to collect item and return money.
    </Text>
  </View>
)}
  {/* =========================
      CANCELLATIONS
  ========================= */}
{order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'refund_requested' && (
  <View style={styles.refundActionBox}>

    <Text style={styles.inputLabelFieldTitle}>
      REFUND REQUEST RECEIVED
    </Text>

    <Text style={styles.refundReasonText}>
      {order.refundReason || 'No reason provided'}
    </Text>


    <View style={styles.actionButtonSplitRow}>
      <TouchableOpacity
        style={styles.rejectBtn}
        onPress={openRefundRejectModal}
      >
        <Text style={styles.rejectBtnText}>
          REJECT REFUND
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.confirmBtn}
        onPress={approveRefund}
      >
        <Text style={styles.confirmBtnText}>
          APPROVE REFUND
        </Text>
      </TouchableOpacity>
    </View>

  </View>
)}

  {[
    'rejected',
    'cancelled_by_user',
    'cancelled_by_packager',
    'cancelled_by_deliverer'
  ].includes(order.status) && (
    <View style={styles.rejectionReasonSummaryBox}>
      <Text style={styles.rejectionSummaryTitleLabel}>
        CANCELLATION LOG
      </Text>

      <Text style={styles.rejectionSummaryBodyText}>
        {order.rejectionReason || 'No reason provided'}
      </Text>
    </View>
  )}

  {/* =========================
      DELIVERED
  ========================= */}
{order?.status === 'pending' && (
  <TouchableOpacity
    style={{
      backgroundColor: '#DC2626',
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 10,
      alignItems: 'center',
    }}
    onPress={() => {
      setReasonType('reject');
      setReasonText('');
      setReasonModalVisible(true);
    }}
  >
    <Text
      style={{
        color: '#FFF',
        fontWeight: '800',
      }}
    >
      REJECT ORDER
    </Text>
  </TouchableOpacity>
)}

  {order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'delivered' && (
    <View style={styles.deliveryCompletedBanner}>
      <Ionicons
        name="checkmark-circle"
        size={18}
        color="#22C55E"
      />

      <Text style={styles.deliveryCompletedText}>
        DELIVERY COMPLETED
      </Text>
    </View>
  )}

</View>


        {/* 🎯 TOTALS FOOTER ROW INDICATOR CELL */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL ACCOUNT PAID</Text>
          <Text style={styles.totalValue}>
            AFN {(Number(order?.totalAmount) || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* 🎯 FINANCIAL RECAP STATEMENT CARD ELEMENT */}
      {(() => {
        const derivedSubtotal = Array.isArray(order?.items)
          ? order.items.reduce((sum: number, it: any) => sum + (parseFloat(it.price || '0') * (Number(it.quantity) || 1)), 0)
          : 0;

        const markdownDiscount = parseFloat(order?.discount || order?.discountAmount || '0');
        const parsedShippingFreight = parseFloat(order?.shippingFee || '0');

        return (
          <View style={[styles.card, { marginTop: 0, marginBottom: 40 }]}>
            <Text style={styles.sectionTitle}>FINANCIAL RECAP STATEMENT</Text>

            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>Items Subtotal</Text>
              <Text style={styles.recapVal}>AFN {Math.round(derivedSubtotal).toLocaleString()}</Text>
            </View>

            {markdownDiscount > 0 && (
              <View style={styles.recapRow}>
                <Text style={[styles.recapLabel, { color: '#FF3B30' }]}>Promo Discount</Text>
                <Text style={[styles.recapVal, { color: '#FF3B30' }]}>
                  - AFN {Math.round(markdownDiscount).toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>Logistics Shipping Fee</Text>
              <Text style={styles.recapVal}>AFN {Math.round(parsedShippingFreight).toLocaleString()}</Text>
            </View>

            {/* Display rejection reason if the order has been previously rejected */}
            {order.status === 'refunded'
  ? 'REFUND OPERATION'
  : order.status.replaceAll('_', ' ').toUpperCase() === 'rejected' && (order.rejectionReason || order.reason) && (
              <View style={styles.rejectionReasonSummaryBox}>
                <Text style={styles.rejectionSummaryTitleLabel}>CANCELLATION STATEMENT LOG:</Text>
                <Text style={styles.rejectionSummaryBodyText}>{order.rejectionReason || order.reason}</Text>
              </View>
            )}

            <View style={{ height: 0.5, backgroundColor: '#EFEFEF', marginVertical: 10 }} />

            <View style={styles.recapRow}>
              <Text style={[styles.recapLabel, { fontWeight: '900', color: '#000000' }]}>Grand Total Paid Balance</Text>
              <Text style={[styles.recapVal, { fontWeight: '900', color: '#000000' }]}>
                AFN {Math.round(parseFloat(order?.totalAmount || '0')).toLocaleString()}
              </Text>
            </View>
          </View>
        );
      })()}


    </ScrollView>
   {modalVisible && (
  <View style={styles.globalModalOverlay}>
    
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ width: '100%', alignItems: 'center' }}
    >
      
      <Pressable
        style={styles.modalBackdrop}
        onPress={closeModal}
      />

      <View style={styles.globalModalCard}>

        <Text style={styles.modalTitle}>
          {modalType === 'order_reject'
            ? 'ORDER REJECTION REASON'
            : 'REFUND REJECTION REASON'}
        </Text>

        <TextInput
          style={styles.modalInput}
          placeholder="Enter reason..."
          value={rejectionReason}
          onChangeText={setRejectionReason}
          multiline
        />

        <TouchableOpacity
          style={styles.confirmBtn}
          disabled={statusSubmitting}
          onPress={async () => {

            if (modalType === 'order_reject') {
              await updateStatus('rejected');
            }

            if (modalType === 'refund_reject') {
              await rejectRefund();
            }

            setRejectionReason('');
            closeModal();
          }}
        >
          <Text style={styles.confirmBtnText}>
            CONFIRM
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={closeModal}>
          <Text style={{ textAlign: 'center', marginTop: 12, color: '#666' }}>
            Cancel
          </Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  </View>
)}

<Modal
  visible={reasonModalVisible}
  transparent
  animationType="fade"
  statusBarTranslucent
>
  <KeyboardAvoidingView
    style={styles.modalOverlay}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <Pressable
      style={styles.modalBackdrop}
      onPress={() => setReasonModalVisible(false)}
    />

    <View style={styles.reasonModalCard}>
      <View style={styles.modalHandle} />

      <Text style={styles.reasonModalTitle}>
        {reasonType === 'refund'
          ? 'Reject Refund Request'
          : 'Reject Order'}
      </Text>

      <Text style={styles.reasonModalSubtitle}>
        Please provide a reason that will be visible
        to the customer.
      </Text>

      <TextInput
        value={reasonText}
        onChangeText={setReasonText}
        multiline
        textAlignVertical="top"
        placeholder={
          reasonType === 'refund'
            ? 'Explain why the refund is being rejected...'
            : 'Explain why the order is being rejected...'
        }
        placeholderTextColor="#9CA3AF"
        style={styles.reasonModalInput}
      />

      <View style={styles.reasonModalActions}>
        <TouchableOpacity
          style={styles.cancelModalBtn}
          onPress={() => {
            setReasonModalVisible(false);
            setReasonText('');
          }}
        >
          <Text style={styles.cancelModalBtnText}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitModalBtn}
          onPress={handleReasonSubmit}
          disabled={statusSubmitting}
        >
          {statusSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitModalBtnText}>
              Submit
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </KeyboardAvoidingView>
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
    backgroundColor: '#F7F7F8',
  },
infoBanner: {
  backgroundColor: '#F6F7FB',
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
  marginTop: 10,
},

infoBannerText: {
  fontSize: 12,
  fontWeight: '800',
  color: '#555',
  letterSpacing: 0.6,
},

deliveryCompletedBanner: {
  backgroundColor: '#ECFDF3',
  borderWidth: 1,
  borderColor: '#22C55E',
  borderRadius: 12,
  paddingVertical: 14,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
},

modalTitle: {
  fontSize: 14,
  fontWeight: '900',
  letterSpacing: 1,
  marginBottom: 12,
  color: '#111',
},

deliveryCompletedText: {
  color: '#22C55E',
  fontWeight: '900',
  fontSize: 12,
},
  errorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#999999',
    letterSpacing: 0.8,
  },

  modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},

reasonModalCard: {
  width: '92%',
  backgroundColor: '#FFFFFF',
  borderRadius: 24,

  paddingHorizontal: 20,
  paddingTop: 18,
  paddingBottom: 20,

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 10,
  },
  shadowOpacity: 0.15,
  shadowRadius: 20,

  elevation: 20,

  zIndex: 5,
},

modalHandle: {
  width: 50,
  height: 5,
  borderRadius: 999,
  backgroundColor: '#E5E7EB',
  alignSelf: 'center',
  marginBottom: 18,
},

reasonModalTitle: {
  fontSize: 20,
  fontWeight: '900',
  color: '#111827',
},

reasonModalSubtitle: {
  fontSize: 13,
  color: '#6B7280',
  marginTop: 6,
  marginBottom: 16,
  lineHeight: 20,
},

reasonModalInput: {
  minHeight: 140,

  backgroundColor: '#F9FAFB',

  borderWidth: 1,
  borderColor: '#E5E7EB',

  borderRadius: 16,

  paddingHorizontal: 14,
  paddingVertical: 14,

  fontSize: 14,
  color: '#111827',

  marginBottom: 18,
},

reasonModalActions: {
  flexDirection: 'row',
  gap: 12,
},

cancelModalBtn: {
  flex: 1,
  height: 52,

  borderRadius: 14,

  backgroundColor: '#F3F4F6',

  justifyContent: 'center',
  alignItems: 'center',
},

cancelModalBtnText: {
  color: '#374151',
  fontWeight: '700',
  fontSize: 14,
},

submitModalBtn: {
  flex: 1,
  height: 52,

  borderRadius: 14,

  backgroundColor: '#DC2626',

  justifyContent: 'center',
  alignItems: 'center',
},

submitModalBtnText: {
  color: '#FFFFFF',
  fontWeight: '800',
  fontSize: 14,
},
  // =========================
  // HEADER CARD
  // =========================
  card: {
    backgroundColor: '#FFFFFF',

    paddingHorizontal: 20,
    paddingVertical: 22,

    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },

  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refundActionBox: {
  marginTop: 12,
  padding: 14,
  borderRadius: 12,
  backgroundColor: '#FFF7ED',
  borderWidth: 1,
  borderColor: '#FED7AA',
},

refundReasonText: {
  fontSize: 13,
  color: '#92400E',
  marginVertical: 8,
  fontWeight: '500',
},

rejectionReasonInputField: {
  backgroundColor: '#F9FAFB',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 10,
  padding: 10,
  fontSize: 13,
  marginTop: 8,
},

rejectBtn: {
  flex: 1,
  backgroundColor: '#FFF1F2',
  borderWidth: 1,
  borderColor: '#FF3B30',
  padding: 10,
  borderRadius: 10,
  alignItems: 'center',
},

confirmBtn: {
  flex: 1,
  backgroundColor: '#16A34A',
  padding: 10,
  borderRadius: 10,
  alignItems: 'center',
  marginLeft: 8,
},

rejectBtnText: {
  color: '#FF3B30',
  fontWeight: '700',
  fontSize: 12,
},
modalBackdrop: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0,0,0,0.6)',
},
confirmBtnText: {
  color: '#FFFFFF',
  fontWeight: '700',
  fontSize: 12,
},

  inlineBackBtn: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: '#F7F7F8',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 14,
  },

  statusTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -0.3,
  },

  meta: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // =========================
  // MAP
  // =========================
  mapContainer: {
    width: '100%',
    height: 320,

    backgroundColor: '#F5F5F5',

    overflow: 'hidden',

    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,

    elevation: 4,
  },

  // =========================
  // SECTIONS
  // =========================
  sectionCard: {
    backgroundColor: '#FFFFFF',

    marginHorizontal: 18,
    marginTop: 18,

    padding: 18,

    borderRadius: 18,

    borderWidth: 1,
    borderColor: '#EEEEEE',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.03,
    shadowRadius: 8,

    elevation: 2,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',

    color: '#111111',

    letterSpacing: 1.5,

    marginBottom: 16,
  },

  // =========================
  // ITEMS
  // =========================
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F4',
  },

  thumb: {
    width: 64,
    height: 82,

    borderRadius: 12,

    backgroundColor: '#F1F1F1',

    borderWidth: 1,
    borderColor: '#ECECEC',
  },

  itemName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',

    textTransform: 'uppercase',
  },

  itemMeta: {
    fontSize: 11,
    color: '#777777',
    fontWeight: '600',

    marginTop: 4,
  },

  price: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',

    marginTop: 6,
  },

  attributeValueHighlight: {
    color: '#111111',
    fontWeight: '900',
  },

  // =========================
  // CUSTOMER INFO
  // =========================
  detailText: {
    fontSize: 13,
    lineHeight: 20,

    color: '#444444',

    marginBottom: 10,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: '900',

    color: '#999999',

    letterSpacing: 1,
  },
  adminActionContainerSlot: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  inputLabelFieldTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  actionButtonSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
 
  rejectionReasonSummaryBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF2F2',
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,59,48,0.15)',
  },
  rejectionSummaryTitleLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FF3B30',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  rejectionSummaryBodyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 15,
  },
globalModalOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  alignItems: 'center',
},

globalModalCard: {
  width: '90%',
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
},

modalInput: {
  minHeight: 100,
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 10,
  padding: 10,
  marginVertical: 12,
  textAlignVertical: 'top',
},
  // =========================
  // FINANCIALS
  // =========================
  financialSummaryBlock: {
    width: '100%',
  },

  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingVertical: 8,
  },

  recapLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },

  recapVal: {
    fontSize: 13,
    color: '#111111',
    fontWeight: '800',
  },

  dividerLine: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },

  totalRow: {
    marginTop: 8,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 11,
    fontWeight: '900',

    color: '#999999',

    letterSpacing: 1.2,
  },

  totalValue: {
    fontSize: 24,
    fontWeight: '900',

    color: '#111111',

    letterSpacing: -0.6,
  },

  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 99999,
    elevation: 99999,
  },

  // =========================
  // ACTION BUTTON
  // =========================
  actionRow: {
    marginHorizontal: 18,
    marginTop: 20,
    marginBottom: 35,
  },

 
});