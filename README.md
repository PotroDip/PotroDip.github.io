# পত্রদ্বীপ (Potrodip)

কাগজের বুকে নক্ষত্র হওয়ার ক্ষুদ্র প্রয়াস — বাংলা সাহিত্য পত্রিকার ওয়েবসাইট।
হোস্টিং: GitHub Pages · ডেটাবেস, লগইন ও ছবি: Supabase · বট-সুরক্ষা: Cloudflare Turnstile

## পেজ

| ফাইল | কাজ |
|---|---|
| index.html | হোমপেজ |
| article.html?id=… | লেখা পড়া, মন্তব্য, রেটিং, বুকমার্ক |
| author.html?slug=… · authors.html | লেখক প্রোফাইল · লেখক তালিকা |
| archive.html · issue.html?id=… | সব সংখ্যা · একটা সংখ্যার লেখা |
| store.html | ছাপা সংখ্যা কেনা (কার্ট, অর্ডার) |
| auth.html | লগইন/সাইনআপ ও ইউজার ড্যাশবোর্ড |
| admin.html | এডমিন প্যানেল (শুধু এডমিন) |
| admin-studio.html | ডিজাইন স্টুডিও — ইলাস্ট্রেটর-স্টাইল ভিজ্যুয়াল এডিটর (শুধু এডমিন; বিস্তারিত: DESIGN-STUDIO.md) |
| page.html?p=… | ডিজাইন স্টুডিওতে বানানো নতুন পেজ |
| privacy.html · terms.html · data-deletion.html | আইনি পেজ |
| 404.html | পেজ পাওয়া না গেলে |

## ফোল্ডার কাঠামো

```
/
├── *.html                    পেজ (মূল ফোল্ডারে, যাতে লিংক potrodip.github.io/auth.html-এর মতো থাকে)
├── robots.txt · sitemap.xml
└── assets/
    ├── css/
    │   ├── base.css          সব পেজে: রঙ (লাইট/ডার্ক), ফন্ট, হেডার, ফুটার
    │   ├── layout.css        হোম ও আইনি পেজের কাঠামো
    │   ├── components/       nav.css (সার্চ, মোবাইল মেনু) · comments.css (মন্তব্য)
    │   └── pages/            প্রতি পেজের নিজস্ব স্টাইল
    ├── js/
    │   ├── core/             config.js · app.js · ui.js · theme.js · intro-*.js
    │   ├── components/       nav.js (সার্চ + মোবাইল মেনু) · comments.js
    │   └── pages/            প্রতি পেজের নিজস্ব কোড (home, article, author, store, admin…)
    ├── fonts/                Gunjoron-Font (Thin/Normal/Bold) — সাইটের একমাত্র ফন্ট, base.css-এ @font-face
    ├── img/                  favicon.svg · brand/ (লোগো)
    └── vendor/               supabase.js · pdfjs/ (নিজেদের সার্ভারেই রাখা বাইরের লাইব্রেরি)
```

## নিয়ম (নতুন পেজ/ফিচার যোগ করার সময়)

1. HTML ফাইল রিপোর মূল ফোল্ডারে, স্টাইল `assets/css/pages/<নাম>.css`-এ, কোড `assets/js/pages/<নাম>.js`-এ।
2. HTML-এ কোনো ইনলাইন `<script>` বা `onclick=""` দেওয়া যাবে না — নিরাপত্তা-নীতি (CSP) আটকে দেবে। সব কোড `.js` ফাইলে।
3. সেটিংস (Supabase URL, কী, Turnstile কী, পেজের নাম) শুধু `assets/js/core/config.js`-এ।
4. ডেটাবেসের লেখা HTML-এ বসাতে `textContent` ব্যবহার করুন (`innerHTML` নয়), না হলে `PDUI.sanitize()`।
5. `service_role` কী কোথাও রাখা যাবে না।
6. ফন্ট সবসময় `font-family:'Gunjoron', serif` — বাইরের (Google) ফন্ট যোগ করলে CSP আটকে দেবে।
7. ডেটাবেসের SQL (`potrodip-database` ফোল্ডার) এই রিপোতে রাখা হয় না।

## লগইন ও ফাইল রাখার ব্যবস্থা (Supabase + Firebase)

| কাজ | কোথায় |
|---|---|
| ইমেইল ও গুগল লগইন | Firebase Auth → `firebase-bridge` (Supabase Edge Function) → একই ইমেইলের Supabase অ্যাকাউন্ট |
| ফেসবুক লগইন | Supabase Auth (আগের মতো) |
| লেখা, মন্তব্য, প্রোফাইল, অর্ডার — সব ডেটা | শুধু Supabase (দুই জায়গায় রাখা হয় না) |
| ছবি ও PDF | Firebase Storage (`firebaseStorage: true` হলে), ব্যর্থ হলে Supabase `media` — একটা ফাইল একটাই জায়গায় |

- ইউজার মেলানো হয় **ইমেইল দিয়ে**, তাই পুরোনো Supabase ইউজার Firebase-এ একই ইমেইলে সাইনআপ করলে আগের সব তথ্য পান।
- ইমেইল যাচাই না হলে (`email_verified`) সেতু-ফাংশন ঢুকতে দেয় না।
- অচেনা ইমেইল-প্রোভাইডার আটকানো হয় তিন জায়গায়: সাইটে (`config.js` → `allowedEmailDomains`), সেতু-ফাংশনে, আর ডেটাবেসে (`auth.users`-এর `pd_guard_new_user_email` ট্রিগার, তালিকা `public.pd_email_domain_ok`)।
- `assets/js/core/config.js`-এ Firebase-এর `apiKey` ও `appId` খালি থাকলে সাইট আগের মতো শুধু Supabase দিয়ে চলে।
- সেতু-ফাংশনের কোড: `supabase/functions/firebase-bridge/index.ts` · Storage নিয়ম: `firebase/storage.rules`
- Firebase SDK (v10.14.1, compat) নিজেদের সার্ভারে: `assets/vendor/firebase/`

### Firebase-এর বর্তমান অবস্থা (প্রজেক্ট `potrodip-99ad4`)
- Authentication: Email/Password ও Google চালু, `potrodip.github.io` অনুমোদিত, ইমেইল-এনুমারেশন সুরক্ষা চালু, বেনামি লগইন বন্ধ।
- Storage: **এখনো চালু নয়** — প্রজেক্টে বিলিং-অ্যাকাউন্ট (Blaze) নেই। চালু হলে বাকেট বানিয়ে `firebase/storage.rules` ও `firebase/cors.json` বসিয়ে `firebaseStorage: true` করুন। তার আগে ছবি/PDF Supabase `media`-তেই যায়।
- পুরোনো (Firebase-এর আগের) Supabase অ্যাকাউন্ট আগের পাসওয়ার্ডেই লগইন করতে পারে: Firebase-এ না পেলে লগইন Supabase-এ চেষ্টা হয় (নিরাপত্তা-জাল)।
