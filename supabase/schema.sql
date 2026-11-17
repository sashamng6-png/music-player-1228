-- =====================================================================
--  MusicFlow — спільна музична бібліотека (Supabase)
--  Виконайте цей файл один раз у Supabase Dashboard → SQL Editor.
--  Скрипт ідемпотентний: його можна запускати повторно.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Профілі користувачів
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (char_length(trim(username)) between 2 and 30),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Публічні профілі користувачів MusicFlow.';

-- ---------------------------------------------------------------------
-- 2. Треки
-- ---------------------------------------------------------------------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  artist text not null check (char_length(trim(artist)) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  genre text not null default 'Інше' check (char_length(genre) between 1 and 60),
  audio_url text not null,
  cover_url text,
  duration numeric check (duration is null or duration >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tracks is
  'Опубліковані треки спільноти MusicFlow. Файли лежать у Storage.';

-- Міграційні доповнення для проєктів, створених раніше.
alter table public.tracks add column if not exists duration numeric;
alter table public.tracks add column if not exists published boolean not null default true;

create index if not exists tracks_user_id_idx on public.tracks (user_id);
create index if not exists tracks_created_at_idx on public.tracks (created_at desc);
create index if not exists tracks_genre_idx on public.tracks (genre);
create index if not exists tracks_published_idx on public.tracks (published);

-- ---------------------------------------------------------------------
-- 3. Автоматичне оновлення updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists tracks_set_updated_at on public.tracks;
create trigger tracks_set_updated_at
  before update on public.tracks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. Профіль створюється автоматично після реєстрації
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_username text;
begin
  desired_username := trim(coalesce(new.raw_user_meta_data ->> 'username', ''));

  if char_length(desired_username) < 2 then
    desired_username := trim(coalesce(split_part(coalesce(new.email, ''), '@', 1), ''));
  end if;

  if char_length(desired_username) < 2 then
    desired_username := 'Слухач MusicFlow';
  end if;

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    left(desired_username, 30),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Профілі для акаунтів, створених до встановлення тригера.
insert into public.profiles (id, username)
select
  u.id,
  left(
    case
      when char_length(trim(coalesce(u.raw_user_meta_data ->> 'username', ''))) between 2 and 30
        then trim(u.raw_user_meta_data ->> 'username')
      when char_length(trim(coalesce(split_part(coalesce(u.email, ''), '@', 1), ''))) >= 2
        then trim(split_part(coalesce(u.email, ''), '@', 1))
      else 'Слухач MusicFlow'
    end,
    30
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.tracks enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.tracks to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.tracks to authenticated;

-- --- profiles ---------------------------------------------------------
drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Users insert their own profile" on public.profiles;
create policy "Users insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- --- tracks -----------------------------------------------------------
drop policy if exists "Published tracks are public" on public.tracks;
create policy "Published tracks are public"
  on public.tracks for select
  to anon, authenticated
  using (published = true or auth.uid() = user_id);

drop policy if exists "Authenticated users insert own tracks" on public.tracks;
create policy "Authenticated users insert own tracks"
  on public.tracks for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Owners update their tracks" on public.tracks;
create policy "Owners update their tracks"
  on public.tracks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Owners delete their tracks" on public.tracks;
create policy "Owners delete their tracks"
  on public.tracks for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6. Storage buckets: tracks (аудіо) і covers (обкладинки)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'tracks',
    'tracks',
    true,
    26214400, -- 25 MB
    array[
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/wave',
      'audio/ogg',
      'audio/mp4',
      'audio/x-m4a',
      'audio/flac',
      'audio/aac'
    ]
  ),
  (
    'covers',
    'covers',
    true,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Публічне читання файлів (обкладинки й аудіо).
drop policy if exists "MusicFlow public files are readable" on storage.objects;
create policy "MusicFlow public files are readable"
  on storage.objects for select
  to public
  using (bucket_id in ('tracks', 'covers'));

-- Кожен користувач завантажує файли лише у власну папку <user_id>/...
drop policy if exists "MusicFlow users upload to own folder" on storage.objects;
create policy "MusicFlow users upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('tracks', 'covers')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "MusicFlow users update own files" on storage.objects;
create policy "MusicFlow users update own files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('tracks', 'covers')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('tracks', 'covers')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "MusicFlow users delete own files" on storage.objects;
create policy "MusicFlow users delete own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('tracks', 'covers')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- 7. Перевірка
-- ---------------------------------------------------------------------
-- select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' and tablename in ('profiles', 'tracks');
-- select id, public, file_size_limit, allowed_mime_types from storage.buckets
--   where id in ('tracks', 'covers');

-- Оновити кеш PostgREST, щоб одразу працював join tracks → profiles.
notify pgrst, 'reload schema';
