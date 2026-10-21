import {
  View,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import React, {useState, useEffect} from 'react'
import { API_URL } from '@/lib/config';



const Advertisements = () => {
const [products, setProducts] = useState<any[]>([]);
const [categories, setCategories] = useState<any[]>([]);
const [ads, setAds] = useState<any[]>([]);
const [selectedProduct, setSelectedProduct] = useState<any>(null);
const [editingAd, setEditingAd] = useState<any>(null);
const [title, setTitle] = useState("");
const [titlePs, setTitlePs] = useState("");
const [titleFa, setTitleFa] = useState("");

const [subtitle, setSubtitle] = useState("");
const [subtitlePs, setSubtitlePs] = useState("");
const [subtitleFa, setSubtitleFa] = useState("");

const [sortOrder, setSortOrder] = useState("0");

const [saving, setSaving] = useState(false);
const [productModalVisible, setProductModalVisible] = useState(false);
const [productSearch, setProductSearch] = useState("");
const [selectedCategoryId, setSelectedCategoryId] = useState("");
const [categoriesLoading, setCategoriesLoading] = useState(false);

const closeProductModal = () => {
  setProductModalVisible(false);
};

const loadData = async () => {
  try {
    const [productsRes, adsRes] = await Promise.all([
      fetch(`${API_URL}/advertisements/available-products`),
      fetch(`${API_URL}/admin/advertisements`)
    ]);

    const productsData = await productsRes.json();
    const adsData = await adsRes.json();

setProducts(Array.isArray(productsData) ? productsData : []);
    setAds(Array.isArray(adsData) ? adsData : []);
  } catch (err) {
    console.log("loadData error:", err);
  }
};
useEffect(() => {
  loadData();
}, []);

const openProductModal = async () => {
  setProductSearch("");
  setSelectedCategoryId("");
  setProductModalVisible(true);

  if (categories.length > 0) {
    return;
  }

  try {
    setCategoriesLoading(true);
    const response = await fetch(`${API_URL}/api/admin/categories`);

    if (!response.ok) {
      throw new Error(`Categories request failed: ${response.status}`);
    }

    const data = await response.json();
    setCategories(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Failed to load categories for product selector:", error);
    Alert.alert("Error", "Unable to load product categories.");
  } finally {
    setCategoriesLoading(false);
  }
};

const filteredProducts = products.filter((product) => {
  const matchesCategory =
    !selectedCategoryId || product.categoryId === selectedCategoryId;
  const category = categories.find((item) => item.id === product.categoryId);
  const searchContent = [
    ...Object.values(product),
    category?.name,
    category?.namePs,
    category?.nameFa,
  ]
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(" ")
    .toLocaleLowerCase();
  const matchesSearch = searchContent.includes(productSearch.trim().toLocaleLowerCase());

  return matchesCategory && matchesSearch;
});

const saveAdvertisement = async () => {
  if (!selectedProduct?.id) return;

  setSaving(true);

  try {
    const payload = {
      productId: selectedProduct.id,
      title,
      titlePs,
      titleFa,
      subtitle,
      subtitlePs,
      subtitleFa,
      sortOrder: Number(sortOrder || 0),
    };

    const isEditing = !!editingAd;

    const url = isEditing
      ? `${API_URL}/advertisements/${editingAd.id}`
      : `${API_URL}/advertisements`;

    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      throw new Error(errorBody?.error || "Failed to save advertisement");
    }

    Alert.alert(
      "Success",
      isEditing ? "Advertisement updated" : "Advertisement created"
    );

    resetForm();
    await loadData();
  } catch {
    Alert.alert("Error");
  } finally {
    setSaving(false);
  }
};

const toggleAdStatus = async (ad: any) => {
  try {
    await fetch(
      `${API_URL}/admin/advertisements/${ad.id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !ad.isActive,
        }),
      }
    );

    await loadData();
  } catch (e) {
    console.log("status error", e);
  }
};

const startEdit = (ad: any) => {
  setEditingAd(ad);

  const product = products.find(
    (p) => p.id === ad.productId
  );

  setSelectedProduct(product || null);

  setTitle(ad.title || "");
  setTitlePs(ad.titlePs || "");
  setTitleFa(ad.titleFa || "");

  setSubtitle(ad.subtitle || "");
  setSubtitlePs(ad.subtitlePs || "");
  setSubtitleFa(ad.subtitleFa || "");

  setSortOrder(String(ad.sortOrder || 0));
};

const resetForm = () => {
  setEditingAd(null);
  setSelectedProduct(null);

  setTitle("");
  setTitlePs("");
  setTitleFa("");

  setSubtitle("");
  setSubtitlePs("");
  setSubtitleFa("");

  setSortOrder("0");
};

const createAdvertisement = async () => {
  if (!selectedProduct?.id) {
    Alert.alert("Select Product");
    return;
  }

  try {
    setSaving(true);

    const res = await fetch(
      `${API_URL}/advertisements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct.id,

          title,
          titlePs,
          titleFa,

          subtitle,
          subtitlePs,
          subtitleFa,

          sortOrder: Number(sortOrder || 0),
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Creation failed");
    }

    Alert.alert("Success", "Advertisement created");

    await loadData();
resetForm();
    setTitle("");
    setTitlePs("");
    setTitleFa("");

    setSubtitle("");
    setSubtitlePs("");
    setSubtitleFa("");

    setSortOrder("0");
  } catch {
    Alert.alert("Error");
  } finally {
    setSaving(false);
  }
};



const deleteAdvertisement = async (id: string) => {
  Alert.alert(
    "Delete Advertisement",
    "Are you sure?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await fetch(
            `${API_URL}/advertisements/${id}`,
            {
              method: "DELETE",
            }
          );

          await loadData();
        
resetForm();
        },
      },
    ]
  );
};


