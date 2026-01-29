-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Products Table
create table public.products (
  id text primary key, -- Use text to maintain compatibility with existing '1', '2' IDs or UUIDs
  sku text not null unique,
  name text not null,
  image_url text,
  stock int default 0,
  cost_price numeric default 0,
  customs_status text default 'arrived',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Transactions Table
create table public.transactions (
  id text primary key default uuid_generate_v4()::text,
  product_id text references public.products(id),
  type text not null, -- 'in' (入库) or 'out' (出库)
  quantity int not null,
  price numeric, -- Sale price or cost price snapshot
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Realtime Functionality
-- This is crucial for syncing across devices
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.transactions;

-- 5. (Optional) Row Level Security (RLS)
-- For a simple internal tool, we can enable public access for now.
-- In production, you should lock this down.
alter table public.products enable row level security;
alter table public.transactions enable row level security;

create policy "Enable all access for all users" on public.products
for all using (true) with check (true);

create policy "Enable all access for all users" on public.transactions
for all using (true) with check (true);
