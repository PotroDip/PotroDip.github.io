/* studio-panels.js — ডান পাশের প্রপার্টি প্যানেল (ইলাস্ট্রেটর স্টাইলের কন্ট্রোল) */
(function () {
  'use strict';
  var P = window.PDS, E = P.el;
  var root, fields = [], openSec = { align: true, text: true, fill: true, border: false, space: false, link: true, vis: false, adv: false };

  var THEME_CHIPS = [['--primary', 'মূল রং'], ['--primary-dark', 'গাঢ় মূল'], ['--secondary', 'ব্রোঞ্জ'], ['--secondary-light', 'হালকা ব্রোঞ্জ'], ['--bg', 'পেজের রং'], ['--surface', 'কার্ড'], ['--text', 'লেখা'], ['--text-muted', 'হালকা লেখা'], ['--border', 'বর্ডার']];
  var GRADS = [
    ['#1D5358', '#4FA8AD', 135], ['#123A3D', '#1D5358', 160], ['#9B7257', '#E0C6A8', 135], ['#F7F3EC', '#C9A98A', 180],
    ['#ff7e5f', '#feb47b', 135], ['#6a11cb', '#2575fc', 135], ['#0f2027', '#2c5364', 160], ['#f093fb', '#f5576c', 135]
  ];
  var SHADOWS = [['', 'কিছু না'], ['0 2px 8px rgba(0,0,0,.12)', 'সূক্ষ্ম'], ['0 8px 24px rgba(0,0,0,.18)', 'মাঝারি'], ['0 20px 50px rgba(0,0,0,.28)', 'গভীর'], ['0 0 24px rgba(79,168,173,.65)', 'গ্লো'], ['inset 0 2px 10px rgba(0,0,0,.22)', 'ভেতরে']];
  var TSHADOWS = [['', 'কিছু না'], ['0 1px 2px rgba(0,0,0,.25)', 'হালকা'], ['0 2px 10px rgba(0,0,0,.4)', 'গাঢ়'], ['0 0 14px rgba(255,255,255,.8)', 'গ্লো (সাদা)'], ['2px 2px 0 rgba(0,0,0,.25)', 'ব্লক']];

  function I() { return P.selInfo[0]; }
  function cs() { return P.cs(I().el); }
  function eff(prop) {
    var s = P.getCss(I(), prop);
    if (s != null) return s;
    return cs().getPropertyValue(prop);
  }
  function icon(d, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' + (extra || '') + '>' + d + '</svg>'; }

  /* ---------- কন্ট্রোল বানানোর ছোট কারখানা ---------- */
  function reg(f) { fields.push(f); return f; }
  function rowOf(label, kids, cls) {
    return E('div', { class: 'fr ' + (cls || '') }, [label ? E('label', { text: label }) : null, E('div', { class: 'fc' }, kids)]);
  }
  function num(o) {
    var inp = E('input', { type: 'number', step: o.step || 1, class: 'in num' });
    if (o.min != null) inp.min = o.min; if (o.max != null) inp.max = o.max;
    var rng = null;
    if (o.range) { rng = E('input', { type: 'range', min: o.min, max: o.max, step: o.step || 1, class: 'rng' }); }
    var unit = o.unit == null ? 'px' : o.unit;
    function get() { return o.get ? o.get() : P.num(eff(o.prop)); }
    function set(v) {
      if (o.set) o.set(v);
      else { var m = {}; m[o.prop] = (o.map ? o.map(v) : v) + unit; P.cssAll(m); }
    }
    function onin() { var v = parseFloat(this.value); if (isNaN(v)) return; if (o.min != null) v = Math.max(o.min, v); if (rng) rng.value = v; set(v); }
    inp.addEventListener('input', onin);
    if (rng) rng.addEventListener('input', function () { inp.value = this.value; set(+this.value); });
    var f = reg({
      refresh: function () {
        var v = P.round(get(), o.dec == null ? 1 : o.dec);
        if (document.activeElement !== inp) inp.value = isNaN(v) ? '' : v;
        if (rng) rng.value = v;
      }
    });
    var kids = [inp]; if (unit && o.showUnit !== false) kids.push(E('span', { class: 'unit', text: unit }));
    if (rng) kids.push(rng);
    (o.extra || []).forEach(function (x) { kids.push(x); });
    var row = rowOf(o.label, kids, o.cls);
    row._f = f; f.refresh();
    return row;
  }
  function pick(sel) { return sel; }
  function colorCtl(o) {
    var sw = E('input', { type: 'color', class: 'swatch' });
    var tx = E('input', { type: 'text', class: 'in hex', spellcheck: 'false', placeholder: o.none ? 'কোনো রং নেই' : '#000000' });
    var al = E('input', { type: 'number', min: 0, max: 100, class: 'in num al', title: 'স্বচ্ছতা %' });
    var cur = '';
    function commit(v) { o.set(v); }
    sw.addEventListener('input', function () { var a = (parseFloat(al.value) || 100) / 100; var v = P.rgba(sw.value, a); tx.value = v; commit(v); });
    al.addEventListener('input', function () { var a = Math.max(0, Math.min(100, parseFloat(al.value) || 0)) / 100; var v = P.rgba(sw.value, a); tx.value = v; commit(v); });
    tx.addEventListener('change', function () {
      var v = tx.value.trim();
      if (v && !/^(#|rgb|hsl|var\(|transparent|[a-z]+$)/i.test(v)) { P.toast('রঙের কোড ঠিক নয়', true); return; }
      commit(v);
    });
    var chips = E('div', { class: 'chips' });
    var doc = P.mainDoc();
    var rs = doc && doc.defaultView.getComputedStyle(doc.documentElement);
    THEME_CHIPS.forEach(function (c) {
      var b = E('button', { class: 'chip', title: c[1], type: 'button' });
      if (rs) b.style.background = rs.getPropertyValue(c[0]);
      b.addEventListener('click', function () { var v = 'var(' + c[0] + ')'; tx.value = v; commit(v); });
      chips.appendChild(b);
    });
    var f = reg({
      refresh: function () {
        var v = o.get();
        cur = v;
        if (document.activeElement !== tx) tx.value = (v === 'rgba(0, 0, 0, 0)' ? '' : v) || '';
        sw.value = P.hex(v && v.indexOf('var(') === 0 ? rs && rs.getPropertyValue(v.slice(4, -1)) : v);
        if (document.activeElement !== al) al.value = Math.round(P.alpha(v) * 100);
      }
    });
    var clear = o.none ? E('button', { class: 'mini', type: 'button', text: '✕', title: 'রং সরান', onclick: function () { o.set(''); } }) : null;
    var row = rowOf(o.label, [sw, tx, al, clear], 'color');
    var wrap = E('div', { class: 'colwrap' }, [row, chips]);
    f.refresh();
    return wrap;
  }
  function color(o) { return colorCtl({ label: o.label, none: o.none, get: function () { return eff(o.prop); }, set: function (v) { var m = {}; m[o.prop] = v; P.cssAll(m); } }); }
  function sel(o) {
    var s = E('select', { class: 'in' }, o.options.map(function (x) { return E('option', { value: x[0], text: x[1] }); }));
    s.addEventListener('change', function () { if (o.set) o.set(s.value); else { var m = {}; m[o.prop] = s.value; P.cssAll(m); } });
    var f = reg({ refresh: function () { var v = o.get ? o.get() : eff(o.prop); v = String(v).replace(/"/g, ''); var hit = null; [].forEach.call(s.options, function (op) { if (op.value === v || (o.loose && v.indexOf(op.value) === 0)) hit = op.value; }); s.value = hit != null ? hit : (o.options[0][0]); } });
    f.refresh();
    return rowOf(o.label, [s]);
  }
  function seg(o) {
    var box = E('div', { class: 'seg' });
    var btns = o.options.map(function (x) {
      var b = E('button', { type: 'button', title: x[2] || '', html: x[1], 'data-v': x[0] });
      b.addEventListener('click', function () { if (o.set) o.set(x[0]); else { var m = {}; m[o.prop] = x[0]; P.cssAll(m); } });
      box.appendChild(b); return b;
    });
    var f = reg({
      refresh: function () {
        var v = String(o.get ? o.get() : eff(o.prop));
        btns.forEach(function (b) { var on = b.getAttribute('data-v') === v || (o.match && o.match(v, b.getAttribute('data-v'))); b.classList.toggle('on', !!on); });
      }
    });
    f.refresh();
    return rowOf(o.label, [box]);
  }
  function txt(o) {
    var inp = o.multi ? E('textarea', { class: 'in area', rows: o.rows || 3, spellcheck: 'false' }) : E('input', { type: 'text', class: 'in wide', spellcheck: 'false' });
    if (o.ph) inp.placeholder = o.ph;
    inp.addEventListener('input', function () { o.set(inp.value, false); });
    inp.addEventListener('change', function () { o.set(inp.value, true); });
    var f = reg({ refresh: function () { if (document.activeElement !== inp) inp.value = o.get() || ''; } });
    f.refresh();
    return rowOf(o.label, [inp].concat(o.extra || []), o.multi ? 'stack' : '');
  }
  function btn(label, fn, cls, title) { return E('button', { type: 'button', class: 'btn-s ' + (cls || ''), html: label, title: title || '', onclick: fn }); }
  function section(id, title, build, opts) {
    var body = E('div', { class: 'sec-b' });
    var head = E('button', { type: 'button', class: 'sec-h', html: '<span>' + title + '</span><i></i>' });
    var sec = E('section', { class: 'sec' + (openSec[id] ? ' open' : '') }, [head, body]);
    head.addEventListener('click', function () { openSec[id] = !openSec[id]; sec.classList.toggle('open', openSec[id]); });
    build(body);
    if (opts && opts.reset) {
      head.appendChild(E('span', {
        class: 'sec-reset', title: 'এই অংশের পরিবর্তন মুছুন', text: '↺', onclick: function (e) {
          e.stopPropagation();
          var m = {}; opts.reset.forEach(function (k) { m[k] = ''; }); P.cssAll(m); render();
        }
      }));
    }
    return sec;
  }

  /* ---------- গ্রেডিয়েন্ট বানানো/পড়া ---------- */
  function splitTop(s) {
    var out = [], d = 0, cur = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '(') d++; if (c === ')') d--;
      if (c === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function parseGrad(s) {
    var g = { type: 'linear', angle: 135, stops: [{ c: '#1D5358', p: 0 }, { c: '#4FA8AD', p: 100 }] };
    var m = String(s || '').match(/^(repeating-)?(linear|radial)-gradient\((.*)\)$/i);
    if (!m) return g;
    g.type = m[2].toLowerCase();
    var parts = splitTop(m[3]), stops = [];
    parts.forEach(function (p, i) {
      if (i === 0 && /^(to |[-\d.]+(deg|turn|rad)|circle|ellipse|closest|farthest|at )/i.test(p)) {
        var a = p.match(/(-?[\d.]+)deg/);
        if (a) g.angle = +a[1];
        else if (/to bottom/.test(p)) g.angle = 180; else if (/to right/.test(p)) g.angle = 90; else if (/to top/.test(p)) g.angle = 0; else if (/to left/.test(p)) g.angle = 270;
        return;
      }
      var pm = p.match(/^(.*?)(?:\s+(-?[\d.]+)%)?$/);
      stops.push({ c: pm[1].trim(), p: pm[2] != null ? +pm[2] : null });
    });
    if (stops.length >= 2) {
      stops.forEach(function (st, i) { if (st.p == null) st.p = Math.round(i * 100 / (stops.length - 1)); });
      g.stops = stops;
    }
    return g;
  }
  function buildGrad(g) {
    var st = g.stops.map(function (s) { return s.c + ' ' + s.p + '%'; }).join(', ');
    return g.type === 'radial' ? 'radial-gradient(circle at center, ' + st + ')' : 'linear-gradient(' + g.angle + 'deg, ' + st + ')';
  }
  function gradEditor(getStr, setStr, extraOnApply) {
    var wrap = E('div', { class: 'grad' });
    var g = parseGrad(getStr());
    function apply() { setStr(buildGrad(g)); }
    function draw() {
      wrap.innerHTML = '';
      var bar = E('div', { class: 'grad-bar' }); bar.style.background = buildGrad({ type: 'linear', angle: 90, stops: g.stops });
      wrap.appendChild(bar);
      wrap.appendChild(seg({ label: 'ধরন', options: [['linear', 'সরলরেখা'], ['radial', 'গোলাকার']], get: function () { return g.type; }, set: function (v) { g.type = v; apply(); draw(); } }));
      if (g.type === 'linear') wrap.appendChild(num({ label: 'কোণ', min: 0, max: 360, unit: '°', range: true, get: function () { return g.angle; }, set: function (v) { g.angle = v; apply(); bar.style.background = buildGrad({ type: 'linear', angle: 90, stops: g.stops }); } }));
      g.stops.forEach(function (st, i) {
        var sw = E('input', { type: 'color', class: 'swatch' }); sw.value = P.hex(st.c);
        var tx = E('input', { type: 'text', class: 'in hex', value: st.c, spellcheck: 'false' });
        var pos = E('input', { type: 'number', class: 'in num', min: 0, max: 100, value: st.p });
        sw.addEventListener('input', function () { st.c = sw.value; tx.value = sw.value; apply(); bar.style.background = buildGrad({ type: 'linear', angle: 90, stops: g.stops }); });
        tx.addEventListener('change', function () { st.c = tx.value.trim(); sw.value = P.hex(st.c); apply(); draw(); });
        pos.addEventListener('input', function () { st.p = Math.max(0, Math.min(100, +pos.value || 0)); apply(); bar.style.background = buildGrad({ type: 'linear', angle: 90, stops: g.stops }); });
        var rm = g.stops.length > 2 ? E('button', { class: 'mini', type: 'button', text: '✕', onclick: function () { g.stops.splice(i, 1); apply(); draw(); } }) : null;
        wrap.appendChild(rowOf('রং ' + (i + 1), [sw, tx, pos, E('span', { class: 'unit', text: '%' }), rm], 'color'));
      });
      if (g.stops.length < 5) wrap.appendChild(btn('＋ রং যোগ করুন', function () { var l = g.stops[g.stops.length - 1]; g.stops.splice(g.stops.length - 1, 0, { c: '#C9A98A', p: Math.round((g.stops[g.stops.length - 2].p + l.p) / 2) }); apply(); draw(); }, 'ghost'));
      var pre = E('div', { class: 'presets' });
      GRADS.forEach(function (p) {
        var b = E('button', { type: 'button', class: 'preset', title: 'প্রিসেট' });
        b.style.background = 'linear-gradient(' + p[2] + 'deg,' + p[0] + ',' + p[1] + ')';
        b.addEventListener('click', function () { g = { type: 'linear', angle: p[2], stops: [{ c: p[0], p: 0 }, { c: p[1], p: 100 }] }; apply(); draw(); });
        pre.appendChild(b);
      });
      wrap.appendChild(pre);
    }
    draw();
    return wrap;
  }

  /* ---------- ছবি আপলোড ---------- */
  P.uploadImage = function (file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('শুধু ছবির ফাইল দিন'));
      if (file.size > 8 * 1024 * 1024) return reject(new Error('ছবি ৮ MB-এর বেশি হতে পারবে না'));
      function send(blob, ext, type) {
        var path = 'design/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + '.' + ext;
        PD.upload(blob, path, type).then(resolve, reject);
      }
      if (/svg|gif/.test(file.type)) return send(file, file.type.indexOf('svg') > -1 ? 'svg' : 'gif', file.type);
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var max = 2200, k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        c.toBlob(function (b) { if (b) send(b, 'webp', 'image/webp'); else send(file, 'jpg', file.type); }, 'image/webp', 0.88);
      };
      img.onerror = function () { send(file, 'jpg', file.type); };
      img.src = u;
    });
  };
  function pickFile(cb) {
    var f = E('input', { type: 'file', accept: 'image/*' });
    f.addEventListener('change', function () {
      if (!f.files[0]) return;
      P.toast('ছবি আপলোড হচ্ছে…');
      P.uploadImage(f.files[0]).then(function (u) { cb(u); P.toast('ছবি যোগ হয়েছে'); }).catch(function (e) { P.toast('আপলোড ব্যর্থ: ' + (e.message || e), true); });
    });
    f.click();
  }
  P.pickFile = pickFile;

  /* ---------- অন্যান্য কাজ ---------- */
  function setEditField(k, v) {
    P.selInfo.forEach(function (inf) { var e = P.ensureEdit(inf.sel, inf.scope); if (v == null || v === '') delete e[k]; else e[k] = v; P.pruneEdit(inf.sel, inf.scope); });
    P.changed(true);
  }
  function setAttr(k, v) {
    P.selInfo.forEach(function (inf) {
      var e = P.ensureEdit(inf.sel, inf.scope); e.attrs = e.attrs || {};
      if (v === '' || v == null) delete e.attrs[k]; else e.attrs[k] = v;
      if (!Object.keys(e.attrs).length) delete e.attrs;
      P.pruneEdit(inf.sel, inf.scope);
    });
    P.changed(true);
  }
  function getAttr(k) { var inf = I(), e = P.getEdit(inf.sel, inf.scope); return (e && e.attrs && e.attrs[k]) || inf.el.getAttribute(k) || ''; }
  function setHide(k, on) {
    P.selInfo.forEach(function (inf) {
      var e = P.ensureEdit(inf.sel, inf.scope); e.hide = e.hide || {};
      if (on) e.hide[k] = 1; else delete e.hide[k];
      P.pruneEdit(inf.sel, inf.scope);
    });
    P.changed();
  }
  function getHide(k) { var e = P.getEdit(I().sel, I().scope); return !!(e && e.hide && e.hide[k]); }
  P.toggleHideForDevice = function (el) {
    var k = { b: 'd', t: 't', m: 'm' }[P.bp()];
    var inf = P.selInfo.filter(function (i) { return i.el === el; })[0];
    if (!inf) { var cur = P.sel.slice(); P.select([el]); inf = P.selInfo[0]; }
    var e = P.ensureEdit(inf.sel, inf.scope); e.hide = e.hide || {};
    if (e.hide[k]) delete e.hide[k]; else e.hide[k] = 1;
    P.pruneEdit(inf.sel, inf.scope); P.changed();
  };

  /* ---------- রেন্ডার ---------- */
  function emptyState() {
    root.innerHTML = '';
    var doc = P.mainDoc();
    root.appendChild(E('div', { class: 'insp-empty' }, [
      E('div', { class: 'big', html: icon('<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/>', 'width="34" height="34"') }),
      E('h4', { text: 'কিছু বেছে নিন' }),
      E('p', { text: 'ক্যানভাসে যেকোনো লেখা, ছবি, বাটন বা বক্সে ক্লিক করুন। তারপর টেনে সরান, কোণা ধরে ছোট-বড় করুন, অথবা এখানে রং-লেখা বদলান।' }),
      E('ul', { class: 'tips' }, [
        E('li', { html: '<b>ডাবল-ক্লিক</b> — লেখা সরাসরি এডিট' }),
        E('li', { html: '<b>Shift + ক্লিক</b> — একাধিক বাছাই' }),
        E('li', { html: '<b>তীর কী</b> — ১px সরানো (Shift = ১০px)' }),
        E('li', { html: '<b>Space + টান</b> — ক্যানভাস সরানো' }),
        E('li', { html: '<b>Ctrl + স্ক্রল</b> — জুম' }),
        E('li', { html: '<b>Alt + ↑</b> — প্যারেন্ট বাছাই' })
      ]),
      E('div', { class: 'sep' }),
      E('h5', { text: 'পুরো পেজের ব্যাকগ্রাউন্ড' }),
      btn('পুরো পেজ বাছুন', function () { P.select([doc.body]); }, 'ghost')
    ]));
  }

  function render() {
    fields = [];
    root = root || document.getElementById('insp-body');
    if (!P.selInfo.length) return emptyState();
    var inf = I(), el = inf.el, multi = P.selInfo.length > 1, tag = el.localName;
    var isBody = el === el.ownerDocument.body;
    var isImg = tag === 'img', isSvg = tag === 'svg';
    var isText = P.isTextEl(el);
    var hasText = isText || /^(h[1-6]|p|a|span|button|li|label|blockquote|cite|small|strong|em|div|section|header|footer|nav|main|article|td|th)$/.test(tag);
    root.innerHTML = '';

    /* ---- শীর্ষ কার্ড ---- */
    var top = E('div', { class: 'sel-card' });
    top.appendChild(E('div', { class: 'sel-name', html: '<b>' + (multi ? P.selInfo.length + 'টি এলিমেন্ট বাছা হয়েছে' : escapeHtml(P.label(el, true))) + '</b>' }));
    var acts = E('div', { class: 'sel-acts' }, [
      btn(icon('<polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/>'), function () { var p = el.parentElement; if (p) P.select([p]); }, 'sq', 'প্যারেন্ট বাছুন (Alt + ↑)'),
      btn(icon('<polyline points="7 13 12 18 17 13"/><line x1="12" y1="6" x2="12" y2="18"/>'), function () { var c = el.firstElementChild; if (c) P.select([c]); }, 'sq', 'ভেতরের এলিমেন্ট (Alt + ↓)'),
      btn(icon('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'), function () { P.duplicateSelected(); }, 'sq', 'ডুপ্লিকেট (Ctrl + D)'),
      btn(icon('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>'), function () { P.removeSelected(); }, 'sq danger', 'মুছুন (Delete)')
    ]);
    top.appendChild(acts);
    if (!isBody) {
      top.appendChild(seg({ label: 'প্রয়োগ', options: [['page', 'শুধু এই পেজে'], ['global', 'সব পেজে']], get: function () { return inf.scope; }, set: function (v) { P.setScopeAll(v); } }));
      var simCount = 1; try { simCount = el.ownerDocument.querySelectorAll(P.general(el)).length; } catch (e) {}
      if (simCount > 1 || inf.mode === 'similar') {
        var cb = E('input', { type: 'checkbox' }); cb.checked = inf.mode === 'similar';
        cb.addEventListener('change', function () { P.setSimilar(cb.checked); });
        top.appendChild(E('label', { class: 'chk' }, [cb, E('span', { html: 'একই ধরনের সবগুলোতে প্রয়োগ <em>(' + P.round(simCount) + 'টি)</em>' })]));
      }
    }
    var note = { b: 'কম্পিউটারে করা পরিবর্তন ট্যাবলেট ও মোবাইলেও যাবে — চাইলে ওসব ডিভাইসে আলাদা করে বদলাতে পারবেন।', t: 'ট্যাবলেট (≤১০২৩px) ও মোবাইলের জন্য; কম্পিউটারের ডিজাইন অক্ষত থাকবে।', m: 'শুধু মোবাইলের (≤৭৬৭px) জন্য; কম্পিউটার ও ট্যাবলেট অক্ষত থাকবে।' }[P.bp()];
    top.appendChild(E('div', { class: 'dev-note bp-' + P.bp(), html: '<b>' + P.bpName() + '</b> মোডে সম্পাদনা — ' + note }));
    var rb = E('div', { class: 'reset-row' }, [
      btn('↺ এই ডিভাইসের পরিবর্তন মুছুন', function () {
        P.selInfo.forEach(function (i) { var e = P.getEdit(i.sel, i.scope); if (e && e.css) { delete e.css[P.bp()]; } P.pruneEdit(i.sel, i.scope); });
        P.changed(); render();
      }, 'link'),
      btn('⟲ পুরো এলিমেন্ট আগের মতো', function () {
        P.selInfo.forEach(function (i) { var sc = P.scope(i.scope === 'global' ? 'global' : 'page'); delete sc.edits[i.sel]; });
        P.changed(); render();
      }, 'link')
    ]);
    top.appendChild(rb);
    root.appendChild(top);

    /* ---- অবস্থান ও আকার ---- */
    root.appendChild(section('align', 'অবস্থান ও আকার', function (b) {
      var al = E('div', { class: 'toolrow' });
      [['l', '<line x1="4" y1="3" x2="4" y2="21"/><rect x="8" y="6" width="12" height="4" rx="1"/><rect x="8" y="14" width="7" height="4" rx="1"/>', 'বামে'], ['c', '<line x1="12" y1="3" x2="12" y2="21"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>', 'মাঝে (আড়াআড়ি)'], ['r', '<line x1="20" y1="3" x2="20" y2="21"/><rect x="4" y="6" width="12" height="4" rx="1"/><rect x="9" y="14" width="7" height="4" rx="1"/>', 'ডানে'],
        ['t', '<line x1="3" y1="4" x2="21" y2="4"/><rect x="6" y="8" width="4" height="12" rx="1"/><rect x="14" y="8" width="4" height="7" rx="1"/>', 'ওপরে'], ['m', '<line x1="3" y1="12" x2="21" y2="12"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>', 'মাঝে (লম্বালম্বি)'], ['b', '<line x1="3" y1="20" x2="21" y2="20"/><rect x="6" y="4" width="4" height="12" rx="1"/><rect x="14" y="9" width="4" height="7" rx="1"/>', 'নিচে']
      ].forEach(function (a) { al.appendChild(btn(icon(a[1]), function () { P.align(a[0]); }, 'sq', 'সাজান: ' + a[2] + (multi ? '' : ' (প্যারেন্টের ভেতরে)'))); });
      if (multi) {
        al.appendChild(btn(icon('<rect x="3" y="8" width="4" height="8"/><rect x="10" y="5" width="4" height="14"/><rect x="17" y="8" width="4" height="8"/>'), function () { P.distribute('h'); }, 'sq', 'আড়াআড়ি সমান ফাঁকা'));
        al.appendChild(btn(icon('<rect x="8" y="3" width="8" height="4"/><rect x="5" y="10" width="14" height="4"/><rect x="8" y="17" width="8" height="4"/>'), function () { P.distribute('v'); }, 'sq', 'লম্বালম্বি সমান ফাঁকা'));
      }
      b.appendChild(al);
      var zr = E('div', { class: 'toolrow' }, [
        btn('⤒ সবার ওপরে', function () { P.zOrder('front'); }, 'ghost'), btn('↑ এক ধাপ', function () { P.zOrder('up'); }, 'ghost'), btn('↓ এক ধাপ', function () { P.zOrder('down'); }, 'ghost'), btn('⤓ সবার নিচে', function () { P.zOrder('back'); }, 'ghost')
      ]);
      b.appendChild(zr);
      var xy = E('div', { class: 'grid2' }, [
        num({ label: 'X', get: function () { return parseTr(cs().translate)[0]; }, set: function (v) { var t = parseTr(cs().translate); P.cssAll({ translate: v + 'px ' + t[1] + 'px' }); }, dec: 1, cls: 'compact' }),
        num({ label: 'Y', get: function () { return parseTr(cs().translate)[1]; }, set: function (v) { var t = parseTr(cs().translate); P.cssAll({ translate: t[0] + 'px ' + v + 'px' }); }, dec: 1, cls: 'compact' }),
        num({ label: 'প্রস্থ', get: function () { return el.offsetWidth || el.getBoundingClientRect().width; }, set: function (v) { sizeSet('width', v); }, min: 1, dec: 0, cls: 'compact' }),
        num({ label: 'উচ্চতা', get: function () { return el.offsetHeight || el.getBoundingClientRect().height; }, set: function (v) { sizeSet('height', v); }, min: 1, dec: 0, cls: 'compact' })
      ]);
      b.appendChild(xy);
      b.appendChild(E('div', { class: 'toolrow' }, [
        btn('প্রস্থ: অটো', function () { P.cssAll({ width: 'auto' }); }, 'ghost'), btn('প্রস্থ: ১০০%', function () { P.cssAll({ width: '100%', 'max-width': 'none' }); }, 'ghost'), btn('উচ্চতা: অটো', function () { P.cssAll({ height: 'auto' }); }, 'ghost'),
        btn('↺ অবস্থান রিসেট', function () { P.cssAll({ translate: '' }); render(); }, 'ghost')
      ]));
      b.appendChild(num({ label: 'ঘোরানো', unit: '°', min: -180, max: 180, range: true, get: function () { var m = String(cs().rotate || '0').match(/-?[\d.]+/); return m ? +m[0] : 0; }, set: function (v) { P.cssAll({ rotate: v + 'deg' }); } }));
      b.appendChild(num({ label: 'স্কেল', unit: '%', min: 10, max: 300, range: true, get: function () { return (parseFloat((cs().scale || '1').split(' ')[0]) || 1) * 100; }, set: function (v) { P.cssAll({ scale: (v / 100) }); } }));
      b.appendChild(E('div', { class: 'toolrow' }, [
        btn('⇆ আড়াআড়ি উল্টান', function () { var s = parseFloat((cs().scale || '1').split(' ')[0]) || 1; var sy = parseFloat((cs().scale || '1 1').split(' ')[1]) || s; P.cssAll({ scale: (-s) + ' ' + sy }); }, 'ghost'),
        btn('⇅ লম্বালম্বি উল্টান', function () { var s = parseFloat((cs().scale || '1').split(' ')[0]) || 1; var sy = parseFloat((cs().scale || '1 1').split(' ')[1]) || s; P.cssAll({ scale: s + ' ' + (-sy) }); }, 'ghost')
      ]));
    }, { reset: ['translate', 'rotate', 'scale', 'width', 'height', 'z-index'] }));

    /* ---- লেখা ---- */
    if (hasText && !isImg && !isSvg) root.appendChild(section('text', 'লেখা ও টাইপোগ্রাফি', function (b) {
      if (isText && !multi) {
        b.appendChild(txt({
          label: 'লেখা', multi: true, rows: 3,
          get: function () { var e = P.getEdit(inf.sel, inf.scope); return e && e.text != null ? e.text : (el.children.length ? '' : el.textContent); },
          set: function (v, fin) { if (el.children.length) return; setEditField('text', v); }
        }));
        if (el.children.length) b.appendChild(E('p', { class: 'hint', text: 'এই লেখায় বোল্ড/লিংকের মতো অংশ আছে — ক্যানভাসে ডাবল-ক্লিক করে এডিট করুন।' }));
        b.appendChild(btn('✎ ক্যানভাসে এডিট করুন', function () { P.startEditing(el); }, 'ghost'));
      }
      b.appendChild(sel({
        label: 'ফন্ট', prop: 'font-family', loose: true,
        options: [['Gunjoron', 'গুঞ্জরন (সাইটের ফন্ট)'], ['Georgia', 'সেরিফ (Georgia)'], ['Arial', 'সান্স (Arial)'], ['Courier New', 'মনোস্পেস'], ['Trebuchet MS', 'Trebuchet']],
        get: function () { var v = eff('font-family').split(',')[0].replace(/["']/g, '').trim(); return v; },
        set: function (v) { P.cssAll({ 'font-family': v === 'Gunjoron' ? "'Gunjoron', serif" : "'" + v + "', " + (v === 'Georgia' ? 'serif' : v === 'Courier New' ? 'monospace' : 'sans-serif') }); }
      }));
      b.appendChild(seg({ label: 'ওজন', options: [['300', 'পাতলা'], ['400', 'সাধারণ'], ['700', 'গাঢ়']], prop: 'font-weight', match: function (v, o) { var n = +v; return o === '300' ? n < 350 : o === '400' ? n >= 350 && n < 600 : n >= 600; } }));
      b.appendChild(num({ label: 'সাইজ', prop: 'font-size', min: 6, max: 200, range: true, dec: 1 }));
      b.appendChild(num({ label: 'লাইন-ফাঁক', unit: '', min: 0.8, max: 3, step: 0.05, range: true, dec: 2, get: function () { var c = cs(), lh = parseFloat(P.getCss(inf, 'line-height') != null ? P.getCss(inf, 'line-height') : c.lineHeight), fs = parseFloat(c.fontSize); return isNaN(lh) ? 1.3 : lh > 8 ? lh / fs : lh; }, set: function (v) { P.cssAll({ 'line-height': String(v) }); } }));
      b.appendChild(num({ label: 'অক্ষর-ফাঁক', unit: 'px', min: -5, max: 30, step: 0.1, range: true, dec: 1, get: function () { var v = parseFloat(eff('letter-spacing')); return isNaN(v) ? 0 : v; }, set: function (v) { P.cssAll({ 'letter-spacing': v + 'px' }); } }));
      b.appendChild(seg({
        label: 'সারিবদ্ধ', prop: 'text-align', options: [['left', icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="14" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>'), 'বামে'], ['center', icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="5" y1="18" x2="19" y2="18"/>'), 'মাঝে'], ['right', icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>'), 'ডানে'], ['justify', icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>'), 'দুই পাশে']],
        match: function (v, o) { return (v === 'start' && o === 'left') || (v === 'end' && o === 'right'); }
      }));
      b.appendChild(seg({
        label: 'স্টাইল', options: [['i', '<i>I</i>', 'বাঁকা'], ['u', '<u>U</u>', 'দাগ'], ['s', '<s>S</s>', 'কাটা'], ['n', 'অ', 'কিছু না']],
        get: function () { var f = eff('font-style'), d = eff('text-decoration-line') || eff('text-decoration'); return f === 'italic' ? 'i' : /underline/.test(d) ? 'u' : /line-through/.test(d) ? 's' : 'n'; },
        set: function (v) { P.cssAll({ 'font-style': v === 'i' ? 'italic' : 'normal', 'text-decoration': v === 'u' ? 'underline' : v === 's' ? 'line-through' : 'none' }); }
      }));
      b.appendChild(sel({ label: 'কেস', prop: 'text-transform', options: [['none', 'যেমন আছে'], ['uppercase', 'বড় হাতের'], ['lowercase', 'ছোট হাতের'], ['capitalize', 'প্রতি শব্দের শুরু বড়']] }));
      b.appendChild(color({ label: 'রং', prop: 'color' }));
      b.appendChild(sel({ label: 'ছায়া', get: function () { var v = P.getCss(inf, 'text-shadow'); return v == null ? '' : v; }, set: function (v) { P.cssAll({ 'text-shadow': v }); }, options: TSHADOWS }));
      var gOn = E('input', { type: 'checkbox' });
      var gBox = E('div', { class: 'sub' });
      function gradOn() { return /text/.test(P.getCss(inf, '-webkit-background-clip') || ''); }
      gOn.checked = gradOn();
      function drawG() {
        gBox.innerHTML = '';
        if (!gOn.checked) return;
        gBox.appendChild(gradEditor(function () { return P.getCss(inf, 'background-image') || ''; }, function (s) {
          P.cssAll({ 'background-image': s, '-webkit-background-clip': 'text', 'background-clip': 'text', '-webkit-text-fill-color': 'transparent', color: 'transparent' });
        }));
      }
      gOn.addEventListener('change', function () {
        if (gOn.checked) { P.cssAll({ 'background-image': buildGrad(parseGrad('')), '-webkit-background-clip': 'text', 'background-clip': 'text', '-webkit-text-fill-color': 'transparent', color: 'transparent' }); }
        else P.cssAll({ 'background-image': '', '-webkit-background-clip': '', 'background-clip': '', '-webkit-text-fill-color': '', color: '' });
        drawG(); render();
      });
      b.appendChild(E('label', { class: 'chk' }, [gOn, E('span', { text: 'লেখায় গ্রেডিয়েন্ট রং' })]));
      b.appendChild(gBox); drawG();
    }, { reset: ['font-family', 'font-weight', 'font-size', 'line-height', 'letter-spacing', 'text-align', 'font-style', 'text-decoration', 'text-transform', 'color', 'text-shadow', '-webkit-background-clip', 'background-clip', '-webkit-text-fill-color'] }));

    /* ---- ফিল ---- */
    root.appendChild(section('fill', 'ব্যাকগ্রাউন্ড (ফিল)', function (b) {
      var holder = E('div');
      function mode() {
        var bi = (P.getCss(inf, 'background-image') != null ? P.getCss(inf, 'background-image') : cs().backgroundImage) || 'none';
        var bc = P.getCss(inf, 'background-color') != null ? P.getCss(inf, 'background-color') : cs().backgroundColor;
        if (/gradient/.test(bi)) return 'grad';
        if (/url\(/.test(bi)) return 'img';
        if (bc && bc !== 'rgba(0, 0, 0, 0)' && bc !== 'transparent') return 'solid';
        return 'none';
      }
      function drawFill() {
        holder.innerHTML = '';
        var m = mode();
        if (m === 'solid') holder.appendChild(color({ label: 'রং', prop: 'background-color', none: true }));
        if (m === 'grad') holder.appendChild(gradEditor(function () { return P.getCss(inf, 'background-image') || cs().backgroundImage; }, function (s) { P.cssAll({ 'background-image': s }); }));
        if (m === 'img') {
          holder.appendChild(txt({ label: 'ছবির লিংক', get: function () { var v = P.getCss(inf, 'background-image') || ''; var mm = v.match(/url\("?([^")]+)"?\)/); return mm ? mm[1] : ''; }, set: function (v, fin) { if (fin) P.cssAll({ 'background-image': v ? 'url("' + v + '")' : '' }); }, extra: [btn('আপলোড', function () { pickFile(function (u) { P.cssAll({ 'background-image': 'url("' + u + '")', 'background-size': 'cover', 'background-position': 'center', 'background-repeat': 'no-repeat' }); drawFill(); }); }, 'ghost')] }));
          holder.appendChild(sel({ label: 'আকার', prop: 'background-size', options: [['cover', 'ভরাট (cover)'], ['contain', 'পুরো ছবি (contain)'], ['auto', 'আসল সাইজ'], ['100% 100%', 'টেনে ভরা']] }));
          holder.appendChild(sel({ label: 'অবস্থান', prop: 'background-position', loose: true, options: [['50% 50%', 'মাঝে'], ['50% 0%', 'ওপরে'], ['50% 100%', 'নিচে'], ['0% 50%', 'বামে'], ['100% 50%', 'ডানে']] }));
          holder.appendChild(sel({ label: 'পুনরাবৃত্তি', prop: 'background-repeat', options: [['no-repeat', 'না'], ['repeat', 'হ্যাঁ']] }));
          holder.appendChild(color({ label: 'নিচের রং', prop: 'background-color', none: true }));
        }
        fields.forEach(function (f) { f.refresh(); });
      }
      b.appendChild(seg({
        label: 'ধরন', options: [['none', 'কিছু না'], ['solid', 'রং'], ['grad', 'গ্রেডিয়েন্ট'], ['img', 'ছবি']],
        get: mode,
        set: function (v) {
          var cur = mode();
          if (v === 'none') P.cssAll({ 'background-color': 'transparent', 'background-image': 'none' });
          else if (v === 'solid') { var c = P.hex(cs().backgroundColor === 'rgba(0, 0, 0, 0)' ? '#ffffff' : cs().backgroundColor); P.cssAll({ 'background-color': c, 'background-image': 'none' }); }
          else if (v === 'grad') P.cssAll({ 'background-image': buildGrad(parseGrad('')) });
          else if (v === 'img') { pickFile(function (u) { P.cssAll({ 'background-image': 'url("' + u + '")', 'background-size': 'cover', 'background-position': 'center', 'background-repeat': 'no-repeat' }); render(); }); return; }
          render();
        }
      }));
      b.appendChild(holder); drawFill();
      b.appendChild(num({ label: 'স্বচ্ছতা', prop: 'opacity', unit: '%', min: 0, max: 100, range: true, get: function () { return P.num(eff('opacity'), 1) * 100; }, set: function (v) { P.cssAll({ opacity: String(v / 100) }); } }));
    }, { reset: ['background', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat', 'opacity'] }));

    /* ---- বর্ডার, কোণ, ছায়া ---- */
    root.appendChild(section('border', 'বর্ডার, কোণ ও ছায়া', function (b) {
      b.appendChild(num({ label: 'বর্ডার', unit: 'px', min: 0, max: 40, range: true, get: function () { return P.num(eff('border-top-width')); }, set: function (v) { var o = { 'border-width': v + 'px' }; if (v > 0 && cs().borderTopStyle === 'none') o['border-style'] = 'solid'; P.cssAll(o); } }));
      b.appendChild(sel({ label: 'ধরন', get: function () { return cs().borderTopStyle; }, set: function (v) { P.cssAll({ 'border-style': v }); }, options: [['none', 'নেই'], ['solid', 'সরল'], ['dashed', 'ড্যাশ'], ['dotted', 'ডট'], ['double', 'ডাবল']] }));
      b.appendChild(colorCtl({ label: 'বর্ডার রং', get: function () { return P.getCss(inf, 'border-color') || cs().borderTopColor; }, set: function (v) { P.cssAll({ 'border-color': v }); } }));
      b.appendChild(num({ label: 'কোণ গোল', unit: 'px', min: 0, max: 200, range: true, get: function () { return P.num(eff('border-top-left-radius')); }, set: function (v) { P.cssAll({ 'border-radius': v + 'px' }); } }));
      b.appendChild(toolBtns([['গোল', '999px'], ['কোণা', '0px'], ['নরম', '14px']], function (v) { P.cssAll({ 'border-radius': v }); render(); }));
      b.appendChild(sel({ label: 'বক্স-ছায়া', get: function () { var v = P.getCss(inf, 'box-shadow'); var hit = ''; SHADOWS.forEach(function (s) { if (s[0] === v) hit = s[0]; }); return v == null ? '' : (hit || '__custom'); }, set: function (v) { if (v === '__custom') return; P.cssAll({ 'box-shadow': v }); render(); }, options: SHADOWS.concat([['__custom', 'কাস্টম…']]) }));
      var sh = parseShadow(P.getCss(inf, 'box-shadow'));
      var cust = E('div', { class: 'grid2' });
      function upShadow() { P.cssAll({ 'box-shadow': (sh.inset ? 'inset ' : '') + sh.x + 'px ' + sh.y + 'px ' + sh.b + 'px ' + sh.s + 'px ' + sh.c }); }
      [['x', 'X'], ['y', 'Y'], ['b', 'ঝাপসা'], ['s', 'ছড়ানো']].forEach(function (k) {
        cust.appendChild(num({ label: k[1], cls: 'compact', get: function () { return sh[k[0]]; }, set: function (v) { sh[k[0]] = v; upShadow(); } }));
      });
      b.appendChild(cust);
      b.appendChild(colorCtl({ label: 'ছায়ার রং', get: function () { return sh.c; }, set: function (v) { sh.c = v || 'rgba(0,0,0,.2)'; upShadow(); } }));
      b.appendChild(num({ label: 'ঝাপসা (ব্লার)', unit: 'px', min: 0, max: 30, range: true, get: function () { var m = String(eff('filter')).match(/blur\(([\d.]+)px\)/); return m ? +m[1] : 0; }, set: function (v) { P.cssAll({ filter: v ? 'blur(' + v + 'px)' : 'none' }); } }));
    }, { reset: ['border', 'border-width', 'border-style', 'border-color', 'border-radius', 'box-shadow', 'filter'] }));

    /* ---- স্পেসিং ও লেআউট ---- */
    root.appendChild(section('space', 'স্পেসিং ও লেআউট', function (b) {
      b.appendChild(E('h6', { text: 'প্যাডিং (ভেতরের ফাঁক)' }));
      b.appendChild(E('div', { class: 'grid2' }, ['top', 'right', 'bottom', 'left'].map(function (s, i) { return num({ label: ['ওপর', 'ডান', 'নিচ', 'বাম'][i], cls: 'compact', prop: 'padding-' + s, min: 0 }); })));
      b.appendChild(E('h6', { text: 'মার্জিন (বাইরের ফাঁক)' }));
      b.appendChild(E('div', { class: 'grid2' }, ['top', 'right', 'bottom', 'left'].map(function (s, i) { return num({ label: ['ওপর', 'ডান', 'নিচ', 'বাম'][i], cls: 'compact', prop: 'margin-' + s }); })));
      b.appendChild(E('h6', { text: 'ভেতরের এলিমেন্ট সাজানো' }));
      b.appendChild(sel({ label: 'ধরন', prop: 'display', options: [['block', 'ব্লক (ওপর-নিচ)'], ['flex', 'ফ্লেক্স (সারি/কলাম)'], ['grid', 'গ্রিড'], ['inline-block', 'ইনলাইন-ব্লক'], ['inline', 'ইনলাইন'], ['inline-flex', 'ইনলাইন-ফ্লেক্স']] }));
      b.appendChild(seg({ label: 'দিক', prop: 'flex-direction', options: [['row', '→ সারি'], ['column', '↓ কলাম'], ['row-reverse', '← উল্টো'], ['column-reverse', '↑ উল্টো']] }));
      b.appendChild(seg({ label: 'আড়াআড়ি', prop: 'justify-content', options: [['flex-start', 'শুরু'], ['center', 'মাঝে'], ['flex-end', 'শেষ'], ['space-between', 'ছড়ানো']] }));
      b.appendChild(seg({ label: 'লম্বালম্বি', prop: 'align-items', options: [['flex-start', 'শুরু'], ['center', 'মাঝে'], ['flex-end', 'শেষ'], ['stretch', 'টানা']], match: function (v, o) { return v === 'normal' && o === 'stretch'; } }));
      b.appendChild(num({ label: 'ফাঁক (gap)', prop: 'gap', min: 0, max: 120, range: true, get: function () { return P.num(eff('column-gap')); } }));
      b.appendChild(seg({ label: 'লাইন ভাঙা', prop: 'flex-wrap', options: [['nowrap', 'না'], ['wrap', 'হ্যাঁ']] }));
      b.appendChild(txt({ label: 'গ্রিড কলাম', ph: 'repeat(3, 1fr)', get: function () { return P.getCss(inf, 'grid-template-columns') || ''; }, set: function (v, fin) { if (fin) P.cssAll({ 'grid-template-columns': v }); } }));
    }, { reset: ['padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'display', 'flex-direction', 'justify-content', 'align-items', 'gap', 'flex-wrap', 'grid-template-columns'] }));

    /* ---- লিংক ও ছবি ---- */
    var linkEl = tag === 'a' || tag === 'button' || el.closest('a');
    if (isImg || tag === 'a' || tag === 'button') root.appendChild(section('link', isImg ? 'ছবি' : 'লিংক', function (b) {
      if (isImg) {
        b.appendChild(txt({ label: 'ছবির লিংক', get: function () { return getAttr('src'); }, set: function (v, fin) { if (fin) setAttr('src', v); } }));
        b.appendChild(btn('⬆ নতুন ছবি আপলোড', function () { pickFile(function (u) { setAttr('src', u); render(); }); }, 'primary'));
        b.appendChild(txt({ label: 'বিকল্প লেখা', get: function () { return getAttr('alt'); }, set: function (v, fin) { if (fin) setAttr('alt', v); } }));
        b.appendChild(sel({ label: 'ফিট', prop: 'object-fit', options: [['cover', 'ভরাট (crop)'], ['contain', 'পুরো ছবি'], ['fill', 'টেনে ভরা'], ['none', 'আসল']] }));
      }
      if (tag === 'a' || (tag === 'button' && false)) {
        b.appendChild(txt({ label: 'ঠিকানা (URL)', ph: 'https://…  অথবা  archive.html', get: function () { return getAttr('href'); }, set: function (v, fin) { if (fin) { if (v && !PDDesign_safe(v)) { P.toast('এই ঠিকানা অনুমোদিত নয় (শুধু https://, mailto:, tel: বা সাইটের পেজ)', true); return; } setAttr('href', v); } } }));
        var nt = E('input', { type: 'checkbox' }); nt.checked = getAttr('target') === '_blank';
        nt.addEventListener('change', function () { setAttr('target', nt.checked ? '_blank' : ''); });
        b.appendChild(E('label', { class: 'chk' }, [nt, E('span', { text: 'নতুন ট্যাবে খুলুক' })]));
      }
    }));
    function PDDesign_safe(v) { return P.mainWin().PDDesign.safeHref(v); }

    /* ---- দৃশ্যমানতা ---- */
    root.appendChild(section('vis', 'দৃশ্যমানতা (অন/অফ)', function (b) {
      [['d', 'কম্পিউটারে দেখান'], ['t', 'ট্যাবলেটে দেখান'], ['m', 'মোবাইলে দেখান']].forEach(function (x) {
        var cb = E('input', { type: 'checkbox' }); cb.checked = !getHide(x[0]);
        cb.addEventListener('change', function () { setHide(x[0], !cb.checked); });
        b.appendChild(E('label', { class: 'chk' }, [cb, E('span', { text: x[1] })]));
      });
      b.appendChild(E('p', { class: 'hint', text: 'এলিমেন্টটি পুরোপুরি মুছতে চাইলে ওপরের ডাস্টবিন বাটন বা Delete চাপুন।' }));
    }));

    /* ---- উন্নত ---- */
    root.appendChild(section('adv', 'উন্নত (CSS)', function (b) {
      b.appendChild(txt({
        label: 'এই ডিভাইসের CSS', multi: true, rows: 5, ph: 'যেমন:\nletter-spacing: 2px\nborder-bottom: 2px solid #9B7257',
        get: function () { var e = P.getEdit(inf.sel, inf.scope); var o = e && e.css && e.css[P.bp()] || {}; return Object.keys(o).map(function (k) { return k + ': ' + o[k]; }).join('\n'); },
        set: function (v, fin) {
          if (!fin) return;
          var obj = {}, cur = P.getEdit(inf.sel, inf.scope), old = cur && cur.css && cur.css[P.bp()] || {};
          Object.keys(old).forEach(function (k) { obj[k] = ''; });
          v.split('\n').forEach(function (ln) { var m = ln.replace(/;\s*$/, '').match(/^\s*([a-z-]+)\s*:\s*(.+)$/i); if (m) obj[m[1].toLowerCase()] = m[2]; });
          P.cssAll(obj);
        }
      }));
      b.appendChild(E('p', { class: 'hint', text: 'শুধু নিরাপদ স্টাইল প্রপার্টি গ্রহণ হবে। স্ক্রিপ্ট বা বাইরের কোড চলবে না।' }));
    }));
    P.emit('inspector');
  }

  function toolBtns(list, fn) {
    return E('div', { class: 'toolrow' }, list.map(function (x) { return btn(x[0], function () { fn(x[1]); }, 'ghost'); }));
  }
  function parseTr(v) { if (!v || v === 'none') return [0, 0]; var p = v.split(/\s+/); return [parseFloat(p[0]) || 0, parseFloat(p[1]) || 0]; }
  function parseShadow(s) {
    var o = { x: 0, y: 8, b: 24, s: 0, c: 'rgba(0,0,0,.2)', inset: false };
    if (!s) return o;
    var inset = /inset/.test(s); s = s.replace('inset', '').trim();
    var col = s.match(/(rgba?\([^)]+\)|#[0-9a-f]{3,8})/i);
    if (col) { o.c = col[1]; s = s.replace(col[1], ''); }
    var n = s.trim().split(/\s+/).map(parseFloat);
    o.x = n[0] || 0; o.y = n[1] || 0; o.b = n[2] || 0; o.s = n[3] || 0; o.inset = inset;
    return o;
  }
  function sizeSet(prop, v) {
    var o = {}; o[prop] = v + 'px';
    var c = cs();
    if (c.display === 'inline') o.display = 'inline-block';
    o['max-width'] = 'none'; o['min-width'] = '0';
    if (/flex/.test(P.cs(I().el.parentElement || I().el).display)) o.flex = '0 0 auto';
    P.cssAll(o);
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function refreshAll() { fields.forEach(function (f) { try { f.refresh(); } catch (e) {} }); }

  P.initInspector = function () {
    root = document.getElementById('insp-body');
    P.on('select', render);
    P.on('device', function () { if (P.selInfo.length) P.select(P.sel.slice(), true); else render(); });
    P.on('live', refreshAll);
    P.on('restored', render);
    P.on('replaceImage', function () { pickFile(function (u) { setAttr('src', u); render(); }); });
    render();
  };
  P.renderInspector = render;
  P.escapeHtml = escapeHtml;
})();
