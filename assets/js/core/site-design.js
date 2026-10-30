/* site-design.js — "ডিজাইন স্টুডিও"-তে পাবলিশ করা ডিজাইন সাইটে বসানোর ইঞ্জিন (সব পেজে লোড হয়)।
   ▸ সাধারণ ভিজিটর: কিছুই টের পায় না — পাবলিশ করা ডিজাইন নিঃশব্দে সাইটের অংশ হয়ে বসে।
   ▸ ডিজাইন না থাকলে (বা পাবলিশ না করলে) এই ফাইল সাইটের কিছুই বদলায় না।
   ▸ ডিজাইনের ডেটা থাকে Supabase-এর site_settings টেবিলে (key = site_design)। না পেলে assets/data/site-design.json।
   ▸ স্টুডিওর ভেতরের আইফ্রেমে (?pdstudio=1) এটি নিজে কিছু আনে না; স্টুডিও নিজে ডিজাইন ঢুকিয়ে দেয়। */
(function () {
  'use strict';
  var KEY = 'site_design';
  var CACHE = 'pd-design-cache-v1';
  var STUDIO = /[?&]pdstudio=1/.test(location.search);

  /* ---------- অনুমোদিত CSS প্রপার্টি (বাইরে কিছু বসবে না) ---------- */
  var OK = {};
  ('translate rotate scale transform-origin width height min-width min-height max-width max-height ' +
    'margin margin-top margin-right margin-bottom margin-left padding padding-top padding-right padding-bottom padding-left ' +
    'display flex-direction flex-wrap justify-content align-items align-self align-content gap row-gap column-gap flex flex-grow flex-shrink flex-basis grid-template-columns order ' +
    'position top left right bottom z-index overflow overflow-x overflow-y ' +
    'font-family font-size font-weight font-style line-height letter-spacing word-spacing text-align text-decoration text-transform text-shadow white-space text-indent ' +
    'color -webkit-text-fill-color -webkit-background-clip background-clip ' +
    'background background-color background-image background-size background-position background-repeat background-attachment ' +
    'border border-width border-style border-color border-radius border-top border-right border-bottom border-left ' +
    'border-top-left-radius border-top-right-radius border-bottom-left-radius border-bottom-right-radius ' +
    'box-shadow opacity filter backdrop-filter mix-blend-mode object-fit object-position aspect-ratio cursor pointer-events visibility transition ' +
    'outline outline-offset list-style').split(' ').forEach(function (k) { OK[k] = 1; });

  var BPQ = { t: '(max-width:1023px)', m: '(max-width:767px)' };
  var HIDEQ = { d: '(min-width:1024px)', t: '(min-width:768px) and (max-width:1023px)', m: '(max-width:767px)' };

  /* ---------- ছোট সহায়ক ---------- */
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return false;
    if (/^(javascript|data|vbscript|file):/i.test(u)) return false;
    return /^(https:\/\/|\/|\.\/|\.\.\/|assets\/|[a-z0-9_\-.\/%]+$)/i.test(u);
  }
  function safeHref(u) {
    u = String(u || '').trim();
    if (!u) return false;
    if (/^(javascript|data|vbscript|file):/i.test(u)) return false;
    return /^(https?:\/\/|mailto:|tel:|#|\/|\.\/|\.\.\/|[a-z0-9_\-.\/%?=&#]+$)/i.test(u);
  }
  function cv(v) {
    v = String(v == null ? '' : v).replace(/[\r\n{}<>\\;]/g, '').trim();
    if (!v) return '';
    if (/expression\s*\(|@import|javascript:|behavior\s*:|-moz-binding/i.test(v)) return '';
    v = v.replace(/url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi, function (m, q, u) { return safeUrl(u) ? 'url("' + u + '")' : 'none'; });
    return v;
  }
  function okSel(s) { return typeof s === 'string' && s.length < 600 && /^[^{};@<>\\]+$/.test(s); }
  function decls(css) {
    var o = '';
    for (var k in css) {
      if (!OK[k]) continue;
      var v = cv(css[k]);
      if (v === '') continue;
      o += k + ':' + v + ' !important;';
    }
    return o;
  }
  function pageKey() {
    var p = location.pathname.split('/').pop() || 'index';
    p = p.replace(/\.html$/i, '') || 'index';
    if (p === 'page') {
      var s = new URLSearchParams(location.search).get('p');
      return 'page:' + (s || '');
    }
    return p;
  }

  /* ---------- HTML ছেঁকে নেওয়া (শুধু নিরাপদ ট্যাগ/অ্যাট্রিবিউট) ---------- */
  var TAGS = 'div section span p h1 h2 h3 h4 h5 h6 a button img ul ol li strong em b i u mark br hr blockquote figure figcaption small label input form svg path circle rect line polyline polygon ellipse g defs lineargradient stop cite time'.split(' ');
  var TAGOK = {}; TAGS.forEach(function (t) { TAGOK[t] = 1; });
  var ATTR_OK = /^(class|alt|title|target|rel|role|type|placeholder|name|value|for|width|height|viewbox|d|fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-opacity|fill-opacity|fill-rule|clip-rule|cx|cy|r|rx|ry|x|y|x1|x2|y1|y2|points|transform|opacity|offset|stop-color|stop-opacity|gradientunits|gradienttransform|id|xmlns|aria-[a-z-]+|data-pd-[a-z-]+)$/i;

  function cleanInto(src, dst, doc) {
    [].slice.call(src.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { dst.appendChild(doc.createTextNode(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      var tag = n.nodeName.toLowerCase();
      if (!TAGOK[tag]) { cleanInto(n, dst, doc); return; }
      var isSvg = n.namespaceURI === 'http://www.w3.org/2000/svg';
      var el = isSvg ? doc.createElementNS('http://www.w3.org/2000/svg', n.nodeName.replace(/lineargradient/i, 'linearGradient')) : doc.createElement(tag);
      [].slice.call(n.attributes).forEach(function (a) {
        var name = a.name.toLowerCase();
        if (name === 'href' || name === 'xlink:href') {
          if (tag === 'a' && safeHref(a.value)) el.setAttribute('href', a.value);
          return;
        }
        if (name === 'src') { if (tag === 'img' && safeUrl(a.value)) el.setAttribute('src', a.value); return; }
        if (name === 'id') { if (/^[a-z][\w-]{0,40}$/i.test(a.value) && !/^(intro|main-content|brand|theme)/.test(a.value)) el.setAttribute('id', a.value); return; }
        if (name.indexOf('on') === 0 || name === 'style') return;
        if (ATTR_OK.test(name)) el.setAttribute(a.name, a.value);
      });
      if (tag === 'a' && el.getAttribute('target') === '_blank') el.setAttribute('rel', 'noopener noreferrer');
      cleanInto(n, el, doc);
      dst.appendChild(el);
    });
  }
  function sanitizeFrag(html, doc) {
    var p = new DOMParser().parseFromString('<body>' + String(html || ''), 'text/html');
    var box = doc.createElement('div');
    cleanInto(p.body, box, doc);
    return box;
  }
  function sanitizeHtml(html, doc) { return sanitizeFrag(html, doc || document).innerHTML; }

  /* ---------- ডিজাইন-ব্লকের ডিফল্ট স্টাইল (শুধু নতুন এলিমেন্ট যোগ হলেই বসে) ---------- */
  var BLOCK_CSS =
    '.pd-box{padding:28px;border-radius:14px;background:var(--surface);border:1px solid var(--border);}' +
    '.pd-h{font-family:"Gunjoron",serif;font-weight:700;line-height:1.3;color:var(--text);font-size:30px;margin:0;}' +
    '.pd-p{font-family:"Gunjoron",serif;font-size:17px;line-height:1.75;color:var(--text);margin:0;}' +
    '.pd-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 26px;border-radius:999px;background:var(--primary);color:#fff;font-family:"Gunjoron",serif;font-weight:600;font-size:16px;text-decoration:none;cursor:pointer;border:0;}' +
    '.pd-btn:hover{filter:brightness(1.1);}' +
    '.pd-img{display:block;width:100%;max-width:100%;height:auto;border-radius:12px;object-fit:cover;background:var(--secondary-light);}' +
    '.pd-divider{height:2px;border:0;background:var(--border);margin:24px 0;width:100%;}' +
    '.pd-spacer{height:48px;width:100%;}' +
    '.pd-icon{display:inline-block;width:48px;height:48px;color:var(--primary);}' +
    '.pd-icon svg{width:100%;height:100%;display:block;}' +
    '.pd-badge{display:inline-block;padding:5px 14px;border-radius:999px;background:var(--secondary);color:#fff;font-size:13px;font-weight:600;letter-spacing:.3px;}' +
    '.pd-hero{padding:72px 32px;border-radius:20px;background:linear-gradient(135deg,var(--primary) 0%,var(--primary-dark) 100%);color:#fff;text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;}' +
    '.pd-hero .pd-h,.pd-hero .pd-p{color:#fff;}.pd-hero .pd-h{font-size:42px;}.pd-hero .pd-btn{background:#fff;color:var(--primary);}' +
    '.pd-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;}' +
    '.pd-card{padding:24px;border-radius:14px;background:var(--surface);border:1px solid var(--border);display:flex;flex-direction:column;gap:10px;}' +
    '.pd-card .pd-h{font-size:22px;}' +
    '.pd-quote{padding:28px 32px;border-left:5px solid var(--secondary);background:var(--surface);border-radius:0 14px 14px 0;font-family:"Gunjoron",serif;font-size:22px;line-height:1.6;color:var(--text);}' +
    '.pd-quote cite{display:block;margin-top:12px;font-size:15px;color:var(--text-muted);font-style:normal;}' +
    '.pd-cta{padding:36px;border-radius:18px;background:var(--secondary-light);display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between;}' +
    '.pd-cta .pd-h{font-size:26px;color:#2A2A28;}' +
    '.pd-wrap{max-width:1200px;margin:0 auto;padding:24px 16px;width:100%;}';

  /* ---------- কম্পাইল: ডিজাইন → CSS লেখা ---------- */
  function scopesFor(design, pk) {
    var o = [];
    if (design && design.global) o.push(design.global);
    if (design && design.pages && design.pages[pk]) o.push(design.pages[pk]);
    return o;
  }
  function compile(design, pk) {
    var base = '', t = '', m = '', hide = '', hasAdded = false;
    if (!design) return { css: '', added: false };
    /* থিমের রং */
    var th = design.theme || {};
    function vars(obj) { var o = ''; for (var k in obj) { if (/^--[a-z0-9-]+$/i.test(k)) { var v = cv(obj[k]); if (v) o += k + ':' + v + ' !important;'; } } return o; }
    var lv = vars(th.light), dv = vars(th.dark);
    if (lv) base += 'html:not([data-theme="dark"]){' + lv + '}';
    if (dv) base += 'html[data-theme="dark"]{' + dv + '}';
    scopesFor(design, pk).forEach(function (sc) {
      if (sc.added && sc.added.length) hasAdded = true;
      var ed = sc.edits || {};
      Object.keys(ed).forEach(function (sel) {
        if (!okSel(sel)) return;
        var e = ed[sel] || {}, c = e.css || {};
        var b = decls(c.b), tt = decls(c.t), mm = decls(c.m);
        if (e.del) b += 'display:none !important;';
        if (b) base += sel + '{' + b + '}';
        if (tt) t += sel + '{' + tt + '}';
        if (mm) m += sel + '{' + mm + '}';
        if (e.hide) ['d', 't', 'm'].forEach(function (k) {
          if (e.hide[k]) hide += '@media ' + HIDEQ[k] + '{' + sel + '{display:none !important;}}';
        });
      });
    });
    var css = (hasAdded ? BLOCK_CSS : '') + base + (t ? '@media ' + BPQ.t + '{' + t + '}' : '') + (m ? '@media ' + BPQ.m + '{' + m + '}' : '') + hide;
    return { css: css, added: hasAdded };
  }

  /* ---------- DOM-এ বসানো: নতুন এলিমেন্ট, লেখা, লিংক, ছবি ---------- */
  var ALLOWED_ATTR = { href: 1, src: 1, alt: 1, title: 1, target: 1, 'aria-label': 1, placeholder: 1 };
  function q1(doc, sel) { try { return doc.querySelector(sel); } catch (e) { return null; } }
  function qa(doc, sel) { try { return doc.querySelectorAll(sel); } catch (e) { return []; } }

  function makeAdded(doc, a) {
    var el;
    if (a.clone) {
      var src = q1(doc, a.clone);
      if (!src) return null;
      el = src.cloneNode(true);
      [].forEach.call(el.querySelectorAll('[id]'), function (x) { x.removeAttribute('id'); });
      el.removeAttribute('id');
      [].forEach.call(el.querySelectorAll('[data-pd-id]'), function (x) { x.removeAttribute('data-pd-id'); });
    } else {
      var tag = TAGOK[a.tag] ? a.tag : 'div';
      el = doc.createElement(tag);
      if (a.html) { var f = sanitizeFrag(a.html, doc); while (f.firstChild) el.appendChild(f.firstChild); }
    }
    el.setAttribute('data-pd-id', a.id);
    if (a.cls) a.cls.split(/\s+/).forEach(function (c) { if (/^[\w-]+$/.test(c)) el.classList.add(c); });
    return el;
  }

  function placeAdded(doc, a, el) {
    var parent = q1(doc, a.parent) || q1(doc, '#pd-page-main') || q1(doc, 'main') || q1(doc, '#main-content') || doc.body;
    var ref = a.ref ? q1(doc, a.ref) : null;
    if (a.where === 'before' && ref && ref.parentNode) { if (el.parentNode !== ref.parentNode || el.nextSibling !== ref) ref.parentNode.insertBefore(el, ref); return; }
    if (a.where === 'after' && ref && ref.parentNode) { if (el.parentNode !== ref.parentNode || el.previousSibling !== ref) ref.parentNode.insertBefore(el, ref.nextSibling); return; }
    if (el.parentNode !== parent) parent.appendChild(el);
  }

  var touched = new Map(); /* এলিমেন্ট -> আসল মান (পরিবর্তন ফেরত নেওয়ার জন্য) */

  function restore(el, o) {
    if (o.text != null) { if (el.textContent !== o.text) el.textContent = o.text; }
    if (o.html != null) { if (el.innerHTML !== o.html) el.innerHTML = o.html; }
    if (o.attrs) for (var k in o.attrs) { if (o.attrs[k] == null) el.removeAttribute(k); else el.setAttribute(k, o.attrs[k]); }
  }

  function applyDom(doc, design, pk) {
    if (!design) design = {};
    var scopes = scopesFor(design, pk);
    /* ১) নতুন এলিমেন্ট (যেগুলো আর নেই সেগুলো সরানো হয়) */
    var ids = {};
    scopes.forEach(function (sc) {
      (sc.added || []).forEach(function (a) {
        if (!a || !/^[\w-]+$/.test(a.id || '')) return;
        ids[a.id] = 1;
        var el = q1(doc, '[data-pd-id="' + a.id + '"]');
        if (!el) { el = makeAdded(doc, a); if (el) el.setAttribute('data-pd-gen', '1'); }
        if (el) placeAdded(doc, a, el);
      });
    });
    [].forEach.call(qa(doc, '[data-pd-gen]'), function (el) {
      if (!ids[el.getAttribute('data-pd-id')] && el.parentNode) el.parentNode.removeChild(el);
    });
    /* ২) লেখা / লিংক / ছবি — আগে কী চাওয়া হচ্ছে তা জমা করা */
    var want = new Map();
    scopes.forEach(function (sc) {
      var ed = sc.edits || {};
      Object.keys(ed).forEach(function (sel) {
        var e = ed[sel]; if (!e || !okSel(sel)) return;
        if (e.text == null && e.html == null && !e.attrs) return;
        [].forEach.call(qa(doc, sel), function (el) {
          var w = want.get(el) || {};
          if (e.text != null) { w.text = e.text; delete w.html; }
          else if (e.html != null) { w.html = e.html; delete w.text; }
          if (e.attrs) { w.attrs = w.attrs || {}; for (var k in e.attrs) w.attrs[k] = e.attrs[k]; }
          want.set(el, w);
        });
      });
    });
    /* যেগুলোর পরিবর্তন তুলে নেওয়া হয়েছে সেগুলো আগের অবস্থায় ফেরানো */
    touched.forEach(function (orig, el) {
      if (el.hasAttribute && el.hasAttribute('data-pd-editing')) return;
      if (!want.has(el) || !doc.contains(el)) { if (doc.contains(el)) restore(el, orig); touched.delete(el); }
    });
    want.forEach(function (w, el) {
      if (el.hasAttribute && el.hasAttribute('data-pd-editing')) return; /* স্টুডিওতে লেখা এডিট চলছে */
      var orig = touched.get(el);
      if (!orig) { orig = {}; touched.set(el, orig); }
      if (w.text != null) {
        if (orig.text == null && orig.html == null) orig.text = el.textContent;
        if (el.textContent !== w.text) el.textContent = w.text;
      } else if (w.html != null) {
        if (orig.text == null && orig.html == null) orig.html = el.innerHTML;
        var h = sanitizeHtml(w.html, doc);
        if (el.innerHTML !== h) el.innerHTML = h;
      } else if (orig.text != null || orig.html != null) { restore(el, orig); delete orig.text; delete orig.html; }
      if (w.attrs) for (var k in w.attrs) {
        if (!ALLOWED_ATTR[k]) continue;
        var v = w.attrs[k];
        if (v == null || v === '') continue;
        if (k === 'href' && !safeHref(v)) continue;
        if (k === 'src' && !safeUrl(v)) continue;
        orig.attrs = orig.attrs || {};
        if (!(k in orig.attrs)) orig.attrs[k] = el.getAttribute(k);
        if (el.getAttribute(k) !== v) el.setAttribute(k, v);
        if (k === 'src' && el.hasAttribute('srcset')) el.removeAttribute('srcset');
        if (k === 'target' && v === '_blank') el.setAttribute('rel', 'noopener noreferrer');
      }
    });
    /* ৩) পেজের শিরোনাম / বর্ণনা */
    scopes.forEach(function (sc) {
      var mt = sc.meta; if (!mt) return;
      if (mt.title && doc.title !== mt.title) doc.title = mt.title;
      if (mt.desc) {
        var d = q1(doc, 'meta[name="description"]');
        if (!d) { d = doc.createElement('meta'); d.setAttribute('name', 'description'); doc.head.appendChild(d); }
        if (d.getAttribute('content') !== mt.desc) d.setAttribute('content', mt.desc);
      }
    });
    /* কাস্টম পেজ: শিরোনাম */
    if (pk.indexOf('page:') === 0 && design.custom && design.custom[pk.slice(5)]) {
      var cp = design.custom[pk.slice(5)];
      if (cp.title && !(scopes.some(function (s) { return s.meta && s.meta.title; }))) doc.title = cp.title + ' | পত্রদ্বীপ';
    }
  }

  /* ---------- ইঞ্জিন ---------- */
  var styleEl = null, cur = null, observer = null, timer = 0, busy = false;

  function ensureStyle() {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'pd-design-style';
      (document.head || document.documentElement).appendChild(styleEl);
    }
    return styleEl;
  }
  function renderCss() {
    var c = compile(cur, pageKey());
    if (!c.css && !styleEl) return;
    var s = ensureStyle();
    if (s.textContent !== c.css) s.textContent = c.css;
  }
  function renderDom() {
    if (!document.body) return;
    if (!cur && !touched.size && !document.querySelector('[data-pd-gen]')) return;
    busy = true;
    try { applyDom(document, cur, pageKey()); } catch (e) { if (window.console) console.warn('site-design:', e); }
    if (observer) observer.takeRecords();
    busy = false;
  }
  function schedule() {
    if (busy || timer) return;
    timer = setTimeout(function () { timer = 0; renderDom(); }, 40);
  }
  function watch() {
    if (observer || !document.body || !window.MutationObserver) return;
    observer = new MutationObserver(function () { if (!busy) schedule(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function empty(d) {
    if (!d || typeof d !== 'object') return true;
    var has = false;
    if (d.theme && ((d.theme.light && Object.keys(d.theme.light).length) || (d.theme.dark && Object.keys(d.theme.dark).length))) has = true;
    ['global'].forEach(function () { if (d.global && ((d.global.edits && Object.keys(d.global.edits).length) || (d.global.added && d.global.added.length) || d.global.meta)) has = true; });
    if (d.pages) for (var k in d.pages) { var p = d.pages[k]; if (p && ((p.edits && Object.keys(p.edits).length) || (p.added && p.added.length) || p.meta)) has = true; }
    if (d.custom && Object.keys(d.custom).length) has = true;
    return !has;
  }
  function set(design) {
    cur = design || null;
    renderCss();
    var go = function () { renderDom(); watch(); };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  }

  window.PDDesign = {
    studio: STUDIO, key: KEY, cacheKey: CACHE,
    set: set, render: function () { renderCss(); renderDom(); },
    compile: compile, pageKey: pageKey, sanitizeHtml: sanitizeHtml, sanitizeFrag: sanitizeFrag,
    safeUrl: safeUrl, safeHref: safeHref, cv: cv, okSel: okSel, isEmpty: empty,
    get current() { return cur; }
  };

  /* ---------- স্টুডিও মোড: ইন্ট্রো বাদ, কনটেন্ট সঙ্গে সঙ্গে দৃশ্যমান ---------- */
  if (STUDIO) {
    document.documentElement.classList.add('pd-studio');
    var ss = document.createElement('style');
    ss.textContent = '#intro-overlay{display:none!important}#main-content{opacity:1!important;transform:none!important}html{scroll-behavior:auto!important}*,*::before,*::after{caret-color:auto}';
    (document.head || document.documentElement).appendChild(ss);
    var mo = new MutationObserver(function () {
      if (document.body) { document.body.setAttribute('data-intro', 'instant'); mo.disconnect(); }
    });
    if (document.body) document.body.setAttribute('data-intro', 'instant');
    else mo.observe(document.documentElement, { childList: true });
    return;
  }

  /* ---------- পাবলিক পেজ: ক্যাশ থেকে সঙ্গে সঙ্গে, তারপর নতুন ডেটা এনে মিলিয়ে নেওয়া ---------- */
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (e) {}
  if (cached && !empty(cached)) set(cached);

  function done(d) {
    var a = JSON.stringify(d || null), b = JSON.stringify(cached || null);
    if (a === b) return;
    cached = d;
    try { if (d && !empty(d)) localStorage.setItem(CACHE, a); else localStorage.removeItem(CACHE); } catch (e) {}
    set(d && !empty(d) ? d : null);
  }
  function fromStatic(cb) {
    var u;
    try { u = new URL('assets/data/site-design.json', document.baseURI).href; } catch (e) { return cb(null); }
    fetch(u, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(cb, function () { cb(null); });
  }
  function load() {
    var C = window.PD_CONFIG;
    if (!C || !window.fetch) return;
    fetch(C.supabaseUrl + '/rest/v1/site_settings?key=eq.' + KEY + '&select=value', {
      headers: { apikey: C.anonKey, Authorization: 'Bearer ' + C.anonKey }
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (rows) {
        if (rows && rows[0] && rows[0].value) return done(rows[0].value);
        fromStatic(done);
      })
      .catch(function () { fromStatic(function (d) { if (d) done(d); }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
