-- v109: হোমের হিরোতে একাধিক লেখা ও তাদের ক্রম — Supabase SQL Editor-এ একবার চালান
-- ১, ২, ৩ … দিলে সেই ক্রমে হিরোতে দেখায়; খালি (null) = হিরোতে আসবে না
alter table public.articles add column if not exists hero_order integer;
create index if not exists articles_hero_order_idx on public.articles (hero_order) where hero_order is not null;
-- আগে "হোমের শুরুতে বড় করে দেখান" চালু করা লেখা থাকলে সেটা ১ নম্বরে হিরোতে চলে আসবে
update public.articles set hero_order = 1 where home_featured = true and hero_order is null;
