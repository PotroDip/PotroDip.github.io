/* reveal.js — স্ক্রোল-রিভিল (চুম্বকের টান) এনিমেশন
 *
 * নিচে স্ক্রোল করলে আইটেম/লেখা নিচ থেকে উঠে এসে বসে; একই সারির আইটেম একসাথে,
 * পরের সারি ঠিক তার পেছনে — মনে হয় উপরেরটা নিচেরটাকে টেনে আনছে।
 *
 * হালকা রাখার নিয়ম:
 *  • শুধু opacity + translate (GPU-তে চলে, লেআউট নাড়ায় না)
 *  • একটাই IntersectionObserver; স্ক্রোল ইভেন্টে কোনো ভারী কাজ নেই
 *  • এনিমেশন শেষ হলেই ক্লাস/স্টাইল মুছে যায় — কোনো স্থায়ী লেয়ার বা will-change পড়ে থাকে না
 *  • প্রথম স্ক্রিনে যা দেখা যায় তা কখনো লুকানো হয় না (LCP/ফার্স্ট পেইন্ট অক্ষত)
 *  • JS বন্ধ / reduced-motion / প্রিন্ট / স্টুডিও প্রিভিউ — সবকিছু সরাসরি দেখায়
 */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  if (!('IntersectionObserver' in window) || !('MutationObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (/[?&]pdstudio=1/.test(location.search)) return;
  if (window.__pdReveal) return;
  window.__pdReveal = true;

  /* ---------- কোন কোন জিনিস এনিমেট হবে ----------
   * ফরম্যাট: [selector, variant]
   *   variant: '' = কার্ড/ব্লক (একটু বেশি ওঠে)
   *            't' = লেখা (ছোট টান, স্কেল নেই)
   * শুধু "পাতা-স্তরের" উপাদান — ভেতরের উপাদান আলাদা করে এনিমেট হয় না, তাই ডাবল-মোশন হয় না */
  var RULES = [
    /* সেকশন হেডিং */
    ['.section-head', 't'],
    ['.end-heading', 't'],
    /* কার্ড */
    ['.article-grid > *', ''],
    ['.issue-row > *', ''],
    ['.authors-row > *', ''],
    ['.writer-row > *', ''],
    ['.issue-card', ''],
    ['.following-grid > *', ''],
    ['.saved-grid > *', ''],
    ['.info-grid > *', ''],
    ['.related-grid > *', ''],
    ['.rail-list > *', 't'],
    ['.toc-list > *', 't'],
    ['.order-card', ''],
    ['.notif-item', 't'],
    /* বড় ব্লক */
    ['.ad-slot', ''],
    ['.issue-band', ''],
    ['.rating-card', ''],
    ['.author-more-panel', ''],
    ['.bio-panel', ''],
    ['#commentForm', ''],
    ['.comment-toolbar', 't'],
    ['#commentList > *', 't'],
    /* আর্টিকেলের লেখা */
    ['.article-body > *', 't'],
    ['.article-tags', 't'],
    ['.share-block', 't'],
    /* আইনি/কাস্টম পেজ */
    ['.legal > *', 't'],
    ['#pd-page-main > *', ''],
    /* ফুটার */
    ['.newsletter-block', ''],
    ['.fm-brand', 't'],
    ['.fm-connect', 't'],
    ['.footer-bottom', 't']
  ];

  /* এগুলো প্রথম স্ক্রিনে থাকলেও ঢোকার এনিমেশন পায় (আগে থেকেই এমন ছিল) */
  var EAGER = '.au-card';
  RULES.push(['.au-card', '']);

  var SEL = RULES.map(function (r) { return r[0]; }).join(',');
  var SKIP = '#intro-overlay,.site-header,.order-drawer,[data-rv-skip]';

  var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
  if (!seen) return;
  var pending = new Set();     // লুকানো, এখনো ঢোকেনি
  var vh = window.innerHeight || 800;
  var DUR = 900;               // ms — CSS-এর সাথে মিলিয়ে রাখুন

  function variantOf(el) {
    for (var i = 0; i < RULES.length; i++) {
      if (el.matches(RULES[i][0])) return RULES[i][1];
    }
    return '';
  }

  /* ---------- রেজিস্টার: দুই ধাপ (আগে সব মাপা, পরে সব লেখা) — লেআউট থ্র্যাশিং নেই ---------- */
  function register(list) {
    var cand = [], i, el;
    for (i = 0; i < list.length; i++) {
      el = list[i];
      if (seen.has(el) || !el.isConnected) continue;
      seen.add(el);
      if (el.closest(SKIP)) continue;
      cand.push(el);
    }
    if (!cand.length) return;

    var rects = [];
    for (i = 0; i < cand.length; i++) rects.push(cand[i].getBoundingClientRect());

    for (i = 0; i < cand.length; i++) {
      el = cand[i];
      var r = rects[i];
      var hiddenBox = r.width === 0 && r.height === 0;      // display:none ইত্যাদি — দেখা গেলেই এনিমেট হবে
      var inFirstScreen = !hiddenBox && r.top < vh * 0.98 && r.bottom > 0;
      var above = !hiddenBox && r.bottom <= 0;               // ইতিমধ্যে ওপরে ফেলে এসেছে
      if (above) continue;
      if (inFirstScreen && !el.matches(EAGER)) continue;     // প্রথম স্ক্রিন: সরাসরি দেখাও
      el.classList.add('rv');
      if (variantOf(el) === 't') el.classList.add('rv-t');
      pending.add(el);
      io.observe(el);
    }
  }

  function collect(node, out) {
    if (node.nodeType !== 1) return;
    if (node.matches(SEL)) out.push(node);
    if (node.firstElementChild) {
      var found = node.querySelectorAll(SEL);
      for (var i = 0; i < found.length; i++) out.push(found[i]);
    }
  }

  /* ---------- দেখানো ---------- */
  function finish(el) {
    el.classList.remove('rv', 'rv-in', 'rv-t', 'rv-now');
    el.style.removeProperty('--rv-d');
    pending.delete(el);
  }

  function show(el, delay, instant) {
    io.unobserve(el);
    if (instant) {
      el.classList.add('rv-now', 'rv-in');
      // এক ফ্রেম পরে সাফ — ট্রানজিশন ছাড়াই বসে যায়
      requestAnimationFrame(function () { finish(el); });
      return;
    }
    el.style.setProperty('--rv-d', delay + 'ms');
    // ইনিশিয়াল স্টেট paint হওয়ার পরই ট্রানজিশন শুরু হবে
    el.classList.add('rv-in');
    var done = false;
    function end() { if (done) return; done = true; el.removeEventListener('transitionend', onEnd); finish(el); }
    function onEnd(e) { if (e.target === el && e.propertyName === 'translate') end(); }
    el.addEventListener('transitionend', onEnd);
    setTimeout(end, DUR + delay + 160);   // নিরাপত্তা-জাল
  }

  /* ---------- একই ব্যাচে ঢোকা আইটেমের সারি/কলাম ধরে "টান" ক্রম ---------- */
  var io = new IntersectionObserver(function (entries) {
    var batch = [], i, e;
    for (i = 0; i < entries.length; i++) {
      e = entries[i];
      if (!e.isIntersecting || !pending.has(e.target)) continue;
      batch.push({ el: e.target, r: e.boundingClientRect, h: e.rootBounds ? e.rootBounds.height : vh });
    }
    if (!batch.length) return;

    batch.sort(function (a, b) { return (a.r.top - b.r.top) || (a.r.left - b.r.left); });

    var row = -1, col = 0, lastTop = -9999;
    for (i = 0; i < batch.length; i++) {
      var b = batch[i];
      // ওপর দিক থেকে ঢুকলে (উপরে স্ক্রোল) বা ইতিমধ্যে অর্ধেকের ওপরে — এনিমেশন ছাড়াই
      if (b.r.bottom < b.h * 0.12 || b.r.top < -40) { show(b.el, 0, true); continue; }
      if (b.r.top - lastTop > 24) { row++; col = 0; lastTop = b.r.top; } else { col++; }
      var delay = Math.min(row * 90 + col * 45, 440);
      show(b.el, delay, false);
    }
  }, { root: null, rootMargin: '0px 0px -7% 0px', threshold: 0 });

  /* ---------- দ্রুত স্ক্রোল/অ্যাঙ্কর জাম্প: ফেলে আসা আইটেম আটকে থাকবে না ---------- */
  var sweepT = 0;
  function sweep() {
    sweepT = 0;
    var list = [];
    pending.forEach(function (el) {
      if (!el.isConnected) { pending.delete(el); io.unobserve(el); return; }
      list.push(el);
    });
    var rects = list.map(function (el) { return el.getBoundingClientRect(); });
    // পেজের একদম শেষে পৌঁছালে নিচের ছোট উপাদান (যেমন ফুটারের শেষ লাইন) -7% সীমায় পৌঁছায় না — এখানে ধরে নিই
    var atBottom = (window.innerHeight + (window.pageYOffset || 0)) >= root.scrollHeight - 4;
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      var r = rects[i];
      if (r.width === 0 && r.height === 0) continue;
      if (r.bottom < 0) show(list[i], 0, true);
      else if (atBottom && r.top < window.innerHeight) show(list[i], Math.min(n++ * 60, 300), false);
    }
  }
  window.addEventListener('scroll', function () {
    if (sweepT || !pending.size) return;
    sweepT = setTimeout(sweep, 160);
  }, { passive: true });

  window.addEventListener('resize', function () { vh = window.innerHeight || vh; }, { passive: true });

  /* প্রিন্ট / পেজ-ক্যাশ থেকে ফেরা: সব দৃশ্যমান */
  function revealAll() { pending.forEach(function (el) { finish(el); io.unobserve(el); }); pending.clear(); }
  window.addEventListener('beforeprint', revealAll);
  window.addEventListener('pageshow', function (e) { if (e.persisted) revealAll(); });

  /* ---------- শুরু ---------- */
  function boot() {
    var first = [];
    collect(doc.body, first);
    register(first);

    new MutationObserver(function (muts) {
      var out = [];
      for (var i = 0; i < muts.length; i++) {
        var add = muts[i].addedNodes;
        for (var j = 0; j < add.length; j++) collect(add[j], out);
      }
      if (out.length) register(out);
    }).observe(doc.body, { childList: true, subtree: true });
  }

  if (doc.body) boot();
  else doc.addEventListener('DOMContentLoaded', boot);
})();
