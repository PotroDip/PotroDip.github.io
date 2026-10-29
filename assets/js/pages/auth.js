/* auth.js — লগইন/সাইনআপ: ইমেইল, ফেসবুক, Cloudflare Turnstile ক্যাপচা, লগআউট */
(function() {
  'use strict';
  var PD = window.PD;
  if (!PD || !PD.db) return;
  var db = PD.db,
    toast = PD.toast,
    msg = PD.msg,
    TSK = PD.config.turnstileSiteKey,
    TK = {},
    TW = {};

  function $(i) {
    return document.getElementById(i)
  }

  function on(i, f) {
    var e = $(i);
    if (e) e.addEventListener('click', function(ev) {
      ev.preventDefault();
      f(e)
    })
  }

  function go() {
    if (window.pdShowDashboard) pdShowDashboard();
    else location.href = PD.isAdmin() ? PD.pages.admin : PD.pages.home
  }

  function tok(i) {
    return TK[i] || ''
  }

  function rs(i) {
    TK[i] = '';
    try {
      if (window.turnstile && TW[i] != null) turnstile.reset(TW[i])
    } catch (e) {}
  }

  function initTS(n) {
    n = n || 0;
    var ids = ['ts-login', 'ts-signup'].filter(function(i) {
      return $(i)
    });
    if (!ids.length) return;
    if (!window.turnstile) {
      if (n < 50) setTimeout(function() {
        initTS(n + 1)
      }, 200);
      return
    }
    ids.forEach(function(i) {
      TW[i] = turnstile.render('#' + i, {
        sitekey: TSK,
        appearance: 'interaction-only',
        theme: 'auto',
        callback: function(t) {
          TK[i] = t
        },
        'expired-callback': function() {
          TK[i] = ''
        },
        'error-callback': function() {
          TK[i] = ''
        }
      })
    })
  }
  var WAIT = 'আগে "Verify you are human" বক্সে টিক দিন (বা ২-৩ সেকেন্ড অপেক্ষা করুন), তারপর আবার চাপুন';

  function wire() {
    initTS();
    on('btn-login-submit', function(b) {
      var e = $('li-email').value.trim(),
        p = $('li-pass').value;
      if (!e || !p) return toast('ইমেইল ও পাসওয়ার্ড দিন', 1);
      var ct = tok('ts-login');
      if (!ct) return toast(WAIT, 1);
      b.disabled = 1;
      db.auth.signInWithPassword({
        email: e,
        password: p,
        options: {
          captchaToken: ct
        }
      }).then(function(r) {
        b.disabled = 0;
        rs('ts-login');
        if (r.error) return toast(msg(r.error), 1);
        PD.load().then(function() {
          toast('স্বাগতম!');
          setTimeout(go, 700)
        })
      })
    });
    on('btn-signup-submit', function(b) {
      var n = $('su-name').value.trim(),
        e = $('su-email').value.trim(),
        p = $('su-pass').value;
      if (!n || !e || p.length < 6) return toast('নাম, ইমেইল ও ন্যূনতম ৬ অক্ষরের পাসওয়ার্ড দিন', 1);
      var nl = $('newsletter-switch');
      nl = !nl || nl.checked;
      var ct = tok('ts-signup');
      if (!ct) return toast(WAIT, 1);
      b.disabled = 1;
      db.auth.signUp({
        email: e,
        password: p,
        options: {
          captchaToken: ct,
          data: {
            full_name: n
          },
          emailRedirectTo: location.origin + '/' + PD.pages.auth
        }
      }).then(function(r) {
        b.disabled = 0;
        rs('ts-signup');
        if (r.error) return toast(msg(r.error), 1);
        var u = r.data.user;
        if (r.data.session) {
          db.from('profiles').update({
            newsletter_subscribed: nl
          }).eq('id', u.id).then(function() {});
          if (nl) PD.subscribe(e, u.id);
          toast('অ্যাকাউন্ট তৈরি হয়েছে!');
          setTimeout(go, 900)
        } else {
          if (nl) PD.subscribe(e, null);
          toast('আপনার ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে — লিংকে ক্লিক করে লগইন করুন')
        }
      })
    });
    ['btn-facebook-login', 'btn-facebook-signup'].forEach(function(i) {
      on(i, function() {
        db.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            redirectTo: location.href.split('#')[0]
          }
        }).then(function(r) {
          if (r.error) toast(msg(r.error), 1)
        })
      })
    });
    on('demo-logout-btn', function() {
      PD.signOut()
    });
  }
  PD.ready.then(function() {
    if (PD.user && window.pdShowDashboard) pdShowDashboard()
  });

  function forms() {
    /* লগইন/সাইনআপ ফর্মে Enter চাপলে সংশ্লিষ্ট বাটন চাপা হয় (নিউজলেটার ফর্ম app.js সামলায়) */
    [].forEach.call(document.forms, function(f) {
      if (f.classList.contains('newsletter-form')) return;
      f.addEventListener('submit', function(e) {
        e.preventDefault();
        var b = f.querySelector('[id$="-submit"]');
        if (b) b.click();
      })
    })
  }

  function start() {
    wire();
    forms()
  }
  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
