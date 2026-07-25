/**
 * Domain types for the Booking Service application.
 * These are convenience aliases derived from the generated database types.
 */
import type { Database } from './database'

export type {
  UserRole,
  BusinessType,
  BookingStatus,
  ReminderStatus,
  DayOfWeek,
  MemberRole,
  Json,
} from './database'

type Tables = Database['public']['Tables']

export type Profile = Tables['profiles']['Row']
export type Business = Tables['businesses']['Row']
export type BusinessMember = Tables['business_members']['Row']
export type StaffMember = Tables['staff_members']['Row']
export type Service = Tables['services']['Row']
export type ServiceStaff = Tables['service_staff']['Row']
export type AvailabilityRule = Tables['availability_rules']['Row']
export type AvailabilityException = Tables['availability_exceptions']['Row']
export type Client = Tables['clients']['Row']
export type Booking = Tables['bookings']['Row']
export type ReminderEvent = Tables['reminder_events']['Row']
export type NotificationPreferences = Tables['notification_preferences']['Row']
export type AuditLog = Tables['audit_logs']['Row']

/** A booking joined with its related client, service and staff records. */
export interface BookingWithRelations extends Booking {
  client: Pick<Client, 'id' | 'name' | 'email' | 'phone'> | null
  service: Pick<Service, 'id' | 'name' | 'price' | 'duration_minutes' | 'color'> | null
  staff_member: Pick<StaffMember, 'id' | 'name'> | null
}

/** A service joined with the staff members assigned to it. */
export interface ServiceWithStaff extends Service {
  service_staff: { staff_member_id: string }[]
}

/** Standard result shape returned by all server actions. */
export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { error: string }

/** Aggregated stats displayed on the dashboard. */
export interface DashboardStats {
  upcomingCount: number
  todayCount: number
  estimatedRevenue: number
  cancelledThisWeek: number
  clientCount: number
}