return (
      <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        ADVERTISEMENT MANAGEMENT
      </Text>
    </View>

    <ScrollView
      style={styles.scrollFormWindow}
      contentContainerStyle={styles.scrollContentLayoutContainer}
      showsVerticalScrollIndicator={false}
    >

      {/* CREATE AD */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {editingAd ? "EDIT ADVERTISEMENT" : "CREATE NEW ADVERTISEMENT"}
        </Text>
<TouchableOpacity
  style={styles.productSelector}
  onPress={openProductModal}
>
  <Text style={styles.productSelectorText}>
    {selectedProduct
      ? selectedProduct.name
      : "Choose Product"}
  </Text>
</TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="English Title"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Pashto Title"
          value={titlePs}
          onChangeText={setTitlePs}
        />

        <TextInput
          style={styles.input}
          placeholder="Dari Title"
          value={titleFa}
          onChangeText={setTitleFa}
        />

        <TextInput
          style={styles.input}
          placeholder="English Subtitle"
          value={subtitle}
          onChangeText={setSubtitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Pashto Subtitle"
          value={subtitlePs}
          onChangeText={setSubtitlePs}
        />

        <TextInput
          style={styles.input}
          placeholder="Dari Subtitle"
          value={subtitleFa}
          onChangeText={setSubtitleFa}
        />

        <TextInput
          style={styles.input}
          placeholder="Sort Order"
          keyboardType="numeric"
          value={sortOrder}
          onChangeText={setSortOrder}
        />

        <TouchableOpacity
          style={styles.saveBtn}
          disabled={saving}
          onPress={saveAdvertisement}
        >
          <Text style={styles.saveBtnText}>
           {saving
  ? editingAd
    ? "UPDATING..."
    : "CREATING..."
  : editingAd
  ? "UPDATE ADVERTISEMENT"
  : "CREATE ADVERTISEMENT"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIVE PREVIEW */}
      {selectedProduct && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            LIVE PREVIEW
          </Text>

          <View style={styles.advertisementPreviewCard}>
            <Image
              source={{
                uri: selectedProduct.imageUrl,
              }}
              style={styles.previewImage}
            />

            <View style={styles.previewContent}>
              <Text style={styles.previewTitle}>
                {title || "Advertisement Title"}
              </Text>

              <Text style={styles.previewSubtitle}>
                {subtitle || "Advertisement Subtitle"}
              </Text>

              <Text style={styles.previewProductName}>
                {selectedProduct.name}
              </Text>

              <Text style={styles.previewPrice}>
                ${selectedProduct.usdPrice}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* EXISTING ADS */}
      <Text style={styles.sectionTitle}>
        EXISTING ADVERTISEMENTS
      </Text>

    {Array.isArray(ads) &&
  ads.map((ad) => (
  <View key={ad.id} style={styles.adCard}>

    <Image
      source={{ uri: ad.imageUrl }}
      style={styles.adCardImage}
    />

    <View style={styles.adCardContent}>
      <Text style={styles.adCardTitle}>
        {ad.title}
      </Text>

      <Text style={styles.adCardSubtitle}>
        {ad.subtitle}
      </Text>

      <Text style={styles.adCardMeta}>
        Product: {ad.name}
      </Text>

      <Text style={styles.adCardMeta}>
        Sort Order: {ad.sortOrder}
      </Text>

      {/* ACTIONS */}
      <View style={styles.actionRow}>

        {/* EDIT */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => startEdit(ad)}
        >
          <Text style={styles.editText}>EDIT</Text>
        </TouchableOpacity>

        {/* ENABLE / DISABLE */}
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            !ad.isActive && {
              backgroundColor: "#999",
            },
          ]}
          onPress={async () => {
           await fetch(
  `${API_URL}/admin/advertisements/${ad.id}/status`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isActive: !ad.isActive,
    }),
  }
);
            await loadData();
          }}
        >
          <Text style={styles.toggleText}>
            {ad.isActive ? "ACTIVE" : "DISABLED"}
          </Text>
        </TouchableOpacity>

        {/* DELETE */}
        <TouchableOpacity
          style={styles.deleteAdBtn}
          onPress={() => deleteAdvertisement(ad.id)}
        >
          <Text style={styles.deleteAdBtnText}>
            DELETE
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  </View>
))}
    </ScrollView>
  </View>
  <Modal
    visible={productModalVisible}
    transparent
    animationType="fade"
    presentationStyle="overFullScreen"
    onRequestClose={closeProductModal}
  >
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>

      {/* HEADER */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          SELECT PRODUCT
        </Text>

        <TouchableOpacity
          onPress={closeProductModal}
          accessibilityRole="button"
          accessibilityLabel="Close product selector"
        >
          <Text style={styles.modalClose}>✕</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.productSearchInput}
        placeholder="Search products..."
        value={productSearch}
        onChangeText={setProductSearch}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilters}
        contentContainerStyle={styles.categoryFiltersContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryFilter,
            !selectedCategoryId && styles.categoryFilterSelected,
          ]}
          onPress={() => setSelectedCategoryId("")}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.categoryFilterText,
              !selectedCategoryId && styles.categoryFilterTextSelected,
            ]}
          >
            All categories
          </Text>
        </TouchableOpacity>
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryFilter,
                isSelected && styles.categoryFilterSelected,
              ]}
              onPress={() => setSelectedCategoryId(category.id)}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.categoryFilterText,
                  isSelected && styles.categoryFilterTextSelected,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {categoriesLoading && (
        <Text style={styles.categoryLoading}>Loading categories...</Text>
      )}

      {/* PRODUCT LIST */}
      <ScrollView
        style={styles.productList}
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.length > 0 ? filteredProducts.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.productItem}
            onPress={() => {
              setSelectedProduct(p);
              closeProductModal();
            }}
          >
            <Image
              source={{ uri: p.imageUrl }}
              style={styles.productThumb}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>
                {p.name}
              </Text>

              <Text style={styles.productPrice}>
                ${p.usdPrice}
              </Text>
            </View>
          </TouchableOpacity>
        )) : (
          <Text style={styles.emptyProducts}>No products match your filters.</Text>
        )}
      </ScrollView>
    </View>
  </View>
  </Modal>
  </KeyboardAvoidingView>
)}



