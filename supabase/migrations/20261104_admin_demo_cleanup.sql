-- ============================================================
-- ডেমো ডাটা পরিষ্কার (v72) — Supabase → SQL Editor-এ একবার চালান
-- • এডমিন প্যানেলের "ডেমো ডাটা পরিষ্কার" পেজ এই দুটো ফাংশন ব্যবহার করে
-- • শুধু role = 'admin' ইউজার চালাতে পারেন (অন্য কেউ ডাকলে 'not allowed')
-- • ইউজারের অ্যাকাউন্ট (profiles), সাইট সেটিংস ও ডিজাইন কখনো মোছা হয় না
-- • কোনো টেবিল না থাকলে সেটা চুপচাপ বাদ যায়, কিছু ভাঙে না
-- ============================================================

create or replace function public.pd_admin_demo_counts()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  t text; n bigint; res jsonb := '{}'::jsonb;
  tabs text[] := array['articles','article_images','authors','issues','print_issues','orders','order_items',
                       'ads','comments','comment_likes','bookmarks','follows','notifications','newsletter_subscribers'];
begin
  if not public.pd_comment_is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  foreach t in array tabs loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      res := res || jsonb_build_object(t, n);
    end if;
  end loop;
  return res;
end $$;

create or replace function public.pd_admin_wipe(p_targets text[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  tg text; t text; n bigint; total bigint; res jsonb := '{}'::jsonb; tabs text[];
begin
  if not public.pd_comment_is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  foreach tg in array p_targets loop
    tabs := case tg
      when 'articles'      then array['comment_likes','comments','bookmarks','article_images','articles']
      when 'authors'       then array['follows','authors']
      when 'comments'      then array['comment_likes','comments']
      when 'issues'        then array['issues']
      when 'print_issues'  then array['order_items','orders','print_issues']
      when 'orders'        then array['order_items','orders']
      when 'ads'           then array['ads']
      when 'notifications' then array['notifications']
      when 'subscribers'   then array['newsletter_subscribers']
      when 'bookmarks'     then array['bookmarks']
      when 'follows'       then array['follows']
      else null end;
    if tabs is null then
      res := res || jsonb_build_object(tg, 'unknown target');
      continue;
    end if;
    total := 0;
    begin
      foreach t in array tabs loop
        if to_regclass('public.' || t) is not null then
          execute format('delete from public.%I', t);
          get diagnostics n = row_count;
          total := total + n;
        end if;
      end loop;
      res := res || jsonb_build_object(tg, total);
    exception when others then
      res := res || jsonb_build_object(tg, 'error: ' || sqlerrm);
    end;
  end loop;
  return res;
end $$;

revoke all on function public.pd_admin_demo_counts() from public, anon;
revoke all on function public.pd_admin_wipe(text[]) from public, anon;
grant execute on function public.pd_admin_demo_counts() to authenticated;
grant execute on function public.pd_admin_wipe(text[]) to authenticated;
