/* app.js — মূল কোর: Supabase সংযোগ, সেশন, টোস্ট, ত্রুটির বার্তা, লিংক ঠিক করা, এডমিন-গার্ড (সব পেজ) */
(function() {
  'use strict';
  var C = window.PD_CONFIG;
  var PD = window.PD = {
    config: C,
    pages: C.pages,
    db: null,
    user: null,
    profile: null
  };

  function toast(m, bad) {
    var t = document.createElement('div');
    t.textContent = m;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 22px;border-radius:99px;z-index:9999;font:600 15px "Noto Serif Bengali",serif;color:#fff;background:' + (bad ? '#B3402E' : '#1D5358');
    document.body.appendChild(t);
    setTimeout(function() {
      t.remove()
    }, 3500)
  }
  PD.toast = toast;
  var ERR = {
    'Invalid login credentials': 'ইমেইল বা পাসওয়ার্ড ভুল',
    'User already registered': 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে',
    'Email not confirmed': 'আগে ইমেইল ভেরিফাই করুন'
  };
  /* সব ত্রুটি ইউজারকে সহজ বাংলায়: ডেটাবেস/সার্ভার/স্টোরেজের কারিগরি লেখা কখনো দেখানো হয় না।
     আসল ত্রুটি শুধু ডেভেলপার-কনসোলে যায়। আমাদের নিজেদের বাংলা বার্তা (যেমন "এলাকা সঠিক নয়") হুবহু দেখানো হয়। */
  var BN_RE = /[\u0980-\u09FF]/;
  var msg = PD.msg = function(e, what) {
    e = e || {};
    var m = String(e.message || e.error_description || e.msg || (typeof e === 'string' ? e : '') || ''),
      c = String(e.code || e.error_code || ''),
      st = e.status || e.statusCode;
    if (typeof console !== 'undefined' && m) console.warn('[পত্রদ্বীপ]', m, c || '');
    if (ERR[m]) return ERR[m];
    /* আমাদের নিজের লেখা বাংলা বার্তা */
    if (BN_RE.test(m) && !/[A-Za-z]{4,}.*[A-Za-z]{4,}.*[A-Za-z]{4,}/.test(m)) return m;
    if (/failed to fetch|networkerror|network request|load failed|fetch failed|timeout|timed out|err_internet|offline/i.test(m) || st === 0)
      return 'ইন্টারনেট সংযোগ নেই বা খুব দুর্বল — সংযোগ দেখে আবার চেষ্টা করুন';
    if (/rate limit|too many|429/i.test(m) || st === 429) return 'অল্প সময়ে অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পরে আবার চেষ্টা করুন';
    if (/captcha/i.test(m)) return 'নিরাপত্তা যাচাই ব্যর্থ — পেজ রিফ্রেশ করে আবার চেষ্টা করুন';
    /* ছবি/ফাইল আপলোড */
    if (what === 'upload' || /bucket not found|payload too large|maximum allowed size|entity too large|mime type/i.test(m) || st === 413) {
      if (/too large|maximum allowed size|413|exceeded/i.test(m + st)) return 'ফাইলটা অনেক বড় — ছোট করে আবার দিন';
      if (/mime|not supported|invalid.*type|unsupported/i.test(m)) return 'এই ধরনের ফাইল দেওয়া যাবে না — ছবি (JPG/PNG/WebP) বা PDF দিন';
      if (/row-level security|permission denied|not allowed|forbidden|policy|42501|insufficient_privilege/i.test(m + c) || st === 401 || st === 403)
        return 'ছবি আপলোড হয়নি — লগইন করা আছে কিনা দেখে আবার চেষ্টা করুন';
      return 'ছবি আপলোড হয়নি — একটু পরে আবার চেষ্টা করুন';
    }
    if (/jwt|token.*expired|expired.*token|refresh_token|not authenticated|auth session missing|invalid claim/i.test(m)) return 'আপনার লগইনের মেয়াদ শেষ হয়েছে — আবার লগইন করুন';
    if (/email_domain_not_allowed|database error saving new user/i.test(m)) return 'শুধু পরিচিত ইমেইল (Gmail, Yahoo, Outlook ইত্যাদি) দিয়ে অ্যাকাউন্ট খোলা যায়';
    if (/password/i.test(m) && /6|8|short|least|weak|strength|pwned|compromised/i.test(m)) return 'পাসওয়ার্ড আরও বড় ও শক্ত দিন';
    if (/same.*password|new password should be different/i.test(m)) return 'নতুন পাসওয়ার্ড আগেরটার থেকে আলাদা দিন';
    if (/already (registered|exists)|duplicate key|unique constraint|23505/i.test(m + c)) return 'এটা আগেই আছে';
    if (/row-level security|permission denied|not allowed|forbidden|policy|42501|insufficient_privilege/i.test(m + c) || st === 401 || st === 403)
      return 'এই কাজটা করার অনুমতি নেই — লগইন করা আছে কিনা দেখুন';
    if (/violates check constraint|value too long|invalid input|23514|22001|22P02/i.test(m + c)) return 'দেওয়া তথ্যে ভুল আছে — একবার দেখে আবার চেষ্টা করুন';
    /* ফাংশন/টেবিল/কলাম নেই — ভেতরের ব্যাপার, ইউজারকে শুধু আবার চেষ্টা করতে বলা */
    return 'কাজটা এই মুহূর্তে সম্পন্ন হয়নি — একটু পরে আবার চেষ্টা করুন'
  };
  PD.uploadMsg = function(e) { return msg(e, 'upload') };
  PD.fixLinks = function() {
    var M = [
      [/^হোম$/, 'index.html'],
      [/^আর্কাইভ$/, 'archive.html'],
      [/^লেখক( তালিকা)?$/, 'authors.html'],
      [/^সংখ্যা কিনুন$/, 'store.html'],
      [/^(লগইন|সাইনআপ|আমার প্রোফাইল)$/, 'auth.html']
    ];
    [].forEach.call(document.querySelectorAll('a[href="#"],a:not([href])'), function(a) {
      var t = a.textContent.replace(/\s+/g, ' ').trim();
      if (a.classList.contains('brand')) {
        a.href = 'index.html';
        return
      }
      for (var i = 0; i < M.length; i++)
        if (M[i][0].test(t)) {
          a.href = M[i][1];
          return
        }
    });
    [].forEach.call(document.querySelectorAll('button[aria-label="প্রোফাইল"]'), function(b) {
      b.onclick = function() {
        location.href = 'auth.html'
      }
    });
    if (window.PD && PD.db) PD.db.from('site_settings').select('key,value').eq('key', 'contact').then(function(r) {
      var c = r.data && r.data[0] && r.data[0].value;
      if (!c) return;
      [].forEach.call(document.querySelectorAll('footer a'), function(a) {
        var t = a.textContent.trim();
        if (t == 'ফেসবুক' && c.facebook) a.href = c.facebook;
        if (t == 'ইনস্টাগ্রাম' && c.instagram) a.href = c.instagram;
        if (t == 'ইমেইল করুন' && c.email) a.href = 'mailto:' + c.email;
        if (t == 'ফোন করুন' && c.phone) a.href = 'tel:' + String(c.phone).replace(/[^0-9+]/g, '');
        [].forEach.call(['ফেসবুক', 'ইনস্টাগ্রাম'], function() {});
        if (a.getAttribute('href') == '#' && /ফেসবুক|ইনস্টাগ্রাম|ইমেইল|ফোন/.test(t)) a.style.display = 'none'
      })
    })
  };
  /* বিভাগের নামের বানান: ডাটাবেসে পুরোনো/ভুল বানানে থাকলেও সাইটে সবখানে সঠিক রূপে দেখানো (ভ্রমন→ভ্রমণ, সৃতিগদ্য→স্মৃতিগদ্য) */
  var CAT_FIX = { 'ভ্রমন': 'ভ্রমণ', 'সৃতিগদ্য': 'স্মৃতিগদ্য', 'সৃতি গদ্য': 'স্মৃতিগদ্য', 'স্মৃতি গদ্য': 'স্মৃতিগদ্য' };
  PD.normCat = function(c) { c = String(c == null ? '' : c).replace(/\s+/g, ' ').trim(); return CAT_FIX[c] || c };
  PD.fixCats = function(rows) { (rows || []).forEach(function(r) { if (r && r.category != null) r.category = PD.normCat(r.category) }); return rows };
  PD.catVariants = function(c) { c = PD.normCat(c); var v = [c]; for (var k in CAT_FIX) if (CAT_FIX[k] === c) v.push(k); return v };
  if (!window.supabase) {
    document.addEventListener('DOMContentLoaded', PD.fixLinks);
    console.warn('supabase-js লোড হয়নি');
    return
  }
  /* পাসওয়ার্ড রিসেট লিংক থেকে এলে (#...type=recovery) — ক্লায়েন্ট হ্যাশ মুছে ফেলার আগেই মনে রাখা */
  PD.recovery = /type=recovery/.test(location.hash) || /type=recovery/.test(location.search);
  /* ইমেইল-যাচাইয়ের লিংকে ক্লিক করে ফিরলে (#...type=signup) — অভিনন্দন দেখানোর জন্য */
  PD.justVerified = /type=(signup|email|invite)/.test(location.hash);
  /* ---------- দ্রুত ডেটা: পাবলিক টেবিলের পড়ার রিকোয়েস্টের স্মার্ট ক্যাশ ----------
     • শুধু লেখা/লেখক/সংখ্যা/বিজ্ঞাপন/প্রিন্ট-সংখ্যা/সাইট-সেটিংসের GET রিকোয়েস্ট (সবার জন্য একই ডেটা)
     • ক্যাশে থাকলে সঙ্গে সঙ্গে দেয় (নেটওয়ার্কের অপেক্ষা নেই), আর প্রতিবারই পেছনে নতুন ডেটা এনে মিলিয়ে দেখে
     • নতুন ডেটা আলাদা হলে (কেউ লেখা/সেটিং বদলালে) পেজ নিজে থেকে একবার রিফ্রেশ হয়ে নতুনটা দেখায় — রিয়ালটাইম
     • রিয়ালটাইম চ্যানেল চালু থাকলে বদলের মুহূর্তেই, না থাকলে প্রতি ২০ সেকেন্ডে ও ট্যাবে ফিরলে যাচাই হয়
     • কোনো লেখা/সেভ/ডিলিট (POST/PATCH/DELETE) হলেই পুরো ক্যাশ মুছে যায় — এডমিনের বদল সঙ্গে সঙ্গে দেখা যায়
     • এডমিন/স্টুডিও পেজে ক্যাশ বন্ধ; কমেন্ট, প্রোফাইল, ফলো ইত্যাদি ব্যক্তিগত ডেটা কখনো ক্যাশ হয় না */
  var SC = (function () {
    var PFX = 'pd-sc1:', TTL = 86400000, FRESH = 3000, MAXB = 400000;
    var used = {}; /* এই পেজ যেসব রিকোয়েস্ট ব্যবহার করেছে */
    var TABLES = /^\/rest\/v1\/(articles|authors|issues|ads|print_issues|site_settings)(\?|$)/;
    var off = /(^|\/)(admin|admin-studio|action)(\.html)?$/.test(location.pathname) || /[?&]pdstudio=1/.test(location.search);
    var mem = {}, base = C.supabaseUrl, nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    var ss = null;
    try { ss = window.sessionStorage; ss.getItem('x'); } catch (e) { ss = null; }
    function hdr(init, k) {
      var h = init && init.headers; if (!h) return '';
      if (typeof h.get === 'function') return h.get(k) || '';
      for (var n in h) if (n.toLowerCase() === k) return h[n] || '';
      return '';
    }
    function clearAll() {
      mem = {};
      if (!ss) return;
      try { for (var i = ss.length - 1; i >= 0; i--) { var k = ss.key(i); if (k && k.indexOf(PFX) === 0) ss.removeItem(k); } } catch (e) {}
    }
    function get(k) {
      if (mem[k]) return mem[k];
      if (!ss) return null;
      try { var v = ss.getItem(PFX + k); if (v) { v = JSON.parse(v); mem[k] = v; return v; } } catch (e) {}
      return null;
    }
    function put(k, e) {
      mem[k] = e;
      if (!ss) return;
      try { ss.setItem(PFX + k, JSON.stringify(e)); }
      catch (x) { try { clearAll(); mem[k] = e; } catch (y) {} }
    }
    function mk(e) {
      var h = { 'content-type': e.c };
      if (e.r) h['content-range'] = e.r;
      return new Response(e.b, { status: e.s, headers: h });
    }
    function wrapped(input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      if (url.indexOf(base) !== 0) return nativeFetch(input, init);
      var path = url.slice(base.length);
      if (method !== 'GET' && method !== 'HEAD') {
        if (path.indexOf('/rest/v1/') === 0 && path.indexOf('/rest/v1/rpc/increment_article_view') !== 0) clearAll();
        return nativeFetch(input, init);
      }
      if (off || method !== 'GET' || typeof input !== 'string' || !TABLES.test(path)) return nativeFetch(input, init);
      var key = path + '|' + hdr(init, 'authorization').slice(-24) + '|' + hdr(init, 'accept') + '|' + hdr(init, 'prefer') + '|' + hdr(init, 'range');
      var hit = get(key), now = Date.now();
      used[key] = [input, init];
      function refresh() {
        return nativeFetch(input, init).then(function (res) {
          if (res.status !== 200 && res.status !== 206) return res;
          var c = res.clone();
          c.text().then(function (b) {
            if (b.length > MAXB) return;
            var prev = get(key);
            put(key, { t: Date.now(), s: res.status, c: res.headers.get('content-type') || 'application/json', r: res.headers.get('content-range') || '', b: b });
            if (hit && norm(hit.b) !== norm(b)) changed();
          }).catch(function () {});
          return res;
        });
      }
      if (hit && now - hit.t < TTL) {
        if (now - hit.t > FRESH) refresh().catch(function () {});
        return Promise.resolve(mk(hit));
      }
      return refresh();
    }
    /* ভিউ-কাউন্ট প্রতি ভিজিটে বদলায় — সেটা "বদল" ধরা হয় না */
    function norm(b) { return String(b).replace(/"view_count":\s*\d+/g, '"view_count":0'); }
    /* পেজ এখনই নতুন ডেটায় রিফ্রেশ — তবে কেউ লিখতে থাকলে অপেক্ষা করে */
    function editing() {
      var a = document.activeElement, t = a && a.tagName;
      return !!(t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || (a && a.isContentEditable) || document.querySelector('dialog[open]'));
    }
    function changed() {
      if (document.hidden) { pending = true; return; }
      if (editing()) { setTimeout(changed, 3000); return; }
      var last = 0;
      try { last = +sessionStorage.getItem('pd-sr') || 0; } catch (e) {}
      var wait = 8000 - (Date.now() - last);
      if (wait > 0) { setTimeout(changed, wait + 100); return; }
      try { sessionStorage.setItem('pd-sr', String(Date.now())); } catch (e) {}
      location.reload();
    }
    var pending = false, busy = false;
    /* এই পেজের সব রিকোয়েস্ট আবার এনে মিলিয়ে দেখা */
    function revalidate() {
      if (off || busy) return;
      busy = true;
      var ks = Object.keys(used), n = ks.length, diff = false;
      if (!n) { busy = false; return; }
      ks.forEach(function (k) {
        nativeFetch(used[k][0], used[k][1]).then(function (res) {
          if (res.status !== 200 && res.status !== 206) return;
          return res.text().then(function (b) {
            var old = get(k);
            if (b.length > MAXB) return;
            put(k, { t: Date.now(), s: res.status, c: res.headers.get('content-type') || 'application/json', r: res.headers.get('content-range') || '', b: b });
            if (old && norm(old.b) !== norm(b)) diff = true;
          });
        }).catch(function () {}).then(function () {
          if (--n === 0) { busy = false; if (diff) changed(); }
        });
      });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      if (pending) { pending = false; changed(); } else revalidate();
    });
    return { fetch: nativeFetch ? wrapped : null, clear: clearAll, revalidate: revalidate, off: off };
  })();
  PD.clearCache = SC.clear;
  var db = PD.db = window.supabase.createClient(C.supabaseUrl, C.anonKey, SC.fetch ? { global: { fetch: SC.fetch } } : undefined);
  db.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') PD.recovery = true; });
  /* ---------- রিয়ালটাইম: সাইটের ডেটা বদলালেই পেজ হালনাগাদ ---------- */
  if (!SC.off && db.channel) {
    var liveOn = false, lt = null;
    var kick = function () { clearTimeout(lt); lt = setTimeout(SC.revalidate, 600 + Math.random() * 1200); };
    try {
      var lch = db.channel('pd-site-data');
      ['articles', 'authors', 'issues', 'ads', 'print_issues', 'site_settings'].forEach(function (t) {
        lch.on('postgres_changes', { event: '*', schema: 'public', table: t }, kick);
      });
      lch.subscribe(function (st) { liveOn = st === 'SUBSCRIBED'; });
    } catch (e) {}
    /* রিয়ালটাইম সংযুক্ত না থাকলে প্রতি ২০ সেকেন্ডে নিজে যাচাই */
    setInterval(function () { if (!document.hidden && !liveOn) SC.revalidate(); }, 20000);
  }
  PD.load = function() {
    return db.auth.getSession().then(function(r) {
      PD.user = r.data.session ? r.data.session.user : null;
      if (!PD.user) return null;
      return db.from('profiles').select('*').eq('id', PD.user.id).single().then(function(p) {
        PD.profile = p.data;
        return PD.profile
      })
    })
  };
  PD.isAdmin = function() {
    return !!(PD.profile && PD.profile.role === 'admin')
  };
  PD.signOut = function() {
    return db.auth.signOut().then(function() {
      location.href = PD.pages.auth
    })
  };
  /* ছবি ও PDF আপলোড: Firebase Storage চালু থাকলে আগে সেখানে (firebase.js), না হলে বা ব্যর্থ হলে Supabase-এর 'media'-তে।
     একটা ফাইল শুধু একটা জায়গাতেই থাকে। ফেরত দেয় ছবির পাবলিক লিংক। */
  function sbUpload(blob, path, type) {
    return db.storage.from('media').upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false }).then(function(r) {
      if (r.error) throw r.error;
      return db.storage.from('media').getPublicUrl(path).data.publicUrl
    })
  }
  PD.upload = function(blob, path, type) {
    type = type || blob.type || 'application/octet-stream';
    if (!PD.fbUpload || !/^(image\/|application\/pdf$)/.test(type)) return sbUpload(blob, path, type);
    return PD.fbUpload(blob, path, type).catch(function(e) {
      if (e && e.message !== 'firebase-no-user') console.warn('Firebase আপলোড হয়নি, Supabase-এ রাখা হচ্ছে', e);
      return sbUpload(blob, path, type)
    })
  };
  /* পুরোনো প্রোফাইল-ছবি মুছে ফেলা (শুধু নিজের avatars/ ফোল্ডারের ছবি) — জমে থাকা অপ্রয়োজনীয় ফাইল ঠেকাতে। ব্যর্থ হলেও কিছু ভাঙে না। */
  PD.removeFile = function(url) {
    try {
      var m = String(url || '').match(/\/storage\/v1\/object\/public\/media\/(avatars\/[^?#]+)/);
      if (m && PD.user && m[1].indexOf('avatars/' + PD.user.id + '/') === 0)
        return db.storage.from('media').remove([decodeURIComponent(m[1])]).then(function() {}, function() {});
      if (PD.fbRemove) return PD.fbRemove(url)
    } catch (e) {}
    return Promise.resolve()
  };
  PD.subscribe = function(email, uid) {
    return db.from('newsletter_subscribers').insert({
      email: email,
      user_id: uid || null
    })
  };

  function syncTheme() {
    var th = document.getElementById('theme-toggle');
    if (th) th.addEventListener('click', function() {
      setTimeout(function() {
        if (PD.user) db.from('profiles').update({
          theme_preference: document.documentElement.getAttribute('data-theme')
        }).eq('id', PD.user.id).then(function() {})
      }, 400)
    })
  }
  /* v13: লগইন থাকলে হেডারের অ্যাকাউন্ট আইকনে ইউজারের নিজের ছবি দেখাও (ছবি না থাকলে আগের আইকনই থাকে) */
  PD.setHeaderAvatar = function(url) {
    var ab = document.querySelector('.site-header .account-btn');
    if (!ab || !PD.user) return;
    var src = url || (PD.profile && PD.profile.avatar_url);
    var img = ab.querySelector('img.account-avatar');
    if (!src) { if (img) img.remove(); ab.classList.remove('has-avatar'); return; }
    if (!img) {
      img = document.createElement('img');
      img.className = 'account-avatar';
      img.alt = '';
      img.width = 40; img.height = 40;
      img.onerror = function () { img.remove(); ab.classList.remove('has-avatar'); };
      ab.appendChild(img);
    }
    img.src = src;
    ab.classList.add('has-avatar');
  };
  document.addEventListener('pd:profile', function () { PD.setHeaderAvatar(); });
  PD.ready = PD.load().then(function() {
    if (PD.profile && PD.profile.theme_preference && !localStorage.getItem('potrodip-theme')) {
      localStorage.setItem('potrodip-theme', PD.profile.theme_preference);
      document.documentElement.setAttribute('data-theme', PD.profile.theme_preference)
    }
    var ab = document.querySelector('.account-btn');
    if (ab && PD.user) { ab.classList.add('logged'); ab.title = 'আমার প্রোফাইল'; }
    PD.setHeaderAvatar();
    if (/admin/.test(location.pathname) && !PD.isAdmin()) {
      location.replace(PD.pages.auth)
    }
  });
  /* নিউজলেটার ফর্ম (সব পেজের ফুটারে): প্রথমবার হলে \"সফল\", আগে থেকে সাবস্ক্রাইব করা থাকলে \"ইতিমধ্যে সাবস্ক্রাইব করা আছে\" */
  function bindNewsletter() {
    [].forEach.call(document.querySelectorAll('.newsletter-form'), function (f) {
      var st = document.createElement('p'), hideT = 0, busy = false;
      st.className = 'nl-status'; st.setAttribute('role', 'status'); st.setAttribute('aria-live', 'polite');
      f.parentNode.insertBefore(st, f.nextSibling);
      function say(kind, text) {
        clearTimeout(hideT);
        st.className = 'nl-status show ' + kind;
        st.textContent = text;
        hideT = setTimeout(function () { st.classList.remove('show'); }, 7000);
      }
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) return;
        var i = f.querySelector('input[type=email]');
        var email = i ? i.value.trim().toLowerCase() : '';
        if (!email) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return say('warn', 'ইমেইল ঠিকানাটা সঠিক মনে হচ্ছে না — একবার দেখে নিন।');
        busy = true; f.classList.add('is-busy');
        PD.subscribe(email, PD.user && PD.user.id).then(function (r) {
          busy = false; f.classList.remove('is-busy');
          var er = r && r.error;
          if (er && (er.code === '23505' || /duplicate key|already exists/i.test(String(er.message || '')))) {
            say('info', 'এই ইমেইলটি ইতিমধ্যে নিউজলেটারে সাবস্ক্রাইব করা আছে। নতুন সংখ্যা প্রকাশ হলে ঠিকই জানিয়ে দেব।');
            return;
          }
          if (er) return say('warn', 'এই মুহূর্তে সাবস্ক্রাইব করা যায়নি — একটু পরে আবার চেষ্টা করুন।');
          say('ok', 'সাবস্ক্রাইব সফল হয়েছে! নতুন সংখ্যা প্রকাশ হলেই ইমেইলে জানিয়ে দেব।');
          f.reset();
        }, function () {
          busy = false; f.classList.remove('is-busy');
          say('warn', 'ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।');
        });
      });
    });
  }
  function ready() {
    PD.fixLinks();
    syncTheme();
    bindNewsletter();
  }
  if (document.readyState !== 'loading') ready();
  else document.addEventListener('DOMContentLoaded', ready);
})();


