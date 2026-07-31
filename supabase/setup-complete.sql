-- ============================================================================
-- Booking Service — Complete Setup (Schema + Seed Data)
-- ============================================================================
-- Run this file in your Supabase SQL Editor to:
-- 1. Create all database tables, indexes, RLS policies
-- 2. Load demo data for "Luxe Beauty Studio"
-- ============================================================================

-- Required extensions ---------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================
create type user_role as enum ('platform_owner', 'business_owner', 'staff', 'client');
create type business_type as enum ('esthetician', 'massage_therapist', 'hairdresser', 'salon', 'other');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
create type reminder_status as enum ('pending', 'sent', 'failed', 'confirmed', 'cancelled');
create type day_of_week as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
create type member_role as enum ('owner', 'staff', 'viewer');

-- ============================================================================
-- Helper: automatically maintain updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- profiles -------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'business_owner',
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- businesses -----------------------------------------------------------------
create table public.businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  type business_type not null default 'salon',
  email text,
  phone text,
  address text,
  timezone text not null default 'America/New_York',
  description text,
  logo_url text,
  is_active boolean not null default true,
  cancellation_hours_notice integer not null default 24,
  reminder_enabled boolean not null default true,
  reminder_hours_before integer not null default 24,
  reminder_email_from text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- business_members -----------------------------------------------------------
create table public.business_members (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role member_role not null default 'owner',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, profile_id)
);

-- staff_members --------------------------------------------------------------
create table public.staff_members (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  role text,
  is_active boolean not null default true,
  buffer_minutes_after integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- services -------------------------------------------------------------------
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  category text,
  duration_minutes integer not null default 60,
  price numeric(10, 2) not null default 0,
  description text,
  is_active boolean not null default true,
  color text default '#e11d48',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- service_staff (junction) ---------------------------------------------------
create table public.service_staff (
  service_id uuid not null references public.services(id) on delete cascade,
  staff_member_id uuid not null references public.staff_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (service_id, staff_member_id)
);

-- availability_rules ---------------------------------------------------------
create table public.availability_rules (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_member_id uuid references public.staff_members(id) on delete cascade,
  day_of_week day_of_week not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- availability_exceptions ----------------------------------------------------
create table public.availability_exceptions (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_member_id uuid references public.staff_members(id) on delete cascade,
  date date not null,
  is_available boolean not null default false,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- clients --------------------------------------------------------------------
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  notes text,
  no_show_count integer not null default 0,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- bookings -------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  staff_member_id uuid references public.staff_members(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status booking_status not null default 'pending',
  notes text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- reminder_events ------------------------------------------------------------
create table public.reminder_events (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  channel text not null default 'email',
  status reminder_status not null default 'pending',
  scheduled_at timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- notification_preferences ---------------------------------------------------
create table public.notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  reminder_hours_before integer not null default 24,
  cancellation_hours_notice integer not null default 24,
  auto_cancel_enabled boolean not null default false,
  from_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id)
);

-- audit_logs -----------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.business_members
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.staff_members
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.availability_rules
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.availability_exceptions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.reminder_events
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_businesses_owner_id on public.businesses(owner_id);
create index idx_businesses_slug on public.businesses(slug);
create index idx_business_members_business_id on public.business_members(business_id);
create index idx_business_members_profile_id on public.business_members(profile_id);
create index idx_staff_members_business_id on public.staff_members(business_id);
create index idx_services_business_id on public.services(business_id);
create index idx_service_staff_staff_member_id on public.service_staff(staff_member_id);
create index idx_availability_rules_business_id on public.availability_rules(business_id);
create index idx_availability_rules_staff_member_id on public.availability_rules(staff_member_id);
create index idx_availability_exceptions_business_id on public.availability_exceptions(business_id);
create index idx_clients_business_id on public.clients(business_id);
create index idx_clients_email on public.clients(email);
create index idx_bookings_business_id on public.bookings(business_id);
create index idx_bookings_start_time_status on public.bookings(start_time, status);
create index idx_bookings_staff_member_start_time on public.bookings(staff_member_id, start_time);
create index idx_bookings_client_id on public.bookings(client_id);
create index idx_reminder_events_booking_id on public.reminder_events(booking_id);
create index idx_notification_preferences_business_id on public.notification_preferences(business_id);
create index idx_audit_logs_business_id on public.audit_logs(business_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Returns the business_id for the current authenticated user's active
-- business_member record. Used throughout RLS policies for tenant isolation.
create or replace function public.get_user_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select bm.business_id
  from public.business_members bm
  where bm.profile_id = auth.uid()
    and bm.is_active = true
  limit 1;
$$;

-- Returns true if the current user is the owner of the given business.
create or replace function public.is_business_owner(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.profile_id = auth.uid()
      and bm.role = 'owner'
      and bm.is_active = true
  );
$$;

-- Returns true if the current user is a member of the given business.
create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.profile_id = auth.uid()
      and bm.is_active = true
  );
$$;

-- Auto-create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'business_owner'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.staff_members enable row level security;
alter table public.services enable row level security;
alter table public.service_staff enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.clients enable row level security;
alter table public.bookings enable row level security;
alter table public.reminder_events enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.audit_logs enable row level security;

-- profiles -------------------------------------------------------------------
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());
create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- businesses -----------------------------------------------------------------
create policy "Owners can read own business"
  on public.businesses for select
  using (public.is_business_member(id));
create policy "Users can create a business they own"
  on public.businesses for insert
  with check (owner_id = auth.uid());
create policy "Owners can update own business"
  on public.businesses for update
  using (public.is_business_owner(id))
  with check (public.is_business_owner(id));
create policy "Owners can delete own business"
  on public.businesses for delete
  using (public.is_business_owner(id));

-- business_members -----------------------------------------------------------
create policy "Members can read their business members"
  on public.business_members for select
  using (public.is_business_member(business_id) or profile_id = auth.uid());
create policy "Users can add themselves as members"
  on public.business_members for insert
  with check (profile_id = auth.uid() or public.is_business_owner(business_id));
create policy "Owners can update members"
  on public.business_members for update
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));
create policy "Owners can remove members"
  on public.business_members for delete
  using (public.is_business_owner(business_id));

