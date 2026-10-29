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
