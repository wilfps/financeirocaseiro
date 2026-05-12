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

create unique index if not exists profiles_email_unique
on public.profiles (email);

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

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  user_email text not null,
  message text not null,
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
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1), 'Usuario'),
    coalesce(nullif(new.raw_user_meta_data ->> 'phoneDdd', ''), '00'),
    coalesce(nullif(new.raw_user_meta_data ->> 'phoneNumber', ''), '000000000'),
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

insert into public.profiles (
  id,
  name,
  phone_ddd,
  phone_number,
  email,
  birth_date,
  role
)
select
  users.id,
  coalesce(nullif(users.raw_user_meta_data ->> 'name', ''), split_part(coalesce(users.email, ''), '@', 1), 'Usuario'),
  coalesce(nullif(users.raw_user_meta_data ->> 'phoneDdd', ''), '00'),
  coalesce(nullif(users.raw_user_meta_data ->> 'phoneNumber', ''), '000000000'),
  coalesce(users.email, ''),
  coalesce((users.raw_user_meta_data ->> 'birthDate')::date, current_date),
  'user'
from auth.users users
left join public.profiles profiles on profiles.id = users.id
where profiles.id is null
on conflict (id) do nothing;

create or replace function public.ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles;
begin
  select *
  into current_profile
  from public.profiles
  where id = auth.uid();

  if current_profile.id is not null then
    return current_profile;
  end if;

  insert into public.profiles (
    id,
    name,
    phone_ddd,
    phone_number,
    email,
    birth_date,
    role
  )
  select
    auth.uid(),
    coalesce(raw_user_meta_data ->> 'name', split_part(email, '@', 1), 'Usuario'),
    coalesce(raw_user_meta_data ->> 'phoneDdd', '00'),
    coalesce(raw_user_meta_data ->> 'phoneNumber', '000000000'),
    coalesce(email, ''),
    coalesce((raw_user_meta_data ->> 'birthDate')::date, current_date),
    'user'
  from auth.users
  where id = auth.uid()
  returning * into current_profile;

  return current_profile;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.bills enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_select_own_or_admin" on public.transactions;
create policy "transactions_select_own_or_admin"
on public.transactions for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);

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
drop policy if exists "bills_select_own_or_admin" on public.bills;
create policy "bills_select_own_or_admin"
on public.bills for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);

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

drop policy if exists "feedback_select_own_or_admin" on public.feedback;
create policy "feedback_select_own_or_admin"
on public.feedback for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own"
on public.feedback for insert
to authenticated
with check (user_id = auth.uid());
