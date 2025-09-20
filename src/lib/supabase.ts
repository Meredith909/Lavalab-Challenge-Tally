// ============================================================================
// SUPABASE CLIENT CONFIGURATION - Database Connection Setup
// ============================================================================
// This file creates the connection to our Supabase database
// Supabase is a "Backend-as-a-Service" that provides:
// - PostgreSQL database with real-time subscriptions
// - Authentication system with JWT tokens
// - Row Level Security for data protection
// - Automatic API generation from database schema

// Import the Supabase client library
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// ENVIRONMENT VARIABLES - Configuration from .env.local
// ============================================================================
// These values come from your .env.local file and are loaded by Next.js
// The NEXT_PUBLIC_ prefix makes them available in the browser (client-side)

// Your Supabase project URL (e.g., https://your-project.supabase.co)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'

// Your Supabase anonymous key (safe to use in browser, has limited permissions)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// ============================================================================
// CREATE AND EXPORT SUPABASE CLIENT
// ============================================================================
// This creates a single instance of the Supabase client that's used throughout the app
// All components import this same instance to ensure consistent database connections
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// How this client is used throughout the app:
// - Authentication: supabase.auth.signIn(), supabase.auth.signOut()
// - Database queries: supabase.from('materials').select('*')
// - Real-time subscriptions: supabase.channel().on('postgres_changes')
// - File uploads: supabase.storage.from('bucket').upload()

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
