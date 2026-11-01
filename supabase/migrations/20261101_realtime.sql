-- রিয়ালটাইম আপডেট (v46): মন্তব্য, অর্ডার ও নিউজলেটার সাবস্ক্রাইবারের বদল ব্রাউজার রিফ্রেশ ছাড়াই পৌঁছাবে।
-- Supabase → SQL Editor-এ একবার চালান। বারবার চালালেও সমস্যা নেই।
-- (না চালালেও সাইট প্রতি ২০ সেকেন্ডে নিজে থেকে হালনাগাদ হয়; চালালে সাথে সাথে হয়।)
do $$
declare t text;
begin
  foreach t in array array['comments', 'orders', 'newsletter_subscribers'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- মন্তব্য মুছে ফেললে/বদলালে অন্য ভিজিটরের পেজেও ঠিকমতো যাওয়ার জন্য
alter table public.comments replica identity full;
