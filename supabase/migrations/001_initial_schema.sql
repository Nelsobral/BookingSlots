-- ============================================================================
-- Booking Service — Initial Schema (Phase 1)
-- Multi-tenant SaaS for beauty professionals
-- ============================================================================
-- This migration creates all enums, tables, indexes, RLS policies and helper
-- functions required for Phase 1. Tenant isolation is enforced via RLS using
-- the `business_id` column present on every tenant-scoped table.
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
