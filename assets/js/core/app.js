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
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 22px;border-radius:99px;z-index:9999;font:600 15px "Gunjoron",serif;color:#fff;background:' + (bad ? '#B3402E' : '#1D5358');
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
  var msg = PD.msg = function(e) {
    var m = e.message || '';
    if (ERR[m]) return ERR[m];
    if (/rate limit/i.test(m)) return 'অল্প সময়ে অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পরে আবার চেষ্টা করুন';
    if (/captcha/i.test(m)) return 'নিরাপত্তা যাচাই ব্যর্থ — পেজ রিফ্রেশ করে আবার চেষ্টা করুন';
    if (/password/i.test(m) && /6|8|short|least/i.test(m)) return 'পাসওয়ার্ড আরও বড় ও শক্ত দিন';
    return 'সমস্যা: ' + m
  };
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
  if (!window.supabase) {
    document.addEventListener('DOMContentLoaded', PD.fixLinks);
    console.warn('supabase-js লোড হয়নি');
    return
  }
  /* পাসওয়ার্ড রিসেট লিংক থেকে এলে (#...type=recovery) — ক্লায়েন্ট হ্যাশ মুছে ফেলার আগেই মনে রাখা */
  PD.recovery = /type=recovery/.test(location.hash) || /type=recovery/.test(location.search);
  var db = PD.db = window.supabase.createClient(C.supabaseUrl, C.anonKey);
  db.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') PD.recovery = true; });
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
  /* নিউজলেটার ফর্ম (সব পেজের ফুটারে): ইমেইল যাচাই করে সাবস্ক্রাইব */
  function bindNewsletter() {
    [].forEach.call(document.querySelectorAll('.newsletter-form'), function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var i = f.querySelector('input[type=email]');
        if (!i || !i.value.trim()) return;
        PD.subscribe(i.value.trim(), PD.user && PD.user.id).then(function (r) {
          if (r.error && r.error.code !== '23505') return PD.toast('সমস্যা হয়েছে, আবার চেষ্টা করুন', 1);
          PD.toast('ধন্যবাদ! সাবস্ক্রাইব হয়েছে।');
          f.reset();
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
