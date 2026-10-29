/* site-designer.js — এডমিন প্যানেলের ভিতরের "সাইট ডিজাইনার" (পূর্ণ-পর্দা স্টুডিও)।
   প্রিভিউতে ক্লিক করে যেকোনো এলিমেন্ট বদলানো, রং/গ্রেডিয়েন্ট/সাইজ, নতুন এলিমেন্ট যোগ, লুকানো,
   মোবাইল/পিসি প্রিভিউ, ড্রাফট সেভ ও পাবলিশ। ডেটা site_settings টেবিলে (design_draft / design_live / design_prev)। */
(function () {
  'use strict';
  if (!window.PD || !document.getElementById('page-designer')) return;

  /* ============ ধ্রুবক ============ */
  var PAGES = [
    { f: 'index.html', n: 'হোম পেজ' },
    { f: 'archive.html', n: 'আর্কাইভ' },
    { f: 'issue.html', n: 'একটি সংখ্যার পাতা', q: { t: 'issues', c: 'id', k: 'id' } },
    { f: 'article.html', n: 'লেখা পড়ার পাতা', q: { t: 'articles', c: 'id', k: 'id' } },
    { f: 'authors.html', n: 'লেখক তালিকা' },
    { f: 'author.html', n: 'লেখক প্রোফাইল', q: { t: 'authors', c: 'slug', k: 'slug' } },
    { f: 'store.html', n: 'সংখ্যা কিনুন (স্টোর)' },
    { f: 'auth.html', n: 'লগইন / সাইনআপ' },
    { f: 'privacy.html', n: 'গোপনীয়তা নীতি' },
    { f: 'terms.html', n: 'শর্তাবলি' },
    { f: 'data-deletion.html', n: 'ডেটা মুছে ফেলার নীতি' },
    { f: '404.html', n: '৪০৪ পাতা' }
  ];
  var DEV = { desktop: { w: 1280, h: 0, n: 'পিসি' }, tablet: { w: 820, h: 1080, n: 'ট্যাবলেট' }, mobile: { w: 390, h: 844, n: 'মোবাইল' } };
  var VARS = [
    ['--primary', 'মূল রং', 'বাটন, লিংক, হাইলাইট'],
    ['--primary-dark', 'গাঢ় মূল রং', 'ফুটার ও গাঢ় অংশ'],
    ['--secondary', 'দ্বিতীয় রং', 'ছোট সাজসজ্জা'],
    ['--secondary-light', 'হালকা দ্বিতীয় রং', ''],
    ['--bg', 'পেজের ব্যাকগ্রাউন্ড', 'পুরো সাইটের পেছনের রং'],
    ['--surface', 'কার্ড / বক্সের রং', 'কার্ড, ফর্ম, মেনু'],
    ['--text', 'লেখার রং', 'শিরোনাম ও মূল লেখা'],
    ['--text-muted', 'হালকা লেখার রং', 'ছোট ও গৌণ লেখা'],
    ['--border', 'দাগ / বর্ডারের রং', ''],
    ['--success', 'হাইলাইট (সোনালি)', 'তারা, ব্যাজ'],
    ['--error', 'সতর্কতার রং', 'ভুল বার্তা']
  ];
  var BASE = {
    light: { '--primary': '#1D5358', '--primary-dark': '#123A3D', '--secondary': '#9B7257', '--secondary-light': '#C9A98A', '--bg': '#F7F3EC', '--surface': '#FFFFFF', '--text': '#2A2A28', '--text-muted': '#6B6B63', '--border': '#E4DDD0', '--success': '#C99A3E', '--error': '#B3402E' },
    dark: { '--primary': '#4FA8AD', '--primary-dark': '#6FC3C8', '--secondary': '#C9A98A', '--secondary-light': '#E0C6A8', '--bg': '#14181A', '--surface': '#1E2426', '--text': '#F2EFE8', '--text-muted': '#A8A69E', '--border': '#2C3335', '--success': '#E0B354', '--error': '#E06B57' }
  };
  var PRESETS = [
    { n: 'আসল (ডিফল্ট)', c: ['#1D5358', '#9B7257', '#F7F3EC'], light: null, dark: null },
    { n: 'ক্লাসিক পত্রিকা', c: ['#7A1F1F', '#2B2B2B', '#F4F1EA'],
      light: { '--primary': '#7A1F1F', '--primary-dark': '#3B0F0F', '--secondary': '#2B2B2B', '--secondary-light': '#8A8A82', '--bg': '#F4F1EA', '--surface': '#FFFFFF', '--text': '#1E1E1C', '--text-muted': '#5E5E58', '--border': '#D9D3C4', '--success': '#B8860B', '--error': '#B3261E' },
      dark: { '--primary': '#D77A7A', '--primary-dark': '#E9A3A3', '--secondary': '#CFCFC8', '--secondary-light': '#9A9A92', '--bg': '#171515', '--surface': '#221F1F', '--text': '#F2EFE8', '--text-muted': '#AAA6A0', '--border': '#322E2E', '--success': '#E0B354', '--error': '#E06B57' } },
    { n: 'আধুনিক ম্যাগাজিন', c: ['#E4572E', '#1B1B1E', '#FFFFFF'],
      light: { '--primary': '#E4572E', '--primary-dark': '#1B1B1E', '--secondary': '#2E86AB', '--secondary-light': '#9CC9DD', '--bg': '#FFFFFF', '--surface': '#F5F6F8', '--text': '#111114', '--text-muted': '#666A73', '--border': '#E6E8EC', '--success': '#F5A623', '--error': '#D62828' },
      dark: { '--primary': '#FF7A52', '--primary-dark': '#FFB59E', '--secondary': '#5CB3D6', '--secondary-light': '#9CC9DD', '--bg': '#101114', '--surface': '#1A1C21', '--text': '#F4F5F7', '--text-muted': '#9EA3AD', '--border': '#2A2D34', '--success': '#F5B84A', '--error': '#FF6B6B' } },
    { n: 'ব্যবসা (নীল)', c: ['#1F4E8C', '#F2A900', '#F5F8FC'],
      light: { '--primary': '#1F4E8C', '--primary-dark': '#0E2A4F', '--secondary': '#F2A900', '--secondary-light': '#F8D77A', '--bg': '#F5F8FC', '--surface': '#FFFFFF', '--text': '#14213D', '--text-muted': '#5B6577', '--border': '#DCE4EF', '--success': '#F2A900', '--error': '#C0392B' },
      dark: { '--primary': '#6FA3E6', '--primary-dark': '#A9C8F2', '--secondary': '#F5B83A', '--secondary-light': '#F8D77A', '--bg': '#0D1524', '--surface': '#16213A', '--text': '#EEF3FB', '--text-muted': '#9AA7BD', '--border': '#25324F', '--success': '#F5B83A', '--error': '#FF7B6B' } },
    { n: 'সবুজ প্রকৃতি', c: ['#2F6B3F', '#B5833A', '#F4F7F0'],
      light: { '--primary': '#2F6B3F', '--primary-dark': '#173D22', '--secondary': '#B5833A', '--secondary-light': '#E1C48F', '--bg': '#F4F7F0', '--surface': '#FFFFFF', '--text': '#1F2A21', '--text-muted': '#5F6D61', '--border': '#DCE5D6', '--success': '#C99A3E', '--error': '#B3402E' },
      dark: { '--primary': '#6CC287', '--primary-dark': '#A5DDB6', '--secondary': '#D9A95B', '--secondary-light': '#E8CB96', '--bg': '#101612', '--surface': '#18211B', '--text': '#EAF2EA', '--text-muted': '#9DAE9F', '--border': '#26332A', '--success': '#E0B354', '--error': '#E06B57' } },
    { n: 'গোলাপি-বেগুনি', c: ['#8E3B7A', '#E08AA8', '#FBF4F8'],
      light: { '--primary': '#8E3B7A', '--primary-dark': '#521B45', '--secondary': '#D1698D', '--secondary-light': '#F0B7CB', '--bg': '#FBF4F8', '--surface': '#FFFFFF', '--text': '#2A1B26', '--text-muted': '#74626E', '--border': '#EDDDE6', '--success': '#D99A2B', '--error': '#B3261E' },
      dark: { '--primary': '#D58AC2', '--primary-dark': '#EBB9DC', '--secondary': '#F0A3BF', '--secondary-light': '#F5C6D8', '--bg': '#181017', '--surface': '#241923', '--text': '#F6ECF3', '--text-muted': '#B7A2B1', '--border': '#37283500', '--success': '#E0B354', '--error': '#FF7B8A' } }
  ];
  PRESETS[5].dark['--border'] = '#372835';
  var GRADS = [
    ['#1D5358', '#4FA8AD', 135], ['#7A1F1F', '#E4572E', 120], ['#1F4E8C', '#6FA3E6', 135],
    ['#8E3B7A', '#E08AA8', 135], ['#14181A', '#2C3335', 160], ['#F2A900', '#F8D77A', 90],
    ['#2F6B3F', '#A5DDB6', 135], ['#FFFFFF', '#F7F3EC', 180]
  ];
  var ADD_KINDS = [
    ['heading', 'শিরোনাম', 'বড় লেখা'], ['text', 'লেখা / প্যারাগ্রাফ', 'সাধারণ লেখা'], ['button', 'বাটন', 'ক্লিক করার লিংক'],
    ['image', 'ছবি', 'ছবির লিংক দিয়ে'], ['box', 'বক্স / ব্যানার', 'রঙিন ঘোষণা-বক্স'], ['icon', 'আইকন', 'ছোট চিহ্ন'],
    ['divider', 'বিভাজক রেখা', 'দুই অংশের মাঝে'], ['spacer', 'ফাঁকা জায়গা', 'উচ্চতা বাড়াতে']
  ];
  var ICON_NAMES = { star: 'তারা', heart: 'হৃদয়', book: 'বই', pen: 'কলম', mail: 'চিঠি', phone: 'ফোন', map: 'ঠিকানা', bell: 'ঘণ্টা', cart: 'কার্ট', user: 'মানুষ', globe: 'পৃথিবী', check: 'টিক', camera: 'ক্যামেরা' };
  var DYN = /^(active|open|show|shown|hide|hidden|revealed|theme-ready|loading|loaded|selected|current|visible|focus|hover|is-|has-|js-|pd-|no-scroll)/;

  /* ============ অবস্থা ============ */
  var S = {
    cfg: emptyCfg(), live: null, prev: null, draftSaved: false,
    page: 'index.html', query: '', device: 'desktop', theme: 'light', mode: 'edit', tab: 'site',
    el: null, sel: '', similar: false, scope: 'page', darkOnly: false,
    undo: [], redo: [], lastGroup: '', lastTime: 0, dirty: false, ready: false, hoverEl: null
  };
  var ifr = null, root = null, nid = 0, tickTimer = null, saveTimer = null;

  function emptyCfg() { return { v: 1, g: { colors: { light: {}, dark: {} }, typo: {} }, rules: [], adds: [], moves: [], updatedAt: '' }; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid(p) { return p + Date.now().toString(36) + (nid++).toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function $(s, r) { return (r || root).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || root).querySelectorAll(s)); }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k;
    if (attrs) for (k in attrs) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function toast(m) { if (window.AdminUI) AdminUI.showToast(m); }
  function esc(s) { return String(s == null ? '' : s); }
  function win() { return ifr && ifr.contentWindow; }
  function doc() { try { return ifr && ifr.contentDocument; } catch (e) { return null; } }

  function toHex(c) {
    c = String(c || '').trim();
    if (!c || c === 'transparent') return '';
    if (c[0] === '#') { if (c.length === 4) return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return c.slice(0, 7); }
    var m = c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
    if (!m) return '';
    if (m[4] !== undefined && +m[4] === 0) return '';
    function x(n) { n = Math.max(0, Math.min(255, +n)).toString(16); return n.length < 2 ? '0' + n : n; }
    return '#' + x(m[1]) + x(m[2]) + x(m[3]);
  }

  /* ============ ডেটাবেস ============ */
  function dbGet(keys) { return PD.db.from('site_settings').select('key,value,updated_at').in('key', keys); }
  function dbSet(key, val) { return PD.db.from('site_settings').upsert({ key: key, value: val, updated_at: new Date().toISOString() }, { onConflict: 'key' }); }
  function errMsg(r) { return r && r.error ? PD.msg(r.error) : ''; }

  /* ============ সিলেক্টর তৈরি ============ */
  function segOf(el, d) {
    if (el.hasAttribute('data-pd-add')) return { s: '[data-pd-add="' + el.getAttribute('data-pd-add') + '"]', abs: true };
    var cw = d.defaultView;
    if (el.id && /^[A-Za-z][\w-]*$/.test(el.id)) {
      try { if (d.querySelectorAll('#' + cw.CSS.escape(el.id)).length === 1) return { s: '#' + cw.CSS.escape(el.id), abs: true }; } catch (e) {}
    }
    var tag = el.tagName.toLowerCase();
    var cls = [].filter.call(el.classList, function (c) { return !DYN.test(c); }).slice(0, 2).map(function (c) { return '.' + cw.CSS.escape(c); }).join('');
    var s = tag + cls, p = el.parentElement;
    if (p) {
      var same = 0;
      [].forEach.call(p.children, function (sib) { if (sib !== el && !sib.hasAttribute('data-pd-add')) { try { if (sib.matches(s)) same++; } catch (e) {} } });
      if (same) s += ':nth-child(' + indexAmongAll(el) + ')';
    }
    return { s: s };
  }
  function indexAmongAll(el) { return [].indexOf.call(el.parentNode.children, el) + 1; }
  function cssPath(el) {
    var d = el.ownerDocument, parts = [], cur = el;
    while (cur && cur.nodeType === 1 && cur !== d.body && cur !== d.documentElement) {
      var g = segOf(cur, d);
      parts.unshift(g.s);
      var path = parts.join(' > ');
      try { if (d.querySelectorAll(path).length === 1) return path; } catch (e) {}
      if (g.abs) break;
      cur = cur.parentElement;
    }
    return 'body > ' + parts.join(' > ');
  }
  function similarSel(el) {
    var cw = el.ownerDocument.defaultView;
    var cls = [].filter.call(el.classList, function (c) { return !DYN.test(c); }).slice(0, 3).map(function (c) { return '.' + cw.CSS.escape(c); }).join('');
    return cls ? el.tagName.toLowerCase() + cls : '';
  }
  var FRIENDLY = { header: 'হেডার', footer: 'ফুটার', nav: 'মেনু', main: 'মূল অংশ', section: 'সেকশন', article: 'আর্টিকেল', aside: 'পাশের অংশ', form: 'ফর্ম', ul: 'তালিকা', ol: 'তালিকা', table: 'টেবিল', figure: 'ছবি-বক্স', div: 'বক্স', h1: 'বড় শিরোনাম', h2: 'শিরোনাম', h3: 'উপ-শিরোনাম', p: 'লেখা', a: 'লিংক', button: 'বাটন', img: 'ছবি', span: 'লেখা', svg: 'আইকন' };
  function labelOf(el) {
    var t = (el.getAttribute('aria-label') || '').trim();
    if (!t) {
      var hd = el.matches('h1,h2,h3,h4,h5,h6') ? el : el.querySelector('h1,h2,h3,h4,h5,h6');
      if (hd) t = (hd.innerText || hd.textContent || '').trim();
    }
    if (!t) t = ((el.innerText || '') + '').replace(/\s+/g, ' ').trim();
    t = t.length > 24 ? t.slice(0, 24) + '…' : t;
    var fr = FRIENDLY[el.tagName.toLowerCase()] || el.tagName.toLowerCase();
    return t ? fr + ' — ' + t : fr + '  (' + tagLabel(el) + ')';
  }
  function tagLabel(el) {
    var cls = [].filter.call(el.classList, function (c) { return !DYN.test(c); })[0];
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : cls ? '.' + cls : '');
  }

  /* ============ নিয়ম (rules) ব্যবস্থাপনা ============ */
  function scopePage() { return S.scope === 'all' ? '*' : S.page; }
  function findRule(sel, page) {
    for (var i = 0; i < S.cfg.rules.length; i++) { var r = S.cfg.rules[i]; if (r.sel === sel && r.page === page) return r; }
    return null;
  }
  function currentRule(create) {
    if (!S.sel) return null;
    var r = findRule(S.sel, scopePage());
    if (!r && create) { r = { id: uid('r'), page: scopePage(), sel: S.sel, label: S.el ? tagLabel(S.el) : '', p: {}, d: {} }; S.cfg.rules.push(r); }
    return r;
  }
  function pruneRule(r) {
    if (!r) return;
    var empty = !r.hide && typeof r.text !== 'string' && typeof r.href !== 'string' && typeof r.src !== 'string' && !Object.keys(r.p || {}).length && !Object.keys(r.d || {}).length;
    if (empty) S.cfg.rules = S.cfg.rules.filter(function (x) { return x !== r; });
  }
  function addOf(el) { return el && el.hasAttribute && el.hasAttribute('data-pd-add') ? findAdd(el.getAttribute('data-pd-add')) : null; }
  function findAdd(id) { for (var i = 0; i < S.cfg.adds.length; i++) if (S.cfg.adds[i].id === id) return S.cfg.adds[i]; return null; }

  /* ============ পরিবর্তন, পূর্বাবস্থা, অটোসেভ ============ */
  function structSig(c) { return JSON.stringify(c.moves || []); }
  function pushUndo(group) {
    var now = Date.now();
    if (group && group === S.lastGroup && now - S.lastTime < 900) { S.lastTime = now; return; }
    S.undo.push(JSON.stringify(S.cfg));
    if (S.undo.length > 80) S.undo.shift();
    S.redo = [];
    S.lastGroup = group || ''; S.lastTime = now;
  }
  function mutate(fn, group) {
    pushUndo(group);
    fn();
    afterChange();
  }
  function afterChange() {
    S.dirty = true; S.draftSaved = false;
    previewApply();
    refreshBar();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { try { localStorage.setItem('pdd-autosave', JSON.stringify(S.cfg)); localStorage.setItem('pdd-unsaved', '1'); } catch (e) {} }, 400);
  }
  function undo() {
    if (!S.undo.length) return;
    var before = structSig(S.cfg);
    S.redo.push(JSON.stringify(S.cfg));
    S.cfg = JSON.parse(S.undo.pop());
    restoreAfter(before);
  }
  function redo() {
    if (!S.redo.length) return;
    var before = structSig(S.cfg);
    S.undo.push(JSON.stringify(S.cfg));
    S.cfg = JSON.parse(S.redo.pop());
    restoreAfter(before);
  }
  function restoreAfter(before) {
    S.lastGroup = '';
    S.dirty = true; S.draftSaved = false;
    if (structSig(S.cfg) !== before) loadFrame(); else previewApply();
    reselect(); renderPanel(); refreshBar();
    try { localStorage.setItem('pdd-autosave', JSON.stringify(S.cfg)); localStorage.setItem('pdd-unsaved', '1'); } catch (e) {}
  }

  /* ============ প্রিভিউ (iframe) ============ */
  function previewApply() {
    var w = win();
    if (w && w.PDDesign) { try { w.PDDesign.apply(clone(S.cfg)); } catch (e) {} }
    var d = doc();
    if (d && d.documentElement) d.documentElement.setAttribute('data-theme', S.theme);
    setTimeout(function () { drawBoxes(); if (S.tab === 'sections') renderSections(); }, 220);
  }
  function frameUrl() {
    var q = S.query ? S.query + '&' : '?';
    return S.page + q + 'pdpreview=1';
  }
  function loadFrame() {
    if (!ifr) return;
    var url = frameUrl();
    var cur = ''; try { cur = ifr.contentWindow.location.pathname.split('/').pop() + ifr.contentWindow.location.search; } catch (e) {}
    ifr.setAttribute('data-want', url);
    ifr.src = url;
  }
  function onFrameLoad() {
    var w = win(), d = doc();
    if (!w || !d) return;
    try {
      var f = (w.location.pathname.split('/').pop() || 'index.html').toLowerCase();
      var qs = w.location.search.replace(/[?&]pdpreview=1/, '').replace(/^&/, '?');
      if (PAGES.some(function (p) { return p.f === f; })) { S.page = f; S.query = qs && qs !== '?' ? qs : ''; }
      var sel = $('#pdd-page'); if (sel) sel.value = S.page;
    } catch (e) {}
    bindFrame(d, w);
    previewApply();
    fit();
    S.el = null; S.sel = '';
    renderPanel();
    [300, 1200, 2800].forEach(function (t) { setTimeout(function () { previewApply(); if (S.tab === 'sections') renderSections(); }, t); });
  }
  function bindFrame(d, w) {
    function block(e) {
      if (S.mode !== 'edit') return;
      if (e.target && e.target.closest && e.target.closest('#pdd-ignore')) return;
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
    ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'submit', 'dblclick', 'contextmenu'].forEach(function (t) { d.addEventListener(t, block, true); });
    d.addEventListener('click', function (e) {
      if (S.mode !== 'edit') return;
      block(e);
      var t = e.target;
      if (t.nodeType !== 1) t = t.parentElement;
      if (t && t.ownerSVGElement) t = t.ownerSVGElement;
      if (!t || t === d.documentElement) return;
      selectEl(t);
    }, true);
    d.addEventListener('mouseover', function (e) {
      if (S.mode !== 'edit') return;
      var t = e.target; if (t.nodeType !== 1) return;
      if (t === d.documentElement || t === d.body) t = null;
      S.hoverEl = t; drawBoxes();
    }, true);
    d.addEventListener('mouseleave', function () { S.hoverEl = null; drawBoxes(); });
    w.addEventListener('scroll', drawBoxes, true);
    w.addEventListener('resize', drawBoxes);
    var st = d.createElement('style');
    st.textContent = 'html{scroll-behavior:auto !important;} *{cursor:' + 'default' + ';} body[data-pdd-edit] a, body[data-pdd-edit] button{cursor:pointer;}';
    st.id = 'pdd-frame-style'; (d.head || d.documentElement).appendChild(st);
    setModeAttr();
  }
  function setModeAttr() {
    var d = doc(); if (!d || !d.body) return;
    if (S.mode === 'edit') d.body.setAttribute('data-pdd-edit', '1'); else d.body.removeAttribute('data-pdd-edit');
    var st = d.getElementById('pdd-frame-style');
    if (st) st.textContent = S.mode === 'edit' ? 'html{scroll-behavior:auto !important;} *{cursor:crosshair !important;}' : 'html{scroll-behavior:auto !important;}';
  }

  /* ============ নির্বাচন ও বক্স আঁকা ============ */
  function selectEl(el, keepTab) {
    if (!el) { S.el = null; S.sel = ''; renderPanel(); drawBoxes(); return; }
    S.el = el;
    var add = addOf(el);
    var sim = false;
    var autoScope = el.closest('header,footer') ? 'all' : 'page';
    var base = cssPath(el);
    // আগে থেকে এই এলিমেন্টের নিয়ম থাকলে তার স্কোপ মেনে চলা
    var existing = findRule(base, '*') ? 'all' : (findRule(base, S.page) ? 'page' : null);
    S.scope = existing || autoScope;
    var ss = similarSel(el);
    if (ss && (findRule(ss, '*') || findRule(ss, S.page)) && !existing) { S.sel = ss; S.similar = true; S.scope = findRule(ss, '*') ? 'all' : 'page'; }
    else { S.sel = base; S.similar = false; }
    if (add) { S.sel = base; S.similar = false; }
    var r = findRule(S.sel, scopePage());
    S.darkOnly = false;
    if (!keepTab) S.tab = 'element';
    syncTabs(); renderPanel(); drawBoxes();
  }
  function reselect() {
    var d = doc(); if (!d || !S.sel) return;
    try { var e = d.querySelector(S.sel); S.el = e || null; } catch (e) { S.el = null; }
    if (!S.el) S.sel = '';
  }
  function boxFor(id, el) {
    var b = $('#' + id); if (!b) return;
    if (!el || !el.getBoundingClientRect || !el.isConnected) { b.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) { b.style.display = 'none'; return; }
    b.style.display = 'block';
    b.style.left = r.left + 'px'; b.style.top = r.top + 'px'; b.style.width = r.width + 'px'; b.style.height = r.height + 'px';
    var tag = b.querySelector('span'); if (tag) tag.textContent = tagLabel(el);
  }
  function drawBoxes() {
    if (!root) return;
    boxFor('pdd-hover', S.mode === 'edit' && S.hoverEl !== S.el ? S.hoverEl : null);
    boxFor('pdd-selbox', S.mode === 'edit' ? S.el : null);
  }
  function fit() {
    var stage = $('#pdd-stage'), wrap = $('#pdd-wrap'), holder = $('#pdd-holder');
    if (!stage || !wrap) return;
    var dv = DEV[S.device];
    var aw = stage.clientWidth - 36, ah = stage.clientHeight - 36;
    var k = Math.min(1, aw / dv.w);
    var hgt;
    if (dv.h) { k = Math.min(k, ah / dv.h); hgt = dv.h; } else hgt = ah / k;
    if (k < 0.2) k = 0.2;
    wrap.style.width = dv.w + 'px'; wrap.style.height = hgt + 'px';
    wrap.style.transform = 'scale(' + k + ')';
    holder.style.width = dv.w * k + 'px'; holder.style.height = hgt * k + 'px';
    $('#pdd-zoomlabel').textContent = dv.n + ' · ' + dv.w + 'px' + (k < 1 ? ' · ' + Math.round(k * 100) + '%' : '');
    drawBoxes();
  }

  /* ============ কাঠামোগত কাজ (সরানো / যোগ / মোছা) ============ */
  function fragile(sel) { return /:nth-child|^body >/.test(sel || ''); }
  function qd(d, sel) { try { return d.querySelector(sel); } catch (e) { return null; } }
  function onThisPage(x) { return !x.page || x.page === '*' || x.page === S.page; }
  function withRebase(op) {
    var d = doc(), refs = [];
    if (d) {
      S.cfg.rules.forEach(function (r) { if (onThisPage(r) && fragile(r.sel)) { var e = qd(d, r.sel); if (e) refs.push({ o: r, k: 'sel', e: e }); } });
      S.cfg.adds.forEach(function (a) { if (onThisPage(a) && fragile(a.anchor)) { var e = qd(d, a.anchor); if (e) refs.push({ o: a, k: 'anchor', e: e }); } });
    }
    var curEl = S.el;
    op();
    refs.forEach(function (x) { if (x.e.isConnected) x.o[x.k] = cssPath(x.e); });
    if (curEl && curEl.isConnected) { var base = cssPath(curEl); if (!S.similar) S.sel = base; }
  }
  function moveEl(dir, el) {
    el = el || S.el;
    var d = doc(); if (!el || !d) return;
    if (el.hasAttribute('data-pd-add')) { toast('নতুন যোগ করা এলিমেন্ট সরাতে — পাশের এলিমেন্টের আগে/পরে নতুন করে যোগ করুন'); return; }
    var sib = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    while (sib && sib.hasAttribute('data-pd-add')) sib = dir < 0 ? sib.previousElementSibling : sib.nextElementSibling;
    if (!sib) { toast('এর চেয়ে বেশি সরানো যাবে না'); return; }
    var scope = el.closest('header,footer') ? '*' : S.page;
    pushUndo('');
    withRebase(function () {
      var wsig = win() && win().PDDesign ? win().PDDesign.sig(el) : '';
      var m = { id: uid('m'), page: scope, sel: cssPath(el), dir: dir, sig: wsig };
      S.cfg.moves.push(m);
      if (dir < 0) el.parentNode.insertBefore(el, sib); else el.parentNode.insertBefore(el, sib.nextSibling);
      el.setAttribute('data-pd-moved', m.id);
      var w0 = win(); if (w0 && w0.PDDesign) w0.PDDesign.markMoved(m.id);
    });
    afterChange();
    drawBoxes();
    if (S.tab === 'sections') renderSections();
    renderPanel();
  }
  function addElement(kind, content, pos) {
    if (!S.el) { toast('আগে প্রিভিউতে একটি জায়গায় ক্লিক করে বেছে নিন'); return; }
    var d = doc();
    var anchorEl = S.el;
    var scope = anchorEl.closest('header,footer') ? '*' : S.page;
    pushUndo('');
    var a = { id: uid('a'), kind: kind, page: scope, anchor: cssPath(anchorEl), asig: (win() && win().PDDesign ? win().PDDesign.sig(anchorEl) : ''), pos: pos, content: content };
    withRebase(function () {
      S.cfg.adds.push(a);
      var w = win(); if (w && w.PDDesign) w.PDDesign.apply(clone(S.cfg));
    });
    afterChange();
    var ne = d && d.querySelector('[data-pd-add="' + a.id + '"]');
    if (ne) selectEl(ne); else renderPanel();
    toast('এলিমেন্ট যোগ হয়েছে — ক্লিক করে সাজিয়ে নিন');
  }
  function removeAdd(add) {
    pushUndo('');
    withRebase(function () {
      S.cfg.adds = S.cfg.adds.filter(function (x) { return x !== add; });
      S.cfg.rules = S.cfg.rules.filter(function (r) { return r.sel.indexOf(add.id) < 0; });
      var w = win(); if (w && w.PDDesign) w.PDDesign.apply(clone(S.cfg));
    });
    S.el = null; S.sel = '';
    afterChange();
    renderPanel();
  }
  function toggleHide(el) {
    var d = doc(); if (!el || !d) return;
    var scope = el.closest('header,footer') ? '*' : S.page;
    var sel = (el === S.el && S.sel) ? S.sel : cssPath(el);
    var sc = (el === S.el) ? scopePage() : scope;
    var r = findRule(sel, sc);
    mutate(function () {
      if (!r) { r = { id: uid('r'), page: sc, sel: sel, label: labelOf(el), p: {}, d: {} }; S.cfg.rules.push(r); }
      if (r.hide) delete r.hide; else { r.hide = true; r.label = labelOf(el); }
      pruneRule(r);
    }, '');
    if (S.tab === 'sections') renderSections();
  }

  /* ============ নিয়ন্ত্রণ-উপকরণ (সাধারণ ফাংশন) ============ */
  function getBag() { var r = currentRule(false); return r ? (S.darkOnly ? r.d : r.p) : null; }
  function getP(prop) { var b = getBag(); return b ? b[prop] : undefined; }
  function setP(prop, val, group) {
    mutate(function () {
      var r = currentRule(true);
      var bag = S.darkOnly ? (r.d = r.d || {}) : (r.p = r.p || {});
      if (val === '' || val == null) delete bag[prop]; else bag[prop] = val;
      pruneRule(r);
    }, group || ('p:' + prop));
  }
  function setUi(k, v) { var r = currentRule(true); r.ui = r.ui || {}; r.ui[k] = v; }
  function getUi(k, def) { var r = currentRule(false); return r && r.ui && r.ui[k] !== undefined ? r.ui[k] : def; }
  function comp(prop) { try { return doc().defaultView.getComputedStyle(S.el)[prop]; } catch (e) { return ''; } }
  var openSecs = {};
  function sec(title, open, kids) {
    var det = h('details', { class: 'pdd-sec' }, [h('summary', { text: title }), h('div', { class: 'pdd-sec-body' }, kids)]);
    var st = openSecs[title] !== undefined ? openSecs[title] : open;
    if (st) det.setAttribute('open', '');
    det.addEventListener('toggle', function () { openSecs[title] = det.open; });
    return det;
  }
  function row(label, ctl, hint) {
    return h('div', { class: 'pdd-row' }, [h('label', { text: label }), h('div', { class: 'pdd-ctl' }, Array.isArray(ctl) ? ctl : [ctl]), hint ? h('small', { text: hint }) : null]);
  }
  function numCtl(label, prop, min, max, step, unit, opt) {
    opt = opt || {};
    var cur = getP(prop);
    var raw = cur != null ? parseFloat(cur) : parseFloat(comp(prop));
    var v = isNaN(raw) ? (opt.def != null ? opt.def : min) : (opt.scale ? raw * opt.scale : raw);
    v = Math.round(v * 100) / 100;
    var rng = h('input', { type: 'range', min: min, max: max, step: step, value: Math.min(max, Math.max(min, v)) });
    var num = h('input', { type: 'number', min: min, max: max, step: step, value: v });
    function push(val) {
      if (val === '' || isNaN(val)) return;
      setP(prop, opt.scale ? String(val / opt.scale) : val + unit);
      row_.classList.add('is-set');
    }
    rng.addEventListener('input', function () { num.value = rng.value; push(+rng.value); });
    num.addEventListener('input', function () { rng.value = num.value; push(parseFloat(num.value)); });
    var clr = h('button', { class: 'pdd-x', type: 'button', title: 'আগের মানে ফিরুন', text: '↺', onclick: function () { setP(prop, ''); renderPanel(); } });
    var row_ = row(label, [rng, num, h('em', { text: opt.scale ? '%' : unit }), clr]);
    if (cur != null) row_.classList.add('is-set');
    return row_;
  }
  function colorCtl(label, prop, noClear) {
    var cur = getP(prop);
    var hex = toHex(cur != null ? cur : comp(prop)) || '#000000';
    var pick = h('input', { type: 'color', value: hex });
    var txt = h('input', { type: 'text', class: 'pdd-hex', value: cur != null ? cur : hex, maxlength: 40 });
    pick.addEventListener('input', function () { txt.value = pick.value; setP(prop, pick.value); r_.classList.add('is-set'); });
    txt.addEventListener('change', function () { var h2 = toHex(txt.value); if (h2) pick.value = h2; setP(prop, txt.value.trim()); r_.classList.add('is-set'); });
    var clr = h('button', { class: 'pdd-x', type: 'button', title: 'আগের রঙে ফিরুন', text: '↺', onclick: function () { setP(prop, ''); renderPanel(); } });
    var r_ = row(label, [pick, txt, clr]);
    if (cur != null) r_.classList.add('is-set');
    return r_;
  }
  function selCtl(label, prop, opts) {
    var cur = getP(prop);
    var s = h('select', {}, [h('option', { value: '', text: '— আগের মতো —' })].concat(opts.map(function (o) { return h('option', { value: o[0], text: o[1] }); })));
    s.value = cur != null ? cur : '';
    s.addEventListener('change', function () { setP(prop, s.value); });
    return row(label, s);
  }
  function segCtl(label, prop, opts) {
    var cur = getP(prop);
    var box = h('div', { class: 'pdd-seg' }, opts.map(function (o) {
      return h('button', { type: 'button', class: cur === o[0] ? 'on' : '', title: o[2] || '', text: o[1], onclick: function () { setP(prop, cur === o[0] ? '' : o[0]); renderPanel(); } });
    }));
    return row(label, box);
  }
  function textCtl(label, get, set, multi, ph) {
    var el = multi ? h('textarea', { rows: 3, placeholder: ph || '' }) : h('input', { type: 'text', placeholder: ph || '' });
    el.value = get() || '';
    el.addEventListener('input', function () { set(el.value); });
    return row(label, el);
  }

  /* ============ পাশের প্যানেল: এলিমেন্ট ইন্সপেক্টর ============ */
  function firstText(el) { for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) return n; return null; }
  function bgCtl() {
    var type = getUi('bgT', 'none');
    var r = currentRule(false);
    if (!r || (!getP('background') && !getP('bgImage'))) type = getUi('bgT', 'none');
    var box = h('div', {});
    var tabs = h('div', { class: 'pdd-seg' }, [['none', 'নেই'], ['solid', 'একক রং'], ['grad', 'গ্রেডিয়েন্ট'], ['img', 'ছবি']].map(function (o) {
      return h('button', { type: 'button', class: type === o[0] ? 'on' : '', text: o[1], onclick: function () {
        mutate(function () {
          var rr = currentRule(true); rr.ui = rr.ui || {}; rr.ui.bgT = o[0];
          var bag = S.darkOnly ? (rr.d = rr.d || {}) : (rr.p = rr.p || {});
          if (o[0] === 'none') { delete bag.background; delete bag.bgImage; delete bag.bgSize; delete bag.bgPos; }
          if (o[0] === 'solid') { bag.background = rr.ui.c1 || toHex(comp('backgroundColor')) || '#FFFFFF'; delete bag.bgImage; }
          if (o[0] === 'grad') { rr.ui.c1 = rr.ui.c1 || '#1D5358'; rr.ui.c2 = rr.ui.c2 || '#4FA8AD'; rr.ui.ang = rr.ui.ang != null ? rr.ui.ang : 135; bag.background = 'linear-gradient(' + rr.ui.ang + 'deg,' + rr.ui.c1 + ',' + rr.ui.c2 + ')'; delete bag.bgImage; }
          if (o[0] === 'img') { delete bag.background; }
          pruneRule(rr);
        }, '');
        renderPanel();
      } });
    }));
    box.appendChild(tabs);
    function writeGrad() {
      var c1 = getUi('c1', '#1D5358'), c2 = getUi('c2', '#4FA8AD'), an = getUi('ang', 135);
      mutate(function () { var rr = currentRule(true); var bag = S.darkOnly ? (rr.d = rr.d || {}) : (rr.p = rr.p || {}); bag.background = 'linear-gradient(' + an + 'deg,' + c1 + ',' + c2 + ')'; }, 'bg');
    }
    if (type === 'solid') {
      var c = getP('background') || toHex(comp('backgroundColor')) || '#FFFFFF';
      var pk = h('input', { type: 'color', value: toHex(c) || '#FFFFFF' }), tx = h('input', { type: 'text', class: 'pdd-hex', value: c });
      pk.addEventListener('input', function () { tx.value = pk.value; setUi('c1', pk.value); setP('background', pk.value, 'bg'); });
      tx.addEventListener('change', function () { setP('background', tx.value.trim(), 'bg'); });
      box.appendChild(row('রং', [pk, tx]));
    }
    if (type === 'grad') {
      var c1 = getUi('c1', '#1D5358'), c2 = getUi('c2', '#4FA8AD'), an = getUi('ang', 135);
      var p1 = h('input', { type: 'color', value: toHex(c1) || '#1D5358' }), p2 = h('input', { type: 'color', value: toHex(c2) || '#4FA8AD' });
      var ang = h('input', { type: 'range', min: 0, max: 360, step: 5, value: an }), angN = h('input', { type: 'number', min: 0, max: 360, value: an });
      p1.addEventListener('input', function () { setUiQuiet('c1', p1.value); writeGrad(); });
      p2.addEventListener('input', function () { setUiQuiet('c2', p2.value); writeGrad(); });
      ang.addEventListener('input', function () { angN.value = ang.value; setUiQuiet('ang', +ang.value); writeGrad(); });
      angN.addEventListener('input', function () { ang.value = angN.value; setUiQuiet('ang', +angN.value); writeGrad(); });
      box.appendChild(row('শুরুর রং', p1)); box.appendChild(row('শেষের রং', p2)); box.appendChild(row('দিক (ডিগ্রি)', [ang, angN]));
      var chips = h('div', { class: 'pdd-chips' }, GRADS.map(function (g) {
        return h('button', { type: 'button', class: 'pdd-chip', title: 'এই গ্রেডিয়েন্ট', style: 'background:linear-gradient(' + g[2] + 'deg,' + g[0] + ',' + g[1] + ')', onclick: function () {
          setUiQuiet('c1', g[0]); setUiQuiet('c2', g[1]); setUiQuiet('ang', g[2]); writeGrad(); renderPanel();
        } });
      }));
      box.appendChild(h('div', { class: 'pdd-row' }, [h('label', { text: 'তৈরি গ্রেডিয়েন্ট' }), chips]));
    }
    if (type === 'img') {
      var u = h('input', { type: 'text', placeholder: 'https://...jpg', value: (getUi('img', '')) });
      u.addEventListener('change', function () {
        var v = u.value.trim();
        if (v && !/^https:\/\//i.test(v)) { toast('ছবির লিংক https:// দিয়ে শুরু হতে হবে'); return; }
        mutate(function () {
          var rr = currentRule(true); rr.ui = rr.ui || {}; rr.ui.img = v;
          var bag = S.darkOnly ? (rr.d = rr.d || {}) : (rr.p = rr.p || {});
          if (v) { bag.bgImage = 'url("' + v.replace(/["()\\\s]/g, encodeURIComponent) + '")'; bag.bgSize = bag.bgSize || 'cover'; bag.bgPos = 'center'; } else { delete bag.bgImage; }
        }, '');
      });
      box.appendChild(row('ছবির লিংক', u, 'ছবি ইন্টারনেটে (https) থাকতে হবে'));
      box.appendChild(selCtl('ছবির মাপ', 'bgSize', [['cover', 'পুরো ভরে (cover)'], ['contain', 'পুরোটা দেখিয়ে (contain)'], ['auto', 'আসল মাপ']]));
    }
    return box;
  }
  function setUiQuiet(k, v) { var r = currentRule(true); r.ui = r.ui || {}; r.ui[k] = v; }

  function renderElementTab(body) {
    var el = S.el;
    if (!el || !el.isConnected) {
      body.appendChild(h('div', { class: 'pdd-empty' }, [
        h('div', { class: 'pdd-empty-ic', text: '👆' }),
        h('h4', { text: 'প্রিভিউতে ক্লিক করুন' }),
        h('p', { text: 'ডান পাশের প্রিভিউতে যেকোনো লেখা, ছবি, বাটন বা বক্সে ক্লিক করলে এখানে তার সব সেটিং আসবে।' }),
        h('p', { class: 'pdd-dim', text: 'সঠিক জায়গা না ধরলে উপরের "ভেতরে/বাইরে" বাটন বা পথ-চিহ্ন (breadcrumb) দিয়ে বদলান। লিংকে ক্লিক করে অন্য পাতায় যেতে চাইলে উপরে "ব্রাউজ" মোড চালু করুন।' })
      ]));
      return;
    }
    var add = addOf(el);
    var isSvg = !!(el.namespaceURI && /svg/.test(el.namespaceURI));
    var isImg = el.tagName === 'IMG';
    var isLink = el.tagName === 'A';
    var tn = firstText(el);
    var r = currentRule(false);

    // পথ-চিহ্ন
    var crumbs = [], c = el;
    while (c && c.nodeType === 1 && c !== el.ownerDocument.documentElement && crumbs.length < 5) { crumbs.unshift(c); c = c.parentElement; }
    body.appendChild(h('div', { class: 'pdd-crumbs' }, crumbs.map(function (cc, i) {
      return h('button', { type: 'button', class: cc === el ? 'on' : '', text: tagLabel(cc).slice(0, 22), title: 'এটি বেছে নিন', onclick: function () { selectEl(cc); } });
    })));
    var navRow = h('div', { class: 'pdd-actions' }, [
      h('button', { type: 'button', class: 'pdd-btn', text: '⬆ বাইরের অংশ', onclick: function () { if (el.parentElement && el.parentElement !== el.ownerDocument.body) selectEl(el.parentElement); } }),
      h('button', { type: 'button', class: 'pdd-btn', text: '⬇ ভেতরের অংশ', onclick: function () { var k = el.firstElementChild; if (k) selectEl(k); else toast('এর ভেতরে আর কিছু নেই'); } })
    ]);
    body.appendChild(navRow);

    // কোথায় প্রয়োগ
    var tgt = [];
    tgt.push(h('div', { class: 'pdd-seg' }, [['page', 'শুধু এই পেজে'], ['all', 'সব পেজে']].map(function (o) {
      return h('button', { type: 'button', class: S.scope === o[0] ? 'on' : '', text: o[1], onclick: function () { changeTarget(S.sel, o[0]); } });
    })));
    var ss = similarSel(el);
    if (ss && !add) {
      var cb = h('input', { type: 'checkbox' }); cb.checked = S.similar;
      cb.addEventListener('change', function () { S.similar = cb.checked; changeTarget(cb.checked ? ss : cssPath(el), S.scope); });
      tgt.push(h('label', { class: 'pdd-check' }, [cb, h('span', { text: 'একই ধরনের সবগুলোতে প্রয়োগ হোক (' + ss + ')' })]));
    }
    var dk = h('input', { type: 'checkbox' }); dk.checked = S.darkOnly;
    dk.addEventListener('change', function () { S.darkOnly = dk.checked; renderPanel(); });
    tgt.push(h('label', { class: 'pdd-check' }, [dk, h('span', { text: 'রং/ব্যাকগ্রাউন্ড শুধু ডার্ক মোডের জন্য' })]));
    body.appendChild(h('div', { class: 'pdd-box' }, tgt));

    // যোগ করা এলিমেন্টের বিষয়বস্তু
    if (add) {
      var cf = [];
      var cn = add.content || (add.content = {});
      function upd(k, v) { mutate(function () { add.content[k] = v; }, 'add:' + k); }
      if (/heading|text|button|box/.test(add.kind)) cf.push(textCtl('লেখা', function () { return cn.text; }, function (v) { upd('text', v); }, add.kind !== 'heading' && add.kind !== 'button'));
      if (add.kind === 'button') cf.push(textCtl('লিংক', function () { return cn.href; }, function (v) { upd('href', v); }, false, 'https://... বা article.html'));
      if (add.kind === 'image') { cf.push(textCtl('ছবির লিংক (https)', function () { return cn.src; }, function (v) { upd('src', v); }, false, 'https://...jpg')); cf.push(textCtl('ছবির বর্ণনা', function () { return cn.alt; }, function (v) { upd('alt', v); })); }
      if (add.kind === 'spacer') cf.push(row('উচ্চতা (px)', h('input', { type: 'number', min: 4, max: 600, value: cn.h || 40, oninput: function (e) { upd('h', +e.target.value); } })));
      if (add.kind === 'icon') cf.push(row('আইকন', h('div', { class: 'pdd-icons' }, Object.keys(ICON_NAMES).map(function (k) {
        var d = h('button', { type: 'button', class: 'pdd-ic' + (cn.icon === k ? ' on' : ''), title: ICON_NAMES[k], onclick: function () { upd('icon', k); renderPanel(); } });
        d.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (window.PDDesign ? '' : '') + '</svg>';
        var svgp = (win() && win().PDDesign && win().PDDesign.icons[k]) || '';
        d.firstChild.innerHTML = svgp;
        return d;
      }))));
      body.appendChild(sec('এই এলিমেন্টের বিষয়বস্তু', true, cf));
    } else {
      // লেখা / লিংক / ছবি
      var cf2 = [];
      if (tn) {
        var ta = h('textarea', { rows: Math.min(5, Math.max(2, Math.ceil(tn.nodeValue.trim().length / 34))) });
        ta.value = (r && typeof r.text === 'string') ? r.text : tn.nodeValue.trim();
        ta.addEventListener('input', function () { mutate(function () { var rr = currentRule(true); rr.text = ta.value; }, 'text'); });
        cf2.push(row('লেখা', ta));
        if (r && typeof r.text === 'string') cf2.push(h('button', { type: 'button', class: 'pdd-btn sm', text: '↺ আসল লেখায় ফিরুন', onclick: function () { mutate(function () { var rr = currentRule(false); if (rr) { delete rr.text; pruneRule(rr); } }, ''); renderPanel(); } }));
      }
      if (isLink) cf2.push(textCtl('লিংকের ঠিকানা', function () { var rr = currentRule(false); return rr && typeof rr.href === 'string' ? rr.href : (el.getAttribute('href') || ''); }, function (v) { mutate(function () { currentRule(true).href = v; }, 'href'); }, false, 'https://... বা archive.html'));
      if (isImg) cf2.push(textCtl('ছবির লিংক (https)', function () { var rr = currentRule(false); return rr && typeof rr.src === 'string' ? rr.src : (el.getAttribute('src') || ''); }, function (v) { mutate(function () { currentRule(true).src = v; }, 'src'); }, false, 'https://...jpg'));
      if (!cf2.length) cf2.push(h('p', { class: 'pdd-dim', text: 'এই এলিমেন্টে সরাসরি লেখা নেই। ভেতরের লেখা বদলাতে "ভেতরের অংশ" দিয়ে সেটি বেছে নিন।' }));
      body.appendChild(sec('লেখা ও লিংক', true, cf2));
    }

    // লেখার স্টাইল
    var cs = comp('display');
    if (!isSvg && !isImg) {
      body.appendChild(sec('লেখার স্টাইল', true, [
        numCtl('আকার', 'fontSize', 8, 120, 1, 'px'),
        selCtl('ওজন', 'fontWeight', [['300', 'পাতলা'], ['400', 'সাধারণ'], ['600', 'আধা-মোটা'], ['700', 'মোটা']]),
        colorCtl('লেখার রং', 'color'),
        segCtl('সাজানো', 'textAlign', [['left', '⇤ বাঁ'], ['center', '⇔ মাঝ'], ['right', 'ডান ⇥'], ['justify', '≡ সমান']]),
        numCtl('লাইনের উচ্চতা', 'lineHeight', 0.8, 3, 0.05, '', { def: 1.5 }),
        numCtl('অক্ষরের ফাঁক', 'letterSpacing', -2, 20, 0.5, 'px', { def: 0 }),
        segCtl('স্টাইল', 'fontStyle', [['italic', 'ইটালিক']])
      ]));
    }
    if (isSvg) {
      var stroke = el.getAttribute('fill') === 'none' || comp('fill') === 'none';
      body.appendChild(sec('আইকনের স্টাইল', true, [
        colorCtl('আইকনের রং', stroke ? 'stroke' : 'fill'),
        numCtl('প্রস্থ', 'width', 8, 400, 1, 'px'),
        numCtl('উচ্চতা', 'height', 8, 400, 1, 'px')
      ]));
    }
    if (isImg) {
      body.appendChild(sec('ছবির মাপ', true, [
        numCtl('প্রস্থ', 'width', 20, 1600, 1, 'px'),
        numCtl('উচ্চতা', 'height', 20, 1600, 1, 'px'),
        selCtl('ছবি বসানো', 'objectFit', [['cover', 'ভরে (cover)'], ['contain', 'পুরোটা (contain)'], ['fill', 'টেনে (fill)']])
      ]));
    }
    // ব্যাকগ্রাউন্ড
    body.appendChild(sec('ব্যাকগ্রাউন্ড (রং / গ্রেডিয়েন্ট / ছবি)', false, [bgCtl()]));
    // স্পেসিং ও আকার
    var sp = [];
    sp.push(h('div', { class: 'pdd-sub', text: 'ভেতরের ফাঁক (padding)' }));
    sp.push(numCtl('উপরে', 'paddingTop', 0, 200, 1, 'px')); sp.push(numCtl('নিচে', 'paddingBottom', 0, 200, 1, 'px'));
    sp.push(numCtl('বাঁয়ে', 'paddingLeft', 0, 200, 1, 'px')); sp.push(numCtl('ডানে', 'paddingRight', 0, 200, 1, 'px'));
    sp.push(h('div', { class: 'pdd-sub', text: 'বাইরের ফাঁক (margin)' }));
    sp.push(numCtl('উপরে', 'marginTop', -100, 300, 1, 'px')); sp.push(numCtl('নিচে', 'marginBottom', -100, 300, 1, 'px'));
    if (!isSvg && !isImg) { sp.push(h('div', { class: 'pdd-sub', text: 'মাপ' })); sp.push(numCtl('সর্বোচ্চ প্রস্থ', 'maxWidth', 100, 2000, 5, 'px')); sp.push(numCtl('সর্বনিম্ন উচ্চতা', 'minHeight', 0, 1200, 5, 'px')); }
    if (/flex|grid/.test(cs)) {
      sp.push(h('div', { class: 'pdd-sub', text: 'ভেতরের সাজানো' }));
      sp.push(numCtl('এলিমেন্টগুলোর ফাঁক', 'gap', 0, 120, 1, 'px'));
      sp.push(selCtl('ছড়ানো', 'justifyContent', [['flex-start', 'শুরুতে'], ['center', 'মাঝখানে'], ['flex-end', 'শেষে'], ['space-between', 'দুই প্রান্তে'], ['space-around', 'সমান ফাঁকে']]));
    }
    body.appendChild(sec('ফাঁক ও মাপ', false, sp));
    // বর্ডার, কোণা, ছায়া
    var bd = [];
    bd.push(numCtl('কোণার গোলাকার', 'borderRadius', 0, 80, 1, 'px'));
    var bw = h('input', { type: 'number', min: 0, max: 20, value: getUi('bw', 0) }), bcp = h('input', { type: 'color', value: toHex(getUi('bc', '')) || '#E4DDD0' });
    function writeBorder() { var w = +bw.value, cl = bcp.value; mutate(function () { var rr = currentRule(true); rr.ui = rr.ui || {}; rr.ui.bw = w; rr.ui.bc = cl; var bag = S.darkOnly ? (rr.d = rr.d || {}) : (rr.p = rr.p || {}); if (w > 0) bag.border = w + 'px solid ' + cl; else delete bag.border; pruneRule(rr); }, 'border'); }
    bw.addEventListener('input', writeBorder); bcp.addEventListener('input', writeBorder);
    bd.push(row('বর্ডার (px ও রং)', [bw, bcp]));
    bd.push(selCtl('ছায়া', 'boxShadow', [['none', 'নেই'], ['0 2px 8px rgba(0,0,0,.12)', 'হালকা'], ['0 8px 24px rgba(0,0,0,.18)', 'মাঝারি'], ['0 18px 48px rgba(0,0,0,.30)', 'গভীর']]));
    bd.push(numCtl('স্বচ্ছতা', 'opacity', 0, 100, 1, '%', { scale: 100, def: 100 }));
    body.appendChild(sec('বর্ডার, কোণা ও ছায়া', false, bd));

    // কাজের বাটন
    var hidden = !!(r && r.hide);
    var acts = [
      h('button', { type: 'button', class: 'pdd-btn', text: hidden ? '👁 আবার দেখান' : '🙈 লুকান (অফ)', onclick: function () { toggleHide(el); renderPanel(); } }),
      h('button', { type: 'button', class: 'pdd-btn', text: '↑ উপরে সরান', onclick: function () { moveEl(-1); } }),
      h('button', { type: 'button', class: 'pdd-btn', text: '↓ নিচে সরান', onclick: function () { moveEl(1); } }),
      h('button', { type: 'button', class: 'pdd-btn', text: '↺ এর সব বদল মুছুন', onclick: function () { mutate(function () { var rr = currentRule(false); if (rr) S.cfg.rules = S.cfg.rules.filter(function (x) { return x !== rr; }); }, ''); renderPanel(); } })
    ];
    if (add) acts.unshift(h('button', { type: 'button', class: 'pdd-btn danger', text: '🗑 এলিমেন্টটি মুছুন', onclick: function () { removeAdd(add); } }));
    body.appendChild(h('div', { class: 'pdd-actions wrap' }, acts));
  }
  function changeTarget(newSel, newScope) {
    var old = currentRule(false);
    S.sel = newSel; S.scope = newScope;
    if (old) {
      mutate(function () {
        var ex = findRule(newSel, scopePage());
        if (ex && ex !== old) S.cfg.rules = S.cfg.rules.filter(function (x) { return x !== ex; });
        old.sel = newSel; old.page = scopePage();
      }, '');
    }
    renderPanel();
  }

  /* ============ প্যানেল: সাইট জুড়ে (গ্লোবাল) ============ */
  function G() { var g = S.cfg.g; g.colors = g.colors || { light: {}, dark: {} }; g.colors.light = g.colors.light || {}; g.colors.dark = g.colors.dark || {}; g.typo = g.typo || {}; return g; }
  function setG(fn, group) { mutate(function () { fn(G()); }, group || 'g'); }
  function renderSiteTab(body) {
    var g = G();
    // প্রিসেট
    body.appendChild(sec('রেডিমেড থিম (এক ক্লিকে)', true, [
      h('p', { class: 'pdd-dim', text: 'একটা থিম বেছে নিলে পুরো সাইটের রং বদলে যাবে। পরে নিচের রঙের তালিকা থেকে আলাদা করে ঠিক করতে পারবেন।' }),
      h('div', { class: 'pdd-presets' }, PRESETS.map(function (p) {
        var b = h('button', { type: 'button', class: 'pdd-preset', onclick: function () {
          setG(function (gg) { gg.colors.light = p.light ? clone(p.light) : {}; gg.colors.dark = p.dark ? clone(p.dark) : {}; }, '');
          renderPanel();
        } }, [h('span', { class: 'pdd-sw' }, p.c.map(function (c) { return h('i', { style: 'background:' + c }); })), h('b', { text: p.n })]);
        return b;
      }))
    ]));
    // রং
    var cr = [h('p', { class: 'pdd-dim', text: '☀ = দিনের (লাইট) মোড, 🌙 = রাতের (ডার্ক) মোড। ↺ চাপলে আসল রং ফিরবে।' })];
    VARS.forEach(function (v) {
      var key = v[0];
      var lc = g.colors.light[key] || BASE.light[key], dc = g.colors.dark[key] || BASE.dark[key];
      var pl = h('input', { type: 'color', value: toHex(lc) || '#000000', title: 'লাইট মোড' });
      var pd = h('input', { type: 'color', value: toHex(dc) || '#000000', title: 'ডার্ক মোড' });
      pl.addEventListener('input', function () { setG(function (gg) { gg.colors.light[key] = pl.value; }, 'c:' + key + 'l'); r_.classList.add('is-set'); });
      pd.addEventListener('input', function () { setG(function (gg) { gg.colors.dark[key] = pd.value; }, 'c:' + key + 'd'); r_.classList.add('is-set'); });
      var clr = h('button', { class: 'pdd-x', type: 'button', text: '↺', title: 'আসল রং', onclick: function () { setG(function (gg) { delete gg.colors.light[key]; delete gg.colors.dark[key]; }, ''); renderPanel(); } });
      var r_ = row(v[1], [h('em', { text: '☀' }), pl, h('em', { text: '🌙' }), pd, clr], v[2]);
      if (g.colors.light[key] || g.colors.dark[key]) r_.classList.add('is-set');
      cr.push(r_);
    });
    body.appendChild(sec('সাইটের মূল রংগুলো', false, cr));
    // টাইপোগ্রাফি
    var ty = [h('p', { class: 'pdd-dim', text: 'এখানে বদলালে সব পেজের ওই ধরনের লেখা একসাথে বদলাবে।' })];
    [['h1', 'বড় শিরোনাম (h1)', 20, 90], ['h2', 'মাঝারি শিরোনাম (h2)', 16, 70], ['h3', 'ছোট শিরোনাম (h3)', 14, 50], ['p', 'প্যারাগ্রাফ / সাধারণ লেখা', 10, 32], ['btn', 'বাটনের লেখা', 10, 30]].forEach(function (t) {
      var k = t[0], bag = g.typo[k] || {};
      var num = h('input', { type: 'number', min: t[2], max: t[3], placeholder: 'আগের মতো', value: bag.fontSize ? parseFloat(bag.fontSize) : '' });
      var wt = h('select', {}, [h('option', { value: '', text: 'ওজন: আগের মতো' }), h('option', { value: '300', text: 'পাতলা' }), h('option', { value: '400', text: 'সাধারণ' }), h('option', { value: '600', text: 'আধা-মোটা' }), h('option', { value: '700', text: 'মোটা' })]);
      wt.value = bag.fontWeight || '';
      var col = h('input', { type: 'color', value: toHex(bag.color) || '#000000', title: 'লেখার রং' });
      var has = !!bag.color;
      function put(prop, val) { setG(function (gg) { gg.typo[k] = gg.typo[k] || {}; if (val === '' || val == null) delete gg.typo[k][prop]; else gg.typo[k][prop] = val; if (!Object.keys(gg.typo[k]).length) delete gg.typo[k]; }, 't:' + k + prop); }
      num.addEventListener('input', function () { put('fontSize', num.value === '' ? '' : num.value + 'px'); });
      wt.addEventListener('change', function () { put('fontWeight', wt.value); });
      col.addEventListener('input', function () { put('color', col.value); });
      var clr = h('button', { class: 'pdd-x', type: 'button', text: '↺', onclick: function () { setG(function (gg) { delete gg.typo[k]; }, ''); renderPanel(); } });
      ty.push(h('div', { class: 'pdd-row' }, [h('label', { text: t[1] }), h('div', { class: 'pdd-ctl' }, [num, h('em', { text: 'px' }), wt, col, clr])]));
    });
    body.appendChild(sec('লেখার ধরন (সব পেজে)', false, ty));
    // লেআউট
    var lay = [];
    var zr = h('input', { type: 'range', min: 70, max: 130, step: 1, value: g.zoom || 100 }), zn = h('input', { type: 'number', min: 70, max: 130, value: g.zoom || 100 });
    zr.addEventListener('input', function () { zn.value = zr.value; setG(function (gg) { gg.zoom = +zr.value === 100 ? undefined : +zr.value; }, 'zoom'); });
    zn.addEventListener('input', function () { zr.value = zn.value; setG(function (gg) { gg.zoom = +zn.value === 100 ? undefined : +zn.value; }, 'zoom'); });
    lay.push(row('পুরো সাইট ছোট-বড় (%)', [zr, zn, h('em', { text: '%' })], 'লেখা, ছবি, ফাঁক — সবকিছু একসাথে বাড়বে/কমবে'));
    var mr = h('input', { type: 'range', min: 800, max: 1800, step: 20, value: g.maxWidth || 1200 }), mn = h('input', { type: 'number', min: 800, max: 1800, value: g.maxWidth || 1200 });
    mr.addEventListener('input', function () { mn.value = mr.value; setG(function (gg) { gg.maxWidth = +mr.value === 1200 ? undefined : +mr.value; }, 'mw'); });
    mn.addEventListener('input', function () { mr.value = mn.value; setG(function (gg) { gg.maxWidth = +mn.value === 1200 ? undefined : +mn.value; }, 'mw'); });
    lay.push(row('কনটেন্টের সর্বোচ্চ প্রস্থ', [mr, mn, h('em', { text: 'px' })], 'বড় স্ক্রিনে সাইট কতটা চওড়া হবে'));
    var hs = h('input', { type: 'checkbox' }); hs.checked = !!g.headerStatic;
    hs.addEventListener('change', function () { setG(function (gg) { gg.headerStatic = hs.checked || undefined; }, ''); });
    lay.push(h('label', { class: 'pdd-check' }, [hs, h('span', { text: 'হেডার স্ক্রল করলে সাথে না এসে একই জায়গায় থাকুক' })]));
    body.appendChild(sec('লেআউট', false, lay));
    // অ্যাডভান্সড
    var ta = h('textarea', { rows: 6, class: 'pdd-code', placeholder: '.hero { letter-spacing: 1px; }', spellcheck: 'false' });
    ta.value = g.customCss || '';
    ta.addEventListener('input', function () { setG(function (gg) { gg.customCss = ta.value || undefined; }, 'css'); });
    body.appendChild(sec('অ্যাডভান্সড: নিজের CSS (ঐচ্ছিক)', false, [h('p', { class: 'pdd-dim', text: 'যারা CSS জানেন তাদের জন্য। এটি সব পেজে প্রয়োগ হয়।' }), ta]));
  }

  /* ============ প্যানেল: যোগ করুন ============ */
  var addDraft = { kind: 'heading', pos: 'after', text: '', href: '', src: '', alt: '', icon: 'star', h: 40 };
  function renderAddTab(body) {
    body.appendChild(h('div', { class: 'pdd-box tone' }, [
      h('b', { text: S.el && S.el.isConnected ? 'যেখানে যোগ হবে: ' + tagLabel(S.el) : 'আগে প্রিভিউতে একটি জায়গায় ক্লিক করুন' }),
      h('p', { class: 'pdd-dim', text: 'যে এলিমেন্টে ক্লিক করেছেন তার আগে, পরে বা ভেতরে নতুন জিনিস বসবে।' })
    ]));
    body.appendChild(h('div', { class: 'pdd-kinds' }, ADD_KINDS.map(function (k) {
      return h('button', { type: 'button', class: 'pdd-kind' + (addDraft.kind === k[0] ? ' on' : ''), onclick: function () { addDraft.kind = k[0]; renderPanel(); } }, [h('b', { text: k[1] }), h('small', { text: k[2] })]);
    })));
    var f = [];
    var k = addDraft.kind;
    if (/heading|text|button|box/.test(k)) f.push(textCtl('লেখা', function () { return addDraft.text; }, function (v) { addDraft.text = v; }, k === 'text' || k === 'box', k === 'heading' ? 'আপনার শিরোনাম' : 'এখানে লিখুন'));
    if (k === 'button') f.push(textCtl('লিংক', function () { return addDraft.href; }, function (v) { addDraft.href = v; }, false, 'https://... বা store.html'));
    if (k === 'image') { f.push(textCtl('ছবির লিংক (https)', function () { return addDraft.src; }, function (v) { addDraft.src = v; }, false, 'https://...jpg')); f.push(textCtl('ছবির বর্ণনা', function () { return addDraft.alt; }, function (v) { addDraft.alt = v; })); }
    if (k === 'spacer') f.push(row('উচ্চতা (px)', h('input', { type: 'number', min: 4, max: 600, value: addDraft.h, oninput: function (e) { addDraft.h = +e.target.value; } })));
    if (k === 'icon') f.push(row('আইকন', h('div', { class: 'pdd-icons' }, Object.keys(ICON_NAMES).map(function (nm) {
      var d = h('button', { type: 'button', class: 'pdd-ic' + (addDraft.icon === nm ? ' on' : ''), title: ICON_NAMES[nm], onclick: function () { addDraft.icon = nm; renderPanel(); } });
      d.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></svg>';
      d.firstChild.innerHTML = (win() && win().PDDesign && win().PDDesign.icons[nm]) || '';
      return d;
    }))));
    var ps = h('select', {}, [['after', 'এর পরে (নিচে)'], ['before', 'এর আগে (উপরে)'], ['inside-end', 'এর ভেতরে, শেষে'], ['inside-start', 'এর ভেতরে, শুরুতে']].map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
    ps.value = addDraft.pos; ps.addEventListener('change', function () { addDraft.pos = ps.value; });
    f.push(row('কোথায় বসবে', ps));
    body.appendChild(h('div', { class: 'pdd-box' }, f));
    body.appendChild(h('div', { class: 'pdd-actions' }, [h('button', { type: 'button', class: 'pdd-btn primary', text: '＋ যোগ করুন', onclick: function () {
      var c = {};
      if (/heading|text|button|box/.test(k)) c.text = addDraft.text || (k === 'heading' ? 'নতুন শিরোনাম' : k === 'button' ? 'বাটন' : 'এখানে আপনার লেখা');
      if (k === 'button') c.href = addDraft.href;
      if (k === 'image') { if (!/^https:\/\//i.test(addDraft.src || '')) { toast('ছবির লিংক https:// দিয়ে শুরু হতে হবে'); return; } c.src = addDraft.src; c.alt = addDraft.alt; }
      if (k === 'icon') c.icon = addDraft.icon;
      if (k === 'spacer') c.h = addDraft.h;
      addElement(k, c, addDraft.pos);
    } })]));
  }

  /* ============ প্যানেল: সেকশন তালিকা ============ */
  var OUT_TAGS = /^(header|nav|main|section|article|aside|footer|div|form|ul|ol|table|figure)$/;
  function renderSections() {
    var body = $('#pdd-body'); if (!body || S.tab !== 'sections') return;
    var scroll = body.scrollTop;
    body.textContent = '';
    renderSectionsInto(body);
    body.scrollTop = scroll;
  }
  function renderSectionsInto(body) {
    var d = doc();
    body.appendChild(h('p', { class: 'pdd-dim', text: 'এই পেজের বড় অংশগুলোর তালিকা। 👁 চাপলে অংশটি লুকাবে/দেখাবে, ↑↓ দিয়ে জায়গা বদলাবে, নামে ক্লিক করলে সেটি বেছে নেবে।' }));
    if (!d || !d.body) { body.appendChild(h('p', { class: 'pdd-dim', text: 'প্রিভিউ লোড হচ্ছে…' })); return; }
    var list = h('div', { class: 'pdd-outline' });
    function walk(el, depth) {
      [].forEach.call(el.children, function (c) {
        var tag = c.tagName.toLowerCase();
        if (/^(script|style|link|noscript|template|svg|meta)$/.test(tag) || c.id === 'pdd-ignore' || c.id === 'toast') return;
        if (!OUT_TAGS.test(tag)) return;
        var sel = cssPath(c), sc = c.closest('header,footer') ? '*' : S.page;
        var rule = findRule(sel, sc);
        var hid = !!(rule && rule.hide);
        var visible = c.offsetHeight > 0 || c.offsetWidth > 0;
        if (!visible && !hid) return;
        try { if (d.defaultView.getComputedStyle(c).position === 'fixed' && !hid) return; } catch (e) {}
        if (depth > 3) return;
        var li = h('div', { class: 'pdd-orow' + (hid ? ' off' : '') + (S.el === c ? ' on' : ''), style: 'padding-left:' + (8 + depth * 14) + 'px' }, [
          h('button', { type: 'button', class: 'pdd-eye', title: hid ? 'দেখান' : 'লুকান', text: hid ? '🙈' : '👁', onclick: function (e) { e.stopPropagation(); toggleHide(c); } }),
          h('span', { class: 'pdd-oname', text: labelOf(c), title: sel, onclick: function () { S.mode = 'edit'; selectEl(c); setModeAttr(); try { c.scrollIntoView({ block: 'center' }); } catch (e) {} } }),
          h('button', { type: 'button', class: 'pdd-mv', title: 'উপরে সরান', text: '↑', onclick: function (e) { e.stopPropagation(); moveEl(-1, c); } }),
          h('button', { type: 'button', class: 'pdd-mv', title: 'নিচে সরান', text: '↓', onclick: function (e) { e.stopPropagation(); moveEl(1, c); } })
        ]);
        list.appendChild(li);
        if (!hid && depth < 2) walk(c, depth + 1);
      });
    }
    walk(d.body, 0);
    body.appendChild(list);
    // লুকানো এলিমেন্ট যেগুলো তালিকায় দেখা যায় না
    var hiddenRules = S.cfg.rules.filter(function (r) { return r.hide && (r.page === '*' || r.page === S.page); });
    if (hiddenRules.length) {
      body.appendChild(h('div', { class: 'pdd-sub', text: 'লুকানো এলিমেন্ট (' + hiddenRules.length + 'টি)' }));
      hiddenRules.forEach(function (r) {
        body.appendChild(h('div', { class: 'pdd-orow off' }, [
          h('button', { type: 'button', class: 'pdd-eye', title: 'আবার দেখান', text: '🙈', onclick: function () { mutate(function () { delete r.hide; pruneRule(r); }, ''); renderSections(); } }),
          h('span', { class: 'pdd-oname', text: (r.label || r.sel) + (r.page === '*' ? '  (সব পেজে)' : ''), title: r.sel })
        ]));
      });
    }
  }

  /* ============ প্যানেল: আরও (টুলস) ============ */
  function renderMoreTab(body) {
    var pubd = S.live && S.live.updatedAt ? new Date(S.live.updatedAt).toLocaleString('bn-BD') : 'এখনো পাবলিশ হয়নি';
    body.appendChild(h('div', { class: 'pdd-box tone' }, [
      h('b', { text: 'অবস্থা' }),
      h('p', { class: 'pdd-dim', text: 'শেষ পাবলিশ: ' + pubd }),
      h('p', { class: 'pdd-dim', text: 'মোট বদল: ' + S.cfg.rules.length + 'টি এলিমেন্ট, ' + S.cfg.adds.length + 'টি নতুন এলিমেন্ট, ' + S.cfg.moves.length + 'টি স্থান-বদল' })
    ]));
    var acts = [
      h('button', { type: 'button', class: 'pdd-btn', text: '⏪ আগের পাবলিশড ভার্সন লোড করুন', onclick: function () {
        if (!S.prev) { toast('আগের কোনো ভার্সন জমা নেই'); return; }
        AdminUI.showConfirm('আগের ভার্সন লোড হবে', 'এখনকার অসংরক্ষিত পরিবর্তন বাদ যাবে। লোড করার পর পাবলিশ চাপলে সেটি লাইভ হবে।', function () { pushUndo(''); S.cfg = clone(S.prev); S.dirty = true; loadFrame(); renderPanel(); refreshBar(); });
      } }),
      h('button', { type: 'button', class: 'pdd-btn', text: '🌐 আসল সাইটের অবস্থায় ফিরুন', onclick: function () {
        AdminUI.showConfirm('সব ডিজাইন মুছবে?', 'সব রং, লেখা, যোগ-করা এলিমেন্ট মুছে সাইট আসল অবস্থায় ফিরবে। পাবলিশ না করা পর্যন্ত লাইভ সাইট বদলাবে না।', function () { pushUndo(''); S.cfg = emptyCfg(); S.el = null; S.sel = ''; S.dirty = true; loadFrame(); renderPanel(); refreshBar(); });
      } }),
      h('button', { type: 'button', class: 'pdd-btn', text: '⬇ ডিজাইন ফাইল হিসেবে নামান (ব্যাকআপ)', onclick: function () {
        var blob = new Blob([JSON.stringify(S.cfg, null, 2)], { type: 'application/json' });
        var a = h('a', { href: URL.createObjectURL(blob), download: 'potrodip-design-backup.json' }); document.body.appendChild(a); a.click(); a.remove();
      } }),
      h('button', { type: 'button', class: 'pdd-btn', text: '🔌 ডেটাবেস সংযোগ পরীক্ষা', onclick: function () { checkDb(true); } })
    ];
    body.appendChild(h('div', { class: 'pdd-actions col' }, acts));
    var ta = h('textarea', { rows: 4, class: 'pdd-code', placeholder: 'ব্যাকআপ ফাইলের লেখা এখানে পেস্ট করুন', spellcheck: 'false' });
    body.appendChild(sec('ব্যাকআপ থেকে ফিরিয়ে আনা', false, [ta, h('button', { type: 'button', class: 'pdd-btn', text: 'লোড করুন', onclick: function () {
      try { var o = JSON.parse(ta.value); if (!o || typeof o !== 'object' || !Array.isArray(o.rules)) throw 0; o.adds = o.adds || []; o.moves = o.moves || []; o.g = o.g || {}; pushUndo(''); S.cfg = o; S.dirty = true; loadFrame(); renderPanel(); refreshBar(); toast('ডিজাইন লোড হয়েছে'); } catch (e) { toast('ফাইলের লেখা ঠিক নেই'); }
    } })]));
    body.appendChild(sec('কীভাবে ব্যবহার করবেন', true, [h('ol', { class: 'pdd-guide' }, [
      h('li', { text: 'উপরে পেজ বেছে নিন, ডানে প্রিভিউ আসবে। পিসি / ট্যাবলেট / মোবাইলে বদলে দেখুন।' }),
      h('li', { text: 'প্রিভিউতে যেকোনো জিনিসে ক্লিক করুন → "এলিমেন্ট" ট্যাবে তার লেখা, রং, সাইজ, ফাঁক বদলান।' }),
      h('li', { text: '"সাইট" ট্যাবে থিম/রং/লেখার ধরন একসাথে বদলান। "যোগ" ট্যাবে নতুন এলিমেন্ট বসান।' }),
      h('li', { text: '"সেকশন" ট্যাবে বড় অংশ অন/অফ ও জায়গা বদল করুন।' }),
      h('li', { text: 'পছন্দ হলে উপরের 🚀 পাবলিশ চাপুন — তখনই সবার জন্য লাইভ হবে। ড্রাফট সেভ করলে লাইভ সাইট বদলায় না।' })
    ])]));
  }
  function anonClient() {
    try { return window.supabase.createClient(PD.config.supabaseUrl, PD.config.anonKey, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'pd-anon-check' } }); } catch (e) { return null; }
  }
  function checkDb(verbose) {
    return dbSet('design_ping', { t: Date.now() }).then(function (w) {
      if (w.error) { if (verbose) AdminUI.showConfirm('ডেটাবেসে লেখা যাচ্ছে না', 'কারণ: ' + errMsg(w) + ' — "supabase-design-setup.sql" ফাইলটি Supabase-এর SQL Editor-এ চালান।', function () {}); return false; }
      var an = anonClient();
      if (!an) { if (verbose) toast('লেখা ঠিক আছে'); return true; }
      return an.from('site_settings').select('key').eq('key', 'design_ping').then(function (rd) {
        var ok = !rd.error && rd.data && rd.data.length;
        if (!ok) { AdminUI.showConfirm('দর্শকরা ডিজাইন দেখতে পারবে না', 'লেখা সফল, কিন্তু সাধারণ দর্শক site_settings পড়তে পারছে না। "supabase-design-setup.sql" ফাইলের SQL একবার Supabase-এ চালিয়ে নিন।', function () {}); return false; }
        if (verbose) toast('সংযোগ ঠিক আছে ✓ লেখা ও পড়া দুটোই চলছে');
        return true;
      });
    });
  }

  /* ============ প্যানেল ডিসপ্যাচ, ট্যাব, টপবার ============ */
  var TABS = [['site', 'সাইট', 'রং ও থিম'], ['element', 'এলিমেন্ট', 'বেছে নেওয়া অংশ'], ['add', 'যোগ', 'নতুন এলিমেন্ট'], ['sections', 'সেকশন', 'অন/অফ ও ক্রম'], ['more', 'আরও', 'টুলস']];
  function syncTabs() { $$('.pdd-tab').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === S.tab); }); }
  var renderedTab = '';
  function renderPanel() {
    var body = $('#pdd-body'); if (!body) return;
    var sc = renderedTab === S.tab ? body.scrollTop : 0;
    renderedTab = S.tab;
    body.textContent = '';
    syncTabs();
    if (S.tab === 'site') renderSiteTab(body);
    else if (S.tab === 'element') renderElementTab(body);
    else if (S.tab === 'add') renderAddTab(body);
    else if (S.tab === 'sections') renderSectionsInto(body);
    else renderMoreTab(body);
    body.scrollTop = sc;
    refreshBar();
  }
  function refreshBar() {
    var st = $('#pdd-status'); if (!st) return;
    var liveSame = S.live && JSON.stringify(stripStamp(S.live)) === JSON.stringify(stripStamp(S.cfg));
    if (S.dirty) { st.textContent = '● অসংরক্ষিত পরিবর্তন আছে'; st.className = 'pdd-status warn'; }
    else if (liveSame) { st.textContent = '✓ লাইভ সাইটের সাথে মিলছে'; st.className = 'pdd-status ok'; }
    else if (S.draftSaved) { st.textContent = '✓ ড্রাফট সেভ আছে (এখনো লাইভ নয়)'; st.className = 'pdd-status mid'; }
    else { st.textContent = 'পরিবর্তন নেই'; st.className = 'pdd-status'; }
    var u = $('#pdd-undo'), r = $('#pdd-redo');
    if (u) u.disabled = !S.undo.length; if (r) r.disabled = !S.redo.length;
  }
  function stripStamp(c) { var o = clone(c || {}); delete o.updatedAt; return o; }

  /* ============ সেভ ও পাবলিশ ============ */
  function saveDraft(silent) {
    var c = clone(S.cfg); c.updatedAt = new Date().toISOString();
    return dbSet('design_draft', c).then(function (r) {
      if (r.error) { toast('ড্রাফট সেভ হয়নি: ' + errMsg(r)); return false; }
      S.cfg.updatedAt = c.updatedAt; S.dirty = false; S.draftSaved = true;
      try { localStorage.removeItem('pdd-unsaved'); localStorage.removeItem('pdd-autosave'); } catch (e) {}
      refreshBar(); if (!silent) toast('ড্রাফট সেভ হয়েছে (লাইভ সাইট বদলায়নি)');
      return true;
    });
  }
  function publish() {
    AdminUI.showConfirm('পাবলিশ করবেন?', 'এখনকার ডিজাইন সাথে সাথে সবার জন্য লাইভ সাইটে চালু হবে। আগের লাইভ ভার্সন "আরও" ট্যাবে ফেরত আনার জন্য জমা থাকবে।', function () {
      var btn = $('#pdd-publish'); btn.disabled = true; btn.textContent = 'পাবলিশ হচ্ছে…';
      var c = clone(S.cfg); c.updatedAt = new Date().toISOString(); c.v = 1;
      var prevLive = S.live ? clone(S.live) : null;
      var steps = Promise.resolve();
      if (prevLive) steps = dbSet('design_prev', prevLive);
      steps.then(function () { return dbSet('design_live', c); }).then(function (r) {
        if (r && r.error) throw r.error;
        return dbSet('design_draft', c);
      }).then(function () {
        S.cfg.updatedAt = c.updatedAt; S.live = clone(c); if (prevLive) S.prev = prevLive;
        S.dirty = false; S.draftSaved = true;
        try { localStorage.removeItem('pdd-unsaved'); localStorage.removeItem('pdd-autosave'); } catch (e) {}
        refreshBar(); renderPanel(); updateLaunchCard();
        toast('🚀 পাবলিশ হয়েছে! সাইটে এখন নতুন ডিজাইন');
        return checkDb(false);
      }).catch(function (e) { toast('পাবলিশ হয়নি: ' + (e && e.message ? e.message : 'অজানা সমস্যা')); })
        .then(function () { btn.disabled = false; btn.textContent = '🚀 পাবলিশ'; });
    });
  }

  /* ============ স্টুডিওর কাঠামো ============ */
  function buildShell() {
    root = h('div', { id: 'pdd', class: 'pdd', role: 'dialog', 'aria-label': 'সাইট ডিজাইনার' });
    root.innerHTML =
      '<div class="pdd-top">' +
        '<button class="pdd-iconbtn" id="pdd-close" title="ডিজাইনার বন্ধ করুন">✕</button>' +
        '<div class="pdd-title"><b>সাইট ডিজাইনার</b><small>পত্রদ্বীপ</small></div>' +
        '<select id="pdd-page" class="pdd-select" title="কোন পেজ সাজাবেন"></select>' +
        '<div class="pdd-group" id="pdd-devs">' +
          '<button data-dev="desktop" title="পিসি">💻<span>পিসি</span></button><button data-dev="tablet" title="ট্যাবলেট">▭<span>ট্যাব</span></button><button data-dev="mobile" title="মোবাইল">📱<span>মোবাইল</span></button>' +
        '</div>' +
        '<div class="pdd-group" id="pdd-themes"><button data-theme="light" title="দিনের (লাইট) মোড">☀</button><button data-theme="dark" title="রাতের (ডার্ক) মোড">🌙</button></div>' +
        '<div class="pdd-group" id="pdd-modes"><button data-mode="edit" title="ক্লিক করে সাজান">✏<span>সাজান</span></button><button data-mode="browse" title="লিংকে ক্লিক করে ঘুরে দেখুন">🧭<span>ব্রাউজ</span></button></div>' +
        '<div class="pdd-group"><button id="pdd-undo" title="পূর্বাবস্থা (Ctrl+Z)">↶</button><button id="pdd-redo" title="আবার (Ctrl+Y)">↷</button></div>' +
        '<span class="pdd-status" id="pdd-status"></span>' +
        '<div class="pdd-sp"></div>' +
        '<button class="pdd-btn" id="pdd-savedraft">💾 ড্রাফট সেভ</button>' +
        '<button class="pdd-btn primary" id="pdd-publish">🚀 পাবলিশ</button>' +
      '</div>' +
      '<div class="pdd-main">' +
        '<aside class="pdd-side"><div class="pdd-tabs" id="pdd-tabs"></div><div class="pdd-bodywrap"><div class="pdd-body" id="pdd-body"></div></div></aside>' +
        '<section class="pdd-stage" id="pdd-stage">' +
          '<div class="pdd-zoomlabel" id="pdd-zoomlabel"></div>' +
          '<div class="pdd-holder" id="pdd-holder"><div class="pdd-wrap" id="pdd-wrap">' +
            '<iframe id="pdd-frame" name="pdd-preview" title="সাইটের প্রিভিউ"></iframe>' +
            '<div class="pdd-box-h" id="pdd-hover"><span></span></div><div class="pdd-box-s" id="pdd-selbox"><span></span></div>' +
          '</div></div>' +
        '</section>' +
      '</div>';
    document.body.appendChild(root);
    // পেজ তালিকা
    var ps = $('#pdd-page');
    PAGES.forEach(function (p) { ps.appendChild(h('option', { value: p.f, text: p.n })); });
    // ট্যাব বাটন
    var tb = $('#pdd-tabs');
    TABS.forEach(function (t) { tb.appendChild(h('button', { class: 'pdd-tab', 'data-tab': t[0], title: t[2], text: t[1], onclick: function () { S.tab = t[0]; renderPanel(); } })); });
    ifr = $('#pdd-frame');
    ifr.addEventListener('load', onFrameLoad);
    // ইভেন্ট
    $('#pdd-close').addEventListener('click', closeStudio);
    ps.addEventListener('change', function () { gotoPage(ps.value); });
    $$('#pdd-devs button').forEach(function (b) { b.addEventListener('click', function () { S.device = b.getAttribute('data-dev'); markGroups(); fit(); }); });
    $$('#pdd-themes button').forEach(function (b) { b.addEventListener('click', function () { S.theme = b.getAttribute('data-theme'); markGroups(); previewApply(); }); });
    $$('#pdd-modes button').forEach(function (b) { b.addEventListener('click', function () { S.mode = b.getAttribute('data-mode'); if (S.mode === 'browse') { S.hoverEl = null; } markGroups(); setModeAttr(); drawBoxes(); }); });
    $('#pdd-undo').addEventListener('click', undo);
    $('#pdd-redo').addEventListener('click', redo);
    $('#pdd-savedraft').addEventListener('click', function () { saveDraft(false); });
    $('#pdd-publish').addEventListener('click', publish);
    window.addEventListener('resize', function () { if (root && root.classList.contains('open')) fit(); });
    document.addEventListener('keydown', function (e) {
      if (!root || !root.classList.contains('open')) return;
      var tag = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag) && !(e.ctrlKey || e.metaKey)) { if (e.key === 'Escape') e.target.blur(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !/INPUT|TEXTAREA/.test(tag)) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !/INPUT|TEXTAREA/.test(tag)) { e.preventDefault(); redo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveDraft(false); }
      else if (e.key === 'Escape') { selectEl(null); }
    });
    setInterval(function () { if (root.classList.contains('open')) drawBoxes(); }, 250);
    markGroups();
  }
  function markGroups() {
    $$('#pdd-devs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-dev') === S.device); });
    $$('#pdd-themes button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-theme') === S.theme); });
    $$('#pdd-modes button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mode') === S.mode); });
    root.setAttribute('data-mode', S.mode);
  }
  function gotoPage(f) {
    var pg = PAGES.filter(function (p) { return p.f === f; })[0];
    S.page = f; S.query = ''; S.el = null; S.sel = '';
    if (!pg || !pg.q) { loadFrame(); return; }
    toast('নমুনা পাতা খোঁজা হচ্ছে…');
    PD.db.from(pg.q.t).select(pg.q.c).limit(1).then(function (r) {
      var v = r && r.data && r.data[0] && r.data[0][pg.q.c];
      if (v) S.query = '?' + pg.q.k + '=' + encodeURIComponent(v); else toast('নমুনা পাওয়া যায়নি — হোম থেকে "ব্রাউজ" মোডে ঘুরে এই পাতায় যান');
      loadFrame();
    }, function () { loadFrame(); });
  }

  /* ============ খোলা ও বন্ধ ============ */
  function openStudio() {
    if (!root) buildShell();
    root.classList.add('open'); document.body.classList.add('pdd-lock');
    renderPanel();
    toast('ডিজাইন লোড হচ্ছে…');
    dbGet(['design_live', 'design_draft', 'design_prev']).then(function (r) {
      var m = {};
      (r.data || []).forEach(function (x) { m[x.key] = x.value; });
      if (r.error) toast('ডেটাবেস পড়া যায়নি: ' + errMsg(r));
      S.live = m.design_live || null; S.prev = m.design_prev || null;
      var start = m.design_draft || m.design_live || emptyCfg();
      var restored = false;
      try {
        var au = localStorage.getItem('pdd-autosave');
        if (au && localStorage.getItem('pdd-unsaved') === '1') { var o = JSON.parse(au); if (o && Array.isArray(o.rules)) { start = o; restored = true; } }
      } catch (e) {}
      S.cfg = normalize(clone(start));
      S.draftSaved = !!m.design_draft && !restored; S.dirty = restored; S.undo = []; S.redo = [];
      refreshBar(); renderPanel();
      gotoPage(S.page);
      if (restored) setTimeout(function () { toast('আগের অসংরক্ষিত পরিবর্তন ফিরিয়ে আনা হয়েছে'); }, 900);
      updateLaunchCard();
    });
    setTimeout(fit, 60);
  }
  function normalize(c) {
    c.v = 1; c.g = c.g || {}; c.g.colors = c.g.colors || {}; c.g.colors.light = c.g.colors.light || {}; c.g.colors.dark = c.g.colors.dark || {}; c.g.typo = c.g.typo || {};
    c.rules = c.rules || []; c.adds = c.adds || []; c.moves = c.moves || [];
    return c;
  }
  function closeStudio() {
    function done() { root.classList.remove('open'); document.body.classList.remove('pdd-lock'); ifr.removeAttribute('src'); S.el = null; S.sel = ''; }
    if (S.dirty) AdminUI.showConfirm('অসংরক্ষিত পরিবর্তন আছে', 'ড্রাফট সেভ না করেই বন্ধ করবেন? (পরিবর্তনগুলো এই ব্রাউজারে জমা থাকবে, পরে খুললে ফিরে আসবে)', done);
    else done();
  }
  function updateLaunchCard() {
    var el = document.getElementById('pdd-launch-status'); if (!el) return;
    el.textContent = S.live && S.live.updatedAt ? 'শেষ পাবলিশ: ' + new Date(S.live.updatedAt).toLocaleString('bn-BD') : 'এখনো কোনো কাস্টম ডিজাইন পাবলিশ হয়নি — সাইট আগের মতোই চলছে।';
  }

  function init() {
    var b = document.getElementById('pdd-open');
    if (b) b.addEventListener('click', openStudio);
    document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-open-designer]'); if (t) openStudio(); });
    PD.ready && PD.ready.then(function () {
      dbGet(['design_live']).then(function (r) { var x = r.data && r.data[0]; if (x) S.live = x.value; updateLaunchCard(); }, function () {});
    });
    window.PDDesigner = { open: openStudio, state: S };
  }
  init();
})();