-- staff_members --------------------------------------------------------------
create policy "Members can read staff"
  on public.staff_members for select
  using (public.is_business_member(business_id));
create policy "Owners can insert staff"
  on public.staff_members for insert
  with check (public.is_business_owner(business_id));
create policy "Owners can update staff"
  on public.staff_members for update
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));
create policy "Owners can delete staff"
  on public.staff_members for delete
  using (public.is_business_owner(business_id));

-- services -------------------------------------------------------------------
create policy "Members can read services"
  on public.services for select
  using (public.is_business_member(business_id));
create policy "Owners can insert services"
  on public.services for insert
  with check (public.is_business_owner(business_id));
create policy "Owners can update services"
  on public.services for update
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));
create policy "Owners can delete services"
  on public.services for delete
  using (public.is_business_owner(business_id));

-- service_staff --------------------------------------------------------------
create policy "Members can read service_staff"
  on public.service_staff for select
  using (
    exists (
      select 1 from public.services s
      where s.id = service_id and public.is_business_member(s.business_id)
    )
  );
create policy "Owners can write service_staff"
  on public.service_staff for all
  using (
    exists (
      select 1 from public.services s
      where s.id = service_id and public.is_business_owner(s.business_id)
    )
  )
  with check (
    exists (
      select 1 from public.services s
      where s.id = service_id and public.is_business_owner(s.business_id)
    )
  );

-- availability_rules ---------------------------------------------------------
create policy "Members can read availability_rules"
  on public.availability_rules for select
  using (public.is_business_member(business_id));
create policy "Owners can write availability_rules"
  on public.availability_rules for all
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

-- availability_exceptions ----------------------------------------------------
create policy "Members can read availability_exceptions"
  on public.availability_exceptions for select
  using (public.is_business_member(business_id));
create policy "Owners can write availability_exceptions"
  on public.availability_exceptions for all
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

-- clients --------------------------------------------------------------------
create policy "Members can read clients"
  on public.clients for select
  using (public.is_business_member(business_id) or profile_id = auth.uid());
create policy "Members can insert clients"
  on public.clients for insert
  with check (public.is_business_member(business_id));
create policy "Members can update clients"
  on public.clients for update
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
create policy "Owners can delete clients"
  on public.clients for delete
  using (public.is_business_owner(business_id));

