-- v15: হোমের শুরুতে (বড় প্রধান লেখা) কোন লেখা থাকবে তা অ্যাডমিন ঠিক করে — Supabase SQL Editor-এ একবার চালান
alter table public.articles add column if not exists home_featured boolean not null default false;
-- একসাথে একটাই লেখা হোমের শুরুতে থাকে: অ্যাডমিন ফর্ম নতুনটা সেভ করলে আগেরটা অটো বন্ধ করে দেয়
create index if not exists articles_home_featured_idx on public.articles (home_featured) where home_featured;
