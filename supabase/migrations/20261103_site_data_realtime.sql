-- রিয়ালটাইম সাইট আপডেট (v71): লেখা/লেখক/সংখ্যা/বিজ্ঞাপন/প্রিন্ট-সংখ্যা/সেটিংসের বদল ভিজিটরের পেজে সঙ্গে সঙ্গে পৌঁছাবে।
-- Supabase → SQL Editor-এ একবার চালান। বারবার চালালেও সমস্যা নেই।
-- (না চালালেও সাইট প্রতি ২০ সেকেন্ডে নিজে থেকে হালনাগাদ হয়; চালালে সাথে সাথে হয়।)
do $$
declare t text;
begin
  foreach t in array array['articles', 'authors', 'issues', 'ads', 'print_issues', 'site_settings'] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t)
       and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
