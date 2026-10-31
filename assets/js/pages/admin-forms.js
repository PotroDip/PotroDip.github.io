/* admin-forms.js — এডমিনের ফর্ম: লেখা, লেখক, সংখ্যা, প্রিন্ট সংখ্যা, ছবি/PDF আপলোড ও সেটিংস সংরক্ষণ */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI, A = window.AdminUI, C = window.AdminCore, S = window.AdminData;
  if (!PD || !PD.db || !A || !C) return;
  var db = PD.db, $ = function (i) { return document.getElementById(i); }, val = function (i) { return $(i).value.trim(); };
  var MAX_IMG = 5 * 1024 * 1024, MAX_PDF = 10 * 1024 * 1024;
  var DEL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  /* ---------- আপলোড (শুধু এডমিন; ধরন ও আকার যাচাই) ---------- */
  function upload(file, folder) {
    if (!file) return Promise.resolve(null);
    var img = /^image\/(jpeg|png|webp|gif)$/.test(file.type), pdf = file.type === 'application/pdf';
    if (!img && !pdf) return Promise.reject(new Error('শুধু ছবি (JPG, PNG, WebP, GIF) বা PDF দেওয়া যাবে'));
    if (img && file.size > MAX_IMG) return Promise.reject(new Error('ছবি ৫ MB-এর বেশি হওয়া চলবে না'));
    if (pdf && file.size > MAX_PDF) return Promise.reject(new Error('PDF ১০ MB-এর বেশি হওয়া চলবে না'));
    var ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf' })[file.type];
    var path = folder + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + '.' + ext;
    return PD.upload(file, path, file.type);
  }
  function fail(e) { A.showToast(PD.msg(e || {}, e && /^[^\u0980-\u09FF]*$/.test(String(e.message || '')) && /storage|bucket|upload|object|size|mime/i.test(String(e.message || '')) ? 'upload' : undefined)); }
  function busy(btn, on, label) { btn.disabled = on; if (label) btn.dataset.l = btn.dataset.l || btn.textContent; btn.textContent = on ? 'সংরক্ষণ হচ্ছে…' : (btn.dataset.l || btn.textContent); }
  function slug(p) { return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function pickFile(input, preview, labelSel, cb) {
    input.addEventListener('change', function () {
      var f = input.files[0]; if (!f) return;
      if (!/^image\//.test(f.type)) { A.showToast('শুধু ছবি দিন'); input.value = ''; return; }
      if (f.size > MAX_IMG) { A.showToast('ছবি ৫ MB-এর বেশি হওয়া চলবে না'); input.value = ''; return; }
      preview.src = URL.createObjectURL(f); preview.style.display = 'block';
      var sp = input.parentNode.querySelector('span'); if (sp) sp.style.display = 'none';
      cb(f);
    });
  }
  function setPreview(preview, url) {
    var sp = preview.parentNode.querySelector('span');
    if (url) { preview.src = url; preview.style.display = 'block'; if (sp) sp.style.display = 'none'; }
    else { preview.removeAttribute('src'); preview.style.display = 'none'; if (sp) sp.style.display = ''; }
  }

  /* ---------- লেখা ---------- */
  var art = { id: null, cover: null, newImgs: [], removed: [] }, gal = $('art-gallery-row'), galAdd = $('art-gallery-add');
  function thumb(url, id) {
    var t = document.createElement('div'); t.className = 'img-upload-thumb';
    var im = document.createElement('img'); im.src = url; im.alt = ''; t.appendChild(im);
    var rm = document.createElement('span'); rm.className = 'rm-btn'; rm.innerHTML = DEL_SVG; t.appendChild(rm);
    rm.addEventListener('click', function () { if (id) art.removed.push(id); else art.newImgs = art.newImgs.filter(function (f) { return f !== t._file; }); t.remove(); });
    gal.insertBefore(t, galAdd); return t;
  }
  pickFile($('art-cover-file'), $('art-cover-preview'), '', function (f) { art.cover = f; });
  galAdd.addEventListener('click', function () { $('art-gallery-file').click(); });
  $('art-gallery-file').addEventListener('change', function (e) {
    [].slice.call(e.target.files).forEach(function (f) {
      if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type) || f.size > MAX_IMG) { A.showToast('"' + f.name + '" বাদ: শুধু ৫ MB পর্যন্ত ছবি চলবে'); return; }
      var t = thumb(URL.createObjectURL(f), null); t._file = f; art.newImgs.push(f);
    });
    e.target.value = '';
  });
  function bodyToHtml(b) {
    if (UI.isHtml(b)) { var box = UI.sanitize(b); return box.innerHTML; }
    return String(b || '').split(/\n\s*\n/).map(function (p) { p = p.trim(); if (!p || /^\[\[.*\]\]$/.test(p)) return ''; var d = document.createElement(p.indexOf('> ') === 0 ? 'blockquote' : 'p'); d.textContent = p.replace(/^> /, ''); return d.outerHTML; }).join('');
  }
  function openArticle(id) {
    art = { id: id || null, cover: null, newImgs: [], removed: [] };
    var a = id ? C.byId(S.articles, id) : null;
    $('article-modal-title').textContent = a ? 'লেখা এডিট করুন' : 'নতুন লেখা প্রকাশ করুন';
    $('art-title').value = a ? a.title : '';
    $('art-body').innerHTML = a ? bodyToHtml(a.body) : '';
    $('art-author').innerHTML = S.authors.map(function (x) { var o = document.createElement('option'); o.value = x.id; o.textContent = x.name; return o.outerHTML; }).join('');
    $('art-issue').innerHTML = '<option value="">— কোনো সংখ্যায় নয় —</option>' + S.issues.map(function (x) { var o = document.createElement('option'); o.value = x.id; o.textContent = x.title; return o.outerHTML; }).join('');
    var cat = $('art-cat');
    if (a && a.category && ![].some.call(cat.options, function (o) { return o.value === a.category; })) { var o = document.createElement('option'); o.textContent = a.category; cat.appendChild(o); }
    if (a) { $('art-author').value = a.author_id || ''; $('art-issue').value = a.issue_id || ''; cat.value = a.category || cat.value; }
    $('art-published').checked = a ? a.status === 'published' : true;
    $('art-home-order').value = a && a.home_order != null ? a.home_order : ''; $('art-home-hidden').checked = !!(a && a.home_hidden); $('art-home-featured').checked = !!(a && a.home_featured);
    setPreview($('art-cover-preview'), a ? a.cover_url : null); $('art-cover-file').value = '';
    [].slice.call(gal.querySelectorAll('.img-upload-thumb')).forEach(function (t) { t.remove(); });
    if (a) db.from('article_images').select('id,image_url').eq('article_id', a.id).order('sort_order', { ascending: true }).then(function (r) { (r.data || []).forEach(function (g) { thumb(g.image_url, g.id); }); });
    A.openModal('article-modal');
  }
  $('art-save-btn').addEventListener('click', function () {
    var btn = this, title = val('art-title'), box = UI.sanitize($('art-body').innerHTML), text = (box.textContent || '').replace(/\s+/g, ' ').trim();
    if (!title) return A.showToast('শিরোনাম লিখুন');
    if (!text) return A.showToast('লেখার মূল অংশ লিখুন');
    if (!$('art-author').value) return A.showToast('লেখক বেছে নিন (আগে লেখক যোগ করুন)');
    busy(btn, true, 1);
    var old = art.id ? C.byId(S.articles, art.id) : null;
    var row = { title: title, body: box.innerHTML, excerpt: text.slice(0, 160), category: $('art-cat').value, author_id: $('art-author').value, issue_id: $('art-issue').value || null, home_order: (function (v) { v = parseInt(v, 10); return isNaN(v) || v < 1 ? null : v; })($('art-home-order').value), home_hidden: $('art-home-hidden').checked, home_featured: $('art-home-featured').checked, status: $('art-published').checked ? 'published' : 'draft' };
    if (row.status === 'published' && !(old && old.published_at)) row.published_at = new Date().toISOString();
    upload(art.cover, 'covers').then(function (url) {
      if (url) row.cover_url = url;
      if (!old) row.slug = slug('a');
      return old ? db.from('articles').update(row).eq('id', old.id).select('id').single() : db.from('articles').insert(row).select('id').single();
    }).then(function (r) {
      if (r.error) throw r.error;
      var aid = r.data.id, jobs = [];
      if (row.home_featured) jobs.push(db.from('articles').update({ home_featured: false }).eq('home_featured', true).neq('id', aid)); /* আগের শুরুর লেখাটা সরিয়ে দেওয়া */
      if (art.removed.length) jobs.push(db.from('article_images').delete().in('id', art.removed));
      art.newImgs.forEach(function (f, i) { jobs.push(upload(f, 'gallery').then(function (u) { return db.from('article_images').insert({ article_id: aid, image_url: u, caption: '', sort_order: i + 1 }); })); });
      return Promise.all(jobs);
    }).then(function () { busy(btn, false); A.closeModal('article-modal'); A.showToast(old ? 'লেখা হালনাগাদ হয়েছে' : (row.status === 'published' ? 'লেখা প্রকাশিত হয়েছে' : 'ড্রাফট সেভ হয়েছে')); C.refresh(); }).catch(function (e) { busy(btn, false); fail(e); });
  });
  document.querySelectorAll('[data-open-article]').forEach(function (b) { b.addEventListener('click', function () { openArticle(); }); });

  /* ---------- লেখক ---------- */
  var au = { id: null, img: null, bg: null };
  pickFile($('author-cover-file'), $('author-cover-preview'), '', function (f) { au.img = f; });
  pickFile($('author-bg-file'), $('author-bg-preview'), '', function (f) { au.bg = f; });
  function bioToText(s) { return (Array.isArray(s) ? s : []).map(function (x) { return x.quote ? '> ' + x.quote : (x.h ? '# ' + x.h + '\n\n' : '') + (x.p || ''); }).join('\n\n'); }
  function textToBio(t) {
    var out = [], h = '';
    String(t || '').split(/\n\s*\n/).map(function (b) { return b.trim(); }).filter(Boolean).forEach(function (b) {
      if (b.indexOf('# ') === 0) h = b.slice(2); else if (b.indexOf('> ') === 0) out.push({ quote: b.slice(2) }); else { out.push({ h: h, p: b }); h = ''; }
    });
    return out;
  }
  var AF = { 'author-name': 'name', 'author-role': 'role_title', 'author-city': 'city', 'author-fb': 'facebook_url', 'author-ig': 'instagram_url', 'author-website': 'website_url', 'author-fullname': 'full_name', 'author-father': 'father_name', 'author-birth': 'birth_date', 'author-address': 'current_address', 'author-edu': 'education', 'author-prof': 'profession', 'author-years': 'years_writing', 'author-recog': 'recognition' };
  function openAuthor(id) {
    au = { id: id || null, img: null, bg: null };
    var a = id ? C.byId(S.authors, id) : null;
    $('author-modal-title').textContent = a ? 'লেখক এডিট করুন' : 'নতুন লেখক যোগ করুন';
    Object.keys(AF).forEach(function (k) { $(k).value = a && a[AF[k]] ? a[AF[k]] : ''; });
    $('author-bio').value = a ? bioToText(a.bio_sections) : '';
    setPreview($('author-cover-preview'), a ? a.image_url : null); setPreview($('author-bg-preview'), a ? a.cover_url : null);
    $('author-cover-file').value = ''; $('author-bg-file').value = '';
    A.openModal('author-modal');
  }
  $('author-save-btn').addEventListener('click', function () {
    var btn = this, row = {};
    if (!val('author-name')) return A.showToast('লেখকের নাম লিখুন');
    for (var k in AF) { var v = val(k); row[AF[k]] = v || null; }
    row.name = val('author-name');
    var bad = ['facebook_url', 'instagram_url', 'website_url'].filter(function (f) { return row[f] && !/^https?:\/\//i.test(row[f]); })[0];
    if (bad) return A.showToast('লিংক https:// দিয়ে শুরু হতে হবে');
    row.bio_sections = textToBio($('author-bio').value);
    busy(btn, true, 1);
    Promise.all([upload(au.img, 'authors'), upload(au.bg, 'authors')]).then(function (u) {
      if (u[0]) row.image_url = u[0]; if (u[1]) row.cover_url = u[1];
      if (!au.id) row.slug = slug('w');
      return au.id ? db.from('authors').update(row).eq('id', au.id) : db.from('authors').insert(row);
    }).then(function (r) { if (r.error) throw r.error; busy(btn, false); A.closeModal('author-modal'); A.showToast(au.id ? 'লেখক হালনাগাদ হয়েছে' : 'লেখক যোগ হয়েছে'); C.refresh(); }).catch(function (e) { busy(btn, false); fail(e); });
  });
  document.querySelectorAll('[data-open-author]').forEach(function (b) { b.addEventListener('click', function () { openAuthor(); }); });

  /* ---------- আর্কাইভ সংখ্যা ---------- */
  var ar = { id: null, cover: null };
  pickFile($('issue-archive-cover-file'), $('issue-archive-cover-preview'), '', function (f) { ar.cover = f; });
  function openArchive(id) {
    ar = { id: id || null, cover: null };
    var i = id ? C.byId(S.issues, id) : null;
    $('issue-archive-modal-title').textContent = i ? 'সংখ্যা এডিট করুন' : 'নতুন সংখ্যা তৈরি করুন';
    $('issue-archive-name').value = i ? i.title : ''; $('issue-archive-number').value = i ? (i.issue_number || '') : '';
    setPreview($('issue-archive-cover-preview'), i ? i.cover_url : null); $('issue-archive-cover-file').value = '';
    A.openModal('issue-archive-modal');
  }
  $('issue-archive-save-btn').addEventListener('click', function () {
    var btn = this, t = val('issue-archive-name'), n = val('issue-archive-number');
    if (!t) return A.showToast('সংখ্যার নাম লিখুন'); if (!n) return A.showToast('সংখ্যা নম্বর লিখুন');
    busy(btn, true, 1);
    var old = ar.id ? C.byId(S.issues, ar.id) : null, row = { title: t, issue_number: n };
    upload(ar.cover, 'issues').then(function (u) {
      if (u) row.cover_url = u;
      if (!old) { row.slug = slug('issue'); row.published_at = new Date().toISOString().slice(0, 10); }
      return old ? db.from('issues').update(row).eq('id', old.id) : db.from('issues').insert(row);
    }).then(function (r) { if (r.error) throw r.error; busy(btn, false); A.closeModal('issue-archive-modal'); A.showToast(old ? 'সংখ্যা হালনাগাদ হয়েছে' : 'সংখ্যা তৈরি হয়েছে'); C.refresh(); }).catch(function (e) { busy(btn, false); fail(e); });
  });
  document.querySelectorAll('[data-open-issue-archive]').forEach(function (b) { b.addEventListener('click', function () { openArchive(); }); });

  /* ---------- প্রিন্ট সংখ্যা (স্টোর) ---------- */
  var pr = { id: null, cover: null, pdf: null, clearPdf: false };
  pickFile($('cover-file'), $('cover-preview'), '', function (f) { pr.cover = f; });
  function showPdf(name) {
    var box = $('issue-pdf-box'); box.classList.toggle('has-file', !!name);
    $('issue-pdf-empty').style.display = name ? 'none' : ''; $('issue-pdf-filled').style.display = name ? 'flex' : 'none'; $('issue-pdf-name').textContent = name || '';
  }
  $('issue-pdf-file').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    if (f.type !== 'application/pdf' || f.size > MAX_PDF) { A.showToast('শুধু ১০ MB পর্যন্ত PDF দিন'); this.value = ''; return; }
    pr.pdf = f; pr.clearPdf = false; showPdf(f.name);
  });
  $('issue-pdf-box').addEventListener('click', function () { $('issue-pdf-file').click(); });
  $('issue-pdf-remove').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); pr.pdf = null; pr.clearPdf = true; $('issue-pdf-file').value = ''; showPdf(''); });
  function openPrint(id) {
    pr = { id: id || null, cover: null, pdf: null, clearPdf: false };
    var p = id ? C.byId(S.prints, id) : null, iss = p && p.issue_id ? C.byId(S.issues, p.issue_id) : null;
    $('modal-title').textContent = p ? 'সংখ্যা এডিট করুন' : 'নতুন সংখ্যা যোগ করুন';
    $('issue-name').value = p ? p.title : ''; $('issue-teaser').value = p ? (p.teaser || '') : ''; $('issue-price').value = p ? p.price : '';
    $('issue-number').value = iss ? (iss.issue_number || '') : ''; $('issue-stock').checked = p ? !!p.in_stock : true;
    setPreview($('cover-preview'), p ? p.cover_url : null); $('cover-file').value = ''; $('issue-pdf-file').value = '';
    showPdf(p && p.preview_pdf_url ? 'নমুনা PDF যুক্ত আছে' : '');
    A.openModal('issue-modal');
  }
  $('modal-save').addEventListener('click', function () {
    var btn = this, t = val('issue-name'), price = parseInt($('issue-price').value, 10);
    if (!t) return A.showToast('সংখ্যার নাম লিখুন');
    if (isNaN(price) || price < 0 || price > 100000) return A.showToast('দাম সঠিকভাবে লিখুন');
    busy(btn, true, 1);
    var old = pr.id ? C.byId(S.prints, pr.id) : null, num = val('issue-number');
    var en = function (x) { return String(x == null ? '' : x).trim().replace(/[০-৯]/g, function (d) { return '০১২৩৪৫৬৭৮৯'.indexOf(d); }); };
    var link = num ? S.issues.filter(function (i) { return en(i.issue_number) === en(num); })[0] : null;
    var row = { title: t, teaser: $('issue-teaser').value.trim(), price: price, in_stock: $('issue-stock').checked, issue_id: link ? link.id : null };
    if (pr.clearPdf) row.preview_pdf_url = null;
    Promise.all([upload(pr.cover, 'issues'), upload(pr.pdf, 'previews')]).then(function (u) {
      if (u[0]) row.cover_url = u[0]; if (u[1]) row.preview_pdf_url = u[1];
      if (!old) row.sort_order = S.prints.reduce(function (m, p) { return Math.max(m, p.sort_order || 0); }, 0) + 1;
      return old ? db.from('print_issues').update(row).eq('id', old.id) : db.from('print_issues').insert(row);
    }).then(function (r) { if (r.error) throw r.error; busy(btn, false); A.closeModal('issue-modal'); A.showToast(old ? 'সংখ্যা হালনাগাদ হয়েছে' : 'সংখ্যা যোগ হয়েছে'); C.refresh(); }).catch(function (e) { busy(btn, false); fail(e); });
  });

  /* ---------- সেটিংস: ডেলিভারি, পেমেন্ট, যোগাযোগ ---------- */
  function fillSettings() {
    var d = S.set.delivery || {}, p = S.set.payment || {}, c = S.set.contact || {};
    var map = { 'dhaka-normal': d.in_normal, 'dhaka-bulk': d.in_bulk, 'outside-normal': d.out_normal, 'outside-bulk': d.out_bulk, 'bulk-threshold': d.bulk_min, 'pay-bkash': p.bkash, 'pay-nagad': p.nagad, 'pay-rocket': p.rocket, 'contact-phone': c.phone, 'contact-fb': c.facebook, 'contact-ig': c.instagram };
    Object.keys(map).forEach(function (k) { $(k).value = map[k] == null ? '' : map[k]; });
  }
  function saveSetting(key, value, msg) {
    var old = S.set[key] || {};
    return db.from('site_settings').upsert({ key: key, value: Object.assign({}, old, value), updated_at: new Date().toISOString() }, { onConflict: 'key' }).then(function (r) { if (C.ok(r)) { A.showToast(msg); C.refresh(); } });
  }
  $('save-delivery').addEventListener('click', function () {
    var ids = ['dhaka-normal', 'dhaka-bulk', 'outside-normal', 'outside-bulk', 'bulk-threshold'], v = ids.map(function (i) { return parseInt($(i).value, 10); });
    if (v.some(function (n) { return isNaN(n) || n < 0 || n > 10000; }) || v[4] < 1) return A.showToast('সংখ্যাগুলো সঠিকভাবে লিখুন (০–১০০০০, বাল্ক সীমা কমপক্ষে ১)');
    saveSetting('delivery', { in_normal: v[0], in_bulk: v[1], out_normal: v[2], out_bulk: v[3], bulk_min: v[4] }, 'ডেলিভারি চার্জ সংরক্ষণ হয়েছে');
  });
  function phone(i) { var v = val(i); return !v || /^[0-9+\s-]{6,20}$/.test(v) ? v : null; }
  $('save-payment').addEventListener('click', function () {
    var b = phone('pay-bkash'), n = phone('pay-nagad'), r = phone('pay-rocket');
    if (b === null || n === null || r === null) return A.showToast('নাম্বারে শুধু অঙ্ক (০–৯), + ও - চলবে');
    saveSetting('payment', { bkash: b, nagad: n, rocket: r }, 'পেমেন্ট নাম্বার সংরক্ষণ হয়েছে');
  });
  $('save-contact').addEventListener('click', function () {
    var p = phone('contact-phone'), fb = val('contact-fb'), ig = val('contact-ig');
    if (p === null) return A.showToast('মোবাইল নাম্বার সঠিক নয়');
    if ((fb && !/^https?:\/\//i.test(fb)) || (ig && !/^https?:\/\//i.test(ig))) return A.showToast('সোশ্যাল লিংক https:// দিয়ে শুরু হতে হবে');
    saveSetting('contact', { phone: p, facebook: fb, instagram: ig }, 'যোগাযোগ তথ্য সংরক্ষণ হয়েছে');
  });

  window.AdminForms = { upload: upload, openArticle: openArticle, openAuthor: openAuthor, openArchive: openArchive, openPrint: openPrint, fillSettings: fillSettings };
})();
