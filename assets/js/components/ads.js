/* ads.js — বিজ্ঞাপনের সাধারণ নিয়ম (হোম, লেখার পাতা, পপআপ) · v121
   • কোন জায়গায় কোন বিজ্ঞাপন: এডমিন > এড স্লট (Supabase-এর ads টেবিল)
   • কোনো জায়গায় চালু বিজ্ঞাপন না থাকলে পত্রদ্বীপের নিজস্ব বিজ্ঞাপন (assets/img/ads) — এডমিন চাইলে বন্ধ করতে পারেন
     (এড স্লট পেজ > "খালি জায়গায় পত্রদ্বীপের নিজস্ব বিজ্ঞাপন")
   • প্রিভিউ: যেকোনো পেজের ঠিকানার শেষে ?adpreview=1 দিলে প্রতিটা বিজ্ঞাপনের ওপর তার নাম ও মাপ লেখা দেখায়,
     পপআপও দেখায় — কোন বিজ্ঞাপন কোথায় বসে তা সহজে দেখার জন্য */
(function () {
  'use strict';
  var PREVIEW = /[?&]adpreview=1\b/.test(location.search);
  var IMG = 'assets/img/ads/';
  var HOUSE = {
    top: { image_url: IMG + 'house-top.webp', link_url: 'store.html' },
    mid: { image_url: IMG + 'house-mid.webp', link_url: '#site-footer' }, /* "যোগাযোগ করুন" → ফুটারের যোগাযোগ */
    mobile: { image_url: IMG + 'house-mobile.webp', link_url: 'store.html' },
    square: { image_url: IMG + 'house-square.webp', link_url: 'store.html' },
    popup: { image_url: IMG + 'house-popup.webp', link_url: 'store.html' }
  };
  var LABEL = {
    top: 'টপ ব্যানার · ১২০০×২০০',
    mid: 'মিড-স্ক্রল ব্যানার · ৭২৮×১৫০',
    mobile: 'মোবাইল ব্যানার · ৩২০×১০০',
    square: 'সাইডবার/স্কোয়ার · ৩০০×৩০০',
    popup: 'পপআপ এড · ১০৮০×১৩৫০'
  };
  function mark(a) { var o = {}; for (var k in a) o[k] = a[k]; o.house = true; return o; }

  window.PDAds = {
    preview: PREVIEW,
    /* খালি জায়গায় নিজস্ব বিজ্ঞাপন দেখাবে কিনা (প্রিভিউতে সবসময়) */
    useHouse: function (ui) { return PREVIEW || !(ui && ui.house_ads === false); },
    house: function (slot) { var h = HOUSE[slot]; return !h ? null : Array.isArray(h) ? h.map(mark) : mark(h); },
    label: function (slot) { return LABEL[slot] || ''; },
    /* প্রিভিউতে বিজ্ঞাপনের ওপর নাম ও মাপের লেবেল */
    tag: function (el, slot, isHouse) {
      if (!PREVIEW || !el) return;
      var t = document.createElement('span');
      t.className = 'pd-ad-label';
      t.textContent = LABEL[slot] + (isHouse ? ' · নমুনা' : ' · চালু বিজ্ঞাপন');
      el.appendChild(t);
    },
    /* লিংক: সাইটের ভেতরের হলে একই ট্যাবে, বাইরের হলে নতুন ট্যাবে */
    href: function (u) {
      u = String(u || '').trim();
      if (!u) return null;
      if (/^https?:\/\//i.test(u)) return { url: u, ext: true };
      if (/^[a-z0-9_\-]+\.html([?#].*)?$/i.test(u)) return { url: u, ext: false };
      if (/^#[a-z][\w-]*$/i.test(u)) return { url: u, ext: false };
      return null;
    },
    attrs: function (u) {
      var h = this.href(u);
      if (!h) return '';
      return ' href="' + h.url.replace(/"/g, '&quot;') + '"' + (h.ext ? ' target="_blank" rel="noopener sponsored"' : '');
    }
  };
})();
