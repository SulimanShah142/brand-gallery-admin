import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  FlatList,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadImage } from '../lib/uploadthing';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/lib/config';
// Inside your Admin Products Page file -> Top section before the return block

export default function AdminProductsPage() {
   // 1. DYNAMIC SYSTEM TRANSLATION LOCAL STATE CONTROLS
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // English Defaults
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [profitPercentage, setProfitPercentage] = useState('20');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  // 🎨 Color Reference Image
const [colorImageUri, setColorImageUri] = useState<string | null>(null);
  const router = useRouter()
  // Pashto   // Core Operational States (Clears out "Cannot find name" errors)
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [namePs, setNamePs] = useState('');
  const [descriptionPs, setDescriptionPs] = useState('');

  // Dari/Fa Channels
  const [nameFa, setNameFa] = useState('');
  const [descriptionFa, setDescriptionFa] = useState('');

  // Dynamic Array Structors
  const [sizeInput, setSizeInput] = useState('');
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  // Multi-Language Index-Matched Color Variant Pairs
  const [colorInput, setColorInput] = useState('');
  const [colorInputPs, setColorInputPs] = useState('');
  const [colorInputFa, setColorInputFa] = useState('');
  
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableColorsPs, setAvailableColorsPs] = useState<string[]>([]);
  const [availableColorsFa, setAvailableColorsFa] = useState<string[]>([]);

  const getDisplayPrice = (usdPrice: string | number, productProfitPercentage?: string | number) => {
    const rate = parseFloat(settings?.usdToAfnRate || '65');
    const profit = parseFloat(String(productProfitPercentage ?? '20')) || 20;
    const baseAfn = parseFloat(usdPrice.toString() || '0') * rate;
    const calculatedRetailPrice = Math.round(baseAfn + (baseAfn * (profit / 100)));
    return `AFN ${calculatedRetailPrice.toLocaleString()}`;
  };

  // Parallelized Master Initializer 
  const isActiveProduct = (product: any) => {
    return !(
      product?.isDeleted === true ||
      product?.isDeleted === 1 ||
      String(product?.isDeleted).toLowerCase() === 'true'
    );
  };

  const loadInitialLogisticsConfig = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, settingsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/products`),
        fetch(`${API_URL}/api/admin/categories`),
        fetch(`${API_URL}/api/admin/settings`)
      ]);

      const prodsData = await prodRes.json();
      const catsData = await catRes.json();
      const settingsData = await settingsRes.json();

      setProducts(
        Array.isArray(prodsData)
          ? prodsData.filter(isActiveProduct)
          : []
      );
      setCategories(
        Array.isArray(catsData)
          ? catsData
          : []
      );
      setSettings(settingsData || null);
    } catch (e) {
      console.error("❌ Setup data fetch aborted:", e);
      Alert.alert('Connection Failure', 'Could not sync records with dispatch servers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialLogisticsConfig();
  }, []);

  // Filter products locally as the user types
  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      (product.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (product.nameFa || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (product.namePs || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [products, searchQuery]);

  const addSize = () => {
    if (sizeInput.trim()) {
      setAvailableSizes([...availableSizes, sizeInput.trim().toUpperCase()]);
      setSizeInput('');
    }
  };

  // 🎯 MULTILINGUAL MULTI-ARRAY INJECTION MATRIX
  // Inserts variants in lockstep to keep the arrays index-matched!
  const addColor = () => {
    if (colorInput.trim()) {
      setAvailableColors([...availableColors, colorInput.trim().toUpperCase()]);
      setAvailableColorsPs([...availableColorsPs, (colorInputPs.trim() || colorInput.trim()).toUpperCase()]);
      setAvailableColorsFa([...availableColorsFa, (colorInputFa.trim() || colorInput.trim()).toUpperCase()]);
      
      // Reset color input triggers cleanly
      setColorInput('');
      setColorInputPs('');
      setColorInputFa('');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 600 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        setImageUri(manipulated.uri);
      }
    } catch (error) {
      console.error('❌ Error picking product image:', error);
    }
  };

  const pickColorImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [
          {
            resize: {
              width: 800,
            },
          },
        ],
        {
          compress: 0.4,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      setColorImageUri(manipulated.uri);
    }

  } catch(error){
    console.error(
      "❌ Color image selection failed:",
      error
    );
  }
};

  const resetForm = () => {
  setEditingId(null);

  setName('');
  setDescription('');

  setNamePs('');
  setDescriptionPs('');

  setNameFa('');
  setDescriptionFa('');

  setPrice('');
  setProfitPercentage('20');

  setImageUri(null);

  // NEW
  setColorImageUri(null);

  setCategoryId(null);

  setAvailableSizes([]);

  setAvailableColors([]);
  setAvailableColorsPs([]);
  setAvailableColorsFa([]);
};

  const handleSave = async () => {
    // Basic validation ensures primary English fallbacks exist before transmission
    if (!name.trim() || !namePs.trim() || !nameFa.trim() || !price.trim() || !categoryId) {
      return Alert.alert('Validation', 'Product titles for all three target language platforms are required.');
    }
    
    console.log('💾 Initiating production catalog save routine...');
    setLoading(true);

    try {
   let imageUrl = imageUri;
let colorImageUrl = colorImageUri;

      if (imageUri && !imageUri.startsWith('http')) {
        console.log('🖼️ Local cached image detected. Passing to optimized upload uploader...');
        imageUrl = await uploadImage(imageUri);
        console.log('✅ Edge CDN path successfully secured:', imageUrl);
      }
      if (
  colorImageUri &&
  !colorImageUri.startsWith('http')
) {
  colorImageUrl = await uploadImage(colorImageUri);
}

      // 🎯 THE MULTILINGUAL PAYLOAD MAPPING: Fully aligned with your new postgres schema model constraints!
     const payload = {
  name: name.trim(),

  namePs: namePs.trim(),

  nameFa: nameFa.trim(),


  description: description.trim(),

  descriptionPs:
    descriptionPs.trim(),

  descriptionFa:
    descriptionFa.trim(),


  usdPrice: parseFloat(price),
  profitPercentage: parseFloat(profitPercentage || '20'),

  categoryId,


  // MAIN PRODUCT IMAGE
  imageUrl,


  // COLOR REFERENCE IMAGE
  colorImageUrls: colorImageUrl
    ? [colorImageUrl]
    : [],


  availableSizes,


  availableColors,

  availableColorsPs,

  availableColorsFa,
};

      const url = editingId ? `${API_URL}/api/admin/products/${editingId}` : `${API_URL}/api/admin/products`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert('Success', `Product ${editingId ? 'updated' : 'created'} successfully`);
        resetForm();
        const freshProds = await fetch(`${API_URL}/api/admin/products`).then(r => r.json());
        setProducts(freshProds || []);
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error("❌ Catalog insertion stream broken:", error);
      Alert.alert('Error', 'Unable to commit product parameters to cloud ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name || '');
    setDescription(item.description || '');
    
    // 🎯 SERIALIZE TRANSLATIONS DOWN INTO THE LOCAL STATE WORKSPACE FOR EDIT PASSES
    setNamePs(item.namePs || '');
    setDescriptionPs(item.descriptionPs || '');
    setNameFa(item.nameFa || '');
    setDescriptionFa(item.descriptionFa || '');

    setPrice(item.usdPrice?.toString() || '');
    setProfitPercentage(String(item.profitPercentage ?? '20'));
    setImageUri(item.imageUrl || null);
   setColorImageUri(
  item.colorImageUrls?.[0] || null
);
    setCategoryId(item.categoryId || null);
    setAvailableSizes(Array.isArray(item.availableSizes) ? item.availableSizes : []);
    
    // Core localized colors matrix mapping arrays
    setAvailableColors(Array.isArray(item.availableColors) ? item.availableColors : []);
    setAvailableColorsPs(Array.isArray(item.availableColorsPs) ? item.availableColorsPs : []);
    setAvailableColorsFa(Array.isArray(item.availableColorsFa) ? item.availableColorsFa : []);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm delete', 'This will remove the product from the catalog.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/admin/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
              const freshProds = await fetch(`${API_URL}/api/admin/products`).then(r => r.json());
              setProducts(Array.isArray(freshProds) ? freshProds.filter(isActiveProduct) : []);
            } else {
              const payload = await res.json().catch(() => null);
              console.error('Delete failed response', payload);
              Alert.alert('Error', 'Delete failed');
            }
          } catch (error) {
            console.error('Delete request failed', error);
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  if (loading && products.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

// app/products.tsx -> Complete Return Block Layer Segment

 // app/products.tsx -> Balanced Return Block & Appended Stylesheets
return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
  >
    <View style={styles.container}>
      {/* SEARCH BAR */}
      <View style={styles.searchBarRow}>
        <Ionicons name="search-outline" size={18} color="#999999" />
        <TextInput
          style={styles.searchInput}
          placeholder="SEARCH PRODUCT CATALOG STOCK..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* MAIN LIST */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <View style={{ padding: 16 }}>
              <Text style={styles.heading}>Products</Text>

              {/* NAV */}
              <View style={styles.navRow}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => router.push("/categories")}
                >
                  <Text style={styles.navButtonText}>
                    Go to Categories
                  </Text>
                </TouchableOpacity>
              </View>

              {/* MULTILINGUAL ENTRY FORM CARD */}
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>
                  {editingId ? "Edit Product" : "Add Product"}
                </Text>

                {/* LOCALIZED NAME INPUT CHANNELS */}
                <Text style={styles.fieldLabel}>ENGLISH PRODUCT TITLE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Linen Dress"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.fieldLabel}>PASHTO PRODUCT TITLE (پښتو)</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'right' }]}
                  placeholder="د محصول نوم"
                  value={namePs}
                  onChangeText={setNamePs}
                />

                <Text style={styles.fieldLabel}>DARI PRODUCT TITLE (دری)</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'right' }]}
                  placeholder="نام محصول"
                  value={nameFa}
                  onChangeText={setNameFa}
                />

                {/* PRICE CONTROLS */}
                <Text style={styles.fieldLabel}>BASE PRICE (USD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 25.00"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />

                <Text style={styles.fieldLabel}>PROFIT PERCENTAGE (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 20"
                  keyboardType="numeric"
                  value={profitPercentage}
                  onChangeText={setProfitPercentage}
                />

                {/* LOCALIZED DESCRIPTION CHANNELS */}
                <Text style={styles.fieldLabel}>ENGLISH DESCRIPTION</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  placeholder="Product context details..."
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />

                <Text style={styles.fieldLabel}>PASHTO DESCRIPTION (پښتو)</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlign: 'right' }]}
                  placeholder="تفصیل په پښتو کې"
                  multiline
                  value={descriptionPs}
                  onChangeText={setDescriptionPs}
                />

                <Text style={styles.fieldLabel}>DARI DESCRIPTION (دری)</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlign: 'right' }]}
                  placeholder="توضیحات به دری"
                  multiline
                  value={descriptionFa}
                  onChangeText={setDescriptionFa}
                />

                {/* SIZES MATRIX GROUP */}
                <Text style={styles.subLabel}>
                  Available Sizes (e.g., S, M, L, XL)
                </Text>
                <View style={styles.tagInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Add Size"
                    value={sizeInput}
                    onChangeText={setSizeInput}
                  />
                  <TouchableOpacity style={styles.addTagBtn} onPress={addSize}>
                    <Text style={styles.addTagText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.tagCloud}>
                  {availableSizes.map((s, i) => (
                    <TouchableOpacity
                      key={`size-${i}`}
                      onPress={() =>
                        setAvailableSizes(
                          availableSizes.filter((_, idx) => idx !== i)
                        )
                      }
                      style={styles.tag}
                    >
                      <Text style={styles.tagText}>{s} ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 🎯 LOCALIZED INDEX-MATCHED COLORS INPUT SYSTEM */}
                <Text style={styles.subLabel}>
                  Available Colors (Must Add English + Translations Simultaneously)
                </Text>
                
                <TextInput
                  style={[styles.input, { marginBottom: 8 }]}
                  placeholder="ENGLISH: e.g. BLACK"
                  value={colorInput}
                  onChangeText={setColorInput}
                />
                <TextInput
                  style={[styles.input, { marginBottom: 8, textAlign: 'right' }]}
                  placeholder="PASHTO (پښتو): تور"
                  value={colorInputPs}
                  onChangeText={setColorInputPs}
                />
                
                <View style={styles.tagInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, textAlign: 'right' }]}
                    placeholder="DARI (دری): سیاه"
                    value={colorInputFa}
                    onChangeText={setColorInputFa}
                  />
                  <TouchableOpacity style={styles.addTagBtn} onPress={addColor}>
                    <Text style={styles.addTagText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* DISPLAY REGISTERED ENGLISH LABELS FOR ACCURACY CHECK */}
                <View style={styles.tagCloud}>
                  {availableColors.map((c, i) => (
                    <TouchableOpacity
                      key={`color-${i}`}
                      onPress={() => {
                        setAvailableColors(availableColors.filter((_, idx) => idx !== i));
                        setAvailableColorsPs(availableColorsPs.filter((_, idx) => idx !== i));
                        setAvailableColorsFa(availableColorsFa.filter((_, idx) => idx !== i));
                      }}
                      style={styles.tag}
                    >
                      <Text style={styles.tagText}>
                        {c} ({availableColorsFa[i] || 'Fa'}) ✕
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* CATEGORY CHIP CHANNELS */}
                <Text style={styles.subLabel}>Assign Category Relationship</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catPickChip,
                        categoryId === cat.id && styles.catPickChipActive,
                        { marginRight: 8 },
                      ]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          categoryId === cat.id && styles.catChipTextActive,
                        ]}
                      >
                        {cat.name?.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* MULTIMEDIA IMMIGRATION LINK */}
              {/* MAIN PRODUCT IMAGE */}
<TouchableOpacity
  style={[
    styles.navButton,
    {
      marginTop:14,
    },
  ]}
  onPress={pickImage}
>
  <Text style={styles.navButtonText}>
    {
      imageUri
      ? "✓ PRODUCT IMAGE READY"
      : "CHOOSE PRODUCT IMAGE"
    }
  </Text>
</TouchableOpacity>


{/* COLOR REFERENCE IMAGE */}
<TouchableOpacity
  style={[
    styles.navButton,
    {
      marginTop:10,
    },
  ]}
  onPress={pickColorImage}
>
  <Text style={styles.navButtonText}>
    {
      colorImageUri
      ? "✓ COLOR IMAGE READY"
      : "CHOOSE COLOR REFERENCE IMAGE"
    }
  </Text>
</TouchableOpacity>

                {/* ACTIONS */}
                <View style={styles.formActionsRow}>
                  {editingId && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={resetForm}
                    >
                      <Text style={styles.cancelBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSave}
                  >
                    <Text style={styles.submitBtnText}>
                      SAVE PRODUCT
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        }
        renderItem={({ item }) => (
<View style={styles.productManifestCard}>
  <View style={styles.imageColumn}>
    {item.imageUrl && (
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.cardImageThumb}
      />
    )}

    {item.colorImageUrls?.length > 0 && (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorThumbRow}
      >
        {item.colorImageUrls.map((img: string, index: number) => (
          <Image
            key={index}
            source={{ uri: img }}
            style={styles.colorThumb}
          />
        ))}
      </ScrollView>
    )}
  </View>

            <View style={styles.cardInfoBlock}>
              <Text style={styles.cardTitle}>
                {item.name?.toUpperCase()}
              </Text>

              <Text style={styles.cardPrice}>
                {getDisplayPrice(item.usdPrice, item.profitPercentage)}
              </Text>

              <Text style={styles.cardWholesale}>
                Wholesale Cost: ${item.usdPrice} USD
              </Text>

              <View style={styles.cardButtonsActionArea}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleEdit(item)}
                >
                  <Ionicons name="pencil" size={14} color="#000" />
                  <Text style={styles.editBtnText}>EDIT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color="#FF3B30"
                  />
                  <Text style={styles.deleteBtnText}>REMOVE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  </KeyboardAvoidingView>
);}

// 🎯 COMPLETE PRODUCTION STYLESHEET WITH ALL DEFINED CONFIGURATIONS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },

  // =========================
  // PAGE HEADER TEXT
  // =========================
  heading: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#000',
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  // =========================
  // SEARCH BAR (CARD STYLE)
  // =========================
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#EAEAEA',

    paddingHorizontal: 14,
    paddingVertical: 10,

    margin: 16,
    marginBottom: 0,

    borderRadius: 14,
  },
fieldLabel: {
  fontSize: 9,
  fontWeight: "900",
  color: "#777777",
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: 4,
},

itemSubTitleTranslation: {
  fontSize: 10,
  color: "#888888",
  fontWeight: "500",
  letterSpacing: 0.2,
  marginTop: 2,
},
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },

  // =========================
  // NAV BUTTONS (MINIMAL BLOCKS)
  // =========================
  navRow: {
    marginBottom: 10,
  },

  navButton: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#EAEAEA',

    paddingVertical: 12,

    alignItems: 'center',

    marginBottom: 14,

    borderRadius: 14,
  },

  navButtonText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#000',
  },

  // =========================
  // FORM CARD (UNIFIED SYSTEM)
  // =========================
  formCard: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#EAEAEA',

    padding: 18,

    marginBottom: 12,

    borderRadius: 16,
  },

  formTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#000',

    marginBottom: 12,

    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',

    paddingBottom: 6,
  },

  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',

    paddingVertical: 10,

    fontSize: 13,
    fontWeight: '600',
    color: '#000',

    marginBottom: 14,
  },

  dualInputRow: {
    flexDirection: 'row',
    gap: 12,
  },

  subLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 4,
    textTransform: 'uppercase',
  },

  // =========================
  // TAG SYSTEM (CLEAN CHIPS)
  // =========================
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  addTagBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },

  addTagText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },

  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  tag: {
    backgroundColor: '#F4F4F5',

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderWidth: 1,
    borderColor: '#EAEAEA',

    borderRadius: 10,
  },

  tagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#333',
  },

  // =========================
  // CATEGORY CHIPS
  // =========================
  catPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  catPickChip: {
    backgroundColor: '#F4F4F5',

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderWidth: 1,
    borderColor: '#EAEAEA',

    borderRadius: 12,
  },

  catPickChipActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },

  catChipText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 0.5,
  },

  catChipTextActive: {
    color: '#FFF',
  },

  // =========================
  // MULTILINGUAL INPUT GRID
  // =========================
  multilingualColorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },

  multilingualInputSubCell: {
    flex: 1,
    height: 40,

    borderWidth: 1,
    borderColor: '#EAEAEA',

    backgroundColor: '#FAFAFA',

    paddingHorizontal: 10,

    fontSize: 12,
    color: '#000',
  },

  // =========================
  // FORM ACTIONS
  // =========================
  formActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
  },

  cancelBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#666',
  },

  submitBtn: {
    flex: 2,
    backgroundColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },

  submitBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // =========================
  // PRODUCT LIST CARD (MAJOR UPGRADE)
  // =========================
 productManifestCard: {
  backgroundColor: "#FFF",
  borderWidth: 1,
  borderColor: "#EAEAEA",
  borderRadius: 16,
  padding: 12,

  flexDirection: "row",
  alignItems: "flex-start",
},

imageColumn: {
  width: 82,
  marginRight: 14,
},

cardImageThumb: {
  width: 82,
  height: 110,
  borderRadius: 12,
  backgroundColor: "#F5F5F5",
},

colorThumbRow: {
  paddingTop: 8,
},

colorThumb: {
  width: 42,
  height: 42,
  borderRadius: 8,
  marginRight: 6,
  backgroundColor: "#F5F5F5",
},

cardInfoBlock: {
  flex: 1,
  justifyContent: "space-between",
},

 
  cardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
  },

  cardPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#22C55E',
  },

  cardWholesale: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    marginTop: 2,
  },

  // =========================
  // ACTION ROW (CLEAN BUTTON GROUP)
  // =========================
  cardButtonsActionArea: {
    flexDirection: 'row',
    marginRight: 30,
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  editBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
  },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  deleteBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FF3B30',
  },
});