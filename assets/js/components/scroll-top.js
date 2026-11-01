/* scroll-top.js — "পাতা-তারা" স্ক্রোল প্রগ্রেস ও উপরে-যাওয়ার বাটন (সব পেজে, নিচে-ডানে)
   ▸ পেজের একদম উপরে থাকলে লুকানো; স্ক্রোল শুরু হলে ভেসে ওঠে।
   ▸ কিনার ঘিরে ব্র্যান্ড-রঙের প্রগ্রেস রেখা চলে; মাঝে দুই-ঢেউয়ের তীর (একটা ম্লান হলে আরেকটা উজ্জ্বল)।
   ▸ ক্লিক করলে মসৃণভাবে পেজের উপরে চলে যায়।
   ▸ ডিজাইন স্টুডিওর ভেতরের আইফ্রেমে (?pdstudio=1) বসে না। */
(function () {
  'use strict';
  if (window.__pdTop) return;
  if (/[?&]pdstudio=1/.test(location.search)) return;
  window.__pdTop = true;

  var SHOW_AFTER = 28;                      // এত px স্ক্রোলের পর বাটন আসে
  var BN = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bn(n) { return String(n).replace(/\d/g, function (d) { return BN[+d]; }); }

  // পাতার আকৃতির পথ: ওপরের-বাঁ ও নিচের-ডান কোণ বড় গোল, বাকি দুটো ছোট (CSS border-radius-এর সাথে মেলানো)
  var X0 = 2.5, Y0 = 2.5, X1 = 55.5, Y1 = 55.5, RB = 21, RS = 7, CX = 29;
  var PATH =
    'M' + CX + ',' + Y0 +
    ' H' + (X1 - RS) + ' A' + RS + ',' + RS + ' 0 0 1 ' + X1 + ',' + (Y0 + RS) +
    ' V' + (Y1 - RB) + ' A' + RB + ',' + RB + ' 0 0 1 ' + (X1 - RB) + ',' + Y1 +
    ' H' + (X0 + RS) + ' A' + RS + ',' + RS + ' 0 0 1 ' + X0 + ',' + (Y1 - RS) +
    ' V' + (Y0 + RB) + ' A' + RB + ',' + RB + ' 0 0 1 ' + (X0 + RB) + ',' + Y0 +
    ' H' + CX;

  function build() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pd-top';
    b.id = 'pd-top';
    b.setAttribute('aria-label', 'পেজের উপরে যান');
    b.setAttribute('title', '');
    b.innerHTML =
      '<span class="pd-top__glow"></span>' +
      '<span class="pd-top__face"></span>' +
      '<svg class="pd-top__svg" viewBox="0 0 58 58" aria-hidden="true" focusable="false">' +
        '<path class="pd-top__track" d="' + PATH + '"/>' +
        '<path class="pd-top__bar" d="' + PATH + '" pathLength="100" stroke-dasharray="0 100"/>' +
      '</svg>' +
      '<span class="pd-top__core" aria-hidden="true">' +
        '<svg class="pd-top__arrow" viewBox="0 0 24 24"><path class="pd-c pd-c2" d="M6 11.5l6-6 6 6"/><path class="pd-c pd-c1" d="M6 18.5l6-6 6 6"/></svg>' +
        '<span class="pd-top__num">০<i>%</i></span>' +
      '</span>' +
      '<span class="pd-top__tip" aria-hidden="true">উপরে যান</span>';
    document.body.appendChild(b);
    return b;
  }

  function init() {
    if (document.getElementById('pd-top')) return;
    var btn = build();
    var bar = btn.querySelector('.pd-top__bar');
    var tip = btn.querySelector('.pd-top__tip');
    var num = btn.querySelector('.pd-top__num');
    var ticking = false, lastExtra = '', lastPct = -1, lastLiftCheck = 0, going = false;

    function liftCheck(now) {
      if (now - lastLiftCheck < 600) return;
      lastLiftCheck = now;
      var fab = document.getElementById('cart-fab');
      var lift = false;
      if (fab) { try { lift = getComputedStyle(fab).display !== 'none'; } catch (e) {} }
      btn.classList.toggle('pd-lift', lift);
    }

    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      var max = h - window.innerHeight;
      var on = max > 120 && y > SHOW_AFTER;
      btn.classList.toggle('pd-on', on);
      if (!on) { if (y <= 2 && going) { going = false; btn.classList.remove('pd-going'); } return; }

      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      var pct = Math.round(p * 100);
      bar.setAttribute('stroke-dasharray', (p * 100).toFixed(2) + ' 100');
      if (pct !== lastPct) {
        lastPct = pct;
        num.innerHTML = bn(pct) + '<i>%</i>';
        btn.setAttribute('aria-valuenow', pct);
      }
      var end = pct >= 98;
      if (end !== btn.classList.contains('pd-end')) {
        btn.classList.toggle('pd-end', end);
        tip.textContent = end ? 'শেষ — উপরে ফিরুন' : 'উপরে যান';
      }
      liftCheck(Date.now());
      // ফুটারের "Created by" অংশ দেখা গেলে বাটন তার ওপরে উঠে বসে — যাতে নাম/ফোন ঢেকে না যায়
      var cr = document.querySelector('.creator');
      var extra = '';
      if (cr) {
        var r = cr.getBoundingClientRect();
        var bl = window.innerWidth - (window.innerWidth <= 640 ? 14 : 18) - btn.offsetWidth;
        if (r.top < window.innerHeight && r.bottom > 0 && r.right > bl - 8 && r.left < window.innerWidth) {
          var need = Math.round(window.innerHeight - r.top + 14);
          if (need > 0) extra = need + 'px';
        }
      }
      if (extra !== lastExtra) { lastExtra = extra; btn.style.bottom = extra; }
      if (going && y <= 2) { going = false; btn.classList.remove('pd-going'); }
    }

    function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    window.addEventListener('load', req);
    if (window.ResizeObserver) { try { new ResizeObserver(req).observe(document.body); } catch (e) {} }

    btn.addEventListener('click', function () {
      going = true;
      btn.classList.add('pd-going');
      try { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
      catch (e) { window.scrollTo(0, 0); }
      setTimeout(function () { btn.classList.remove('pd-going'); going = false; }, 1800);
    });

    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
