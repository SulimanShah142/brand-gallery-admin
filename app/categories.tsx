import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadImage } from '@/lib/uploadthing';
import { loadCategoriesLocal } from '@/lib/offline';
import { API_URL } from '@/lib/config';

export default function Categories() {
  const router = useRouter();
  // Captures active localization layout profiles

  // 🎯 THE FIX: Provision the missing categories list container state array!
  const [categories, setCategories] = useState<any[]>([]);

  // 🎯 THE FIX: Provision your multi-language mutable text input states!
  const [name, setName] = useState('');
  const [namePs, setNamePs] = useState('');
  const [nameFa, setNameFa] = useState('');

  const [description, setDescription] = useState('');
  const [descriptionPs, setDescriptionPs] = useState('');
  const [descriptionFa, setDescriptionFa] = useState('');

  const [parentId, setParentId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🎯 FETCH OPERATIONAL CONTROLLER: Hydrates your categories state from the cloud API!
  const loadCategoriesData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error("❌ Failed to sync administrative category nodes:", error);
    }
  };

  // Mount pass hook forces synchronization on active view entries load
  useEffect(() => {
    loadCategoriesData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setNamePs('');
    setNameFa('');
    setDescription('');
    setDescriptionPs('');
    setDescriptionFa('');
    setImageUri(null);
    setParentId(null);
  };

  const pickImage = async () => {
    try {
      // Prompt device media library permission gates
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library access is required to upload category thumbnail images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Perfect square ratio block for minimalist SHEIN style grids
        quality: 0.4,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        
        // Optimize resolution boundaries to guarantee lightning fast database load speeds
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 500, height: 500 } }],
          { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG },
        );

        console.log('🖼️ Local category asset optimized:', manipulated.uri);
        setImageUri(manipulated.uri);
      }
    } catch (error: any) {
      console.error('❌ Error picking category icon asset:', error.message);
      Alert.alert('Upload Error', 'Failed to retrieve or parse image files from storage.');
    }
  };


  const handleSave = async () => {
    if (!name.trim() || !namePs.trim() || !nameFa.trim()) {
      return Alert.alert('Validation', 'Category titles for all three platform languages are required.');
    }
    
    console.log('💾 Saving category translations:', { name, namePs, nameFa, editingId });
    setLoading(true);

    try {
      let imageUrl = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        console.log('🖼️ Uploading image...');
        imageUrl = await uploadImage(imageUri);
        console.log('✅ Image uploaded:', imageUrl);
      }

      // 🎯 THE MULTILINGUAL PAYLOAD OBJECT LAYER
      const payload = {
        name: name.trim(),
        namePs: namePs.trim(),
        nameFa: nameFa.trim(),
        description: description.trim(),
        descriptionPs: descriptionPs.trim(),
        descriptionFa: descriptionFa.trim(),
        imageUrl,
        parentId,
      };

      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId
        ? `${API_URL}/api/admin/categories/${editingId}`
        : `${API_URL}/api/admin/categories`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Save failed');
      }

      await loadCategoriesLocal();
      resetForm();
      Alert.alert('Success', `Category ${editingId ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('❌ Error saving category:', error);
      Alert.alert('Error', (error as Error).message || 'Unable to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name || '');
    setNamePs(item.namePs || '');
    setNameFa(item.nameFa || '');
    setDescription(item.description || '');
    setDescriptionPs(item.descriptionPs || '');
    setDescriptionFa(item.descriptionFa || '');
    setImageUri(item.imageUrl || null);
    setParentId(item.parentId || null);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm delete', 'This will remove the category and its direct subcategories.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/admin/categories/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            await loadCategoriesLocal();
          } catch (err) {
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.container}>
        <FlatList
          data={(categories || []).filter((item: any) => !item.parentId)}
          keyExtractor={(item) => item?.id?.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <Text style={styles.heading}>Categories</Text>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.navButton} onPress={() => router.push('/products')}>
                  <Text style={styles.navButtonText}>Go to Products</Text>
                </TouchableOpacity>
              </View>

              {/* HIGH-DENSITY TRANSLATION ENTRY FORM */}
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>{editingId ? 'Edit Category' : 'Add Category'}</Text>
                
                {/* LOCALIZED NAME CHANNELS */}
                <Text style={styles.fieldLabel}>ENGLISH CATEGORY TITLE</Text>
                <TextInput style={styles.input} placeholder="e.g. Luxury Bags" value={name} onChangeText={setName} />
                
                <Text style={styles.fieldLabel}>PASHTO CATEGORY TITLE (پښتو)</Text>
                <TextInput style={[styles.input, { textAlign: 'right' }]} placeholder="مثالی عنوان" value={namePs} onChangeText={setNamePs} />
                
                <Text style={styles.fieldLabel}>DARI CATEGORY TITLE (دری)</Text>
                <TextInput style={[styles.input, { textAlign: 'right' }]} placeholder="عنوان نمونه" value={nameFa} onChangeText={setNameFa} />

                {/* LOCALIZED DESCRIPTION CHANNELS */}
                <Text style={styles.fieldLabel}>ENGLISH DESCRIPTION</Text>
                <TextInput style={[styles.input, { height: 60 }]} placeholder="Description text" multiline value={description} onChangeText={setDescription} />
                
                <Text style={styles.fieldLabel}>PASHTO DESCRIPTION (پښتو)</Text>
                <TextInput style={[styles.input, { height: 60, textAlign: 'right' }]} placeholder="د پښتو تفصیل" multiline value={descriptionPs} onChangeText={setDescriptionPs} />
                
                <Text style={styles.fieldLabel}>DARI DESCRIPTION (دری)</Text>
                <TextInput style={[styles.input, { height: 60, textAlign: 'right' }]} placeholder="توضیحات دری" multiline value={descriptionFa} onChangeText={setDescriptionFa} />

                <Text style={styles.fieldLabel}>PARENT RELATION LINK (OPTIONAL)</Text>
                <TextInput style={styles.input} placeholder="Parent Category ID" value={parentId || ''} onChangeText={(text) => setParentId(text || null)} />

                <TouchableOpacity style={styles.imageInput} onPress={pickImage}>
                  {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : <Text style={styles.imagePlaceholderText}>Tap to choose catalog thumbnail</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>{editingId ? 'Update' : 'Create'} Category</Text>}
                </TouchableOpacity>

                {editingId && (
                  <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#888888', marginTop: 8 }]} onPress={resetForm}>
                    <Text style={styles.submitButtonText}>CANCEL EDIT</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.sectionTitle}>Category List</Text>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.name?.toUpperCase()}</Text>
                  <Text style={styles.itemSubTitleTranslation}>PS: {item.namePs || 'N/A'}  |  FA: {item.nameFa || 'N/A'}</Text>
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.smallButton, styles.deleteButton]}>
                    <Text style={styles.smallButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.itemImage} /> : null}
              <Text style={styles.itemText}>{item.description || 'No description provided.'}</Text>
              <Text style={styles.itemMeta}>ID: {item.id}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No categories found.</Text>}
          contentContainerStyle={styles.content}
        />
      </View>
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

  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  heading: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: 60,
    marginBottom: 18,
    color: '#111',
    textAlign: 'left',
  },

  // =========================================================
  // NAVIGATION
  // =========================================================

  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  navButton: {
    flex: 1,

    minHeight: 44,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E8E8E8',

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.02,
    shadowRadius: 6,

    elevation: 1,
  },

  navButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#111',
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  // FIELD SYSTEM
  // =========================================================

  fieldLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  subLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',

    paddingVertical: 11,

    fontSize: 14,
    fontWeight: '600',

    color: '#111',

    marginBottom: 16,
  },

  multilingualColorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },

  multilingualInputSubCell: {
    flex: 1,

    height: 42,

    borderWidth: 1,
    borderColor: '#E5E5E5',

    backgroundColor: '#FAFAFA',

    paddingHorizontal: 12,

    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },

  // =========================================================
  // IMAGE UPLOAD
  // =========================================================

  imageInput: {
    height: 180,

    backgroundColor: '#FAFAFA',

    borderWidth: 1,
    borderColor: '#E5E5E5',

    borderRadius: 14,

    justifyContent: 'center',
    alignItems: 'center',

    marginTop: 6,
    marginBottom: 18,

    overflow: 'hidden',
  },

  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },

  imagePlaceholderText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },

  // =========================================================
  // PRIMARY ACTION
  // =========================================================

  submitButton: {
    backgroundColor: '#111',

    minHeight: 48,

    paddingVertical: 14,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,
  },

  submitButtonText: {
    color: '#FFF',

    fontWeight: '900',

    letterSpacing: 1.3,

    fontSize: 11,

    textTransform: 'uppercase',
  },

  // =========================================================
  // CATEGORY LIST
  // =========================================================

  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,

    marginBottom: 14,

    textTransform: 'uppercase',

    color: '#111',
  },

  itemCard: {
    backgroundColor: '#FFFFFF',

    padding: 18,

    borderRadius: 16,

    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#EAEAEA',

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
  // CATEGORY HEADER
  // =========================================================

  itemTopRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'flex-start',

    marginBottom: 12,
  },

  itemTitle: {
    fontSize: 14,

    fontWeight: '900',

    letterSpacing: 0.4,

    color: '#111',

    marginBottom: 4,
  },

  itemSubTitleTranslation: {
    fontSize: 10,

    color: '#888',

    fontWeight: '600',

    letterSpacing: 0.2,

    lineHeight: 15,

    marginTop: 1,
  },

  // =========================================================
  // CATEGORY IMAGE
  // =========================================================

  itemImage: {
    width: '100%',

    height: 190,

    backgroundColor: '#F5F5F5',

    borderRadius: 12,

    marginBottom: 12,
  },

  // =========================================================
  // CATEGORY DESCRIPTION
  // =========================================================

  itemText: {
    fontSize: 12,

    color: '#666',

    lineHeight: 18,

    marginBottom: 8,

    fontWeight: '500',
  },

  itemMeta: {
    fontSize: 9,

    color: '#AAA',

    fontWeight: '700',

    letterSpacing: 0.4,

    marginTop: 2,
  },

  // =========================================================
  // ACTION BUTTONS
  // =========================================================

  actionButtons: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 0,
  },

  smallButton: {
    minHeight: 34,

    paddingVertical: 8,
    paddingHorizontal: 13,

    borderWidth: 1,
    borderColor: '#111',

    borderRadius: 9,

    marginLeft: 7,

    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButton: {
    borderColor: '#FF3B30',
  },

  smallButtonText: {
    color: '#111',

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 0.8,

    textTransform: 'uppercase',
  },

  // =========================================================
  // LINK ACTION
  // =========================================================

  linkButton: {
    paddingVertical: 12,

    alignItems: 'center',

    marginTop: 10,
  },

  linkText: {
    color: '#111',

    fontWeight: '800',

    fontSize: 10,

    letterSpacing: 1,

    textDecorationLine: 'underline',
  },

  // =========================================================
  // EMPTY STATE
  // =========================================================

  emptyText: {
    textAlign: 'center',

    color: '#AAA',

    marginTop: 40,

    fontSize: 11,

    fontWeight: '600',

    letterSpacing: 0.5,
  },

  // =========================================================
  // GENERAL CENTER
  // =========================================================

  center: {
    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor: '#F7F7F8',
  },
});