-- bookings -------------------------------------------------------------------
create policy "Members can read bookings"
  on public.bookings for select
  using (
    public.is_business_member(business_id)
    or exists (
      select 1 from public.clients c
      where c.id = client_id and c.profile_id = auth.uid()
    )
  );
create policy "Members can insert bookings"
  on public.bookings for insert
  with check (public.is_business_member(business_id));
create policy "Members can update bookings"
  on public.bookings for update
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
create policy "Owners can delete bookings"
  on public.bookings for delete
  using (public.is_business_owner(business_id));

-- reminder_events ------------------------------------------------------------
create policy "Members can read reminder_events"
  on public.reminder_events for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and public.is_business_member(b.business_id)
    )
  );
create policy "Members can write reminder_events"
  on public.reminder_events for all
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and public.is_business_member(b.business_id)
    )
  )
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and public.is_business_member(b.business_id)
    )
  );

-- notification_preferences ---------------------------------------------------
create policy "Owners can read notification_preferences"
  on public.notification_preferences for select
  using (public.is_business_member(business_id));
create policy "Owners can write notification_preferences"
  on public.notification_preferences for all
  using (public.is_business_owner(business_id))
  with check (public.is_business_owner(business_id));

-- audit_logs -----------------------------------------------------------------
create policy "Members can read audit_logs"
  on public.audit_logs for select
  using (public.is_business_member(business_id));
create policy "Members can insert audit_logs"
  on public.audit_logs for insert
  with check (public.is_business_member(business_id));

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Demo auth user (owner@luxebeauty.demo / password: DemoPassword123!)
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

-- profiles
insert into public.profiles (id, role, full_name, phone)
values
  ('11111111-1111-1111-1111-111111111111', 'business_owner', 'Nelson Sobral', '+1-555-0100')
on conflict (id) do update set full_name = excluded.full_name;

-- businesses
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

-- business_members
insert into public.business_members (id, business_id, profile_id, role, is_active)
values (
  '22222222-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'owner', true
)
on conflict (business_id, profile_id) do nothing;

-- staff_members
insert into public.staff_members (id, business_id, name, email, phone, role, is_active, buffer_minutes_after)
values
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222',
   'Sophie Laurent', 'sophie@luxebeauty.demo', '+1-555-0121', 'Senior Stylist', true, 10),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222',
   'Marcus Chen', 'marcus@luxebeauty.demo', '+1-555-0122', 'Massage Therapist', true, 15)
on conflict (id) do nothing;

-- services
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

-- service_staff
insert into public.service_staff (service_id, staff_member_id)
values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331'),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331'),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333331'),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332')
on conflict do nothing;

-- availability_rules (Mon-Sat 09:00-18:00 for both staff)
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

-- clients
insert into public.clients (id, business_id, name, email, phone, notes, no_show_count, is_blocked)
values
  ('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222222',
   'Emma Rodriguez', 'emma@example.com', '+1-555-0201', 'Prefers afternoon appointments.', 0, false),
  ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222222',
   'James Wilson', 'james@example.com', '+1-555-0202', null, 1, false),
  ('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222222',
   'Olivia Brown', 'olivia@example.com', '+1-555-0203', 'Allergic to lavender products.', 0, false)
on conflict (id) do nothing;

-- bookings (5 upcoming, spread over next 2 weeks)
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

-- notification_preferences
insert into public.notification_preferences (
  business_id, email_enabled, sms_enabled, reminder_hours_before,
  cancellation_hours_notice, auto_cancel_enabled, from_email
)
values (
  '22222222-2222-2222-2222-222222222222',
  true, false, 24, 24, false, 'Nelsobral@gmail.com'
)
on conflict (business_id) do nothing;

-- ============================================================================
-- Setup Complete!
-- ============================================================================
-- You can now log in with:
--   Email: owner@luxebeauty.demo
--   Password: DemoPassword123!
--
-- Or sign up with your own account via the app's signup page.
-- ============================================================================


-- ============================================================================
-- 002 — Public Booking Access
-- ============================================================================
-- The public booking flow (/book/[slug]) is used by ANONYMOUS visitors.
-- The initial schema only allowed business members to read their data, so the
-- public storefront returned 404 and bookings could not be created.
--
-- This migration:
--   1. Adds public SELECT policies for the booking "storefront" catalog
--      (businesses, services, staff, availability). This is public info.
--   2. Adds SECURITY DEFINER functions so anonymous visitors can check taken
--      slots and create a booking WITHOUT exposing other clients' personal
--      data or granting broad INSERT/SELECT on bookings/clients.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Public read policies (storefront catalog)
-- ---------------------------------------------------------------------------
-- RLS combines multiple policies with OR, so these ADD public read access on
-- top of the existing member-only policies.

