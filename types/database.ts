/**
 * Supabase database types (generated-style).
 *
 * In a real project these are produced by:
 *   supabase gen types typescript --project-id <ref> > types/database.ts
 *
 * They are hand-maintained here to match supabase/migrations/001_initial_schema.sql
 * so the app is fully typed without a live Supabase connection.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'platform_owner' | 'business_owner' | 'staff' | 'client'
export type BusinessType =
  | 'esthetician'
  | 'massage_therapist'
  | 'hairdresser'
  | 'salon'
  | 'other'
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
export type ReminderStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'confirmed'
  | 'cancelled'
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'
export type MemberRole = 'owner' | 'staff' | 'viewer'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          type: BusinessType
          email: string | null
          phone: string | null
          address: string | null
          timezone: string
          description: string | null
          logo_url: string | null
          is_active: boolean
          cancellation_hours_notice: number
          reminder_enabled: boolean
          reminder_hours_before: number
          reminder_email_from: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          type?: BusinessType
          email?: string | null
          phone?: string | null
          address?: string | null
          timezone?: string
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          cancellation_hours_notice?: number
          reminder_enabled?: boolean
          reminder_hours_before?: number
          reminder_email_from?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>
        Relationships: []
      }
      business_members: {
        Row: {
          id: string
          business_id: string
          profile_id: string
          role: MemberRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          profile_id: string
          role?: MemberRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['business_members']['Insert']>
        Relationships: []
      }
      staff_members: {
        Row: {
          id: string
          business_id: string
          profile_id: string | null
          name: string
          email: string | null
          phone: string | null
          role: string | null
          is_active: boolean
          buffer_minutes_after: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          profile_id?: string | null
          name: string
          email?: string | null
          phone?: string | null
          role?: string | null
          is_active?: boolean
          buffer_minutes_after?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['staff_members']['Insert']>
        Relationships: []
      }
      services: {
        Row: {
          id: string
          business_id: string
          name: string
          category: string | null
          duration_minutes: number
          price: number
          description: string | null
          is_active: boolean
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          category?: string | null
          duration_minutes?: number
          price?: number
          description?: string | null
          is_active?: boolean
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['services']['Insert']>
        Relationships: []
      }
      service_staff: {
        Row: {
          service_id: string
          staff_member_id: string
          created_at: string
        }
        Insert: {
          service_id: string
          staff_member_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['service_staff']['Insert']>
        Relationships: []
      }
      availability_rules: {
        Row: {
          id: string
          business_id: string
          staff_member_id: string | null
          day_of_week: DayOfWeek
          start_time: string
          end_time: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          staff_member_id?: string | null
          day_of_week: DayOfWeek
          start_time: string
          end_time: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['availability_rules']['Insert']>
        Relationships: []
      }
      availability_exceptions: {
        Row: {
          id: string
          business_id: string
          staff_member_id: string | null
          date: string
          is_available: boolean
          start_time: string | null
          end_time: string | null
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          staff_member_id?: string | null
          date: string
          is_available?: boolean
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['availability_exceptions']['Insert']>
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          business_id: string
          profile_id: string | null
          name: string
          email: string | null
          phone: string | null
          notes: string | null
          no_show_count: number
          is_blocked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          profile_id?: string | null
          name: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          no_show_count?: number
          is_blocked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          business_id: string
          client_id: string | null
          staff_member_id: string | null
          service_id: string | null
          start_time: string
          end_time: string
          status: BookingStatus
          notes: string | null
          confirmed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          reminder_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          client_id?: string | null
          staff_member_id?: string | null
          service_id?: string | null
          start_time: string
          end_time: string
          status?: BookingStatus
          notes?: string | null
          confirmed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          reminder_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
        Relationships: []
      }
      reminder_events: {
        Row: {
          id: string
          booking_id: string
          channel: string
          status: ReminderStatus
          scheduled_at: string | null
          sent_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          channel?: string
          status?: ReminderStatus
          scheduled_at?: string | null
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['reminder_events']['Insert']>
        Relationships: []
      }
      notification_preferences: {
        Row: {
          id: string
          business_id: string
          email_enabled: boolean
          sms_enabled: boolean
          reminder_hours_before: number
          cancellation_hours_notice: number
          auto_cancel_enabled: boolean
          from_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          email_enabled?: boolean
          sms_enabled?: boolean
          reminder_hours_before?: number
          cancellation_hours_notice?: number
          auto_cancel_enabled?: boolean
          from_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          business_id: string | null
          actor_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          business_id?: string | null
          actor_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_user_business_id: {
        Args: Record<string, never>
        Returns: string
      }
      is_business_owner: {
        Args: { target_business_id: string }
        Returns: boolean
      }
      is_business_member: {
        Args: { target_business_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      business_type: BusinessType
      booking_status: BookingStatus
      reminder_status: ReminderStatus
      day_of_week: DayOfWeek
      member_role: MemberRole
    }
    CompositeTypes: Record<string, never>
  }
}