const styles = StyleSheet.create({
advertisementPreviewCard: {
  backgroundColor: "#fff",
  borderRadius: 18,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#eee",
  marginTop: 10,
},

previewImage: {
  width: "100%",
  height: 180,
},

previewContent: {
  padding: 16,
},

previewTitle: {
  fontSize: 18,
  fontWeight: "900",
  marginBottom: 4,
},

previewSubtitle: {
  fontSize: 13,
  color: "#666",
  marginBottom: 10,
},

previewProductName: {
  fontSize: 14,
  fontWeight: "800",
},
container: {
  flex: 1,
  backgroundColor: "#F7F7F8",
},

header: {
  paddingTop: 60,
  paddingBottom: 14,
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  borderBottomWidth: 1,
  borderBottomColor: "#EEEEEE",
},

headerTitle: {
  fontSize: 14,
  fontWeight: "900",
  letterSpacing: 2,
  color: "#000000",
},

scrollFormWindow: {
  flex: 1,
},

scrollContentLayoutContainer: {
  padding: 18,
  paddingBottom: 120,
},

formCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  padding: 16,
  borderWidth: 1,
  borderColor: "#EEEEEE",
  marginBottom: 18,
},

formTitle: {
  fontSize: 12,
  fontWeight: "900",
  letterSpacing: 1,
  color: "#000000",
  marginBottom: 14,
},
modalOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,

  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
},

