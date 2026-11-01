-- v68: হোমের "জনপ্রিয় লেখক" সেকশনের ক্রম এডমিন প্যানেল থেকে (১-৫)
-- একবার Supabase → SQL Editor-এ চালান।
alter table public.authors add column if not exists popular_rank smallint;   -- খালি = ক্রম দেওয়া নেই

-- শুধু ১ থেকে ৫ পর্যন্ত
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'authors_popular_rank_range') then
    alter table public.authors add constraint authors_popular_rank_range check (popular_rank is null or popular_rank between 1 and 5);
  end if;
end $$;

-- একই ক্রম দুই লেখকের হতে পারবে না
create unique index if not exists authors_popular_rank_uniq on public.authors (popular_rank) where popular_rank is not null;
