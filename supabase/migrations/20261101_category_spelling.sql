-- বিভাগের নামের বানান ঠিক করা (v48): ভ্রমন → ভ্রমণ, সৃতিগদ্য → স্মৃতিগদ্য
-- Supabase → SQL Editor-এ একবার চালান। (না চালালেও সাইটের সব পেজে ও অ্যাডমিনে সঠিক বানানেই দেখায়; এটা চালালে ডাটাবেসের লেখাও নিজে ঠিক হয়ে যায়।)
update public.articles set category = 'ভ্রমণ' where trim(category) = 'ভ্রমন';
update public.articles set category = 'স্মৃতিগদ্য' where trim(category) in ('সৃতিগদ্য', 'সৃতি গদ্য', 'স্মৃতি গদ্য');
