/* scroll-top.js — "প"-লোগো স্ক্রোল প্রগ্রেস ও উপরে-যাওয়ার বাটন (সব পেজে, নিচে-ডানে)  [v97]
   ▸ পেজের একদম উপরে থাকলে লুকানো; স্ক্রোল শুরু হলে ভেসে ওঠে।
   ▸ গোল বাটন: কিনার ঘিরে প্রগ্রেস রেখা চলে, যতটুকু স্ক্রোল হয়েছে তার মাথায় একটা গোল বিন্দু বসে থাকে।
   ▸ মাঝে লোগোর "প" আইকন; সার্কেলের বাইরে, একটু উপরে দুই-ঢেউয়ের তীর (একটা ম্লান হলে আরেকটা উজ্জ্বল)।
   ▸ ক্লিক করলে মসৃণভাবে পেজের উপরে চলে যায়।
   ▸ ডিজাইন স্টুডিওর ভেতরের আইফ্রেমে (?pdstudio=1) বসে না। */
(function () {
  'use strict';
  if (window.__pdTop) return;
  if (/[?&]pdstudio=1/.test(location.search)) return;
  window.__pdTop = true;

  var SHOW_AFTER = 28;                      // এত px স্ক্রোলের পর বাটন আসে
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // প্রগ্রেস রিং: উপরের মাঝ থেকে ঘড়ির কাঁটার দিকে; পুরো ঘের = pathLength ১০০
  var C = 29, R = 26.5;
  var PATH = 'M' + C + ',' + (C - R) + ' a' + R + ',' + R + ' 0 1 1 0,' + (2 * R) + ' a' + R + ',' + R + ' 0 1 1 0,' + (-2 * R);
  // লোগোর "প" (favicon.svg থেকে)
  var MARK = '<path class="pd-m-a" d="M384.6,186.8c0-0.1,0-0.1-0.1-0.2c-1.5-3-3.5-5.9-5.7-8.6c-4.8-6-10.8-11.3-16.7-15.4 c-10.2-7-28.1-12.6-43.4-11l-1.8,4.6l-0.6,1.5l-0.9,2.2l-1.9,4.4l-2,4.3l-0.4,0.8l-1.1,2.1l-0.5,0.9l-0.9,4.1l-2.9,12.8l-0.9,4.1 c-0.3-0.3-0.6-0.6-1-0.9c-14.8-13.1-31.2-24.1-48.7-32.5c-7.9-3.8-16.4-6.9-25.2-9.2c-17.3-4.5-35.7-5.8-52.7-2 c-27.1,6.1-42.1,29.8-50.6,54.5c-0.5,0.6-0.7,1.6-0.6,2.8c-0.4,4,1.5,9,3.8,13.6c5.3,12.5,14.8,26.7,20.2,24.5 c13.8-5.9,27.9-9.2,43-8.4c6.9,0.4,13.7,1.5,20.3,3.6c5.4,1.7-25.5,49-42.6,62.3c-8.1,6.3,17.4,45.6,22.8,41.5 c34.9-26.6,72.6-49.8,105.8-78.5c-0.9,37.8,1,75.2,7.3,120.2c1.3,9.3,10.3,18.1,16.8,24.1c1.3,1.2,17.5,13.6,16.6,7.1 c-9-63.8-9.1-112.3-4.9-168.4c0.5-6.3,1-12.6,1.6-19.2c0.7-7.2,1.3-14.7,2.1-22.3c0,0,0,0,0,0c4.6-6.4,6.7-15.3,25.9-19.3 c5.2,1,10.1,2.8,13.7,5.4C385.4,197,388,193.6,384.6,186.8z M228.9,270.5c33.1-90.6-23.2-69.5-44.7-74.2c0.1-0.1,0.2-0.2,0.4-0.3 c18.1-10,41.2-8.8,60.7-4.5c16.2,3.6,31.2,10.4,45,19.3C262.9,240,250.1,252.3,228.9,270.5z"/><path class="pd-m-b" d="M314.1,103.3c-0.1-2.8-0.5-5.5-0.9-8.4l-0.7-0.3l-4.1,3.5c-2.4,2-5,3.6-7.8,5.2l-3.5,1.9 c-0.3,0.2-0.9,0.7-1,0.9l2.3,8.2l0.6,2.4l0.4,1.9l0.5,3.4l0.7,5.1l0.3,3.7l0.2,3.9v5.7l-0.2,4.2l-0.2,2.7l-0.4,3.9l-0.4,2.4 l-0.8,4.8l-0.7,3.2l-0.3,1.3c0,0-0.1,1.7-0.5,3.8l0.1-0.4l0.1-0.2l0.1-0.2l0.7-1.4l1.6-3.1l1.9-3.9l1.7-4l1.4-3.4l0.7-1.8 l0.7-1.8l1-2.7l0.8-2.2l0.9-3.1l1-3.6l0.4-1.7l0.9-3.6l0.5-2.6l0.7-3.7c0.5-2.9,0.9-5.7,1-8.5l0.3-6.1L314.1,103.3z"/><path class="pd-m-b" d="M299.2,156.5l0.2-4.3v-7.5l-0.1-2.9l-0.1-2.3l-0.3-3.3l-0.4-3.7l-0.2-1.7l-0.6-3.7l-0.4-2.6l-0.7-3.7 c-0.5-2.9-1.2-5.6-2.1-8.4l-2-5.7l-2.1-5.1c-1.1-2.6-2.5-4.9-4-7.5l-0.8-0.1l-2.5,4.7c-1.5,2.7-3.3,5.2-5.4,7.6l-2.6,3.1 c-0.3,0.3-0.6,1-0.6,1.2l5.1,6.8l1.4,2.1l1,1.6l1.8,2.9l2.4,4.5l1.6,3.3l1.6,3.5l2.1,5.3l1.4,4l0.8,2.6l1,3.7l0.6,2.4l1,4.8 l0.6,3.3l0.1,0.4l-0.2-0.2v-0.1l-0.8-3.4l-0.5-1.7l-1.7-5.5l-1.7-4.8l-1.7-4.1l-1.3-3l-0.8-1.7l-1.8-3.4 c-3.9-7.3-8.5-14.1-14.2-20.2l-2.5-2.7c-2.2-2.3-4.6-4.5-7.2-6.6l-4.2-3.4c-0.1-0.1-0.7-0.3-0.7-0.2v0.5l-0.1,1.7l-0.1,2 l-0.1,1.9l-0.1,2l-0.3,2.4l-0.4,2.1l-0.6,3.4l3.2,2.7c3.5,3,6.9,5.9,10.2,9.2l4.5,4.5l2.7,2.9l1.7,1.8l1.4,1.7l3.8,4.7 c2,2.3,3.7,4.9,5.5,7.6l-4.8-4.8l-4.3-3.9l-1.6-1.4l-1.7-1.4l-2.7-2.1l-2.4-1.9l-3.2-2.4l-2.5-1.7l-3-2.1l-5.5-3.5l-6.1-3.7 l-0.9-0.4l-4.1-2.1l-2.8-1.3l-7.9,5.7l4.9,2.2l2.9,1.3l7.3,3.7l3,1.6l4.9,2.9l1.9,1l6.9,4.5l6,4.3l-3.5-2l-5.5-3.3l-3.5-1.9 l-4-2.2l-7.2-3.6l-2.7-1.3l-2-0.9l-2-0.9l-2.8-1.2l-4.3-1.9l-2.4-1l-3.7,2.4l-3.3,2.2l-0.2,0.5l7.2,2.7l9,3.7l4,1.8l7.4,3.6 l2.8,1.5l2.7,1.5l6.9,4l2.7,1.5l9.9,6.4l4.6,3.2l4.2,3.1l2.9,2.2l2.4,1.9l2.3,1.9l1,0.8l0.2-0.7l0.1-0.1l1.6-7.5l0.3-2.1 L299.2,156.5z"/><path class="pd-m-b" d="M296.8,171.3c0,0,11.6-19.8,15.5-44l-7.1,14.8c0,0-2,14.8-6.3,17.6L296.8,171.3z"/>';

  function build() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pd-top';
    b.id = 'pd-top';
    b.setAttribute('aria-label', 'পেজের উপরে যান');
    b.setAttribute('title', '');
    b.innerHTML =
      '<span class="pd-top__glow"></span>' +
      '<svg class="pd-top__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="pd-c pd-c2" d="M6 10.5l6-6 6 6"/><path class="pd-c pd-c1" d="M6 17.5l6-6 6 6"/></svg>' +
      '<span class="pd-top__face"></span>' +
      '<svg class="pd-top__svg" viewBox="0 0 58 58" aria-hidden="true" focusable="false">' +
        '<path class="pd-top__track" d="' + PATH + '"/>' +
        '<path class="pd-top__bar" d="' + PATH + '" pathLength="100" stroke-dasharray="0 100"/>' +
        '<circle class="pd-top__dot" r="3.6" cx="' + C + '" cy="' + (C - R) + '"/>' +
      '</svg>' +
      '<span class="pd-top__core" aria-hidden="true">' +
        '<svg class="pd-top__mark" viewBox="116 86 280 340" focusable="false">' + MARK + '</svg>' +
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
    var dot = btn.querySelector('.pd-top__dot');
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
      // গোল বিন্দু: প্রগ্রেস রেখার মাথায়
      var a = -Math.PI / 2 + p * 2 * Math.PI;
      dot.setAttribute('cx', (C + R * Math.cos(a)).toFixed(2));
      dot.setAttribute('cy', (C + R * Math.sin(a)).toFixed(2));
      if (pct !== lastPct) {
        lastPct = pct;
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
