import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      materials: {
        Row: {
          id: string
          name: string
          variant: string | null
          sku: string
          on_hand: number
          reorder_point: number
          cost: number | null
          archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          variant?: string | null
          sku: string
          on_hand?: number
          reorder_point?: number
          cost?: number | null
          archived?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          variant?: string | null
          sku?: string
          on_hand?: number
          reorder_point?: number
          cost?: number | null
          archived?: boolean
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          variant: string | null
          sku: string
          price: number | null
          bom: Array<{ materialId: string; qty: number }> | null
          archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          variant?: string | null
          sku: string
          price?: number | null
          bom?: Array<{ materialId: string; qty: number }> | null
          archived?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          variant?: string | null
          sku?: string
          price?: number | null
          bom?: Array<{ materialId: string; qty: number }> | null
          archived?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          code: string | null
          channel: string
          external_id: string | null
          customer_name: string | null
          status: string
          carrier: string | null
          tracking: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code?: string | null
          channel?: string
          external_id?: string | null
          customer_name?: string | null
          status?: string
          carrier?: string | null
          tracking?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string | null
          channel?: string
          external_id?: string | null
          customer_name?: string | null
          status?: string
          carrier?: string | null
          tracking?: string | null
          created_at?: string
        }
      }
      order_lines: {
        Row: {
          id: string
          order_id: string
          product_id: string
          qty: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          qty: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          qty?: number
        }
      }
    }
  }
}
