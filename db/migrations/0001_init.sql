-- Emma Jane Photography — initial schema (see design_handoff_emma_jane_photography/BACKEND.md)

create extension if not exists pgcrypto;

create table if not exists admin (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists session (
  id         text primary key,
  admin_id   uuid not null references admin(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists session_expires_idx on session (expires_at);

-- The owner CMS. Keys are assigned in the source ('home.hero.title'), never derived from the DOM.
create table if not exists content (
  key        text primary key,
  kind       text not null check (kind in ('text', 'image')),
  value      text not null,
  updated_at timestamptz not null default now()
);

create table if not exists photo (
  id            uuid primary key default gen_random_uuid(),
  storage_key   text not null,
  original_name text not null,
  content_type  text not null,
  width         int not null,
  height        int not null,
  bytes         bigint not null,
  content_hash  text not null unique,
  created_at    timestamptz not null default now()
);

create table if not exists photo_variant (
  photo_id    uuid not null references photo(id) on delete cascade,
  size        text not null check (size in ('thumb', 'web', 'print')),
  storage_key text not null,
  width       int not null,
  height      int not null,
  bytes       bigint not null,
  primary key (photo_id, size)
);

-- Emma's own collections, published to /galleries when live.
create table if not exists album (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  subtitle       text not null default '',
  live           boolean not null default false,
  cover_photo_id uuid references photo(id) on delete set null,
  position       int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists album_photo (
  album_id uuid not null references album(id) on delete cascade,
  photo_id uuid not null references photo(id) on delete restrict,
  position int not null,
  caption  text not null default '',
  primary key (album_id, photo_id)
);

-- One private gallery per client, opened by a word or an opaque link token.
create table if not exists client_gallery (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  client_name     text not null,
  access_word     text not null,
  link_token      text not null unique,
  shot_on         date,
  expires_on      date not null default (current_date + 90),
  note            text not null default '',
  position        int not null default 0,
  first_opened_at timestamptz,
  downloads       int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists client_gallery_word_idx on client_gallery (access_word);

create table if not exists client_gallery_photo (
  gallery_id uuid not null references client_gallery(id) on delete cascade,
  photo_id   uuid not null references photo(id) on delete restrict,
  position   int not null,
  primary key (gallery_id, photo_id)
);

-- What the client marked for print.
create table if not exists favourite (
  gallery_id uuid not null references client_gallery(id) on delete cascade,
  photo_id   uuid not null references photo(id) on delete cascade,
  marked_at  timestamptz not null default now(),
  primary key (gallery_id, photo_id)
);

-- The Contact form.
create table if not exists inquiry (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  phone          text not null default '',
  session_type   text not null default '',
  preferred_date date,
  location       text not null default '',
  message        text not null default '',
  opt_in         boolean not null default false,
  created_at     timestamptz not null default now(),
  read_at        timestamptz
);
