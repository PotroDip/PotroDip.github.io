/* auth-action.js — ইমেইলের লিংকে ক্লিক করলে যে পাতা খোলে (action.html):
   ইমেইল যাচাই · পাসওয়ার্ড রিসেট · ইমেইল-বদল ফেরানো।
   লিংকের ঠিকানা potrodip.github.io-তেই থাকে, পাতা বাংলায় ও সাইটের ডিজাইনে। */
(function() {
  'use strict';
  var C = window.PD_CONFIG || {};
  var $ = function(i) { return document.getElementById(i) };
  var q = new URLSearchParams(location.search);
  var mode = q.get('mode') || '',
    code = q.get('oobCode') || '';

  function show(id) {
    ['loading', 'verified', 'reset', 'done', 'error'].forEach(function(k) {
      var e = $('act-' + k);
      if (e) e.hidden = k !== id
    })
  }

  function fail(title, text) {
    $('act-error-title').textContent = title || 'লিংকটি কাজ করছে না';
    $('act-error-text').textContent = text || 'লিংকটির মেয়াদ শেষ হয়ে গেছে বা আগেই ব্যবহার করা হয়েছে।';
    show('error')
  }

  function friendly(err) {
    var c = (err && err.code) || '';
    if (/expired-action-code/.test(c)) return ['লিংকের মেয়াদ শেষ', 'এই লিংকের মেয়াদ শেষ হয়ে গেছে। লগইন পাতা থেকে নতুন লিংক চেয়ে নিন।'];
    if (/invalid-action-code/.test(c)) return ['লিংকটি কাজ করছে না', 'লিংকটি আগেই ব্যবহার করা হয়েছে বা সঠিক নয়। ইমেইলের সবশেষ লিংকটি ব্যবহার করে দেখুন।'];
    if (/user-disabled/.test(c)) return ['অ্যাকাউন্ট বন্ধ', 'এই অ্যাকাউন্টটি বন্ধ করা আছে।'];
    if (/network-request-failed/.test(c)) return ['ইন্টারনেট সংযোগ নেই', 'সংযোগ দেখে পেজটি আবার খুলুন।'];
    if (/weak-password/.test(c)) return ['', 'পাসওয়ার্ড আরও বড় ও শক্ত দিন'];
    return ['কাজটি সম্পন্ন হয়নি', 'একটু পরে আবার চেষ্টা করুন।']
  }

  if (!window.firebase || !firebase.initializeApp || !C.firebase || !C.firebase.apiKey || !mode || !code) {
    return fail('লিংকটি সঠিক নয়', 'ইমেইলে পাঠানো পুরো লিংকে ক্লিক করুন। না হলে লগইন পাতা থেকে নতুন লিংক চেয়ে নিন।');
  }

  var app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(C.firebase);
  var auth = app.auth();

  /* চোখ-বাটন */
  var eye = $('act-eye');
  if (eye) eye.addEventListener('click', function() {
    var p = $('act-pass'),
      on = p.type === 'password';
    p.type = on ? 'text' : 'password';
    eye.classList.toggle('showing', on)
  });

  if (mode === 'verifyEmail') {
    auth.applyActionCode(code).then(function() {
      show('verified')
    }).catch(function(err) {
      /* একই লিংকে দুবার ক্লিক করলে — আগেই যাচাই হয়ে থাকতে পারে */
      var f = friendly(err);
      fail(f[0], f[1])
    })
  } else if (mode === 'resetPassword') {
    auth.verifyPasswordResetCode(code).then(function(email) {
      $('act-reset-for').textContent = email + ' অ্যাকাউন্টের জন্য কমপক্ষে ৬ অক্ষরের একটা নতুন পাসওয়ার্ড বেছে নিন।';
      show('reset');
      setTimeout(function() { $('act-pass').focus() }, 120)
    }).catch(function(err) {
      var f = friendly(err);
      fail(f[0], f[1])
    });
    $('act-form').addEventListener('submit', function(ev) {
      ev.preventDefault();
      var p = $('act-pass').value,
        h = $('act-hint'),
        b = $('act-save');
      if (p.length < 6) {
        h.textContent = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
        h.className = 'id-hint show bad';
        return $('act-pass').focus()
      }
      b.disabled = true;
      b.classList.add('loading');
      auth.confirmPasswordReset(code, p).then(function() {
        show('done')
      }).catch(function(err) {
        b.disabled = false;
        b.classList.remove('loading');
        var f = friendly(err);
        if (/expired|invalid-action/.test((err && err.code) || '')) return fail(f[0], f[1]);
        h.textContent = f[1];
        h.className = 'id-hint show bad'
      })
    })
  } else if (mode === 'recoverEmail') {
    auth.applyActionCode(code).then(function() {
      $('act-verified-text').textContent = 'আপনার আগের ইমেইল ঠিকানা ফিরিয়ে আনা হয়েছে।';
      $('act-verified').querySelector('h2').textContent = 'ইমেইল ফিরিয়ে আনা হয়েছে';
      show('verified')
    }).catch(function(err) {
      var f = friendly(err);
      fail(f[0], f[1])
    })
  } else {
    fail('লিংকটি সঠিক নয়', 'ইমেইলে পাঠানো পুরো লিংকে ক্লিক করুন।')
  }
})();
