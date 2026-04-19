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
      report_section_types: {
        Row: {
          ai_directive: string | null
          default_title: string
          description: string | null
          id: string
          name: string
          structured_data_schema: Json | null
        }
        Insert: {
          ai_directive?: string | null
          default_title: string
          description?: string | null
          id?: string
          name: string
          structured_data_schema?: Json | null
        }
        Update: {
          ai_directive?: string | null
          default_title?: string
          description?: string | null
          id?: string
          name?: string
          structured_data_schema?: Json | null
        }
        Relationships: []
      }
      report_sections: {
        Row: {
          id: string
          report_id: string
          section_type: string
          title: string
          order: number
          content: string | null
          structured_data: Json | null
          hydrated_html: string | null
          extraction_confidence: Json | null
          source_refs: Json | null
          is_completed: boolean
          is_required: boolean
          is_generated: boolean
          change_tracking: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          section_type: string
          title: string
          order?: number
          content?: string | null
          structured_data?: Json | null
          hydrated_html?: string | null
          extraction_confidence?: Json | null
          source_refs?: Json | null
          is_completed?: boolean
          is_required?: boolean
          is_generated?: boolean
          change_tracking?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          section_type?: string
          title?: string
          order?: number
          content?: string | null
          structured_data?: Json | null
          hydrated_html?: string | null
          extraction_confidence?: Json | null
          source_refs?: Json | null
          is_completed?: boolean
          is_required?: boolean
          is_generated?: boolean
          change_tracking?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          template_structure: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          template_structure: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          template_structure?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          title: string
          student_id: string | null
          student_name: string | null
          type: string
          status: string
          evaluator_id: string | null
          metadata: Json | null
          tags: string[] | null
          finalized_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id?: string | null
          title: string
          student_id?: string | null
          student_name?: string | null
          type: string
          status?: string
          evaluator_id?: string | null
          metadata?: Json | null
          tags?: string[] | null
          finalized_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string | null
          title?: string
          student_id?: string | null
          student_name?: string | null
          type?: string
          status?: string
          evaluator_id?: string | null
          metadata?: Json | null
          tags?: string[] | null
          finalized_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          id: string
          report_id: string
          user_id: string
          filename: string
          file_type: string
          file_size: number | null
          storage_path: string | null
          processing_status: string
          extracted_text: string | null
          ai_extraction_result: Json | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          filename: string
          file_type: string
          file_size?: number | null
          storage_path?: string | null
          processing_status?: string
          extracted_text?: string | null
          ai_extraction_result?: Json | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          filename?: string
          file_type?: string
          file_size?: number | null
          storage_path?: string | null
          processing_status?: string
          extracted_text?: string | null
          ai_extraction_result?: Json | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          user_id: string
          preferred_state: string | null
          evaluator_name: string | null
          evaluator_credentials: string | null
          school_name: string | null
          asha_number: string | null
          state_license_number: string | null
          show_toast_notifications: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          preferred_state?: string | null
          evaluator_name?: string | null
          evaluator_credentials?: string | null
          school_name?: string | null
          asha_number?: string | null
          state_license_number?: string | null
          show_toast_notifications?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          preferred_state?: string | null
          evaluator_name?: string | null
          evaluator_credentials?: string | null
          school_name?: string | null
          asha_number?: string | null
          state_license_number?: string | null
          show_toast_notifications?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_school_sites: {
        Row: {
          id: string
          user_id: string
          name: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress_events: {
        Row: {
          id: string
          report_id: string
          section_id: string | null
          operation_id: string | null
          event_type: string | null
          stage: string | null
          message: string | null
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          section_id?: string | null
          operation_id?: string | null
          event_type?: string | null
          stage?: string | null
          message?: string | null
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          section_id?: string | null
          operation_id?: string | null
          event_type?: string | null
          stage?: string | null
          message?: string | null
          data?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_events_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
