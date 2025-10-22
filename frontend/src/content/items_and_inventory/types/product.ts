// Product type definitions
export interface GenreItem {
  value: number;
  en: string;
  cn: string;
}

export interface ImageItem {
  value: number;
  type: string;
  path: string;
}

export interface ApiProduct {
  id: number;
  product_code: string;
  product_title_en: string;
  product_title_cn?: string;
  barcode?: string;
  upc?: string;
  pcs_per_carton: number;
  item_weight?: number;
  inventry_qty: number;
  product_type_id?: number;
  menufacturer_id?: number; // Note: keeping the typo as it exists in your code
  series_id?: number;
  brand_id?: number;
  genres?: GenreItem[]; // Array of genre objects
  preorder_start_date?: Date | string;
  preorder_end_date?: Date | string;
  releaseDate?: Date | string;
  dateCreated?: Date | string;
  description?: string;
  specs?: string;
  memo?: string;
  product_status?: string;
  is_tnt?: number | boolean;
  is_wholesale?: number | boolean;
  images?: ImageItem[];
}

export interface OptionType {
  value: string;
  label: string;
}

// Unified dropdown item interface for all dropdown data
export interface DropdownItem {
  value: number;
  en: string;
  cn: string;
}