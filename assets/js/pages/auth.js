/* auth.js — লগইন/সাইনআপ।
   ইমেইল ও গুগল: Firebase (config.js-এ চালু থাকলে) → firebase-bridge ফাংশন → একই ইমেইলের Supabase অ্যাকাউন্ট।
   Firebase চালু না থাকলে আগের মতো Supabase দিয়েই (Cloudflare Turnstile ক্যাপচা সহ)।
   ফেসবুক: সবসময় Supabase দিয়ে, আগে একটা পরিচিতি-পপআপ দেখিয়ে। */
(function() {
  'use strict';
  var PD = window.PD;
  if (!PD || !PD.db) return;
  var db = PD.db,
    toast = PD.toast,
    msg = PD.msg,
    FB = PD.fbOn ? PD.fb : null,
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

  function busy(b, onOff) {
    if (!b) return;
    b.disabled = !!onOff;
    b.classList.toggle('loading', !!onOff)
  }

  /* ---------- ইমেইল যাচাই: গঠন + পরিচিত প্রোভাইডার ---------- */
  var DOMAINS = (PD.config.allowedEmailDomains || []).map(function(d) {
    return String(d).toLowerCase()
  });

  function emailProblem(e) {
    if (!e) return 'ইমেইল ঠিকানা লিখুন';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'সঠিক ইমেইল ঠিকানা দিন';
    var d = e.split('@')[1].toLowerCase();
    if (DOMAINS.length && DOMAINS.indexOf(d) < 0)
      return 'শুধু পরিচিত ইমেইল (যেমন Gmail, Yahoo, Outlook, iCloud) দিয়ে অ্যাকাউন্ট খোলা যায় — "@' + d + '" গ্রহণযোগ্য নয়';
    return ''
  }

  function hint(inp, text, bad) {
    if (!inp) return;
    var h = $(inp.id + '-hint');
    if (h) {
      h.textContent = text || '';
      h.classList.toggle('bad', !!bad);
      h.classList.toggle('show', !!text)
    }
    inp.classList.toggle('is-bad', !!bad)
  }

  function watchEmail(inp) {
    if (!inp) return;
    inp.addEventListener('input', function() {
      hint(inp, '', 0)
    });
    inp.addEventListener('blur', function() {
      var v = inp.value.trim();
      if (v) hint(inp, emailProblem(v), !!emailProblem(v))
    })
  }

  /* ---------- Cloudflare Turnstile (Supabase-এ সরাসরি লগইন/রিসেটে লাগে — Firebase-মোডেও পুরোনো অ্যাকাউন্টের জন্য) ---------- */
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

  /* ---------- Firebase ত্রুটির সহজ বাংলা ---------- */
    function fbMsg(e) {
    var c = (e && e.code) || '';
    return ({
      'auth/invalid-credential': 'ইমেইল বা পাসওয়ার্ড ভুল',
      'auth/wrong-password': 'ইমেইল বা পাসওয়ার্ড ভুল',
      'auth/user-not-found': 'ইমেইল বা পাসওয়ার্ড ভুল',
      'auth/invalid-email': 'সঠিক ইমেইল ঠিকানা দিন',
      'auth/email-already-in-use': 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে — লগইন করুন',
      'auth/weak-password': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন',
      'auth/too-many-requests': 'অল্প সময়ে অনেকবার চেষ্টা হয়েছে — কিছুক্ষণ পরে আবার চেষ্টা করুন',
      'auth/network-request-failed': 'ইন্টারনেট সংযোগ দেখুন, তারপর আবার চেষ্টা করুন',
      'auth/user-disabled': 'এই অ্যাকাউন্টটি বন্ধ করা আছে',
      'auth/popup-blocked': 'ব্রাউজার পপআপ আটকে দিয়েছে — পপআপ চালু করে আবার চাপুন',
      'auth/operation-not-allowed': 'এই লগইন-পদ্ধতি এখনো চালু হয়নি — একটু পরে চেষ্টা করুন',
      'auth/unauthorized-domain': 'এই ওয়েবসাইট থেকে লগইন এখনো অনুমোদিত হয়নি — একটু পরে চেষ্টা করুন',
      'auth/account-exists-with-different-credential': 'এই ইমেইলে অন্য পদ্ধতিতে অ্যাকাউন্ট আছে — ইমেইল-পাসওয়ার্ড দিয়ে লগইন করুন'
    })[c] || ('সমস্যা হয়েছে' + (c ? ' (' + c.replace('auth/', '') + ')' : '') + ' — আবার চেষ্টা করুন')
  }

  /* ---------- Firebase → Supabase সেশন ---------- */
  var BRIDGE_ERR = {
    email_not_verified: 'আগে ইমেইলে পাঠানো লিংকে ক্লিক করে ইমেইল যাচাই করুন',
    email_domain_not_allowed: 'শুধু পরিচিত ইমেইল (Gmail, Yahoo, Outlook ইত্যাদি) দিয়ে অ্যাকাউন্ট খোলা যায়',
    invalid_token: 'লগইন যাচাই করা যায়নি — আবার চেষ্টা করুন'
  };

  function bridgeIn(user) {
    return user.getIdToken(true).then(function(t) {
      return fetch(PD.config.supabaseUrl + '/functions/v1/firebase-bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: PD.config.anonKey,
          Authorization: 'Bearer ' + PD.config.anonKey
        },
        body: JSON.stringify({ idToken: t })
      })
    }).then(function(r) {
      return r.json().catch(function() {
        return {}
      }).then(function(j) {
        if (!r.ok || !j.token_hash) {
          var e = new Error(BRIDGE_ERR[j.error] || 'সার্ভারে সমস্যা — একটু পরে আবার চেষ্টা করুন');
          e.bridge = j.error || 'http_' + r.status;
          throw e
        }
        return db.auth.verifyOtp({ token_hash: j.token_hash, type: 'magiclink' })
      })
    }).then(function(r) {
      if (r.error) throw r.error;
      return PD.load()
    }).then(function() {
      toast('স্বাগতম!');
      setTimeout(go, 600)
    }).catch(function(e) {
      FB.auth.signOut().catch(function() {});
      throw e
    })
  }

  /* ---------- ইমেইল দিয়ে লগইন ---------- */
  /* Supabase-এ সরাসরি লগইন — Firebase চালু হওয়ার আগে খোলা পুরোনো অ্যাকাউন্টের জন্য (নিরাপত্তা-জাল) */
  function supabaseLogin(b, e, p, fromFb) {
    var ct = tok('ts-login');
    if (!ct) { busy(b, 0); return toast(WAIT, 1); }
    busy(b, 1);
    db.auth.signInWithPassword({ email: e, password: p, options: { captchaToken: ct } }).then(function(r) {
      busy(b, 0);
      rs('ts-login');
      if (r.error) return toast(fromFb && /Invalid login/i.test(r.error.message || '') ? 'ইমেইল বা পাসওয়ার্ড ভুল' : msg(r.error), 1);
      PD.load().then(function() {
        toast('স্বাগতম!');
        setTimeout(go, 700)
      })
    })
  }

  function loginSubmit(b) {
    var inp = $('li-email'),
      e = inp.value.trim().toLowerCase(),
      p = $('li-pass').value;
    if (!e || !p) return toast('ইমেইল ও পাসওয়ার্ড দিন', 1);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { hint(inp, 'সঠিক ইমেইল ঠিকানা দিন', 1); return inp.focus(); }
    if (FB) {
      busy(b, 1);
      FB.auth.signInWithEmailAndPassword(e, p).then(function(c) {
        if (!c.user.emailVerified) {
          busy(b, 0);
          return openVerify(c.user, 'login')
        }
        return bridgeIn(c.user).then(function() { busy(b, 0) })
      }).catch(function(err) {
        busy(b, 0);
        /* Firebase-এ এই ইমেইলে অ্যাকাউন্ট নেই বা পাসওয়ার্ড মেলেনি → হয়তো আগের (Supabase) অ্যাকাউন্ট */
        if (err && err.code && /invalid-credential|user-not-found|wrong-password/.test(err.code)) return supabaseLogin(b, e, p, true);
        toast(err && err.code ? fbMsg(err) : (err && err.message) || 'সমস্যা হয়েছে', 1)
      });
      return
    }
    supabaseLogin(b, e, p, false)
  }

  /* ---------- ইমেইল দিয়ে সাইনআপ ---------- */
  function signupSubmit(b) {
    var n = $('su-name').value.trim(),
      inp = $('su-email'),
      e = inp.value.trim().toLowerCase(),
      p = $('su-pass').value;
    if (!n || !e || p.length < 6) return toast('নাম, ইমেইল ও ন্যূনতম ৬ অক্ষরের পাসওয়ার্ড দিন', 1);
    var bad = emailProblem(e);
    if (bad) { hint(inp, bad, 1); inp.focus(); return toast(bad, 1); }
    var nl = $('newsletter-switch');
    nl = !nl || nl.checked;
    if (FB) {
      busy(b, 1);
      FB.auth.createUserWithEmailAndPassword(e, p).then(function(c) {
        return c.user.updateProfile({ displayName: n }).catch(function() {}).then(function() {
          return c.user.sendEmailVerification({ url: location.origin + location.pathname })
        }).then(function() {
          if (nl) PD.subscribe(e, null).then(function() {}, function() {});
          busy(b, 0);
          openVerify(c.user, 'signup')
        })
      }).catch(function(err) {
        busy(b, 0);
        toast(fbMsg(err), 1)
      });
      return
    }
    var ct = tok('ts-signup');
    if (!ct) return toast(WAIT, 1);
    busy(b, 1);
    db.auth.signUp({
      email: e,
      password: p,
      options: { captchaToken: ct, data: { full_name: n }, emailRedirectTo: location.origin + '/' + PD.pages.auth }
    }).then(function(r) {
      busy(b, 0);
      rs('ts-signup');
      if (r.error) return toast(/domain_not_allowed|Database error saving/i.test(r.error.message || '') ? BRIDGE_ERR.email_domain_not_allowed : msg(r.error), 1);
      var u = r.data.user;
      if (u && u.identities && !u.identities.length) return toast('এই ইমেইলে আগেই অ্যাকাউন্ট আছে — লগইন করুন', 1);
      if (r.data.session) {
        db.from('profiles').update({ newsletter_subscribed: nl }).eq('id', u.id).then(function() {});
        if (nl) PD.subscribe(e, u.id);
        toast('অ্যাকাউন্ট তৈরি হয়েছে!');
        setTimeout(go, 900)
      } else {
        if (nl) PD.subscribe(e, null);
        openVerify(null, 'signup', e)
      }
    })
  }

  /* ---------- গুগল ---------- */
  function google() {
    if (!FB) {
      db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } }).then(function(r) {
        if (r.error) toast(msg(r.error), 1)
      });
      return
    }
    var pv = new firebase.auth.GoogleAuthProvider();
    pv.setCustomParameters({ prompt: 'select_account' });
    FB.auth.signInWithPopup(pv).then(function(c) {
      return afterGoogle(c.user)
    }).catch(function(err) {
      if (!err) return;
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      if (err.code === 'auth/popup-blocked') {
        try { sessionStorage.setItem('pd-g-redirect', '1') } catch (e) {}
        return FB.auth.signInWithRedirect(pv)
      }
      toast(err.code ? fbMsg(err) : err.message, 1)
    })
  }

  function afterGoogle(u) {
    var bad = emailProblem(String(u.email || '').toLowerCase());
    if (bad) {
      FB.auth.signOut();
      return toast(bad, 1)
    }
    return bridgeIn(u)
  }

  /* ---------- ফেসবুক (আগে পরিচিতি-পপআপ) ---------- */
  function facebookGo() {
    var b = $('fbc-go');
    busy(b, 1);
    (FB ? FB.auth.signOut().catch(function() {}) : Promise.resolve()).then(function() {
      return db.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: location.href.split('#')[0] } })
    }).then(function(r) {
      if (r && r.error) {
        busy(b, 0);
        toast(msg(r.error), 1)
      }
    })
  }

  /* ---------- পপআপ (পাসওয়ার্ড রিসেট / ইমেইল যাচাই / নতুন পাসওয়ার্ড / ফেসবুক) ---------- */
  var OV = null,
    lastFocus, fpMode = 'ask',
    pending = null;

  function step(n) {
    ['ask', 'sent', 'verify', 'new'].forEach(function(k) {
      var e = $('fp-step-' + k);
      if (e) e.hidden = k !== n
    });
    fpMode = n;
    var b = $('fp-badge');
    if (b) b.classList.toggle('ok', n === 'sent' || n === 'verify')
  }

  function openOv(id, focusId) {
    if (OV) closeOv(true);
    OV = $(id);
    if (!OV) return;
    lastFocus = document.activeElement;
    OV.classList.add('open');
    OV.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fp-lock');
    setTimeout(function() {
      var f = $(focusId) || OV.querySelector('input,button.btn-primary-full');
      if (f) f.focus()
    }, 120)
  }

  function closeOv(force) {
    if (!OV) return;
    if (!force && OV.id === 'fp-overlay' && fpMode === 'new') return; /* নতুন পাসওয়ার্ড না দিয়ে বন্ধ নয় */
    if (OV.id === 'fp-overlay' && fpMode === 'verify' && FB && pending && pending.user) FB.auth.signOut().catch(function() {});
    if (OV.id === 'fbc-overlay') busy($('fbc-go'), 0);
    OV.classList.remove('open');
    OV.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('fp-lock');
    OV = null;
    pending = null;
    if (lastFocus && lastFocus.focus) try { lastFocus.focus() } catch (e) {}
  }

  function openFP(mode) {
    step(mode || 'ask');
    hint($('fp-email'), '', 0);
    var nh = $('np-hint');
    if (nh) { nh.textContent = ''; nh.className = 'id-hint' }
    var li = ($('li-email') && $('li-email').value.trim()) || '';
    if (mode !== 'new' && li && !$('fp-email').value) $('fp-email').value = li;
    openOv('fp-overlay', mode === 'new' ? 'np-pass' : 'fp-email')
  }

  /* ইমেইল যাচাইয়ের পপআপ — user থাকলে "আবার পাঠান" কাজ করে */
  function openVerify(user, from, email) {
    step('verify');
    var em = (user && user.email) || email || '';
    $('fp-verify-text').textContent = (from === 'login' ?
      'আপনার ইমেইল এখনো যাচাই হয়নি। ' + em + ' ঠিকানায় পাঠানো লিংকে ক্লিক করুন, তারপর আবার লগইন করুন।' :
      'অ্যাকাউন্ট তৈরি হয়েছে! ' + em + ' ঠিকানায় একটা যাচাই-লিংক পাঠানো হয়েছে। লিংকে ক্লিক করলেই অ্যাকাউন্ট চালু হবে, তারপর এখানে লগইন করুন।');
    $('fp-resend').hidden = !(FB && user);
    openOv('fp-overlay', 'fp-verify-ok');
    pending = { user: user };
    if (from === 'signup') {
      var t = document.querySelector('.auth-tabs button[data-tab="login"]');
      if (t) t.click();
      if ($('li-email')) $('li-email').value = em;
      if ($('su-pass')) $('su-pass').value = ''
    }
  }

  function wireOverlays() {
    [].forEach.call(document.querySelectorAll('.forgot-link'), function(a) {
      a.addEventListener('click', function(ev) {
        ev.preventDefault();
        openFP('ask')
      })
    });
    ['fp-close', 'fp-cancel', 'fp-done', 'fp-verify-ok', 'fbc-close', 'fbc-cancel'].forEach(function(i) {
      var e = $(i);
      if (e) e.addEventListener('click', function() { closeOv() })
    });
    ['fp-overlay', 'fbc-overlay'].forEach(function(i) {
      var o = $(i);
      if (o) o.addEventListener('click', function(ev) { if (ev.target === o) closeOv() })
    });
    document.addEventListener('keydown', function(ev) {
      if (!OV) return;
      if (ev.key === 'Escape') return closeOv();
      if (ev.key !== 'Tab') return;
      var f = [].filter.call(OV.querySelectorAll('button,input'), function(x) {
        return !x.disabled && x.offsetParent !== null
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus() }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus() }
    });

    on('fp-resend', function(b) {
      if (!pending || !pending.user) return;
      busy(b, 1);
      pending.user.sendEmailVerification({ url: location.origin + location.pathname }).then(function() {
        busy(b, 0);
        toast('যাচাই-লিংক আবার পাঠানো হয়েছে')
      }).catch(function(err) {
        busy(b, 0);
        toast(fbMsg(err), 1)
      })
    });

    $('fp-email').addEventListener('input', function() { hint(this, '', 0) });
    $('fp-form').addEventListener('submit', function(ev) {
      ev.preventDefault();
      var inp = $('fp-email'),
        e = inp.value.trim().toLowerCase(),
        btn = $('fp-send');
      if (!e) { hint(inp, 'আপনার ইমেইল ঠিকানা লিখুন', 1); return inp.focus(); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { hint(inp, 'সঠিক ইমেইল ঠিকানা দিন', 1); return inp.focus(); }
      var sent = function() {
        busy(btn, 0);
        $('fp-sent-text').textContent = e + ' ঠিকানায় অ্যাকাউন্ট থাকলে সেখানে পাসওয়ার্ড বদলানোর লিংক পাঠানো হয়েছে। ইনবক্সে না পেলে স্প্যাম ফোল্ডারটাও দেখুন।';
        $('fp-old-box').hidden = !FB;
        step('sent')
      };
      if (FB) {
        busy(btn, 1);
        FB.auth.sendPasswordResetEmail(e, { url: location.origin + location.pathname }).then(sent).catch(function(err) {
          if (err && err.code === 'auth/user-not-found') return sent();
          busy(btn, 0);
          hint(inp, fbMsg(err), 1)
        });
        return
      }
      var ct = tok('ts-login');
      if (!ct) { hint(inp, WAIT, 1); return; }
      busy(btn, 1);
      db.auth.resetPasswordForEmail(e, { redirectTo: location.origin + '/' + PD.pages.auth, captchaToken: ct }).then(function(r) {
        rs('ts-login');
        if (r.error) { busy(btn, 0); return hint(inp, msg(r.error), 1); }
        sent()
      })
    });

    /* Supabase-এর পুরোনো রিসেট লিংক থেকে ফিরে এলে নতুন পাসওয়ার্ড */
    $('np-form').addEventListener('submit', function(ev) {
      ev.preventDefault();
      var p = $('np-pass').value,
        h = $('np-hint'),
        btn = $('np-save');
      if (p.length < 6) { h.textContent = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'; h.className = 'id-hint show bad'; return $('np-pass').focus(); }
      busy(btn, 1);
      db.auth.updateUser({ password: p }).then(function(r) {
        busy(btn, 0);
        if (r.error) { h.textContent = msg(r.error); h.className = 'id-hint show bad'; return; }
        fpMode = 'done';
        closeOv(true);
        $('np-pass').value = '';
        toast('পাসওয়ার্ড বদলানো হয়েছে');
        if (history.replaceState) history.replaceState(null, '', location.pathname);
      })
    });

    /* পুরোনো (Firebase-এর আগের) অ্যাকাউন্টের পাসওয়ার্ড রিসেট — Supabase দিয়ে */
    on('fp-old-reset', function(b) {
      var e = ($('fp-email').value || '').trim().toLowerCase(),
        ct = tok('ts-login');
      if (!e) return;
      if (!ct) return toast(WAIT, 1);
      busy(b, 1);
      db.auth.resetPasswordForEmail(e, { redirectTo: location.origin + '/' + PD.pages.auth, captchaToken: ct }).then(function(r) {
        busy(b, 0);
        rs('ts-login');
        if (r.error) return toast(msg(r.error), 1);
        toast('আগের অ্যাকাউন্ট থাকলে ' + e + ' ঠিকানায় রিসেট লিংক পাঠানো হয়েছে')
      })
    });
    on('fbc-go', facebookGo)
  }

  function wire() {
    initTS();
    on('btn-login-submit', loginSubmit);
    on('btn-signup-submit', signupSubmit);
    ['login', 'signup'].forEach(function(k) {
      on('btn-google-' + k, google);
      on('btn-facebook-' + k, function() { openOv('fbc-overlay', 'fbc-go') })
    });
    watchEmail($('su-email'));
    on('demo-logout-btn', function() {
      PD.signOut()
    });
    wireOverlays();
    /* গুগল পপআপ আটকে গিয়ে রিডাইরেক্টে গেলে ফিরে এসে লগইন শেষ করা */
    var red = false;
    try { red = sessionStorage.getItem('pd-g-redirect') === '1'; sessionStorage.removeItem('pd-g-redirect') } catch (e) {}
    if (FB && red) FB.auth.getRedirectResult().then(function(r) {
      if (r && r.user && !PD.user) return afterGoogle(r.user)
    }).catch(function(err) {
      if (err) toast(err.code ? fbMsg(err) : err.message, 1)
    })
  }

  function askNewPassword() {
    if (!PD.recovery || !PD.user) return;
    PD.recovery = false;
    openFP('new')
  }
  db.auth.onAuthStateChange(function(ev) {
    if (ev === 'PASSWORD_RECOVERY') { PD.recovery = true; PD.load().then(function() { setTimeout(askNewPassword, 300) }) }
  });
  PD.ready.then(function() {
    if (PD.user && window.pdShowDashboard) pdShowDashboard();
    setTimeout(askNewPassword, 500)
  });

  function forms() {
    /* লগইন/সাইনআপ ফর্মে Enter চাপলে সংশ্লিষ্ট বাটন চাপা হয় (নিউজলেটার ফর্ম app.js সামলায়) */
    [].forEach.call(document.forms, function(f) {
      if (f.classList.contains('newsletter-form') || f.id === 'fp-form' || f.id === 'np-form') return;
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
