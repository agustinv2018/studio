export type AssetStatus = 'Activo' | 'Obsoleto';
export type ProductType = 'Laptop' | 'Desktop' | 'Monitor' | 'Keyboard' | 'Mouse' | 'Other';

export type Asset = {
  id: string;
  productType: ProductType;
  model: string;
  serialNumber: string;
  purchaseDate: Date;
  status: AssetStatus;
};

export const productTypes: ProductType[] = ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Other'];
