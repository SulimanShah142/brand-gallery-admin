import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadImage } from '@/lib/uploadthing';
import { API_URL } from '@/lib/config';

function Subcategories() {
  const router = useRouter();
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState<string | null>(null);
  const [subcategoryProducts, setSubcategoryProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    loadSubcategories();
    loadCategories();
  }, []);

  const loadSubcategories = async () => {
    console.log('📥 Loading subcategories...');
    try {
      const res = await fetch(`${API_URL}/api/admin/subcategories`);
      console.log('📡 Subcategories response status:', res.status);
      const data = await res.json();
      console.log('📦 Subcategories data received:', data?.length || 0, 'items');
      setSubcategories(data || []);
      console.log('✅ Subcategories loaded successfully');
    } catch (error) {
      console.error('❌ Error loading subcategories:', error);
      Alert.alert('Error', 'Unable to load subcategories');
    }
  };

  const loadCategories = async () => {
    console.log('📥 Loading parent categories...');
    try {
      const res = await fetch(`${API_URL}/api/admin/categories`);
      console.log('📡 Parent categories response status:', res.status);
      const data = await res.json();
      console.log('📦 Parent categories data received:', data?.length || 0, 'items');
      setCategories((data || []).filter((cat: any) => !cat.parentId));
      console.log('✅ Parent categories loaded successfully');
    } catch (error) {
      console.error('❌ Error loading parent categories:', error);
      Alert.alert('Error', 'Unable to load categories');
    }
  };

  const pickImage = async () => {
    console.log('📸 Picking subcategory image...');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.3,
      });
      console.log('📸 Image picker result:', result.canceled ? 'cancelled' : 'selected');

      if (!result.canceled) {
        const asset = result.assets[0];
        console.log('🖼️ Processing subcategory image:', asset.uri);
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 600 } }],
          { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG },
        );
        console.log('✅ Subcategory image processed:', manipulated.uri);
        setImageUri(manipulated.uri);
      }
    } catch (error) {
      console.error('❌ Error picking subcategory image:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setImageUri(null);
    setParentId(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !parentId) {
      console.log('⚠️ Validation failed: missing required fields');
      return Alert.alert('Validation', 'Name and parent category are required');
    }

    console.log('💾 Saving subcategory:', { name, description, parentId, editingId });
    setLoading(true);

    try {
      let imageUrl = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        console.log('🖼️ Uploading subcategory image...');
        imageUrl = await uploadImage(imageUri);
        console.log('✅ Subcategory image uploaded:', imageUrl);
      }

      const payload = {
        name,
        description,
        imageUrl,
        parentId,
      };
      console.log('📤 Save payload:', payload);

      const url = editingId
        ? `${API_URL}/api/admin/subcategories/${editingId}`
        : `${API_URL}/api/admin/subcategories`;
      const method = editingId ? 'PATCH' : 'POST';
      console.log('🔗 Request:', method, url);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('📡 Save response status:', res.status);

      if (!res.ok) {
        const err = await res.json();
        console.error('❌ Save failed:', err);
        throw new Error(err?.error || 'Save failed');
      }

      console.log('✅ Subcategory saved successfully');
      await loadSubcategories();
      resetForm();
      Alert.alert('Success', `Subcategory ${editingId ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('❌ Error saving subcategory:', error);
      Alert.alert('Error', (error as Error).message || 'Unable to save subcategory');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    console.log('✏️ Editing subcategory:', item.id, item.name);
    setEditingId(item.id);
    setName(item.name || '');
    setDescription(item.description || '');
    setImageUri(item.imageUrl || null);
    setParentId(item.parentId || null);
  };

  const handleDelete = async (id: string) => {
    console.log('🗑️ Delete requested for subcategory:', id);
    Alert.alert('Confirm delete', 'This will permanently remove the subcategory.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          console.log('🗑️ Deleting subcategory:', id);
          try {
            const res = await fetch(`${API_URL}/api/admin/subcategories/${id}`, { method: 'DELETE' });
            console.log('📡 Delete response status:', res.status);
            if (!res.ok) {
              const err = await res.json();
              console.error('❌ Delete failed:', err);
              throw new Error('Delete failed');
            }
            console.log('✅ Subcategory deleted successfully');
            await loadSubcategories();
          } catch (error) {
            console.error('❌ Error deleting subcategory:', error);
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  const handleSelectSubcategory = (item: any) => {
    console.log('📌 Selected subcategory for products:', item.id, item.name);
    setSelectedSubcategoryId(item.id);
    setSelectedSubcategoryName(item.name || null);
    setSubcategoryProducts([]);
  };

  const loadProductsForSubcategory = async () => {
    if (!selectedSubcategoryId) {
      return Alert.alert('Select a subcategory', 'Tap the Products button for a subcategory first.');
    }

    setProductsLoading(true);
    console.log('📥 Loading products for subcategory:', selectedSubcategoryId);

    try {
      const res = await fetch(`${API_URL}/api/categories/${selectedSubcategoryId}/products`);
      console.log('📡 Products by subcategory response status:', res.status);
      const data = await res.json();
      setSubcategoryProducts(data || []);
      console.log('📦 Subcategory products received:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading subcategory products:', error);
      Alert.alert('Error', 'Unable to load products for this subcategory');
    } finally {
      setProductsLoading(false);
    }
  };

  const renderSubcategoryProducts = () => (
    <View style={styles.productSection}>
      <View style={styles.productHeader}>
        <Text style={styles.sectionTitle}>Products for {selectedSubcategoryName || 'selected subcategory'}</Text>
        <TouchableOpacity
          style={[styles.navButton, !selectedSubcategoryId && styles.navButtonDisabled]}
          onPress={loadProductsForSubcategory}
          disabled={!selectedSubcategoryId}
        >
          <Text style={styles.navButtonText}>Show Products</Text>
        </TouchableOpacity>
      </View>
      {productsLoading ? (
        <ActivityIndicator color="#111" />
      ) : subcategoryProducts.length === 0 ? (
        <Text style={styles.emptyText}>No products found for this subcategory.</Text>
      ) : (
        subcategoryProducts.map((product) => (
          <View key={product.id} style={styles.productItem}>
            <Text style={styles.productItemTitle}>{product.name}</Text>
            <Text style={styles.productItemText}>{product.description || 'No description'}</Text>
            <Text style={styles.productItemMeta}>Price: ${product.usdPrice}</Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={subcategories}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>Subcategories</Text>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.navButton} onPress={() => router.push('/categories')}>
                <Text style={styles.navButtonText}>Go to Categories</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={() => router.push('/products')}>
                <Text style={styles.navButtonText}>Go to Products</Text>
              </TouchableOpacity>
            </View>

            {selectedSubcategoryName ? (
              <View style={styles.selectedRow}>
                <Text style={styles.selectedText}>Selected: {selectedSubcategoryName}</Text>
                <TouchableOpacity
                  style={[styles.navButton, !selectedSubcategoryId && styles.navButtonDisabled]}
                  onPress={loadProductsForSubcategory}
                  disabled={!selectedSubcategoryId}
                >
                  <Text style={styles.navButtonText}>Products</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{editingId ? 'Edit Subcategory' : 'Add Subcategory'}</Text>
              <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
              <TextInput
                style={[styles.input, { height: 90 }]}
                placeholder="Description"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.categoryRow}>
                <Text style={styles.label}>Parent Category</Text>
                <Text style={styles.selectedCategory}>{categories.find((cat) => cat.id === parentId)?.name || 'Choose a category'}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, parentId === cat.id && styles.categoryChipActive]}
                    onPress={() => setParentId(cat.id)}
                  >
                    <Text style={[styles.categoryChipText, parentId === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.imageInput} onPress={pickImage}>
                {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : <Text>Tap to choose image</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{editingId ? 'Update' : 'Create'} Subcategory</Text>}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Subcategory List</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
              onPress={() => handleSelectSubcategory(item)}
              style={[styles.smallButton, selectedSubcategoryId === item.id && styles.smallButtonActive]}
            >
              <Text style={styles.smallButtonText}>Products</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.smallButton, styles.deleteButton]}>
              <Text style={styles.smallButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.itemImage} /> : null}
            <Text style={styles.itemText}>{item.description || 'No description'}</Text>
            <Text style={styles.itemMeta}>Parent: {categories.find((cat) => cat.id === item.parentId)?.name || item.parentId}</Text>
            <Text style={styles.itemMeta}>ID: {item.id}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No subcategories found.</Text>}
        ListFooterComponent={renderSubcategoryProducts}
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  navButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#111', marginHorizontal: 4 },
  navButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  formCard: { backgroundColor: '#fff', padding: 18, borderRadius: 14, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginBottom: 14, backgroundColor: '#fafafa' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 14, color: '#333', fontWeight: '600' },
  selectedCategory: { fontSize: 14, color: '#555' },
  categoryScroll: { marginBottom: 14 },
  categoryChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 10, backgroundColor: '#fff' },
  categoryChipActive: { backgroundColor: '#111', borderColor: '#111' },
  categoryChipText: { color: '#333' },
  categoryChipTextActive: { color: '#fff' },
  imageInput: { height: 150, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 14, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  submitButton: { backgroundColor: '#000', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  itemCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  actionButtons: { flexDirection: 'row', flexWrap: 'wrap' },
  smallButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#111', marginLeft: 8, marginTop: 8 },
  smallButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  smallButtonActive: { backgroundColor: '#0057d9' },
  deleteButton: { backgroundColor: '#c00' },
  selectedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  selectedText: { color: '#333', fontWeight: '600' },
  productSection: { marginTop: 20, padding: 16, backgroundColor: '#fff', borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  productItem: { padding: 14, borderRadius: 12, backgroundColor: '#f8f8f8', marginBottom: 10 },
  productItemTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  productItemText: { color: '#555', marginBottom: 4 },
  productItemMeta: { color: '#777', fontSize: 12 },
  itemImage: { width: '100%', height: 140, borderRadius: 12, marginBottom: 10 },
  itemText: { color: '#444', marginBottom: 8 },
  itemMeta: { color: '#888', fontSize: 12, marginBottom: 10 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 20 },
  navButtonDisabled: { opacity: 0.5 },
});

export default Subcategories;
