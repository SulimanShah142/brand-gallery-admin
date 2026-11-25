import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_URL } from '@/lib/config';

type Product = {
  id: string;
  name?: string | null;
  imageUrl?: string | null;
};

type DownloadResult =
  | { cancelled: true; fileName: string }
  | { cancelled: false; fileName: string; location: string };

async function saveProductImage(imageUrl: string, productId: string): Promise<DownloadResult> {
  const urlPath = imageUrl.split('?')[0];
  const extension = urlPath.match(/\.(png|webp|gif|jpe?g)$/i)?.[1]?.toLowerCase() || 'jpg';
  const mimeType = extension === 'png'
    ? 'image/png'
    : extension === 'webp'
      ? 'image/webp'
      : extension === 'gif'
        ? 'image/gif'
        : 'image/jpeg';
  const safeProductId = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `product-${safeProductId}-${Date.now()}.${extension}`;

  if (Platform.OS === 'android') {
    if (!FileSystem.cacheDirectory) {
      throw new Error('Temporary storage is unavailable on this device.');
    }

    const temporaryUri = `${FileSystem.cacheDirectory}${fileName}`;
    const permission =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted) {
      return { cancelled: true, fileName };
    }

    try {
      const download = await FileSystem.downloadAsync(imageUrl, temporaryUri);
      if (download.status < 200 || download.status >= 300) {
        throw new Error(`Image server returned status ${download.status}.`);
      }

      const content = await FileSystem.readAsStringAsync(download.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const destination = await FileSystem.StorageAccessFramework.createFileAsync(
        permission.directoryUri,
        fileName,
        mimeType
      );
      await FileSystem.StorageAccessFramework.writeAsStringAsync(destination, content, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        cancelled: false,
        fileName,
        location: 'the folder you selected',
      };
    } finally {
      await FileSystem.deleteAsync(temporaryUri, { idempotent: true }).catch((error) => {
        console.warn('Could not remove temporary product image file:', error);
      });
    }
  }

  if (!FileSystem.documentDirectory) {
    throw new Error('Local storage is unavailable on this device.');
  }

  const directory = `${FileSystem.documentDirectory}product-images/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}${fileName}`;
  const download = await FileSystem.downloadAsync(imageUrl, destination);
  if (download.status < 200 || download.status >= 300) {
    throw new Error(`Image server returned status ${download.status}.`);
  }

  const file = await FileSystem.getInfoAsync(download.uri);
  if (!file.exists || file.isDirectory) {
    throw new Error('Downloaded image could not be saved.');
  }

  return {
    cancelled: false,
    fileName,
    location: 'the app’s product-images folder',
  };
}

export default function DownloadProductImageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('Loading product image…');
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(false);

  const downloadImage = useCallback(async (imageUrl: string, idToSave: string) => {
    setSaving(true);
    setHasError(false);
    setMessage('Downloading product image…');

    try {
      const result = await saveProductImage(imageUrl, idToSave);
      if (!mountedRef.current) return;

      if (result.cancelled) {
        setMessage('Folder selection was cancelled. Tap below to try again.');
      } else {
        setMessage(`Saved ${result.fileName} to ${result.location}.`);
      }
    } catch (error) {
      console.error('Product image download failed:', error);
      if (mountedRef.current) {
        setHasError(true);
        setMessage(error instanceof Error ? error.message : 'Could not download the product image.');
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, []);

  const loadProductAndDownload = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    setMessage('Loading product image…');

    try {
      if (!productId) throw new Error('A product ID is required.');

      const response = await fetch(
        `${API_URL}/api/admin/products/${encodeURIComponent(productId)}`
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Could not load product details.');
      }
      if (!result?.imageUrl) {
        throw new Error('This product does not have an image to download.');
      }

      if (!mountedRef.current) return;
      setProduct(result);
      setLoading(false);
      await downloadImage(result.imageUrl, String(result.id || productId));
    } catch (error) {
      console.error('Could not load product image for download:', error);
      if (mountedRef.current) {
        setHasError(true);
        setMessage(error instanceof Error ? error.message : 'Could not load the product image.');
        setLoading(false);
      }
    }
  }, [downloadImage, productId]);

  useEffect(() => {
    mountedRef.current = true;
    void loadProductAndDownload();
    return () => {
      mountedRef.current = false;
    };
  }, [loadProductAndDownload]);

  const retryDownload = () => {
    if (product?.imageUrl && product.id) {
      void downloadImage(product.imageUrl, product.id);
    } else {
      void loadProductAndDownload();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DOWNLOAD PRODUCT IMAGE</Text>
      </View>

      <View style={styles.content}>
        {product?.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />
        ) : null}
        {product?.name ? <Text style={styles.productName}>{product.name}</Text> : null}

        {(loading || saving) && <ActivityIndicator size="large" color="#111827" />}
        <Text style={[styles.status, hasError && styles.error]}>{message}</Text>

        {!loading && !saving && (hasError || message.startsWith('Folder selection was cancelled')) ? (
          <TouchableOpacity onPress={retryDownload} style={styles.retryButton}>
            <Ionicons name="download-outline" size={17} color="#FFFFFF" />
            <Text style={styles.retryText}>TRY DOWNLOAD AGAIN</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 8,
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  image: {
    width: '100%',
    height: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  productName: {
    marginTop: 16,
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  status: {
    marginTop: 16,
    color: '#4B5563',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  error: {
    color: '#B91C1C',
  },
  retryButton: {
    marginTop: 18,
    minHeight: 46,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
