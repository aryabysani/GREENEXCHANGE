-- ============================================================
-- GreenCredits — Carbon Credits Trading Platform
-- Supabase Schema & RLS Policies
-- ============================================================

-- ── PROFILES ────────────────────────────────────────────────
-- One row per stall/user. Admin pre-creates these.

create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  stall_name       text not null,
  whatsapp_number  text,
  carbon_balance   integer not null default 100,
  created_at       timestamp with time zone default now()
);

comment on table  profiles                  is 'One profile per stall. Carbon balance is admin-managed.';
comment on column profiles.carbon_balance   is 'Surplus credits available to sell. Updated manually by admin.';
comment on column profiles.whatsapp_number  is 'Required to create listings. Shown only to logged-in users.';

-- ── LISTINGS ─────────────────────────────────────────────────
-- Each listing = a stall offering credits for sale.

create type listing_status as enum ('live', 'sold', 'removed');

create table if not exists listings (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid not null references profiles(id) on delete cascade,
  credits_amount   integer not null check (credits_amount > 0),
  price_per_credit numeric(10, 2) not null check (price_per_credit > 0),
  total_price      numeric(10, 2) not null,
  description      text,
  status           listing_status not null default 'live',
  created_at       timestamp with time zone default now()
);

comment on table  listings                is 'Carbon credit listings. Anyone can read live ones; only seller can modify.';
comment on column listings.total_price    is 'Denormalized: credits_amount * price_per_credit. Set on insert.';

-- Index for fast marketplace queries
create index if not exists listings_status_created_idx on listings (status, created_at desc);
create index if not exists listings_seller_idx         on listings (seller_id);

-- ── TRANSACTIONS (OPTIONAL AUDIT LOG) ───────────────────────
-- Record of completed credit trades. Not enforced — for record-keeping only.

create table if not exists transactions (
  id             uuid primary key default gen_random_uuid(),
  buyer_id       uuid references profiles(id),
  seller_id      uuid references profiles(id),
  listing_id     uuid references listings(id),
  credits_amount integer,
  total_price    numeric(10, 2),
  created_at     timestamp with time zone default now()
);

comment on table transactions is 'Optional audit log of completed trades. Not automatically enforced.';

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

alter table profiles     enable row level security;
alter table listings     enable row level security;
alter table transactions enable row level security;

-- profiles: everyone can read (stall name shown on listing cards)
create policy "Profiles are publicly readable"
  on profiles for select
  using (true);

-- profiles: users can only update their own row
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- listings: anyone can see live listings (for marketplace browsing)
create policy "Live listings are publicly readable"
  on listings for select
  using (status = 'live' or seller_id = auth.uid());

-- listings: only authenticated users can create
create policy "Authenticated users can create listings"
  on listings for insert
  to authenticated
  with check (auth.uid() = seller_id);

-- listings: only the seller can update their listing
create policy "Sellers can update own listings"
  on listings for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- listings: only the seller can delete (hard delete — prefer status='removed')
create policy "Sellers can delete own listings"
  on listings for delete
  using (auth.uid() = seller_id);

-- transactions: any authenticated user can read (for transparency)
create policy "Authenticated users can view transactions"
  on transactions for select
  to authenticated
  using (true);

-- transactions: any authenticated user can create a transaction record
create policy "Authenticated users can create transactions"
  on transactions for insert
  to authenticated
  with check (true);

-- ── SAMPLE PROFILES (30 stalls) ──────────────────────────────
-- Run this AFTER creating user accounts in Supabase Auth.
-- Replace the UUIDs below with the actual auth.users IDs.
-- In Supabase dashboard: Auth > Users > copy each user's ID.

-- Example format (replace UUIDs):
-- insert into profiles (id, stall_name, carbon_balance) values
--   ('<uuid-of-stall01@fest.com>', 'Food Court',        100),
--   ('<uuid-of-stall02@fest.com>', 'Gaming Zone',       100),
--   ('<uuid-of-stall03@fest.com>', 'Merch Stall',       100),
--   ('<uuid-of-stall04@fest.com>', 'Tech Demos',        100),
--   ('<uuid-of-stall05@fest.com>', 'Art Gallery',       100),
--   ('<uuid-of-stall06@fest.com>', 'Music Corner',      100),
--   ('<uuid-of-stall07@fest.com>', 'Photo Booth',       100),
--   ('<uuid-of-stall08@fest.com>', 'Smoothie Bar',      100),
--   ('<uuid-of-stall09@fest.com>', 'Book Stall',        100),
--   ('<uuid-of-stall10@fest.com>', 'Coding Club',       100),
--   ('<uuid-of-stall11@fest.com>', 'Robotics Club',     100),
--   ('<uuid-of-stall12@fest.com>', 'Sports Zone',       100),
--   ('<uuid-of-stall13@fest.com>', 'Drama Society',     100),
--   ('<uuid-of-stall14@fest.com>', 'Debate Club',       100),
--   ('<uuid-of-stall15@fest.com>', 'Film Club',         100),
--   ('<uuid-of-stall16@fest.com>', 'Dance Studio',      100),
--   ('<uuid-of-stall17@fest.com>', 'Craft Workshop',    100),
--   ('<uuid-of-stall18@fest.com>', 'Bake Sale',         100),
--   ('<uuid-of-stall19@fest.com>', 'Science Fair',      100),
--   ('<uuid-of-stall20@fest.com>', 'Quiz Corner',       100),
--   ('<uuid-of-stall21@fest.com>', 'Photography Club',  100),
--   ('<uuid-of-stall22@fest.com>', 'Design Lab',        100),
--   ('<uuid-of-stall23@fest.com>', 'Finance Club',      100),
--   ('<uuid-of-stall24@fest.com>', 'Marketing Cell',    100),
--   ('<uuid-of-stall25@fest.com>', 'Startup Hub',       100),
--   ('<uuid-of-stall26@fest.com>', 'Wellness Corner',   100),
--   ('<uuid-of-stall27@fest.com>', 'Cultural Society',  100),
--   ('<uuid-of-stall28@fest.com>', 'Environment Club',  100),
--   ('<uuid-of-stall29@fest.com>', 'Astronomy Club',    100),
--   ('<uuid-of-stall30@fest.com>', 'Innovation Lab',    100);
