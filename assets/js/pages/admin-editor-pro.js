/* admin-editor-pro.js — লেখা সম্পাদকের "প্রো" অংশ (v117)
   ১) অনুচ্ছেদ প্যানেল (অ্যাডোবি ইনডিজাইনের Paragraph প্যানেলের মতো):
      অনুচ্ছেদের ধরন (প্রিসেট) · সাজানো + শেষ লাইন · বাম/ডান/প্রথম-লাইন ইনডেন্ট · আগে/পরে ফাঁক · লিডিং ·
      ট্র্যাকিং ও শব্দের ফাঁক · ড্রপ ক্যাপ · কলাম · উপরে/নিচে রুল · শেডিং · সব মুছুন
   ২) ফুল স্ক্রিন = মাইক্রোসফট ওয়ার্ডের মতো: ধূসর ক্যানভাসে সাদা পাতা, উপরে টাইটেল-বার (আনডু/রিডু, খুঁজুন-বদলান,
      সংরক্ষণ), নিচে স্ট্যাটাস-বার (শব্দ, জুম, পাতার মাপ), ডানে অনুচ্ছেদ প্যানেল
   ৩) খুঁজুন ও বদলান (Ctrl+F / Ctrl+H)
   সব পরিবর্তন অনুচ্ছেদের ইনলাইন স্টাইলে বসে — ui.js-এর sanitize সেগুলো রেখে দেয়, তাই সাইটেও হুবহু দেখায়। */
