/* studio-canvas.js — ক্যানভাস: ডিভাইস ফ্রেম, জুম, নির্বাচন, ড্র্যাগ, রিসাইজ, ঘোরানো, স্ন্যাপ, লেখা এডিট, কিবোর্ড */
(function () {
  'use strict';
  var P = window.PDS;
  var PAD = 16;
  var board, stage, ov, hoverBox, guidesBox, boxes = [];
  var drag = null, editing = null, spaceDown = false;
  P.zoom = 1; P.fitMode = true; P.split = false;

  /* ================= ফ্রেম ================= */
  function Frame(id, slot) {
    var f = this;
    f.id = id;
    f.slot = slot;
    f.label = P.el('div', { class: 'dev-label' });
    f.box = P.el('div', { class: 'frame-box' });
    f.ifr = P.el('iframe', { class: 'frame', title: id === 'main' ? 'এডিট ক্যানভাস' : 'লাইভ প্রিভিউ' });
    f.ifr.setAttribute('loading', 'eager');
    f.box.appendChild(f.ifr);
    slot.appendChild(f.label); slot.appendChild(f.box);
    f.w = 1280; f.h = 800; f.z = 1;
    f.ifr.addEventListener('load', function () { onFrameLoad(f); });
  }
  Frame.prototype.win = function () { try { return this.ifr.contentWindow; } catch (e) { return null; } };
  Frame.prototype.size = function (w, h, z) {
    this.w = w; this.h = h; this.z = z;
    this.ifr.style.width = w + 'px'; this.ifr.style.height = h + 'px';
    this.ifr.style.transform = 'scale(' + z + ')';
    this.box.style.width = Math.round(w * z) + 'px'; this.box.style.height = Math.round(h * z) + 'px';
  };
  Frame.prototype.load = function (url) {
    var u = url + (url.indexOf('?') > -1 ? '&' : '?') + 'pdstudio=1';
    this.ifr.src = u;
  };

  function pageUrl(pg) {
    var url = pg.url;
    if (pg.dyn === 'article' && P.sample.article) url += '?id=' + encodeURIComponent(P.sample.article);
    if (pg.dyn === 'issue' && P.sample.issue) url += '?id=' + encodeURIComponent(P.sample.issue);
    if (pg.dyn === 'author' && P.sample.author) url += '?slug=' + encodeURIComponent(P.sample.author);
    return url;
  }
  P.sample = {};
  P.pageInfo = function (pk) {
    var pg = P.PAGES.filter(function (x) { return x.key === pk; })[0];
    if (pg) return pg;
    if (pk.indexOf('page:') === 0) {
      var slug = pk.slice(5), c = P.design.custom[slug];
      return { key: pk, url: 'page.html?p=' + encodeURIComponent(slug), name: c ? c.title : slug, custom: true };
    }
    return { key: pk, url: pk + '.html', name: pk };
  };
  P.loadPage = function (pk) {
    P.pk = pk;
    P.select([], true);
    var pg = P.pageInfo(pk);
    var url = pg.custom ? pg.url : pageUrl(pg);
    P.frames.main.load(url);
    if (P.split) P.frames.prev.load(url);
    P.emit('page');
  };

  function onFrameLoad(f) {
    var w = f.win();
    if (!w || !w.PDDesign) return;
    /* লাইভ প্রিভিউতে অন্য পেজে গেলে স্টুডিওর পেজও মিলিয়ে নেওয়া */
    var pk = w.PDDesign.pageKey();
    if (f.id === 'main' && pk !== P.pk) { P.pk = pk; P.select([], true); P.emit('page'); }
    w.PDDesign.set(P.design);
    applyThemeMode(w);
    if (f.id === 'main') attachEditing(f, w);
    P.emit('frameload', f.id);
    P.fit();
  }
  function applyThemeMode(w) {
    try { w.document.documentElement.setAttribute('data-theme', P.themeMode); } catch (e) {}
  }
  P.setThemeMode = function (m) {
    P.themeMode = m;
    Object.keys(P.frames).forEach(function (k) { var w = P.frames[k].win(); if (w) applyThemeMode(w); });
    P.emit('thememode');
  };

  /* ================= লেআউট / জুম ================= */
  function prevDevice() { return P.width > 767 ? P.DEV.mob : P.DEV.pc; }
  P.layout = function () {
    var main = P.frames.main, prev = P.frames.prev;
    var bw = board.clientWidth - 80, bh = board.clientHeight - 100;
    var w = P.width, h = P.dev.h;
    var avail = P.split ? bw - 520 : bw;
    if (P.fitMode) {
      P.zoom = P.dev.id === 'pc' ? Math.min(avail / w, 1) : Math.min(avail / w, bh / h, 1);
      P.zoom = Math.max(0.15, P.zoom);
    }
    if (P.dev.id === 'pc') h = Math.max(h, Math.round(bh / P.zoom));
    P.dev.h = P.dev.id === 'pc' ? P.dev.h : P.dev.h;
    main.size(w, h, P.zoom);
    main.label.textContent = P.dev.name + ' · ' + w + ' × ' + h + 'px  —  ' + P.bpName() + ' ডিজাইন চলছে';
    prev.slot.style.display = P.split ? '' : 'none';
    if (P.split) {
      var pd = prevDevice();
      var pz = Math.max(0.15, Math.min(480 / pd.w, (h * P.zoom) / pd.h, 1));
      prev.size(pd.w, pd.h, pz);
      prev.label.textContent = 'লাইভ প্রিভিউ · ' + pd.name + ' ' + pd.w + 'px';
    }
    P.emit('zoom');
    P.ovDirty();
  };
  P.fit = function () { P.fitMode = true; P.layout(); };
  P.setZoom = function (z) { P.fitMode = false; P.zoom = Math.max(0.1, Math.min(3, z)); P.layout(); };
  P.setDevice = function (id, width) {
    P.dev = P.DEV[id];
    P.width = width || P.dev.w;
    if (P.frames.prev && P.split && P.frames.prev.loaded !== P.pk) { /* প্রিভিউ ডিভাইস বদলায়, URL একই */ }
    P.layout(); P.emit('device'); P.select(P.sel.slice(), true);
  };
  P.setSplit = function (on) {
    P.split = !!on;
    var prev = P.frames.prev;
    if (on && !prev.ifr.getAttribute('src')) { var pg = P.pageInfo(P.pk); prev.load(pg.custom ? pg.url : pageUrl(pg)); }
    P.layout(); P.emit('split');
  };
  P.setMode = function (m) {
    P.mode = m;
    document.body.classList.toggle('mode-preview', m === 'preview');
    if (m === 'preview') { P.select([], true); stopEditing(true); }
    P.emit('mode');
  };

  /* ================= অ্যাটাচ: আইফ্রেমের ভেতরের ইভেন্ট ================= */
  function attachEditing(f, w) {
    var d = w.document;
    if (d.__pdAttached) return;
    d.__pdAttached = true;
    var st = d.createElement('style');
    st.textContent = 'html.pd-studio *{cursor:default!important}html.pd-studio a,html.pd-studio button{cursor:default!important}[data-pd-editing]{cursor:text!important;outline:2px solid #38bdf8!important;outline-offset:2px}html.pd-studio.pd-dragging *{user-select:none!important}html.pd-studio.pd-pan *{cursor:grab!important}html.pd-studio img{-webkit-user-drag:none}';
    d.head.appendChild(st);
    d.addEventListener('mousedown', onDown, true);
    d.addEventListener('mousemove', onHover, true);
    d.addEventListener('mouseleave', function () { setHover(null); }, true);
    ['click', 'auxclick', 'contextmenu', 'dragstart', 'submit', 'mouseup'].forEach(function (n) {
      d.addEventListener(n, function (e) {
        if (P.mode === 'preview') { if (n === 'click') guardLinks(e); return; }
        if (editing && editing.el.contains(e.target) && (n === 'click' || n === 'mouseup')) return;
        if (n === 'mouseup') return;
        e.preventDefault(); e.stopPropagation();
      }, true);
    });
    d.addEventListener('dblclick', function (e) {
      if (P.mode === 'preview') return;
      e.preventDefault(); e.stopPropagation();
      var t = pick(e); if (!t) return;
      if (t.localName === 'img' || (t.localName === 'svg' && false)) { P.select([t]); P.emit('replaceImage'); return; }
      startEditing(t);
    }, true);
    d.addEventListener('keydown', onKey, true);
    d.addEventListener('keyup', onKeyUp, true);
    d.addEventListener('wheel', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault(); P.setZoom(P.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
    }, { passive: false, capture: true });
    w.addEventListener('scroll', P.ovDirty, true);
    w.addEventListener('resize', P.ovDirty);
  }
  function guardLinks(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && /^(mailto:|tel:)/i.test(a.getAttribute('href'))) { e.preventDefault(); }
  }

  /* কোন এলিমেন্টে ক্লিক হলো */
  function pick(e) {
    var t = e.target;
    if (!t) return null;
    if (t.nodeType !== 1) t = t.parentElement;
    if (!t) return null;
    var svg = t.closest('svg');
    if (svg && t.localName !== 'svg') t = svg;
    if (t === t.ownerDocument.documentElement) t = t.ownerDocument.body;
    return t;
  }
  function frameRect() { return P.frames.main.ifr.getBoundingClientRect(); }
  function toParent(e, fromIframe) {
    if (!fromIframe) return { x: e.clientX, y: e.clientY, e: e };
    var r = frameRect(), z = P.frames.main.z;
    return { x: r.left + e.clientX * z, y: r.top + e.clientY * z, e: e };
  }

  /* ================= নির্বাচন ================= */
  P.select = function (els, silent) {
    els = (els || []).filter(function (e) { return e && e.ownerDocument === P.mainDoc(); });
    var seen = [];
    els.forEach(function (e) { if (seen.indexOf(e) < 0) seen.push(e); });
    P.sel = seen;
    P.selInfo = seen.map(info);
    P.ovDirty();
    if (!silent || silent === true) P.emit('select');
  };
  function defaultScope(el) {
    if (el.closest && el.closest('header, footer, .topbar, .site-header, .site-footer')) return 'global';
    return 'page';
  }
  function info(el) {
    var u = P.uniq(el), scope, sel = u, mode = 'unique';
    var ed = P.design;
    if (ed.pages[P.pk] && ed.pages[P.pk].edits[u]) scope = 'page';
    else if (ed.global.edits[u]) scope = 'global';
    else {
      var found = null;
      [['page', ed.pages[P.pk]], ['global', ed.global]].forEach(function (pair) {
        if (found || !pair[1]) return;
        Object.keys(pair[1].edits).forEach(function (k) {
          if (found || k === u) return;
          try { if (el.matches(k) && el.ownerDocument.querySelectorAll(k).length > 1) found = { k: k, s: pair[0] }; } catch (e) {}
        });
      });
      if (found) { sel = found.k; scope = found.s; mode = 'similar'; }
      else scope = defaultScope(el);
    }
    var added = el.hasAttribute('data-pd-gen');
    return { el: el, sel: sel, uniq: u, scope: scope, mode: mode, added: added };
  }
  P.setSimilar = function (on) {
    P.selInfo.forEach(function (i) {
      if (on) { i.sel = P.general(i.el); i.mode = 'similar'; } else { i.sel = i.uniq; i.mode = 'unique'; }
    });
    P.emit('select');
  };
  P.setScopeAll = function (to) {
    P.selInfo.forEach(function (i) {
      if (i.scope === to) return;
      var from = P.scope(i.scope === 'global' ? 'global' : 'page');
      var e = from.edits[i.sel];
      if (e) { P.scope(to === 'global' ? 'global' : 'page').edits[i.sel] = e; delete from.edits[i.sel]; }
      /* নতুন এলিমেন্ট হলে তার তৈরির তথ্যও সরানো */
      var pid = i.el.getAttribute('data-pd-id');
      if (pid) {
        var idx = -1; from.added.forEach(function (a, k) { if (a.id === pid) idx = k; });
        if (idx > -1) P.scope(to === 'global' ? 'global' : 'page').added.push(from.added.splice(idx, 1)[0]);
      }
      i.scope = to;
    });
    P.changed();
    P.emit('select');
  };

  /* CSS লেখা/পড়া (বর্তমান ডিভাইস স্তরে) */
  P.css = function (inf, prop, val) {
    var e = P.ensureEdit(inf.sel, inf.scope), b = P.bp();
    if (val === '' || val == null) delete e.css[b][prop]; else e.css[b][prop] = val;
  };
  P.cssAll = function (props) {
    P.selInfo.forEach(function (inf) {
      Object.keys(props).forEach(function (k) { P.css(inf, k, props[k]); });
      P.pruneEdit(inf.sel, inf.scope);
    });
    P.changed(true);
  };
  P.getCss = function (inf, prop) {
    var e = P.getEdit(inf.sel, inf.scope);
    var o = e && e.css && e.css[P.bp()];
    return o && o[prop] != null ? o[prop] : null;
  };
  P.cs = function (el) { return P.mainWin().getComputedStyle(el); };

  /* ================= জ্যামিতি ================= */
  function parseTr(v) {
    if (!v || v === 'none') return [0, 0];
    var p = v.split(/\s+/);
    return [parseFloat(p[0]) || 0, parseFloat(p[1]) || 0];
  }
  function angleOf(cs) {
    var a = 0, r = cs.rotate;
    if (r && r !== 'none') { var m = r.match(/(-?[\d.]+)(deg|rad|turn)?/); if (m) a += m[2] === 'rad' ? m[1] * 180 / Math.PI : m[2] === 'turn' ? m[1] * 360 : +m[1]; }
    var t = cs.transform;
    if (t && t !== 'none') { var mm = t.match(/matrix\(([^)]+)\)/); if (mm) { var v = mm[1].split(',').map(parseFloat); a += Math.atan2(v[1], v[0]) * 180 / Math.PI; } }
    return a;
  }
  function scaleOf(cs) {
    var s = cs.scale, k = 1;
    if (s && s !== 'none') { k = parseFloat(s.split(/\s+/)[0]) || 1; }
    return k;
  }
  function geom(el) {
    var r = el.getBoundingClientRect(), cs = P.cs(el);
    var ang = angleOf(cs), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (Math.abs(ang) < 0.05) return { cx: cx, cy: cy, w: r.width, h: r.height, ang: 0, r: r, k: scaleOf(cs) };
    var k = scaleOf(cs);
    var w = (el.offsetWidth || r.width) * k, h = (el.offsetHeight || r.height) * k;
    return { cx: cx, cy: cy, w: w, h: h, ang: ang, r: r, k: k };
  }
  P.geom = geom;

  /* ================= ওভারলে আঁকা ================= */
  var dirty = true;
  P.ovDirty = function () { dirty = true; };
  var HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  function buildBox() {
    var b = P.el('div', { class: 'sel-box' });
    b.appendChild(P.el('div', { class: 'sel-tag' }));
    HANDLES.forEach(function (h) {
      var hd = P.el('div', { class: 'hd hd-' + h, 'data-h': h });
      hd.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); startResize(e, h); });
      b.appendChild(hd);
    });
    var rot = P.el('div', { class: 'hd-rot', title: 'ঘোরান (Shift = ১৫° ধাপে)' });
    rot.appendChild(P.el('div', { class: 'rot-stem' }));
    rot.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); startRotate(e); });
    b.appendChild(rot);
    return b;
  }
  function place(b, g, z, label) {
    var f = P.frames.main;
    var x = PAD + (g.cx - g.w / 2) * z, y = PAD + (g.cy - g.h / 2) * z;
    b.style.display = 'block';
    b.style.left = x + 'px'; b.style.top = y + 'px';
    b.style.width = g.w * z + 'px'; b.style.height = g.h * z + 'px';
    b.style.transform = g.ang ? 'rotate(' + g.ang + 'deg)' : '';
    var tag = b.firstChild;
    if (tag && label != null) tag.textContent = label;
  }
  function loop() {
    requestAnimationFrame(loop);
    var f = P.frames.main;
    if (!f || !f.win() || !f.win().document.body) return;
    var z = f.z;
    var want = P.mode === 'preview' ? [] : P.sel;
    while (boxes.length < want.length) { var nb = buildBox(); ov.appendChild(nb); boxes.push(nb); }
    boxes.forEach(function (b, i) {
      if (i >= want.length) { b.style.display = 'none'; return; }
      var el = want[i];
      if (!el.isConnected) { b.style.display = 'none'; return; }
      var g = geom(el);
      if (g.w === 0 && g.h === 0) { b.style.display = 'none'; return; }
      var single = want.length === 1 && el !== el.ownerDocument.body;
      b.classList.toggle('multi', !single);
      place(b, g, z, P.label(el) + '  ' + Math.round(g.w / g.k) + ' × ' + Math.round(g.h / g.k));
      b.classList.toggle('editing', !!editing);
      b.classList.toggle('compact', g.w * z < 60 || g.h * z < 40);
    });
    if (hoverEl && hoverEl.isConnected && P.mode !== 'preview' && P.sel.indexOf(hoverEl) < 0 && !drag) {
      var hg = geom(hoverEl);
      place(hoverBox, hg, z, null);
      hoverBox.firstChild.textContent = P.label(hoverEl);
    } else hoverBox.style.display = 'none';
    dirty = false;
  }
  var hoverEl = null;
  function setHover(el) { hoverEl = el; }
  function onHover(e) {
    if (drag || P.mode === 'preview') return;
    setHover(pick(e));
    P.emit('hover', hoverEl);
  }

  /* ================= টানা-ড্র্যাগের সাধারণ ব্যবস্থা ================= */
  function track(onMove, onUp, cursor) {
    var f = P.frames.main, w = f.win(), d = w.document;
    d.documentElement.classList.add('pd-dragging');
    document.body.classList.add('dragging');
    if (cursor) document.body.style.cursor = cursor;
    function pm(e) { onMove(toParent(e, false)); }
    function im(e) { onMove(toParent(e, true)); }
    function up(e) {
      document.removeEventListener('mousemove', pm, true); document.removeEventListener('mouseup', up, true);
      d.removeEventListener('mousemove', im, true); d.removeEventListener('mouseup', iup, true);
      d.documentElement.classList.remove('pd-dragging'); document.body.classList.remove('dragging'); document.body.style.cursor = '';
      onUp();
    }
    function iup(e) { up(e); }
    document.addEventListener('mousemove', pm, true); document.addEventListener('mouseup', up, true);
    d.addEventListener('mousemove', im, true); d.addEventListener('mouseup', iup, true);
  }

  /* ================= মাউস ডাউন (আইফ্রেমের ভেতর) ================= */
  function onDown(e) {
    if (P.mode === 'preview') return;
    var f = P.frames.main;
    if (editing && editing.el.contains(e.target)) return;      /* লেখা এডিট চলছে — স্বাভাবিক আচরণ */
    if (editing) stopEditing();
    if (e.button === 1 || spaceDown) { e.preventDefault(); e.stopPropagation(); startPan(toParent(e, true)); return; }
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    f.win().focus();
    var t = pick(e); if (!t) return;
    if (e.shiftKey) {
      var cur = P.sel.slice(), k = cur.indexOf(t);
      if (k > -1) cur.splice(k, 1); else cur.push(t);
      P.select(cur); return;
    }
    var inSel = P.sel.some(function (s) { return s === t || s.contains(t) && false; });
    if (!inSel) P.select([t]);
    startMove(toParent(e, true));
  }

  function startPan(p0) {
    var sx = board.scrollLeft, sy = board.scrollTop;
    document.documentElement.classList.add('panning');
    track(function (p) { board.scrollLeft = sx - (p.x - p0.x); board.scrollTop = sy - (p.y - p0.y); }, function () { document.documentElement.classList.remove('panning'); }, 'grabbing');
  }

  /* ================= সরানো ================= */
  function lines(excl) {
    var el = excl[0], par = el.parentElement, w = P.mainWin();
    var xs = [0, w.innerWidth / 2, w.innerWidth], ys = [];
    function addRect(r) { xs.push(r.left, r.left + r.width / 2, r.right); ys.push(r.top, r.top + r.height / 2, r.bottom); }
    if (par) addRect(par.getBoundingClientRect());
    if (par) [].forEach.call(par.children, function (c) {
      if (excl.indexOf(c) > -1) return;
      var r = c.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) addRect(r);
    });
    return { xs: xs, ys: ys };
  }
  function snap(vals, ls, th) {
    var best = null;
    vals.forEach(function (v) { ls.forEach(function (l) { var d = l - v; if (Math.abs(d) <= th && (best === null || Math.abs(d) < Math.abs(best.d))) best = { d: d, l: l }; }); });
    return best;
  }
  function showGuides(gx, gy) {
    guidesBox.innerHTML = '';
    var z = P.frames.main.z, f = P.frames.main;
    if (gx != null) guidesBox.appendChild(P.el('div', { class: 'guide v', style: 'left:' + (PAD + gx * z) + 'px' }));
    if (gy != null) guidesBox.appendChild(P.el('div', { class: 'guide h', style: 'top:' + (PAD + gy * z) + 'px' }));
  }
  function startMove(p0) {
    var infos = P.selInfo.slice();
    if (!infos.length) return;
    var f = P.frames.main, z = f.z, w = f.win();
    var els = infos.map(function (i) { return i.el; });
    var items = infos.map(function (i) {
      var t = parseTr(P.cs(i.el).translate), r = i.el.getBoundingClientRect();
      return { i: i, tx: t[0], ty: t[1], r: r };
    });
    var L = lines(els);
    var gr = { l: Math.min.apply(0, items.map(function (x) { return x.r.left; })), t: Math.min.apply(0, items.map(function (x) { return x.r.top; })), r: Math.max.apply(0, items.map(function (x) { return x.r.right; })), b: Math.max.apply(0, items.map(function (x) { return x.r.bottom; })) };
    var moved = false, special = infos.some(function (i) { return i.el === w.document.body || i.el === w.document.documentElement; });
    drag = { kind: 'move' };
    track(function (p) {
      var dx = (p.x - p0.x) / z, dy = (p.y - p0.y) / z;
      if (!moved && Math.hypot(p.x - p0.x, p.y - p0.y) < 4) return;
      if (special) return;
      moved = true;
      if (p.e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      var gx = null, gy = null;
      if (!p.e.altKey) {
        var th = 6 / z;
        var sx = snap([gr.l + dx, (gr.l + gr.r) / 2 + dx, gr.r + dx], L.xs, th);
        var sy = snap([gr.t + dy, (gr.t + gr.b) / 2 + dy, gr.b + dy], L.ys, th);
        if (sx) { dx += sx.d; gx = sx.l; }
        if (sy) { dy += sy.d; gy = sy.l; }
      }
      showGuides(gx, gy);
      items.forEach(function (it) {
        var v = P.round(it.tx + dx, 1) + 'px ' + P.round(it.ty + dy, 1) + 'px';
        it.i.el.style.setProperty('translate', v, 'important');
        P.css(it.i, 'translate', v);
      });
      P.dirty = true; P.renderSoon(); P.ovDirty(); P.emit('live');
    }, function () {
      guidesBox.innerHTML = '';
      items.forEach(function (it) { it.i.el.style.removeProperty('translate'); P.pruneEdit(it.i.sel, it.i.scope); });
      drag = null;
      if (moved) P.changed();
      P.emit('live');
    }, 'move');
  }

  P.nudge = function (dx, dy) {
    P.selInfo.forEach(function (i) {
      var t = parseTr(P.cs(i.el).translate);
      P.css(i, 'translate', (t[0] + dx) + 'px ' + (t[1] + dy) + 'px');
    });
    P.changed(true); P.emit('live');
  };

  /* ================= রিসাইজ ================= */
  function startResize(e, h) {
    var inf = P.selInfo[0]; if (!inf) return;
    var el = inf.el, f = P.frames.main, z = f.z, p0 = { x: e.clientX, y: e.clientY };
    var cs = P.cs(el), g = geom(el);
    var par = el.parentElement ? P.cs(el.parentElement) : null;
    var pre = {};
    if (cs.display === 'inline') pre.display = 'inline-block';
    if (par && /flex/.test(par.display)) { pre.flex = '0 0 auto'; }
    pre['max-width'] = 'none'; pre['min-width'] = '0';
    pre['min-height'] = '0'; pre['max-height'] = 'none';
    Object.keys(pre).forEach(function (k) { el.style.setProperty(k, pre[k], 'important'); P.css(inf, k, pre[k]); });
    var w0 = el.offsetWidth, h0 = el.offsetHeight;
    if (!w0 && !h0) { var rr = el.getBoundingClientRect(); w0 = rr.width / g.k; h0 = rr.height / g.k; }
    var tr0 = parseTr(cs.translate), ang = g.ang * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
    var c0 = { x: g.cx, y: g.cy };
    var sx = h.indexOf('e') > -1 ? 1 : h.indexOf('w') > -1 ? -1 : 0;
    var sy = h.indexOf('s') > -1 ? 1 : h.indexOf('n') > -1 ? -1 : 0;
    var prop = el.localName === 'img' || el.localName === 'svg';
    var moved = false; drag = { kind: 'resize' };
    track(function (p) {
      var dx = (p.x - p0.x) / z, dy = (p.y - p0.y) / z;
      var lx = (dx * ca + dy * sa) / g.k, ly = (-dx * sa + dy * ca) / g.k;
      var dw = sx * lx, dh = sy * ly;
      var keep = (p.e.shiftKey ? !prop : prop) && sx && sy;
      if (keep) { var ratio = h0 / w0; if (Math.abs(dw) * ratio > Math.abs(dh)) dh = dw * ratio; else dw = dh / ratio; }
      else if (prop && !sx !== !sy && !p.e.shiftKey) { /* শুধু এক দিকে টানলে — মুক্ত */ }
      if (p.e.altKey) { dw *= 2; dh *= 2; }
      var w1 = sx ? Math.max(6, w0 + dw) : w0, h1 = sy ? Math.max(6, h0 + dh) : h0;
      moved = true;
      var ws = P.round(w1, 1) + 'px', hs = P.round(h1, 1) + 'px';
      if (sx) { el.style.setProperty('width', ws, 'important'); P.css(inf, 'width', ws); }
      if (sy) { el.style.setProperty('height', hs, 'important'); P.css(inf, 'height', hs); }
      /* কেন্দ্র ঠিক জায়গায় রাখতে translate মেলানো */
      var ddw = w1 - w0, ddh = h1 - h0;
      if (p.e.altKey) { ddw = 0; ddh = 0; }
      var lcx = sx * ddw * g.k / 2, lcy = sy * ddh * g.k / 2;
      var target = { x: c0.x + lcx * ca - lcy * sa, y: c0.y + lcx * sa + lcy * ca };
      el.style.setProperty('translate', tr0[0] + 'px ' + tr0[1] + 'px', 'important');
      var r = el.getBoundingClientRect(), mc = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      var tx = tr0[0] + (target.x - mc.x), ty = tr0[1] + (target.y - mc.y);
      var tv = P.round(tx, 1) + 'px ' + P.round(ty, 1) + 'px';
      el.style.setProperty('translate', tv, 'important'); P.css(inf, 'translate', tv);
      P.dirty = true; P.renderSoon(); P.ovDirty(); P.emit('live');
    }, function () {
      ['width', 'height', 'translate', 'display', 'flex', 'max-width', 'min-width', 'min-height', 'max-height'].forEach(function (k) { el.style.removeProperty(k); });
      P.pruneEdit(inf.sel, inf.scope);
      drag = null;
      if (moved) P.changed();
      P.emit('live');
    }, h + '-resize');
  }

  /* ================= ঘোরানো ================= */
  function startRotate(e) {
    var inf = P.selInfo[0]; if (!inf) return;
    var el = inf.el, f = P.frames.main, z = f.z, fr = frameRect(), g = geom(el);
    var cx = fr.left + g.cx * z, cy = fr.top + g.cy * z;
    var a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
    var m = String(P.cs(el).rotate || '0').match(/-?[\d.]+/);
    var r0 = m ? +m[0] : 0, moved = false; drag = { kind: 'rotate' };
    track(function (p) {
      var a = Math.atan2(p.y - cy, p.x - cx);
      var deg = r0 + (a - a0) * 180 / Math.PI;
      if (p.e.shiftKey) deg = Math.round(deg / 15) * 15;
      deg = P.round(((deg + 180) % 360 + 360) % 360 - 180, 1);
      moved = true;
      var v = deg + 'deg';
      el.style.setProperty('rotate', v, 'important'); P.css(inf, 'rotate', v);
      P.dirty = true; P.renderSoon(); P.ovDirty(); P.emit('live');
    }, function () {
      el.style.removeProperty('rotate'); P.pruneEdit(inf.sel, inf.scope); drag = null;
      if (moved) P.changed(); P.emit('live');
    }, 'crosshair');
  }

  /* ================= লেখা এডিট (ডাবল-ক্লিক) ================= */
  function startEditing(el) {
    if (!P.isTextEl(el)) { P.select([el]); P.toast('এই এলিমেন্টে সরাসরি লেখা নেই — ভেতরের লেখাটির ওপর ডাবল-ক্লিক করুন'); return; }
    if (editing) stopEditing();
    P.select([el]);
    var d = el.ownerDocument, w = d.defaultView;
    editing = { el: el, orig: el.innerHTML, multi: el.children.length > 0 };
    el.setAttribute('data-pd-editing', '1');
    el.contentEditable = 'true';
    el.spellcheck = false;
    el.focus();
    try { var r = d.createRange(); r.selectNodeContents(el); var s = w.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
    editing.kd = function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); stopEditing(true); }
      else if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); stopEditing(); }
      else if (ev.key === 'Enter' && ev.shiftKey) { ev.preventDefault(); d.execCommand('insertLineBreak'); }
      ev.stopPropagation();
    };
    editing.pt = function (ev) { ev.preventDefault(); var t = (ev.clipboardData || w.clipboardData).getData('text/plain'); d.execCommand('insertText', false, t); };
    el.addEventListener('keydown', editing.kd, true);
    el.addEventListener('paste', editing.pt, true);
    P.emit('editing', true);
  }
  function stopEditing(cancel) {
    if (!editing) return;
    var el = editing.el, o = editing;
    editing = null;
    el.removeEventListener('keydown', o.kd, true); el.removeEventListener('paste', o.pt, true);
    el.contentEditable = 'false'; el.removeAttribute('contenteditable'); el.removeAttribute('data-pd-editing');
    if (cancel) { el.innerHTML = o.orig; P.emit('editing', false); return; }
    var inf = P.selInfo[0] && P.selInfo[0].el === el ? P.selInfo[0] : info(el);
    var hasKids = el.children.length > 0;
    var cur = hasKids ? el.innerHTML : el.textContent;
    var before = hasKids ? o.orig : el.textContent;
    var e = P.ensureEdit(inf.sel, inf.scope);
    if (hasKids) { e.html = P.mainWin().PDDesign.sanitizeHtml(cur, P.mainDoc()); delete e.text; }
    else { e.text = cur; delete e.html; }
    P.changed();
    P.emit('editing', false);
  }
  P.stopEditing = stopEditing;
  P.startEditing = startEditing;
  P.isEditing = function () { return !!editing; };

  /* ================= এলিমেন্ট মুছা / কপি / যোগ ================= */
  P.removeSelected = function () {
    var cnt = 0;
    P.selInfo.forEach(function (i) {
      var el = i.el, b = el.ownerDocument.body;
      if (el === b || el === el.ownerDocument.documentElement) return;
      var pid = el.getAttribute('data-pd-id');
      if (el.hasAttribute('data-pd-gen') && pid) {
        [P.design.global, P.design.pages[P.pk]].forEach(function (sc) {
          if (!sc) return;
          sc.added = sc.added.filter(function (a) { return a.id !== pid; });
          Object.keys(sc.edits).forEach(function (k) { if (k.indexOf('[data-pd-id="' + pid + '"]') > -1) delete sc.edits[k]; });
        });
      } else {
        P.ensureEdit(i.sel, i.scope).del = true;
      }
      cnt++;
    });
    if (!cnt) return;
    P.select([], true); P.changed(); P.emit('select');
    P.toast('মুছে ফেলা হয়েছে — ভুল হলে Ctrl+Z');
  };

  P.duplicateSelected = function () {
    var made = [];
    P.selInfo.forEach(function (i) {
      var el = i.el; if (el === el.ownerDocument.body) return;
      var sc = P.scope(i.scope === 'global' ? 'global' : 'page', true);
      var id = P.uid('a'), pid = el.getAttribute('data-pd-id');
      var par = el.parentElement;
      if (pid && el.hasAttribute('data-pd-gen')) {
        var src = null;
        [P.design.global, P.design.pages[P.pk]].forEach(function (s) { if (s) s.added.forEach(function (a) { if (a.id === pid) src = a; }); });
        if (!src) return;
        var copy = JSON.parse(JSON.stringify(src)); copy.id = id; copy.where = 'after'; copy.ref = '[data-pd-id="' + pid + '"]'; copy.parent = P.uniq(par);
        sc.added.push(copy);
        [P.design.global, P.design.pages[P.pk]].forEach(function (s) {
          if (!s) return;
          Object.keys(s.edits).forEach(function (k) {
            if (k.indexOf('[data-pd-id="' + pid + '"]') > -1) sc.edits[k.split('[data-pd-id="' + pid + '"]').join('[data-pd-id="' + id + '"]')] = JSON.parse(JSON.stringify(s.edits[k]));
          });
        });
      } else {
        sc.added.push({ id: id, clone: i.uniq, parent: P.uniq(par), ref: i.uniq, where: 'after' });
        var se = P.getEdit(i.sel, i.scope);
        if (se && i.mode === 'unique') sc.edits['[data-pd-id="' + id + '"]'] = JSON.parse(JSON.stringify(se));
        var e2 = sc.edits['[data-pd-id="' + id + '"]']; if (e2) { delete e2.del; }
      }
      made.push(id);
    });
    if (!made.length) return;
    P.changed();
    setTimeout(function () { P.select(made.map(function (id) { return P.mainDoc().querySelector('[data-pd-id="' + id + '"]'); }).filter(Boolean)); }, 120);
  };

  /* spec: {tag, cls, html, text, attrs, css:{...}} */
  P.insert = function (spec) {
    var doc = P.mainDoc();
    var tgt = P.sel[0], parent, ref = null, where = 'append';
    if (tgt && tgt !== doc.body && tgt !== doc.documentElement) {
      var isCont = /^(div|section|main|article|aside|header|footer|nav|ul|ol|li|form|figure|blockquote)$/.test(tgt.localName) && !P.isTextEl(tgt) || (tgt.localName === 'div' && tgt.children.length === 0);
      if (isCont && !tgt.hasAttribute('data-pd-gen-leaf')) { parent = tgt; } else { parent = tgt.parentElement; ref = tgt; where = 'after'; }
    } else {
      parent = doc.querySelector('#pd-page-main') || doc.querySelector('#main-content main') || doc.querySelector('main') || doc.querySelector('#main-content') || doc.body;
    }
    var scName = parent.closest && parent.closest('header, footer, .topbar') ? 'global' : 'page';
    var sc = P.scope(scName, true);
    var id = P.uid('a');
    var a = { id: id, tag: spec.tag || 'div', cls: spec.cls || '', parent: P.uniq(parent), where: where };
    if (ref) a.ref = P.uniq(ref);
    if (spec.html) a.html = spec.html;
    sc.added.push(a);
    var sel = '[data-pd-id="' + id + '"]';
    var e = { css: { b: {}, t: {}, m: {} } };
    if (spec.css) Object.keys(spec.css).forEach(function (k) { e.css.b[k] = spec.css[k]; });
    if (spec.text != null) e.text = spec.text;
    if (spec.attrs) e.attrs = spec.attrs;
    sc.edits[sel] = e;
    P.pruneEdit(sel, scName);
    P.changed();
    setTimeout(function () {
      var n = P.mainDoc().querySelector(sel);
      if (n) { P.select([n]); try { n.scrollIntoView({ block: 'nearest' }); } catch (x) {} }
    }, 150);
    return id;
  };

  /* ================= অ্যালাইন / সাজানো ================= */
  P.align = function (how) {
    var infos = P.selInfo; if (!infos.length) return;
    var doc = P.mainDoc();
    var rects = infos.map(function (i) { return i.el.getBoundingClientRect(); });
    var ref;
    if (infos.length > 1) ref = { l: Math.min.apply(0, rects.map(function (r) { return r.left; })), t: Math.min.apply(0, rects.map(function (r) { return r.top; })), r: Math.max.apply(0, rects.map(function (r) { return r.right; })), b: Math.max.apply(0, rects.map(function (r) { return r.bottom; })) };
    else { var pr = (infos[0].el.parentElement || doc.body).getBoundingClientRect(); ref = { l: pr.left, t: pr.top, r: pr.right, b: pr.bottom }; }
    infos.forEach(function (i, k) {
      var r = rects[k], dx = 0, dy = 0;
      if (how === 'l') dx = ref.l - r.left;
      if (how === 'c') dx = (ref.l + ref.r) / 2 - (r.left + r.right) / 2;
      if (how === 'r') dx = ref.r - r.right;
      if (how === 't') dy = ref.t - r.top;
      if (how === 'm') dy = (ref.t + ref.b) / 2 - (r.top + r.bottom) / 2;
      if (how === 'b') dy = ref.b - r.bottom;
      var t = parseTr(P.cs(i.el).translate);
      P.css(i, 'translate', P.round(t[0] + dx, 1) + 'px ' + P.round(t[1] + dy, 1) + 'px');
    });
    P.changed(); P.emit('live');
  };
  P.distribute = function (axis) {
    var infos = P.selInfo.slice(); if (infos.length < 3) return P.toast('ভাগ করে সাজাতে কমপক্ষে ৩টি এলিমেন্ট বাছুন');
    var items = infos.map(function (i) { return { i: i, r: i.el.getBoundingClientRect() }; });
    items.sort(function (a, b) { return axis === 'h' ? a.r.left - b.r.left : a.r.top - b.r.top; });
    var first = items[0].r, last = items[items.length - 1].r, total = 0;
    items.forEach(function (it) { total += axis === 'h' ? it.r.width : it.r.height; });
    var span = axis === 'h' ? last.right - first.left : last.bottom - first.top;
    var gap = (span - total) / (items.length - 1), pos = axis === 'h' ? first.left : first.top;
    items.forEach(function (it) {
      var cur = axis === 'h' ? it.r.left : it.r.top, d = pos - cur;
      var t = parseTr(P.cs(it.i.el).translate);
      P.css(it.i, 'translate', axis === 'h' ? P.round(t[0] + d, 1) + 'px ' + t[1] + 'px' : t[0] + 'px ' + P.round(t[1] + d, 1) + 'px');
      pos += (axis === 'h' ? it.r.width : it.r.height) + gap;
    });
    P.changed(); P.emit('live');
  };
  P.zOrder = function (dir) {
    P.selInfo.forEach(function (i) {
      var el = i.el, par = el.parentElement; if (!par) return;
      var zs = [].map.call(par.children, function (c) { var z = parseInt(P.cs(c).zIndex, 10); return isNaN(z) ? 0 : z; });
      var cur = P.cs(el);
      var v = dir === 'front' ? Math.max.apply(0, zs.concat([0])) + 1 : Math.min.apply(0, zs.concat([0])) - 1;
      if (dir === 'up') v = (parseInt(cur.zIndex, 10) || 0) + 1;
      if (dir === 'down') v = (parseInt(cur.zIndex, 10) || 0) - 1;
      if (cur.position === 'static') P.css(i, 'position', 'relative');
      P.css(i, 'z-index', String(v));
    });
    P.changed();
  };

  /* ================= কিবোর্ড ================= */
  function isField(t) { return t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable); }
  function onKey(e) {
    var t = e.target;
    if (e.key === ' ' && !isField(t)) { spaceDown = true; document.documentElement.classList.add('pan'); try { P.mainDoc().documentElement.classList.add('pd-pan'); } catch (x) {} e.preventDefault(); return; }
    if (isField(t)) {
      if ((e.ctrlKey || e.metaKey) && !editing && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
      return;
    }
    var mod = e.ctrlKey || e.metaKey, k = e.key;
    if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) P.redo(); else P.undo(); return; }
    if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); P.redo(); return; }
    if (mod && (k === 's' || k === 'S')) { e.preventDefault(); P.pushHistory(); P.saveDraft(); P.toast('ড্রাফট সংরক্ষিত — প্রকাশ করতে "পাবলিশ" চাপুন'); return; }
    if (mod && (k === 'd' || k === 'D')) { e.preventDefault(); P.duplicateSelected(); return; }
    if (mod && k === '0') { e.preventDefault(); P.fit(); return; }
    if (mod && (k === '=' || k === '+')) { e.preventDefault(); P.setZoom(P.zoom * 1.2); return; }
    if (mod && k === '-') { e.preventDefault(); P.setZoom(P.zoom / 1.2); return; }
    if (mod && (k === 'a' || k === 'A') && false) return;
    if (!P.sel.length) return;
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); P.removeSelected(); return; }
    if (k === 'Escape') { P.select([]); return; }
    if (k === 'Enter' && P.sel.length === 1) { e.preventDefault(); startEditing(P.sel[0]); return; }
    if (e.altKey && k === 'ArrowUp') { var p = P.sel[0].parentElement; if (p) { e.preventDefault(); P.select([p]); } return; }
    if (e.altKey && k === 'ArrowDown') { var c = P.sel[0].firstElementChild; if (c) { e.preventDefault(); P.select([c]); } return; }
    var step = e.shiftKey ? 10 : 1;
    if (k === 'ArrowLeft') { e.preventDefault(); P.nudge(-step, 0); }
    else if (k === 'ArrowRight') { e.preventDefault(); P.nudge(step, 0); }
    else if (k === 'ArrowUp') { e.preventDefault(); P.nudge(0, -step); }
    else if (k === 'ArrowDown') { e.preventDefault(); P.nudge(0, step); }
  }
  function onKeyUp(e) {
    if (e.key === ' ') { spaceDown = false; document.documentElement.classList.remove('pan'); try { P.mainDoc().documentElement.classList.remove('pd-pan'); } catch (x) {} }
  }

  /* ================= শুরু ================= */
  P.initCanvas = function () {
    board = document.getElementById('board'); stage = document.getElementById('stage');
    P.board = board;
    var main = P.el('div', { class: 'slot', id: 'slot-main' });
    var prev = P.el('div', { class: 'slot', id: 'slot-prev', style: 'display:none' });
    stage.appendChild(main); stage.appendChild(prev);
    P.frames.main = new Frame('main', main);
    P.frames.prev = new Frame('prev', prev);
    ov = P.el('div', { class: 'ov' });
    hoverBox = P.el('div', { class: 'hover-box' }); hoverBox.appendChild(P.el('div', { class: 'sel-tag' }));
    guidesBox = P.el('div', { class: 'guides' });
    ov.appendChild(hoverBox); ov.appendChild(guidesBox);
    P.frames.main.box.appendChild(ov);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('resize', function () { if (P.fitMode) P.layout(); });
    board.addEventListener('wheel', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault(); P.setZoom(P.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
    }, { passive: false });
    /* ফাঁকা জায়গায় ক্লিক = নির্বাচন বাতিল; স্পেস/মাঝের বাটন = প্যান */
    board.addEventListener('mousedown', function (e) {
      if (e.target.closest('.frame-box') && !spaceDown && e.button !== 1) return;
      if (e.button === 1 || spaceDown) { e.preventDefault(); startPan({ x: e.clientX, y: e.clientY }); return; }
      if (e.target === board || e.target === stage || e.target.classList.contains('slot')) P.select([]);
    });
    new ResizeObserver(function () { if (P.fitMode) P.layout(); }).observe(board);
    requestAnimationFrame(loop);
  };
})();
