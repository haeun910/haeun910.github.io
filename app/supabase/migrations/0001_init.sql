-- 토익 문장 단어장: schema, row-level security, and the functions the app calls.
-- Apply with `supabase db push` (CLI) or paste into the SQL editor of the Supabase dashboard.

-- ---------- Plans (what can be bought) ----------
create table if not exists public.plans (
  id        text primary key,            -- 'p30', 'p90'
  name      text not null,
  days      int  not null check (days > 0),
  price_krw int  not null check (price_krw >= 0),
  active    boolean not null default true,
  sort      int not null default 0
);
insert into public.plans (id, name, days, price_krw, sort) values
  ('p30', '30일 이용권', 30, 9900, 1),
  ('p90', '90일 이용권', 90, 19900, 2)
on conflict (id) do nothing;

-- ---------- Profiles ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do update set email = excluded.email;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Words (the paid content) ----------
create table if not exists public.words (
  id   text primary key,
  w    text not null,
  pos  text not null,
  lv   text not null default '600',        -- '600' | '750' | '900'
  tier text not null default 'pro' check (tier in ('free','pro')),
  data jsonb not null,                      -- sentence, quiz, glosses, traps…
  updated_at timestamptz not null default now()
);
create index if not exists words_tier_idx on public.words (tier);

-- ---------- Orders & passes ----------
create table if not exists public.orders (
  order_id    text primary key,              -- 'ord_YYYYMMDD_<hex>' sent to Toss as orderId
  user_id     uuid references auth.users(id) on delete set null,
  buyer_email text,
  plan_id     text not null references public.plans(id),
  amount      int  not null,
  order_name  text not null,
  status      text not null default 'pending' check (status in ('pending','paid','failed','canceled')),
  payment_key text,
  method      text,
  approved_at timestamptz,
  raw         jsonb,                          -- last payment object from Toss
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create table if not exists public.passes (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  plan_id   text not null references public.plans(id),
  order_id  text references public.orders(order_id),
  starts_at timestamptz not null default now(),
  ends_at   timestamptz not null,
  status    text not null default 'active' check (status in ('active','canceled')),
  created_at timestamptz not null default now()
);
create index if not exists passes_user_idx on public.passes (user_id, ends_at desc);

-- ---------- Learner progress (one JSON document per user) ----------
create table if not exists public.progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Product analytics (lightweight) ----------
create table if not exists public.events (
  id      bigint generated always as identity primary key,
  user_id uuid,
  anon_id text,
  name    text not null,
  props   jsonb not null default '{}'::jsonb,
  at      timestamptz not null default now()
);
create index if not exists events_at_idx on public.events (at desc);

-- ---------- Entitlement helpers ----------
create or replace function public.has_active_pass(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.passes p where p.user_id = uid and p.status = 'active' and p.ends_at > now());
$$;

create or replace function public.my_entitlement() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select jsonb_build_object('active', true, 'ends_at', p.ends_at, 'plan_id', p.plan_id)
       from public.passes p where p.user_id = auth.uid() and p.status = 'active' and p.ends_at > now()
       order by p.ends_at desc limit 1),
    jsonb_build_object('active', false));
$$;

-- Creates a pending order for the signed-in user; the price comes from the plans table, never from the client.
create or replace function public.create_order(p_plan text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare pl public.plans%rowtype; oid text; em text;
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  select * into pl from public.plans where id = p_plan and active; 
  if not found then raise exception 'unknown plan'; end if;
  select email into em from auth.users where id = auth.uid();
  oid := 'ord_' || to_char(now(), 'YYYYMMDD') || '_' || md5(random()::text || clock_timestamp()::text || auth.uid()::text);
  insert into public.orders (order_id, user_id, buyer_email, plan_id, amount, order_name) values (oid, auth.uid(), em, pl.id, pl.price_krw, pl.name);
  return jsonb_build_object('order_id', oid, 'amount', pl.price_krw, 'order_name', pl.name);
end $$;

-- Grants (or extends) a pass once a payment is confirmed. Called only by the edge functions with the service role.
create or replace function public.grant_pass(p_order text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; pl public.plans%rowtype; base timestamptz; e timestamptz;
begin
  select * into o from public.orders where order_id = p_order for update;
  if not found then raise exception 'unknown order'; end if;
  if o.user_id is null then raise exception 'order has no user'; end if;
  if exists (select 1 from public.passes where order_id = p_order) then
    return (select jsonb_build_object('ends_at', ends_at, 'plan_id', plan_id) from public.passes where order_id = p_order);
  end if;
  select * into pl from public.plans where id = o.plan_id;
  select greatest(coalesce(max(ends_at), now()), now()) into base from public.passes where user_id = o.user_id and status = 'active';
  e := base + (pl.days || ' days')::interval;
  insert into public.passes (user_id, plan_id, order_id, starts_at, ends_at) values (o.user_id, pl.id, p_order, base, e);
  return jsonb_build_object('ends_at', e, 'plan_id', pl.id);
end $$;

-- ---------- Row-level security ----------
alter table public.plans    enable row level security;
alter table public.profiles enable row level security;
alter table public.words    enable row level security;
alter table public.orders   enable row level security;
alter table public.passes   enable row level security;
alter table public.progress enable row level security;
alter table public.events   enable row level security;

drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select using (active);

drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles for select using (id = auth.uid());

-- free words for everyone, all words for an active pass
drop policy if exists words_read on public.words;
create policy words_read on public.words for select using (tier = 'free' or public.has_active_pass(auth.uid()));

drop policy if exists orders_own on public.orders;
create policy orders_own on public.orders for select using (user_id = auth.uid());

drop policy if exists passes_own on public.passes;
create policy passes_own on public.passes for select using (user_id = auth.uid());

drop policy if exists progress_own on public.progress;
create policy progress_own on public.progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert with check (user_id is null or user_id = auth.uid());

-- The catalog (word, part of speech, level, tier; no sentences) is visible to everyone so the app can show what is locked.
create or replace view public.catalog with (security_invoker = false) as
  select id, w, pos, lv, tier from public.words;
grant select on public.catalog to anon, authenticated;

-- Only the service role may write words/orders/passes directly (no insert/update policies for users).
grant usage on schema public to anon, authenticated;
grant select on public.plans, public.words, public.orders, public.passes, public.profiles to anon, authenticated;
grant select, insert, update, delete on public.progress to authenticated;
grant insert on public.events to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
grant execute on function public.my_entitlement() to anon, authenticated;
grant execute on function public.create_order(text) to authenticated;
revoke execute on function public.grant_pass(text) from public, anon, authenticated;
