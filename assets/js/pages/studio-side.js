/* studio-side.js — বাম পাশের প্যানেল: লেয়ার, যোগ করুন, থিম-রং, পেজ + নিচের ব্রেডক্রাম্ব */
(function () {
  'use strict';
  var P = window.PDS, E = P.el;

  function svgI(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; }

  /* ================= ট্যাব ================= */
  function initTabs() {
    var tabs = document.querySelectorAll('#left-tabs button');
    [].forEach.call(tabs, function (t) {
      t.addEventListener('click', function () {
        [].forEach.call(tabs, function (x) { x.classList.toggle('on', x === t); });
        [].forEach.call(document.querySelectorAll('.left-pane'), function (p) { p.classList.toggle('on', p.id === 'pane-' + t.dataset.pane); });
        if (t.dataset.pane === 'layers') buildLayers();
        if (t.dataset.pane === 'pages') buildPages();
      });
    });
  }

  /* ================= লেয়ার ================= */
  var openSet = new WeakSet(), layersEl, lt = 0;
  var SKIP = /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|LINK|META|TITLE|HEAD)$/;
  function kids(el) {
    return [].filter.call(el.children, function (c) { return !SKIP.test(c.tagName) && c.id !== 'intro-overlay' && !c.hasAttribute('data-pd-editing') || c.hasAttribute('data-pd-editing'); }).filter(function (c) { return !SKIP.test(c.tagName) && c.id !== 'intro-overlay'; });
  }
  function ico(el) {
    var t = el.localName;
    if (/^h[1-6]$/.test(t) || t === 'p' || t === 'span' || t === 'label' || t === 'strong' || t === 'em') return svgI('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>');
    if (t === 'img') return svgI('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>');
    if (t === 'svg') return svgI('<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/>');
    if (t === 'a' || t === 'button') return svgI('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>');
    if (t === 'ul' || t === 'ol' || t === 'li') return svgI('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>');
    if (/^(header|footer|nav|main|section|article|aside)$/.test(t)) return svgI('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>');
    return svgI('<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 3"/>');
  }
  function buildLayers() {
    layersEl = layersEl || document.getElementById('layers-tree');
    var doc = P.mainDoc();
    if (!doc || !doc.body) { layersEl.innerHTML = '<p class="muted">পেজ লোড হচ্ছে…</p>'; return; }
    var body = doc.body;
    /* বাছাই করা এলিমেন্টের পূর্বপুরুষদের খোলা */
    openSet.add(body);
    var m = doc.getElementById('main-content'); if (m) openSet.add(m);
    P.sel.forEach(function (s) { var p = s.parentElement; while (p) { openSet.add(p); p = p.parentElement; } });
    var scroll = layersEl.scrollTop;
    layersEl.innerHTML = '';
    var hideKey = { b: 'd', t: 't', m: 'm' }[P.bp()];
    var count = 0;
    function row(el, depth) {
      if (count > 700) return;
      count++;
      var ks = kids(el), has = ks.length > 0, open = openSet.has(el);
      var edits = null; try { var u = P.uniq(el); var sc = P.design.pages[P.pk]; edits = (sc && sc.edits[u]) || P.design.global.edits[u]; } catch (e) {}
      var hid = !!(edits && (edits.del || (edits.hide && edits.hide[hideKey])));
      var r = E('div', { class: 'ly' + (P.sel.indexOf(el) > -1 ? ' sel' : '') + (hid ? ' off' : '') + (edits ? ' edited' : ''), style: 'padding-left:' + (6 + depth * 12) + 'px' });
      var tg = E('span', { class: 'tg' + (has ? (open ? ' open' : '') : ' none'), html: '▸' });
      tg.addEventListener('click', function (e) { e.stopPropagation(); if (open) openSet.delete(el); else openSet.add(el); buildLayers(); });
      r.appendChild(tg);
      r.appendChild(E('span', { class: 'ic', html: ico(el) }));
      r.appendChild(E('span', { class: 'nm', text: P.label(el, true) }));
      var eye = E('button', { class: 'eye', type: 'button', title: hid ? 'দেখান' : 'লুকান (এই ডিভাইসে)', html: svgI(hid ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>' : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>') });
      eye.addEventListener('click', function (e) { e.stopPropagation(); P.toggleHideForDevice(el); });
      r.appendChild(eye);
      r.addEventListener('click', function (e) { P.select(e.shiftKey ? P.sel.concat([el]) : [el]); try { var vr = el.getBoundingClientRect(), w = P.mainWin(); if (vr.bottom < 0 || vr.top > w.innerHeight) el.scrollIntoView({ block: 'center' }); } catch (x) {} });
      r.addEventListener('mouseenter', function () { P.emit('hoverLayer', el); });
      layersEl.appendChild(r);
      if (has && open) ks.forEach(function (c) { row(c, depth + 1); });
    }
    row(body, 0);
    layersEl.scrollTop = scroll;
    var selRow = layersEl.querySelector('.ly.sel'); if (selRow && P.sel.length) { var rr = selRow.getBoundingClientRect(), lr = layersEl.getBoundingClientRect(); if (rr.top < lr.top || rr.bottom > lr.bottom) selRow.scrollIntoView({ block: 'nearest' }); }
  }
  function layersSoon() { clearTimeout(lt); lt = setTimeout(function () { if (document.getElementById('pane-layers').classList.contains('on')) buildLayers(); }, 250); }

  /* ================= যোগ করুন (লাইব্রেরি) ================= */
  var ICONS = {
    'তারা': '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/>',
    'হৃদয়': '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    'বই': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    'কলম': '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    'ইমেইল': '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/>',
    'ফোন': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"/>',
    'ঠিকানা': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    'ঘণ্টা': '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    'সার্চ': '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    'মানুষ': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'শেয়ার': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    'টিক': '<polyline points="20 6 9 17 4 12"/>',
    'তীর': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    'ক্যামেরা': '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    'পৃথিবী': '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    'ক্যালেন্ডার': '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'পুরস্কার': '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    'উদ্ধৃতি': '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>'
  };
  function icoHtml(path) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>'; }
  var LIB = [
    { g: 'মৌলিক', items: [
      { n: 'শিরোনাম', i: '<path d="M6 4v16M18 4v16M6 12h12"/>', s: { tag: 'h2', cls: 'pd-h', html: 'নতুন শিরোনাম' } },
      { n: 'অনুচ্ছেদ', i: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="14" y2="18"/>', s: { tag: 'p', cls: 'pd-p', html: 'এখানে আপনার লেখা লিখুন। ডাবল-ক্লিক করে বদলে নিন।' } },
      { n: 'বাটন', i: '<rect x="3" y="8" width="18" height="8" rx="4"/>', s: { tag: 'a', cls: 'pd-btn', html: 'বাটনের লেখা', attrs: { href: '#' } } },
      { n: 'ছবি', i: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>', s: { tag: 'img', cls: 'pd-img', attrs: { src: 'assets/img/placeholder.svg', alt: '' }, css: { width: '420px', 'max-width': '100%' } }, after: 'ছবি বদলাতে সেটির ওপর ডাবল-ক্লিক করুন' },
      { n: 'বক্স', i: '<rect x="4" y="4" width="16" height="16" rx="3"/>', s: { tag: 'div', cls: 'pd-box', html: '<p class="pd-p">বক্সের ভেতরে লেখা…</p>' } },
      { n: 'ট্যাগ', i: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>', s: { tag: 'span', cls: 'pd-badge', html: 'ট্যাগ' } },
      { n: 'রেখা', i: '<line x1="3" y1="12" x2="21" y2="12"/>', s: { tag: 'div', cls: 'pd-divider' } },
      { n: 'ফাঁকা জায়গা', i: '<path d="M8 3v18M16 3v18"/><path d="M4 8l-2 4 2 4M20 8l2 4-2 4"/>', s: { tag: 'div', cls: 'pd-spacer' } },
      { n: 'উদ্ধৃতি', i: ICONS['উদ্ধৃতি'], s: { tag: 'blockquote', cls: 'pd-quote', html: 'এখানে একটি সুন্দর উদ্ধৃতি লিখুন।<cite>— নাম</cite>' } }
    ] },
    { g: 'তৈরি ব্লক', items: [
      { n: 'হিরো ব্যানার', i: '<rect x="2" y="4" width="20" height="16" rx="3"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/>', s: { tag: 'div', cls: 'pd-hero', html: '<span class="pd-badge">নতুন</span><h2 class="pd-h">আপনার শিরোনাম এখানে</h2><p class="pd-p">একটি সুন্দর বর্ণনা লিখুন যা পাঠককে আগ্রহী করে তুলবে।</p><a class="pd-btn" href="#">আরও জানুন</a>' } },
      { n: '৩ কলাম কার্ড', i: '<rect x="2" y="6" width="6" height="12" rx="1"/><rect x="9" y="6" width="6" height="12" rx="1"/><rect x="16" y="6" width="6" height="12" rx="1"/>', s: { tag: 'div', cls: 'pd-cols', html: '<div class="pd-card"><h3 class="pd-h">প্রথম বিষয়</h3><p class="pd-p">সংক্ষিপ্ত বর্ণনা লিখুন।</p></div><div class="pd-card"><h3 class="pd-h">দ্বিতীয় বিষয়</h3><p class="pd-p">সংক্ষিপ্ত বর্ণনা লিখুন।</p></div><div class="pd-card"><h3 class="pd-h">তৃতীয় বিষয়</h3><p class="pd-p">সংক্ষিপ্ত বর্ণনা লিখুন।</p></div>' } },
      { n: 'লেখা + ছবি', i: '<rect x="2" y="5" width="9" height="14" rx="1"/><rect x="13" y="5" width="9" height="14" rx="1"/>', s: { tag: 'div', cls: 'pd-cols', html: '<div class="pd-card"><h3 class="pd-h">শিরোনাম</h3><p class="pd-p">এখানে বিস্তারিত লিখুন।</p><a class="pd-btn" href="#">বাটন</a></div><img class="pd-img" src="assets/img/placeholder.svg" alt="">' } },
      { n: 'কল-টু-অ্যাকশন', i: '<rect x="2" y="7" width="20" height="10" rx="3"/><line x1="6" y1="12" x2="12" y2="12"/><rect x="15" y="10" width="5" height="4" rx="2"/>', s: { tag: 'div', cls: 'pd-cta', html: '<h3 class="pd-h">আমাদের সাথে থাকুন</h3><a class="pd-btn" href="#">যোগ দিন</a>' } },
      { n: 'কন্টেইনার', i: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 3"/>', s: { tag: 'div', cls: 'pd-wrap' } }
    ] },
    { g: 'আইকন', items: Object.keys(ICONS).map(function (k) { return { n: k, i: ICONS[k], s: { tag: 'div', cls: 'pd-icon', html: icoHtml(ICONS[k]) } }; }) }
  ];
  function buildLibrary() {
    var host = document.getElementById('lib-grid'); host.innerHTML = '';
    LIB.forEach(function (g) {
      host.appendChild(E('h5', { class: 'lib-g', text: g.g }));
      var grid = E('div', { class: 'lib-grid' });
      g.items.forEach(function (it) {
        var b = E('button', { type: 'button', class: 'lib-it', title: it.n + ' যোগ করুন', html: svgI(it.i) + '<span>' + it.n + '</span>' });
        b.addEventListener('click', function () {
          if (P.mode === 'preview') P.setMode('edit');
          P.insert(JSON.parse(JSON.stringify(it.s)));
          P.toast('"' + it.n + '" যোগ হয়েছে — টেনে সরান বা কোণা ধরে বড়-ছোট করুন' + (it.after ? ' · ' + it.after : ''));
        });
        grid.appendChild(b);
      });
      host.appendChild(grid);
    });
  }

  /* ================= থিম-রং ================= */
  var VARS = [
    ['--primary', 'মূল রং', 'বাটন, লিংক, হেডার-লোগো'], ['--primary-dark', 'গাঢ় মূল রং', 'টপবার ও ফুটারের ব্যাকগ্রাউন্ড'],
    ['--secondary', 'দ্বিতীয় রং', 'ব্রোঞ্জ — ছোট হাইলাইট'], ['--secondary-light', 'হালকা দ্বিতীয় রং', 'ছবির ফাঁকা জায়গা, ব্যাজ'],
    ['--bg', 'পেজের ব্যাকগ্রাউন্ড', 'পুরো সাইটের পেছনের রং'], ['--surface', 'কার্ডের ব্যাকগ্রাউন্ড', 'কার্ড, বক্স, ফর্ম'],
    ['--text', 'মূল লেখার রং', ''], ['--text-muted', 'হালকা লেখার রং', 'ক্যাপশন, মেনু'], ['--border', 'বর্ডারের রং', 'রেখা ও ঘেরা'],
    ['--success', 'হাইলাইট রং', 'তারা, সোনালি অংশ'], ['--error', 'সতর্কতার রং', 'ভুল বার্তা']
  ];
  var DEF = {
    light: { '--primary': '#1D5358', '--primary-dark': '#123A3D', '--secondary': '#9B7257', '--secondary-light': '#C9A98A', '--bg': '#F7F3EC', '--surface': '#FFFFFF', '--text': '#2A2A28', '--text-muted': '#6B6B63', '--border': '#E4DDD0', '--success': '#C99A3E', '--error': '#B3402E' },
    dark: { '--primary': '#4FA8AD', '--primary-dark': '#6FC3C8', '--secondary': '#C9A98A', '--secondary-light': '#E0C6A8', '--bg': '#14181A', '--surface': '#1E2426', '--text': '#F2EFE8', '--text-muted': '#A8A69E', '--border': '#2C3335', '--success': '#E0B354', '--error': '#E06B57' }
  };
  function buildTheme() {
    var host = document.getElementById('theme-list'); host.innerHTML = '';
    var mode = P.themeMode;
    var seg = E('div', { class: 'seg wide' }, [
      E('button', { type: 'button', class: mode === 'light' ? 'on' : '', text: '☀ আলো থিম', onclick: function () { P.setThemeMode('light'); buildTheme(); } }),
      E('button', { type: 'button', class: mode === 'dark' ? 'on' : '', text: '☾ অন্ধকার থিম', onclick: function () { P.setThemeMode('dark'); buildTheme(); } })
    ]);
    host.appendChild(seg);
    host.appendChild(E('p', { class: 'hint', text: 'এখানকার রং বদলালে পুরো সাইটের প্রতিটি পেজে একসাথে বদলে যাবে। আলো ও অন্ধকার থিম আলাদা করে সাজান।' }));
    var cur = P.design.theme[mode];
    VARS.forEach(function (v) {
      var val = cur[v[0]] || DEF[mode][v[0]];
      var sw = E('input', { type: 'color', class: 'swatch', value: P.hex(val) });
      var tx = E('input', { type: 'text', class: 'in hex', value: val, spellcheck: 'false' });
      function set(x) { if (x.toLowerCase() === DEF[mode][v[0]].toLowerCase()) delete P.design.theme[mode][v[0]]; else P.design.theme[mode][v[0]] = x; P.changed(true); row.classList.toggle('mod', !!P.design.theme[mode][v[0]]); }
      sw.addEventListener('input', function () { tx.value = sw.value; set(sw.value); });
      tx.addEventListener('change', function () { var x = tx.value.trim(); if (!/^#[0-9a-f]{6}$/i.test(x)) { P.toast('রঙের কোড #RRGGBB আকারে দিন', true); return; } sw.value = x; set(x); });
      var rs = E('button', { class: 'mini', type: 'button', title: 'আগের রং', text: '↺', onclick: function () { delete P.design.theme[mode][v[0]]; P.changed(); buildTheme(); } });
      var row = E('div', { class: 'theme-row' + (cur[v[0]] ? ' mod' : '') }, [sw, E('div', { class: 'tn' }, [E('b', { text: v[1] }), E('small', { text: v[2] })]), tx, rs]);
      host.appendChild(row);
    });
    host.appendChild(E('button', { class: 'btn-s ghost', type: 'button', text: '↺ দুই থিমের সব রং আগের মতো', onclick: function () { P.design.theme = { light: {}, dark: {} }; P.changed(); buildTheme(); } }));
  }

  /* ================= পেজ ================= */
  function buildPages() {
    var host = document.getElementById('pages-list'); host.innerHTML = '';
    var all = P.PAGES.slice();
    Object.keys(P.design.custom).forEach(function (s) { all.push({ key: 'page:' + s, name: P.design.custom[s].title || s, custom: true, slug: s }); });
    all.forEach(function (pg) {
      var has = P.design.pages[pg.key] && (Object.keys(P.design.pages[pg.key].edits).length || P.design.pages[pg.key].added.length);
      var b = E('div', { class: 'pg' + (pg.key === P.pk ? ' on' : '') }, [
        E('button', { type: 'button', class: 'pg-main', html: '<span class="dot' + (has ? ' mod' : '') + '"></span><span>' + P.escapeHtml(pg.name) + '</span>' + (pg.custom ? '<em>নতুন পেজ</em>' : '') }),
        pg.custom ? E('button', { type: 'button', class: 'mini', title: 'এই পেজ মুছুন', text: '✕', onclick: function (e) { e.stopPropagation(); delPage(pg.slug); } }) : null
      ]);
      b.firstChild.addEventListener('click', function () { if (pg.key !== P.pk) P.loadPage(pg.key); });
      host.appendChild(b);
    });
    var meta = (P.design.pages[P.pk] || {}).meta || {};
    var box = E('div', { class: 'pg-meta' }, [
      E('h5', { text: 'এই পেজের সেটিংস' }),
      E('label', { text: 'ব্রাউজার ট্যাব / গুগলে দেখানো শিরোনাম' }),
      E('input', { class: 'in wide', type: 'text', value: meta.title || '', placeholder: 'যেমন: পত্রদ্বীপ — হোম', onchange: function () { setMeta('title', this.value); } }),
      E('label', { text: 'গুগলে দেখানো বর্ণনা' }),
      E('textarea', { class: 'in area', rows: 3, placeholder: 'পেজটি নিয়ে ১-২ লাইন', onchange: function () { setMeta('desc', this.value); } }, [meta.desc || ''])
    ]);
    box.querySelector('textarea').value = meta.desc || '';
    host.appendChild(box);
  }
  function setMeta(k, v) {
    var sc = P.scope('page', true); sc.meta = sc.meta || {};
    if (v.trim()) sc.meta[k] = v.trim(); else delete sc.meta[k];
    if (!Object.keys(sc.meta).length) delete sc.meta;
    if (P.pk.indexOf('page:') === 0 && k === 'title' && P.design.custom[P.pk.slice(5)]) P.design.custom[P.pk.slice(5)].title = v.trim() || P.design.custom[P.pk.slice(5)].title;
    P.changed();
  }
  function delPage(slug) {
    if (!confirm('এই নতুন পেজ ও এর সব ডিজাইন মুছে ফেলবেন?')) return;
    delete P.design.custom[slug]; delete P.design.pages['page:' + slug];
    var was = P.pk === 'page:' + slug;
    P.changed(); P.pushHistory();
    if (was) P.loadPage('index'); else buildPages();
  }
  function newPage() {
    var m = document.getElementById('modal-newpage'); m.classList.add('open');
    var t = document.getElementById('np-title'), s = document.getElementById('np-slug');
    t.value = ''; s.value = ''; t.focus();
  }
  function initNewPage() {
    var m = document.getElementById('modal-newpage');
    var t = document.getElementById('np-title'), s = document.getElementById('np-slug');
    t.addEventListener('input', function () { if (!s.dataset.touched) s.value = t.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); });
    s.addEventListener('input', function () { s.dataset.touched = '1'; s.value = s.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''); });
    document.getElementById('np-cancel').addEventListener('click', function () { m.classList.remove('open'); });
    document.getElementById('np-ok').addEventListener('click', function () {
      var title = t.value.trim(), slug = s.value.trim() || ('page-' + (Object.keys(P.design.custom).length + 1));
      if (!title) return P.toast('পেজের নাম লিখুন', true);
      if (P.design.custom[slug]) return P.toast('এই ঠিকানা আগে থেকেই আছে', true);
      P.design.custom[slug] = { title: title, created: Date.now() };
      m.classList.remove('open'); s.dataset.touched = '';
      P.changed(); P.pushHistory();
      P.loadPage('page:' + slug);
      P.toast('নতুন পেজ তৈরি — "যোগ করুন" ট্যাব থেকে এলিমেন্ট বসান। মেনুতে লিংক দিতে হেডারের একটি লিংক ডুপ্লিকেট (Ctrl+D) করে ঠিকানা বদলান।');
      document.querySelector('#left-tabs [data-pane="add"]').click();
    });
    document.getElementById('btn-newpage').addEventListener('click', newPage);
  }

  /* ================= ব্রেডক্রাম্ব ================= */
  function crumbs() {
    var host = document.getElementById('crumbs'); host.innerHTML = '';
    if (!P.sel.length) { host.appendChild(E('span', { class: 'muted', text: 'কিছু বাছা হয়নি — ক্যানভাসে ক্লিক করুন' })); return; }
    var el = P.sel[0], path = [], n = el;
    while (n && n.nodeType === 1) { path.unshift(n); n = n.parentElement; }
    path.forEach(function (x, i) {
      if (/^html$/i.test(x.localName)) return;
      var b = E('button', { type: 'button', class: 'cr' + (x === el ? ' on' : ''), text: (P.TAG_BN[x.localName] || x.localName) });
      b.title = P.label(x, true);
      b.addEventListener('click', function () { P.select([x]); });
      host.appendChild(b);
      if (i < path.length - 1) host.appendChild(E('i', { text: '›' }));
    });
  }

  P.initSide = function () {
    initTabs(); buildLibrary(); initNewPage();
    P.on('select', function () { crumbs(); layersSoon(); });
    P.on('rendered', layersSoon);
    P.on('page', function () { buildPages(); });
    P.on('frameload', function (id) { if (id === 'main') { buildLayers(); } });
    P.on('restored', function () { buildTheme(); });
    P.buildTheme = buildTheme; P.buildPages = buildPages; P.buildLayers = buildLayers;
    buildTheme(); buildPages(); crumbs();
  };
})();
