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
      ChatSession: {
        Row: {
          id: string
          visitorName: string
          visitorEmail: string | null
          visitorPhone: string | null
          quizAnswers: Record<string, unknown> | null
          attendantId: string | null
          status: 'waiting' | 'in_progress' | 'completed' | 'abandoned'
          queuePosition: number | null
          startedAt: string
          attendedAt: string | null
          completedAt: string | null
          rating: number | null
          feedbackText: string | null
          feedbackAt: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          visitorName: string
          visitorEmail?: string | null
          visitorPhone?: string | null
          attendantId?: string | null
          status?: 'waiting' | 'in_progress' | 'completed' | 'abandoned'
          queuePosition?: number
          startedAt?: string
          attendedAt?: string | null
          completedAt?: string | null
          rating?: number | null
          feedbackText?: string | null
          feedbackAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          visitorName?: string
          visitorEmail?: string | null
          visitorPhone?: string | null
          attendantId?: string | null
          status?: 'waiting' | 'in_progress' | 'completed' | 'abandoned'
          queuePosition?: number
          startedAt?: string
          attendedAt?: string | null
          completedAt?: string | null
          rating?: number | null
          feedbackText?: string | null
          feedbackAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      ChatMessage: {
        Row: {
          id: string
          sessionId: string
          sender: 'visitor' | 'attendant'
          senderId: string | null
          content: string
          createdAt: string
        }
        Insert: {
          id?: string
          sessionId: string
          sender: 'visitor' | 'attendant'
          senderId?: string | null
          content: string
          createdAt?: string
        }
        Update: {
          id?: string
          sessionId?: string
          sender?: 'visitor' | 'attendant'
          senderId?: string | null
          content?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ChatMessage_sessionId_fkey"
            columns: ["sessionId"]
            referencedRelation: "ChatSession"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
