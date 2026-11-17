-- ============================================================
-- অর্ডার বাতিল ও মুছে ফেলা (v117) — Supabase → SQL Editor-এ একবার চালান। বারবার চালালেও সমস্যা নেই।
-- • এডমিন প্যানেল > অর্ডার: স্ট্যাটাস "বাতিল" (cancelled) ও প্রতিটা অর্ডারের পাশে "মুছে ফেলুন" বাটন
-- • না চালালেও প্যানেল সরাসরি মোছার চেষ্টা করে; ডাটাবেসের নিয়মে আটকালে এই ফাইল চালাতে বলে
-- • শুধু role = 'admin' ইউজার চালাতে পারেন (pd_comment_is_admin — আগের মাইগ্রেশনে তৈরি)
-- ============================================================

-- ১) payment_status-এ কোনো CHECK নিয়ম থাকলে তাতে 'cancelled' যোগ
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public' and rel.relname = 'orders' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%payment_status%'
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;
  alter table public.orders add constraint orders_payment_status_check
    check (payment_status is null or payment_status in ('pending', 'verified', 'delivered', 'cancelled')) not valid; -- পুরোনো সারি যাচাই হয় না, তাই আটকাবে না
exception when duplicate_object then null;
end $$;

-- ২) এডমিনের জন্য একটা অর্ডার (ও তার আইটেম) মুছে ফেলার ফাংশন
create or replace function public.pd_admin_delete_order(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.pd_comment_is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from public.order_items where order_id = p_id;
  delete from public.orders where id = p_id;
  return found;
end $$;

revoke all on function public.pd_admin_delete_order(uuid) from public, anon;
grant execute on function public.pd_admin_delete_order(uuid) to authenticated;
