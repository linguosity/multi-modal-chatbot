-- Create user_settings table to persist per-user defaults
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_state text default 'California',
  evaluator_name text default '',
  evaluator_credentials text default '',
  school_name text default '',
  asha_number text default '',
  state_license_number text default '',
  show_toast_notifications boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;

-- Policies: a user can manage only their own settings
create policy if not exists "Select own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy if not exists "Insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy if not exists "Update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

