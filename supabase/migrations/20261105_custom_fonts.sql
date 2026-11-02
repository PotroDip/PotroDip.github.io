-- v82: এডমিন প্যানেল থেকে নিজের ফন্ট যোগ/মোছা + লেখার শিরোনামের ফন্ট
-- একবার Supabase → SQL Editor-এ পুরোটা চালান। (বারবার চালালেও ক্ষতি নেই)

-- ১. ফন্টের তালিকা। ফাইল থাকে Storage 'media' বাকেটের fonts/ ফোল্ডারে।
create table if not exists public.custom_fonts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  family     text not null unique check (family ~ '^pdf_[a-z0-9]{6,20}$'),
  url        text not null check (url ~ '^https://'),
  format     text not null check (format in ('truetype','opentype','woff','woff2')),
  path       text,
  size_bytes integer,
  created_at timestamptz not null default now()
);
alter table public.custom_fonts enable row level security;

-- সবাই পড়তে পারবে (লেখার পাতায় ফন্ট দেখাতে); শুধু এডমিন যোগ/বদল/মুছতে পারবে
drop policy if exists custom_fonts_read on public.custom_fonts;
create policy custom_fonts_read on public.custom_fonts for select to anon, authenticated using (true);
drop policy if exists custom_fonts_admin_write on public.custom_fonts;
create policy custom_fonts_admin_write on public.custom_fonts for all to authenticated
  using (public.pd_comment_is_admin()) with check (public.pd_comment_is_admin());
grant select on public.custom_fonts to anon, authenticated;
grant insert, update, delete on public.custom_fonts to authenticated;

-- ২. Storage: বাকেটে ফন্ট ফাইলের ধরন চালু (বাকেটে ধরনের তালিকা থাকলেই শুধু যোগ হয়)
update storage.buckets
   set allowed_mime_types = (
     select array_agg(distinct x) from unnest(allowed_mime_types || array['font/ttf','font/otf','font/woff','font/woff2']) x
   )
 where id = 'media' and allowed_mime_types is not null;

-- ৩. Storage: শুধু এডমিন fonts/ ফোল্ডারে রাখতে ও মুছতে পারবে
drop policy if exists pd_fonts_admin_insert on storage.objects;
create policy pd_fonts_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and name like 'fonts/%' and public.pd_comment_is_admin());
drop policy if exists pd_fonts_admin_delete on storage.objects;
create policy pd_fonts_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and name like 'fonts/%' and public.pd_comment_is_admin());

-- ৪. লেখার শিরোনামের ফন্ট (খালি = সাইটের ডিফল্ট ফন্ট)
alter table public.articles add column if not exists title_font text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'articles_title_font_check') then
    alter table public.articles add constraint articles_title_font_check
      check (title_font is null or title_font ~ '^[a-z0-9_]{1,40}$');
  end if;
end $$;
