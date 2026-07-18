-- RevLog initial schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> paste -> Run

-- ============ PROFILES ============
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ SERVICE TYPES (shared presets) ============
create table service_types (
  id serial primary key,
  name text not null,
  icon text,
  default_interval_miles int,
  default_interval_months int
);

insert into service_types (name, icon, default_interval_miles, default_interval_months) values
  ('Oil Change', 'oil', 5000, 6),
  ('Tire Rotation', 'tire', 6000, 6),
  ('New Tires', 'tire', 40000, null),
  ('Brake Pads', 'brake', 30000, null),
  ('Brake Fluid', 'brake', 30000, 24),
  ('Air Filter', 'filter', 15000, 12),
  ('Cabin Filter', 'filter', 15000, 12),
  ('Coolant Flush', 'coolant', 30000, 36),
  ('Transmission Fluid', 'transmission', 40000, null),
  ('Spark Plugs', 'spark', 60000, null),
  ('Battery', 'battery', null, 48),
  ('Wiper Blades', 'wiper', null, 12),
  ('Alignment', 'alignment', 12000, 12),
  ('Registration', 'document', null, 12),
  ('Inspection', 'document', null, 12),
  ('Detail / Wash', 'sparkle', null, null),
  ('Other', 'wrench', null, null);

-- ============ VEHICLES ============
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text,
  make text not null,
  model text not null,
  year int not null,
  trim text,
  vin text,
  current_mileage int default 0,
  photo_url text,
  is_archived boolean default false,
  created_at timestamptz default now()
);

-- ============ MAINTENANCE LOGS ============
create table maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  service_type_id int references service_types(id),
  title text not null,
  notes text,
  mileage int,
  cost numeric(10,2),
  currency text default 'USD',
  performed_at date not null default current_date,
  shop_name text,
  is_diy boolean default false,
  created_at timestamptz default now()
);

create table log_photos (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references maintenance_logs(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz default now()
);

-- ============ REMINDERS ============
create table reminders (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  service_type_id int references service_types(id),
  title text not null,
  due_mileage int,
  due_date date,
  is_recurring boolean default false,
  interval_miles int,
  interval_months int,
  is_completed boolean default false,
  created_at timestamptz default now()
);

-- ============ MODS ============
create table mods (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  name text not null,
  category text, -- e.g. suspension, exhaust, wheels, interior, tune
  brand text,
  cost numeric(10,2),
  installed_at date,
  mileage int,
  notes text,
  created_at timestamptz default now()
);

-- ============ FUEL LOGS ============
create table fuel_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  mileage int not null,
  gallons numeric(6,3) not null,
  price_per_gallon numeric(6,3),
  total_cost numeric(8,2),
  is_full_tank boolean default true,
  logged_at date not null default current_date,
  created_at timestamptz default now()
);

-- ============ INDEXES ============
create index idx_vehicles_user on vehicles(user_id);
create index idx_logs_vehicle on maintenance_logs(vehicle_id, performed_at desc);
create index idx_reminders_vehicle on reminders(vehicle_id) where not is_completed;
create index idx_fuel_vehicle on fuel_logs(vehicle_id, mileage desc);
create index idx_mods_vehicle on mods(vehicle_id);

-- ============ ROW LEVEL SECURITY ============
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table maintenance_logs enable row level security;
alter table log_photos enable row level security;
alter table reminders enable row level security;
alter table mods enable row level security;
alter table fuel_logs enable row level security;
alter table service_types enable row level security;

-- Profiles: users manage their own
create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Service types: readable by all signed-in users
create policy "read service types" on service_types
  for select using (auth.role() = 'authenticated');

-- Vehicles: users manage their own
create policy "own vehicles" on vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Child tables: access via owning vehicle
create policy "own logs" on maintenance_logs
  for all using (exists (select 1 from vehicles v where v.id = vehicle_id and v.user_id = auth.uid()))
  with check (exists (select 1 from vehicles v where v.id = vehicle_id and v.user_id = auth.uid()));

create policy "own log photos" on log_photos
  for all using (exists (
    select 1 from maintenance_logs l join vehicles v on v.id = l.vehicle_id
    where l.id = log_id and v.user_id = auth.uid()))
  with check (exists (
    select 1 from maintenance_logs l join vehicles v on v.id = l.vehicle_id
    where l.id = log_id and v.user_id = auth.uid()));

create policy "own reminders" on reminders
  for all using (exists (select 1 from vehicles v where v.id = vehicle_id and v.user_id = auth.uid()))
  with check (exists (select 1 from vehicles v where v.id = vehicle_id and v.user_id = auth.uid()));

create policy "own mods" on mods
  for all using (exists (select 1 from vehicles v where v.id = vehicle_id and v.user_id = auth.uid()))
  with check (exists (select 1 from vehicles v where v.id = vehicle_id and v.user_id = auth.uid()));

create policy "own fuel logs" on fuel_logs
  for all using (exists (select 1 from vehicles v where v.id = vehicle_id and v.user_id = auth.uid()))
  with check (exists (select 1 from vehicles v where v.id = vehicle_id and v.user_id = auth.uid()));

-- ============ STORAGE ============
-- Create a bucket for photos (vehicle + receipt images)
insert into storage.buckets (id, name, public) values ('photos', 'photos', false);

create policy "own photos read" on storage.objects
  for select using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos insert" on storage.objects
  for insert with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos delete" on storage.objects
  for delete using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
