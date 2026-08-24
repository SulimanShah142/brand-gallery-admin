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
    Share,
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
  const router = useRouter();

  // =========================================================
  // TYPES
  // =========================================================

  type ProductColor = {
    id?: string;
    name: string;
    namePs: string;
    nameFa: string;
    colorCode: string;
    imageUrl: string | null;
    localImageUri?: string | null;
    sortOrder?: number;
  };

  type SizeGuideRow = {
    id?: string;
    size: string;
    measurements: Record<string, string>;
    sortOrder?: number;
  };

  // =========================================================
  // BASIC PRODUCT STATE
  // =========================================================

  const [editingId, setEditingId] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [namePs, setNamePs] = useState('');
  const [nameFa, setNameFa] = useState('');

  const [description, setDescription] = useState('');
  const [descriptionPs, setDescriptionPs] = useState('');
  const [descriptionFa, setDescriptionFa] = useState('');

  const [price, setPrice] = useState('');
  const [profitPercentage, setProfitPercentage] = useState('20');

  const [categoryId, setCategoryId] =
    useState<string | null>(null);

  const [imageUri, setImageUri] =
    useState<string | null>(null);

  // =========================================================
  // DATA STATE
  // =========================================================

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Pagination / incremental loading
  const [page, setPage] = useState(0);
  const [limit] = useState(40);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // =========================================================
  // SIZE SYSTEM
  // =========================================================

  const [sizeInput, setSizeInput] = useState('');

  const [availableSizes, setAvailableSizes] =
    useState<string[]>([]);

  const [sizeGuideRows, setSizeGuideRows] =
    useState<SizeGuideRow[]>([]);

  // =========================================================
  // DYNAMIC MEASUREMENT SYSTEM
  // =========================================================

  const [measurementNameInput, setMeasurementNameInput] =
    useState('');

  const [measurementValueInput, setMeasurementValueInput] =
    useState('');

  const [selectedSizeForMeasurement, setSelectedSizeForMeasurement] =
    useState<number | null>(null);

  // =========================================================
  // COLOR SYSTEM
  // =========================================================

  const [colorInput, setColorInput] = useState('');
  const [colorInputPs, setColorInputPs] = useState('');
  const [colorInputFa, setColorInputFa] = useState('');
  const [colorCodeInput, setColorCodeInput] = useState('');

  const [colorImageUri, setColorImageUri] =
    useState<string | null>(null);

  const [productColors, setProductColors] =
    useState<ProductColor[]>([]);

  // =========================================================
  // DISPLAY PRICE
  // =========================================================

  const getDisplayPrice = (
    usdPrice: string | number,
    productProfitPercentage?: string | number
  ) => {
    const rate =
      parseFloat(
        settings?.usdToAfnRate || '65'
      ) || 65;

    const profit =
      parseFloat(
        String(
          productProfitPercentage ?? '20'
        )
      ) || 20;

    const baseAfn =
      parseFloat(
        String(usdPrice || '0')
      ) * rate;

    const retailPrice =
      Math.round(
        baseAfn +
        baseAfn * (profit / 100)
      );

    return `AFN ${retailPrice.toLocaleString()}`;
  };

  // =========================================================
  // ACTIVE PRODUCT CHECK
  // =========================================================

  const isActiveProduct = (product: any) => {
    return !(
      product?.isDeleted === true ||
      product?.isDeleted === 1 ||
      String(product?.isDeleted).toLowerCase() === 'true'
    );
  };

  // =========================================================
  // LOAD PRODUCTS / CATEGORIES / SETTINGS
  // =========================================================

// =========================================================
// LOAD SETTINGS
// =========================================================

const loadSettings = async () => {
  try {
    setSettingsLoading(true);

    const response = await fetch(
      `${API_URL}/api/admin/settings`
    );

    if (!response.ok) {
      throw new Error(
        `Settings request failed: ${response.status}`
      );
    }

    const data = await response.json();

    setSettings(data || null);

    console.log("✅ Settings loaded");
  } catch (error) {
    console.error(
      "❌ Failed to load settings:",
      error
    );
  } finally {
    setSettingsLoading(false);
  }
};


// =========================================================
// LOAD CATEGORIES
// =========================================================

const loadCategories = async () => {
  try {
    setCategoriesLoading(true);

    const response = await fetch(
      `${API_URL}/api/admin/categories`
    );

    if (!response.ok) {
      throw new Error(
        `Categories request failed: ${response.status}`
      );
    }

    const data = await response.json();

    setCategories(
      Array.isArray(data)
        ? data
        : []
    );

    console.log("✅ Categories loaded");
  } catch (error) {
    console.error(
      "❌ Failed to load categories:",
      error
    );
  } finally {
    setCategoriesLoading(false);
  }
};

