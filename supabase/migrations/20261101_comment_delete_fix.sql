-- ============================================================
-- কমেন্ট ডিলিট ফিক্স (v37) — Supabase → SQL Editor-এ একবার চালান
-- সমস্যা: "কারণসহ মুছে ফেলুন" চাপলে "দেওয়া তথ্যে ভুল আছে" আসত, মন্তব্য মুছত না।
-- কারণ: notifications টেবিলের check constraint (type/title/body) নোটিফিকেশন লেখা আটকে দিত
--       এবং পুরো ফাংশন ফেল করত।
-- সমাধান: ১) notifications-এর পুরোনো check constraint সরানো
--         ২) নোটিফিকেশন লেখা ব্যর্থ হলেও মন্তব্য মুছবে (নোটিফিকেশন আলাদা ব্লকে)
-- ============================================================

-- ১. notifications-এর সব check constraint সরানো (type-এর তালিকা 'comment_removed' আটকাত)
do $$ declare r record; begin
  for r in select conname from pg_constraint
           where conrelid = 'public.notifications'::regclass and contype = 'c' loop
    execute format('alter table public.notifications drop constraint %I', r.conname);
  end loop;
end $$;

-- ২. মডারেশন ফাংশন — মুছে ফেলা আগে, নোটিফিকেশন নিরাপদ ব্লকে
create or replace function public.pd_moderate_comment(p_id text, p_action text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c public.comments%rowtype; link text;
begin
  if not public.pd_comment_is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into c from public.comments where id::text = p_id;
  if not found then raise exception 'comment not found'; end if;
  link := 'article.html?id=' || c.article_id::text;

  if p_action = 'approve' then
    update public.comments set status = 'approved' where id = c.id;
    begin
      insert into public.notifications (user_id, type, title, body, link_url, is_read)
      values (c.user_id, 'comment_approved', 'আপনার মন্তব্য প্রকাশিত হয়েছে',
              '"' || left(c.body, 60) || '" — এখন সবাই দেখতে পাচ্ছেন।', link, false);
    exception when others then null; end;

  elsif p_action = 'delete' then
    if coalesce(btrim(p_note), '') = '' then raise exception 'note required' using errcode = '22023'; end if;
    -- ক) আগে মন্তব্য মুছি
    delete from public.comments where parent_comment_id = c.id;
    if c.parent_comment_id is null and c.rating is not null then
      begin
        update public.comments set body = '', status = 'approved' where id = c.id;   -- রেটিং থাকে, লেখা যায়
      exception when others then
        delete from public.comments where id = c.id;
      end;
    else
      delete from public.comments where id = c.id;
    end if;
    -- খ) তারপর ইউজারকে কারণ জানাই (ব্যর্থ হলেও মোছা বাতিল হবে না)
    begin
      insert into public.notifications (user_id, type, title, body, link_url, is_read)
      values (c.user_id, 'comment_removed', 'আপনার মন্তব্য অনুমোদন করা হয়নি',
              '"' || left(c.body, 60) || '" — কারণ: ' || left(btrim(p_note), 300), link, false);
    exception when others then null; end;
  else
    raise exception 'bad action' using errcode = '22023';
  end if;
end $$;
revoke all on function public.pd_moderate_comment(text, text, text) from public, anon;
grant execute on function public.pd_moderate_comment(text, text, text) to authenticated;
