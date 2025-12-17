export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profile_seeds: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          department: string
          reports_to_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role: string
          department: string
          reports_to_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          department?: string
          reports_to_email?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: string
          department: string
          reports_to_id: string | null
          focus_areas: string[]
          is_onboarded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: string
          department?: string
          reports_to_id?: string | null
          focus_areas?: string[]
          is_onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: string
          department?: string
          reports_to_id?: string | null
          focus_areas?: string[]
          is_onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: string
          notifications_enabled: boolean
          focus_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          notifications_enabled?: boolean
          focus_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          notifications_enabled?: boolean
          focus_mode?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileSeed = Database['public']['Tables']['profile_seeds']['Row']
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']


