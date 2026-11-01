-- নিউজলেটার (v36): একই ইমেইলে দুইবার সাবস্ক্রাইব আটকানো — Supabase → SQL Editor-এ একবার চালান
-- ১. আগে থেকে ডুপ্লিকেট থাকলে (বড়/ছোট হাতের অক্ষর ধরে) সবচেয়ে পুরোনোটা রেখে বাকি মুছে ফেলা
delete from public.newsletter_subscribers a
using public.newsletter_subscribers b
where lower(a.email) = lower(b.email)
  and (a.created_at > b.created_at or (a.created_at = b.created_at and a.id::text > b.id::text));
-- ২. এখন থেকে একই ইমেইল দ্বিতীয়বার ঢুকলে ডেটাবেস 23505 (duplicate) ত্রুটি দেয়; সাইট সেটা দেখে
--    \"ইতিমধ্যে সাবস্ক্রাইব করা আছে\" বার্তা দেখায়। অ্যাডমিন প্যানেল থেকে মুছে দিলে ইমেইলটা আবার নতুন করে সাবস্ক্রাইব করা যায়।
create unique index if not exists newsletter_subscribers_email_uniq on public.newsletter_subscribers (lower(email));
