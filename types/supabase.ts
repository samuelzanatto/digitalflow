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
      team_messages: {
        Row: {
          id: string
          user_id: string | null
          username: string
          avatar_url: string | null
          content: string
          inserted_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          username: string
          avatar_url?: string | null
          content: string
          inserted_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          username?: string
          avatar_url?: string | null
          content?: string
          inserted_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
