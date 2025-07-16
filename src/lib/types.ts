export type AssetStatus = 'activo' | 'obsoleto' | 'baja';
export type ProductType = 'Laptop' | 'Desktop' | 'Monitor' | 'Keyboard' | 'Mouse' | 'Printer' | 'Other';

export type Asset = {
  id: string;
  nombre: string;
  tipo: ProductType;
  modelo: string;
  numeroSerie: string;
  fechaCompra: Date;
  estado: AssetStatus;
  fechaBaja?: Date | null;
  motivoBaja?: string | null;
  usuarioAlta?: string | null; // uid
  usuarioBaja?: string | null; // uid
  documentUrl?: string;
};

export const productTypes: ProductType[] = ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Other'];
