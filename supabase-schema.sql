create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone_ddd text not null,
  phone_number text not null,
  email text not null,
  birth_date date not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  title text not null,
  amount numeric(12, 2) not null,
  category text not null,
  payment_method text not null,
  date date not null,
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null,
  due_date date not null,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    name,
    phone_ddd,
    phone_number,
    email,
    birth_date,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phoneDdd', ''),
    coalesce(new.raw_user_meta_data ->> 'phoneNumber', ''),
    coalesce(new.email, ''),
    coalesce((new.raw_user_meta_data ->> 'birthDate')::date, current_date),
    'user'
  )
  on conflict (id) do update set
    name = excluded.name,
    phone_ddd = excluded.phone_ddd,
    phone_number = excluded.phone_number,
    email = excluded.email,
    birth_date = excluded.birth_date;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.bills enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
on public.transactions for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
on public.transactions for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "bills_select_own" on public.bills;
create policy "bills_select_own"
on public.bills for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "bills_insert_own" on public.bills;
create policy "bills_insert_own"
on public.bills for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "bills_update_own" on public.bills;
create policy "bills_update_own"
on public.bills for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "bills_delete_own" on public.bills;
create policy "bills_delete_own"
on public.bills for delete
to authenticated
using (user_id = auth.uid());
