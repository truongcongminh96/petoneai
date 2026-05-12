import { createClient } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      product_categories: {
        Row: {
          id: number;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: number;
          name: string;
          sku: string;
          barcode: string | null;
          category_id: number | null;
          brand: string | null;
          cost_price: number;
          selling_price: number;
          stock_quantity: number;
          low_stock_threshold: number;
          unit: string | null;
          description: string | null;
          track_batch: boolean;
          allow_direct_sale: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          sku: string;
          barcode?: string | null;
          category_id?: number | null;
          brand?: string | null;
          cost_price?: number;
          selling_price?: number;
          stock_quantity?: number;
          low_stock_threshold?: number;
          unit?: string | null;
          description?: string | null;
          track_batch?: boolean;
          allow_direct_sale?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          sku?: string;
          barcode?: string | null;
          category_id?: number | null;
          brand?: string | null;
          cost_price?: number;
          selling_price?: number;
          stock_quantity?: number;
          low_stock_threshold?: number;
          unit?: string | null;
          description?: string | null;
          track_batch?: boolean;
          allow_direct_sale?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error(
      "Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return supabase;
}