drop policy if exists "Public read active businesses" on public.businesses;
create policy "Public read active businesses"
  on public.businesses for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read active services" on public.services;
create policy "Public read active services"
  on public.services for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read active staff" on public.staff_members;
create policy "Public read active staff"
  on public.staff_members for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read service_staff" on public.service_staff;
create policy "Public read service_staff"
  on public.service_staff for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read availability_rules" on public.availability_rules;
create policy "Public read availability_rules"
  on public.availability_rules for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read availability_exceptions" on public.availability_exceptions;
create policy "Public read availability_exceptions"
  on public.availability_exceptions for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 2. SECURITY DEFINER helpers for the anonymous booking flow
-- ---------------------------------------------------------------------------

-- Returns only the busy intervals needed to compute availability. It never
-- exposes client identity, notes, or any other booking PII.
create or replace function public.get_taken_slots(
  p_business_id uuid,
  p_date date
)
returns table (
  staff_member_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  buffer_minutes_after integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.staff_member_id,
    b.start_time,
    b.end_time,
    coalesce(s.buffer_minutes_after, 0)
  from public.bookings b
  left join public.staff_members s on s.id = b.staff_member_id
  where b.business_id = p_business_id
    and b.start_time >= p_date::timestamptz
    and b.start_time < (p_date + 1)::timestamptz
    and b.status in ('pending', 'confirmed');
$$;

grant execute on function public.get_taken_slots(uuid, date) to anon, authenticated;

-- Atomically create a public booking: validates business/service, upserts the
-- client by email, rejects overlapping slots, and inserts the booking. Returns
-- only the new booking's id and times.
create or replace function public.create_public_booking(
  p_slug text,
  p_service_id uuid,
  p_staff_member_id uuid,
  p_date date,
  p_time time,
  p_client_name text,
  p_client_email text,
  p_client_phone text default null,
  p_notes text default null
)
returns table (
  booking_id uuid,
  start_time timestamptz,
  end_time timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_duration integer;
  v_client_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_conflicts integer;
  v_booking_id uuid;
begin
  -- Resolve active business
  select id into v_business_id
  from public.businesses
  where slug = p_slug and is_active = true;
  if v_business_id is null then
    raise exception 'business_not_found';
  end if;

  -- Resolve active service and its duration
  select duration_minutes into v_duration
  from public.services
  where id = p_service_id and business_id = v_business_id and is_active = true;
  if v_duration is null then
    raise exception 'service_not_found';
  end if;

  v_start := (p_date + p_time);
  v_end := v_start + make_interval(mins => v_duration);

  -- Reject bookings in the past
  if v_start < now() then
    raise exception 'slot_in_past';
  end if;

  -- Overlap / double-booking protection
  select count(*) into v_conflicts
  from public.bookings
  where business_id = v_business_id
    and staff_member_id = p_staff_member_id
    and status in ('pending', 'confirmed')
    and tstzrange(start_time, end_time) && tstzrange(v_start, v_end);
  if v_conflicts > 0 then
    raise exception 'slot_taken';
  end if;

  -- Upsert client by email within the business
  select id into v_client_id
  from public.clients
  where business_id = v_business_id and email = p_client_email
  limit 1;

  if v_client_id is null then
    insert into public.clients (business_id, name, email, phone)
    values (v_business_id, p_client_name, p_client_email, p_client_phone)
    returning id into v_client_id;
  end if;

  insert into public.bookings (
    business_id, client_id, staff_member_id, service_id,
    start_time, end_time, status, notes
  )
  values (
    v_business_id, v_client_id, p_staff_member_id, p_service_id,
    v_start, v_end, 'pending', p_notes
  )
  returning id, bookings.start_time, bookings.end_time
  into v_booking_id, v_start, v_end;

  return query select v_booking_id, v_start, v_end;
end;
$$;

grant execute on function public.create_public_booking(
  text, uuid, uuid, date, time, text, text, text, text
) to anon, authenticated;

-- ============================================================================
-- Done. Public booking flow now works for anonymous visitors.
-- ============================================================================
