-- ============================================================================
-- Booking Service — Seed Data (demo)
-- ============================================================================
-- Reproducible demo data using fixed UUIDs.
--
-- NOTE: This seed creates a demo auth user so the business has an owner.
-- If you already created this user via the Supabase Auth UI, remove the
-- auth.users INSERT block below and keep the same UUID.
--
-- Demo owner login (if using the auth insert below):
--   email:    owner@luxebeauty.demo
--   (password must be set via the Supabase dashboard / auth API)
-- ============================================================================

-- Fixed UUIDs -----------------------------------------------------------------
-- owner profile:  11111111-1111-1111-1111-111111111111
-- business:       22222222-2222-2222-2222-222222222222
-- staff Sophie:   33333333-3333-3333-3333-333333333331
-- staff Marcus:   33333333-3333-3333-3333-333333333332
-- services:       44444444-...  clients: 55555555-...  bookings: 66666666-...

-- ----------------------------------------------------------------------------
-- Demo auth user (optional — comment out if the user already exists)
-- ----------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'owner@luxebeauty.demo',
  crypt('DemoPassword123!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Nelson Sobral"}'
)
on conflict (id) do nothing;

-- profiles --------------------------------------------------------------------
insert into public.profiles (id, role, full_name, phone)
values
  ('11111111-1111-1111-1111-111111111111', 'business_owner', 'Nelson Sobral', '+1-555-0100')
on conflict (id) do update set full_name = excluded.full_name;

-- businesses ------------------------------------------------------------------
insert into public.businesses (
  id, owner_id, name, slug, type, email, phone, address, timezone,
  description, is_active, cancellation_hours_notice, reminder_enabled,
  reminder_hours_before, reminder_email_from
)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Luxe Beauty Studio',
  'luxe-beauty',
  'salon',
  'hello@luxebeauty.demo',
  '+1-555-0110',
  '123 Madison Ave, New York, NY 10016',
  'America/New_York',
  'Premium salon offering hair, massage, facials and nail care in the heart of Manhattan.',
  true, 24, true, 24, 'Nelsobral@gmail.com'
)
on conflict (id) do nothing;

-- business_members ------------------------------------------------------------
insert into public.business_members (id, business_id, profile_id, role, is_active)
values (
  '22222222-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'owner', true
)
on conflict (business_id, profile_id) do nothing;

-- staff_members ---------------------------------------------------------------
insert into public.staff_members (id, business_id, name, email, phone, role, is_active, buffer_minutes_after)
values
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222',
   'Sophie Laurent', 'sophie@luxebeauty.demo', '+1-555-0121', 'Senior Stylist', true, 10),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222',
   'Marcus Chen', 'marcus@luxebeauty.demo', '+1-555-0122', 'Massage Therapist', true, 15)
on conflict (id) do nothing;

-- services --------------------------------------------------------------------
insert into public.services (id, business_id, name, category, duration_minutes, price, description, is_active, color)
values
  ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222222',
   'Haircut & Style', 'Hair', 60, 85.00, 'Precision cut and blow-dry styling.', true, '#e11d48'),
  ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222',
   'Deep Tissue Massage', 'Massage', 90, 120.00, 'Therapeutic deep tissue massage.', true, '#9333ea'),
  ('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222222',
   'Facial Treatment', 'Skincare', 60, 95.00, 'Rejuvenating facial with premium products.', true, '#0ea5e9'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
   'Manicure & Pedicure', 'Nails', 75, 65.00, 'Complete hand and foot care.', true, '#f59e0b')
on conflict (id) do nothing;

-- service_staff ---------------------------------------------------------------
insert into public.service_staff (service_id, staff_member_id)
values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331'),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331'),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333331'),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332')
on conflict do nothing;

-- availability_rules (Mon-Sat 09:00-18:00 for both staff) ---------------------
insert into public.availability_rules (business_id, staff_member_id, day_of_week, start_time, end_time, is_active)
select
  '22222222-2222-2222-2222-222222222222',
  staff_id,
  d::day_of_week,
  '09:00'::time,
  '18:00'::time,
  true
from
  (values
    ('33333333-3333-3333-3333-333333333331'::uuid),
    ('33333333-3333-3333-3333-333333333332'::uuid)
  ) as s(staff_id)
cross join
  (values ('monday'),('tuesday'),('wednesday'),('thursday'),('friday'),('saturday')) as w(d);

-- clients ---------------------------------------------------------------------
insert into public.clients (id, business_id, name, email, phone, notes, no_show_count, is_blocked)
values
  ('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222222',
   'Emma Rodriguez', 'emma@example.com', '+1-555-0201', 'Prefers afternoon appointments.', 0, false),
  ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222222',
   'James Wilson', 'james@example.com', '+1-555-0202', null, 1, false),
  ('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222222',
   'Olivia Brown', 'olivia@example.com', '+1-555-0203', 'Allergic to lavender products.', 0, false)
on conflict (id) do nothing;

-- bookings (5 upcoming, spread over next 2 weeks, mixed statuses) --------------
insert into public.bookings (
  id, business_id, client_id, staff_member_id, service_id,
  start_time, end_time, status, notes, confirmed_at
)
values
  ('66666666-6666-6666-6666-666666666661', '22222222-2222-2222-2222-222222222222',
   '55555555-5555-5555-5555-555555555551', '33333333-3333-3333-3333-333333333331',
   '44444444-4444-4444-4444-444444444441',
   (now() + interval '1 day')::date + time '10:00',
   (now() + interval '1 day')::date + time '11:00',
   'confirmed', 'Regular trim.', now()),

  ('66666666-6666-6666-6666-666666666662', '22222222-2222-2222-2222-222222222222',
   '55555555-5555-5555-5555-555555555552', '33333333-3333-3333-3333-333333333332',
   '44444444-4444-4444-4444-444444444442',
   (now() + interval '2 day')::date + time '14:00',
   (now() + interval '2 day')::date + time '15:30',
   'pending', null, null),

  ('66666666-6666-6666-6666-666666666663', '22222222-2222-2222-2222-222222222222',
   '55555555-5555-5555-5555-555555555553', '33333333-3333-3333-3333-333333333331',
   '44444444-4444-4444-4444-444444444443',
   (now() + interval '4 day')::date + time '11:30',
   (now() + interval '4 day')::date + time '12:30',
   'confirmed', 'First facial appointment.', now()),

  ('66666666-6666-6666-6666-666666666664', '22222222-2222-2222-2222-222222222222',
   '55555555-5555-5555-5555-555555555551', '33333333-3333-3333-3333-333333333331',
   '44444444-4444-4444-4444-444444444444',
   (now() + interval '8 day')::date + time '15:00',
   (now() + interval '8 day')::date + time '16:15',
   'pending', null, null),

  ('66666666-6666-6666-6666-666666666665', '22222222-2222-2222-2222-222222222222',
   '55555555-5555-5555-5555-555555555552', '33333333-3333-3333-3333-333333333332',
   '44444444-4444-4444-4444-444444444442',
   (now() + interval '12 day')::date + time '09:30',
   (now() + interval '12 day')::date + time '11:00',
   'cancelled', 'Client rescheduling.', null)
on conflict (id) do nothing;

-- notification_preferences ----------------------------------------------------
insert into public.notification_preferences (
  business_id, email_enabled, sms_enabled, reminder_hours_before,
  cancellation_hours_notice, auto_cancel_enabled, from_email
)
values (
  '22222222-2222-2222-2222-222222222222',
  true, false, 24, 24, false, 'Nelsobral@gmail.com'
)
on conflict (business_id) do nothing;
