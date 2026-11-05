/* header-fx.js (v104) — নতুন "ভাসমান গ্লাস-আইল্যান্ড" হেডারের ছোট ছোট ইফেক্ট
   • মেনুর পেছনে চলমান ইন্ডিকেটর (হোভারে ছোটে, মাউস সরালে চলতি পেজে ফেরে)
   • স্ক্রল-প্রগ্রেস রেখা (--pd-prog)
   • নিচে স্ক্রলে হেডার লুকায়, ওপরে স্ক্রলে ফিরে আসে
   • কিবোর্ডে "/" চাপলে সার্চ খোলে
   • (v104) পুরো হেডারের ওপর দিয়ে লাইট সুইপ — প্রতি ৫ সেকেন্ডে ডান↔বাম দিক বদলে
   JS বন্ধ থাকলেও হেডার ঠিকঠাক কাজ করে (শুধু ইফেক্টগুলো থাকে না) */
(function () {
  'use strict';
  var root = document.documentElement;
  var header = null;

  function ready(fn) {
    if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---------- ১) চলমান ইন্ডিকেটর ---------- */
  function setupIndicator() {
    var nav = header.querySelector('.nav-links');
    if (!nav || nav.querySelector('.pd-ind')) return;
    var ind = document.createElement('span');
    ind.className = 'pd-ind noanim';
    ind.setAttribute('aria-hidden', 'true');
    nav.insertBefore(ind, nav.firstChild);

    var items = [].slice.call(nav.querySelectorAll(':scope > a, :scope > .nav-dd > .nav-dd-btn'));
    if (!items.length) return;
    var current = null;

    function activeEl() {
      return nav.querySelector(':scope > a.active, :scope > .nav-dd.active > .nav-dd-btn');
    }
    function place(el, instant) {
      if (!el) { ind.classList.remove('on'); current = null; return; }
      var a = el.getBoundingClientRect(), b = nav.getBoundingClientRect();
      if (!a.width || !b.width) return;           /* মোবাইলে নেভ লুকানো */
      if (instant) ind.classList.add('noanim');
      ind.style.setProperty('--ix', (a.left - b.left) + 'px');
      ind.style.setProperty('--iw', a.width + 'px');
      ind.classList.add('on');
      if (instant) { void ind.offsetWidth; ind.classList.remove('noanim'); }
      current = el;
    }

    items.forEach(function (el) {
      el.addEventListener('mouseenter', function () { place(el, !ind.classList.contains('on')); });
      el.addEventListener('focus', function () { place(el, false); });
    });
    nav.addEventListener('mouseleave', function () { place(activeEl(), false); });
    nav.addEventListener('focusout', function () {
      setTimeout(function () { if (!nav.contains(document.activeElement)) place(activeEl(), false); }, 0);
    });

    function settle() { place(current && nav.matches(':hover') ? current : activeEl(), true); }
    settle();
    window.addEventListener('resize', settle);
    window.addEventListener('load', settle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
    setTimeout(settle, 400);
    root.classList.add('pd-fx');
  }

  /* ---------- ২) স্ক্রল: প্রগ্রেস + স্মার্ট লুকানো ---------- */
  function setupScroll() {
    var inner = header.querySelector('.header-inner');
    if (inner && !inner.querySelector('.pd-progress')) {
      var bar = document.createElement('i');
      bar.className = 'pd-progress';
      bar.setAttribute('aria-hidden', 'true');
      inner.appendChild(bar);
    }
    var lastY = window.pageYOffset || 0, ticking = false, hidden = false;

    function busy() {
      /* খোলা ড্রপডাউন / ফোকাস / হোভার / খোলা মেনু বা সার্চ থাকলে হেডার লুকাবে না */
      if (header.matches(':hover') || header.matches(':focus-within')) return true;
      if (document.querySelector('.site-header .nav-dd.open')) return true;
      var mm = document.getElementById('mobile-menu');
      if (mm && mm.classList.contains('open')) return true;
      var so = document.getElementById('search-overlay');
      if (so && (so.classList.contains('open') || so.classList.contains('show') || so.classList.contains('active'))) return true;
      /* লগইন ড্যাশবোর্ডের স্টিকি ট্যাব হেডারের নিচে বসে — সেখানে লুকানো বন্ধ */
      if (document.querySelector('.dash-tabs')) return true;
      return false;
    }
    function setHidden(v) {
      if (v === hidden) return;
      hidden = v;
      header.classList.toggle('pd-hide', v);
    }
    function update() {
      ticking = false;
      var y = window.pageYOffset || 0;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      header.style.setProperty('--pd-prog', Math.min(1, Math.max(0, y / max)).toFixed(4));
      var dy = y - lastY;
      if (Math.abs(dy) > 6) {
        if (y > 280 && dy > 0 && !busy()) setHidden(true);
        else if (dy < 0 || y <= 280) setHidden(false);
        lastY = y;
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    header.addEventListener('focusin', function () { setHidden(false); });
    update();
  }

  /* ---------- ৩) "/" শর্টকাট ---------- */
  function setupShortcut() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      var btn = header.querySelector('button[aria-label="সার্চ"]');
      if (!btn) return;
      e.preventDefault();
      header.classList.remove('pd-hide');
      btn.click();
    });
  }

  /* ---------- ৪) লাইট সুইপ (CSS-এ অ্যানিমেশন; এখানে শুধু এলিমেন্ট বসানো) ---------- */
  function setupSweep() {
    var inner = header.querySelector('.header-inner');
    if (!inner || inner.querySelector('.pd-sweep')) return;
    var sw = document.createElement('i');
    sw.className = 'pd-sweep';
    sw.setAttribute('aria-hidden', 'true');
    sw.appendChild(document.createElement('b'));
    inner.appendChild(sw);
  }

  ready(function () {
    header = document.querySelector('header.site-header');
    if (!header) return;
    setupSweep();
    setupIndicator();
    setupScroll();
    setupShortcut();
  });
})();
