/* config.js — সাইটের সেটিংস এক জায়গায়। (anon কী, Turnstile সাইট কী ও Firebase-এর apiKey জনসমক্ষে থাকার জন্যই বানানো; service_role কী কখনো এখানে রাখবেন না) */
window.PD_CONFIG = {
  supabaseUrl: 'https://pqoszcuhxdavehnxundq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxb3N6Y3VoeGRhdmVobnh1bmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1ODIzMDUsImV4cCI6MjEwNjE1ODMwNX0.UqZYaUMsH29NmMTZpFHDmoX9qyTG-U7APOWsalQS2JQ',
  turnstileSiteKey: '0x4AAAAAAFnlme_tpslbtttw',

  /* Firebase — ইমেইল ও গুগল লগইন এবং ছবি রাখার জায়গা।
     Firebase কনসোল → Project settings → Your apps → Web app-এর firebaseConfig থেকে apiKey ও appId বসান।
     এ দুটো খালি থাকলে সাইট আগের মতো শুধু Supabase দিয়েই চলবে (কিছু ভাঙবে না)। */
  firebase: {
    apiKey: '',
    authDomain: 'potrodip-99ad4.firebaseapp.com',
    projectId: 'potrodip-99ad4',
    storageBucket: 'potrodip-99ad4.firebasestorage.app',
    appId: ''
  },
  /* Firebase Storage চালু (Blaze প্ল্যান) ও storage.rules বসানোর পর true করুন — তখন ছবি Firebase-এ যাবে,
     কোনো কারণে সেখানে না গেলে Supabase-এ। একটা ফাইল কখনো দুই জায়গায় রাখা হয় না। */
  firebaseStorage: false,

  /* যেসব ইমেইল প্রোভাইডারের ঠিকানা দিয়ে অ্যাকাউন্ট খোলা যায়।
     সার্ভারেও একই তালিকা আছে (Supabase ফাংশন public.pd_email_domain_ok) — বদলালে দুই জায়গাতেই বদলাবেন। */
  allowedEmailDomains: [
    'gmail.com', 'googlemail.com',
    'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'yahoo.ca', 'yahoo.com.au', 'yahoo.fr', 'yahoo.de', 'yahoo.co.jp', 'ymail.com', 'rocketmail.com',
    'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'live.com', 'live.co.uk', 'msn.com',
    'icloud.com', 'me.com', 'mac.com',
    'aol.com', 'proton.me', 'protonmail.com', 'pm.me', 'zoho.com', 'zohomail.com',
    'yandex.com', 'yandex.ru', 'mail.com', 'gmx.com', 'gmx.net', 'gmx.de', 'web.de',
    'tutanota.com', 'tuta.io', 'fastmail.com', 'hey.com', 'mail.ru',
    'qq.com', '163.com', '126.com', 'naver.com', 'daum.net', 'hanmail.net', 'rediffmail.com'
  ],
  pages: {
    home: 'index.html',
    auth: 'auth.html',
    admin: 'admin.html'
  }
};
