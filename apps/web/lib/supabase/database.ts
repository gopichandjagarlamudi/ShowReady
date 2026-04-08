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
      agents: {
        Row: {
          id: string
          email: string
          full_name: string
          brokerage: string | null
          license_number: string | null
          photo_url: string | null
          logo_url: string | null
          onboarded_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          brokerage?: string | null
          license_number?: string | null
          photo_url?: string | null
          logo_url?: string | null
          onboarded_at?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>
        Relationships: []
      }
      agent_settings: {
        Row: {
          id: string
          agent_id: string
          brand_name: string
          brand_color: string
          accent_color: string
          show_threshold: number
          question_template_id: string
          notification_preference: "email" | "email_and_push"
        }
        Insert: {
          id?: string
          agent_id: string
          brand_name: string
          brand_color: string
          accent_color: string
          show_threshold: number
          question_template_id: string
          notification_preference: "email" | "email_and_push"
        }
        Update: Partial<Database["public"]["Tables"]["agent_settings"]["Insert"]>
        Relationships: []
      }
      question_templates: {
        Row: {
          id: string
          agent_id: string
          intake_type: "sale" | "rental"
          name: string
          intro_headline: string
          intro_body: string
          custom_questions: Json
        }
        Insert: {
          id: string
          agent_id: string
          intake_type: "sale" | "rental"
          name: string
          intro_headline: string
          intro_body: string
          custom_questions: Json
        }
        Update: Partial<Database["public"]["Tables"]["question_templates"]["Insert"]>
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          agent_id: string
          buyer_name: string
          buyer_phone: string | null
          buyer_email: string | null
          intake_type: "sale" | "rental"
          token: string
          token_expires_at: string
          status: "pending" | "submitted" | "archived"
          pipeline_stage: "new" | "ready" | "nurture" | "hold" | "closed"
          score: number | null
          recommendation: "show" | "nurture" | "hold" | null
          summary: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          buyer_name: string
          buyer_phone?: string | null
          buyer_email?: string | null
          intake_type?: "sale" | "rental"
          token: string
          token_expires_at: string
          status?: "pending" | "submitted" | "archived"
          pipeline_stage?: "new" | "ready" | "nurture" | "hold" | "closed"
          score?: number | null
          recommendation?: "show" | "nurture" | "hold" | null
          summary?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>
        Relationships: []
      }
      invites: {
        Row: {
          id: string
          agent_id: string
          token: string
          status: "generated" | "opened" | "converted" | "expired"
          token_expires_at: string
          draft_payload: Json
          lead_id: string | null
          opened_at: string | null
          converted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          token: string
          status?: "generated" | "opened" | "converted" | "expired"
          token_expires_at: string
          draft_payload: Json
          lead_id?: string | null
          opened_at?: string | null
          converted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["invites"]["Insert"]>
        Relationships: []
      }
      lead_answers: {
        Row: {
          id: string
          lead_id: string
          question_key: string
          answer_value: Json
          scored: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          question_key: string
          answer_value: Json
          scored?: boolean
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["lead_answers"]["Insert"]>
        Relationships: []
      }
      lead_scores: {
        Row: {
          id: string
          lead_id: string
          total: number
          recommendation: "show" | "nurture" | "hold"
          summary: string
          breakdown: Json
          overridden: boolean
          override_meta: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          total: number
          recommendation: "show" | "nurture" | "hold"
          summary: string
          breakdown: Json
          overridden?: boolean
          override_meta?: Json | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["lead_scores"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      lead_status: "pending" | "submitted" | "archived"
      lead_stage: "new" | "ready" | "nurture" | "hold" | "closed"
      recommendation: "show" | "nurture" | "hold"
      notification_preference: "email" | "email_and_push"
      intake_type: "sale" | "rental"
      invite_status: "generated" | "opened" | "converted" | "expired"
    }
    CompositeTypes: Record<string, never>
  }
}
