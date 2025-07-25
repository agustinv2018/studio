export type AssetStatus = 'activo' | 'obsoleto' | 'baja';
export type ProductType = 
  | 'Laptop' 
  | 'Desktop' 
  | 'Monitor' 
  | 'Keyboard' 
  | 'Mouse' 
  | 'Printer' 
  | 'Other';

export type Asset = {
  id: string;
  nombre: string;
  tipo: ProductType;
  modelo: string;
  numeroSerie: string;
  fechaCompra: Date; // ISO date -> converted to Date in code
  estado: AssetStatus;
  
  // Nuevos campos para la baja
  fechaBaja?: Date | null;          // disposal_date
  motivoBaja?: string | null;       // disposal_reason
  documentUrl?: string | null;      // disposal_doc_url

  usuarioAlta?: string | null; // UID del creador
  usuarioBaja?: string | null; // UID del que da de baja
};

export const productTypes: ProductType[] = [
  'Laptop', 
  'Desktop', 
  'Monitor', 
  'Keyboard', 
  'Mouse', 
  'Printer', 
  'Other'
];

export const assetStatuses: AssetStatus[] = ['activo', 'obsoleto', 'baja'];