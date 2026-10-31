-- v13: হোমের "এই সংখ্যায়" তালিকার ক্রম ও দেখানো/লুকানো — Supabase SQL Editor-এ একবার চালান
alter table public.articles add column if not exists home_order integer;          -- ছোট সংখ্যা আগে; খালি = অটো (তারিখ অনুযায়ী)
alter table public.articles add column if not exists home_hidden boolean not null default false; -- true = তালিকায় দেখাবে না
create index if not exists articles_home_order_idx on public.articles (home_order) where home_order is not null;
