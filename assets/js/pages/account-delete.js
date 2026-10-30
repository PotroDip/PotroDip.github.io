/* account-delete.js — "অ্যাকাউন্ট মুছুন": নিশ্চিতকরণ পপআপ, তারপর delete_my_account() RPC, সাইন-আউট, হোমে পাঠানো */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI;
  if (!PD || !PD.db) return;
  var db = PD.db, $ = function (id) { return document.getElementById(id); };
  var WORD = 'মুছুন', busy = false, lastFocus = null;

  function open() {
    if (!PD.user) return;
    lastFocus = document.activeElement;
    $('del-input').value = ''; $('del-err').textContent = ''; $('del-ok').disabled = true;
    $('del-scrim').classList.add('open'); $('del-scrim').setAttribute('aria-hidden', 'false');
    document.body.classList.add('pe-lock');
    setTimeout(function () { $('del-input').focus(); }, 60);
  }
  function close() {
    if (busy) return;
    $('del-scrim').classList.remove('open'); $('del-scrim').setAttribute('aria-hidden', 'true');
    if (!$('pe-scrim').classList.contains('open')) document.body.classList.remove('pe-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function matches() { return $('del-input').value.trim() === WORD; }

  $('btn-delete-account').addEventListener('click', open);
  var m=$('btn-delete-account-m'); if(m) m.addEventListener('click', open);
  $('del-close').addEventListener('click', close);
  $('del-cancel').addEventListener('click', close);
  $('del-scrim').addEventListener('mousedown', function (e) { if (e.target === this) close(); });
  $('del-input').addEventListener('input', function () { $('del-ok').disabled = !matches(); $('del-err').textContent = ''; });
  $('del-input').addEventListener('keydown', function (e) { if (e.key === 'Enter' && matches()) { e.preventDefault(); $('del-ok').click(); } });
  document.addEventListener('keydown', function (e) {
    if (!$('del-scrim').classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  });

  $('del-ok').addEventListener('click', function () {
    if (busy) return;
    if (!matches()) { $('del-err').textContent = 'নিশ্চিত করতে "' + WORD + '" লিখুন'; return; }
    busy = true;
    var btn = $('del-ok'); btn.disabled = true; btn.textContent = 'মুছে ফেলা হচ্ছে…';
    db.rpc('delete_my_account').then(function (r) {
      if (r.error) throw r.error;
      return db.auth.signOut();
    }).then(function () {
      busy = false;
      UI.toast('আপনার অ্যাকাউন্ট মুছে ফেলা হয়েছে');
      setTimeout(function () { location.href = 'index.html'; }, 900);
    }).catch(function (err) {
      busy = false; btn.disabled = false; btn.textContent = 'অ্যাকাউন্ট মুছুন';
      var m = String((err && err.message) || '');
      if (/function .*delete_my_account|Could not find the function/i.test(m)) UI.toast('ডেটাবেসে delete_my_account ফাংশন নেই — DESIGN-STUDIO.md-এর নির্দেশনা দেখুন', 1);
      else $('del-err').textContent = 'মুছতে সমস্যা হয়েছে: ' + (PD.msg(err || {}).replace(/^সমস্যা: /, ''));
    });
  });
})();