/* ---------- পরের পেজ আগেভাগে লোড (প্রিফেচ) ----------
   লিংকে মাউস নিলে / আঙুল ছোঁয়ালেই সেই পেজের ফাইল ব্রাউজার চুপচাপ নামিয়ে রাখে —
   তাই ক্লিক করার মুহূর্তে পেজ প্রায় সঙ্গে সঙ্গে খোলে। ডিজাইন বা এনিমেশনে কোনো বদল নেই। */
(function () {
  'use strict';
  if (/[?&]pdstudio=1/.test(location.search)) return;
  var cn = navigator.connection || {};
  if (cn.saveData || /(^|-)2g$/.test(cn.effectiveType || '')) return;
  var done = {}, timer = null;
  function eligible(a) {
    if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return false;
    var u;
    try { u = new URL(a.href, location.href); } catch (e) { return false; }
    if (u.origin !== location.origin || !/^https?:$/.test(u.protocol)) return false;
    if (u.pathname === location.pathname && u.search === location.search) return false;
    if (/(^|\/)(admin|admin-studio|action)(\.html)?$/.test(u.pathname)) return false;
    return u.href.split('#')[0];
  }
  function prefetch(href) {
    if (done[href]) return;
    done[href] = 1;
    var l = document.createElement('link');
    l.rel = 'prefetch'; l.href = href; l.as = 'document';
    document.head.appendChild(l);
  }
  function target(e) { return e.target && e.target.closest ? e.target.closest('a') : null; }
  document.addEventListener('touchstart', function (e) { var h = eligible(target(e)); if (h) prefetch(h); }, { passive: true, capture: true });
  document.addEventListener('mousedown', function (e) { if (e.button === 0) { var h = eligible(target(e)); if (h) prefetch(h); } }, { capture: true });
  document.addEventListener('mouseover', function (e) {
    var a = target(e), h = eligible(a);
    if (!h || done[h]) return;
    clearTimeout(timer);
    timer = setTimeout(function () { prefetch(h); }, 65);
    a.addEventListener('mouseleave', function () { clearTimeout(timer); }, { once: true });
  }, { passive: true, capture: true });
})();
