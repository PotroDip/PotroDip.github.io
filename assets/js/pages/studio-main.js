/* studio-main.js — স্টুডিও চালু, টপবার, ড্রাফট, পাবলিশ */
(function () {
  'use strict';
  var P = window.PDS, E = P.el;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'site_design';

  /* ================= ডিজাইন সাফ করা (ছোট ও পরিষ্কার ডেটা) ================= */
  function clean(d) {
    d = P.normalize(JSON.parse(JSON.stringify(d)));
    function cleanScope(sc) {
      Object.keys(sc.edits).forEach(function (k) {
        var e = sc.edits[k];
        ['b', 't', 'm'].forEach(function (b) { if (e.css && e.css[b] && !Object.keys(e.css[b]).length) delete e.css[b]; });
        if (e.css && !Object.keys(e.css).length) delete e.css;
        if (e.hide && !e.hide.d && !e.hide.t && !e.hide.m) delete e.hide;
        if (!e.css && !e.hide && !e.del && e.text == null && e.html == null && !e.attrs) delete sc.edits[k];
      });
    }
    cleanScope(d.global);
    Object.keys(d.pages).forEach(function (k) {
      var s = d.pages[k]; cleanScope(s);
      if (!Object.keys(s.edits).length && !s.added.length && !s.meta) delete d.pages[k];
    });
    ['light', 'dark'].forEach(function (m) { Object.keys(d.theme[m]).forEach(function (k) { if (!d.theme[m][k]) delete d.theme[m][k]; }); });
    return d;
  }
  function stats(d) {
    var edits = 0, added = 0, pages = 0, theme = Object.keys(d.theme.light).length + Object.keys(d.theme.dark).length;
    edits += Object.keys(d.global.edits).length; added += d.global.added.length;
    Object.keys(d.pages).forEach(function (k) { pages++; edits += Object.keys(d.pages[k].edits).length; added += d.pages[k].added.length; });
    return { edits: edits, added: added, pages: pages, theme: theme, custom: Object.keys(d.custom).length };
  }

  /* ================= টপবার ================= */
  function setupBar() {
    /* পেজ বাছাই */
    var ps = $('page-select');
    function fillPages() {
      ps.innerHTML = '';
      P.PAGES.forEach(function (p) { ps.appendChild(E('option', { value: p.key, text: p.name })); });
      var ks = Object.keys(P.design.custom);
      if (ks.length) {
        var og = E('optgroup', { label: 'আমার তৈরি পেজ' });
        ks.forEach(function (s) { og.appendChild(E('option', { value: 'page:' + s, text: P.design.custom[s].title || s })); });
        ps.appendChild(og);
      }
      ps.value = P.pk;
    }
    ps.addEventListener('change', function () { P.pushHistory(); P.loadPage(ps.value); });
    P.on('page', fillPages); P.on('changed', function () { if (ps.options.length - 12 !== Object.keys(P.design.custom).length + (Object.keys(P.design.custom).length ? 1 : 0)) fillPages(); });
    fillPages();

    /* ডিভাইস */
    var devBtns = document.querySelectorAll('#dev-switch button');
    function devSync() {
      [].forEach.call(devBtns, function (b) { b.classList.toggle('on', b.dataset.dev === P.dev.id); });
      $('dev-w').value = P.width;
    }
    [].forEach.call(devBtns, function (b) { b.addEventListener('click', function () { P.setDevice(b.dataset.dev); devSync(); }); });
    $('dev-w').addEventListener('change', function () {
      var w = Math.max(280, Math.min(1920, parseInt(this.value, 10) || 1280));
      var id = w > 1023 ? 'pc' : w > 767 ? 'tab' : 'mob';
      P.setDevice(id, w); devSync();
    });
    P.on('device', devSync);

    /* জুম */
    function zSync() { $('zoom-val').textContent = Math.round(P.zoom * 100) + '%'; }
    $('zoom-in').addEventListener('click', function () { P.setZoom(P.zoom * 1.2); });
    $('zoom-out').addEventListener('click', function () { P.setZoom(P.zoom / 1.2); });
    $('zoom-fit').addEventListener('click', function () { P.fit(); });
    $('zoom-val').addEventListener('click', function () { P.setZoom(1); });
    P.on('zoom', zSync);

    /* আনডু/রিডু */
    $('btn-undo').addEventListener('click', function () { P.undo(); });
    $('btn-redo').addEventListener('click', function () { P.redo(); });
    function hSync() { $('btn-undo').disabled = P.hi <= 0; $('btn-redo').disabled = P.hi >= P.hist.length - 1; }
    P.on('history', hSync); hSync();

    /* প্রিভিউ / স্প্লিট / থিম */
    $('btn-preview').addEventListener('click', function () { P.setMode(P.mode === 'preview' ? 'edit' : 'preview'); });
    P.on('mode', function () { $('btn-preview').classList.toggle('on', P.mode === 'preview'); $('btn-preview').querySelector('span').textContent = P.mode === 'preview' ? 'এডিটে ফিরুন' : 'লাইভ প্রিভিউ'; });
    $('btn-split').addEventListener('click', function () { P.setSplit(!P.split); });
    P.on('split', function () { $('btn-split').classList.toggle('on', P.split); });
    $('btn-theme').addEventListener('click', function () { P.setThemeMode(P.themeMode === 'dark' ? 'light' : 'dark'); if (P.buildTheme) P.buildTheme(); });
    P.on('thememode', function () { $('btn-theme').classList.toggle('on', P.themeMode === 'dark'); });

    /* অবস্থা-চিহ্ন */
    P.on('dirty', function () {
      var el = $('save-state'), dirty = P.snapshot() !== P.published;
      el.className = 'save-state ' + (dirty ? 'dirty' : 'ok');
      el.textContent = dirty ? '● অপ্রকাশিত পরিবর্তন আছে' : '✓ সব প্রকাশিত';
    });
    P.on('changed', function () { var dirty = P.snapshot() !== P.published; var el = $('save-state'); el.className = 'save-state ' + (dirty ? 'dirty' : 'ok'); el.textContent = dirty ? '● অপ্রকাশিত পরিবর্তন আছে' : '✓ সব প্রকাশিত'; });

    /* মেনু */
    var menu = $('more-menu');
    $('btn-more').addEventListener('click', function (e) { e.stopPropagation(); menu.classList.toggle('open'); });
    document.addEventListener('click', function () { menu.classList.remove('open'); });
    menu.addEventListener('click', function (e) { var b = e.target.closest('button[data-act]'); if (!b) return; menu.classList.remove('open'); act(b.dataset.act); });
    $('btn-publish').addEventListener('click', openPublish);
    $('help-ok').addEventListener('click', function () { $('modal-help').classList.remove('open'); });
    [].forEach.call(document.querySelectorAll('.modal'), function (m) { m.addEventListener('mousedown', function (e) { if (e.target === m) m.classList.remove('open'); }); });
    $('pub-cancel').addEventListener('click', function () { $('modal-publish').classList.remove('open'); });
    $('pub-ok').addEventListener('click', doPublish);
    $('pub-close').addEventListener('click', function () { $('modal-publish').classList.remove('open'); });
    window.addEventListener('beforeunload', function (e) { if (P.snapshot() !== P.published) { e.preventDefault(); e.returnValue = ''; } });
  }

  function act(a) {
    if (a === 'export') {
      var blob = new Blob([JSON.stringify(clean(P.design), null, 2)], { type: 'application/json' });
      dl(blob, 'site-design-backup.json'); P.toast('ব্যাকআপ ফাইল ডাউনলোড হয়েছে');
    } else if (a === 'fallback') {
      var b2 = new Blob([JSON.stringify(clean(P.design))], { type: 'application/json' });
      dl(b2, 'site-design.json');
      P.toast('ফাইলটি রিপোর assets/data/ ফোল্ডারে রাখুন (শুধু ডেটাবেস না চললে কাজে লাগে)');
    } else if (a === 'import') {
      var f = E('input', { type: 'file', accept: 'application/json,.json' });
      f.addEventListener('change', function () {
        var r = new FileReader();
        r.onload = function () {
          try { P.design = P.normalize(JSON.parse(r.result)); P.changed(); P.pushHistory(); P.loadPage(P.pk); P.buildTheme(); P.toast('ফাইল থেকে ডিজাইন এসেছে — দেখে পাবলিশ করুন'); }
          catch (e) { P.toast('ফাইলটি সঠিক নয়', true); }
        };
        r.readAsText(f.files[0]);
      });
      f.click();
    } else if (a === 'prev') {
      PD.db.from('site_settings').select('value').eq('key', KEY + '_prev').maybeSingle().then(function (r) {
        if (!r.data || !r.data.value) return P.toast('আগের কোনো সংস্করণ পাওয়া যায়নি', true);
        if (!confirm('শেষবার পাবলিশ করার আগের সংস্করণটি এডিটরে আনবেন? (পাবলিশ না করা পর্যন্ত সাইট বদলাবে না)')) return;
        P.design = P.normalize(r.data.value); P.changed(); P.pushHistory(); P.loadPage(P.pk); P.buildTheme();
        P.toast('আগের সংস্করণ এডিটরে এসেছে — পছন্দ হলে পাবলিশ করুন');
      });
    } else if (a === 'reset') {
      if (!confirm('সব ডিজাইন-পরিবর্তন মুছে সাইটকে একদম আসল অবস্থায় ফিরিয়ে নিতে চান? (এডিটরে মুছবে; "পাবলিশ" করলে সাইটেও ফিরবে)')) return;
      P.design = P.blank(); P.changed(); P.pushHistory(); P.loadPage(P.pk); P.buildTheme();
      P.toast('সব মুছেছে — আসল অবস্থায় ফিরতে এখন "পাবলিশ" চাপুন');
    } else if (a === 'discard') {
      if (!confirm('সংরক্ষিত ড্রাফট বাদ দিয়ে শেষ পাবলিশ করা সংস্করণে ফিরবেন?')) return;
      P.design = P.normalize(JSON.parse(P.published || 'null')); P.resetHistory(); try { localStorage.removeItem('pd-studio-draft'); } catch (e) {}
      P.render(); P.loadPage(P.pk); P.buildTheme(); P.emit('dirty'); P.toast('শেষ প্রকাশিত সংস্করণে ফেরা হয়েছে');
    } else if (a === 'view') {
      window.open(P.pageInfo(P.pk).url, '_blank');
    } else if (a === 'help') { $('modal-help').classList.add('open'); }
  }
  function dl(blob, name) {
    var a = E('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ================= পাবলিশ ================= */
  function openPublish() {
    P.pushHistory(); P.stopEditing && P.stopEditing();
    var s = stats(clean(P.design));
    var body = $('pub-body');
    var dirty = P.snapshot() !== P.published;
    body.innerHTML = '';
    $('pub-done').style.display = 'none'; $('pub-pre').style.display = '';
    $('pub-ok').disabled = false; $('pub-ok').textContent = 'হ্যাঁ, পাবলিশ করুন';
    if (!dirty) body.appendChild(E('p', { class: 'pub-info', text: 'নতুন কোনো পরিবর্তন নেই — সাইটে এখন যা আছে এডিটরেও তা-ই।' }));
    var ul = E('ul', { class: 'pub-stats' }, [
      E('li', { html: '<b>' + P.round(s.edits) + '</b> টি এলিমেন্টের ডিজাইন বদল' }),
      E('li', { html: '<b>' + P.round(s.added) + '</b> টি নতুন এলিমেন্ট' }),
      E('li', { html: '<b>' + P.round(s.pages) + '</b> টি পেজে পরিবর্তন' + (s.custom ? ' · <b>' + s.custom + '</b> টি নতুন পেজ' : '') }),
      E('li', { html: '<b>' + P.round(s.theme) + '</b> টি থিম-রং বদল' })
    ]);
    body.appendChild(ul);
    body.appendChild(E('p', { class: 'pub-note', text: 'পাবলিশ করলে সাধারণ ভিজিটররা এই নতুন ডিজাইনই দেখবেন — তাঁরা বুঝতেই পারবেন না যে এটি আলাদা কোনো সিস্টেম থেকে এসেছে। আগের সংস্করণ নিরাপদে রাখা থাকবে ("আগের সংস্করণ" মেনু থেকে ফেরা যাবে)।' }));
    $('modal-publish').classList.add('open');
  }
  function doPublish() {
    var btn = $('pub-ok'); btn.disabled = true; btn.textContent = 'পাবলিশ হচ্ছে…';
    var d = clean(P.design); d.rev = Date.now();
    var now = new Date().toISOString();
    PD.db.from('site_settings').select('value').eq('key', KEY).maybeSingle().then(function (cur) {
      var p = cur && cur.data && cur.data.value ? PD.db.from('site_settings').upsert({ key: KEY + '_prev', value: cur.data.value, updated_at: now }, { onConflict: 'key' }) : Promise.resolve({});
      return p;
    }).then(function () {
      return PD.db.from('site_settings').upsert({ key: KEY, value: d, updated_at: now }, { onConflict: 'key' });
    }).then(function (r) {
      if (r.error) throw r.error;
      P.design = P.normalize(d); P.published = P.snapshot(); P.pubRev = d.rev;
      P.resetHistory();
      try { localStorage.setItem(window.PDDesign ? 'pd-design-cache-v1' : 'pd-design-cache-v1', JSON.stringify(d)); localStorage.removeItem('pd-studio-draft'); } catch (e) {}
      P.emit('dirty');
      /* সাধারণ ভিজিটরের চোখে (anon) পড়া যায় কিনা যাচাই */
      var C = PD.config;
      return fetch(C.supabaseUrl + '/rest/v1/site_settings?key=eq.' + KEY + '&select=value', { headers: { apikey: C.anonKey, Authorization: 'Bearer ' + C.anonKey } })
        .then(function (x) { return x.ok ? x.json() : Promise.reject(x.status); })
        .then(function (rows) { return !!(rows && rows[0] && rows[0].value && rows[0].value.rev === d.rev); })
        .catch(function () { return false; });
    }).then(function (visible) {
      $('pub-pre').style.display = 'none'; $('pub-done').style.display = '';
      var msg = $('pub-done-msg');
      if (visible) { msg.className = 'pub-ok'; msg.innerHTML = '<b>✓ পাবলিশ সম্পন্ন!</b><br>এখন থেকে সবাই নতুন ডিজাইন দেখবেন। (কারও ব্রাউজারে ক্যাশ থাকলে পরের লোডে বদলে যাবে)'; }
      else { msg.className = 'pub-warn'; msg.innerHTML = '<b>ডিজাইন সংরক্ষণ হয়েছে, কিন্তু সাধারণ ভিজিটর এখনো নতুন ডিজাইন দেখতে পাচ্ছেন না।</b><br>একটু পরে পেজ রিফ্রেশ করে আবার দেখুন। তবুও না বদলালে "⋯ → ফাইল ডাউনলোড (বিকল্প)" দিয়ে <code>site-design.json</code> নামিয়ে রিপোর <code>assets/data/</code> ফোল্ডারে রাখুন।'; }
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = 'আবার চেষ্টা করুন';
      P.toast('পাবলিশ হয়নি — ' + PD.msg(e || {}), true);
    });
  }

  /* ================= শুরু ================= */
  function boot() {
    PD.ready.then(function () {
      if (!PD.isAdmin()) return;
      document.body.classList.remove('booting');
      var q = new URLSearchParams(location.search);
      P.initCanvas(); P.initInspector();
      return Promise.all([
        PD.db.from('site_settings').select('value').eq('key', KEY).maybeSingle(),
        PD.db.from('articles').select('id').order('published_at', { ascending: false }).limit(1),
        PD.db.from('issues').select('id').order('created_at', { ascending: false }).limit(1),
        PD.db.from('authors').select('slug').limit(1)
      ]).then(function (r) {
        var pub = r[0].data && r[0].data.value;
        P.design = P.normalize(pub ? JSON.parse(JSON.stringify(pub)) : null);
        P.pubRev = (pub && pub.rev) || 0;
        P.published = P.snapshot();
        P.sample = { article: r[1].data && r[1].data[0] && r[1].data[0].id, issue: r[2].data && r[2].data[0] && r[2].data[0].id, author: r[3].data && r[3].data[0] && r[3].data[0].slug };
        if (r[0].error) P.toast('ডিজাইনের তথ্য আনা যায়নি — ' + PD.msg(r[0].error), true);
        /* অসমাপ্ত ড্রাফট */
        var draft = null; try { draft = JSON.parse(localStorage.getItem('pd-studio-draft') || 'null'); } catch (e) {}
        if (draft && draft.d && JSON.stringify(P.normalize(draft.d)) !== P.published) {
          var bar = $('draft-bar'); bar.style.display = 'flex';
          $('draft-keep').onclick = function () { P.design = P.normalize(draft.d); P.resetHistory(); P.changed(); P.pushHistory(); bar.style.display = 'none'; P.render(); P.buildTheme && P.buildTheme(); P.emit('dirty'); P.toast('ড্রাফট ফিরে এসেছে'); };
          $('draft-drop').onclick = function () { bar.style.display = 'none'; try { localStorage.removeItem('pd-studio-draft'); } catch (e) {} };
        }
        P.resetHistory();
        P.initSide(); setupBar();
        var start = q.get('page') || 'index';
        P.layout();
        P.loadPage(start);
        P.emit('dirty');
        if (P.snapshot() !== P.published) P.emit('dirty');
        $('loading').style.display = 'none';
      });
    }).catch(function (e) { console.error(e); P.toast('স্টুডিও চালু হয়নি — ' + PD.msg(e || {}), true); $('loading').style.display = 'none'; });
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
