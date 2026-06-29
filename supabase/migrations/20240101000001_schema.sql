-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Users profile (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Courts table
create table public.courts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text,
  state text,
  district text,
  address text,
  city text,
  created_at timestamp with time zone default now()
);

-- Cases table
create table public.cases (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  court_id uuid references public.courts(id),
  status text default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Documents
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  file_url text,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.courts enable row level security;
alter table public.cases enable row level security;
alter table public.documents enable row level security;

-- Policies
create policy "Public courts readable" on public.courts for select using (true);
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users manage own cases" on public.cases for all using (auth.uid() = user_id);
create policy "Users manage own documents" on public.documents for all using (auth.uid() = user_id);