const loadProducts = async (reset = false) => {
  if (
    productsLoading ||
    loadingMore
  ) {
    return;
  }

  if (
    !reset &&
    !hasMore
  ) {
    return;
  }

  try {
    if (reset) {
      setProductsLoading(true);
      setPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    const offset =
      reset
        ? 0
        : products.length;

    console.log(
      `🛍️ Loading products: offset=${offset}, limit=${limit}`
    );

    const startedAt =
      Date.now();

    const response =
      await fetch(
        `${API_URL}/api/admin/products?limit=${limit}&offset=${offset}`
      );

    if (!response.ok) {
      throw new Error(
        `Products request failed: ${response.status}`
      );
    }

    const data =
      await response.json();

    const incomingProducts =
      Array.isArray(data?.products)
        ? data.products.filter(
            isActiveProduct
          )
        : [];

    setProducts(prev => {
      if (reset) {
        return incomingProducts;
      }

      // Prevent accidental duplicates.
      const existingIds =
        new Set(
          prev.map(
            product => product.id
          )
        );

      const newProducts =
        incomingProducts.filter(
          product =>
            !existingIds.has(
              product.id
            )
        );

      return [
        ...prev,
        ...newProducts,
      ];
    });

    setHasMore(
      Boolean(data?.hasMore)
    );

    setPage(prev =>
      reset
        ? 1
        : prev + 1
    );

    console.log(
      `✅ Loaded ${incomingProducts.length} products`
    );

    console.log(
      `⏱️ Request took ${Date.now() - startedAt}ms`
    );

  } catch (error) {
    console.error(
      '❌ Failed to load products:',
      error
    );

    Alert.alert(
      'Connection Failure',
      'Could not load the product catalog.'
    );

  } finally {
    setProductsLoading(false);
    setLoadingMore(false);
  }
};

useEffect(() => {
  loadProducts(true);
  loadCategories()

}, []);

  // =========================================================
// LOAD SETTINGS
// =========================================================


  // =========================================================
  // PRODUCT SEARCH
  // =========================================================

  const filteredProducts = useMemo(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter(
      product =>
        String(product.name || '')
          .toLowerCase()
          .includes(query) ||

        String(product.namePs || '')
          .toLowerCase()
          .includes(query) ||

        String(product.nameFa || '')
          .toLowerCase()
          .includes(query)
    );
  }, [
    products,
    searchQuery,
  ]);

  // =========================================================
  // ADD SIZE
  // =========================================================

  const addSize = () => {
    const size =
      sizeInput
        .trim()
        .toUpperCase();

    if (!size) {
      return;
    }

    const duplicate =
      availableSizes.some(
        existing =>
          existing.toLowerCase() ===
          size.toLowerCase()
      );

    if (duplicate) {
      Alert.alert(
        'Duplicate Size',
        `${size} has already been added.`
      );
      return;
    }

    setAvailableSizes(prev => [
      ...prev,
      size,
    ]);

    setSizeGuideRows(prev => [
      ...prev,
      {
        size,
        measurements: {},
        sortOrder: prev.length,
      },
    ]);

    setSizeInput('');
  };

  // =========================================================
  // REMOVE SIZE
  // =========================================================

  const removeSize = (index: number) => {
    setAvailableSizes(prev =>
      prev.filter(
        (_, i) => i !== index
      )
    );

    setSizeGuideRows(prev =>
      prev
        .filter(
          (_, i) => i !== index
        )
        .map((row, newIndex) => ({
          ...row,
          sortOrder: newIndex,
        }))
    );

    if (
      selectedSizeForMeasurement === index
    ) {
      setSelectedSizeForMeasurement(null);
    } else if (
      selectedSizeForMeasurement !== null &&
      selectedSizeForMeasurement > index
    ) {
      setSelectedSizeForMeasurement(
        selectedSizeForMeasurement - 1
      );
    }
  };

  // =========================================================
  // ADD COLOR
  // =========================================================

  const addColor = () => {
    const englishName =
      colorInput
        .trim()
        .toUpperCase();

    const pashtoName =
      colorInputPs.trim();

    const dariName =
      colorInputFa.trim();

    const colorCode =
      colorCodeInput.trim();

    if (!englishName) {
      Alert.alert(
        'Color Required',
        'Enter the English color name.'
      );
      return;
    }

    if (!colorImageUri) {
      Alert.alert(
        'Color Image Required',
        'Every color must have its own image.'
      );
      return;
    }

    const duplicate =
      productColors.some(
        color =>
          color.name
            .trim()
            .toLowerCase() ===
          englishName
            .trim()
            .toLowerCase()
      );

    if (duplicate) {
      Alert.alert(
        'Duplicate Color',
        `${englishName} has already been added.`
      );
      return;
    }

    setProductColors(prev => [
      ...prev,
      {
        name: englishName,

        namePs:
          pashtoName || englishName,

        nameFa:
          dariName || englishName,

        colorCode,

        imageUrl: null,

        localImageUri:
          colorImageUri,

        sortOrder: prev.length,
      },
    ]);

    setColorInput('');
    setColorInputPs('');
    setColorInputFa('');
    setColorCodeInput('');
    setColorImageUri(null);
  };

  // =========================================================
  // REMOVE COLOR
  // =========================================================

  const removeColor = (index: number) => {
    setProductColors(prev =>
      prev
        .filter(
          (_, i) => i !== index
        )
        .map((color, newIndex) => ({
          ...color,
          sortOrder: newIndex,
        }))
    );
  };

  // =========================================================
  // PICK MAIN PRODUCT IMAGE
  // =========================================================

  const pickImage = async () => {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      const asset =
        result.assets[0];

      const manipulated =
        await ImageManipulator.manipulateAsync(
          asset.uri,
          [
            {
              resize: {
                width: 600,
              },
            },
          ],
          {
            compress: 0.7,
            format:
              ImageManipulator.SaveFormat.JPEG,
          }
        );

      setImageUri(
        manipulated.uri
      );
    } catch (error) {
      console.error(
        '❌ Main image selection failed:',
        error
      );

      Alert.alert(
        'Error',
        'Could not select the product image.'
      );
    }
  };

  // =========================================================
  // PICK COLOR IMAGE
  // =========================================================

  const pickColorImage = async () => {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });

      if (result.canceled) {
        return;
      }

      const asset =
        result.assets[0];

      const manipulated =
        await ImageManipulator.manipulateAsync(
          asset.uri,
          [
            {
              resize: {
                width: 800,
              },
            },
          ],
          {
            compress: 0.6,
            format:
              ImageManipulator.SaveFormat.JPEG,
          }
        );

      setColorImageUri(
        manipulated.uri
      );
    } catch (error) {
      console.error(
        '❌ Color image selection failed:',
        error
      );

      Alert.alert(
        'Error',
        'Could not select the color image.'
      );
    }
  };

  // =========================================================
  // ADD DYNAMIC MEASUREMENT
  // =========================================================

  const addMeasurement = () => {
    if (
      selectedSizeForMeasurement === null
    ) {
      Alert.alert(
        'Select Size',
        'Select a size before adding a measurement.'
      );
      return;
    }

    const key =
      measurementNameInput
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');

    const value =
      measurementValueInput.trim();

    if (!key || !value) {
      Alert.alert(
        'Incomplete Measurement',
        'Enter both the measurement name and value.'
      );
      return;
    }

    setSizeGuideRows(prev =>
      prev.map(
        (row, index) => {
          if (
            index !==
            selectedSizeForMeasurement
          ) {
            return row;
          }

          return {
            ...row,

            measurements: {
              ...row.measurements,

              [key]: value,
            },
          };
        }
      )
    );

    setMeasurementNameInput('');
    setMeasurementValueInput('');
  };

  // =========================================================
  // REMOVE DYNAMIC MEASUREMENT
  // =========================================================

  const removeMeasurement = (
    sizeIndex: number,
    measurementKey: string
  ) => {
    setSizeGuideRows(prev =>
      prev.map(
        (row, index) => {
          if (
            index !== sizeIndex
          ) {
            return row;
          }

          const measurements = {
            ...row.measurements,
          };

          delete measurements[
            measurementKey
          ];

          return {
            ...row,
            measurements,
          };
        }
      )
    );
  };

  // =========================================================
  // RESET FORM
  // =========================================================

const resetForm = () => {
  setEditingId(null);

  setName('');
  setNamePs('');
  setNameFa('');

  setDescription('');
  setDescriptionPs('');
  setDescriptionFa('');

  setPrice('');
  setProfitPercentage('20');

  setCategoryId(null);

  setImageUri(null);

  setAvailableSizes([]);

  setProductColors([]);

  setSizeGuideRows([]);

  setSizeInput('');

  setColorInput('');
  setColorInputPs('');
  setColorInputFa('');
  setColorCodeInput('');
  setColorImageUri(null);

  setMeasurementNameInput('');
  setMeasurementValueInput('');
  setSelectedSizeForMeasurement(null);
};

  // =========================================================
  // SAVE PRODUCT
  // =========================================================

