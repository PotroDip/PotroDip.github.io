/* studio-core.js — ডিজাইন স্টুডিওর মূল: ডিজাইনের ডেটা, আন্ডু/রিডু, সিলেক্টর বানানো, ছোট সহায়ক */
(function () {
  'use strict';

  var DEV = {
    pc: { id: 'pc', name: 'কম্পিউটার', w: 1280, h: 800 },
    tab: { id: 'tab', name: 'ট্যাবলেট', w: 820, h: 1100 },
    mob: { id: 'mob', name: 'মোবাইল', w: 390, h: 800 }
  };

  var PAGES = [
    { key: 'index', url: 'index.html', name: 'হোম' },
    { key: 'article', url: 'article.html', name: 'লেখা পড়ার পেজ', dyn: 'article' },
    { key: 'archive', url: 'archive.html', name: 'আর্কাইভ' },
    { key: 'issue', url: 'issue.html', name: 'একটা সংখ্যার পেজ', dyn: 'issue' },
    { key: 'authors', url: 'authors.html', name: 'লেখক তালিকা' },
    { key: 'author', url: 'author.html', name: 'লেখক প্রোফাইল', dyn: 'author' },
    { key: 'store', url: 'store.html', name: 'স্টোর' },
    { key: 'auth', url: 'auth.html', name: 'লগইন / ইউজার ড্যাশবোর্ড' },
    { key: 'privacy', url: 'privacy.html', name: 'গোপনীয়তা নীতি' },
    { key: 'terms', url: 'terms.html', name: 'ব্যবহারের শর্তাবলী' },
    { key: 'data-deletion', url: 'data-deletion.html', name: 'ডেটা মুছে ফেলা' },
    { key: '404', url: '404.html', name: '৪০৪ পেজ' }
  ];

  var TAG_BN = {
    h1: 'শিরোনাম ১', h2: 'শিরোনাম ২', h3: 'শিরোনাম ৩', h4: 'শিরোনাম ৪', h5: 'শিরোনাম ৫', h6: 'শিরোনাম ৬',
    p: 'অনুচ্ছেদ', a: 'লিংক', button: 'বাটন', img: 'ছবি', svg: 'আইকন', ul: 'তালিকা', ol: 'তালিকা', li: 'তালিকার আইটেম',
    header: 'হেডার', footer: 'ফুটার', nav: 'নেভিগেশন', section: 'সেকশন', div: 'বক্স', span: 'লেখা', form: 'ফর্ম',
    input: 'ইনপুট', main: 'মূল অংশ', article: 'আর্টিকেল', label: 'লেবেল', aside: 'সাইড অংশ', body: 'পুরো পেজ',
    strong: 'গাঢ় লেখা', em: 'বাঁকা লেখা', hr: 'রেখা', blockquote: 'উদ্ধৃতি', figure: 'ফিগার', textarea: 'লেখার ঘর',
    select: 'ড্রপডাউন', table: 'টেবিল', small: 'ছোট লেখা', cite: 'সূত্র', time: 'সময়'
  };

  var STATE = /^(active|open|opened|show|shown|hide|hidden|revealed|scrolled|selected|current|focus|focused|hover|disabled|loading|loaded|is-[\w-]+|has-[\w-]+|pd-sel|following|logged|on|off|visible|in|in-view|inview|reveal|theme-ready|no-scroll|expanded|collapsed|checked|animate|animated|done|ready|sticky|stuck|error|success|filled|empty)$/;

  var P = window.PDS = {
    DEV: DEV, PAGES: PAGES, TAG_BN: TAG_BN,
    design: null, pk: 'index', dev: DEV.pc, width: 1280, themeMode: 'light',
    sel: [], selInfo: [], mode: 'edit',
    hist: [], hi: -1, dirty: false, published: '', pubRev: 0,
    frames: {}, ev: {}
  };

  /* ---------- ইভেন্ট ---------- */
  P.on = function (n, f) { (P.ev[n] = P.ev[n] || []).push(f); };
  P.emit = function (n, a, b) { (P.ev[n] || []).forEach(function (f) { try { f(a, b); } catch (e) { console.error(n, e); } }); };

  /* ---------- ডিজাইনের ডেটা ---------- */
  P.blank = function () { return { v: 1, theme: { light: {}, dark: {} }, global: { edits: {}, added: [] }, pages: {}, custom: {} }; };
  P.normalize = function (d) {
    d = d && typeof d === 'object' ? d : P.blank();
    d.v = 1;
    d.theme = d.theme || {}; d.theme.light = d.theme.light || {}; d.theme.dark = d.theme.dark || {};
    d.global = d.global || {}; d.global.edits = d.global.edits || {}; d.global.added = d.global.added || [];
    d.pages = d.pages || {}; d.custom = d.custom || {};
    Object.keys(d.pages).forEach(function (k) { var s = d.pages[k]; s.edits = s.edits || {}; s.added = s.added || []; });
    return d;
  };
  P.scope = function (name, create) {
    if (name === 'global') return P.design.global;
    var s = P.design.pages[P.pk];
    if (!s && create !== false) s = P.design.pages[P.pk] = { edits: {}, added: [] };
    return s || { edits: {}, added: [] };
  };
  /* এডিট এন্ট্রি: scopeName 'page' বা 'global' */
  P.getEdit = function (sel, scopeName) {
    var sc = scopeName === 'global' ? P.design.global : P.design.pages[P.pk];
    return sc && sc.edits[sel] || null;
  };
  P.ensureEdit = function (sel, scopeName) {
    var sc = P.scope(scopeName === 'global' ? 'global' : 'page');
    var e = sc.edits[sel];
    if (!e) e = sc.edits[sel] = { css: { b: {}, t: {}, m: {} } };
    e.css = e.css || { b: {}, t: {}, m: {} };
    e.css.b = e.css.b || {}; e.css.t = e.css.t || {}; e.css.m = e.css.m || {};
    return e;
  };
  P.pruneEdit = function (sel, scopeName) {
    var sc = scopeName === 'global' ? P.design.global : P.design.pages[P.pk];
    var e = sc && sc.edits[sel]; if (!e) return;
    ['b', 't', 'm'].forEach(function (k) { if (e.css && e.css[k] && !Object.keys(e.css[k]).length) delete e.css[k]; });
    if (e.css && !Object.keys(e.css).length) delete e.css;
    if (e.hide && !e.hide.d && !e.hide.t && !e.hide.m) delete e.hide;
    if (!e.css && !e.hide && !e.del && e.text == null && e.html == null && !e.attrs) delete sc.edits[sel];
  };
  P.bp = function () { return P.width > 1023 ? 'b' : (P.width > 767 ? 't' : 'm'); };
  P.bpName = function () { return { b: 'কম্পিউটার', t: 'ট্যাবলেট', m: 'মোবাইল' }[P.bp()]; };

  /* ---------- পুনরায় আঁকা ---------- */
  var rt = 0;
  P.render = function () {
    Object.keys(P.frames).forEach(function (k) {
      var f = P.frames[k];
      try { if (f.win() && f.win().PDDesign) f.win().PDDesign.set(P.design); } catch (e) {}
    });
    P.emit('rendered');
  };
  P.renderSoon = function () { if (rt) return; rt = setTimeout(function () { rt = 0; P.render(); }, 60); };

  /* ---------- ইতিহাস (আন্ডু / রিডু) ও অটো-ড্রাফট ---------- */
  var ht = 0;
  P.snapshot = function () { return JSON.stringify(P.design); };
  P.resetHistory = function () { P.hist = [P.snapshot()]; P.hi = 0; P.emit('history'); };
  P.changed = function (live) {
    P.dirty = true; P.render(); P.emit('changed');
    clearTimeout(ht);
    ht = setTimeout(P.pushHistory, live ? 450 : 80);
  };
  P.pushHistory = function () {
    clearTimeout(ht); ht = 0;
    var s = P.snapshot();
    if (s === P.hist[P.hi]) return;
    P.hist = P.hist.slice(0, P.hi + 1); P.hist.push(s);
    if (P.hist.length > 120) P.hist.shift();
    P.hi = P.hist.length - 1;
    P.saveDraft(); P.emit('history'); P.emit('dirty');
  };
  P.undo = function () { P.pushHistory(); if (P.hi > 0) { P.hi--; P.restore(); } };
  P.redo = function () { if (P.hi < P.hist.length - 1) { P.hi++; P.restore(); } };
  P.restore = function () {
    var keep = P.sel.map(function (e) { return P.uniq(e); });
    P.design = P.normalize(JSON.parse(P.hist[P.hi]));
    P.dirty = P.snapshot() !== P.published;
    P.render(); P.saveDraft(); P.emit('history'); P.emit('dirty');
    var doc = P.mainDoc();
    P.select(keep.map(function (s) { try { return doc.querySelector(s); } catch (e) { return null; } }).filter(Boolean), true);
    P.emit('restored');
  };
  P.saveDraft = function () {
    try {
      localStorage.setItem('pd-studio-draft', JSON.stringify({ t: Date.now(), base: P.pubRev, d: P.design }));
    } catch (e) {}
    P.dirty = P.snapshot() !== P.published;
    P.emit('dirty');
  };

  /* ---------- ফ্রেম / ডকুমেন্ট ---------- */
  P.mainWin = function () { return P.frames.main && P.frames.main.win(); };
  P.mainDoc = function () { var w = P.mainWin(); return w && w.document; };

  /* ---------- সিলেক্টর বানানো ---------- */
  function cssEsc(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^\w-]/g, '\\$&'); }
  function cls(el) {
    return [].filter.call(el.classList || [], function (c) { return !STATE.test(c) && /^[A-Za-z_][\w-]*$/.test(c); }).slice(0, 2);
  }
  function seg(el) { return el.localName + cls(el).map(function (c) { return '.' + cssEsc(c); }).join(''); }
  function idOk(el) { return el.id && /^[A-Za-z][\w-]{0,40}$/.test(el.id) && !/\d{5,}/.test(el.id); }
  function segN(el) {
    var s = seg(el), p = el.parentElement;
    if (!p) return s;
    var same = [].filter.call(p.children, function (x) { return seg(x) === s; });
    if (same.length > 1) s += ':nth-child(' + (([].indexOf.call(p.children, el)) + 1) + ')';
    return s;
  }
  function pdAnchor(el) { return el.getAttribute && el.getAttribute('data-pd-id'); }

  P.uniq = function (el) {
    var doc = el.ownerDocument;
    if (el === doc.body) return 'body';
    if (el === doc.documentElement) return 'html';
    var pid = pdAnchor(el);
    if (pid) return '[data-pd-id="' + pid + '"]';
    var segs = [], n = el, anchor = '';
    while (n && n !== doc.body && n.nodeType === 1) {
      if (n !== el && pdAnchor(n)) { anchor = '[data-pd-id="' + pdAnchor(n) + '"]'; break; }
      if (idOk(n)) { segs.push('#' + cssEsc(n.id)); break; }
      segs.push(segN(n));
      n = n.parentElement;
    }
    var lastIsAnchor = segs.length && segs[segs.length - 1].charAt(0) === '#';
    if (anchor) { segs.push(anchor); lastIsAnchor = true; }
    for (var k = 1; k <= segs.length; k++) {
      var sel = segs.slice(0, k).reverse().join(' > ');
      try { var m = doc.querySelectorAll(sel); if (m.length === 1 && m[0] === el) return sel; } catch (e) {}
    }
    var full = (lastIsAnchor ? '' : 'body > ') + segs.slice().reverse().join(' > ');
    return full;
  };
  /* "একই ধরনের সব" — ক্লাস দিয়ে সাধারণ সিলেক্টর */
  P.general = function (el) {
    var c = cls(el), s;
    if (c.length) s = el.localName + c.map(function (x) { return '.' + cssEsc(x); }).join('');
    else if (el.parentElement && el.parentElement !== el.ownerDocument.body) s = P.uniq(el.parentElement) + ' > ' + el.localName;
    else s = el.localName;
    return s;
  };

  P.label = function (el, withText) {
    var t = el.localName, s = TAG_BN[t] || t;
    if (el.getAttribute && el.getAttribute('data-pd-id')) s = 'নতুন ' + s;
    var c = cls(el)[0];
    var out = s + (c ? ' · .' + c : '');
    if (withText) {
      var tx = (el.children.length === 0 || P.isTextEl(el)) ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
      if (tx) out += ' — ' + tx.slice(0, 22) + (tx.length > 22 ? '…' : '');
    }
    return out;
  };

  var INLINE = { STRONG: 1, EM: 1, B: 1, I: 1, U: 1, BR: 1, SPAN: 1, MARK: 1, SMALL: 1, A: 1 };
  P.isTextEl = function (el) {
    var t = el.localName;
    if (/^(img|svg|input|textarea|select|hr|video|audio|canvas|iframe|body|html)$/.test(t)) return false;
    if (!(el.textContent || '').trim()) return false;
    for (var i = 0; i < el.children.length; i++) {
      var c = el.children[i];
      if (!INLINE[c.tagName]) return false;
      if (c.tagName === 'A' || c.tagName === 'SPAN') { if (c.children.length && !(c.querySelectorAll('div,p,section,ul,img,svg').length === 0)) return false; }
    }
    return true;
  };

  /* ---------- রং / সংখ্যা সহায়ক ---------- */
  P.hex = function (c) {
    if (!c) return '#000000';
    c = String(c).trim();
    if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(c)) return ('#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]).toLowerCase();
    var m = c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if (m) return '#' + [m[1], m[2], m[3]].map(function (x) { return ('0' + (+x).toString(16)).slice(-2); }).join('');
    return '#000000';
  };
  P.alpha = function (c) {
    var m = String(c || '').match(/rgba?\(\s*[\d.]+[,\s]+[\d.]+[,\s]+[\d.]+[,\s/]+([\d.]+)/i);
    return m ? +m[1] : 1;
  };
  P.rgba = function (hex, a) {
    hex = P.hex(hex); a = a == null ? 1 : a;
    if (a >= 1) return hex;
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + (Math.round(a * 100) / 100) + ')';
  };
  P.num = function (v, d) { var n = parseFloat(v); return isNaN(n) ? (d == null ? 0 : d) : n; };
  P.round = function (n, k) { var f = Math.pow(10, k || 0); return Math.round(n * f) / f; };
  P.el = function (tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  };
  P.toast = function (m, bad) {
    var t = document.getElementById('st-toast');
    t.textContent = m; t.className = 'show' + (bad ? ' bad' : '');
    clearTimeout(P._tt); P._tt = setTimeout(function () { t.className = ''; }, bad ? 4500 : 2400);
  };
  P.uid = function (p) { return (p || 'n') + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 5); };
})();
