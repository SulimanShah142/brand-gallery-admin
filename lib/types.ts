// Create this in: /lib/types.ts
export interface Category {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  discountPercentage: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  usdPrice: number;
  imageUrl: string | null;
  availableSizes?: string[]; // To match your new SHEIN logic
  availableColors?: string[];
  isAvailable: boolean;
}
