/* ring-light.js (v103) — হোমপেজের হিরো বক্সের চার পাশ দিয়ে ঘুরন্ত চিকন আলোর রেখা
   • বক্সের কিনারা (কর্নারসহ) ধরে একটা আলোর রেখা ঘড়ির কাঁটার দিকে ঘোরে — লেজের দিকটা ফিকে হয়ে যায়
   • আকার/কর্নার-র‍্যাডিয়াস বদলালে (রিসাইজ) নিজে মাপ ঠিক করে নেয়
   • হিরো পরে (home.js দিয়ে) আঁকা হয়, তাই MutationObserver দিয়ে অপেক্ষা করে
   • গতি বদলাতে home.css-এ --pd-ring-t (সেকেন্ড) */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function mk(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function attach(box) {
    if (!box || box.querySelector(':scope > .pd-ring')) return;
    var svg = mk('svg', { 'class': 'pd-ring', 'aria-hidden': 'true', 'focusable': 'false' });
    var paths = ['tail', 'mid', 'head'].map(function (c) {
      var p = mk('path', { 'class': 'pd-ring-' + c, 'pathLength': '1000', 'fill': 'none' });
      svg.appendChild(p);
      return p;
    });
    box.appendChild(svg);

    function draw() {
      var w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      var i = 1.5;                                           /* কিনারা থেকে ভেতরে ১px */
      var r = parseFloat(getComputedStyle(box).borderTopLeftRadius) || 0;
      var W = w - 2 * i, H = h - 2 * i;
      r = Math.max(0, Math.min(r - i, W / 2, H / 2));
      var d = 'M' + (i + r) + ' ' + i +
        'H' + (i + W - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (i + W) + ' ' + (i + r) +
        'V' + (i + H - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (i + W - r) + ' ' + (i + H) +
        'H' + (i + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + i + ' ' + (i + H - r) +
        'V' + (i + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (i + r) + ' ' + i + 'Z';
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      paths.forEach(function (p) { p.setAttribute('d', d); });
    }
    draw();
    if (window.ResizeObserver) new ResizeObserver(draw).observe(box);
    else window.addEventListener('resize', draw);
  }

  function scan(grid) { attach(grid.querySelector('.hb')); }

  function init() {
    var grid = document.getElementById('hero-grid');
    if (!grid) return;
    scan(grid);
    new MutationObserver(function () { scan(grid); }).observe(grid, { childList: true });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