const handleSave = async () => {
  // Prevent duplicate save requests.
  if (loading) {
    return;
  }

  // =========================================================
  // 1. VALIDATION
  // =========================================================

  const cleanName = name.trim();
  const cleanNamePs = namePs.trim();
  const cleanNameFa = nameFa.trim();

  const parsedPrice = Number(price);
  const parsedProfit = Number(
    profitPercentage || '20'
  );

  if (
    !cleanName ||
    !cleanNamePs ||
    !cleanNameFa
  ) {
    Alert.alert(
      'Validation',
      'Product names in English, Pashto and Dari are required.'
    );
    return;
  }

  if (
    !Number.isFinite(parsedPrice) ||
    parsedPrice < 0
  ) {
    Alert.alert(
      'Validation',
      'Enter a valid product price.'
    );
    return;
  }

  if (
    !Number.isFinite(parsedProfit) ||
    parsedProfit < 0
  ) {
    Alert.alert(
      'Validation',
      'Enter a valid profit percentage.'
    );
    return;
  }

  if (!categoryId) {
    Alert.alert(
      'Validation',
      'Please select a category.'
    );
    return;
  }

  // Capture this BEFORE doing async work.
  // Otherwise editingId could theoretically change
  // while the request is running.
  const currentEditingId = editingId;
  const isEditing = Boolean(currentEditingId);

  // =========================================================
  // START SAVE
  // =========================================================

  setLoading(true);

  try {
    // =======================================================
    // 2. MAIN IMAGE
    // =======================================================

    let uploadedMainImageUrl =
      imageUri || null;

    if (
      uploadedMainImageUrl &&
      !uploadedMainImageUrl.startsWith('http')
    ) {
      uploadedMainImageUrl =
        await uploadImage(
          uploadedMainImageUrl
        );
    }

    // =======================================================
    // 3. COLOR IMAGES
    // =======================================================

    const uploadedColors: ProductColor[] = [];

    for (
      let index = 0;
      index < productColors.length;
      index++
    ) {
      const color =
        productColors[index];

      const cleanColorName =
        String(color.name || '').trim();

      if (!cleanColorName) {
        throw new Error(
          `Color #${index + 1} must have a name.`
        );
      }

      let uploadedImage =
        color.imageUrl || null;

      if (
        color.localImageUri &&
        !color.localImageUri.startsWith('http')
      ) {
        uploadedImage =
          await uploadImage(
            color.localImageUri
          );
      }

      if (!uploadedImage) {
        throw new Error(
          `Color "${cleanColorName}" does not have an image.`
        );
      }

      uploadedColors.push({
        id: color.id,

        name:
          cleanColorName,

        namePs:
          color.namePs?.trim() ||
          cleanColorName,

        nameFa:
          color.nameFa?.trim() ||
          cleanColorName,

        colorCode:
          color.colorCode?.trim() ||
          '',

        imageUrl:
          uploadedImage,

        localImageUri:
          null,

        sortOrder:
          index,
      });
    }

    // =======================================================
    // 4. PRODUCT SIZES
    // =======================================================

    const cleanedSizes =
      availableSizes
        .map(size =>
          String(size)
            .trim()
            .toUpperCase()
        )
        .filter(Boolean);

    const uniqueSizes = [
      ...new Set(cleanedSizes),
    ];

    // =======================================================
    // 5. SIZE GUIDE
    // =======================================================

    const cleanedSizeGuideRows =
      sizeGuideRows
        .map((row, index) => ({
          id: row.id,

          size:
            String(row.size || '')
              .trim()
              .toUpperCase(),

          measurements:
            row.measurements &&
            typeof row.measurements === 'object'
              ? row.measurements
              : {},

          sortOrder:
            index,
        }))
        .filter(row => row.size);

    // =======================================================
    // 6. PAYLOAD
    // =======================================================

    const payload = {
      name:
        cleanName,

      namePs:
        cleanNamePs,

      nameFa:
        cleanNameFa,

      description:
        description.trim(),

      descriptionPs:
        descriptionPs.trim(),

      descriptionFa:
        descriptionFa.trim(),

      usdPrice:
        parsedPrice,

      profitPercentage:
        parsedProfit,

      categoryId,

      imageUrl:
        uploadedMainImageUrl,

      colors:
        uploadedColors,

      availableSizes:
        uniqueSizes,

      sizeGuide: {
        title:
          'Product Details',

        titlePs:
          'Product Details',

        titleFa:
          'Product Details',

        isActive:
          true,

        sortOrder:
          0,

        rows:
          cleanedSizeGuideRows,
      },
    };

    console.log(
      '📦 Saving product:',
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    // =======================================================
    // 7. CREATE / UPDATE
    // =======================================================

    const url = isEditing
      ? `${API_URL}/api/admin/products/${currentEditingId}`
      : `${API_URL}/api/admin/products`;

    const method = isEditing
      ? 'PATCH'
      : 'POST';

    const response =
      await fetch(
        url,
        {
          method,

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    // =======================================================
    // 8. SERVER RESPONSE
    // =======================================================

    const responseData =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      console.error(
        '❌ Product save failed:',
        responseData
      );

      throw new Error(
        responseData?.error ||
        responseData?.message ||
        responseData?.details ||
        `Product save failed (${response.status})`
      );
    }

    console.log(
      '✅ Product saved successfully:',
      responseData
    );

    // =======================================================
    // 9. REFRESH ALL ADMIN DATA
    // =======================================================
    //
    // IMPORTANT:
    //
    // We DO NOT call loadProducts()
    // because that function does not exist.
    //
    // Your existing loader is:
    //
    // loadInitialLogisticsConfig()
    //
    // It refreshes products, categories and settings.
    //
    // =======================================================

    await loadProducts();

    // =======================================================
    // 10. RESET FORM
    // =======================================================

    resetForm();

    // =======================================================
    // 11. SUCCESS
    // =======================================================

    Alert.alert(
      'Success',
      isEditing
        ? 'Product updated successfully.'
        : 'Product created successfully.'
    );

  } catch (error) {
    console.error(
      '❌ Catalog save failed:',
      error
    );

    Alert.alert(
      'Error',
      error instanceof Error
        ? error.message
        : 'Unable to save product.'
    );

  } finally {
    // =======================================================
    // CRITICAL
    //
    // Always return to normal state.
    // =======================================================

    setLoading(false);
  }
};

  const handleEdit = (item: any) => {
  // =====================================================
  // ENTER EDIT MODE
  // =====================================================

  setEditingId(
    item.id
  );


  // =====================================================
  // BASIC INFORMATION
  // =====================================================

  setName(
    item.name || ''
  );

  setNamePs(
    item.namePs || ''
  );

  setNameFa(
    item.nameFa || ''
  );


  // =====================================================
  // DESCRIPTIONS
  // =====================================================

  setDescription(
    item.description || ''
  );

  setDescriptionPs(
    item.descriptionPs || ''
  );

  setDescriptionFa(
    item.descriptionFa || ''
  );


  // =====================================================
  // PRICE
  // =====================================================

  setPrice(
    item.usdPrice != null
      ? String(item.usdPrice)
      : ''
  );


  setProfitPercentage(
    item.profitPercentage != null
      ? String(
          item.profitPercentage
        )
      : '20'
  );


  // =====================================================
  // CATEGORY
  // =====================================================

  setCategoryId(
    item.categoryId || null
  );


  // =====================================================
  // MAIN IMAGE
  // =====================================================

  setImageUri(
    item.imageUrl || null
  );


  // =====================================================
  // PRODUCT SIZES
  // =====================================================

  const sizes =
    Array.isArray(
      item.availableSizes
    )
      ? item.availableSizes
      : [];


  setAvailableSizes(
    sizes
      .map(
        (size: any) =>
          String(size)
            .trim()
            .toUpperCase()
      )
      .filter(Boolean)
  );


  // =====================================================
  // COLORS
  // =====================================================

  const colors =
    Array.isArray(
      item.colors
    )
      ? item.colors
      : [];


  setProductColors(
    colors.map(
      (
        color: any,
        index: number
      ) => ({
        id:
          color.id,

        name:
          color.name || '',

        namePs:
          color.namePs ||
          color.name ||
          '',

        nameFa:
          color.nameFa ||
          color.name ||
          '',

        colorCode:
          color.colorCode ||
          '',

        imageUrl:
          color.imageUrl ||
          null,

        localImageUri:
          null,

        sortOrder:
          color.sortOrder ??
          index,
      })
    )
  );


  // =====================================================
  // SPECIFICATION / SIZE GUIDE
  // =====================================================

  let selectedGuide =
    null;


  // New backend structure
  if (
    Array.isArray(
      item.specificationTables
    )
  ) {

    selectedGuide =
      item.specificationTables.find(
        (table: any) =>
          table.title ===
            'Product Details' ||
          table.title ===
            'Size Guide'
      ) || null;
  }


  // Compatibility fallback
  if (!selectedGuide) {

    selectedGuide =
      item.sizeGuide ||
      null;
  }


  const rows =
    selectedGuide &&
    Array.isArray(
      selectedGuide.rows
    )
      ? selectedGuide.rows
      : [];


  setSizeGuideRows(
    rows.map(
      (
        row: any,
        index: number
      ) => ({
        id:
          row.id,

        size:
          String(
            row.size || ''
          )
            .trim()
            .toUpperCase(),

        measurements:
          row.measurements &&
          typeof row.measurements ===
            'object'
            ? row.measurements
            : {},

        sortOrder:
          row.sortOrder ??
          index,
      })
    )
  );


  // =====================================================
  // CLEAR TEMPORARY INPUTS
  // =====================================================

  setSizeInput('');

  setColorInput('');

  setColorInputPs('');

  setColorInputFa('');

  setColorCodeInput('');

  setColorImageUri(null);

  setMeasurementNameInput('');

  setMeasurementValueInput('');

  setSelectedSizeForMeasurement(null);


  // =====================================================
  // MAKE SURE WE ARE NOT STUCK IN SAVING STATE
  // =====================================================

  setLoading(false);
};

const handleShareProduct = async (item: any) => {
  try {
    if (!item?.id) {
      Alert.alert(
        'Unable to Share',
        'This product does not have a valid product ID.'
      );
      return;
    }

    const productUrl =
      `https://brand-gallery-deep-linking.vercel.app/products/${item.id}`;

    const result = await Share.share({
      message: productUrl,
      url: productUrl,
      title: item.name
        ? `Brand Gallery — ${item.name}`
        : 'Brand Gallery Product',
    });

    if (result.action === Share.sharedAction) {
      console.log(
        '✅ Product shared:',
        productUrl
      );
    }
  } catch (error) {
    console.error(
      '❌ Failed to share product:',
      error
    );

    Alert.alert(
      'Share Failed',
      'Could not share this product.'
    );
  }
};


  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDelete = async (
    id: string
  ) => {
    Alert.alert(
      'Confirm Delete',
      'This will remove the product from the active catalog.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {
            setLoading(true);

            try {
              const response =
                await fetch(
                  `${API_URL}/api/admin/products/${id}`,
                  {
                    method: 'DELETE',
                  }
                );

              if (!response.ok) {
                const errorData =
                  await response
                    .json()
                    .catch(
                      () => null
                    );

                throw new Error(
                  errorData?.message ||
                  'Delete failed.'
                );
              }

              await loadProducts();

            } catch (error) {
              console.error(
                '❌ Delete failed:',
                error
              );

              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Delete failed.'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };





// app/products.tsx -> Complete Return Block Layer Segment

return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
  >
    <View style={styles.container}>

      {/* ========================================================= */}
      {/* SEARCH */}
      {/* ========================================================= */}

      <View style={styles.searchBarRow}>
        <Ionicons
          name="search-outline"
          size={18}
          color="#999999"
        />

        <TextInput
          style={styles.searchInput}
          placeholder="SEARCH PRODUCT CATALOG..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ========================================================= */}
      {/* PRODUCT LIST */}
      {/* ========================================================= */}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        onEndReached={() => {
          if (!productsLoading && !loadingMore && hasMore) {
            loadProducts(false);
          }
        }}
        onEndReachedThreshold={0.6}

        ListHeaderComponent={
          <View style={{ padding: 16 }}>

            {/* =================================================== */}
            {/* HEADER */}
            {/* =================================================== */}

            <View style={{ marginBottom: 14 }}>
              <Text style={styles.heading}>
                PRODUCT CATALOG
              </Text>

              <Text
                style={{
                  fontSize: 11,
                  color: '#888',
                  fontWeight: '500',
                  marginTop: 3,
                }}
              >
                Manage products, variants, pricing and specifications.
              </Text>
            </View>

            {/* =================================================== */}
            {/* NAVIGATION */}
            {/* =================================================== */}

            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => router.push('/categories')}
              >
                <Ionicons
                  name="grid-outline"
                  size={15}
                  color="#000"
                />

                <Text style={styles.navButtonText}>
                  MANAGE CATEGORIES
                </Text>
              </TouchableOpacity>
            </View>

            {/* =================================================== */}
            {/* PRODUCT FORM */}
            {/* =================================================== */}

            <View style={styles.formCard}>

              <Text style={styles.formTitle}>
                {editingId
                  ? 'EDIT PRODUCT'
                  : 'CREATE PRODUCT'}
              </Text>

              {/* ================================================= */}
              {/* BASIC INFORMATION */}
              {/* ================================================= */}

              <Text style={styles.subLabel}>
                BASIC INFORMATION
              </Text>

              {/* ENGLISH */}
              <Text style={styles.fieldLabel}>
                ENGLISH PRODUCT TITLE *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Linen Dress"
                placeholderTextColor="#AAA"
                value={name}
                onChangeText={setName}
              />

              {/* PASHTO */}
              <Text style={styles.fieldLabel}>
                PASHTO PRODUCT TITLE *
              </Text>

              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'right' },
                ]}
                placeholder="د محصول نوم"
                placeholderTextColor="#AAA"
                value={namePs}
                onChangeText={setNamePs}
              />

              {/* DARI */}
              <Text style={styles.fieldLabel}>
                DARI PRODUCT TITLE *
              </Text>

              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'right' },
                ]}
                placeholder="نام محصول"
                placeholderTextColor="#AAA"
                value={nameFa}
                onChangeText={setNameFa}
              />

              {/* ================================================= */}
              {/* DESCRIPTION */}
              {/* ================================================= */}

              <Text style={styles.subLabel}>
                PRODUCT DESCRIPTION
              </Text>

              <Text style={styles.fieldLabel}>
                ENGLISH DESCRIPTION
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    height: 75,
                    textAlignVertical: 'top',
                  },
                ]}
                placeholder="Describe the product..."
                placeholderTextColor="#AAA"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.fieldLabel}>
                PASHTO DESCRIPTION
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    height: 75,
                    textAlign: 'right',
                    textAlignVertical: 'top',
                  },
                ]}
                placeholder="تفصیل په پښتو کې"
                placeholderTextColor="#AAA"
                multiline
                value={descriptionPs}
                onChangeText={setDescriptionPs}
              />

              <Text style={styles.fieldLabel}>
                DARI DESCRIPTION
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    height: 75,
                    textAlign: 'right',
                    textAlignVertical: 'top',
                  },
                ]}
                placeholder="توضیحات به دری"
                placeholderTextColor="#AAA"
                multiline
                value={descriptionFa}
                onChangeText={setDescriptionFa}
              />

              {/* ================================================= */}
              {/* PRICING */}
              {/* ================================================= */}

              <Text style={styles.subLabel}>
                PRICING
              </Text>

              <Text style={styles.fieldLabel}>
                BASE / WHOLESALE PRICE — USD *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="25.00"
                placeholderTextColor="#AAA"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.fieldLabel}>
                PROFIT MARGIN %
              </Text>

              <TextInput
                style={styles.input}
                placeholder="20"
                placeholderTextColor="#AAA"
                keyboardType="decimal-pad"
                value={profitPercentage}
                onChangeText={setProfitPercentage}
              />

              {price.trim() && (
                <View
                  style={{
                    backgroundColor: '#F7F7F7',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      fontWeight: '900',
                      color: '#888',
                      letterSpacing: 1,
                    }}
                  >
                    ESTIMATED RETAIL PRICE
                  </Text>

                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '900',
                      color: '#22C55E',
                      marginTop: 3,
                    }}
                  >
                    {getDisplayPrice(
                      price,
                      profitPercentage
                    )}
                  </Text>
                </View>
              )}

              {/* ================================================= */}
              {/* CATEGORY */}
              {/* ================================================= */}

              <Text style={styles.subLabel}>
                CATEGORY
              </Text>

              <Text style={styles.fieldLabel}>
                SELECT PRODUCT CATEGORY *
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingVertical: 4,
                  paddingBottom: 12,
                }}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catPickChip,
                      categoryId === cat.id &&
                        styles.catPickChipActive,
                      {
                        marginRight: 8,
                      },
                    ]}
                    onPress={() =>
                      setCategoryId(cat.id)
                    }
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        categoryId === cat.id &&
                          styles.catChipTextActive,
                      ]}
                    >
                      {cat.name?.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* ================================================= */}
              {/* MAIN PRODUCT IMAGE */}
              {/* ================================================= */}

              <Text style={styles.subLabel}>
                PRODUCT MEDIA
              </Text>

              <TouchableOpacity
                style={[
                  styles.navButton,
                  {
                    marginTop: 4,
                    marginBottom: 10,
                  },
                ]}
                onPress={pickImage}
              >
                <Ionicons
                  name={
                    imageUri
                      ? 'checkmark-circle-outline'
                      : 'image-outline'
                  }
                  size={16}
                  color="#000"
                />

                <Text style={styles.navButtonText}>
                  {imageUri
                    ? 'PRODUCT IMAGE READY'
                    : 'CHOOSE MAIN PRODUCT IMAGE'}
                </Text>
              </TouchableOpacity>

              {imageUri && (
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 14,
                    backgroundColor: '#F5F5F5',
                    marginBottom: 16,
                  }}
                  resizeMode="cover"
                />
              )}

              {/* ================================================= */}
              {/* COLORS */}
              {/* ================================================= */}

              <Text style={styles.subLabel}>
                PRODUCT COLORS
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  color: '#888',
                  marginBottom: 12,
                }}
              >
                Each color can have its own translations,
                HEX code and product image.
              </Text>

              {/* COLOR NAME */}
              <Text style={styles.fieldLabel}>
                ENGLISH COLOR NAME
              </Text>

              <TextInput
                style={styles.input}
                placeholder="BLACK"
                placeholderTextColor="#AAA"
                value={colorInput}
                onChangeText={setColorInput}
              />

              {/* PASHTO */}
              <Text style={styles.fieldLabel}>
                PASHTO COLOR NAME
              </Text>

              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'right' },
                ]}
                placeholder="تور"
                placeholderTextColor="#AAA"
                value={colorInputPs}
                onChangeText={setColorInputPs}
              />

              {/* DARI */}
              <Text style={styles.fieldLabel}>
                DARI COLOR NAME
              </Text>

              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'right' },
                ]}
                placeholder="سیاه"
                placeholderTextColor="#AAA"
                value={colorInputFa}
                onChangeText={setColorInputFa}
              />

              {/* HEX */}
              <Text style={styles.fieldLabel}>
                COLOR CODE — OPTIONAL
              </Text>

              <TextInput
                style={styles.input}
                placeholder="#000000"
                placeholderTextColor="#AAA"
                autoCapitalize="characters"
                value={colorCodeInput}
                onChangeText={setColorCodeInput}
              />

              {/* COLOR IMAGE */}
              <TouchableOpacity
                style={[
                  styles.navButton,
                  {
                    marginTop: 2,
                    marginBottom: 10,
                  },
                ]}
                onPress={pickColorImage}
              >
                <Ionicons
                  name={
                    colorImageUri
                      ? 'checkmark-circle-outline'
                      : 'color-palette-outline'
                  }
                  size={16}
                  color="#000"
                />

                <Text style={styles.navButtonText}>
                  {colorImageUri
                    ? 'COLOR IMAGE READY'
                    : 'CHOOSE COLOR IMAGE'}
                </Text>
              </TouchableOpacity>

              {colorImageUri && (
                <Image
                  source={{
                    uri: colorImageUri,
                  }}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 12,
                    marginBottom: 12,
                    backgroundColor: '#F5F5F5',
                  }}
                />
              )}

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={addColor}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color="#FFF"
                />

                <Text style={styles.submitBtnText}>
                  ADD COLOR
                </Text>
              </TouchableOpacity>

              {/* ================================================= */}
              {/* REGISTERED COLORS */}
              {/* ================================================= */}

              {productColors.length > 0 && (
                <View
                  style={{
                    marginTop: 16,
                    marginBottom: 10,
                  }}
                >
                  <Text style={styles.fieldLabel}>
                    REGISTERED COLORS
                  </Text>

                  {productColors.map(
                    (color, index) => (
                      <View
                        key={
                          color.id ||
                          `color-${index}`
                        }
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 10,
                          backgroundColor: '#FAFAFA',
                          borderWidth: 1,
                          borderColor: '#EAEAEA',
                          borderRadius: 12,
                          marginBottom: 8,
                        }}
                      >
                        {/* IMAGE */}
                        {(color.imageUrl ||
                          color.localImageUri) && (
                          <Image
                            source={{
                              uri:
                                color.imageUrl ||
                                color.localImageUri ||
                                '',
                            }}
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 9,
                              marginRight: 10,
                            }}
                          />
                        )}

                        {/* INFORMATION */}
                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '900',
                              color: '#000',
                            }}
                          >
                            {color.name}
                          </Text>

                          <Text
                            style={{
                              fontSize: 10,
                              color: '#777',
                              marginTop: 2,
                            }}
                          >
                            {color.nameFa ||
                              color.name}
                          </Text>

                          <Text
                            style={{
                              fontSize: 9,
                              color: '#999',
                              marginTop: 2,
                            }}
                          >
                            {color.colorCode ||
                              'NO HEX CODE'}
                          </Text>
                        </View>

                        {/* REMOVE */}
                        <TouchableOpacity
                          onPress={() => {
                            setProductColors(
                              prev =>
                                prev.filter(
                                  (_, i) =>
                                    i !== index
                                )
                            );
                          }}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                              '#FFF0F0',
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={15}
                            color="#FF3B30"
                          />
                        </TouchableOpacity>
                      </View>
                    )
                  )}
                </View>
              )}

              {/* ================================================= */}
              {/* SIZES */}
              {/* ================================================= */}

              <Text style={styles.subLabel}>
                PRODUCT SIZES
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  color: '#888',
                  marginBottom: 10,
                }}
              >
                Add any sizing system: S, M, L, XL,
                numeric sizes, shoes sizes, etc.
              </Text>

              <View style={styles.tagInputRow}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      marginBottom: 0,
                    },
                  ]}
                  placeholder="e.g. S, M, L, XL, 42..."
                  placeholderTextColor="#AAA"
                  value={sizeInput}
                  onChangeText={setSizeInput}
                  onSubmitEditing={addSize}
                />

                <TouchableOpacity
                  style={styles.addTagBtn}
                  onPress={addSize}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color="#FFF"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.tagCloud}>
                {availableSizes.map(
                  (size, index) => (
                    <TouchableOpacity
                      key={`size-${index}`}
                      onPress={() =>
                        removeSize(index)
                      }
                      style={styles.tag}
                    >
                      <Text style={styles.tagText}>
                        {size} ✕
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* ================================================= */}
              {/* DYNAMIC PRODUCT SPECIFICATION TABLE */}
              {/* ================================================= */}

              <View
                style={{
                  marginTop: 8,
                }}
              >
                <Text style={styles.subLabel}>
                  PRODUCT SPECIFICATION TABLE
                </Text>

                <Text
                  style={{
                    fontSize: 10,
                    color: '#888',
                    lineHeight: 15,
                    marginBottom: 12,
                  }}
                >
                  Build a completely custom specification
                  table. Add measurements such as waist,
                  chest, height, length, sleeve, weight,
                  material, or any other property required
                  for this product.
                </Text>

                {/* ============================================= */}
                {/* ADD SPECIFICATION */}
                {/* ============================================= */}

                <View
                  style={{
                    backgroundColor: '#FAFAFA',
                    borderWidth: 1,
                    borderColor: '#EAEAEA',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 14,
                  }}
                >
                  <Text style={styles.fieldLabel}>
                    ADD SPECIFICATION TO SIZE
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingVertical: 4,
                      gap: 8,
                    }}
                  >
                    {sizeGuideRows.map(
                      (row, index) => (
                        <TouchableOpacity
                          key={`measurement-size-${index}`}
                          onPress={() =>
                            setSelectedSizeForMeasurement(
                              index
                            )
                          }
                          style={[
                            styles.catPickChip,
                            selectedSizeForMeasurement ===
                              index &&
                              styles.catPickChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.catChipText,
                              selectedSizeForMeasurement ===
                                index &&
                                styles.catChipTextActive,
                            ]}
                          >
                            {row.size}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </ScrollView>

                  <TextInput
                    style={styles.input}
                    placeholder="Property name — e.g. waist, height, material"
                    placeholderTextColor="#AAA"
                    value={measurementNameInput}
                    onChangeText={
                      setMeasurementNameInput
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Value — e.g. 96 cm, Cotton, 1.2 kg"
                    placeholderTextColor="#AAA"
                    value={measurementValueInput}
                    onChangeText={
                      setMeasurementValueInput
                    }
                  />

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={addMeasurement}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={16}
                      color="#FFF"
                    />

                    <Text
                      style={
                        styles.submitBtnText
                      }
                    >
                      ADD SPECIFICATION
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ============================================= */}
                {/* TABLE */}
                {/* ============================================= */}

                {sizeGuideRows.length > 0 ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#E5E5E5',
                      borderRadius: 12,
                      overflow: 'hidden',
                      backgroundColor: '#FFF',
                    }}
                  >
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator
                    >
                      <View>

                        {/* TABLE HEADER */}

                        <View
                          style={{
                            flexDirection: 'row',
                            backgroundColor: '#F5F5F5',
                            borderBottomWidth: 1,
                            borderBottomColor:
                              '#E5E5E5',
                          }}
                        >
                          <View
                            style={{
                              width: 90,
                              padding: 10,
                              borderRightWidth: 1,
                              borderRightColor:
                                '#E5E5E5',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: '900',
                                color: '#555',
                                letterSpacing: 0.5,
                              }}
                            >
                              SIZE
                            </Text>
                          </View>

                          {Array.from(
                            new Set(
                              sizeGuideRows.flatMap(
                                row =>
                                  Object.keys(
                                    row.measurements ||
                                      {}
                                  )
                              )
                            )
                          ).map(
                            measurement => (
                              <View
                                key={
                                  measurement
                                }
                                style={{
                                  width: 125,
                                  padding: 10,
                                  borderRightWidth: 1,
                                  borderRightColor:
                                    '#E5E5E5',
                                }}
                              >
                                <View
                                  style={{
                                    flexDirection:
                                      'row',
                                    alignItems:
                                      'center',
                                    justifyContent:
                                      'space-between',
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 9,
                                      fontWeight:
                                        '900',
                                      color:
                                        '#555',
                                      textTransform:
                                        'uppercase',
                                    }}
                                  >
                                    {
                                      measurement
                                    }
                                  </Text>

                                  <TouchableOpacity
                                    onPress={() => {
                                      setSizeGuideRows(
                                        prev =>
                                          prev.map(
                                            row => {
                                              const updated =
                                                {
                                                  ...row.measurements,
                                                };

                                              delete updated[
                                                measurement
                                              ];

                                              return {
                                                ...row,
                                                measurements:
                                                  updated,
                                              };
                                            }
                                          )
                                      );
                                    }}
                                  >
                                    <Ionicons
                                      name="close-circle-outline"
                                      size={14}
                                      color="#999"
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )
                          )}
                        </View>

                        {/* TABLE ROWS */}

                        {sizeGuideRows.map(
                          (row, rowIndex) => {
                            const measurementKeys =
                              Array.from(
                                new Set(
                                  sizeGuideRows.flatMap(
                                    item =>
                                      Object.keys(
                                        item.measurements ||
                                          {}
                                      )
                                  )
                                )
                              );

                            return (
                              <View
                                key={`guide-row-${rowIndex}`}
                                style={{
                                  flexDirection:
                                    'row',
                                  borderBottomWidth:
                                    rowIndex <
                                    sizeGuideRows.length -
                                      1
                                      ? 1
                                      : 0,
                                  borderBottomColor:
                                    '#EEEEEE',
                                }}
                              >

                                {/* SIZE CELL */}

                                <View
                                  style={{
                                    width: 90,
                                    padding: 8,
                                    justifyContent:
                                      'center',
                                    borderRightWidth: 1,
                                    borderRightColor:
                                      '#EEEEEE',
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      fontWeight:
                                        '900',
                                      color:
                                        '#000',
                                    }}
                                  >
                                    {row.size}
                                  </Text>
                                </View>

                                {/* MEASUREMENT CELLS */}

                                {measurementKeys.map(
                                  key => (
                                    <View
                                      key={`${rowIndex}-${key}`}
                                      style={{
                                        width: 125,
                                        padding: 6,
                                        borderRightWidth:
                                          1,
                                        borderRightColor:
                                          '#EEEEEE',
                                      }}
                                    >
                                      <TextInput
                                        style={{
                                          height: 38,
                                          borderWidth: 1,
                                          borderColor:
                                            '#EAEAEA',
                                          borderRadius: 8,
                                          paddingHorizontal: 8,
                                          fontSize: 11,
                                          color:
                                            '#000',
                                          backgroundColor:
                                            '#FAFAFA',
                                        }}
                                        placeholder="—"
                                        placeholderTextColor="#BBB"
                                        value={
                                          row
                                            .measurements?.[
                                            key
                                          ] ||
                                          ''
                                        }
                                        onChangeText={value => {
                                          setSizeGuideRows(
                                            prev =>
                                              prev.map(
                                                (
                                                  currentRow,
                                                  currentIndex
                                                ) => {
                                                  if (
                                                    currentIndex !==
                                                    rowIndex
                                                  ) {
                                                    return currentRow;
                                                  }

                                                  return {
                                                    ...currentRow,
                                                    measurements:
                                                      {
                                                        ...currentRow.measurements,
                                                        [key]:
                                                          value,
                                                      },
                                                  };
                                                }
                                              )
                                          );
                                        }}
                                      />
                                    </View>
                                  )
                                )}
                              </View>
                            );
                          }
                        )}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <View
                    style={{
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: '#DDD',
                      borderRadius: 12,
                      padding: 20,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={24}
                      color="#AAA"
                    />

                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: '#888',
                        marginTop: 8,
                        textAlign: 'center',
                      }}
                    >
                      Add product sizes above to build
                      the specification table.
                    </Text>
                  </View>
                )}
              </View>

              {/* ================================================= */}
              {/* FORM ACTIONS */}
              {/* ================================================= */}

              <View
                style={styles.formActionsRow}
              >
                {editingId && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={resetForm}
                  >
                    <Ionicons
                      name="close-outline"
                      size={15}
                      color="#666"
                    />

                    <Text
                      style={styles.cancelBtnText}
                    >
                      CANCEL
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFF"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          editingId
                            ? 'save-outline'
                            : 'checkmark-circle-outline'
                        }
                        size={15}
                        color="#FFF"
                      />

                      <Text
                        style={
                          styles.submitBtnText
                        }
                      >
                        {editingId
                          ? 'UPDATE PRODUCT'
                          : 'CREATE PRODUCT'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* =================================================== */}
            {/* CATALOG SECTION */}
            {/* =================================================== */}

            <View
              style={{
                marginTop: 20,
                marginBottom: 10,
              }}
            >
              <Text style={styles.heading}>
                CATALOG ITEMS
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  color: '#888',
                  marginTop: 3,
                }}
              >
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1
                  ? 'product'
                  : 'products'}{' '}
                currently visible.
              </Text>
            </View>

          </View>
        }

        ListFooterComponent={
          loadingMore ? (
            <View style={{ padding: 16 }}>
              <ActivityIndicator />
            </View>
          ) : null
        }

        renderItem={({ item }) => (
          <View
            style={[
              styles.productManifestCard,
              {
                marginHorizontal: 16,
                marginBottom: 10,
              },
            ]}
          >

            {/* ================================================= */}
            {/* IMAGE */}
            {/* ================================================= */}

            <View style={styles.imageColumn}>

              {item.imageUrl ? (
                <Image
                  source={{
                    uri: item.imageUrl,
                  }}
                  style={styles.cardImageThumb}
                />
              ) : (
                <View
                  style={[
                    styles.cardImageThumb,
                    {
                      justifyContent:
                        'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={22}
                    color="#BBB"
                  />
                </View>
              )}

              {/* COLOR COUNT */}
              {Array.isArray(
                item.colors
              ) &&
                item.colors.length > 0 && (
                  <View
                    style={{
                      marginTop: 7,
                      alignItems:
                        'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: '800',
                        color: '#888',
                      }}
                    >
                      {item.colors.length}{' '}
                      COLORS
                    </Text>
                  </View>
                )}
            </View>

            {/* ================================================= */}
            {/* INFORMATION */}
            {/* ================================================= */}

            <View
              style={styles.cardInfoBlock}
            >

              <Text
                style={styles.cardTitle}
                numberOfLines={2}
              >
                {item.name?.toUpperCase()}
              </Text>

              {item.nameFa && (
                <Text
                  style={
                    styles.itemSubTitleTranslation
                  }
                  numberOfLines={1}
                >
                  {item.nameFa}
                </Text>
              )}

              <Text
                style={[
                  styles.cardPrice,
                  {
                    marginTop: 8,
                  },
                ]}
              >
                {getDisplayPrice(
                  item.usdPrice,
                  item.profitPercentage
                )}
              </Text>

              <Text
                style={styles.cardWholesale}
              >
                Base cost: $
                {item.usdPrice} USD
              </Text>

              {/* SIZE / COLOR SUMMARY */}

              <View
                style={{
                  flexDirection:
                    'row',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {Array.isArray(
                  item.availableSizes
                ) &&
                  item.availableSizes
                    .slice(0, 5)
                    .map(
                      (
                        size: string,
                        index: number
                      ) => (
                        <View
                          key={`size-${index}`}
                          style={{
                            backgroundColor:
                              '#F4F4F5',
                            paddingHorizontal:
                              7,
                            paddingVertical:
                              4,
                            borderRadius:
                              7,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 8,
                              fontWeight:
                                '800',
                              color:
                                '#555',
                            }}
                          >
                            {size}
                          </Text>
                        </View>
                      )
                    )}
              </View>

              {/* ================================================= */}
              {/* ACTIONS */}
              {/* ================================================= */}

         {/* ================================================= */}
{/* ACTIONS */}
{/* ================================================= */}

<View
  style={
    styles.cardButtonsActionArea
  }
>
  {/* EDIT */}

  <TouchableOpacity
    style={styles.editBtn}
    onPress={() =>
      handleEdit(item)
    }
  >
    <Ionicons
      name="pencil-outline"
      size={14}
      color="#000"
    />

    <Text
      style={
        styles.editBtnText
      }
    >
      EDIT
    </Text>
  </TouchableOpacity>


  {/* DIVIDER */}

  <View
    style={{
      width: 1,
      height: 16,
      backgroundColor: '#E5E5E5',
      marginHorizontal: 12,
    }}
  />


  {/* SHARE */}

  <TouchableOpacity
    style={styles.shareBtn}
    onPress={() =>
      handleShareProduct(item)
    }
  >
    <Ionicons
      name="share-outline"
      size={14}
      color="#007AFF"
    />

    <Text
      style={styles.shareBtnText}
    >
      SHARE
    </Text>
  </TouchableOpacity>


  {/* DIVIDER */}

  <View
    style={{
      width: 1,
      height: 16,
      backgroundColor: '#E5E5E5',
      marginHorizontal: 12,
    }}
  />


  {/* REMOVE */}

  <TouchableOpacity
    style={styles.deleteBtn}
    onPress={() =>
      handleDelete(item.id)
    }
  >
    <Ionicons
      name="trash-outline"
      size={14}
      color="#FF3B30"
    />

    <Text
      style={
        styles.deleteBtnText
      }
    >
      REMOVE
    </Text>
  </TouchableOpacity>
</View>
            </View>
          </View>
        )}

        ListEmptyComponent={
          !loading ? (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 20,
                padding: 35,
                alignItems: 'center',
                backgroundColor: '#FFF',
                borderWidth: 1,
                borderColor: '#EAEAEA',
                borderRadius: 16,
              }}
            >
              <Ionicons
                name="cube-outline"
                size={28}
                color="#BBB"
              />

              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '900',
                  color: '#555',
                  marginTop: 10,
                }}
              >
                NO PRODUCTS FOUND
              </Text>

              <Text
                style={{
                  fontSize: 9,
                  color: '#999',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                Create your first product using
                the form above.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  </KeyboardAvoidingView>
);
}

// 🎯 COMPLETE PRODUCTION STYLESHEET WITH ALL DEFINED CONFIGURATIONS
const styles = StyleSheet.create({
  // =========================================================
  // GLOBAL PAGE
  // =========================================================

  container: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },

  // =========================================================
  // PAGE HEADER
  // =========================================================

  heading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -0.6,
    marginBottom: 16,
  },

  // =========================================================
  // SEARCH
  // =========================================================

  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',

    height: 48,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E3E3E5',

    paddingHorizontal: 15,

    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,

    borderRadius: 12,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 3,

    elevation: 1,
  },

  searchInput: {
    flex: 1,

    marginLeft: 10,

    fontSize: 13,
    fontWeight: '600',

    color: '#111111',
  },

  // =========================================================
  // NAVIGATION
  // =========================================================

  navRow: {
    marginBottom: 14,
  },

  navButton: {
    minHeight: 44,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#DDDDDF',

    paddingHorizontal: 16,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 11,
  },

  navButtonText: {
    fontSize: 10,
    fontWeight: '900',

    color: '#111111',

    letterSpacing: 0.8,
  },

  // =========================================================
  // FORM CARD
  // =========================================================

  formCard: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E1E1E3',

    padding: 18,

    marginBottom: 18,

    borderRadius: 16,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 6,

    elevation: 1,
  },

  formTitle: {
    fontSize: 16,
    fontWeight: '900',

    color: '#111111',

    letterSpacing: -0.2,

    marginBottom: 20,

    paddingBottom: 13,

    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEF',
  },

  // =========================================================
  // FIELD LABELS
  // =========================================================

  fieldLabel: {
    fontSize: 9,
    fontWeight: '900',

    color: '#555555',

    letterSpacing: 0.9,

    textTransform: 'uppercase',

    marginBottom: 7,

    marginTop: 2,
  },

  subLabel: {
    fontSize: 9,
    fontWeight: '900',

    color: '#333333',

    letterSpacing: 0.9,

    textTransform: 'uppercase',

    marginTop: 18,
    marginBottom: 9,
  },

  itemSubTitleTranslation: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 3,
  },

  // =========================================================
  // INPUTS
  // =========================================================

  input: {
    minHeight: 44,

    backgroundColor: '#FAFAFA',

    borderWidth: 1,
    borderColor: '#E1E1E3',

    borderRadius: 10,

    paddingHorizontal: 12,
    paddingVertical: 10,

    fontSize: 13,
    fontWeight: '600',

    color: '#111111',

    marginBottom: 14,
  },

  dualInputRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // =========================================================
  // MULTILINGUAL INPUT GRID
  // =========================================================

  multilingualColorRow: {
    flexDirection: 'row',

    gap: 8,

    marginTop: 4,
    marginBottom: 10,
  },

  multilingualInputSubCell: {
    flex: 1,

    height: 42,

    backgroundColor: '#FAFAFA',

    borderWidth: 1,
    borderColor: '#E1E1E3',

    borderRadius: 9,

    paddingHorizontal: 10,

    fontSize: 12,

    fontWeight: '600',

    color: '#111111',
  },

  // =========================================================
  // TAG INPUT
  // =========================================================

  tagInputRow: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

    marginBottom: 10,
  },

  addTagBtn: {
    width: 42,
    height: 42,

    backgroundColor: '#111111',

    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: 10,
  },

  addTagText: {
    color: '#FFFFFF',

    fontSize: 20,

    fontWeight: '800',

    lineHeight: 20,
  },

  tagCloud: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 7,

    marginBottom: 4,
  },

  tag: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#F1F1F2',

    paddingHorizontal: 11,
    paddingVertical: 8,

    borderWidth: 1,
    borderColor: '#E2E2E4',

    borderRadius: 9,
  },

  tagText: {
    fontSize: 9,

    fontWeight: '800',

    color: '#222222',

    letterSpacing: 0.2,
  },

  // =========================================================
  // CATEGORY PICKER
  // =========================================================

  catPickerRow: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 8,

    marginBottom: 16,
  },

  catPickChip: {
    backgroundColor: '#F5F5F6',

    paddingHorizontal: 13,
    paddingVertical: 9,

    borderWidth: 1,
    borderColor: '#DDDDDF',

    borderRadius: 10,
  },

  catPickChipActive: {
    backgroundColor: '#111111',

    borderColor: '#111111',
  },

  catChipText: {
    fontSize: 9,

    fontWeight: '800',

    color: '#666666',

    letterSpacing: 0.4,
  },

  catChipTextActive: {
    color: '#FFFFFF',
  },

  // =========================================================
  // FORM ACTIONS
  // =========================================================

  formActionsRow: {
    flexDirection: 'row',

    gap: 9,

    marginTop: 22,

    paddingTop: 16,

    borderTopWidth: 1,
    borderTopColor: '#EEEEEF',
  },

  cancelBtn: {
    flex: 1,

    minHeight: 46,

    paddingVertical: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#D7D7D9',

    borderRadius: 10,
  },

  cancelBtnText: {
    fontSize: 10,

    fontWeight: '900',

    color: '#666666',

    letterSpacing: 0.7,
  },

  submitBtn: {
    flex: 2,

    minHeight: 46,

    backgroundColor: '#111111',

    paddingVertical: 13,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,
  },

  submitBtnText: {
    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '900',

    letterSpacing: 1,
  },

  // =========================================================
  // PRODUCT MANIFEST CARD
  // =========================================================

  productManifestCard: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E2E4',

    borderRadius: 15,

    padding: 12,

    marginHorizontal: 16,
    marginBottom: 10,

    flexDirection: 'row',

    alignItems: 'flex-start',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 1,
    },

    shadowOpacity: 0.025,

    shadowRadius: 4,

    elevation: 1,
  },

  // =========================================================
  // PRODUCT IMAGE AREA
  // =========================================================

  imageColumn: {
    width: 86,

    marginRight: 14,
  },

  cardImageThumb: {
    width: 86,
    height: 112,

    borderRadius: 11,

    backgroundColor: '#F1F1F2',

    resizeMode: 'cover',
  },

  colorThumbRow: {
    paddingTop: 8,

    paddingRight: 2,
  },

  colorThumb: {
    width: 38,
    height: 38,

    borderRadius: 8,

    marginRight: 6,

    backgroundColor: '#F1F1F2',

    borderWidth: 1,
    borderColor: '#E4E4E5',
  },

  // =========================================================
  // PRODUCT INFORMATION
  // =========================================================

  cardInfoBlock: {
    flex: 1,

    minHeight: 112,

    justifyContent: 'space-between',
  },

  cardTitle: {
    fontSize: 13,

    fontWeight: '900',

    color: '#111111',

    letterSpacing: 0.1,

    marginBottom: 5,
  },

  cardPrice: {
    fontSize: 16,

    fontWeight: '900',

    color: '#111111',

    letterSpacing: -0.3,

    marginBottom: 3,
  },

  cardWholesale: {
    fontSize: 10,

    fontWeight: '600',

    color: '#888888',

    marginTop: 1,
  },

  // =========================================================
  // PRODUCT ACTIONS
  // =========================================================

  cardButtonsActionArea: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

    marginTop: 12,

    paddingTop: 10,

    borderTopWidth: 1,
    borderTopColor: '#EEEEEF',
  },

  editBtn: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    minHeight: 34,

    paddingHorizontal: 11,

    backgroundColor: '#F3F3F4',

    borderWidth: 1,
    borderColor: '#E1E1E2',

    borderRadius: 8,

    gap: 5,
  },

  editBtnText: {
    fontSize: 9,

    fontWeight: '900',

    color: '#111111',

    letterSpacing: 0.5,
  },

  deleteBtn: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    minHeight: 34,

    paddingHorizontal: 11,

    backgroundColor: '#FFF7F7',

    borderWidth: 1,
    borderColor: '#FFE1E1',

    borderRadius: 8,

    gap: 5,
  },

  deleteBtnText: {
    fontSize: 9,

    fontWeight: '900',

    color: '#E53935',

    letterSpacing: 0.5,
  },
shareBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},

shareBtnText: {
  marginLeft: 5,
  fontSize: 12,
  fontWeight: '700',
  color: '#007AFF',
},

});