modalContainer: {
  width: "100%",
  maxWidth: 560,
  height: "80%",
  maxHeight: "85%",
  backgroundColor: "#fff",
  borderRadius: 18,
  padding: 14,
},

modalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
},

modalTitle: {
  fontSize: 14,
  fontWeight: "900",
},

productSearchInput: {
  borderWidth: 1,
  borderColor: "#eee",
  borderRadius: 10,
  backgroundColor: "#fff",
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginBottom: 10,
  fontSize: 13,
},

categoryFilters: {
  height: 42,
  flexGrow: 0,
  flexShrink: 0,
  marginBottom: 8,
},

categoryFiltersContent: {
  flexDirection: "row",
  alignItems: "center",
  paddingRight: 4,
},

categoryFilter: {
  flexShrink: 0,
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 16,
  paddingHorizontal: 12,
  minHeight: 32,
  justifyContent: "center",
  marginRight: 8,
},

categoryFilterSelected: {
  backgroundColor: "#111",
  borderColor: "#111",
},

categoryFilterText: {
  color: "#333",
  fontSize: 12,
  fontWeight: "700",
  flexShrink: 0,
},

categoryFilterTextSelected: {
  color: "#fff",
},

categoryLoading: {
  color: "#666",
  fontSize: 12,
  marginBottom: 8,
},

emptyProducts: {
  color: "#666",
  fontSize: 13,
  paddingVertical: 18,
  textAlign: "center",
},

productList: {
  flex: 1,
  minHeight: 0,
},

modalClose: {
  fontSize: 18,
  fontWeight: "900",
},

productItem: {
  flexDirection: "row",
  padding: 10,
  borderBottomWidth: 1,
  borderColor: "#eee",
  alignItems: "center",
},

productThumb: {
  width: 50,
  height: 50,
  borderRadius: 10,
  marginRight: 10,
},

productName: {
  fontSize: 13,
  fontWeight: "800",
  color: "#111",
},

productPrice: {
  fontSize: 12,
  color: "#666",
  marginTop: 4,
},

actionRow: {
  flexDirection: "row",
  gap: 8,
  marginTop: 10,
},

editBtn: {
  backgroundColor: "#111",
  padding: 8,
  borderRadius: 8,
},

editText: {
  color: "#fff",
  fontSize: 10,
  fontWeight: "900",
},

toggleBtn: {
  backgroundColor: "#2ecc71",
  padding: 8,
  borderRadius: 8,
},

toggleText: {
  color: "#fff",
  fontSize: 10,
  fontWeight: "900",
},
label: {
  fontSize: 10,
  fontWeight: "800",
  color: "#666666",
  marginBottom: 6,
  letterSpacing: 0.5,
},

input: {
  borderWidth: 1,
  borderColor: "#EEEEEE",
  borderRadius: 12,
  backgroundColor: "#FFFFFF",
  paddingHorizontal: 14,
  paddingVertical: 12,
  marginBottom: 12,
  fontSize: 13,
  fontWeight: "600",
  color: "#000000",
},

saveBtn: {
  backgroundColor: "#000000",
  borderRadius: 14,
  paddingVertical: 15,
  alignItems: "center",
  justifyContent: "center",
  marginTop: 8,
},

saveBtnText: {
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: "900",
  letterSpacing: 1.5,
},

sectionTitle: {
  fontSize: 11,
  fontWeight: "900",
  textAlign: "center",
  color: "#000000",
  letterSpacing: 1.5,
  marginTop: 6,
  marginBottom: 14,
},
previewPrice: {
  fontSize: 13,
  color: "#000",
  marginTop: 4,
},

productSelector: {
  borderWidth: 1,
  borderColor: "#eee",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 14,
  marginBottom: 14,
  backgroundColor: "#fff",
},

productSelectorText: {
  fontWeight: "700",
},

adCard: {
  backgroundColor: "#fff",
  borderRadius: 14,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#eee",
  marginBottom: 14,
},

adCardImage: {
  width: "100%",
  height: 150,
},

adCardContent: {
  padding: 14,
},

adCardTitle: {
  fontSize: 14,
  fontWeight: "900",
},

adCardSubtitle: {
  fontSize: 12,
  color: "#666",
  marginTop: 4,
},

adCardMeta: {
  fontSize: 11,
  color: "#888",
  marginTop: 6,
},

deleteAdBtn: {
  backgroundColor: "#FF3B30",
  borderRadius: 10,
  paddingVertical: 10,
  alignItems: "center",
   padding: 8,
},

deleteAdBtnText: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 11,
  letterSpacing: 1,
}})

export default Advertisements