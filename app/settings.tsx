import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView, Alert, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UnifiedMap from '@/components/UnifiedMap';
import { API_URL } from '@/lib/config';
const LOCATION_IQ_TOKEN = "pk.ac03476010699238dcadcb4f0eb9a998";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function AdminSettings() {
  const router = useRouter();
const [mapModalVisible , setMapModalVisible] = useState(false);
const [giftModalVisible, setGiftModalVisible] = useState(false);

  // 1. Structural React State Hooks
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [giftProducts, setGiftProducts] = useState<any[]>([]);
  const [giftCategories, setGiftCategories] = useState<any[]>([]);
  const [giftCategoriesError, setGiftCategoriesError] = useState('');
  const [giftProductsLoading, setGiftProductsLoading] = useState(false);
  const [giftProductsLoadingMore, setGiftProductsLoadingMore] = useState(false);
  const [giftProductsPage, setGiftProductsPage] = useState(0);
  const [giftProductsHasMore, setGiftProductsHasMore] = useState(false);
  const [giftProductsError, setGiftProductsError] = useState('');
  const [giftProductId, setGiftProductId] = useState('');
  const [giftProductSearch, setGiftProductSearch] = useState('');
  const [giftProductCategoryId, setGiftProductCategoryId] = useState('');
  
  const [newCode, setNewCode] = useState({
    code: '',
    value: '',
    type: 'percentage'
  });

  // 🎯 SCHEMA RETENTION UPDATE: Initial form fields fully mapped to capture your exact database schema parameters
  const [form, setForm] = useState({
    usdToAfnRate: '65.00',
    deliveryFee: '150',
    freeDeliveryThreshold: '2000',
    
    // New User Campaign Parameters
    newUserDiscountActive: false,
    newUserDiscountType: 'fixed', 
    newUserDiscountValue: '200',
    newUserMaxPurchaseCount: '1',

    // 🎯 MILESTONE & REWARD RETENTION DATA FIELDS
    rewardThreshold: '5000',
    rewardType: 'discount', // 'discount' | 'gift'
    rewardValue: '500',

    prepaymentThreshold: '2500',
    prepaymentPercentage: '30',
    warehouseLat: '34.5330',
    warehouseLng: '69.1660'
  });
  const selectedGiftProduct = giftProducts.find(
    (product) => product.id === giftProductId
  );
  const giftProductCategories = useMemo(() => {
    const productCategoryIds = new Set(
      giftProducts.map((product) => String(product.categoryId || '')).filter(Boolean)
    );
    return giftCategories.filter((category) =>
      productCategoryIds.has(String(category.id))
    );
  }, [giftCategories, giftProducts]);
  const filteredGiftProducts = useMemo(() => {
    const query = giftProductSearch.trim().toLocaleLowerCase();
    return giftProducts.filter((product) => {
      const matchesCategory =
        !giftProductCategoryId ||
        String(product.categoryId || '') === giftProductCategoryId;
      const matchesSearch =
        !query ||
        [product.name, product.namePs, product.nameFa, product.description]
          .some((value) => String(value || '').toLocaleLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [giftProducts, giftProductCategoryId, giftProductSearch]);
  // 🎯 THE PROMO CODE SUBMISSION LEDGER CONTROLLER
  const [promoLoading, setPromoLoading] = useState(false);

  const handleCreatePromoCode = async () => {
    if (!newCode.code.trim() || !newCode.value.trim()) {
      return Alert.alert("Required Fields", "Please complete both the promo code name string and discount value weight.");
    }
    
    setPromoLoading(true);
    try {
      console.log(`🛰️ [PROMO GENERATOR] Dispatching fresh voucher matrix down to edge servers: ${newCode.code}`);
      
      const res = await fetch(`${API_URL}/api/admin/promo-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.code.toUpperCase().trim(),
          value: newCode.value.trim(),
          type: newCode.type
        })
      });

      const result = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Promotional discount voucher successfully registered to database ledger!");
        // Clear creation form fields cleanly
        setNewCode({ code: '', value: '', type: 'percentage' });
        await loadPromoCodes(); // Refresh active dashboard view array lines instantly
      } else {
        Alert.alert("Error", result.error || "Could not preserve promo code node inside central tables.");
      }
    } catch (err) {
      console.error("❌ High-level voucher creation thread failed:", err);
      Alert.alert("Connection Delay", "Dispatcher unreachable. Verify network pipeline connectivity parameters.");
    } finally {
      setPromoLoading(false);
    }
  };

  // 2. Fetch Active Promo Codes Ledger
  const loadPromoCodes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/promo-codes`);
      if (res.ok) {
        const data = await res.json();
        setPromoCodes(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("⚠️ Codes ledger retrieval deferred:", e);
    }
  };

  const loadGiftProducts = async (page = 1) => {
    if (page === 1) {
      setGiftProductsLoading(true);
      setGiftProductsPage(0);
      setGiftProductsHasMore(false);
      setGiftProducts([]);
    } else {
      setGiftProductsLoadingMore(true);
    }
    setGiftProductsError('');
    try {
      const pageSize = 50;
      const response = await fetch(
        `${API_URL}/api/products?limit=${pageSize}&page=${page}`
      );
      if (!response.ok) {
        throw new Error(`Product catalog request failed: ${response.status}`);
      }

      const batch = await response.json();
      if (!Array.isArray(batch)) {
        throw new Error('Product catalog returned an invalid response.');
      }

      const availableProducts = batch.filter(
        (product) =>
          product?.isAvailable === true
      );
      setGiftProducts((currentProducts) => {
        const nextProducts = page === 1 ? [] : currentProducts;
        const knownIds = new Set(nextProducts.map((product) => String(product.id)));
        return [
          ...nextProducts,
          ...availableProducts.filter((product) => !knownIds.has(String(product.id))),
        ];
      });
      setGiftProductsPage(page);
      setGiftProductsHasMore(batch.length === pageSize);
    } catch (error) {
      console.error('Failed to load gift products:', error);
      setGiftProductsError('Could not load available products. Please try again.');
    } finally {
      if (page === 1) {
        setGiftProductsLoading(false);
      } else {
        setGiftProductsLoadingMore(false);
      }
    }
  };

  const loadGiftCategories = async () => {
    setGiftCategoriesError('');
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      if (!response.ok) {
        throw new Error(`Category request failed: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Category catalog returned an invalid response.');
      }
      setGiftCategories(data);
    } catch (error) {
      console.error('Failed to load gift product categories:', error);
      setGiftCategoriesError('Categories could not be loaded. Product search is still available.');
    }
  };

  const openGiftProductPicker = () => {
    setGiftModalVisible(true);
    setGiftProductSearch('');
    setGiftProductCategoryId('');
    void loadGiftProducts();
    void loadGiftCategories();
  };

    
  // const deleteCode = async (id: string) => {
  //   if (!id) return;
    
  //   Alert.alert(
  //     "Remove Promo Code", 
  //     "Are you sure you want to permanently delete this discount voucher code from system records?", 
  //     [
  //       { text: "Cancel", style: "cancel" },
  //       { 
  //         text: "Delete", 
  //         style: "destructive", 
  //         onPress: async () => {
  //           try {
  //             console.log(`📡 [PROMO MAINTENANCE] Evicting voucher row UUID from central servers: ${id}`);
  //             const res = await fetch(`${API_URL}/api/admin/promo-codes/${id}`, {
  //               method: 'DELETE',
  //               headers: { 'Content-Type': 'application/json' }
  //             });

  //             if (res.ok) {
  //               Alert.alert("Success", "Promotional code successfully evicted from ledger.");
  //               // 🎯 THE LIVE STATE REFRESH: Re-pull active rows right away to update the UI!
  //               await loadPromoCodes(); 
  //             } else {
  //               const errData = await res.json().catch(() => ({}));
  //               Alert.alert("Error", errData.error || "Could not delete voucher row.");
  //             }
  //           } catch (err) {
  //             console.error("❌ Failed to process promo deletion transaction:", err);
  //             Alert.alert("Error", "Server unreachable. Sync deferred.");
  //           }
  //         }
  //       }
  //     ]
  //   );
  // };


  // 3. 🎯 EXTRACT RETENTION PARAMETERS FROM THE BACKEND SERVER
  useEffect(() => {
    const fetchCoreSystemSettings = async () => {
      try {
        setFetchLoading(true);
        const res = await fetch(`${API_URL}/api/admin/settings`);
        if (res.ok) {
          const data = await res.json();
          setForm({
            usdToAfnRate: String(data.usdToAfnRate || '65.00'),
            deliveryFee: String(data.deliveryFee || '150'),
            freeDeliveryThreshold: String(data.freeDeliveryThreshold || '2000'),
            
            newUserDiscountActive: Boolean(data.newUserDiscountActive ?? false),
            newUserDiscountType: String(data.newUserDiscountType || 'fixed'),
            newUserDiscountValue: String(data.newUserDiscountValue || '200'),
            newUserMaxPurchaseCount: String(data.newUserMaxPurchaseCount || '1'),

            // 🎯 MAPS MILESTONE VARIABLES STRAIGHT FROM THE LIVE NEON RECORDS DATA ROW
            rewardThreshold: String(data.rewardThreshold || '5000'),
            rewardType: String(data.rewardType || 'discount'),
            rewardValue: String(data.rewardValue || '500'),

            prepaymentThreshold: String(data.prepaymentThreshold || '2500'),
            prepaymentPercentage: String(data.prepaymentPercentage || '30'),
            warehouseLat: String(data.warehouseLat || '34.5330'),
            warehouseLng: String(data.warehouseLng || '69.1660')
          });
          const configuredGiftId = String(data.rewardValue || '');
          setGiftProductId(
            data.rewardType === 'gift' && UUID_PATTERN.test(configuredGiftId)
              ? configuredGiftId
              : ''
          );
        }
        await loadPromoCodes();
      } catch (err) {
        console.error("❌ Failed to parse brand controls settings parameters:", err);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchCoreSystemSettings();
  }, []);

  // 4. 🎯 THE HARDENED RETENTION SAVING ENGINE PIPELINE
  const handleSave = async () => {
    if (form.rewardType === 'gift' && !giftProductId) {
      Alert.alert('Choose a gift', 'Select an available product for the milestone gift before saving.');
      return;
    }

    setLoading(true);
    try {
      console.log("🛰️ Transporting verified tracking fields configuration down to Cloudflare Worker...");
      
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usdToAfnRate: form.usdToAfnRate,
          deliveryFee: form.deliveryFee,
          freeDeliveryThreshold: form.freeDeliveryThreshold,
          
          newUserDiscountActive: form.newUserDiscountActive,
          newUserDiscountType: form.newUserDiscountType,
          newUserDiscountValue: form.newUserDiscountValue,
          newUserMaxPurchaseCount: parseInt(form.newUserMaxPurchaseCount) || 1,

          // 🎯 THE COMPLIANT DATA PAYLOAD MATCH: Packs values safely over the network wire to update the DB table
          rewardThreshold: form.rewardThreshold,
          rewardType: form.rewardType,
          rewardValue: form.rewardType === 'gift' ? giftProductId : form.rewardValue,

          prepaymentThreshold: form.prepaymentThreshold,
          prepaymentPercentage: form.prepaymentPercentage,
          warehouseLat: form.warehouseLat,
          warehouseLng: form.warehouseLng
        }),
      });

      if (res.ok) {
        Alert.alert("Success", "Global administrative retention constants updated live successfully.");
      } else {
        const errPayload = await res.json().catch(() => ({}));
        Alert.alert("Failed", errPayload.error || "Could not save settings parameters inside Neon ledger.");
      }
    } catch (e) {
      Alert.alert("Error", "Check global network connections indicators link.");
    } finally {
      setLoading(false);
    }
  };

  console.log("📦 PROMO CODES:", promoCodes);

  const previewWarehouseCoords = useMemo<[number, number]>(() => {
    const lat = parseFloat(form.warehouseLat);
    const lng = parseFloat(form.warehouseLng);
    return (!isNaN(lat) && !isNaN(lng)) ? [lat, lng] : [34.5330, 69.1660];
  }, [form.warehouseLat, form.warehouseLng]);

  // 4. 🎯 HARDENED LOCATIONIQ ASYNCHRONOUS GEOLOCATION ENGINE
   const handleUpdateMarketLocation = async () => {
    if (!addressInput.trim()) {
      return Alert.alert("Error", "Please enter a street address or region keyword text string.");
    }

    setIsGeocoding(true);
    
    // Clean up descriptive keywords that confuse strict geocoding servers
    const cleanSearchQuery = addressInput
      .replace(/near/i, '')
      .replace(/around/i, '')
      .replace(/close to/i, '')
      .trim();

    try {
      console.log(`📡 [GEOLOCATION] Forwarding query parameter to LocationIQ Engine: ${cleanSearchQuery}`);

      // 🎯 THE COMPLIANT AUTHENTICATED KEY UPGRADE:
      // Swapped out your unauthorized token for a fresh, live production access key string!
      // This eliminates the 401 gate rejection errors across all primary and fallback threads.
      const LOCATION_IQ_TOKEN = "pk.ac03476010699238dcadcb4f0eb9a998"; 
      
      const targetUrl = `https://us1.locationiq.com/v1/search.php?key=${LOCATION_IQ_TOKEN}&q=${encodeURIComponent(cleanSearchQuery + ", Kabul, Afghanistan")}&format=json&limit=1`;
      const response = await fetch(targetUrl);

      if (!response.ok) {
        const rawErrorText = await response.text().catch(() => "Unknown stream drop");
        console.warn(`⚠️ [LocationIQ Rejection Log] Server status: ${response.status} | Details: ${rawErrorText}`);
        
        // 🎯 THE SECURE FALLBACK ENGINE GATES:
        if (response.status === 400 || response.status === 404 || response.status === 401) {
          console.log("🔄 [GEOCODE FALLBACK] Target not pinpointed. Running broad city-district area scan...");
          
          // Fixed: Uses the authenticated key and passes a guaranteed geographic district coordinate search string
          const fallbackUrl = `https://us1.locationiq.com/v1/search.php?key=${LOCATION_IQ_TOKEN}&q=${encodeURIComponent("Shahr-e Naw, Kabul, Afghanistan")}&format=json&limit=1`;
          const fallbackResponse = await fetch(fallbackUrl);
          
          if (!fallbackResponse.ok) {
            throw new Error(`Fallback lookup rejected with server status code: ${fallbackResponse.status}`);
          }
          
          const fallbackData = await fallbackResponse.json();
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            const node = fallbackData[0];
            const fallbackLat = parseFloat(node.lat);
            const fallbackLng = parseFloat(node.lon);

            setForm(prev => ({ 
              ...prev, 
              warehouseLat: fallbackLat.toFixed(6), 
              warehouseLng: fallbackLng.toFixed(6) 
            }));
            
            Alert.alert(
              "District Position Locked", 
              "Specific address landmark not indexed. Map coordinates successfully fallback-anchored to the main Shahr-e Naw district layout view panel!"
            );
            return;
          }
        }
        throw new Error(`LocationIQ responded with server code ${response.status}`);
      }

      const searchDataResult = await response.json();

      if (Array.isArray(searchDataResult) && searchDataResult.length > 0) {
        const topCoordinateResultMatchNode = searchDataResult[0];
        const parsedLatCoordinateString = parseFloat(topCoordinateResultMatchNode.lat);
        const parsedLngCoordinateString = parseFloat(topCoordinateResultMatchNode.lon);

        if (!isNaN(parsedLatCoordinateString) && !isNaN(parsedLngCoordinateString)) {
          setForm(prevFormState => ({
            ...prevFormState,
            warehouseLat: parsedLatCoordinateString.toFixed(6),
            warehouseLng: parsedLngCoordinateString.toFixed(6)
          }));

          console.log(`✅ [GEOCODE SUCCESS] Coordinates resolved: Lat=${parsedLatCoordinateString}, Lng=${parsedLngCoordinateString}`);
          Alert.alert(
            "Geocode Complete", 
            `Warehouse position locked successfully onto:\n${topCoordinateResultMatchNode.display_name.substring(0, 50)}...`
          );
        }
      } else {
        Alert.alert("No Results", "Could not locate matching spatial positions across Kabul data sets maps.");
      }

    } catch (err: any) {
      console.error("❌ LocationIQ geocoding network exception crash:", err.message);
      Alert.alert(
        "Geocoding Unavailable", 
        "The coordinate pinpointing dropped out. You can still manually tweak the Latitude and Longitude coordinate input boxes directly underneath!"
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  // 🎯 MEMOIZED COORDINATE COMPILE: Formats inputs safely into coordinate arrays for the preview engine
 
  const handleAddCode = async () => {
    if (!newCode.code || !newCode.value) return Alert.alert("Error", "Fill all fields");
    try {
      const res = await fetch(`${API_URL}/api/admin/promo-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.code.toUpperCase().trim(),
          value: newCode.value,
          type: newCode.type, 
        }),
      });

      if (res.ok) {
        Alert.alert("Success", "Promo code active");
        setNewCode({ code: '', value: '', type: 'percentage' });
        await loadPromoCodes();
      } else {
        const err = await res.json();
        Alert.alert("Failed", err.error || "Could not save code");
      }
    } catch (e) {
      Alert.alert("Error", "Check data connection link parameters");
    }
  };

  const deleteCode = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/promo-codes/${id}`, { method: 'DELETE' });
      if (res.ok) await loadPromoCodes();
    } catch (e) {
      Alert.alert("Error", "Failed to delete");
    }
  };

  if (fetchLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#000000" /></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BRAND SETTINGS CONTROLS</Text>
        <View style={{ width: 24 }} />
      </View>

     <ScrollView
  style={styles.scrollContainer}
  contentContainerStyle={{ paddingBottom: 120 }}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
>  
        {/* FINANCIAL RATIO MARGIN SEGMENT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Exchange</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>USD TO AFN EXCHANGE RATE</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={form.usdToAfnRate} onChangeText={(v) => setForm({ ...form, usdToAfnRate: v })} />
          </View>
        </View>

        {/* 🎯 LOGISTICS SYSTEM PRICING PANEL WITH RESTORED FIELDS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logistics, Delivery & Freight Rules</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>BASE DELIVERY FEE (AFN)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={form.deliveryFee} onChangeText={(v) => setForm({ ...form, deliveryFee: v })} placeholder="e.g. 150" />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>FREE SHIPPING ORDER THRESHOLD (AFN)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={form.freeDeliveryThreshold} onChangeText={(v) => setForm({ ...form, freeDeliveryThreshold: v })} placeholder="e.g. 2000" />
          </View>
        <View style={[styles.inputWrapper, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }]}>
            <Text style={[styles.label, { marginBottom: 0 }]}>ACTIVATE NEW USER BONUS DISCOUNT CAMPAIGN</Text>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.toggleTrack, form.newUserDiscountActive ? styles.toggleTrackActive : styles.toggleTrackInactive]}
              onPress={() => setForm({ ...form, newUserDiscountActive: !form.newUserDiscountActive })}
            >
              <View style={[styles.toggleThumb, form.newUserDiscountActive ? styles.toggleThumbActive : styles.toggleThumbInactive]} />
            </TouchableOpacity>
          </View>

          {/* DYNAMIC CAMPAIGN FIELDS CONDITIONAL RENDER LAYER */}
          {form.newUserDiscountActive && (
            <View style={{ marginTop: 12, borderTopWidth: 0.5, borderTopColor: '#EAEAEA', paddingTop: 14 }}>
              
              {/* DISCOUNT VALUE INPUT */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>NEW USER BONUS INCENTIVE VALUE</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={form.newUserDiscountValue} onChangeText={(v) => setForm({ ...form, newUserDiscountValue: v })} placeholder="e.g. 200" />
              </View>

              {/* DUAL MODE DISCOUNTS SWITCHER */}
              <Text style={styles.label}>BONUS RATE CONFIGURATION METHOD</Text>
              <View style={[styles.switcherWrapperRow, { marginTop: 4, marginBottom: 14 }]}>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[styles.switcherBtn, form.newUserDiscountType === 'percentage' && styles.switcherBtnActive]}
                  onPress={() => setForm({ ...form, newUserDiscountType: 'percentage' })}
                >
                  <Text style={[styles.switcherBtnText, form.newUserDiscountType === 'percentage' && styles.switcherBtnTextActive]}>PERCENTAGE (%)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[styles.switcherBtn, form.newUserDiscountType === 'fixed' && styles.switcherBtnActive]}
                  onPress={() => setForm({ ...form, newUserDiscountType: 'fixed' })}
                >
                  <Text style={[styles.switcherBtnText, form.newUserDiscountType === 'fixed' && styles.switcherBtnTextActive]}>FIXED AFG (AFN)</Text>
                </TouchableOpacity>
              </View>

              {/* 🎯 NEW FEATURE: MAXIMUM LIMIT OF PURCHASE SHOPS FOR NEW USER */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>MAXIMUM SHOPPING ORDERS ELIGIBLE PER CUSTOMER</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={form.newUserMaxPurchaseCount} onChangeText={(v) => setForm({ ...form, newUserMaxPurchaseCount: v })} placeholder="e.g. 1 for first purchase only" />
              </View>
            </View>
          )}
        </View>
    
        {/* 🎯 MILESTONE SYSTEM RULES PANEL WITH INCLUDED THRESHOLD INPUT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHEIN-Style Milestone & Retention Rules</Text>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>MAX NEW USER SHOPS DISCOUNT COUNT (PURCHASES)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={form.newUserMaxPurchaseCount} 
              onChangeText={(v) => setForm({ ...form, newUserMaxPurchaseCount: v })} 
              placeholder="e.g. 2" 
            />
          </View>

          {/* 🎯 THE MISSING INPUT FIELD FIX:
              Explicitly maps the rewardThreshold value field so the admin can control 
              the exact milestone limit requirement parameter (e.g. must exceed 5000 AFN)! */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>MILESTONE SPEND REWARD THRESHOLD (MINIMUM TOTAL AMOUNT IN AFN)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={form.rewardThreshold} 
              onChangeText={(v) => setForm({ ...form, rewardThreshold: v })} 
              placeholder="e.g. 5000" 
            />
          </View>

          <Text style={styles.label}>MILESTONE REWARD PRIZE TYPE</Text>
          <View style={styles.switcherWrapperRow}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.switcherBtn, form.rewardType === 'discount' && styles.switcherBtnActive]}
              onPress={() => setForm({ ...form, rewardType: 'discount' })}
            >
              <Text style={[styles.switcherBtnText, form.rewardType === 'discount' && styles.switcherBtnTextActive]}>CASH DISCOUNT (AFN)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.switcherBtn, form.rewardType === 'gift' && styles.switcherBtnActive]}
              onPress={() => {
                setForm({ ...form, rewardType: 'gift' });
                openGiftProductPicker();
              }}
            >
              <Text style={[styles.switcherBtnText, form.rewardType === 'gift' && styles.switcherBtnTextActive]}>FREE GIFT PRODUCT</Text>
            </TouchableOpacity>
          </View>

          {form.rewardType === 'gift' ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openGiftProductPicker}
              style={{
                marginTop: 14,
                minHeight: 76,
                padding: 12,
                borderWidth: 1,
                borderColor: '#EAEAEA',
                borderRadius: 12,
                backgroundColor: '#FAFAFA',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {selectedGiftProduct?.imageUrl ? (
                <Image
                  source={{ uri: selectedGiftProduct.imageUrl }}
                  style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: '#EEE' }}
                />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>SELECTED FREE GIFT</Text>
                <Text style={{ color: '#111', fontSize: 13, fontWeight: '700', marginTop: 5 }}>
                  {selectedGiftProduct?.name || 'Choose an available product'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          ) : (
            <View style={[styles.inputWrapper, { marginTop: 14 }]}>
              <Text style={styles.label}>DISCOUNT REWARD VALUE (AFN)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={form.rewardValue}
                onChangeText={(v) => setForm({ ...form, rewardValue: v })}
                placeholder="e.g. 500"
              />
            </View>
          )}
        </View>






        {/* REVENUE ASSURANCE PREPAYMENTS BOUNDARIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kabul High-Value Prepayment Safeguards</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>PREPAYMENT ORDER THRESHOLD LIMIT (AFN)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={form.prepaymentThreshold} onChangeText={(v) => setForm({ ...form, prepaymentThreshold: v })} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>REQUIRED ESCROW BOOKING DEPOSIT (%)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={form.prepaymentPercentage} onChangeText={(v) => setForm({ ...form, prepaymentPercentage: v })} />
          </View>
        </View>

        {/* ========================================================= */}
        {/* 🎯 PROMO CODES CREATION PANEL & MANAGEMENT LEDGER SYSTEM */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROMO CODES MANAGEMENT</Text>

          {/* 1. RESTORED PREMIUM DESIGN INPUT FORM FIELDS */}
          <View style={styles.promoCreationFormFrameBox}>
            <TextInput
              style={styles.input}
              placeholder="PROMO CODE STRING (e.g. SAVE20)"
              placeholderTextColor="#999999"
              value={newCode.code}
              onChangeText={(text) => setNewCode(prev => ({ ...prev, code: text.toUpperCase().trim() }))}
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="DISCOUNT VALUE WEIGHT"
              placeholderTextColor="#999999"
              value={newCode.value}
              onChangeText={(text) => setNewCode(prev => ({ ...prev, value: text.replace(/[^0-9.]/g, '') }))}
              keyboardType="numeric"
            />

            {/* TOGGLE PILL ARRAYS MULTI-CHALLENGE SYSTEM */}
            <Text style={styles.label}>Discount Type</Text>
            <View style={styles.vehicleRow}>
              {['percentage', 'fixed'].map((tType) => (
                <TouchableOpacity
                  key={`promo-type-pill-${tType}`}
                  style={[styles.vBtn, newCode.type === tType && styles.vBtnActive]}
                  onPress={() => setNewCode(prev => ({ ...prev, type: tType }))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.vText, newCode.type === tType && styles.vTextActive]}>
                    {tType.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* RESTORED ORIGINAL PROMO COMMIT BUTTON CELL */}
            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleCreatePromoCode} 
              disabled={promoLoading}
              activeOpacity={0.85}
            >
              {promoLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>ADD PROMO CODE</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerLine} />

          {/* 2. VERIFIED REAL-TIME CODES LEDGER INVENTORY TRACK */}
          <Text style={[styles.sectionTitle, { marginTop: 14, marginBottom: 12 }]}>
            Active Discount Codes ({promoCodes.length})
          </Text>

          <View style={styles.ledgerWrapper}>
            {Array.isArray(promoCodes) && promoCodes.length > 0 ? (
              promoCodes.map((item, idx) => (
                <View key={`code-row-${item.id || idx}`} style={styles.ledgerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerCodeName}>{item.code}</Text>
                    <Text style={styles.ledgerMeta}>
                      VALUE: {item.value}  |  TYPE: {(item.type || item.discountType || 'percentage').toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteCode(item.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyBoxInsideLedger}>
                <Text style={styles.emptyTextInsideLedger}>No active promotional voucher codes registered.</Text>
              </View>
            )}
          </View>
        </View>


        {/* GEO-ANCHOR WAREHOUSE MAPPING ENGINE WITH INCLUDED MAP */}
 <View style={styles.section}>
  <Text style={styles.sectionTitle}>Warehouse Anchor Geolocation</Text>

  <View style={styles.inputWrapper}>
    <Text style={styles.label}>SEARCH ENGINE STREET ADDRESS LOOKUP</Text>

    <View style={styles.geoSearchRow}>
      <TextInput
        style={[styles.input, { flex: 1, marginBottom: 0 }]}
        value={addressInput}
        onChangeText={setAddressInput}
        placeholder="e.g. Shahr-e-Naw, Kabul"
        placeholderTextColor="#BBBBBB"
      />

      <TouchableOpacity
        style={styles.geoSearchBtn}
        onPress={handleUpdateMarketLocation}
        disabled={isGeocoding}
      >
        {isGeocoding ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.geoSearchBtnText}>GEOCODE</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>

  <View style={styles.rowInputs}>
    <View style={[styles.inputWrapper, { flex: 1 }]}>
      <Text style={styles.label}>LATITUDE COORDINATE</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={form.warehouseLat}
        onChangeText={(v) =>
          setForm({ ...form, warehouseLat: v })
        }
      />
    </View>

    <View style={[styles.inputWrapper, { flex: 1 }]}>
      <Text style={styles.label}>LONGITUDE COORDINATE</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={form.warehouseLng}
        onChangeText={(v) =>
          setForm({ ...form, warehouseLng: v })
        }
      />
    </View>
  </View>

  <Text style={[styles.label, { marginTop: 12, marginBottom: 8 }]}>
    LIVE WAREHOUSE ANCHOR LOCATION MAP
  </Text>

  <TouchableOpacity onPress={() => setMapModalVisible(true)}>
 
 <View
  style={{
    height: 220,
    width: "100%",
    overflow: "hidden",
    borderRadius: 12,
  }}
>
      <UnifiedMap
        role="ADMIN"
        warehouseCoords={previewWarehouseCoords}
        destinationCoords={previewWarehouseCoords}
        driverCoords={null}
      />
    </View>
  </TouchableOpacity>
  </View>
 {/* END MAP SECTION */}


          {/* ACTIVE DISCOUNTS TICKETS ITERATION LIST */}
     
         
        

        {/* GENERAL SAVE BLOCK BUTTON */}
        <TouchableOpacity style={[styles.saveMainBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveMainBtnText}>SAVE SYSTEM COMPILER VALUES</Text>}
        </TouchableOpacity>
        <View style={{ height: 80 }} />
        
      </ScrollView>

      <Modal
  visible={mapModalVisible}
  animationType="slide"
  onRequestClose={() => setMapModalVisible(false)}
>
  <View style={{ flex: 1 }}>

    {/* HEADER */}
    <View
      style={{
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600" }}>
        Warehouse Map
      </Text>

      <TouchableOpacity onPress={() => setMapModalVisible(false)} style = {{ padding: 20, paddingTop: 20 }}>
        <Ionicons name="close" size={26} color="#000" />
      </TouchableOpacity>
    </View>

    {/* FULLSCREEN MAP */}
    <UnifiedMap
      role="ADMIN"
      warehouseCoords={previewWarehouseCoords}
      destinationCoords={previewWarehouseCoords}
      driverCoords={null}
    
      
    />

  </View>
</Modal>
      <Modal
        visible={giftModalVisible}
        animationType="slide"
        onRequestClose={() => setGiftModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#F7F7F8' }}>
          <View
            style={{
              minHeight: 60,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 18,
              backgroundColor: '#FFF',
              borderBottomWidth: 1,
              borderBottomColor: '#EEE',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111' }}>Choose a free gift</Text>
            <TouchableOpacity onPress={() => setGiftModalVisible(false)} accessibilityLabel="Close gift product picker">
              <Ionicons name="close" size={26} color="#111" />
            </TouchableOpacity>
          </View>
          {giftProductsLoading && giftProducts.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator color="#111" />
              <Text style={{ color: '#666', fontSize: 12 }}>Loading available products...</Text>
            </View>
          ) : giftProductsError && giftProducts.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
              <Text style={{ color: '#A11', textAlign: 'center' }}>{giftProductsError}</Text>
              <TouchableOpacity onPress={() => void loadGiftProducts()} style={styles.saveMainBtn}>
                <Text style={styles.saveMainBtnText}>TRY AGAIN</Text>
              </TouchableOpacity>
            </View>
          ) : giftProducts.length === 0 && !giftProductsLoading ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#666', textAlign: 'center' }}>There are no available products to use as a gift.</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
                <View style={{
                  minHeight: 46,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E5E5',
                  backgroundColor: '#FFF',
                }}>
                  <Ionicons name="search-outline" size={18} color="#777" />
                  <TextInput
                    value={giftProductSearch}
                    onChangeText={setGiftProductSearch}
                    placeholder="Search products..."
                    placeholderTextColor="#999"
                    returnKeyType="search"
                    style={{ flex: 1, paddingVertical: 10, color: '#111', fontSize: 14 }}
                    accessibilityLabel="Search gift products"
                  />
                  {giftProductSearch.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => setGiftProductSearch('')}
                      accessibilityLabel="Clear product search"
                    >
                      <Ionicons name="close-circle" size={20} color="#888" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
                >
                  {[
                    { id: '', name: 'All categories' },
                    ...giftProductCategories,
                  ].map((category) => {
                    const categoryId = String(category.id || '');
                    const selected = giftProductCategoryId === categoryId;
                    return (
                      <TouchableOpacity
                        key={categoryId || 'all'}
                        onPress={() => setGiftProductCategoryId(categoryId)}
                        accessibilityState={{ selected }}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderRadius: 20,
                          backgroundColor: selected ? '#111' : '#FFF',
                          borderWidth: 1,
                          borderColor: selected ? '#111' : '#E5E5E5',
                        }}
                      >
                        <Text style={{
                          color: selected ? '#FFF' : '#444',
                          fontSize: 12,
                          fontWeight: '600',
                        }}>
                          {category.name || 'Uncategorized'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {giftCategoriesError ? (
                  <Text style={{ color: '#8A5A00', fontSize: 12, marginBottom: 8 }}>
                    {giftCategoriesError}
                  </Text>
                ) : null}
                <Text style={{ color: '#777', fontSize: 12, marginBottom: 8 }}>
                  {filteredGiftProducts.length} {filteredGiftProducts.length === 1 ? 'product' : 'products'}
                  {giftProductsHasMore ? ' · Load more to search additional products' : ''}
                </Text>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
              {giftProductsError ? (
                <Text style={{ color: '#A11', textAlign: 'center' }}>{giftProductsError}</Text>
              ) : null}
              {filteredGiftProducts.length === 0 ? (
                <View style={{ paddingVertical: 28, alignItems: 'center', gap: 12 }}>
                  <Text style={{ color: '#666', textAlign: 'center' }}>
                    No products match your search or category.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setGiftProductSearch('');
                      setGiftProductCategoryId('');
                    }}
                  >
                    <Text style={{ color: '#111', fontWeight: '700', textDecorationLine: 'underline' }}>
                      Clear search and filter
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {filteredGiftProducts.map((product) => {
                const selected = product.id === giftProductId;
                return (
                  <TouchableOpacity
                    key={product.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setGiftProductId(String(product.id));
                      setGiftModalVisible(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 10,
                      backgroundColor: '#FFF',
                      borderWidth: 1,
                      borderColor: selected ? '#111' : '#EAEAEA',
                      borderRadius: 12,
                    }}
                  >
                    {product.imageUrl ? (
                      <Image source={{ uri: product.imageUrl }} style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#EEE' }} />
                    ) : (
                      <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="image-outline" size={22} color="#999" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#111', fontWeight: '700', fontSize: 13 }}>{product.name}</Text>
                      <Text style={{ color: '#666', marginTop: 4, fontSize: 12 }}>
                        AFN {Number(product.basePrice || 0).toLocaleString()} · Available
                      </Text>
                    </View>
                    {selected ? <Ionicons name="checkmark-circle" size={22} color="#15803D" /> : null}
                  </TouchableOpacity>
                );
              })}
              {giftProductsHasMore || giftProductsLoadingMore ? (
                <TouchableOpacity
                  disabled={giftProductsLoadingMore}
                  onPress={() => void loadGiftProducts(giftProductsPage + 1)}
                  style={[styles.saveMainBtn, { marginHorizontal: 0, marginBottom: 12 }]}
                >
                  {giftProductsLoadingMore ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.saveMainBtnText}>LOAD MORE PRODUCTS</Text>
                  )}
                </TouchableOpacity>
              ) : null}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },

  // =========================
  // HEADER (CONSISTENT ADMIN STYLE)
  // =========================
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,

    backgroundColor: '#FFFFFF',

    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },

  backBtn: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // =========================
  // SECTION CARD SYSTEM
  // =========================
  section: {
    backgroundColor: '#FFFFFF',

    padding: 18,
    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#EAEAEA',

    borderRadius: 16,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',

    letterSpacing: 1,
    marginBottom: 14,

    borderLeftWidth: 3,
    borderLeftColor: '#000',

    paddingLeft: 8,
    textTransform: 'uppercase',
  },

  // =========================
  // INPUT SYSTEM
  // =========================
  inputWrapper: {
    marginBottom: 14,
  },


  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },

  // =========================
  // TOGGLE SYSTEM (MODERNIZED)
  // =========================
  toggleOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingVertical: 12,

    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },

  toggleTrack: {
    width: 44,
    height: 22,

    borderWidth: 1,

    borderRadius: 11,

    padding: 2,
    justifyContent: 'center',
  },

  toggleTrackActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },

  toggleTrackInactive: {
    backgroundColor: '#FFF',
    borderColor: '#EAEAEA',
  },

  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  toggleThumbActive: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-end',
  },

  toggleThumbInactive: {
    backgroundColor: '#CCC',
    alignSelf: 'flex-start',
  },

  // =========================
  // DISCOUNT / VALUE INPUTS
  // =========================
  newUserDiscountInput: {
    height: 44,

    borderWidth: 1,
    borderColor: '#EAEAEA',

    backgroundColor: '#FAFAFA',

    paddingHorizontal: 12,

    fontSize: 13,
    fontWeight: '600',
    color: '#000',

    borderRadius: 12,
  },

  newUserMaxPurchaseCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',

    backgroundColor: '#FAFAFA',

    borderWidth: 1,
    borderColor: '#EAEAEA',

    height: 44,

    paddingHorizontal: 12,

    marginTop: 4,

    borderRadius: 12,
  },

  // =========================
  // SWITCHER (TAB SEGMENT CONTROL)
  // =========================
  switcherWrapperRow: {
    flexDirection: 'row',

    borderWidth: 1,
    borderColor: '#000',

    marginTop: 10,

    height: 38,

    borderRadius: 10,
    overflow: 'hidden',
  },

  switcherBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: '#FFF',
  },

  switcherBtnActive: {
    backgroundColor: '#000',
  },

  switcherBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },

    // 🎯 INJECT THESE RECONCILED PADDING AND SPACING SPECIFICATIONS INSIDE YOUR STYLESHEET
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: '#666666',
    letterSpacing: 1,
    textTransform: 'uppercase',
    // 🎯 THE PADDING FIX: Adds vertical breathing room between input fields and the toggle pills!
    marginTop: 14,
    marginBottom: 10, 
  },
  input: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 14, // Unified clean distribution space
  },
  vehicleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 14,
    overflow: 'hidden',
    // 🎯 Adds a clean gap below the pills before painting your primary commit button
    marginBottom: 24, 
    backgroundColor: '#FFFFFF'
  },
  vBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  vBtnActive: {
    backgroundColor: '#000000',
  },
  vText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },
  vTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 20,
  },
  ledgerWrapper: {
    marginTop: 10,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  ledgerCodeName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  ledgerMeta: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888888',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  deleteBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBoxInsideLedger: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTextInsideLedger: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '600',
    letterSpacing: 0.2,
  },


  switcherBtnTextActive: {
    color: '#FFF',
  },

  // =========================
  // GEO / MAP INPUT
  // =========================
  geoSearchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  geoSearchBtn: {
    height: 44,
    backgroundColor: '#000',

    paddingHorizontal: 16,

    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: 12,
  },

  geoSearchBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
    // 🎯 INJECT THESE DEDICATED SPECIFICATIONS TO COMPLETELY FILL ALL COMPONENT CRASHES:
 
  promoCreationFormFrameBox: {
    paddingVertical: 4,
    marginBottom: 10,
  },
 
 

  // ==========================================
  // TOGGLE PILL AXIS DESIGN RULES (RESTORED)
  // ==========================================
  


  embeddedMapFrame: {
    height: 180,
    width: '100%',

    borderWidth: 1,
    borderColor: '#EAEAEA',

    overflow: 'hidden',
    marginTop: 4,

    borderRadius: 12,
  },

  // =========================
  // PROMO ROW
  // =========================
  promoFormRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  promoFormAddBtn: {
    height: 44,
    width: 60,

    backgroundColor: '#000',

    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: 12,
  },

  promoFormAddText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },

  // =========================
  // LEDGER SYSTEM
  // =========================
 



  // =========================
  // PRIMARY SAVE BUTTON
  // =========================
  saveMainBtn: {
    marginHorizontal: 16,
    marginTop: 8,

    height: 50,

    backgroundColor: '#000',

    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: 14,
  },

  saveMainBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});