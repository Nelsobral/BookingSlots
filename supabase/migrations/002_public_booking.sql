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
