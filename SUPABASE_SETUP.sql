-- Run this once in Supabase SQL Editor
create table if not exists public.rollcall (
  id integer primary key,
  order_text text not null default '',
  order_html text not null default '',
  flash_message text not null default 'IMPORTANT ANNOUNCEMENT',
  published_at timestamptz,
  revision bigint not null default 0
);
alter table public.rollcall enable row level security;
-- No public table policies are required: only the server uses the secret service-role key.
