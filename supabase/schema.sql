-- Coffre : une ligne par utilisateur, contenant uniquement le coffre CHIFFRÉ.
-- À exécuter une seule fois dans Supabase → SQL Editor → New query → Run.

create table if not exists public.vaults (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  envelope   jsonb       not null,           -- { v, kdf: { alg, salt, iter }, iv, data } : illisible sans le mot de passe maître
  revision   integer     not null default 1, -- sert à détecter les modifications concurrentes entre appareils
  updated_at timestamptz not null default now()
);

-- Chaque utilisateur ne peut voir et modifier QUE sa propre ligne.
alter table public.vaults enable row level security;

drop policy if exists "vault_select_own" on public.vaults;
drop policy if exists "vault_insert_own" on public.vaults;
drop policy if exists "vault_update_own" on public.vaults;
drop policy if exists "vault_delete_own" on public.vaults;

create policy "vault_select_own" on public.vaults for select using (auth.uid() = user_id);
create policy "vault_insert_own" on public.vaults for insert with check (auth.uid() = user_id);
create policy "vault_update_own" on public.vaults for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "vault_delete_own" on public.vaults for delete using (auth.uid() = user_id);

-- Garde-fou : un coffre ne doit pas dépasser 5 Mo.
alter table public.vaults drop constraint if exists vault_size;
alter table public.vaults add constraint vault_size check (octet_length(envelope::text) < 5000000);
