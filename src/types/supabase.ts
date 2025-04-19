export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
        Relationships: []
      }
      training_tables: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_tables_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      breath_cycles: {
        Row: {
          id: string
          table_id: string
          breathe_time: number
          hold_time: number
          cycle_index: number
          created_at: string
          tap_mode?: boolean
        }
        Insert: {
          id?: string
          table_id: string
          breathe_time: number
          hold_time: number
          cycle_index: number
          created_at?: string
          tap_mode?: boolean
        }
        Update: {
          id?: string
          table_id?: string
          breathe_time?: number
          hold_time?: number
          cycle_index?: number
          created_at?: string
          tap_mode?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "breath_cycles_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "training_tables"
            referencedColumns: ["id"]
          }
        ]
      }
      practice_records: {
        Row: {
          id: string
          user_id: string
          table_id: string
          completed_at: string
          results: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          table_id: string
          completed_at: string
          results: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          table_id?: string
          completed_at?: string
          results?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_records_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "training_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          settings: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
  }
}