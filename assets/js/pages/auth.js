/* auth.js — লগইন/সাইনআপ: মোবাইল/ইমেইল, গুগল, ফেসবুক, Cloudflare Turnstile ক্যাপচা, পাসওয়ার্ড রিসেট পপআপ, লগআউট */
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


  /* ---------- মোবাইল / ইমেইল শনাক্তকরণ ---------- */
  var BN = '০১২৩৪৫৬৭৮৯', PHONE_DOM = PD.config.phoneEmailDomain || 'phone.potrodip.app';

  /* বাংলা সংখ্যা (০-৯) → ইংরেজি (0-9) */
  function toEn(v) {
    return String(v == null ? '' : v).replace(/[০-৯]/g, function(c) {
      return BN.indexOf(c)
    })
  }

  /* ফলাফল: {type:'email'|'phone'|'empty'|'bad', value, error} */
  function ident(raw) {
    var v = toEn(raw).trim();
    if (!v) return { type: 'empty', value: '' };
    if (v.indexOf('@') > -1) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { type: 'bad', value: v, error: 'সঠিক ইমেইল ঠিকানা দিন' };
      return { type: 'email', value: v.toLowerCase() };
    }
    if (/^[0-9+\-\s]+$/.test(v)) {
      var d = v.replace(/[^0-9]/g, '');
      if (d.length > 11 || v.charAt(0) === '+') return { type: 'bad', value: d, error: 'মোবাইল নম্বর ১১ ডিজিটের বেশি হবে না — শুধু ০১XXXXXXXXX ফরম্যাটে দিন' };
      if (d.length < 11) return { type: 'bad', value: d, error: 'মোবাইল নম্বর ১১ ডিজিটের হতে হবে (আরও ' + (11 - d.length) + ' ডিজিট)' };
      if (!/^01[3-9][0-9]{8}$/.test(d)) return { type: 'bad', value: d, error: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (০১৩–০১৯ দিয়ে শুরু)' };
      return { type: 'phone', value: d };
    }
    return { type: 'bad', value: v, error: 'সঠিক মোবাইল নম্বর বা ইমেইল ঠিকানা দিন' };
  }

  function loginEmail(id) {
    return id.type === 'phone' ? id.value + '@' + PHONE_DOM : id.value
  }

  function hint(inp, text, bad) {
    var h = $(inp.id + '-hint');
    if (h) {
      h.textContent = text || '';
      h.classList.toggle('bad', !!bad);
      h.classList.toggle('show', !!text)
    }
    inp.classList.toggle('is-bad', !!bad)
  }

  /* টাইপ করার সময়: বাংলা সংখ্যা অটো ইংরেজি, নম্বর হলে ডিজিট-গণনা */
  function watchIdent(inp) {
    if (!inp) return;
    inp.addEventListener('input', function() {
      var en = toEn(inp.value);
      if (en !== inp.value) {
        var pos = inp.selectionStart;
        inp.value = en;
        try { inp.setSelectionRange(pos, pos) } catch (e) {}
      }
      var v = inp.value.trim();
      if (!v || v.indexOf('@') > -1 || !/^[0-9+\-\s]+$/.test(v)) return hint(inp, '', 0);
      var n = v.replace(/[^0-9]/g, '').length;
      if (n > 11 || v.charAt(0) === '+') return hint(inp, 'মোবাইল নম্বর ১১ ডিজিটের বেশি হবে না', 1);
      hint(inp, n + '/১১ ডিজিট', 0);
    });
    inp.addEventListener('blur', function() {
      var r = ident(inp.value);
      if (r.type === 'bad' && inp.value.trim()) hint(inp, r.error, 1);
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
      var inp = $('li-email'),
        id = ident(inp.value),
        p = $('li-pass').value;
      if (id.type === 'empty' || !p) return toast('মোবাইল/ইমেইল ও পাসওয়ার্ড দিন', 1);
      if (id.type === 'bad') { hint(inp, id.error, 1); inp.focus(); return toast(id.error, 1); }
      var ct = tok('ts-login');
      if (!ct) return toast(WAIT, 1);
      b.disabled = 1;
      db.auth.signInWithPassword({
        email: loginEmail(id),
        password: p,
        options: {
          captchaToken: ct
        }
      }).then(function(r) {
        b.disabled = 0;
        rs('ts-login');
        if (r.error) return toast(id.type === 'phone' && /Invalid login/i.test(r.error.message || '') ? 'মোবাইল নম্বর বা পাসওয়ার্ড ভুল' : msg(r.error), 1);
        PD.load().then(function() {
          toast('স্বাগতম!');
          setTimeout(go, 700)
        })
      })
    });
    on('btn-signup-submit', function(b) {
      var n = $('su-name').value.trim(),
        inp = $('su-email'),
        id = ident(inp.value),
        p = $('su-pass').value;
      if (!n || id.type === 'empty' || p.length < 6) return toast('নাম, মোবাইল/ইমেইল ও ন্যূনতম ৬ অক্ষরের পাসওয়ার্ড দিন', 1);
      if (id.type === 'bad') { hint(inp, id.error, 1); inp.focus(); return toast(id.error, 1); }
      var isPhone = id.type === 'phone',
        e = loginEmail(id);
      var nl = $('newsletter-switch');
      nl = (!nl || nl.checked) && !isPhone;
      var ct = tok('ts-signup');
      if (!ct) return toast(WAIT, 1);
      b.disabled = 1;
      var meta = { full_name: n };
      if (isPhone) meta.phone = id.value;
      db.auth.signUp({
        email: e,
        password: p,
        options: {
          captchaToken: ct,
          data: meta,
          emailRedirectTo: location.origin + '/' + PD.pages.auth
        }
      }).then(function(r) {
        b.disabled = 0;
        rs('ts-signup');
        if (r.error) return toast(isPhone && /already registered/i.test(r.error.message || '') ? 'এই মোবাইল নম্বরে আগেই অ্যাকাউন্ট আছে' : msg(r.error), 1);
        var u = r.data.user;
        if (r.data.session) {
          var upd = { newsletter_subscribed: nl };
          if (isPhone) upd.phone = id.value;
          db.from('profiles').update(upd).eq('id', u.id).then(function() {});
          if (nl) PD.subscribe(e, u.id);
          toast('অ্যাকাউন্ট তৈরি হয়েছে!');
          setTimeout(go, 900)
        } else if (isPhone) {
          toast('অ্যাকাউন্ট তৈরি হয়েছে — এখন লগইন করুন');
          $('li-email').value = id.value;
          $('li-pass').value = '';
          var t = document.querySelector('.auth-tabs button[data-tab="login"]');
          if (t) t.click()
        } else {
          if (nl) PD.subscribe(e, null);
          toast('আপনার ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে — লিংকে ক্লিক করে লগইন করুন')
        }
      })
    });
    ['login', 'signup'].forEach(function(k) {
      ['google', 'facebook'].forEach(function(pv) {
        on('btn-' + pv + '-' + k, function() {
          db.auth.signInWithOAuth({
            provider: pv,
            options: {
              redirectTo: location.href.split('#')[0]
            }
          }).then(function(r) {
            if (r.error) toast(msg(r.error), 1)
          })
        })
      });
      /* ইমেইল বাটন: নিচের মোবাইল/ইমেইল ঘরে নিয়ে যায় */
      on('btn-email-' + k, function() {
        var f = $(k === 'login' ? 'li-email' : 'su-email');
        if (!f) return;
        f.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function() { f.focus() }, 280);
        f.classList.remove('pulse');
        void f.offsetWidth;
        f.classList.add('pulse')
      })
    });
    watchIdent($('li-email'));
    watchIdent($('su-email'));
    on('demo-logout-btn', function() {
      PD.signOut()
    });
    wireModal();
  }

  /* ---------- পাসওয়ার্ড ভুলে গেলে / নতুন পাসওয়ার্ড: গ্লাস পপআপ ---------- */
  var FP, lastFocus, fpMode = 'ask';

  function step(n) {
    ['ask', 'sent', 'new'].forEach(function(k) {
      var e = $('fp-step-' + k);
      if (e) e.hidden = k !== n
    });
    fpMode = n;
    var b = $('fp-badge');
    if (b) b.classList.toggle('ok', n === 'sent')
  }

  function openFP(mode) {
    FP = FP || $('fp-overlay');
    if (!FP) return;
    lastFocus = document.activeElement;
    step(mode || 'ask');
    hint($('fp-email'), '', 0);
    var nh = $('np-hint');
    if (nh) { nh.textContent = ''; nh.className = 'id-hint' }
    var li = ident($('li-email') ? $('li-email').value : '');
    if (mode !== 'new' && li.type === 'email') $('fp-email').value = li.value;
    FP.classList.add('open');
    FP.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fp-lock');
    setTimeout(function() {
      var f = $(mode === 'new' ? 'np-pass' : 'fp-email');
      if (f) f.focus()
    }, 120)
  }

  function closeFP() {
    if (!FP) return;
    if (fpMode === 'new') return; /* নতুন পাসওয়ার্ড না দিয়ে বন্ধ করা যাবে না */
    FP.classList.remove('open');
    FP.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('fp-lock');
    if (lastFocus && lastFocus.focus) try { lastFocus.focus() } catch (e) {}
  }

  function wireModal() {
    FP = $('fp-overlay');
    if (!FP) return;
    [].forEach.call(document.querySelectorAll('.forgot-link'), function(a) {
      a.addEventListener('click', function(ev) {
        ev.preventDefault();
        openFP('ask')
      })
    });
    ['fp-close', 'fp-cancel', 'fp-done'].forEach(function(i) {
      var e = $(i);
      if (e) e.addEventListener('click', closeFP)
    });
    FP.addEventListener('click', function(ev) {
      if (ev.target === FP) closeFP()
    });
    document.addEventListener('keydown', function(ev) {
      if (ev.key === 'Escape' && FP.classList.contains('open')) closeFP();
      if (ev.key === 'Tab' && FP.classList.contains('open')) {
        var f = [].filter.call(FP.querySelectorAll('button,input'), function(x) {
          return !x.disabled && x.offsetParent !== null
        });
        if (!f.length) return;
        var first = f[0],
          last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus() }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus() }
      }
    });
    $('fp-email').addEventListener('input', function() { hint(this, '', 0) });
    $('fp-form').addEventListener('submit', function(ev) {
      ev.preventDefault();
      var inp = $('fp-email'),
        id = ident(inp.value),
        btn = $('fp-send');
      if (id.type === 'empty') { hint(inp, 'আপনার ইমেইল ঠিকানা লিখুন', 1); return inp.focus(); }
      if (id.type === 'phone') {
        hint(inp, 'মোবাইল নম্বরের অ্যাকাউন্টে রিসেট লিংক পাঠানো যায় না — অ্যাকাউন্টে যুক্ত ইমেইলটা লিখুন', 1);
        return inp.focus();
      }
      if (id.type !== 'email') { hint(inp, id.error, 1); return inp.focus(); }
      var ct = tok('ts-login');
      if (!ct) { hint(inp, WAIT, 1); return; }
      btn.disabled = 1;
      btn.classList.add('loading');
      db.auth.resetPasswordForEmail(id.value, {
        redirectTo: location.origin + '/' + PD.pages.auth,
        captchaToken: ct
      }).then(function(r) {
        btn.disabled = 0;
        btn.classList.remove('loading');
        rs('ts-login');
        if (r.error) return hint(inp, msg(r.error), 1);
        $('fp-sent-text').textContent = id.value + ' ঠিকানায় পাসওয়ার্ড রিসেটের লিংক পাঠানো হয়েছে। ইনবক্সে না পেলে স্প্যাম ফোল্ডারটাও দেখুন।';
        step('sent')
      })
    });
    $('np-form').addEventListener('submit', function(ev) {
      ev.preventDefault();
      var p = $('np-pass').value,
        h = $('np-hint'),
        btn = $('np-save');
      if (p.length < 6) { h.textContent = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'; h.className = 'id-hint show bad'; return $('np-pass').focus(); }
      btn.disabled = 1;
      btn.classList.add('loading');
      db.auth.updateUser({ password: p }).then(function(r) {
        btn.disabled = 0;
        btn.classList.remove('loading');
        if (r.error) { h.textContent = msg(r.error); h.className = 'id-hint show bad'; return; }
        fpMode = 'done';
        closeFP();
        $('np-pass').value = '';
        toast('পাসওয়ার্ড বদলানো হয়েছে');
        if (history.replaceState) history.replaceState(null, '', location.pathname);
      })
    })
  }

  /* রিসেট লিংক থেকে ফিরে এলে: নতুন পাসওয়ার্ড নেওয়া */
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
