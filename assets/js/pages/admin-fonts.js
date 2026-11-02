/* admin-fonts.js — ফন্ট ম্যানেজার (v82): কম্পিউটার/মোবাইল থেকে ফন্ট যোগ, তালিকা ও মোছা
   এডিটরের ফন্ট মেনু এবং শিরোনামের ফন্ট বাছাই — দুই জায়গা থেকেই খোলে (window.PDFontManager.open()) */
(function () {
  'use strict';
  var F = window.PDFonts; if (!F) return;
  var doc = document, ov = null, listEl = null, nameIn = null, fileIn = null, addBtn = null, note = null, busy = false, picked = null;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }
  function toast(m) { try { if (window.AdminUI && window.AdminUI.showToast) return window.AdminUI.showToast(m); if (window.PD && window.PD.toast) return window.PD.toast(m, 1); } catch (e) {} alert(m); }
  function kb(n) { return n > 1048576 ? bn((n / 1048576).toFixed(1)) + ' MB' : bn(Math.max(1, Math.round(n / 1024))) + ' KB'; }
  var SAMPLE = 'আমার সোনার বাংলা, আমি তোমায় ভালোবাসি — Aa Bb 123';

  function build() {
    ov = doc.createElement('div'); ov.className = 'pdf-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'ফন্ট ম্যানেজার');
    ov.innerHTML =
      '<div class="pdf-box">' +
      '<div class="pdf-head"><div><h3>ফন্ট ম্যানেজার</h3><p>নিজের ফন্ট যোগ করুন — লেখা ও শিরোনামে ব্যবহার করা যাবে</p></div><button type="button" class="pdf-x" data-pdf-close aria-label="বন্ধ করুন">&times;</button></div>' +
      '<div class="pdf-body">' +
      '<div class="pdf-add">' +
      '<label class="pdf-pick" id="pdf-pick"><input type="file" id="pdf-file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2,application/font-woff,application/x-font-ttf,application/octet-stream"><span id="pdf-pick-t">＋ ফন্ট ফাইল বেছে নিন <small>(.ttf .otf .woff .woff2 — সর্বোচ্চ ৮ MB)</small></span></label>' +
      '<div class="pdf-row"><input type="text" id="pdf-name" maxlength="60" placeholder="ফন্টের নাম (যেমন: আমার হাতের লেখা)" autocomplete="off"><button type="button" class="pdf-go" id="pdf-go" disabled>যোগ করুন</button></div>' +
      '<div class="pdf-note" id="pdf-note"></div>' +
      '</div>' +
      '<div class="pdf-sec">আপনার ফন্ট</div>' +
      '<div class="pdf-list" id="pdf-list"></div>' +
      '</div></div>';
    doc.body.appendChild(ov);
    listEl = ov.querySelector('#pdf-list'); nameIn = ov.querySelector('#pdf-name'); fileIn = ov.querySelector('#pdf-file'); addBtn = ov.querySelector('#pdf-go'); note = ov.querySelector('#pdf-note');

    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    ov.addEventListener('click', function (e) {
      if (e.target.closest('[data-pdf-close]')) { close(); return; }
      var d = e.target.closest('[data-pdf-del]'); if (d) del(d.getAttribute('data-pdf-del'));
    });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov && ov.classList.contains('open')) { e.stopPropagation(); e.stopImmediatePropagation(); close(); } }, true);
    fileIn.addEventListener('change', function () {
      picked = fileIn.files && fileIn.files[0] || null;
      ov.querySelector('#pdf-pick-t').innerHTML = picked ? '✔ ' + esc(picked.name) + ' <small>(' + kb(picked.size) + ')</small>' : '＋ ফন্ট ফাইল বেছে নিন <small>(.ttf .otf .woff .woff2 — সর্বোচ্চ ৮ MB)</small>';
      if (picked && !nameIn.value.trim()) nameIn.value = picked.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').slice(0, 60);
      addBtn.disabled = !picked;
    });
    nameIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    addBtn.addEventListener('click', add);
    F.onChange(function () { if (ov && ov.classList.contains('open')) draw(); });
  }

  function draw() {
    var rows = F.list(), h = '';
    h += '<div class="pdf-item is-def"><div class="pdf-meta"><b>নোটো সেরিফ বাংলা</b><span class="pdf-tag">ডিফল্ট</span><i class="pdf-lock" title="ডিফল্ট ফন্ট মোছা যায় না">🔒 মোছা যাবে না</i></div><div class="pdf-sample" style="font-family:' + esc(F.FALLBACK) + '">' + SAMPLE + '</div></div>';
    if (F.isMissing()) h += '<div class="pdf-empty warn">ফন্ট টেবিল এখনো তৈরি হয়নি। প্রজেক্টের <code>supabase/migrations/20261105_custom_fonts.sql</code> ফাইলটা একবার Supabase → SQL Editor-এ চালান।</div>';
    else if (!rows.length) h += '<div class="pdf-empty">এখনো নিজের কোনো ফন্ট যোগ করা হয়নি।</div>';
    rows.forEach(function (r) {
      h += '<div class="pdf-item"><div class="pdf-meta"><b>' + esc(r.name) + '</b><span class="pdf-sz">' + (r.size_bytes ? kb(r.size_bytes) : '') + '</span><button type="button" class="pdf-del" data-pdf-del="' + esc(r.id) + '" title="এই ফন্ট মুছুন">মুছুন</button></div>' +
        '<div class="pdf-sample" style="font-family:\'' + esc(r.family) + '\', ' + esc(F.FALLBACK) + '">' + SAMPLE + '</div></div>';
    });
    listEl.innerHTML = h;
  }

  function add() {
    if (busy || !picked) return;
    busy = true; addBtn.disabled = true; addBtn.textContent = 'যোগ হচ্ছে…'; note.textContent = '';
    F.add(picked, nameIn.value).then(function (row) {
      toast('ফন্ট যোগ হয়েছে: ' + row.name);
      picked = null; fileIn.value = ''; nameIn.value = '';
      ov.querySelector('#pdf-pick-t').innerHTML = '＋ ফন্ট ফাইল বেছে নিন <small>(.ttf .otf .woff .woff2 — সর্বোচ্চ ৮ MB)</small>';
      draw();
    }, function (e) { note.textContent = F.msg(e); }).then(function () { busy = false; addBtn.textContent = 'যোগ করুন'; addBtn.disabled = !picked; });
  }
  function del(id) {
    var row = F.list().filter(function (r) { return r.id === id; })[0]; if (!row) return;
    if (!window.confirm('"' + row.name + '" ফন্টটি মুছবেন?\n\nযেসব লেখায় এই ফন্ট ব্যবহার হয়েছে সেখানে সাধারণ ফন্ট দেখাবে।')) return;
    F.remove(row).then(function () { toast('ফন্ট মুছে ফেলা হয়েছে'); draw(); }, function (e) { toast(F.msg(e)); });
  }

  function open() {
    if (!ov) build();
    note.textContent = ''; ov.classList.add('open'); draw();
    F.load(true).then(draw);
    setTimeout(function () { var p = ov.querySelector('.pdf-pick'); if (p) p.focus && p.focus(); }, 30);
  }
  function close() { if (ov) ov.classList.remove('open'); }
  window.PDFontManager = { open: open, close: close };
})();
