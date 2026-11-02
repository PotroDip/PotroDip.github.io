/* custom-fonts.js — নিজের ফন্ট যোগ করা (v82)
   • ফন্ট ফাইল Supabase Storage ('media/fonts/…') এ থাকে, তালিকা থাকে public.custom_fonts টেবিলে
   • এডমিন যত খুশি ফন্ট যোগ করতে ও মুছতে পারে; ডিফল্ট ফন্ট (Noto Serif Bengali) সাইটের সঙ্গেই বাঁধা — মোছা যায় না
   • লেখার পাতায় (article.js) শুধু সেই লেখায় ব্যবহৃত ফন্টগুলোই লোড হয় */
(function () {
  'use strict';
  var PD = window.PD;
  var FAM = /^pdf_[a-z0-9]{6,20}$/;
  var FALLBACK = "'Noto Serif Bengali', serif";
  /* সাইটের নিজস্ব/সিস্টেম ফন্ট — এগুলো মোছা যায় না */
  var BUILTIN = [
    { k: '', n: 'নোটো সেরিফ বাংলা', css: FALLBACK, def: 1 },
    { k: 'georgia', n: 'সেরিফ (ক্লাসিক)', css: "Georgia, 'Noto Serif Bengali', 'Times New Roman', serif" },
    { k: 'sans', n: 'সান-সেরিফ (আধুনিক)', css: "'Noto Sans Bengali', 'Segoe UI', 'Nirmala UI', Arial, sans-serif" },
    { k: 'mono', n: 'মনোস্পেস (কোড)', css: "'Courier New', Consolas, monospace" },
    { k: 'script', n: 'হাতের লেখা', css: "'Segoe Script', 'Bradley Hand', cursive" }
  ];
  var MAX_BYTES = 8 * 1024 * 1024;
  var EXT = { truetype: 'ttf', opentype: 'otf', woff: 'woff', woff2: 'woff2' };
  var MIME = { truetype: 'font/ttf', opentype: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' };

  var rows = [], loaded = false, missing = false, subs = [], styleEl = null, have = {};

  function db() { return PD && PD.db; }
  function emit() { subs.slice().forEach(function (f) { try { f(rows); } catch (e) {} }); }
  function safeUrl(u) { return /^https:\/\/[^\s'"()\\]+$/.test(u || ''); }
  function inject(list) {
    list.forEach(function (r) {
      if (!r || !FAM.test(r.family) || !safeUrl(r.url) || have[r.family]) return;
      have[r.family] = 1;
      if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'pd-custom-fonts'; document.head.appendChild(styleEl); }
      var fmt = EXT[r.format] ? r.format : 'truetype';
      styleEl.appendChild(document.createTextNode("@font-face{font-family:'" + r.family + "';src:url('" + r.url + "') format('" + fmt + "');font-weight:100 900;font-style:normal;font-display:swap;}\n"));
    });
  }
  function mergeRows(list) {
    list.forEach(function (r) { if (!rows.some(function (x) { return x.id === r.id; })) rows.push(r); });
  }

  /* ---------- তালিকা আনা (এডমিনে সবগুলো) ---------- */
  function load(force) {
    if (loaded && !force) return Promise.resolve(rows);
    if (!db()) return Promise.resolve(rows);
    return db().from('custom_fonts').select('id,name,family,url,format,path,size_bytes,created_at').order('created_at', { ascending: true }).then(function (r) {
      if (r.error) { missing = true; rows = []; } else { missing = false; rows = r.data || []; inject(rows); }
      loaded = true; emit(); return rows;
    }, function () { missing = true; loaded = true; return rows; });
  }
  /* ---------- লেখার পাতা: শুধু ব্যবহৃত ফন্ট ---------- */
  function loadFor(families) {
    var need = [], seen = {};
    (families || []).forEach(function (f) { if (FAM.test(f) && !seen[f] && !have[f]) { seen[f] = 1; need.push(f); } });
    if (!need.length || !db()) return Promise.resolve([]);
    return db().from('custom_fonts').select('id,name,family,url,format').in('family', need).then(function (r) {
      if (r.error || !r.data) return [];
      mergeRows(r.data); inject(r.data); return r.data;
    }, function () { return []; });
  }
  /* লেখার HTML বা শিরোনাম-ফন্ট থেকে ব্যবহৃত ফন্ট খুঁজে লোড করা */
  function scan(text) {
    var out = [], m, re = /pdf_[a-z0-9]{6,20}/g;
    while ((m = re.exec(String(text || '')))) if (out.indexOf(m[0]) < 0) out.push(m[0]);
    return out;
  }

  /* ---------- CSS মান ---------- */
  function css(key) {
    if (!key) return FALLBACK;
    var i; for (i = 0; i < BUILTIN.length; i++) if (BUILTIN[i].k === key) return BUILTIN[i].css;
    if (FAM.test(key)) return "'" + key + "', " + FALLBACK;
    return FALLBACK;
  }
  function nameOf(key) {
    var i; for (i = 0; i < BUILTIN.length; i++) if (BUILTIN[i].k === key) return BUILTIN[i].n;
    for (i = 0; i < rows.length; i++) if (rows[i].family === key) return rows[i].name;
    return '';
  }

  /* ---------- ফাইল যাচাই ---------- */
  function sniff(buf) {
    var d = new Uint8Array(buf.slice(0, 4)), s = String.fromCharCode(d[0], d[1], d[2], d[3]);
    if (s === 'wOF2') return 'woff2';
    if (s === 'wOFF') return 'woff';
    if (s === 'OTTO') return 'opentype';
    if ((d[0] === 0 && d[1] === 1 && d[2] === 0 && d[3] === 0) || s === 'true') return 'truetype';
    return '';
  }
  function cleanName(n) { return String(n || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').replace(/[<>"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60); }
  function rid() { var a = '', i; for (i = 0; i < 10; i++) a += 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]; return a; }
  function msg(e) {
    var m = e && e.message ? String(e.message) : '';
    if (/[\u0980-\u09FF]/.test(m)) return m;
    if (/custom_fonts|relation|schema cache|does not exist/i.test(m)) return 'ফন্ট টেবিল তৈরি করা নেই — সাথের SQL ফাইলটা (20261105_custom_fonts.sql) একবার Supabase → SQL Editor-এ চালান';
    if (/mime|type|not allowed|invalid/i.test(m)) return 'ফন্ট ফাইল রাখার অনুমতি নেই — SQL ফাইলটা (20261105_custom_fonts.sql) চালিয়েছেন তো?';
    if (/row-level|policy|permission|unauthorized/i.test(m)) return 'শুধু এডমিন ফন্ট যোগ বা মুছতে পারবেন';
    return 'ফন্ট যোগ হয়নি — আবার চেষ্টা করুন';
  }

  /* ---------- যোগ ---------- */
  function add(file, name) {
    if (!db()) return Promise.reject(new Error('সংযোগ নেই'));
    if (!file) return Promise.reject(new Error('ফন্ট ফাইল বেছে নিন'));
    if (file.size > MAX_BYTES) return Promise.reject(new Error('ফন্ট ফাইল ৮ MB-এর বেশি হওয়া চলবে না'));
    return file.arrayBuffer().then(function (buf) {
      var fmt = sniff(buf);
      if (!fmt) throw new Error('এটা ফন্ট ফাইল নয় — .ttf, .otf, .woff বা .woff2 দিন');
      var fam = 'pdf_' + rid(), test;
      try { test = new FontFace('pdchk' + rid(), buf); } catch (e) { throw new Error('ফন্ট ফাইলটা পড়া যাচ্ছে না'); }
      return test.load().then(function () { return fmt; }, function () { throw new Error('ফন্ট ফাইলটা নষ্ট বা অচেনা — অন্য ফাইল দিন'); }).then(function (f) {
        var path = 'fonts/' + fam + '.' + EXT[f];
        return PD.upload(new Blob([buf], { type: MIME[f] }), path, MIME[f]).then(function (url) {
          var row = { name: cleanName(name) || cleanName(file.name) || 'নতুন ফন্ট', family: fam, url: url, format: f, path: path, size_bytes: file.size };
          return db().from('custom_fonts').insert(row).select('id,name,family,url,format,path,size_bytes,created_at').single().then(function (r) {
            if (r.error) { db().storage.from('media').remove([path]).then(function () {}, function () {}); throw r.error; }
            mergeRows([r.data]); inject([r.data]); emit(); return r.data;
          });
        });
      });
    });
  }
  /* ---------- মোছা (ডিফল্ট ফন্ট এখানে নেই, তাই মোছার প্রশ্নই আসে না) ---------- */
  function remove(row) {
    if (!row || !row.id || !FAM.test(row.family)) return Promise.reject(new Error('এই ফন্ট মোছা যাবে না'));
    return db().from('custom_fonts').delete().eq('id', row.id).select('id').then(function (r) {
      if (r.error) throw r.error;
      if (!r.data || !r.data.length) throw new Error('শুধু এডমিন ফন্ট মুছতে পারবেন');
      rows = rows.filter(function (x) { return x.id !== row.id; });
      if (row.path) db().storage.from('media').remove([row.path]).then(function () {}, function () {});
      emit();
    });
  }

  window.PDFonts = {
    BUILTIN: BUILTIN, FALLBACK: FALLBACK, FAM: FAM,
    load: load, loadFor: loadFor, scan: scan, css: css, nameOf: nameOf, add: add, remove: remove, msg: msg,
    list: function () { return rows.slice(); },
    isMissing: function () { return missing; },
    onChange: function (f) { subs.push(f); }
  };
})();
