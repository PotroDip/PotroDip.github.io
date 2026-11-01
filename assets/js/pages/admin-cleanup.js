/* admin-cleanup.js — এডমিন প্যানেলের "ডেমো ডাটা পরিষ্কার" পেজ।
   সুপাবেজের ডেমো ডাটা একসাথে মোছে। আগে সার্ভারের ফাংশন (supabase/migrations/20261104_admin_demo_cleanup.sql) ডাকে;
   সেটা চালানো না থাকলে সরাসরি টেবিল ধরে মোছার চেষ্টা করে (এডমিনের অনুমতি থাকলে)। */
(function () {
  'use strict';
  var PD = window.PD, A = window.AdminUI, $ = function (i) { return document.getElementById(i); };
  if (!PD || !PD.db || !A || !$('page-cleanup')) return;
  var db = PD.db;

  /* কী মুছবে: target = SQL ফাংশনের নাম; tabs = মোছার ক্রম (আগে নির্ভরশীল টেবিল); key = যে কলামে সারি ধরা যায় */
  var ITEMS = [
    { id: 'articles', label: 'লেখা', hint: 'সব লেখা, লেখার ছবি, মন্তব্য, বুকমার্ক', tabs: [['comment_likes', 'comment_id'], ['comments', 'id'], ['bookmarks', 'article_id'], ['article_images', 'id'], ['articles', 'id']], count: 'articles' },
    { id: 'authors', label: 'লেখক প্রোফাইল', hint: 'সব লেখক ও তাঁদের ফলোয়ার-তথ্য (আগে লেখা মুছুন)', tabs: [['follows', 'author_id'], ['authors', 'id']], count: 'authors' },
    { id: 'comments', label: 'মন্তব্য ও রেটিং', hint: 'শুধু মন্তব্য/রেটিং ও লাইক — লেখা থাকবে', tabs: [['comment_likes', 'comment_id'], ['comments', 'id']], count: 'comments' },
    { id: 'issues', label: 'আর্কাইভ সংখ্যা', hint: 'ত্রৈমাসিক সংখ্যার তালিকা', tabs: [['issues', 'id']], count: 'issues' },
    { id: 'print_issues', label: 'প্রিন্ট সংখ্যা (স্টোর)', hint: 'ছাপা সংখ্যা ও সেগুলোর অর্ডার', tabs: [['order_items', 'id'], ['orders', 'id'], ['print_issues', 'id']], count: 'print_issues' },
    { id: 'orders', label: 'অর্ডার', hint: 'সব অর্ডার ও অর্ডারের আইটেম', tabs: [['order_items', 'id'], ['orders', 'id']], count: 'orders' },
    { id: 'ads', label: 'বিজ্ঞাপন', hint: 'এড স্লটের সব ছবি/লিংক', tabs: [['ads', 'id']], count: 'ads' },
    { id: 'notifications', label: 'নোটিফিকেশন', hint: 'ইউজারদের সব নোটিফিকেশন', tabs: [['notifications', 'id']], count: 'notifications' },
    { id: 'subscribers', label: 'নিউজলেটার সাবস্ক্রাইবার', hint: 'সব সাবস্ক্রাইবারের ইমেইল', tabs: [['newsletter_subscribers', 'id']], count: 'newsletter_subscribers' },
    { id: 'bookmarks', label: 'সেভ করা লেখা (বুকমার্ক)', hint: 'সব ইউজারের বুকমার্ক', tabs: [['bookmarks', 'article_id']], count: 'bookmarks' },
    { id: 'follows', label: 'ফলো', hint: 'ইউজার–লেখক ফলো সম্পর্ক', tabs: [['follows', 'author_id']], count: 'follows' },
    { id: 'media', label: 'ছবি ও ফাইল (সুপাবেজ স্টোরেজ)', hint: "'media' বাকেটের সব ফাইল — প্রোফাইল/কভার ছবিও যাবে", media: true }
  ];
  var counts = {}, busy = false;
  var list = $('cleanup-list'), conf = $('cleanup-confirm'), run = $('cleanup-run'), msg = $('cleanup-msg');

  function bn(n) { return A.toBn(n); }
  function say(t, bad) { msg.textContent = t || ''; msg.style.color = bad ? 'var(--error)' : 'var(--text-muted)'; }
  function missing(e) { return e && (e.code === '42P01' || e.code === 'PGRST205' || e.code === 'PGRST202' || e.code === '42883' || /could not find|does not exist/i.test(e.message || '')); }

  function render() {
    list.innerHTML = '';
    ITEMS.forEach(function (it) {
      var row = document.createElement('label');
      row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--border);cursor:pointer;';
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = it.id; cb.addEventListener('change', sync);
      var box = document.createElement('span'); box.style.cssText = 'flex:1;min-width:0;';
      var t = document.createElement('strong'); t.textContent = it.label;
      var h = document.createElement('small'); h.style.cssText = 'display:block;color:var(--text-muted);margin-top:2px;'; h.textContent = it.hint;
      box.appendChild(t); box.appendChild(h);
      var n = document.createElement('span'); n.style.cssText = 'font-weight:600;white-space:nowrap;'; n.setAttribute('data-count', it.id);
      n.textContent = it.media ? '' : (counts[it.count] == null ? '…' : bn(counts[it.count]) + 'টি');
      row.appendChild(cb); row.appendChild(box); row.appendChild(n);
      list.appendChild(row);
    });
    sync();
  }
  function picked() { return [].slice.call(list.querySelectorAll('input:checked')).map(function (c) { return c.value; }); }
  function sync() { run.disabled = busy || !picked().length || conf.value.trim() !== 'মুছুন'; }

  function loadCounts() {
    say('সংখ্যা গোনা হচ্ছে…');
    return db.rpc('pd_admin_demo_counts').then(function (r) {
      if (!r.error && r.data) { counts = r.data; return; }
      /* ফাংশন না থাকলে সরাসরি গুনি */
      counts = {};
      return Promise.all(ITEMS.filter(function (i) { return i.count; }).map(function (i) {
        return db.from(i.count).select('*', { count: 'exact', head: true }).then(function (x) { counts[i.count] = x.error ? 0 : (x.count || 0); });
      }));
    }).then(function () { render(); say(''); }, function () { render(); say('সংখ্যা আনা যায়নি — নেটওয়ার্ক দেখে রিফ্রেশ করুন।', true); });
  }

  /* সরাসরি মোছা (SQL ফাংশন না থাকলে) */
  function wipeDirect(it) {
    var total = 0, chain = Promise.resolve();
    it.tabs.forEach(function (tk) {
      chain = chain.then(function () {
        return db.from(tk[0]).delete({ count: 'exact' }).not(tk[1], 'is', null).then(function (r) {
          if (r.error && !missing(r.error)) throw r.error;
          total += r.count || 0;
        });
      });
    });
    return chain.then(function () { return total; });
  }

  /* স্টোরেজ বাকেটের সব ফাইল মোছা (ফোল্ডার ধরে ধরে) */
  function listAll(prefix) {
    return db.storage.from('media').list(prefix, { limit: 1000 }).then(function (r) {
      if (r.error) throw r.error;
      var files = [], subs = [];
      (r.data || []).forEach(function (o) { var p = prefix ? prefix + '/' + o.name : o.name; if (o.id) files.push(p); else subs.push(p); });
      return Promise.all(subs.map(listAll)).then(function (arr) { return arr.reduce(function (a, b) { return a.concat(b); }, files); });
    });
  }
  function wipeMedia() {
    return listAll('').then(function (files) {
      if (!files.length) return 0;
      var chunks = [], i; for (i = 0; i < files.length; i += 100) chunks.push(files.slice(i, i + 100));
      var done = 0;
      return chunks.reduce(function (p, c) {
        return p.then(function () { return db.storage.from('media').remove(c).then(function (r) { if (r.error) throw r.error; done += (r.data || c).length; }); });
      }, Promise.resolve()).then(function () { return done; });
    });
  }

  function doWipe() {
    var ids = picked(); if (!ids.length) return;
    busy = true; sync(); say('মোছা হচ্ছে… একটু অপেক্ষা করুন।');
    var dbIds = ids.filter(function (i) { return i !== 'media'; }), lines = [];
    var step = dbIds.length ? db.rpc('pd_admin_wipe', { p_targets: dbIds }) : Promise.resolve({ data: {} });
    step.then(function (r) {
      if (r.error) {
        if (!missing(r.error)) throw r.error;
        /* SQL ফাংশন চালানো হয়নি — সরাসরি পদ্ধতি */
        var res = {}, chain = Promise.resolve();
        dbIds.forEach(function (id) {
          var it = ITEMS.filter(function (x) { return x.id === id; })[0];
          chain = chain.then(function () { return wipeDirect(it).then(function (n) { res[id] = n; }, function (e) { res[id] = 'error: ' + (e && e.message || e); }); });
        });
        return chain.then(function () { return res; });
      }
      return r.data || {};
    }).then(function (res) {
      Object.keys(res).forEach(function (k) {
        var it = ITEMS.filter(function (x) { return x.id === k; })[0], v = res[k];
        lines.push((it ? it.label : k) + ': ' + (typeof v === 'number' ? bn(v) + 'টি মোছা হয়েছে' : 'হয়নি — ' + String(v).replace(/^error: /, '')));
      });
      if (ids.indexOf('media') >= 0) return wipeMedia().then(function (n) { lines.push('ছবি ও ফাইল: ' + bn(n) + 'টি মোছা হয়েছে'); }, function (e) { lines.push('ছবি ও ফাইল: হয়নি — ' + (e && e.message || e)); });
    }).then(function () {
      say(lines.join('\n')); msg.style.whiteSpace = 'pre-line';
      A.showToast('পরিষ্কার করা শেষ');
      conf.value = ''; list.querySelectorAll('input:checked').forEach(function (c) { c.checked = false; });
      busy = false; return loadCounts().then(function () { say(lines.join('\n')); });
    }).catch(function (e) {
      busy = false; sync();
      say((e && e.code === '42501') || /not allowed|permission|policy/i.test((e && e.message) || '') ? 'অনুমতি নেই — এডমিন অ্যাকাউন্টে লগইন আছে কি দেখুন, আর supabase/migrations/20261104_admin_demo_cleanup.sql একবার SQL Editor-এ চালান।' : 'মোছা যায়নি: ' + ((e && e.message) || e), true);
    });
  }

  conf.addEventListener('input', sync);
  $('cleanup-refresh').addEventListener('click', loadCounts);
  run.addEventListener('click', function () {
    var ids = picked(), names = ids.map(function (i) { return ITEMS.filter(function (x) { return x.id === i; })[0].label; }).join(', ');
    A.showConfirm('সত্যিই মুছবেন?', names + ' — এগুলোর সব ডাটা চিরতরে মুছে যাবে।', doWipe);
  });
  render();
  document.addEventListener('ad:page', function (e) { if (e.detail === 'cleanup') loadCounts(); });
  if (location.hash === '#cleanup') loadCounts();
})();
