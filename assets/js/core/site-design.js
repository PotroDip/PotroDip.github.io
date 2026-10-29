/* site-design.js — "সাইট ডিজাইনার"-এ সাজানো ডিজাইন সব পেজে প্রয়োগ করে।
   - প্রকাশিত ডিজাইন Supabase-এর site_settings টেবিলে (key = design_live) থাকে।
   - দ্রুত দেখানোর জন্য শেষ ডিজাইন ব্রাউজারে জমা (cache) রাখা হয়, তারপর নতুনটা এনে মিলিয়ে নেওয়া হয়।
   - ডিজাইনারের প্রিভিউতে (?pdpreview=1) নিজে থেকে কিছু প্রয়োগ হয় না; ডিজাইনার PDDesign.apply() ডাকে।
   - কোনো ইনলাইন স্ক্রিপ্ট নেই, তাই CSP-এর সাথে সমস্যা নেই। এডমিন পেজে এটি চলে না। */
(function () {
  'use strict';
  var CACHE_KEY = 'pd-design-cache';
  var PREVIEW = /[?&]pdpreview=1/.test(location.search) || window.name === 'pdd-preview';
  var PAGE = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (PAGE === 'admin.html') return;

  var cfg = null;          // বর্তমানে প্রয়োগ করা কনফিগ
  var styleEl = null;
  var textChanged = [];    // [{el, orig}] — লেখা বদলানো এলিমেন্ট (ফেরত আনার জন্য)
  var attrChanged = [];    // [{el, name, orig}]
  var observer = null;
  var timer = null;
  var movedDone = {};      // এই ডকুমেন্টে যে স্থান-বদলগুলো আগেই হয়ে গেছে (id ধরে)

  /* ---------- নিরাপত্তা সহায়ক ---------- */
  function safeUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(u)) return u;
    if (/^[a-z0-9_\-\/.]+(\?[^\s]*)?(#[^\s]*)?$/i.test(u)) return u;   // নিজের সাইটের আপেক্ষিক লিংক
    return '';
  }
  function safeImg(u) {
    u = String(u == null ? '' : u).trim();
    if (/^https:\/\//i.test(u)) return u;
    if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(u)) return u;
    if (/^[a-z0-9_\-\/.]+$/i.test(u)) return u;
    return '';
  }
  function cssVal(v) {   // CSS মানে ক্ষতিকর অংশ আটকানো
    v = String(v == null ? '' : v);
    if (/[{};<>]|url\s*\(\s*['"]?\s*javascript|expression\s*\(|@import/i.test(v.replace(/url\(\s*['"]?https:\/\/[^)'"]+['"]?\s*\)/ig, ''))) return '';
    return v;
  }
  var PROP_MAP = {
    color: 'color', background: 'background', bgImage: 'background-image', bgSize: 'background-size', bgPos: 'background-position',
    fontSize: 'font-size', fontWeight: 'font-weight', textAlign: 'text-align', lineHeight: 'line-height',
    letterSpacing: 'letter-spacing', textTransform: 'text-transform', fontStyle: 'font-style', textDecoration: 'text-decoration',
    padding: 'padding', paddingTop: 'padding-top', paddingBottom: 'padding-bottom', paddingLeft: 'padding-left', paddingRight: 'padding-right',
    margin: 'margin', marginTop: 'margin-top', marginBottom: 'margin-bottom', marginLeft: 'margin-left', marginRight: 'margin-right',
    width: 'width', maxWidth: 'max-width', height: 'height', minHeight: 'min-height',
    borderRadius: 'border-radius', border: 'border', borderTop: 'border-top', borderBottom: 'border-bottom',
    boxShadow: 'box-shadow', opacity: 'opacity', fill: 'fill', stroke: 'stroke', display: 'display',
    gap: 'gap', flexDirection: 'flex-direction', justifyContent: 'justify-content', alignItems: 'align-items',
    position: 'position', zIndex: 'z-index', objectFit: 'object-fit', transform: 'transform', filter: 'filter'
  };
  function decls(p) {
    var out = '';
    for (var k in p) {
      if (!PROP_MAP[k]) continue;
      var v = p[k];
      if (v === '' || v == null) continue;
      v = cssVal(v);
      if (v === '') continue;
      out += PROP_MAP[k] + ':' + v + ' !important;';
    }
    return out;
  }
  function validSel(sel) {
    if (!sel || typeof sel !== 'string' || sel.length > 600) return false;
    if (/[{};<]/.test(sel)) return false;
    try { document.querySelector(sel); return true; } catch (e) { return false; }
  }
  function onPage(r) { return !r.page || r.page === '*' || String(r.page).toLowerCase() === PAGE; }

  /* ---------- CSS তৈরি ---------- */
  var GLOBAL_TYPO = { h1: 'h1', h2: 'h2', h3: 'h3', p: 'p', btn: 'button, .btn, a.btn' };
  function buildCss(c) {
    var css = '';
    var g = c.g || {};
    // রং (লাইট/ডার্ক)
    var cl = g.colors && g.colors.light, cd = g.colors && g.colors.dark, k, s;
    if (cl) { s = ''; for (k in cl) if (/^--[a-z-]+$/.test(k) && cssVal(cl[k])) s += k + ':' + cssVal(cl[k]) + ';'; if (s) css += ':root{' + s + '}\n'; }
    if (cd) { s = ''; for (k in cd) if (/^--[a-z-]+$/.test(k) && cssVal(cd[k])) s += k + ':' + cssVal(cd[k]) + ';'; if (s) css += 'html[data-theme="dark"]{' + s + '}\n'; }
    // সাইট-জুড়ে জুম, প্রস্থ, হেডার
    if (g.zoom && +g.zoom !== 100) css += 'body{zoom:' + (Math.max(60, Math.min(160, +g.zoom)) / 100) + ' !important;}\n';
    if (g.maxWidth) css += '.wrap,.header-inner,.footer-inner{max-width:' + (Math.max(700, Math.min(2000, +g.maxWidth))) + 'px !important;}\n';
    if (g.headerStatic) css += 'header{position:static !important;}\n';
    if (g.bodyBg) css += 'body{background:' + cssVal(g.bodyBg) + ' !important;}\n';
    // লেখার ধরন
    var ty = g.typo || {};
    for (k in GLOBAL_TYPO) {
      if (!ty[k]) continue;
      var d = decls(ty[k]);
      if (d) css += GLOBAL_TYPO[k] + '{' + d + '}\n';
    }
    // এলিমেন্ট-ভিত্তিক নিয়ম
    (c.rules || []).forEach(function (r) {
      if (!onPage(r) || !validSel(r.sel)) return;
      if (r.hide) { css += r.sel + '{display:none !important;}\n'; return; }
      var d = decls(r.p || {});
      if (d) css += r.sel + '{' + d + '}\n';
      var dd = decls(r.d || {});
      if (dd) css += 'html[data-theme="dark"] ' + r.sel + '{' + dd + '}\n';
    });
    // অ্যাডভান্সড CSS
    if (g.customCss) css += String(g.customCss).replace(/<\/style/ig, '').replace(/@import[^;]*;?/ig, '') + '\n';
    return css;
  }

  /* ---------- এলিমেন্টের "ছাপ" (signature): স্থান-বদল/যোগ করার সময় সঠিক এলিমেন্টেই কাজ হচ্ছে কিনা মিলিয়ে দেখতে ---------- */
  function origOf(node) {
    for (var i = 0; i < textChanged.length; i++) if (textChanged[i].node === node) return textChanged[i].orig;
    return node.nodeValue;
  }
  function collectText(el, out) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) out.push(origOf(n));
      else if (n.nodeType === 1 && !/^(script|style|svg|noscript)$/i.test(n.tagName)) collectText(n, out);
    }
  }
  function sigOf(el) {
    var h = el.matches && el.matches('h1,h2,h3') ? el : (el.querySelector && el.querySelector('h1,h2,h3'));
    var parts = [];
    collectText(h || el, parts);
    return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  }
  function sigOK(el, sig) { return !sig || sigOf(el) === sig; }

  /* ---------- DOM কাজ: লেখা, লিংক, যোগ করা এলিমেন্ট, সরানো ---------- */
  function firstTextNode(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) return n;
    return null;
  }
  function restore() {
    textChanged.forEach(function (t) { try { t.node.nodeValue = t.orig; } catch (e) {} });
    textChanged = [];
    attrChanged.forEach(function (a) { try { if (a.orig === null) a.el.removeAttribute(a.name); else a.el.setAttribute(a.name, a.orig); } catch (e) {} });
    attrChanged = [];
  }
  var ICONS = {
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2 7 12 13 22 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"/>',
    map: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
  };
  function mkIcon(name) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('width', '28'); s.setAttribute('height', '28');
    var tmp = document.createElementNS(ns, 'g');
    // শুধু আমাদের নিজের বানানো আইকন-তালিকা থেকেই বসানো হয়
    var parser = new DOMParser();
    var doc = parser.parseFromString('<svg xmlns="' + ns + '">' + (ICONS[name] || ICONS.star) + '</svg>', 'image/svg+xml');
    var kids = doc.documentElement.childNodes;
    for (var i = 0; i < kids.length; i++) tmp.appendChild(document.importNode(kids[i], true));
    while (tmp.firstChild) s.appendChild(tmp.firstChild);
    return s;
  }
  function buildAdded(a) {
    var el, c = a.content || {}, k = a.kind;
    if (k === 'heading') { el = document.createElement('h2'); el.textContent = c.text || ''; }
    else if (k === 'text') { el = document.createElement('p'); el.textContent = c.text || ''; }
    else if (k === 'button') {
      el = document.createElement('a'); el.className = 'btn'; el.textContent = c.text || '';
      var h = safeUrl(c.href); if (h) el.setAttribute('href', h);
      el.style.cssText = 'display:inline-block;padding:11px 26px;border-radius:99px;background:var(--primary);color:#fff;font-weight:600;';
    }
    else if (k === 'image') {
      el = document.createElement('img'); var s = safeImg(c.src); if (s) el.setAttribute('src', s);
      el.setAttribute('alt', c.alt || ''); el.style.cssText = 'max-width:100%;height:auto;border-radius:10px;';
    }
    else if (k === 'divider') { el = document.createElement('hr'); el.style.cssText = 'border:0;border-top:1px solid var(--border);margin:24px 0;'; }
    else if (k === 'spacer') { el = document.createElement('div'); el.style.cssText = 'height:' + (parseInt(c.h, 10) || 40) + 'px;'; el.setAttribute('aria-hidden', 'true'); }
    else if (k === 'box') {
      el = document.createElement('div'); el.style.cssText = 'padding:22px 26px;border-radius:14px;background:var(--surface);border:1px solid var(--border);';
      var t = document.createElement('p'); t.textContent = c.text || ''; el.appendChild(t);
    }
    else if (k === 'icon') { el = document.createElement('div'); el.style.cssText = 'color:var(--primary);line-height:0;'; el.appendChild(mkIcon(c.icon)); }
    else return null;
    el.setAttribute('data-pd-add', a.id);
    return el;
  }
  function insertAt(anchor, el, pos) {
    if (pos === 'before') anchor.parentNode.insertBefore(el, anchor);
    else if (pos === 'inside-start') anchor.insertBefore(el, anchor.firstChild);
    else if (pos === 'inside-end') anchor.appendChild(el);
    else anchor.parentNode.insertBefore(el, anchor.nextSibling);
  }
  function applyStructure(c) {
    // সরানো (একবারই)
    (c.moves || []).forEach(function (m) {
      if (!onPage(m) || !validSel(m.sel)) return;
      if (movedDone[m.id]) return;
      var el = document.querySelector(m.sel);
      if (!el || !sigOK(el, m.sig)) return;
      var sib = m.dir < 0 ? el.previousElementSibling : el.nextElementSibling;
      while (sib && sib.hasAttribute('data-pd-add')) sib = m.dir < 0 ? sib.previousElementSibling : sib.nextElementSibling;
      if (!sib) return;
      if (m.dir < 0) el.parentNode.insertBefore(el, sib); else el.parentNode.insertBefore(el, sib.nextSibling);
      el.setAttribute('data-pd-moved', m.id);
      movedDone[m.id] = 1;
    });
    // নতুন এলিমেন্ট
    var wanted = {};
    (c.adds || []).forEach(function (a) {
      if (!onPage(a)) return;
      wanted[a.id] = 1;
      var old = document.querySelector('[data-pd-add="' + a.id + '"]');
      if (old) { var fresh = buildAdded(a); if (fresh && old.getAttribute('data-pd-sig') !== JSON.stringify(a.content)) { old.parentNode.replaceChild(fresh, old); fresh.setAttribute('data-pd-sig', JSON.stringify(a.content)); } return; }
      if (!validSel(a.anchor)) return;
      var anchor = document.querySelector(a.anchor);
      if (!anchor || !sigOK(anchor, a.asig)) return;
      var el = buildAdded(a);
      if (!el) return;
      el.setAttribute('data-pd-sig', JSON.stringify(a.content));
      insertAt(anchor, el, a.pos);
    });
    [].forEach.call(document.querySelectorAll('[data-pd-add]'), function (n) { if (!wanted[n.getAttribute('data-pd-add')]) n.remove(); });
  }
  function applyTexts(c) {
    restore();
    (c.rules || []).forEach(function (r) {
      if (!onPage(r) || !validSel(r.sel)) return;
      var els;
      try { els = document.querySelectorAll(r.sel); } catch (e) { return; }
      [].forEach.call(els, function (el) {
        if (el.hasAttribute('data-pd-add')) return;
        if (typeof r.text === 'string') {
          var n = firstTextNode(el);
          if (n) { textChanged.push({ node: n, orig: n.nodeValue }); n.nodeValue = r.text; }
        }
        if (typeof r.href === 'string' && el.tagName === 'A') {
          var h = safeUrl(r.href);
          if (h) { attrChanged.push({ el: el, name: 'href', orig: el.getAttribute('href') }); el.setAttribute('href', h); }
        }
        if (typeof r.src === 'string' && el.tagName === 'IMG') {
          var s = safeImg(r.src);
          if (s) { attrChanged.push({ el: el, name: 'src', orig: el.getAttribute('src') }); el.setAttribute('src', s); }
        }
      });
    });
  }

  /* ---------- মূল প্রয়োগ ---------- */
  function run() {
    if (!cfg) return;
    if (observer) observer.disconnect();
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'pd-design-style';
      (document.head || document.documentElement).appendChild(styleEl);
    }
    var css = '';
    try { css = buildCss(cfg); } catch (e) { css = ''; }
    if (PREVIEW) css = '#intro-overlay{display:none !important;}#main-content{opacity:1 !important;}\n' + css;
    if (styleEl.textContent !== css) styleEl.textContent = css;
    if (document.body) {
      try { applyStructure(cfg); } catch (e) {}
      try { applyTexts(cfg); } catch (e) {}
      watch();
    }
  }
  function watch() {
    if (!window.MutationObserver || !document.body) return;
    if (!observer) observer = new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(run, 180); });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function apply(c) {
    cfg = c && typeof c === 'object' ? c : { rules: [] };
    run();
  }
  function reset() {
    cfg = { rules: [] };
    run();
  }
  function stamp(c) { return c ? (c.updatedAt || '') + '|' + (c.rules || []).length : ''; }

  window.PDDesign = { sig: sigOf, markMoved: function (id) { movedDone[id] = 1; }, apply: apply, reset: reset, page: PAGE, buildCss: buildCss, icons: ICONS, safeUrl: safeUrl, safeImg: safeImg, preview: PREVIEW };

  if (PREVIEW) {
    // প্রিভিউ: শুরুতে পরিষ্কার; ডিজাইনার নিজে apply() ডাকবে
    if (document.readyState !== 'loading') run(); else document.addEventListener('DOMContentLoaded', run);
    cfg = { rules: [] };
    return;
  }

  /* ---------- সাধারণ দর্শক: জমা থেকে দ্রুত, তারপর ডেটাবেস থেকে নতুনটা ---------- */
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) {}
  if (cached) { cfg = cached; run(); }
  function boot() {
    if (cfg) run();
    var PD = window.PD;
    if (!PD || !PD.db) return;
    PD.db.from('site_settings').select('value').eq('key', 'design_live').then(function (r) {
      var v = r && r.data && r.data[0] && r.data[0].value;
      if (!v || typeof v !== 'object') {
        if (cached) { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} cfg = { rules: [] }; run(); restore(); }
        return;
      }
      if (stamp(v) === stamp(cached) && cached) return;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(v)); } catch (e) {}
      cached = v;
      apply(v);
    }, function () {});
  }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
