/* profile-edit.js — ড্যাশবোর্ডের "প্রোফাইল এডিট" পপআপ: নাম, মোবাইল, ইমেইল, ঠিকানা, ছবি।
   সেভ হলে document-এ 'pd:profile' ইভেন্ট যায়, ড্যাশবোর্ড সেটা শুনে নিজেকে হালনাগাদ করে। */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI;
  if (!PD || !PD.db) return;
  var db = PD.db, $ = function (id) { return document.getElementById(id); };
  var BN = '০১২৩৪৫৬৭৮৯';
  var busy = false, file = null, photo = undefined, previewUrl = null, lastFocus = null;

  function toEn(s) { return String(s || '').replace(/[০-৯]/g, function (d) { return String(BN.indexOf(d)); }); }
  function normPhone(s) {
    var v = toEn(s).replace(/[\s\-()]/g, '');
    if (!v) return '';
    var m = v.match(/^(?:\+?880|0)?(1[3-9]\d{8})$/);
    return m ? '0' + m[1] : null;
  }
  function setErr(id, msg) {
    var f = $(id), e = $('pe-err-' + id.replace('pe-', ''));
    if (f && f.closest) f.closest('.pe-field').classList.toggle('bad', !!msg);
    if (e) e.textContent = msg || '';
  }
  function clearErrs() {
    ['pe-name', 'pe-phone', 'pe-email', 'pe-address'].forEach(function (i) { setErr(i, ''); });
  }

  /* ---------- ছবি: যেকোনো সাইজ/পিক্সেল → ৫১২×৫১২ বৃত্তাকার-উপযোগী বর্গ, ৮০০ KB-এর মধ্যে ---------- */
  var SIZE = 512, MAX_BYTES = 800 * 1024;
  function encode(canvas, q) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) { resolve(b); }, 'image/webp', q);
    });
  }
  function shrink(f) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), u = URL.createObjectURL(f);
      img.onload = function () {
        URL.revokeObjectURL(u);
        var side = Math.min(img.naturalWidth, img.naturalHeight);
        var c = document.createElement('canvas');
        c.width = c.height = SIZE;
        var ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
        var q = 0.92;
        (function attempt() {
          encode(c, q).then(function (b) {
            if (!b) return reject(new Error('এই ছবি প্রসেস করা যাচ্ছে না'));
            if (b.size <= MAX_BYTES || q <= 0.5) return resolve(b);
            q = Math.round((q - 0.08) * 100) / 100;
            attempt();
          });
        })();
      };
      img.onerror = function () { URL.revokeObjectURL(u); reject(new Error('এই ছবির ফরম্যাট সাপোর্ট করা যাচ্ছে না — JPG বা PNG দিন')); };
      img.src = u;
    });
  }
  function uploadAvatar(blob) {
    var path = 'avatars/' + PD.user.id + '/' + Date.now().toString(36) + '.webp';
    return PD.upload(blob, path, blob.type || 'image/webp');
  }
  function setPreview(src) { $('pe-avatar').src = src; }

  /* ---------- খোলা / বন্ধ ---------- */
  function fill() {
    var P = PD.profile || {};
    $('pe-name').value = P.full_name || '';
    $('pe-phone').value = P.phone || '';
    $('pe-address').value = P.address || '';
    $('pe-email').value = PD.user.email || '';
    $('pe-email').readOnly = !!PD.fbOn;
    $('pe-count').textContent = UI.bn(($('pe-address').value || '').length);
    file = null; photo = undefined;
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    setPreview(UI.avatar(P.avatar_url));
    $('pe-remove-photo').style.display = P.avatar_url ? '' : 'none';
    $('pe-email-note').textContent = PD.fbOn ? 'লগইনের ইমেইল এখান থেকে বদলানো যায় না।' : 'ইমেইল বদলালে নতুন ঠিকানায় নিশ্চিতকরণ লিংক যাবে।';
    $('pe-file').value = '';
    clearErrs();
  }
  function open() {
    if (!PD.user) return;
    lastFocus = document.activeElement;
    fill();
    $('pe-scrim').classList.add('open');
    $('pe-scrim').setAttribute('aria-hidden', 'false');
    document.body.classList.add('pe-lock');
    setTimeout(function () { $('pe-name').focus(); }, 60);
  }
  function close() {
    if (busy) return;
    $('pe-scrim').classList.remove('open');
    $('pe-scrim').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pe-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- বাটন ও ইনপুট ---------- */
  $('pe-file').addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    if (!/^image\//i.test(f.type)) { UI.toast('শুধু ছবির ফাইল দিন', 1); this.value = ''; return; }
    file = f; photo = undefined;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(f);
    setPreview(previewUrl);
    $('pe-remove-photo').style.display = '';
  });
  $('pe-remove-photo').addEventListener('click', function () {
    file = null; photo = null; $('pe-file').value = '';
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    setPreview(UI.avatar(null));
    this.style.display = 'none';
  });
  $('pe-address').addEventListener('input', function () { $('pe-count').textContent = UI.bn(this.value.length); });
  $('pe-phone').addEventListener('input', function () { this.value = toEn(this.value).replace(/[^0-9+]/g, ''); });
  ['pe-name', 'pe-phone', 'pe-email', 'pe-address'].forEach(function (i) {
    $(i).addEventListener('input', function () { setErr(i, ''); });
  });
  $('pe-close').addEventListener('click', close);
  $('pe-cancel').addEventListener('click', close);
  $('pe-scrim').addEventListener('mousedown', function (e) { if (e.target === this) close(); });
  document.addEventListener('keydown', function (e) {
    if (!$('pe-scrim').classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      var f = [].filter.call($('pe-modal').querySelectorAll('button,input,textarea,label[for]'), function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- সেভ ---------- */
  $('pe-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    clearErrs();
    var name = $('pe-name').value.trim(), addr = $('pe-address').value.trim(), email = $('pe-email').value.trim();
    var phone = normPhone($('pe-phone').value), ok = true;
    if (!name || name.length > 60) { setErr('pe-name', 'নাম ১ থেকে ৬০ অক্ষরের মধ্যে লিখুন'); ok = false; }
    if (phone === null) { setErr('pe-phone', 'সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)'); ok = false; }
    if (addr && addr.length < 5) { setErr('pe-address', 'ঠিকানাটি একটু বিস্তারিত লিখুন'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('pe-email', 'সঠিক ইমেইল ঠিকানা দিন'); ok = false; }
    if (!ok) { var bad = $('pe-modal').querySelector('.pe-field.bad input,.pe-field.bad textarea'); if (bad) bad.focus(); return; }

    var emailChanged = !PD.fbOn && email.toLowerCase() !== String(PD.user.email || '').toLowerCase();
    var btn = $('pe-save'); busy = true; btn.disabled = true; btn.textContent = 'সংরক্ষণ হচ্ছে…';
    var P = PD.profile || {};
    var avatarP = file ? shrink(file).then(uploadAvatar) : Promise.resolve(photo === undefined ? P.avatar_url : photo);

    avatarP.then(function (avatarUrl) {
      var row = { full_name: name, phone: phone || null, address: addr || null, avatar_url: avatarUrl || null };
      return db.from('profiles').update(row).eq('id', PD.user.id).then(function (r) {
        if (r.error) throw r.error;
        PD.profile = Object.assign({}, P, row);
        if (P.avatar_url && P.avatar_url !== row.avatar_url) PD.removeFile(P.avatar_url);
        return emailChanged ? db.auth.updateUser({ email: email }).then(function (er) { if (er.error) throw er.error; return true; }) : false;
      });
    }).then(function (sentMail) {
      document.dispatchEvent(new CustomEvent('pd:profile'));
      busy = false; btn.disabled = false; btn.textContent = 'সংরক্ষণ করুন';
      $('pe-scrim').classList.remove('open'); document.body.classList.remove('pe-lock');
      UI.toast(sentMail ? 'প্রোফাইল সংরক্ষিত — নতুন ইমেইলে নিশ্চিতকরণ লিংক পাঠানো হয়েছে' : 'প্রোফাইল সংরক্ষিত হয়েছে');
    }).catch(function (err) {
      busy = false; btn.disabled = false; btn.textContent = 'সংরক্ষণ করুন';
      var m = String((err && err.message) || '');
      if (/already (registered|exists)|duplicate/i.test(m)) setErr('pe-email', 'এই ইমেইল অন্য অ্যাকাউন্টে ব্যবহৃত হচ্ছে');
      else if (file && /bucket|storage|policy|object|payload|size|mime|row-level/i.test(m)) UI.toast(PD.uploadMsg(err), 1);
      else UI.toast(PD.msg(err || {}), 1);
    });
  });

  window.PDProfile = { open: open, close: close };
})();
