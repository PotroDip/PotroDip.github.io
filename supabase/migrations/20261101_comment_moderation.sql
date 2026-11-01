-- ============================================================
-- কমেন্ট মডারেশন (v34) — Supabase → SQL Editor-এ একবার চালান
-- • নতুন মন্তব্য/জবাব প্রথমে 'pending' থাকে; শুধু লেখক নিজে ও এডমিন দেখতে পান
-- • এডমিন অনুমোদন দিলে ('approved') সবাই দেখতে পান
-- • এডমিন মুছলে কারণসহ ইউজারের notifications-এ বার্তা যায়
-- • আগের সব মন্তব্য নিজে থেকেই 'approved' হয়ে থাকে
-- ============================================================

-- ১. স্ট্যাটাস কলাম (পুরোনো সারি approved; নতুন সারির ডিফল্ট pending)
alter table public.comments add column if not exists status text not null default 'approved';
alter table public.comments alter column status set default 'pending';
alter table public.comments drop constraint if exists comments_status_check;
alter table public.comments add constraint comments_status_check check (status in ('pending', 'approved'));
create index if not exists comments_status_idx on public.comments (status, created_at desc);

-- ২. এডমিন চেনার ছোট ফাংশন
create or replace function public.pd_comment_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.pd_comment_is_admin() to anon, authenticated;

-- ৩. সার্ভারেই নিয়ম আটকানো: সাধারণ ইউজার নিজের মন্তব্য নিজে approved করতে পারবে না;
--    লেখা বদলালে আবার pending; শুধু রেটিং (খালি লেখা) সরাসরি approved
create or replace function public.pd_comment_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;            -- SQL Editor / service_role
  if public.pd_comment_is_admin() then
    if tg_op = 'INSERT' then new.status := 'approved'; end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := case when coalesce(btrim(new.body), '') = '' then 'approved' else 'pending' end;
  else
    if coalesce(btrim(new.body), '') = '' then new.status := 'approved';
    elsif new.body is distinct from old.body then new.status := 'pending';
    else new.status := old.status;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists pd_comment_guard_trg on public.comments;
create trigger pd_comment_guard_trg before insert or update on public.comments
  for each row execute function public.pd_comment_guard();

-- ৪. পড়ার নিয়ম: approved সবার জন্য; pending শুধু লেখক ও এডমিনের জন্য
do $$ declare r record; begin
  for r in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'comments' and cmd = 'SELECT' loop
    execute format('drop policy %I on public.comments', r.policyname);
  end loop;
end $$;
create policy comments_read_moderated on public.comments for select to anon, authenticated
  using (status = 'approved' or user_id = auth.uid() or public.pd_comment_is_admin());

-- ৫. এডমিনের কাজ: অনুমোদন / কারণসহ মুছে ফেলা (ইউজারকে নোটিফিকেশন যায়)
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
    insert into public.notifications (user_id, type, title, body, link_url, is_read)
    values (c.user_id, 'comment_approved', 'আপনার মন্তব্য প্রকাশিত হয়েছে',
            '"' || left(c.body, 60) || '" — এখন সবাই দেখতে পাচ্ছেন।', link, false);

  elsif p_action = 'delete' then
    if coalesce(btrim(p_note), '') = '' then raise exception 'note required' using errcode = '22023'; end if;
    insert into public.notifications (user_id, type, title, body, link_url, is_read)
    values (c.user_id, 'comment_removed', 'আপনার মন্তব্য অনুমোদন করা হয়নি',
            '"' || left(c.body, 60) || '" — কারণ: ' || left(btrim(p_note), 300), link, false);
    delete from public.comments where parent_comment_id = c.id;
    if c.parent_comment_id is null and c.rating is not null then
      update public.comments set body = '', status = 'approved' where id = c.id;   -- রেটিং থাকে, লেখা যায়
    else
      delete from public.comments where id = c.id;
    end if;
  else
    raise exception 'bad action' using errcode = '22023';
  end if;
end $$;
revoke all on function public.pd_moderate_comment(text, text, text) from public, anon;
grant execute on function public.pd_moderate_comment(text, text, text) to authenticated;
