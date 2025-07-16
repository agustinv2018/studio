export type AssetStatus = 'Activo' | 'Obsoleto' | 'De baja';
export type ProductType = 'Laptop' | 'Desktop' | 'Monitor' | 'Keyboard' | 'Mouse' | 'Printer' | 'Other';

export type Asset = {
  id: string;
  name: string;
  productType: ProductType;
  model: string;
  serialNumber: string;
  purchaseDate: Date;
  status: AssetStatus;
  documentUrl?: string;
};

export const productTypes: ProductType[] = ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Other'];
