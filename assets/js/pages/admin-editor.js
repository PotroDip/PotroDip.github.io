/* admin-editor.js — প্রফেশনাল লেখা সম্পাদক (v21)
   ভাসমান টুলবার: অনুচ্ছেদ/শিরোনাম, ফন্ট, সাইজ, বোল্ড-ইটালিক-আন্ডারলাইন-স্ট্রাইক, লেখার রং, হাইলাইট,
   সাবস্ক্রিপ্ট/সুপারস্ক্রিপ্ট, অ্যালাইনমেন্ট, তালিকা, ইনডেন্ট, লাইন-স্পেস, উদ্ধৃতি, কোড, বিভাজক, লিংক, ফরম্যাট মুছুন */
(function () {
  'use strict';
  var artBody = document.getElementById('art-body');
  var toolbar = document.getElementById('art-toolbar');
  if (!toolbar || !artBody) return;
  var doc = document, UI = window.PDUI;

  /* ---------- ধ্রুবক ---------- */
  var SIZES = [10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28, 32, 36, 42, 48, 60, 72];
  var FONTS = [
    { k: '', n: 'ডিফল্ট ফন্ট', v: '' },
    { k: 'gunjoron', n: 'গুঞ্জরণ', v: "'Gunjoron', serif" },
    { k: 'georgia', n: 'সেরিফ (ক্লাসিক)', v: "Georgia, 'Noto Serif Bengali', 'Times New Roman', serif" },
    { k: 'noto sans bengali', n: 'সান-সেরিফ (আধুনিক)', v: "'Noto Sans Bengali', 'Segoe UI', 'Nirmala UI', Arial, sans-serif" },
    { k: 'courier new', n: 'মনোস্পেস (কোড)', v: "'Courier New', Consolas, monospace" },
    { k: 'segoe script', n: 'হাতের লেখা', v: "'Segoe Script', 'Bradley Hand', cursive" }
  ];
  var BLOCKS = [
    { t: 'p', n: 'সাধারণ অনুচ্ছেদ', s: 'font-size:15px' },
    { t: 'h2', n: 'শিরোনাম ১', s: 'font-size:22px;font-weight:700' },
    { t: 'h3', n: 'শিরোনাম ২', s: 'font-size:19px;font-weight:700' },
    { t: 'h4', n: 'শিরোনাম ৩', s: 'font-size:16px;font-weight:700' },
    { t: 'blockquote', n: 'উদ্ধৃতি', s: 'font-style:italic' },
    { t: 'pre', n: 'কোড ব্লক', s: 'font-family:monospace;font-size:13px' }
  ];
  var BLOCK_LBL = { p: 'সাধারণ অনুচ্ছেদ', h2: 'শিরোনাম ১', h3: 'শিরোনাম ২', h4: 'শিরোনাম ৩', blockquote: 'উদ্ধৃতি', pre: 'কোড ব্লক', ul: 'তালিকা', ol: 'তালিকা', li: 'তালিকা' };
  var LH = [{ v: '', n: 'ডিফল্ট' }, { v: '1.3', n: '১.৩ — ঘন' }, { v: '1.6', n: '১.৬' }, { v: '1.85', n: '১.৮৫ — আরামদায়ক' }, { v: '2.2', n: '২.২ — খোলা' }, { v: '2.8', n: '২.৮ — অনেক খোলা' }];
  var PALETTE = (function () {
    var rows = [
      ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff'],
      ['#7f1d1d', '#9a3412', '#854d0e', '#166534', '#115e59', '#1e3a8a', '#3730a3', '#6b21a8', '#9d174d', '#5a3f2d'],
      ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#2563eb', '#4f46e5', '#9333ea', '#db2777', '#92400e'],
      ['#f87171', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#60a5fa', '#818cf8', '#c084fc', '#f472b6', '#d6a779'],
      ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#99f6e4', '#bfdbfe', '#c7d2fe', '#e9d5ff', '#fbcfe8', '#f1e4d3']
    ];
    return rows;
  })();

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }
  function toast(m) { try { if (window.PD && window.PD.toast) window.PD.toast(m, 1); else alert(m); } catch (e) { alert(m); } }

  /* ---------- আইকন ---------- */
  function ic(inner) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'; }
  var CHEV = '<svg class="rt-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  var I = {
    left: ic('<path d="M3 6h18M3 12h12M3 18h16"/>'),
    center: ic('<path d="M3 6h18M7 12h10M5 18h14"/>'),
    right: ic('<path d="M3 6h18M9 12h12M5 18h16"/>'),
    justify: ic('<path d="M3 6h18M3 12h18M3 18h18"/>'),
    ul: ic('<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>'),
    ol: ic('<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'),
    indent: ic('<path d="M3 6h18M11 12h10M11 18h10M3 9l3 3-3 3"/>'),
    outdent: ic('<path d="M3 6h18M11 12h10M11 18h10M6 9l-3 3 3 3"/>'),
    lh: ic('<path d="M5 4v16M2.5 7L5 4l2.5 3M2.5 17L5 20l2.5-3"/><path d="M12 7h9M12 12h9M12 17h9"/>'),
    quote: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.5 3C6 3 4 6 4 9.5V16c0 1.66 1.34 3 3 3h.5c1.66 0 3-1.34 3-3v-3c0-1.66-1.34-3-3-3H6.1C6.5 5.5 8 4 9.5 4V3zM19 3c-3.5 0-5.5 3-5.5 6.5V16c0 1.66 1.34 3 3 3h.5c1.66 0 3-1.34 3-3v-3c0-1.66-1.34-3-3-3h-1.4c.4-3.5 1.9-5 3.4-5V3z"/></svg>',
    code: ic('<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>'),
    hr: ic('<path d="M3 12h18"/><path d="M8 6h8M8 18h8" opacity=".45"/>'),
    link: ic('<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>'),
    unlink: ic('<path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-.12-7.07 5 5 0 0 0-6.95 0l-1.72 1.71"/><path d="m5.17 11.75-1.71 1.71a5 5 0 0 0 .12 7.07 5 5 0 0 0 6.95 0l1.71-1.71"/><path d="M8 2v3M2 8h3M16 19v3M19 16h3"/>'),
    clear: ic('<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/><path d="M4 4l16 16"/>'),
    pen: ic('<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>')
  };

  function btn(act, title, inner, cls) {
    return '<button type="button" class="rt-btn' + (cls ? ' ' + cls : '') + '" data-act="' + act + '" title="' + esc(title) + '" aria-label="' + esc(title.replace(/\s*\(.*\)$/, '')) + '">' + inner + '</button>';
  }
  function menu(name, title, inner, cls) {
    return '<button type="button" class="rt-btn rt-menu' + (cls ? ' ' + cls : '') + '" data-menu="' + name + '" title="' + esc(title) + '" aria-label="' + esc(title) + '" aria-haspopup="true">' + inner + CHEV + '</button>';
  }
  function group(html) { return '<div class="rt-group">' + html + '</div>'; }

  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'লেখা সম্পাদনার টুলবার');
  toolbar.innerHTML =
    group(
      menu('block', 'অনুচ্ছেদ ও শিরোনামের ধরন', '<span class="rt-lbl" id="rt-block-lbl">সাধারণ অনুচ্ছেদ</span>', 'rt-w-block') +
      menu('font', 'ফন্ট বদলান (নির্বাচিত অংশে)', '<span class="rt-lbl" id="rt-font-lbl">গুঞ্জরণ</span>', 'rt-w-font')
    ) +
    group(
      btn('size-dec', 'লেখা ছোট করুন', '<span class="rt-txt">−</span>') +
      '<input type="text" class="rt-size-in" id="rt-size-in" inputmode="numeric" value="16" title="লেখার সাইজ (px) — লিখে Enter চাপুন" aria-label="লেখার সাইজ">' +
      btn('size-inc', 'লেখা বড় করুন', '<span class="rt-txt">+</span>') +
      menu('size', 'সাইজের তালিকা', '<span class="rt-sr">সাইজ</span>', 'rt-chev-only')
    ) +
    group(
      btn('bold', 'বোল্ড (Ctrl+B)', '<span class="rt-txt rt-b">B</span>') +
      btn('italic', 'ইটালিক (Ctrl+I)', '<span class="rt-txt rt-i">I</span>') +
      btn('underline', 'আন্ডারলাইন (Ctrl+U)', '<span class="rt-txt rt-u">U</span>') +
      btn('strike', 'কাটা দাগ', '<span class="rt-txt rt-s">S</span>')
    ) +
    group(
      menu('color', 'লেখার রং', '<span class="rt-txt rt-a">A</span><i class="rt-bar" id="rt-bar-color"></i>', 'rt-colorbtn') +
      menu('hl', 'হাইলাইট (লেখার পেছনের রং)', I.pen + '<i class="rt-bar" id="rt-bar-hl"></i>', 'rt-colorbtn') +
      btn('sub', 'সাবস্ক্রিপ্ট (নিচে ছোট)', '<span class="rt-txt rt-sc">x<sub>২</sub></span>') +
      btn('sup', 'সুপারস্ক্রিপ্ট (উপরে ছোট)', '<span class="rt-txt rt-sc">x<sup>২</sup></span>')
    ) +
    group(
      btn('left', 'বামে সাজান', I.left) +
      btn('center', 'মাঝখানে সাজান', I.center) +
      btn('right', 'ডানে সাজান', I.right) +
      btn('justify', 'দুই পাশে সমান (জাস্টিফাই)', I.justify)
    ) +
    group(
      btn('ul', 'বুলেট তালিকা', I.ul) +
      btn('ol', 'নম্বর তালিকা', I.ol) +
      btn('outdent', 'ভেতর থেকে বের করুন', I.outdent) +
      btn('indent', 'ভেতরে ঢোকান (ইনডেন্ট)', I.indent) +
      menu('lh', 'লাইনের ফাঁক', I.lh)
    ) +
    group(
      btn('quote', 'উদ্ধৃতি', I.quote) +
      btn('code', 'কোড ব্লক', I.code) +
      btn('hr', 'আড়াআড়ি বিভাজক রেখা', I.hr) +
      btn('link', 'লিংক যুক্ত করুন (Ctrl+K)', I.link) +
      btn('unlink', 'লিংক সরান', I.unlink)
    ) +
    group(btn('clear', 'সব ফরম্যাট মুছে ফেলুন', I.clear));

  var sizeIn = doc.getElementById('rt-size-in');

  /* ---------- সিলেকশন সামলানো ---------- */
  var lastRange = null;
  function inEditor(n) { return !!n && artBody.contains(n); }
  doc.addEventListener('selectionchange', function () {
    var s = window.getSelection();
    if (s && s.rangeCount) {
      var r = s.getRangeAt(0);
      if (inEditor(r.commonAncestorContainer)) { lastRange = r.cloneRange(); scheduleState(); }
    }
  });
  function restoreSel() {
    if (!lastRange || !inEditor(lastRange.commonAncestorContainer)) { lastRange = null; return; }
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(lastRange);
  }
  function focusEd() {
    var s = window.getSelection();
    if (doc.activeElement === artBody && s.rangeCount && inEditor(s.getRangeAt(0).commonAncestorContainer)) return;
    artBody.focus({ preventScroll: true }); restoreSel();
  }
  function curRange() { var s = window.getSelection(); return s.rangeCount ? s.getRangeAt(0) : null; }
  function exec(c, v, css) {
    try { doc.execCommand('styleWithCSS', false, !!css); } catch (e) {}
    try { return doc.execCommand(c, false, v == null ? null : v); } catch (e) { return false; }
  }
  function fixNesting() {
    [].slice.call(artBody.querySelectorAll('p > ul, p > ol, p > pre, p > blockquote, p > hr, p > h2, p > h3, p > h4')).forEach(function (c) {
      var p = c.parentNode; if (p.parentNode !== artBody) return;
      var only = [].every.call(p.childNodes, function (n) { return n === c || (n.nodeType === 3 && !n.nodeValue.trim()); });
      if (only) { var sel = window.getSelection(), keep = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null; artBody.replaceChild(c, p); if (keep) { try { sel.removeAllRanges(); sel.addRange(keep); } catch (e) {} } }
    });
  }
  function changed() {
    fixNesting();
    artBody.dispatchEvent(new Event('input', { bubbles: true }));
    scheduleState();
  }
  function cmd(c, v, css) { focusEd(); exec(c, v, css); changed(); }
  function elOf(n) { return n && (n.nodeType === 1 ? n : n.parentNode); }
  function selEl() {
    var r = curRange(); if (!r || !inEditor(r.startContainer)) return null;
    var e = elOf(r.startContainer);
    if (e === artBody) e = artBody.children[Math.min(r.startOffset, artBody.children.length - 1)] || artBody;
    return e;
  }
  function topBlock() {
    var e = selEl(); if (!e) return '';
    while (e && e.parentNode !== artBody) e = e.parentNode;
    return e && e !== artBody ? e.tagName.toLowerCase() : '';
  }

  /* ---------- ইনলাইন স্টাইল প্রয়োগ (সাইজ/ফন্ট/রং/হাইলাইট) ----------
     কৌশল: ব্রাউজারের hiliteColor দিয়ে একটি গোপন "মার্কার" span বানিয়ে নিই, তারপর সেটাকে আসল স্টাইলে বদলাই। */
  var MARK = 'rgb(2, 3, 4)';
  var pending = {}, applying = false;
  function unwrap(el) { var p = el.parentNode; if (!p) return; while (el.firstChild) p.insertBefore(el.firstChild, el); p.removeChild(el); }
  function textNodesIn(root) {
    var w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), out = [], n;
    while ((n = w.nextNode())) out.push(n);
    return out;
  }
  function stripProp(root, prop) {
    [].slice.call(root.querySelectorAll('[style]')).forEach(function (el) {
      el.style.removeProperty(prop);
      if (!el.getAttribute('style')) { el.removeAttribute('style'); if (el.tagName === 'SPAN') unwrap(el); }
    });
  }
  function markers() {
    return [].slice.call(artBody.querySelectorAll('[style]')).filter(function (el) { return el.style.backgroundColor === MARK; });
  }
  function convertMarks(map) {
    var list = markers(), texts = [];
    list.forEach(function (el) {
      texts = texts.concat(textNodesIn(el));
      el.style.removeProperty('background-color');
      Object.keys(map).forEach(function (p) {
        stripProp(el, p);
        if (map[p]) el.style.setProperty(p, map[p]);
      });
      if (!el.getAttribute('style')) { el.removeAttribute('style'); if (el.tagName === 'SPAN') unwrap(el); }
    });
    return texts;
  }
  function applyInline(prop, value) {
    focusEd();
    var r = curRange(); if (!r) return;
    var map = {}; map[prop] = value;
    var collapsed = r.collapsed;
    if (collapsed) pending = map;
    applying = true; exec('hiliteColor', '#020304', true); applying = false;
    var texts = collapsed ? [] : convertMarks(map);
    var live = texts.filter(function (t) { return t.parentNode && artBody.contains(t); });
    if (live.length) {
      var nr = doc.createRange(), a = live[0], b = live[live.length - 1];
      nr.setStart(a, 0); nr.setEnd(b, b.nodeValue.length);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(nr);
    }
    changed();
  }
  /* কার্সার খালি জায়গায় থাকলে — এরপর টাইপ করা লেখায় স্টাইল বসানো */
  artBody.addEventListener('input', function () {
    if (!applying && markers().length) {
      var map = pending; pending = {};
      var sel = window.getSelection(), texts = convertMarks(map).filter(function (t) { return t.parentNode; });
      if (texts.length) {
        var last = texts[texts.length - 1], nr = doc.createRange();
        nr.setStart(last, last.nodeValue.length); nr.collapse(true);
        sel.removeAllRanges(); sel.addRange(nr);
      }
    }
  });
  ['mousedown', 'touchstart'].forEach(function (ev) { artBody.addEventListener(ev, function () { pending = {}; }, { passive: true }); });
  artBody.addEventListener('keydown', function (e) { if (/^Arrow|Home|End|Page/.test(e.key)) pending = {}; });

  /* ---------- সাইজ, ফন্ট, রং ---------- */
  function currentSize() {
    var e = selEl(); if (!e) return 16;
    return Math.round(parseFloat(window.getComputedStyle(e).fontSize) || 16);
  }
  function applySize(px) {
    px = Math.max(8, Math.min(140, Math.round(px)));
    sizeIn.value = px;
    applyInline('font-size', px + 'px');
  }
  function stepSize(dir) {
    var cur = currentSize(), i, n = cur;
    if (dir > 0) { for (i = 0; i < SIZES.length; i++) if (SIZES[i] > cur) { n = SIZES[i]; break; } if (n === cur) n = Math.min(140, cur + 8); }
    else { for (i = SIZES.length - 1; i >= 0; i--) if (SIZES[i] < cur) { n = SIZES[i]; break; } if (n === cur) n = Math.max(8, cur - 1); }
    applySize(n);
  }
  var lastColor = '', lastHl = '';
  function applyColor(prop, v) {
    if (prop === 'color') lastColor = v; else lastHl = v;
    paintBars();
    applyInline(prop, v);
  }
  function paintBars() {
    var c = doc.getElementById('rt-bar-color'), h = doc.getElementById('rt-bar-hl');
    if (c) c.style.background = lastColor || 'var(--text)';
    if (h) h.style.background = lastHl || '#facc15';
  }

  /* ---------- ব্লক (অনুচ্ছেদ/শিরোনাম/উদ্ধৃতি/কোড) ---------- */
  function applyBlock(tag) {
    focusEd();
    var cur = topBlock();
    if ((tag === 'blockquote' || tag === 'pre') && cur === tag) tag = 'p';
    exec('formatBlock', '<' + tag + '>', false);
    changed();
  }
  var BLOCK_SEL = 'p,h2,h3,h4,blockquote,pre,li,div';
  function leafBlocks() {
    var r = curRange(); if (!r) return [];
    var all = [].slice.call(artBody.querySelectorAll(BLOCK_SEL));
    return all.filter(function (b) { return r.intersectsNode(b) && !b.querySelector(BLOCK_SEL); });
  }
  function applyBlockStyle(prop, v) {
    focusEd();
    var bl = leafBlocks();
    if (!bl.length) { exec('formatBlock', '<p>', false); bl = leafBlocks(); }
    bl.forEach(function (b) {
      if (v) b.style.setProperty(prop, v); else b.style.removeProperty(prop);
      if (!b.getAttribute('style')) b.removeAttribute('style');
    });
    changed();
  }
  function indentBlocks(dir) {
    focusEd();
    var e = selEl();
    if (e && e.closest && e.closest('li')) { exec(dir > 0 ? 'indent' : 'outdent', null, false); changed(); return; }
    var bl = leafBlocks();
    if (!bl.length) { exec('formatBlock', '<p>', false); bl = leafBlocks(); }
    bl.forEach(function (b) {
      var cur = parseInt(b.style.marginLeft, 10) || 0, n = Math.max(0, Math.min(240, cur + dir * 32));
      if (n) b.style.marginLeft = n + 'px'; else b.style.removeProperty('margin-left');
      if (!b.getAttribute('style')) b.removeAttribute('style');
    });
    changed();
  }
  function clearAll() {
    focusEd();
    exec('removeFormat', null, false);
    var r = curRange();
    if (r) {
      [].slice.call(artBody.querySelectorAll('mark,span,font,u,s,sub,sup,strong,em,code')).forEach(function (m) { if (r.intersectsNode(m) && !r.collapsed) unwrap(m); });
      leafBlocks().forEach(function (b) { b.removeAttribute('style'); });
    }
    if (/^(h2|h3|h4|blockquote|pre)$/.test(topBlock())) exec('formatBlock', '<p>', false);
    changed();
  }

  /* ---------- লিংক ---------- */
  function normUrl(v) {
    v = (v || '').trim(); if (!v) return '';
    if (/^(https?:|mailto:)/i.test(v)) return v;
    if (/^\/\//.test(v)) return 'https:' + v;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'mailto:' + v;
    if (/^[a-z][a-z0-9+.\-]*:/i.test(v)) return '';
    return 'https://' + v;
  }
  function anchorAtSel() { var e = selEl(); return e && e.closest ? e.closest('a') : null; }
  function openLink(btnEl) {
    var r = curRange() || lastRange; if (r) lastRange = r.cloneRange ? r.cloneRange() : r;
    var a = anchorAtSel(), collapsed = lastRange ? lastRange.collapsed : true;
    var html = '<div class="rte-pop-form">' +
      (collapsed && !a ? '<label>লিংকের লেখা<input type="text" id="rt-l-text" placeholder="যেমন: আরও পড়ুন"></label>' : '') +
      '<label>ঠিকানা (URL)<input type="text" id="rt-l-url" placeholder="https://example.com" value="' + esc(a ? a.getAttribute('href') || '' : '') + '"></label>' +
      '<div class="rte-pop-row"><button type="button" class="rt-primary" data-go="1">' + (a ? 'হালনাগাদ করুন' : 'লিংক দিন') + '</button>' +
      (a ? '<button type="button" class="rt-ghost" data-rm="1">লিংক সরান</button>' : '') + '</div></div>';
    showPop(btnEl || toolbar.querySelector('[data-act="link"]'), html, 'rte-pop-link', 'link');
    setTimeout(function () { var f = doc.getElementById(collapsed && !a ? 'rt-l-text' : 'rt-l-url'); if (f) f.focus(); }, 30);
  }
  function applyLink() {
    var urlEl = doc.getElementById('rt-l-url'), txtEl = doc.getElementById('rt-l-text');
    var url = normUrl(urlEl ? urlEl.value : '');
    if (!url) { toast('সঠিক লিংক লিখুন (যেমন https://example.com)'); return; }
    var a = (restoreSel(), focusEd(), anchorAtSel());
    if (a) { a.setAttribute('href', url); }
    else if (txtEl) {
      var t = (txtEl.value || '').trim() || url;
      var el = doc.createElement('a'); el.setAttribute('href', url); el.textContent = t;
      exec('insertHTML', el.outerHTML + '&nbsp;', false);
    } else { exec('createLink', url, false); }
    closePop(); changed();
  }
  function removeLink() {
    restoreSel(); focusEd();
    var a = anchorAtSel(), r = curRange();
    if (a && r && r.collapsed) { var nr = doc.createRange(); nr.selectNodeContents(a); var s = window.getSelection(); s.removeAllRanges(); s.addRange(nr); }
    exec('unlink', null, false); closePop(); changed();
  }

  /* ---------- ভাসমান মেনু (পপ-ওভার) ---------- */
  var pop = null, popFor = null, popKind = '';
  function closePop() { if (pop) { pop.remove(); pop = null; } if (popFor) popFor.classList.remove('open'); popFor = null; popKind = ''; }
  function showPop(anchor, html, cls, kind) {
    var same = popFor === anchor && popKind === kind; closePop(); if (same && kind !== 'link') return;
    pop = doc.createElement('div'); pop.className = 'rte-pop ' + (cls || ''); pop.innerHTML = html;
    doc.body.appendChild(pop); popFor = anchor; popKind = kind; anchor.classList.add('open');
    var r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)), top = r.bottom + 6;
    if (top + h > window.innerHeight - 8) {
      if (r.top - h - 6 > 8) top = r.top - h - 6; else pop.style.maxHeight = Math.max(160, window.innerHeight - top - 8) + 'px';
    }
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }
  function itemsHtml(list, cur) {
    return list.map(function (x) {
      return '<button type="button" class="rte-pop-item' + (x.on ? ' on' : '') + '" data-v="' + esc(x.v) + '"><span style="' + esc(x.s || '') + '">' + esc(x.n) + '</span></button>';
    }).join('');
  }
  function colorPopHtml(isHl) {
    var g = PALETTE.map(function (row) {
      return row.map(function (c) { return '<button type="button" class="rt-sw" style="background:' + c + '" data-v="' + c + '" title="' + c + '" aria-label="' + c + '"></button>'; }).join('');
    }).join('');
    return '<button type="button" class="rte-pop-item rt-reset" data-v="">' + (isHl ? 'হাইলাইট সরান' : 'ডিফল্ট রং') + '</button>' +
      '<div class="rt-grid">' + g + '</div>' +
      '<label class="rt-custom"><span>নিজের পছন্দের রং</span><input type="color" id="rt-custom" value="' + (isHl ? '#fde047' : '#2563eb') + '"></label>';
  }
  function openMenu(name, anchor) {
    var cur;
    if (name === 'block') {
      cur = topBlock() || 'p';
      showPop(anchor, itemsHtml(BLOCKS.map(function (b) { return { v: b.t, n: b.n, s: b.s, on: b.t === cur }; })), 'rte-pop-list', 'block');
    } else if (name === 'font') {
      var fl = doc.getElementById('rt-font-lbl').textContent;
      showPop(anchor, itemsHtml(FONTS.map(function (f) { return { v: f.v, n: f.n, s: f.v ? 'font-family:' + f.v : '', on: f.n === fl }; })), 'rte-pop-list', 'font');
    } else if (name === 'size') {
      cur = currentSize();
      showPop(anchor, itemsHtml(SIZES.map(function (s) { return { v: String(s), n: bn(s), s: '', on: s === cur }; })), 'rte-pop-list rte-pop-sizes', 'size');
    } else if (name === 'lh') {
      showPop(anchor, itemsHtml(LH.map(function (x) { return { v: x.v, n: x.n, s: '' }; })), 'rte-pop-list', 'lh');
    } else if (name === 'color') {
      showPop(anchor, colorPopHtml(false), 'rte-pop-color', 'color');
    } else if (name === 'hl') {
      showPop(anchor, colorPopHtml(true), 'rte-pop-color', 'hl');
    }
  }
  doc.addEventListener('mousedown', function (e) {
    if (!pop) return;
    if (pop.contains(e.target)) { if (!/^(INPUT|LABEL|TEXTAREA)$/.test(e.target.tagName)) e.preventDefault(); return; }
    if (popFor && popFor.contains(e.target)) return;
    closePop();
  }, true);
  doc.addEventListener('touchstart', function (e) { if (pop && !pop.contains(e.target) && !(popFor && popFor.contains(e.target))) closePop(); }, { passive: true, capture: true });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop) { e.stopPropagation(); closePop(); } }, true);
  window.addEventListener('resize', closePop);
  doc.addEventListener('click', function (e) {
    if (!pop || !pop.contains(e.target)) return;
    var t = e.target.closest('[data-v],[data-go],[data-rm]'); if (!t) return;
    if (t.hasAttribute('data-go')) { applyLink(); return; }
    if (t.hasAttribute('data-rm')) { removeLink(); return; }
    var v = t.getAttribute('data-v'), k = popKind; closePop();
    if (k === 'block') applyBlock(v);
    else if (k === 'font') applyInline('font-family', v);
    else if (k === 'size') applySize(parseInt(v, 10));
    else if (k === 'lh') applyBlockStyle('line-height', v);
    else if (k === 'color') applyColor('color', v);
    else if (k === 'hl') applyColor('background-color', v);
  });
  doc.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'rt-custom' && pop) { var k = popKind, v = e.target.value; closePop(); restoreSel(); applyColor(k === 'hl' ? 'background-color' : 'color', v); }
  });
  doc.addEventListener('keydown', function (e) {
    if (pop && e.key === 'Enter' && e.target && /^rt-l-/.test(e.target.id || '')) { e.preventDefault(); applyLink(); }
  });

  /* ---------- টুলবারের ক্লিক ---------- */
  toolbar.addEventListener('mousedown', function (e) { if (e.target !== sizeIn) e.preventDefault(); }); /* সিলেকশন হারানো ঠেকাতে */
  var SIMPLE = {
    bold: ['bold'], italic: ['italic'], underline: ['underline'], strike: ['strikeThrough'], sub: ['subscript'], sup: ['superscript'],
    left: ['justifyLeft', null, true], center: ['justifyCenter', null, true], right: ['justifyRight', null, true], justify: ['justifyFull', null, true],
    ul: ['insertUnorderedList'], ol: ['insertOrderedList'], hr: ['insertHTML', '<hr><p><br></p>']
  };
  toolbar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !toolbar.contains(b)) return;
    var act = b.getAttribute('data-act'), mn = b.getAttribute('data-menu');
    if (mn) { focusEd(); if (popFor === b && popKind === mn) closePop(); else openMenu(mn, b); return; }
    closePop();
    if (act === 'hr') { focusEd(); var hs = window.getSelection(); if (hs.rangeCount && !hs.isCollapsed) hs.collapseToEnd(); exec('insertHTML', '<hr><p><br></p>', false); changed(); return; }
    if (SIMPLE[act]) { cmd.apply(null, SIMPLE[act]); return; }
    if (act === 'indent') indentBlocks(1);
    else if (act === 'outdent') indentBlocks(-1);
    else if (act === 'size-dec') stepSize(-1);
    else if (act === 'size-inc') stepSize(1);
    else if (act === 'quote') applyBlock('blockquote');
    else if (act === 'code') applyBlock('pre');
    else if (act === 'link') { focusEd(); openLink(b); }
    else if (act === 'unlink') { removeLink(); }
    else if (act === 'clear') clearAll();
  });
  /* সাইজ বক্সে হাতে লিখে Enter */
  sizeIn.addEventListener('focus', function () { sizeIn.select(); });
  sizeIn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); var n = parseInt(sizeIn.value, 10); if (n) { restoreSel(); artBody.focus({ preventScroll: true }); restoreSel(); applySize(n); } }
    else if (e.key === 'Escape') { artBody.focus({ preventScroll: true }); restoreSel(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); restoreSel(); artBody.focus({ preventScroll: true }); restoreSel(); stepSize(e.key === 'ArrowUp' ? 1 : -1); }
  });

  /* ---------- কীবোর্ড শর্টকাট ---------- */
  artBody.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      var r = curRange(), b = topBlock();
      if (r && r.collapsed && /^(blockquote|pre|h2|h3|h4)$/.test(b)) {
        var blk = selEl(); while (blk && blk.parentNode !== artBody) blk = blk.parentNode;
        if (blk && !blk.textContent.trim()) { e.preventDefault(); exec('formatBlock', '<p>', false); changed(); return; }
      }
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openLink(toolbar.querySelector('[data-act="link"]')); }
  });

  /* ---------- অবস্থা দেখানো (কোন বাটন চালু) ---------- */
  var raf = 0;
  function scheduleState() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; updateState(); }); }
  function setOn(act, on) { var b = toolbar.querySelector('[data-act="' + act + '"]'); if (b) { b.classList.toggle('is-active', !!on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); } }
  function qs(c) { try { return doc.queryCommandState(c); } catch (e) { return false; } }
  function updateState() {
    var e = selEl(); if (!e) return;
    var blk = topBlock() || 'p';
    var lbl = doc.getElementById('rt-block-lbl'); if (lbl) lbl.textContent = BLOCK_LBL[blk] || 'সাধারণ অনুচ্ছেদ';
    setOn('bold', qs('bold')); setOn('italic', qs('italic')); setOn('underline', qs('underline')); setOn('strike', qs('strikeThrough'));
    setOn('sub', qs('subscript')); setOn('sup', qs('superscript'));
    setOn('ul', qs('insertUnorderedList')); setOn('ol', qs('insertOrderedList'));
    setOn('left', qs('justifyLeft')); setOn('center', qs('justifyCenter')); setOn('right', qs('justifyRight')); setOn('justify', qs('justifyFull'));
    setOn('quote', blk === 'blockquote'); setOn('code', blk === 'pre'); setOn('link', !!anchorAtSel());
    var cs = window.getComputedStyle(e), fam = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim().toLowerCase(), fl = doc.getElementById('rt-font-lbl');
    var name = 'গুঞ্জরণ';
    FONTS.forEach(function (f) { if (f.k && fam === f.k) name = f.n; });
    if (fl) fl.textContent = fam && !FONTS.some(function (f) { return f.k && f.k === fam; }) ? (fam.charAt(0).toUpperCase() + fam.slice(1)) : name;
    if (doc.activeElement !== sizeIn) sizeIn.value = Math.round(parseFloat(cs.fontSize) || 16);
  }
  artBody.addEventListener('keyup', scheduleState);
  artBody.addEventListener('mouseup', scheduleState);
  artBody.addEventListener('focus', scheduleState);

  /* ---------- কাঠামো ঠিক রাখা + খালি অবস্থা ---------- */
  try { doc.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
  var composing = false;
  artBody.addEventListener('compositionstart', function () { composing = true; });
  artBody.addEventListener('compositionend', function () { composing = false; });
  var BLOCKTAG = /^(P|H2|H3|H4|BLOCKQUOTE|PRE|UL|OL|HR|DIV)$/;
  function hasBareInline() {
    for (var n = artBody.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.nodeValue.trim()) return true;
      if (n.nodeType === 1 && !BLOCKTAG.test(n.tagName)) return true;
    }
    return false;
  }
  function syncEmpty() {
    var empty = !artBody.textContent.trim() && !artBody.querySelector('hr,li');
    artBody.setAttribute('data-empty', empty ? '1' : '0');
  }
  artBody.addEventListener('input', function () {
    if (!composing && hasBareInline() && !markers().length) exec('formatBlock', '<p>', false);
    syncEmpty();
  });
  new MutationObserver(syncEmpty).observe(artBody, { childList: true });
  syncEmpty();

  /* ---------- পেস্ট: অন্য জায়গার ফরম্যাট ছেঁকে নিরাপদভাবে বসানো ---------- */
  /* Word/ওয়েব থেকে আসা ফন্ট, সাইজ, প্রায় কালো/সাদা রং বাদ — সাইটের নিজস্ব ছাঁদ ঠিক রাখতে */
  function toneDown(box) {
    [].slice.call(box.querySelectorAll('[style]')).forEach(function (el) {
      ['font-family', 'font-size', 'line-height', 'letter-spacing', 'margin-left'].forEach(function (p) { el.style.removeProperty(p); });
      var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(el.style.color || '');
      if (m) { var l = (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255; if (l < 0.18 || l > 0.9) el.style.removeProperty('color'); }
      var bg = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(el.style.backgroundColor || '');
      if (bg && (0.299 * bg[1] + 0.587 * bg[2] + 0.114 * bg[3]) / 255 > 0.97) el.style.removeProperty('background-color');
      if (!el.getAttribute('style')) { el.removeAttribute('style'); if (el.tagName === 'SPAN') { var f = document.createDocumentFragment(); while (el.firstChild) f.appendChild(el.firstChild); el.parentNode.replaceChild(f, el); } }
    });
  }
  artBody.addEventListener('paste', function (e) {
    var cd = e.clipboardData; if (!cd) return;
    var html = cd.getData('text/html'), txt = cd.getData('text/plain');
    e.preventDefault();
    if (html && UI && UI.sanitize) {
      var box = UI.sanitize(html);
      toneDown(box);
      if (box.textContent.trim() || box.querySelector('hr')) { exec('insertHTML', box.innerHTML, false); changed(); return; }
    }
    if (!txt) return;
    if (!/\n/.test(txt)) { exec('insertText', txt, false); changed(); return; }
    var h = txt.replace(/\r/g, '').split(/\n+/).map(function (l) { return l.trim() ? '<p>' + esc(l) + '</p>' : ''; }).join('');
    exec('insertHTML', h, false); changed();
  });

  /* ---------- ভাসমান টুলবার: স্ক্রোল করলে ছায়া ---------- */
  (function () {
    var scroller = toolbar.closest('.modal-body');
    if (!scroller || !('IntersectionObserver' in window)) return;
    var s = doc.createElement('div'); s.className = 'rte-sentinel'; s.setAttribute('aria-hidden', 'true');
    toolbar.parentNode.insertBefore(s, toolbar);
    new IntersectionObserver(function (en) { toolbar.classList.toggle('is-stuck', !en[0].isIntersecting); }, { root: scroller, threshold: [0, 1] }).observe(s);
  })();
  paintBars();
})();
