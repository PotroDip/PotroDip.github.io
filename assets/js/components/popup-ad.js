/* popup-ad.js — পপআপ বিজ্ঞাপন (এডমিন > এড স্লট > "পপআপ এড")
   • সাইটে ঢুকলেই (লোগো-ইন্ট্রো শেষ হওয়ার পর) মাঝখানে প্রিমিয়াম কার্ডে বিজ্ঞাপন দেখায়
   • কতবার দেখাবে ও কত সেকেন্ড পরে — এডমিনের সেটিংস (site_settings → contact.ui)
       popup_freq: 'session' = প্রতি ভিজিটে একবার (ডিফল্ট) · 'day' = দিনে একবার
       popup_delay: ০–৩০ সেকেন্ড (ডিফল্ট ১.৫)
   • নতুন ছবি দিলে আগে দেখা ভিজিটরও আবার দেখবে
   • এড চালু না থাকলে কিছুই লোড হয় না (CSS-ও না)
   • বন্ধ: ✕ বাটন, পেছনের ঝাপসা জায়গায় ক্লিক, বা Esc */
(function () {
  'use strict';
  if (/[?&]pdstudio=1/.test(location.search)) return;
  var C = window.PD_CONFIG;
  if (!C || !window.fetch || !window.Promise) return;

  var H = { apikey: C.anonKey, Authorization: 'Bearer ' + C.anonKey };
  function get(path) {
    return fetch(C.supabaseUrl + '/rest/v1/' + path, { headers: H, cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; }, function () { return []; });
  }
  function store(kind) { try { return kind === 'day' ? window.localStorage : window.sessionStorage; } catch (e) { return null; } }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function safeLink(u) { return typeof u === 'string' && /^https?:\/\//i.test(u.trim()) ? u.trim() : ''; }

  function start() {
    Promise.all([
      get('ads?select=slot_id,image_url,link_url&is_active=eq.true&slot_id=ilike.*popup*&limit=1'),
      get('site_settings?key=eq.contact&select=value')
    ]).then(function (x) {
      var ad = x[0] && x[0][0];
      if (!ad || !ad.image_url) return;
      var ui = (x[1] && x[1][0] && x[1][0].value && x[1][0].value.ui) || {};
      var freq = ui.popup_freq === 'day' ? 'day' : 'session';
      var delay = parseFloat(ui.popup_delay);
      delay = (delay >= 0 && delay <= 30 ? delay : 1.5) * 1000;

      var key = 'pd-popup-' + hash(ad.image_url), st = store(freq), seen = null;
      try { seen = st && st.getItem(key); } catch (e) {}
      if (seen && (freq === 'session' || Date.now() - (+seen || 0) < 864e5)) return;

      /* ছবি আর স্টাইল আগে থেকে পুরো লোড, তারপর দেখানো */
      var img = new Image();
      img.decoding = 'async';
      var imgReady = new Promise(function (ok, no) { img.onload = ok; img.onerror = no; });
      img.src = ad.image_url;
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'assets/css/components/popup-ad.css?v=2';
      var cssReady = new Promise(function (ok) { css.onload = ok; css.onerror = ok; });
      document.head.appendChild(css);

      Promise.all([imgReady, cssReady, afterIntro(), wait(delay)]).then(function () {
        if (document.querySelector('.pd-pop')) return;
        try { st && st.setItem(key, String(Date.now())); } catch (e) {}
        show(ad, img);
      }, function () {});
    });
  }

  function wait(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  /* হোমের লোগো-ইন্ট্রো চলাকালে নয় — শেষ হলে (সর্বোচ্চ ৮ সেকেন্ড অপেক্ষা) */
  function afterIntro() {
    return new Promise(function (ok) {
      var t0 = Date.now();
      (function chk() {
        var o = document.getElementById('intro-overlay');
        var on = o && o.isConnected && !o.classList.contains('hide') && getComputedStyle(o).display !== 'none';
        if (!on || Date.now() - t0 > 8000) ok(); else setTimeout(chk, 250);
      })();
    });
  }

  var X_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function show(ad, img) {
    var link = safeLink(ad.link_url), prevFocus = document.activeElement;
    var root = el('div', 'pd-pop', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'বিজ্ঞাপন' });
    var back = el('div', 'pd-pop-back');
    var card = el('div', 'pd-pop-card');
    var close = el('button', 'pd-pop-x', { type: 'button', 'aria-label': 'বন্ধ করুন', title: 'বন্ধ করুন' });
    close.innerHTML = X_ICON;
    var media = link ? el('a', 'pd-pop-media', { href: link, target: '_blank', rel: 'noopener sponsored' }) : el('div', 'pd-pop-media');
    img.className = 'pd-pop-img';
    img.alt = 'বিজ্ঞাপন';
    media.appendChild(img);
    var bar = el('div', 'pd-pop-bar');
    var tag = el('span', 'pd-pop-tag');
    tag.textContent = 'বিজ্ঞাপন';
    bar.appendChild(tag);
    if (link) {
      var cta = el('a', 'pd-pop-cta', { href: link, target: '_blank', rel: 'noopener sponsored' });
      cta.innerHTML = '<span>বিস্তারিত দেখুন</span>' + ARROW;
      bar.appendChild(cta);
    } else {
      var later = el('button', 'pd-pop-later', { type: 'button' });
      later.textContent = 'বন্ধ করুন';
      bar.appendChild(later);
      later.addEventListener('click', hide);
    }
    card.appendChild(close);
    card.appendChild(media);
    card.appendChild(bar);
    root.appendChild(back);
    root.appendChild(card);
    document.body.appendChild(root);

    var html = document.documentElement, oldOv = html.style.overflow;
    html.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('in'); }); });
    try { close.focus({ preventScroll: true }); } catch (e) { close.focus(); }

    var gone = false;
    function hide() {
      if (gone) return; gone = true;
      root.classList.remove('in');
      root.classList.add('out');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () {
        if (root.parentNode) root.parentNode.removeChild(root);
        html.style.overflow = oldOv;
        if (prevFocus && prevFocus.focus) try { prevFocus.focus({ preventScroll: true }); } catch (e) {}
      }, 380);
    }
    function onKey(e) {
      if (e.key === 'Escape') { hide(); return; }
      if (e.key === 'Tab') { /* ফোকাস পপআপের ভেতরেই ঘুরবে */
        var f = [].slice.call(card.querySelectorAll('a[href],button'));
        if (!f.length) return;
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    }
    close.addEventListener('click', hide);
    back.addEventListener('click', hide);
    document.addEventListener('keydown', onKey);
    /* লিংকে গেলে পপআপ বন্ধ হয়ে যায় (নতুন ট্যাবে খোলে) */
    [].forEach.call(card.querySelectorAll('a[href]'), function (a) { a.addEventListener('click', function () { setTimeout(hide, 120); }); });
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