(function () {
  'use strict';
  var E = window.PDEditor;
  if (!E || !E.body || !E.wrap) return;
  var doc = document, body = E.body, wrap = E.wrap, toolbar = E.toolbar;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }
  function toast(m) { try { if (window.PD && window.PD.toast) window.PD.toast(m); } catch (e) {} }
  function ic(inner) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'; }
  var IC = {
    x: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    left: ic('<path d="M3 6h18M3 12h12M3 18h16"/>'), center: ic('<path d="M3 6h18M7 12h10M5 18h14"/>'),
    right: ic('<path d="M3 6h18M9 12h12M5 18h16"/>'), justify: ic('<path d="M3 6h18M3 12h18M3 18h18"/>'),
    undo: ic('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'), redo: ic('<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>'),
    find: ic('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    save: ic('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
    doc: ic('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>'),
    shrink: ic('<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>'),
    reset: ic('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>')
  };

  /* ============================================================
     ১) অনুচ্ছেদ প্যানেল
     ============================================================ */
  var PRESETS = [
    { k: 'normal', n: 'সাধারণ', d: 'সব অনুচ্ছেদ-স্টাইল মুছে স্বাভাবিক', css: {} },
    { k: 'lead', n: 'লিড অনুচ্ছেদ', d: 'লেখার শুরুর বড় ভূমিকা-অনুচ্ছেদ', css: { 'font-size': '22px', 'line-height': '1.7', 'margin-bottom': '28px' } },
    { k: 'poem', n: 'কবিতার স্তবক', d: 'মাঝখানে, খোলা লাইন, স্তবকের পরে ফাঁক', css: { 'text-align': 'center', 'text-align-last': 'center', 'line-height': '1.9', 'margin-bottom': '30px' } },
    { k: 'pull', n: 'পুল-কোট', d: 'বড় উক্তি, উপরে-নিচে সোনালি রেখা', css: { 'font-size': '24px', 'line-height': '1.55', 'text-align': 'center', 'margin-top': '28px', 'margin-bottom': '28px', 'margin-left': '40px', 'margin-right': '40px', 'padding-top': '16px', 'padding-bottom': '16px', 'border-top-width': '2px', 'border-top-style': 'solid', 'border-top-color': '#9B7357', 'border-bottom-width': '2px', 'border-bottom-style': 'solid', 'border-bottom-color': '#9B7357' } },
    { k: 'dropcap', n: 'ড্রপ ক্যাপ অনুচ্ছেদ', d: 'প্রথম অক্ষর ৩ লাইন জুড়ে বড়', css: { 'text-align': 'justify' }, dc: '3' },
    { k: 'note', n: 'নোট / ছোট লেখা', d: 'পাদটীকা বা সূত্রের মতো ছোট লেখা', css: { 'font-size': '15px', 'line-height': '1.7', 'color': '#6B6B66' } },
    { k: 'indented', n: 'বই-ধাঁচ (প্রথম লাইন ভেতরে)', d: 'ছাপা বইয়ের মতো প্রথম লাইন ইনডেন্ট, অনুচ্ছেদে ফাঁক কম', css: { 'text-indent': '32px', 'margin-bottom': '8px', 'text-align': 'justify' } },
    { k: 'boxed', n: 'বক্সে অনুচ্ছেদ', d: 'হালকা রঙের পটভূমি ও ভেতরে ফাঁক', css: { 'background-color': '#F3EEE4', 'padding-top': '18px', 'padding-bottom': '18px', 'padding-left': '22px', 'padding-right': '22px' } }
  ];
  /* প্যানেল যেসব প্রপার্টি নিয়ন্ত্রণ করে (রিসেটে এগুলোই মোছে) */
  var PARA_PROPS = ['text-align', 'text-align-last', 'margin-left', 'margin-right', 'text-indent', 'margin-top', 'margin-bottom', 'line-height', 'letter-spacing', 'word-spacing', 'column-count', 'column-gap',
    'border-top-width', 'border-top-style', 'border-top-color', 'border-bottom-width', 'border-bottom-style', 'border-bottom-color',
    'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'background-color', 'font-size', 'color'];
  var RULE_COLORS = [['#9B7357', 'ব্র্যান্ড সোনালি'], ['#1F5459', 'ব্র্যান্ড সবুজ'], ['#2A2A28', 'কালো'], ['#B9B3A8', 'ধূসর']];
  var SHADES = [['', 'নেই'], ['#F3EEE4', 'কাগজ'], ['#E6F0EF', 'হালকা সবুজ'], ['#FBF3E2', 'হালকা সোনালি'], ['#F1F1EF', 'ধূসর'], ['#FCE8E6', 'হালকা লাল']];

  function num(id, label, unit, min, max, step, ph, hint) {
    return '<label class="pp-num" title="' + esc(hint || label) + '"><span class="pp-nlbl">' + label + '</span><span class="pp-nbox"><input type="number" data-pp="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" placeholder="' + ph + '"><em>' + unit + '</em></span></label>';
  }
  function seg(name, items) {
    return '<div class="pp-seg" data-seg="' + name + '">' + items.map(function (it) { return '<button type="button" data-v="' + it[0] + '" title="' + esc(it[2] || it[1]) + '">' + it[1] + '</button>'; }).join('') + '</div>';
  }
  function sec(title, inner, open) {
    return '<details class="pp-sec"' + (open ? ' open' : '') + '><summary>' + title + '</summary><div class="pp-sec-in">' + inner + '</div></details>';
  }

  var panel = doc.createElement('aside');
  panel.className = 'pp-panel';
  panel.id = 'pp-panel';
  panel.setAttribute('aria-label', 'অনুচ্ছেদ প্যানেল');
  panel.hidden = true;
  panel.innerHTML =
    '<div class="pp-head"><div><b>অনুচ্ছেদ</b><small id="pp-target">কার্সার যে অনুচ্ছেদে, সেটায় বসবে</small></div><button type="button" class="pp-x" data-pp-act="close" title="প্যানেল বন্ধ করুন" aria-label="প্যানেল বন্ধ করুন">' + IC.x + '</button></div>' +
    '<div class="pp-scroll">' +
    sec('অনুচ্ছেদের ধরন', '<div class="pp-presets">' + PRESETS.map(function (p) { return '<button type="button" class="pp-preset" data-preset="' + p.k + '" title="' + esc(p.d) + '"><b>' + p.n + '</b><small>' + p.d + '</small></button>'; }).join('') + '</div>', true) +
    sec('সাজানো',
      seg('align', [['left', IC.left, 'বামে'], ['center', IC.center, 'মাঝে'], ['right', IC.right, 'ডানে'], ['justify', IC.justify, 'দুই পাশে সমান']]) +
      '<label class="pp-sel"><span>শেষ লাইন</span><select data-pp="text-align-last"><option value="">স্বয়ংক্রিয়</option><option value="left">বামে</option><option value="center">মাঝে</option><option value="right">ডানে</option><option value="justify">দুই পাশে সমান</option></select></label>', true) +
    sec('ইনডেন্ট',
      '<div class="pp-grid3">' + num('margin-left', 'বাম', 'px', 0, 240, 4, '০', 'বাম ইনডেন্ট') + num('margin-right', 'ডান', 'px', 0, 240, 4, '০', 'ডান ইনডেন্ট') + num('text-indent', 'প্রথম লাইন', 'px', -120, 200, 4, '০', 'প্রথম লাইন ইনডেন্ট — মাইনাস দিলে ঝুলন্ত (hanging) ইনডেন্ট') + '</div>', true) +
    sec('ফাঁক ও লিডিং',
      '<div class="pp-grid3">' + num('margin-top', 'আগে', 'px', 0, 160, 2, '০', 'অনুচ্ছেদের আগে ফাঁক') + num('margin-bottom', 'পরে', 'px', 0, 160, 2, '—', 'অনুচ্ছেদের পরে ফাঁক') + num('line-height', 'লিডিং', '×', 1, 3.5, 0.05, '১.৮৫', 'লাইনের উচ্চতা (লিডিং)') + '</div>', true) +
    sec('অক্ষর ও শব্দ',
      '<div class="pp-grid2">' + num('tracking', 'ট্র্যাকিং', '/১০০০', -100, 500, 5, '০', 'অক্ষরের ফাঁক — ইনডিজাইনের মতো এম-এর হাজার ভাগ') + num('word-spacing', 'শব্দের ফাঁক', 'px', -4, 30, 1, '০', 'শব্দের মাঝের বাড়তি ফাঁক') + '</div>') +
    sec('ড্রপ ক্যাপ', seg('dropcap', [['', 'নেই'], ['2', '২ লাইন'], ['3', '৩ লাইন'], ['4', '৪ লাইন']]) + '<p class="pp-help">অনুচ্ছেদের প্রথম অক্ষর বড় হয়ে কয়েক লাইন জুড়ে বসে — পত্রিকার লেখার শুরুতে চমৎকার দেখায়।</p>') +
    sec('কলাম', seg('cols', [['1', '১ কলাম'], ['2', '২ কলাম'], ['3', '৩ কলাম']]) + '<div class="pp-grid2">' + num('column-gap', 'কলামের ফাঁক', 'px', 0, 80, 2, '২৮', 'কলামের মাঝের ফাঁক (গাটার)') + '</div><p class="pp-help">মোবাইলে সবসময় ১ কলাম দেখায়।</p>') +
    sec('রুল (রেখা)',
      '<div class="pp-checks"><label><input type="checkbox" data-rule="top"> অনুচ্ছেদের উপরে</label><label><input type="checkbox" data-rule="bottom"> অনুচ্ছেদের নিচে</label></div>' +
      '<div class="pp-grid2"><label class="pp-sel"><span>পুরুত্ব</span><select data-rule-w><option value="1px">১ px</option><option value="2px" selected>২ px</option><option value="3px">৩ px</option><option value="4px">৪ px</option></select></label>' +
      '<label class="pp-sel"><span>ধরন</span><select data-rule-s><option value="solid">সোজা</option><option value="dashed">ড্যাশ</option><option value="dotted">ডট</option><option value="double">ডাবল</option></select></label></div>' +
      '<div class="pp-swatches" data-rule-c>' + RULE_COLORS.map(function (c, i) { return '<button type="button" data-v="' + c[0] + '" title="' + c[1] + '" style="background:' + c[0] + '"' + (i ? '' : ' class="on"') + '></button>'; }).join('') + '</div>' +
      '<div class="pp-grid2">' + num('rule-offset', 'রেখা থেকে ফাঁক', 'px', 0, 60, 2, '১২', 'রেখা আর লেখার মাঝের ফাঁক') + '</div>') +
    sec('শেডিং (পটভূমি)',
      '<div class="pp-swatches pp-shades" data-shade>' + SHADES.map(function (c) { return '<button type="button" data-v="' + c[0] + '" title="' + c[1] + '"' + (c[0] ? ' style="background:' + c[0] + '"' : ' class="none"') + '></button>'; }).join('') + '</div>' +
      '<div class="pp-grid2">' + num('shade-pad', 'ভেতরের ফাঁক', 'px', 0, 60, 2, '১৮', 'শেডিংয়ের ভেতরে লেখার চারপাশের ফাঁক') + '</div>') +
    '</div>' +
    '<div class="pp-foot"><button type="button" class="pp-reset" data-pp-act="reset">' + IC.reset + 'অনুচ্ছেদের সব স্টাইল মুছুন</button></div>';
  /* প্যানেল টুলবারের ঠিক পরে বসে (ফুল স্ক্রিনে র‍্যাপারের সাথেই যায়) */
  toolbar.insertAdjacentElement('afterend', panel);

  function blocks() { return E.blocks(); }
  function setProps(map, dropcap) {
    var bl = blocks();
    bl.forEach(function (b) {
      Object.keys(map).forEach(function (k) { var v = map[k]; if (v === '' || v == null) b.style.removeProperty(k); else b.style.setProperty(k, v); });
      if (dropcap !== undefined && b.tagName === 'P') { if (dropcap) b.setAttribute('data-dropcap', dropcap); else b.removeAttribute('data-dropcap'); }
      if (!b.getAttribute('style')) b.removeAttribute('style');
    });
    E.changed();
    refresh();
  }
  function first() { var bl = E.peekBlocks(); return bl[0] || null; }
  function px(v) { var n = parseFloat(v); return isNaN(n) ? '' : n; }

  /* বর্তমান অনুচ্ছেদের মান প্যানেলে দেখানো */
  function refresh() {
    if (panel.hidden) return;
    var b = first();
    var tgt = doc.getElementById('pp-target');
    var cnt = E.peekBlocks().length;
    if (tgt) tgt.textContent = !b ? 'লেখার ভেতরে কার্সার রাখুন' : (cnt > 1 ? bn(cnt) + 'টি অনুচ্ছেদ নির্বাচিত' : 'কার্সার যে অনুচ্ছেদে, সেটায় বসবে');
    var st = b ? b.style : {}, g = function (k) { return b ? (st.getPropertyValue(k) || '') : ''; };
    [].forEach.call(panel.querySelectorAll('input[data-pp]'), function (inp) {
      if (doc.activeElement === inp) return;
      var k = inp.getAttribute('data-pp'), v = '';
      if (k === 'tracking') { var ls = g('letter-spacing'); v = /em$/.test(ls) ? Math.round(parseFloat(ls) * 1000) : ''; }
      else if (k === 'rule-offset') v = px(g('padding-top') || g('padding-bottom'));
      else if (k === 'shade-pad') v = g('background-color') ? px(g('padding-left')) : '';
      else if (k === 'line-height') { var lh = g('line-height'); v = lh && !/px|%/.test(lh) ? parseFloat(lh) : ''; }
      else v = px(g(k));
      inp.value = v === '' ? '' : v;
    });
    var tal = panel.querySelector('select[data-pp="text-align-last"]'); if (tal && doc.activeElement !== tal) tal.value = g('text-align-last') || '';
    var al = g('text-align') || (b ? getComputedStyle(b).textAlign : '');
    if (al === 'start') al = 'left';
    mark('align', al);
    mark('dropcap', b && b.getAttribute('data-dropcap') || '');
    mark('cols', g('column-count') || '1');
    panel.querySelector('[data-rule="top"]').checked = !!(g('border-top-style') && g('border-top-style') !== 'none');
    panel.querySelector('[data-rule="bottom"]').checked = !!(g('border-bottom-style') && g('border-bottom-style') !== 'none');
    var shade = (g('background-color') || '').toLowerCase();
    [].forEach.call(panel.querySelectorAll('[data-shade] button'), function (x) { x.classList.toggle('on', toHex(shade) === (x.getAttribute('data-v') || '').toLowerCase()); });
  }
  function toHex(c) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || ''); if (!m) return (c || '').toLowerCase();
    return '#' + [m[1], m[2], m[3]].map(function (n) { return ('0' + (+n).toString(16)).slice(-2); }).join('');
  }
  function mark(name, v) { [].forEach.call(panel.querySelectorAll('[data-seg="' + name + '"] button'), function (x) { x.classList.toggle('on', x.getAttribute('data-v') === String(v)); }); }

  /* সংখ্যার ঘর বদলালে */
  function onNum(inp) {
    var k = inp.getAttribute('data-pp'), raw = inp.value.trim(), n = parseFloat(raw), has = raw !== '' && !isNaN(n);
    var mn = parseFloat(inp.min), mx = parseFloat(inp.max);
    if (has) n = Math.max(mn, Math.min(mx, n));
    var map = {};
    if (k === 'tracking') map['letter-spacing'] = has && n ? (n / 1000) + 'em' : '';
    else if (k === 'line-height') map['line-height'] = has ? String(Math.round(n * 100) / 100) : '';
    else if (k === 'word-spacing') map['word-spacing'] = has && n ? n + 'px' : '';
    else if (k === 'rule-offset') {
      var b = first(), t = b && b.style.borderTopStyle && b.style.borderTopStyle !== 'none', bo = b && b.style.borderBottomStyle && b.style.borderBottomStyle !== 'none';
      map['padding-top'] = has && t ? Math.round(n) + 'px' : (t ? '' : null);
      map['padding-bottom'] = has && bo ? Math.round(n) + 'px' : (bo ? '' : null);
      Object.keys(map).forEach(function (x) { if (map[x] === null) delete map[x]; });
    }
    else if (k === 'shade-pad') { var v = has ? Math.round(n) + 'px' : ''; map['padding-top'] = v; map['padding-bottom'] = v; map['padding-left'] = v; map['padding-right'] = v; }
    else map[k] = has ? Math.round(n) + 'px' : '';
    setProps(map);
  }
  panel.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('input[data-pp]')) onNum(t);
    else if (t.matches('select[data-pp="text-align-last"]')) setProps({ 'text-align-last': t.value });
    else if (t.matches('[data-rule]')) applyRules();
    else if (t.matches('[data-rule-w],[data-rule-s]')) applyRules(true);
  });
  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('input[data-pp]')) { e.preventDefault(); onNum(e.target); }
    if (e.key === 'Escape') { e.stopPropagation(); hide(); }
  });
  function ruleColor() { var on = panel.querySelector('[data-rule-c] button.on'); return on ? on.getAttribute('data-v') : '#9B7357'; }
  function applyRules(keepOnly) {
    var w = panel.querySelector('[data-rule-w]').value, s = panel.querySelector('[data-rule-s]').value, c = ruleColor();
    var top = panel.querySelector('[data-rule="top"]').checked, bot = panel.querySelector('[data-rule="bottom"]').checked;
    var off = parseFloat(panel.querySelector('[data-pp="rule-offset"]').value); off = isNaN(off) ? 12 : off;
    var map = {};
    ['top', 'bottom'].forEach(function (side) {
      var on = side === 'top' ? top : bot;
      map['border-' + side + '-width'] = on ? w : ''; map['border-' + side + '-style'] = on ? s : ''; map['border-' + side + '-color'] = on ? c : '';
      map['padding-' + side] = on ? off + 'px' : '';
    });
    if (keepOnly && !top && !bot) return;
    setProps(map);
  }
  panel.addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var act = b.getAttribute('data-pp-act');
    if (act === 'close') return hide();
    if (act === 'reset') { var m = {}; PARA_PROPS.forEach(function (k) { m[k] = ''; }); setProps(m, ''); toast('অনুচ্ছেদের স্টাইল মুছে ফেলা হয়েছে'); return; }
    var pr = b.getAttribute('data-preset');
    if (pr) {
      var P = PRESETS.filter(function (x) { return x.k === pr; })[0]; if (!P) return;
      var map = {}; PARA_PROPS.forEach(function (k) { map[k] = ''; });
      Object.keys(P.css).forEach(function (k) { map[k] = P.css[k]; });
      setProps(map, P.dc || '');
      toast('অনুচ্ছেদের ধরন: ' + P.n);
      return;
    }
    var sg = b.closest('[data-seg]');
    if (sg) {
      var name = sg.getAttribute('data-seg'), v = b.getAttribute('data-v');
      if (name === 'align') setProps({ 'text-align': v === 'left' ? '' : v });
      else if (name === 'dropcap') setProps({}, v);
      else if (name === 'cols') setProps({ 'column-count': v === '1' ? '' : v, 'column-gap': v === '1' ? '' : (first() && first().style.columnGap) || '28px' });
      return;
    }
    if (b.closest('[data-rule-c]')) {
      [].forEach.call(b.parentNode.children, function (x) { x.classList.toggle('on', x === b); });
      applyRules(true); return;
    }
    if (b.closest('[data-shade]')) {
      var col = b.getAttribute('data-v'), pad = parseFloat(panel.querySelector('[data-pp="shade-pad"]').value); pad = isNaN(pad) ? 18 : pad;
      var pv = col ? pad + 'px' : '';
      setProps({ 'background-color': col, 'padding-left': pv, 'padding-right': pv, 'padding-top': col ? pv : '', 'padding-bottom': col ? pv : '' });
    }
  });

  /* সাধারণ মোডে প্যানেল টুলবারের ঠিক নিচে (টুলবার কয় সারি তা মেপে); ফুল স্ক্রিন/মোবাইলে CSS-ই জায়গা ঠিক করে */
  var MOB = window.matchMedia ? window.matchMedia('(max-width:960px)') : { matches: false };
  function placePanel() {
    if (panel.hidden) return;
    if (wrap.classList.contains('is-full') || MOB.matches) { panel.style.top = ''; return; }
    panel.style.top = (toolbar.offsetTop + toolbar.offsetHeight + 8) + 'px';
  }
  if (window.ResizeObserver) new ResizeObserver(placePanel).observe(toolbar);
  function show(anchor) {
    panel.hidden = false; wrap.classList.add('pp-open'); placePanel();
    var pb = toolbar.querySelector('[data-act="para"]'); if (pb) { pb.classList.add('is-active'); pb.setAttribute('aria-pressed', 'true'); }
    refresh();
  }
  function hide() {
    panel.hidden = true; wrap.classList.remove('pp-open');
    var pb = toolbar.querySelector('[data-act="para"]'); if (pb) { pb.classList.remove('is-active'); pb.setAttribute('aria-pressed', 'false'); }
    E.focus();
  }
  window.PDParaPanel = { toggle: function (a) { if (panel.hidden) show(a); else hide(); }, show: show, hide: hide, refresh: refresh };
  var rq = 0;
  doc.addEventListener('selectionchange', function () {
    if (panel.hidden || rq) return;
    var s = window.getSelection(); if (!s || !s.rangeCount || !body.contains(s.getRangeAt(0).commonAncestorContainer)) return;
    rq = requestAnimationFrame(function () { rq = 0; refresh(); });
  });

  /* ============================================================
     ২) ওয়ার্ড-স্টাইল ফুল স্ক্রিন
     ============================================================ */
  var meta = wrap.querySelector('.rte-meta');
  var head = doc.createElement('div');
  head.className = 'fsw-head';
  head.innerHTML =
    '<div class="fsw-doc">' + IC.doc + '<div><b id="fsw-title">শিরোনামহীন লেখা</b><small id="fsw-sub">পত্রদ্বীপ · লেখা সম্পাদনা</small></div></div>' +
    '<div class="fsw-tools">' +
    '<button type="button" class="fsw-btn" data-fsw="undo" title="আগের অবস্থায় (Ctrl+Z)" aria-label="আনডু">' + IC.undo + '</button>' +
    '<button type="button" class="fsw-btn" data-fsw="redo" title="আবার করুন (Ctrl+Y)" aria-label="রিডু">' + IC.redo + '</button>' +
    '<span class="fsw-sep"></span>' +
    '<button type="button" class="fsw-btn fsw-wide" data-fsw="find" title="খুঁজুন ও বদলান (Ctrl+F / Ctrl+H)">' + IC.find + '<span>খুঁজুন ও বদলান</span></button>' +
    '</div>' +
    '<div class="fsw-end">' +
    '<button type="button" class="fsw-save" data-fsw="save" title="লেখা সংরক্ষণ করুন">' + IC.save + '<span>সংরক্ষণ করুন</span></button>' +
    '<button type="button" class="fsw-btn" data-fsw="exit" title="ফুল স্ক্রিন বন্ধ (Esc)" aria-label="ফুল স্ক্রিন বন্ধ">' + IC.shrink + '</button>' +
    '</div>';
  wrap.insertBefore(head, wrap.firstChild);

  /* খুঁজুন ও বদলান বার */
  var findBar = doc.createElement('div');
  findBar.className = 'fsw-find';
  findBar.hidden = true;
  findBar.innerHTML =
    '<label class="fsw-fin">' + IC.find + '<input type="text" id="fsw-q" placeholder="যা খুঁজবেন…" autocomplete="off"></label>' +
    '<span class="fsw-count" id="fsw-count"></span>' +
    '<button type="button" data-find="prev" title="আগেরটা (Shift+Enter)" aria-label="আগেরটা">‹</button><button type="button" data-find="next" title="পরেরটা (Enter)" aria-label="পরেরটা">›</button>' +
    '<label class="fsw-fin fsw-rep"><input type="text" id="fsw-r" placeholder="যা দিয়ে বদলাবেন…" autocomplete="off"></label>' +
    '<button type="button" data-find="one">বদলান</button><button type="button" data-find="all">সব বদলান</button>' +
    '<button type="button" data-find="close" class="fsw-fx" title="বন্ধ (Esc)" aria-label="বন্ধ">' + IC.x + '</button>';
  head.insertAdjacentElement('afterend', findBar);

  /* স্ট্যাটাস বারে জুম ও পাতার মাপ */
  var zoomBox = doc.createElement('div');
  zoomBox.className = 'fsw-status';
  zoomBox.innerHTML =
    '<div class="fsw-pages" role="group" aria-label="পাতার মাপ"><button type="button" data-page="a4" title="ছাপা পাতার মতো (A4)">পাতা</button><button type="button" data-page="web" title="সাইটে যে প্রস্থে দেখাবে">সাইটের মাপ</button><button type="button" data-page="wide" title="পুরো প্রস্থ জুড়ে">পূর্ণ প্রস্থ</button></div>' +
    '<div class="fsw-zoom"><button type="button" data-zoom="-" aria-label="জুম কমান">−</button><input type="range" min="50" max="200" step="10" value="100" id="fsw-zoom" aria-label="জুম"><button type="button" data-zoom="+" aria-label="জুম বাড়ান">+</button><b id="fsw-zv">১০০%</b></div>';
  if (meta) meta.appendChild(zoomBox);

  var canvas = doc.createElement('div');
  canvas.className = 'fsw-canvas';
  var holder = null, zoom = 100, pageMode = 'a4';
  try { zoom = Math.max(50, Math.min(200, parseInt(localStorage.getItem('pd-fsw-zoom'), 10) || 100)); pageMode = localStorage.getItem('pd-fsw-page') || 'a4'; } catch (e) {}

  function applyZoom() {
    body.style.zoom = wrap.classList.contains('is-full') ? (zoom / 100) : '';
    var zr = doc.getElementById('fsw-zoom'); if (zr) zr.value = zoom;
    var zv = doc.getElementById('fsw-zv'); if (zv) zv.textContent = bn(zoom) + '%';
    try { localStorage.setItem('pd-fsw-zoom', String(zoom)); } catch (e) {}
  }
  function applyPage() {
    wrap.setAttribute('data-page', pageMode);
    [].forEach.call(zoomBox.querySelectorAll('[data-page]'), function (b) { b.classList.toggle('on', b.getAttribute('data-page') === pageMode); });
    try { localStorage.setItem('pd-fsw-page', pageMode); } catch (e) {}
  }
  function syncTitle() {
    var t = doc.getElementById('art-title'), v = t && t.value.trim();
    doc.getElementById('fsw-title').textContent = v || 'শিরোনামহীন লেখা';
    var sb = doc.getElementById('art-subtitle'), sv = sb && sb.value.trim();
    doc.getElementById('fsw-sub').textContent = sv || 'পত্রদ্বীপ · লেখা সম্পাদনা';
  }
  /* ফুল স্ক্রিনে ঢোকা/বের হওয়া: লেখার ঘর ধূসর ক্যানভাসের ভেতরে সাদা পাতা হয়ে বসে */
  function onFull(on) {
    if (on) {
      syncTitle();
      if (!canvas.parentNode) { holder = doc.createComment('rte-body'); body.parentNode.insertBefore(holder, body); holder.parentNode.insertBefore(canvas, holder); canvas.appendChild(body); }
      applyPage(); applyZoom(); placePanel();
      if (localStorage.getItem('pd-fsw-panel') === '1' && panel.hidden) show();
    } else {
      closeFind();
      if (canvas.parentNode && holder && holder.parentNode) { holder.parentNode.insertBefore(body, holder); holder.parentNode.removeChild(holder); canvas.parentNode.removeChild(canvas); }
      holder = null; body.style.zoom = ''; placePanel();
    }
  }
  new MutationObserver(function () {
    var on = wrap.classList.contains('is-full');
    if (on !== !!canvas.parentNode) onFull(on);
  }).observe(wrap, { attributes: true, attributeFilter: ['class'] });

  head.addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
  head.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fsw]'); if (!b) return;
    var a = b.getAttribute('data-fsw');
    if (a === 'undo' || a === 'redo') { E.focus(); E.exec(a, null, false); E.changed(); }
    else if (a === 'find') toggleFind();
    else if (a === 'exit') E.setFull(false);
    else if (a === 'save') { E.setFull(false); var sv = doc.getElementById('art-save-btn'); if (sv) setTimeout(function () { sv.click(); }, 60); }
  });
  zoomBox.addEventListener('click', function (e) {
    var z = e.target.closest('[data-zoom]'), pg = e.target.closest('[data-page]');
    if (z) { zoom = Math.max(50, Math.min(200, zoom + (z.getAttribute('data-zoom') === '+' ? 10 : -10))); applyZoom(); }
    if (pg) { pageMode = pg.getAttribute('data-page'); applyPage(); }
  });
  zoomBox.addEventListener('input', function (e) { if (e.target.id === 'fsw-zoom') { zoom = +e.target.value; applyZoom(); } });
  /* Ctrl + মাউস হুইল = জুম (ফুল স্ক্রিনে) */
  canvas.addEventListener('wheel', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault(); zoom = Math.max(50, Math.min(200, zoom + (e.deltaY < 0 ? 10 : -10))); applyZoom();
  }, { passive: false });
  /* প্যানেল খোলা/বন্ধ মনে রাখা (ফুল স্ক্রিনের জন্য) */
  new MutationObserver(function () { if (wrap.classList.contains('is-full')) try { localStorage.setItem('pd-fsw-panel', panel.hidden ? '0' : '1'); } catch (e) {} }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  ['art-title', 'art-subtitle'].forEach(function (id) { var el = doc.getElementById(id); if (el) el.addEventListener('input', syncTitle); });

  /* ============================================================
     ৩) খুঁজুন ও বদলান
     ============================================================ */
  var hits = [], hi = -1;
  var qIn = findBar.querySelector('#fsw-q'), rIn = findBar.querySelector('#fsw-r'), cnt = findBar.querySelector('#fsw-count');
  function textNodes() {
    var out = [], w = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }
  function search() {
    hits = []; hi = -1;
    var q = qIn.value;
    if (!q) { cnt.textContent = ''; return; }
    var ql = q.toLowerCase();
    textNodes().forEach(function (n) {
      var t = n.nodeValue.toLowerCase(), i = t.indexOf(ql);
      while (i >= 0) { hits.push({ n: n, i: i, len: q.length }); i = t.indexOf(ql, i + q.length); }
    });
    cnt.textContent = hits.length ? '' : 'পাওয়া যায়নি';
    cnt.classList.toggle('none', !hits.length);
  }
  function go(dir) {
    if (!hits.length) search();
    if (!hits.length) return;
    hi = (hi + dir + hits.length) % hits.length;
    var h = hits[hi];
    if (!body.contains(h.n)) { search(); if (!hits.length) return; hi = 0; h = hits[0]; }
    var r = doc.createRange(); r.setStart(h.n, h.i); r.setEnd(h.n, h.i + h.len);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    var el = h.n.parentNode; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    cnt.textContent = bn(hi + 1) + ' / ' + bn(hits.length);
  }
  function replaceOne() {
    if (hi < 0 || !hits[hi]) { go(1); return; }
    var h = hits[hi];
    if (!body.contains(h.n)) { search(); go(1); return; }
    var r = doc.createRange(); r.setStart(h.n, h.i); r.setEnd(h.n, h.i + h.len);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    body.focus({ preventScroll: true }); s.removeAllRanges(); s.addRange(r);
    E.exec('insertText', rIn.value, false); E.changed();
    var keep = hi; search(); if (hits.length) { hi = Math.min(keep, hits.length) - 1; go(1); } else cnt.textContent = 'সব বদলানো হয়েছে';
  }
  function replaceAll() {
    var q = qIn.value; if (!q) return;
    var ql = q.toLowerCase(), rep = rIn.value, total = 0;
    textNodes().forEach(function (n) {
      var t = n.nodeValue, low = t.toLowerCase(), out = '', i = 0, j;
      while ((j = low.indexOf(ql, i)) >= 0) { out += t.slice(i, j) + rep; i = j + q.length; total++; }
      if (i) n.nodeValue = out + t.slice(i);
    });
    E.changed(); search();
    cnt.textContent = total ? bn(total) + 'টি বদলানো হয়েছে' : 'পাওয়া যায়নি';
    toast(total ? bn(total) + ' জায়গায় বদলানো হয়েছে' : 'কিছু পাওয়া যায়নি');
  }
  function openFind(withReplace) {
    findBar.hidden = false; wrap.classList.add('find-open');
    var s = window.getSelection(), sel = s && s.rangeCount && body.contains(s.getRangeAt(0).commonAncestorContainer) ? s.toString() : '';
    if (sel && sel.length < 80 && !/\n/.test(sel)) qIn.value = sel;
    search();
    (withReplace && qIn.value ? rIn : qIn).focus(); qIn.select();
  }
  function closeFind() { if (findBar.hidden) return; findBar.hidden = true; wrap.classList.remove('find-open'); hits = []; hi = -1; }
  function toggleFind() { if (findBar.hidden) openFind(); else { closeFind(); E.focus(); } }
  qIn.addEventListener('input', function () { search(); if (hits.length) cnt.textContent = bn(hits.length) + 'টি পাওয়া গেছে'; });
  findBar.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); if (e.target === rIn) replaceOne(); else go(e.shiftKey ? -1 : 1); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeFind(); E.focus(); }
  });
  findBar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-find]'); if (!b) return;
    var a = b.getAttribute('data-find');
    if (a === 'next') go(1); else if (a === 'prev') go(-1); else if (a === 'one') replaceOne(); else if (a === 'all') replaceAll(); else if (a === 'close') { closeFind(); E.focus(); }
  });
  /* Ctrl+F / Ctrl+H — লেখার ঘরে বা ফুল স্ক্রিনে থাকলে */
  doc.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    var k = (e.key || '').toLowerCase();
    if (k !== 'f' && k !== 'h') return;
    var inEd = wrap.contains(doc.activeElement) || wrap.classList.contains('is-full');
    if (!inEd) return;
    e.preventDefault();
    if (!wrap.classList.contains('is-full')) E.setFull(true);
    setTimeout(function () { openFind(k === 'h'); }, 30);
  }, true);
})();
