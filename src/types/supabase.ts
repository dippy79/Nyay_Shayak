// Generated Supabase types - extend with your schema
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      legal_documents: {
        Row: {
          id: string
          user_id: string | null
          cnr: string | null
          image_url: string
          analysis: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          cnr?: string | null
          image_url: string
          analysis: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          cnr?: string | null
          image_url?: string
          analysis?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      legal_directory: {
        Row: {
          id: string
          name: string
          type: string
          address: string | null
          phone: string | null
          lat: number
          lng: number
          geom: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          address?: string | null
          phone?: string | null
          lat: number
          lng: number
          geom?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          address?: string | null
          phone?: string | null
          lat?: number
          lng?: number
          geom?: string | null
          created_at?: string
        }
        Relationships: []
      }
      case_lookups: {
        Row: {
          id: string
          cnr: string
          status: Json | null
          scraped_at: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cnr: string
          status?: Json | null
          scraped_at?: string
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cnr?: string
          status?: Json | null
          scraped_at?: string
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: {
        Row: Record<string, unknown>
        Relationships: Record<string, unknown>
      }
    }
    Functions: {
      [_ in never]: {
        Name: never
        Schema: never
        Comment: never
        Args: never
        Returns: never
        Type: never
      }
    }
    Enums: {
      [_ in never]: {
        Name: never
        Schema: never
        Comment: never
        EnumValues: never
        Variant: never
      }
    }
    CompositeTypes: {
      [_ in never]: {
        Name: never
        Schema: never
        Comment: never
        Columns: never
      }
    }
  }
}

