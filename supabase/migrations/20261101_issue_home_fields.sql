-- v17: হোমের "চলতি সংখ্যা" অংশের সব তথ্য এখন অ্যাডমিন প্যানেল থেকে দেওয়া হয় (কিছুই অটো নয়)
-- Supabase SQL Editor-এ একবার চালান। খালি রাখা ঘর হোমে দেখানো হবে না।
alter table public.issues add column if not exists tagline text;
alter table public.issues add column if not exists articles_count text;
alter table public.issues add column if not exists authors_count text;
alter table public.issues add column if not exists issue_month text;
alter table public.issues add column if not exists issue_year text;
-- বাটনের লেখা: আগের সংখ্যাগুলো যেন বাটন না হারায়, তাই ডিফল্ট দেওয়া হলো
alter table public.issues add column if not exists read_label text default 'সংখ্যাটি পড়ুন';
alter table public.issues add column if not exists show_print_btn boolean not null default true;
