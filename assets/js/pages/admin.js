/* admin.js — এডমিন প্যানেল: ডেটা লোড ও সব তালিকা/কার্ড (ড্যাশবোর্ড, লেখা, লেখক, সংখ্যা, অর্ডার, বিজ্ঞাপন, মন্তব্য, নিউজলেটার, অ্যানালিটিক্স) */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI, A = window.AdminUI, $ = function (i) { return document.getElementById(i); };
  var app = document.querySelector('.app');

  /* ---------- ছোট সহায়ক: ডেটাবেসের লেখা HTML-এ বসানোর আগে escape ---------- */
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function raw(s) { return { __raw: s }; }
  function H(strs) {
    var out = strs[0];
    for (var i = 1; i < arguments.length; i++) { var v = arguments[i]; out += (v && v.__raw !== undefined ? v.__raw : esc(v)) + strs[i]; }
    return out;
  }
  var SVGA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';
  var ICON = {
    edit: SVGA + '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    del: SVGA + '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    check: SVGA + '<polyline points="20 6 9 17 4 12"/></svg>',
    plus: SVGA + '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    up: SVGA + '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    pdf: SVGA + '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    art: SVGA + '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    cart: SVGA + '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    chat: SVGA + '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    user: SVGA + '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>'
  };
  var PHOTO = UI.avatar(null);

  /* ---------- ডেটা ---------- */
  var S = { authors: [], articles: [], issues: [], prints: [], orders: [], items: [], ads: [], comments: [], subs: [], set: {}, users: 0, follows: 0 };
  window.AdminData = S;
  var SLOTS = [
    { id: 'top', re: /top/i, name: 'টপ ব্যানার', size: '১২০০ × ২০০ px', where: 'হোমপেজ উপরে', ratio: '6/1' },
    { id: 'mid', re: /mid/i, name: 'মিড-স্ক্রল ব্যানার', size: '৭২৮ × ১৫০ px', where: 'হোমপেজ/আর্টিকেল লিস্টের মাঝে', ratio: '4.85/1' },
    { id: 'square', re: /square|side/i, name: 'সাইডবার/স্কোয়ার', size: '৩০০ × ৩০০ px', where: 'আর্টিকেল পেজে, লেখার শেষে', ratio: '1/1' },
    { id: 'mobile', re: /mobile/i, name: 'মোবাইল ব্যানার', size: '৩২০ × ১০০ px', where: 'মোবাইলে হোমপেজের উপরের ব্যানারের জায়গায়', ratio: '3.2/1' }
  ];
  function ok(r) { if (r && r.error) { A.showToast(PD.msg(r.error)); return false; } return true; }
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function authorName(id) { var a = byId(S.authors, id); return a ? a.name : '—'; }
  function ostatus(o) { return o.payment_status === 'verified' || o.payment_status === 'delivered' ? o.payment_status : 'pending'; }
  var STATUS_LABEL = { pending: 'যাচাই বাকি', verified: 'যাচাই হয়েছে', delivered: 'ডেলিভারি হয়েছে' };
  function ago(iso) {
    var m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    if (m < 2) return 'এইমাত্র';
    if (m < 60) return UI.bn(m) + ' মিনিট আগে';
    if (m < 1440) return UI.bn(Math.round(m / 60)) + ' ঘণ্টা আগে';
    return UI.bn(Math.round(m / 1440)) + ' দিন আগে';
  }

  /* কলাম/টেবিল ডাটাবেসে নেই কিনা (SQL মাইগ্রেশন চালানো হয়নি) */
  function isMissing(e) {
    if (!e) return false;
    return /^(42703|42P01|PGRST204|PGRST205)$/.test(String(e.code || '')) || /column .* does not exist|relation .* does not exist|schema cache|could not find/i.test(String(e.message || ''));
  }
  /* লেখার তালিকা: home_order / home_hidden / home_featured কলাম না থাকলেও যেন লেখা আসে */
  function loadArticles(T) {
    /* 'body' (পুরো লেখা) তালিকায় আনা হয় না — অনেক লেখা থাকলে ডেটাবেস টাইমআউট করে তালিকা খালি দেখায়। এডিট খুললে তখন আলাদা আনা হয় */
    var BASE = 'id,slug,title,category,author_id,issue_id,cover_url,status,view_count,published_at,created_at';
    return T('articles', BASE + ',home_order,home_hidden,home_featured').order('created_at', { ascending: false }).limit(1000).then(function (r) {
      if (r.error && isMissing(r.error)) {
        S.homeColsMissing = true;
        return T('articles', BASE).order('created_at', { ascending: false }).limit(1000);
      }
      S.homeColsMissing = false;
      return r;
    });
  }
  /* মন্তব্য: 'status' কলাম না থাকলে (মডারেশন SQL চালানো হয়নি) আগের মতো আনা, সবগুলো approved ধরা */
  function loadComments(T) {
    return T('comments', 'id,article_id,user_id,user_name,user_avatar,body,rating,parent_comment_id,status,created_at').order('created_at', { ascending: false }).limit(500).then(function (r) {
      if (r.error && isMissing(r.error)) {
        S.cmStatusMissing = true;
        return T('comments', 'id,article_id,user_name,user_avatar,body,rating,parent_comment_id,created_at').order('created_at', { ascending: false }).limit(500);
      }
      S.cmStatusMissing = false;
      return r;
    });
  }
  var LOAD_NAMES = ['লেখক', 'লেখা', 'সংখ্যা', 'প্রিন্ট সংখ্যা', 'অর্ডার', 'অর্ডারের আইটেম', 'বিজ্ঞাপন', 'মন্তব্য', 'নিউজলেটার', 'সেটিংস', 'ইউজার', 'ফলো'];

  function loadAll() {
    var T = function (t, c, o) { return PD.db.from(t).select(c || '*', o); };
    return Promise.all([
      T('authors').order('created_at', { ascending: false }).limit(500),
      loadArticles(T),
      T('issues').order('created_at', { ascending: false }).limit(300),
      T('print_issues').order('sort_order', { ascending: true }).limit(300),
      T('orders', 'id,order_number,customer_name,phone,area,subtotal,delivery_charge,transaction_id,payment_status,created_at').order('created_at', { ascending: false }).limit(500),
      T('order_items', 'order_id,title_snapshot,quantity').limit(3000),
      T('ads'),
      loadComments(T),
      T('newsletter_subscribers', 'id,email,user_id,source,created_at').order('created_at', { ascending: false }).limit(3000),
      T('site_settings', 'key,value'),
      T('profiles', 'id', { count: 'exact', head: true }),
      T('follows', 'author_id', { count: 'exact', head: true })
    ]).then(function (r) {
      var k = ['authors', 'articles', 'issues', 'prints', 'orders', 'items', 'ads', 'comments', 'subs'];
      k.forEach(function (n, i) { S[n] = r[i].data || []; });
      PD.fixCats(S.articles);
      S.set = {}; (r[9].data || []).forEach(function (x) { S.set[x.key] = x.value || {}; });
      S.artErr = r[1].error ? { msg: String(r[1].error.message || ''), code: String(r[1].error.code || '') } : null;
      S.users = r[10].count || 0; S.follows = r[11].count || 0;
      var failed = [], missing = false;
      r.forEach(function (x, i) { if (x.error) { failed.push(LOAD_NAMES[i]); if (isMissing(x.error)) missing = true; if (window.console) console.warn('[admin] ' + LOAD_NAMES[i] + ' আনা যায়নি:', x.error); } });
      if (failed.length) {
        A.showToast('আনা যায়নি: ' + failed.join(', ') + (missing ? ' — ডাটাবেসে নতুন SQL আপডেট চালানো হয়নি (supabase/migrations ফোল্ডারের ফাইলগুলো Supabase SQL Editor-এ চালান)' : ' — ' + PD.msg(r[LOAD_NAMES.indexOf(failed[0])].error)));
      } else if (S.homeColsMissing) {
        A.showToast('লেখার তালিকা এসেছে, তবে হোমের ক্রম/প্রধান লেখার কলাম ডাটাবেসে নেই — supabase/migrations-এর home_rail_order ও home_featured ফাইল দুটো SQL Editor-এ চালান');
      }
    });
  }

  /* ---------- ড্যাশবোর্ড ---------- */
  function renderDashboard() {
    var pub = S.articles.filter(function (a) { return a.status === 'published'; });
    var now = new Date(), mo = S.orders.filter(function (o) { var d = new Date(o.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    $('dash-total-articles').textContent = UI.bn(pub.length);
    $('dash-total-users').textContent = UI.bn(S.users);
    $('dash-total-orders').textContent = UI.bn(mo.length);
    $('dash-pending-payments').textContent = UI.bn(S.orders.filter(function (o) { return ostatus(o) === 'pending'; }).length);
    var act = [];
    S.articles.filter(function (a) { return a.status === 'published'; }).slice(0, 2).forEach(function (a) { act.push({ t: a.published_at || a.created_at, icon: ICON.art, title: '"' + a.title + '" প্রকাশিত হয়েছে', sub: authorName(a.author_id) }); });
    S.orders.slice(0, 2).forEach(function (o) { act.push({ t: o.created_at, icon: ICON.cart, title: 'নতুন অর্ডার #' + o.order_number + ' এসেছে', sub: o.customer_name }); });
    S.comments.slice(0, 2).forEach(function (c) { act.push({ t: c.created_at, icon: ICON.chat, title: c.body ? 'নতুন মন্তব্য' : 'নতুন রেটিং', sub: (c.user_name || 'পাঠক') + (c.body ? ': ' + String(c.body).slice(0, 40) : ' স্টার রেটিং দিয়েছেন') }); });
    S.subs.slice(0, 1).forEach(function (s) { act.push({ t: s.created_at, icon: ICON.user, title: 'নতুন নিউজলেটার সাবস্ক্রাইবার', sub: s.email }); });
    act.sort(function (a, b) { return new Date(b.t) - new Date(a.t); });
    $('recentActivityList').innerHTML = act.length ? act.slice(0, 6).map(function (a) {
      return H`<div class="quick-row"><span class="qr-icon">${raw(a.icon)}</span><span class="qr-text"><strong>${a.title}</strong><span>${a.sub}</span></span><span class="qr-time">${ago(a.t)}</span></div>`;
    }).join('') : '<div class="empty-row-note">এখনো কোনো কার্যক্রম নেই।</div>';
    var top = pub.slice().sort(function (a, b) { return (b.view_count || 0) - (a.view_count || 0); }).slice(0, 5);
    $('topReadList').innerHTML = top.length ? top.map(function (t, i) {
      return H`<div class="top-issue-row"><span class="ti-rank">${UI.bn(i + 1)}</span><span class="ti-info"><span class="ti-title">${t.title}</span><span class="ti-meta">${authorName(t.author_id)} · ${t.category || ''}</span></span><span class="ti-views">${UI.bn(t.view_count || 0)}</span></div>`;
    }).join('') : '<div class="empty-row-note">এখনো কোনো লেখা নেই।</div>';
  }

  /* ---------- লেখা ---------- */
  var artFilter = 'all', artQuery = '';
  function renderArticles() {
    var list = S.articles.filter(function (a) {
      if (artFilter !== 'all' && a.status !== artFilter) return false;
      if (artQuery) { var q = artQuery.toLowerCase(); if ((a.title || '').toLowerCase().indexOf(q) < 0 && authorName(a.author_id).toLowerCase().indexOf(q) < 0) return false; }
      return true;
    });
    var tb = $('articlesTbody');
    if (S.artErr) { tb.innerHTML = H`<tr><td colspan="7"><div class="mod-warn">লেখার তালিকা ডেটাবেস থেকে আনা যায়নি। কারণ: <b>${S.artErr.code}</b> ${S.artErr.msg}<br>এটা আমাকে পাঠালে ঠিক করে দেব।</div></td></tr>`; return; }
    if (!list.length) { tb.innerHTML = '<tr><td colspan="7"><div class="empty-row-note">কোনো লেখা পাওয়া যায়নি।</div></td></tr>'; return; }
    tb.innerHTML = list.map(function (a) {
      var pub = a.status === 'published';
      return H`<tr><td class="thumb-cell"><div class="row-thumb"><img src="${UI.cover(a.cover_url)}" alt=""></div></td><td class="wrap-cell"><strong>${a.title}</strong></td><td>${authorName(a.author_id)}</td><td>${a.category || ''}</td><td>${pub ? UI.date(a.published_at || a.created_at) : '—'}</td><td><span class="status-badge ${pub ? 'published' : 'draft'}">${pub ? 'প্রকাশিত' : 'ড্রাফট'}</span></td><td><div class="row-actions"><button class="icon-btn-sm" data-edit-article="${a.id}" title="এডিট করুন">${raw(ICON.edit)}</button><button class="icon-btn-sm danger" data-delete-article="${a.id}" title="মুছে ফেলুন">${raw(ICON.del)}</button></div></td></tr>`;
    }).join('');
  }
  $('articleFilters').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; this.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); artFilter = b.dataset.filter; renderArticles(); });
  $('articleSearch').addEventListener('input', function () { artQuery = this.value.trim(); renderArticles(); });
  $('articlesTbody').addEventListener('click', function (e) {
    var ed = e.target.closest('[data-edit-article]'), dl = e.target.closest('[data-delete-article]');
    if (ed) window.AdminForms.openArticle(ed.dataset.editArticle);
    if (dl) {
      var a = byId(S.articles, dl.dataset.deleteArticle);
      A.showConfirm('লেখাটা মুছে ফেলবেন?', '"' + a.title + '" লেখাটা (মন্তব্য, ছবিসহ) স্থায়ীভাবে মুছে ফেলা হবে।', function () {
        var db = PD.db, id = a.id;
        Promise.all([db.from('comments').delete().eq('article_id', id), db.from('bookmarks').delete().eq('article_id', id), db.from('article_images').delete().eq('article_id', id)]).then(function () {
          return db.from('articles').delete().eq('id', id);
        }).then(function (r) { if (ok(r)) { A.showToast('লেখাটা মুছে ফেলা হয়েছে'); refresh(); } });
      });
    }
  });

  /* ---------- লেখক ---------- */
  function renderAuthors() {
    var cnt = {}; S.articles.forEach(function (a) { cnt[a.author_id] = (cnt[a.author_id] || 0) + 1; });
    /* জনপ্রিয় লেখকের ক্রম (১-৫) পাওয়া লেখকেরা আগে, বাকিরা আগের মতো */
    var list = S.authors.slice().sort(function (x, y) {
      var rx = Number(x.popular_rank) || 99, ry = Number(y.popular_rank) || 99;
      return rx - ry;
    });
    $('authorsGrid').innerHTML = list.map(function (a) {
      var rk = Number(a.popular_rank) || 0;
      return H`<div class="item-card"><div class="item-cover round-cover"><img src="${UI.avatar(a.image_url)}" alt="">${raw(rk ? '<span class="rank-badge" title="হোমের জনপ্রিয় লেখক ক্রম">★ ' + UI.bn(rk) + '</span>' : '')}</div><div class="item-body"><div class="item-name">${a.name}</div><div class="item-sub-line">${a.role_title || ''} &middot; ${a.city || ''}</div><div style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px;">${UI.bn(cnt[a.id] || 0)}টি লেখা &middot; <span class="stars-mini">${raw(A.starSVG(true))}</span> ${UI.bn(Number(a.avg_rating || 0).toFixed(1))}</div><div class="item-foot centered"><button class="icon-btn-sm" data-edit-author="${a.id}" title="এডিট করুন">${raw(ICON.edit)}</button><button class="icon-btn-sm danger" data-delete-author="${a.id}" title="মুছে ফেলুন">${raw(ICON.del)}</button></div></div></div>`;
    }).join('') + '<button class="add-item-card" id="btn-add-author-inline"><span class="plus-circle">' + ICON.plus + '</span><span>নতুন লেখক যোগ করুন</span></button>';
  }
  $('authorsGrid').addEventListener('click', function (e) {
    var ed = e.target.closest('[data-edit-author]'), dl = e.target.closest('[data-delete-author]');
    if (e.target.closest('#btn-add-author-inline')) window.AdminForms.openAuthor();
    if (ed) window.AdminForms.openAuthor(ed.dataset.editAuthor);
    if (dl) {
      var a = byId(S.authors, dl.dataset.deleteAuthor);
      A.showConfirm('লেখক মুছে ফেলবেন?', '"' + a.name + '" এর প্রোফাইল মুছে ফেললে তার লেখাগুলোর লেখক তথ্যও প্রভাবিত হবে।', function () {
        PD.db.from('authors').delete().eq('id', a.id).then(function (r) { if (ok(r)) { A.showToast('লেখক প্রোফাইল মুছে ফেলা হয়েছে'); refresh(); } });
      });
    }
  });

  /* ---------- আর্কাইভ (সংখ্যা) ---------- */
  function renderArchive() {
    var cnt = {}; S.articles.forEach(function (a) { if (a.issue_id) cnt[a.issue_id] = (cnt[a.issue_id] || 0) + 1; });
    $('archiveGrid').innerHTML = S.issues.map(function (i) {
      return H`<div class="item-card"><div class="item-cover"><img src="${UI.cover(i.cover_url)}" alt=""><span class="item-badge">সংখ্যা ${UI.bn(i.issue_number || '')}</span></div><div class="item-body"><div class="item-name">${i.title}</div><div class="item-sub-line">${UI.bn(cnt[i.id] || 0)}টি লেখা যুক্ত আছে</div><div class="item-foot centered"><button class="icon-btn-sm" data-edit-archive="${i.id}" title="এডিট করুন">${raw(ICON.edit)}</button><button class="icon-btn-sm danger" data-delete-archive="${i.id}" title="মুছে ফেলুন">${raw(ICON.del)}</button></div></div></div>`;
    }).join('') + '<button class="add-item-card" id="btn-add-archive-inline"><span class="plus-circle">' + ICON.plus + '</span><span>নতুন সংখ্যা তৈরি করুন</span></button>';
  }
  $('archiveGrid').addEventListener('click', function (e) {
    var ed = e.target.closest('[data-edit-archive]'), dl = e.target.closest('[data-delete-archive]');
    if (e.target.closest('#btn-add-archive-inline')) window.AdminForms.openArchive();
    if (ed) window.AdminForms.openArchive(ed.dataset.editArchive);
    if (dl) {
      var i = byId(S.issues, dl.dataset.deleteArchive);
      A.showConfirm('সংখ্যা মুছে ফেলবেন?', '"' + i.title + '" আর্কাইভ থেকে স্থায়ীভাবে মুছে যাবে (লেখাগুলো থাকবে, শুধু সংখ্যার সাথে যোগ কেটে যাবে)।', function () {
        PD.db.from('articles').update({ issue_id: null }).eq('issue_id', i.id).then(function () { return PD.db.from('issues').delete().eq('id', i.id); }).then(function (r) { if (ok(r)) { A.showToast('সংখ্যা মুছে ফেলা হয়েছে'); refresh(); } });
      });
    }
  });

  /* ---------- প্রিন্ট সংখ্যা (স্টোর) ---------- */
  function renderIssues() {
    var inS = S.prints.filter(function (p) { return p.in_stock; }).length, avg = S.prints.length ? Math.round(S.prints.reduce(function (s, p) { return s + Number(p.price || 0); }, 0) / S.prints.length) : 0;
    $('stat-total-issues').textContent = UI.bn(S.prints.length); $('stat-in-stock').textContent = UI.bn(inS); $('stat-out-stock').textContent = UI.bn(S.prints.length - inS);
    var av = $('page-issues').querySelectorAll('.stat-value')[3]; if (av) av.textContent = A.bnTaka(avg);
    $('issue-grid').innerHTML = S.prints.map(function (p) {
      return H`<div class="item-card"><div class="item-cover"><img src="${UI.cover(p.cover_url)}" alt=""><span class="item-badge ${p.in_stock ? '' : 'out'}">${p.in_stock ? 'স্টকে আছে' : 'স্টক শেষ'}</span>${raw(p.preview_pdf_url ? '<span class="item-pdf-badge">' + ICON.pdf + 'প্রিভিউ</span>' : '')}</div><div class="item-body"><div class="item-name">${p.title}</div><div class="item-sub-line">${p.teaser || ''}</div><div class="item-foot"><div class="item-price"><span class="unit">৳</span>${UI.bn(p.price)}</div><button class="icon-btn-sm" data-edit="${p.id}" title="এডিট করুন">${raw(ICON.edit)}</button></div></div></div>`;
    }).join('') + '<button class="add-item-card" id="btn-add-issue-inline"><span class="plus-circle">' + ICON.plus + '</span><span>নতুন সংখ্যা যোগ করুন</span></button>';
  }
  $('issue-grid').addEventListener('click', function (e) {
    var ed = e.target.closest('[data-edit]'); if (ed) window.AdminForms.openPrint(ed.dataset.edit);
    if (e.target.closest('#btn-add-issue-inline')) window.AdminForms.openPrint();
  });
  $('btn-add-issue').addEventListener('click', function () { window.AdminForms.openPrint(); });

  /* ---------- অর্ডার ---------- */
  var ordFilter = 'all';
  function renderOrders() {
    var by = {}; S.items.forEach(function (i) { (by[i.order_id] = by[i.order_id] || []).push(i); });
    var c = { pending: 0, verified: 0, delivered: 0 }; S.orders.forEach(function (o) { c[ostatus(o)]++; });
    $('stat-total-orders').textContent = UI.bn(S.orders.length); $('stat-pending-orders').textContent = UI.bn(c.pending); $('stat-verified-orders').textContent = UI.bn(c.verified); $('stat-delivered-orders').textContent = UI.bn(c.delivered);
    var list = S.orders.filter(function (o) { return ordFilter === 'all' || ostatus(o) === ordFilter; });
    $('orders-tbody').innerHTML = list.length ? list.map(function (o) {
      var its = by[o.id] || [], qty = its.reduce(function (s, i) { return s + i.quantity; }, 0), st = ostatus(o);
      return H`<tr><td>#${o.order_number}</td><td class="wrap-cell"><strong>${o.customer_name}</strong><span>${o.phone}</span></td><td>${its.map(function (i) { return i.title_snapshot; }).join(', ')}</td><td>${UI.bn(qty)} কপি</td><td>${A.bnTaka(Number(o.delivery_charge || 0))}</td><td>${o.transaction_id || ''}</td><td><select class="status-select" data-id="${o.id}">${raw(['pending', 'verified', 'delivered'].map(function (k) { return H`<option value="${k}"${raw(st === k ? ' selected' : '')}>${STATUS_LABEL[k]}</option>`; }).join(''))}</select></td></tr>`;
    }).join('') : '<tr><td colspan="7"><div class="empty-row-note">কোনো অর্ডার নেই।</div></td></tr>';
  }
  $('order-filters').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; this.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); ordFilter = b.dataset.filter; renderOrders(); });
  $('orders-tbody').addEventListener('change', function (e) {
    var sel = e.target.closest('.status-select'); if (!sel) return;
    var o = byId(S.orders, sel.dataset.id), v = sel.value;
    PD.db.from('orders').update({ payment_status: v }).eq('id', o.id).then(function (r) { if (ok(r)) { o.payment_status = v; renderOrders(); renderDashboard(); A.showToast('অর্ডার #' + o.order_number + '-এর স্ট্যাটাস "' + STATUS_LABEL[v] + '" করা হয়েছে'); } else sel.value = ostatus(o); });
  });

  /* ---------- বিজ্ঞাপন ---------- */
  function adFor(slot) { return S.ads.filter(function (a) { return slot.re.test((a.slot_id || '') + ' ' + (a.slot_name || '')); })[0]; }
  function renderAds() {
    var on = 0, off = 0, empty = 0;
    $('adSlotGrid').innerHTML = SLOTS.map(function (s) {
      var a = adFor(s), img = a && a.image_url, live = !!(img && a.is_active), st = !img ? 'empty' : (live ? 'on' : 'off');
      if (st === 'on') on++; else if (st === 'off') off++; else empty++;
      var pill = { on: 'চালু আছে', off: 'বন্ধ আছে', empty: 'ছবি দেওয়া হয়নি' }[st];
      var stage = img
        ? H`<div class="ad-frame" style="aspect-ratio:${s.ratio}"><img src="${img}" alt=""><span class="ad-swap">${raw(ICON.up)} ছবি বদলান</span></div>`
        : H`<div class="ad-empty">${raw(ICON.up)}<b>ছবি আপলোড করুন</b><span>এখানে ক্লিক করুন বা ছবি টেনে এনে ছাড়ুন</span></div>`;
      return H`<div class="ad-card ${st}"><div class="ad-top"><div><div class="ad-name">${s.name}</div><div class="ad-where">${s.where}</div></div><span class="ad-pill ${st}"><i></i>${pill}</span></div><div class="ad-stage" data-slot-trigger="${s.id}" data-slot-drop="${s.id}" style="--ar:${s.ratio}">${raw(stage)}</div><input type="file" accept="image/*" style="display:none;" data-slot-file="${s.id}"><div class="ad-chips"><span>${s.size}</span><span>JPG · PNG · WebP · GIF</span></div><div class="ad-link"><label>ক্লিক করলে যে লিংকে যাবে <small>(ঐচ্ছিক)</small></label><div class="ad-link-row"><input type="url" placeholder="https://example.com" value="${(a && a.link_url) || ''}" data-slot-link="${s.id}"${raw(img ? '' : ' disabled')}><button class="btn btn-secondary ad-save" data-slot-linksave="${s.id}"${raw(img ? '' : ' disabled')}>সংরক্ষণ</button></div></div><div class="ad-foot"><label class="ad-toggle"><span class="switch"><input type="checkbox" data-slot-active="${s.id}"${raw(live ? ' checked' : '')}><span class="track"></span></span><span>সাইটে দেখান</span></label>${raw(img ? H`<button class="ad-remove" data-slot-remove="${s.id}">${raw(ICON.del)} সরিয়ে ফেলুন</button>` : '')}</div></div>`;
    }).join('');
    $('adStats').innerHTML = [['চালু', on, 'on'], ['বন্ধ', off, 'off'], ['ছবি নেই', empty, 'empty']].map(function (x) { return '<div class="ad-stat ' + x[2] + '"><strong>' + UI.bn(x[1]) + '</strong><span>' + x[0] + '</span></div>'; }).join('');
    /* ছবি লোড না হলে (যেমন AdBlock আটকালে) ফাঁকা না রেখে কারণ দেখানো */
    [].forEach.call($('adSlotGrid').querySelectorAll('.ad-frame img'), function (im) {
      im.addEventListener('error', function () {
        var d = document.createElement('div'); d.className = 'ad-broken';
        d.textContent = 'ছবি লোড হচ্ছে না — আবার আপলোড করুন (বা AdBlock বন্ধ করে দেখুন)';
        im.replaceWith(d);
      });
    });
  }
  function slotOf(id) { return SLOTS.filter(function (x) { return x.id === id; })[0]; }
  function uploadAd(s, file) {
    var a = adFor(s);
    if (!file || !/^image\//.test(file.type)) return A.showToast('শুধু ছবি বা GIF দিন');
    A.showToast('আপলোড হচ্ছে…');
    window.AdminForms.upload(file, 'banners', 'banner-' + s.id).then(function (url) {
      var row = { image_url: url, is_active: true, link_url: a && a.link_url ? a.link_url : null };
      return a ? PD.db.from('ads').update(row).eq('slot_id', a.slot_id) : PD.db.from('ads').insert(Object.assign({ slot_id: s.id, slot_name: s.name }, row));
    }).then(function (r) { if (r && ok(r)) { A.showToast('ছবি আপলোড হয়েছে — স্লটের মাপে ফিট করা হয়েছে'); refresh(); } }).catch(function (er) { A.showToast(er.message || 'আপলোড হয়নি'); });
  }
  $('adSlotGrid').addEventListener('click', function (e) {
    var t = e.target.closest('[data-slot-trigger]'); if (t) { this.querySelector('[data-slot-file="' + t.dataset.slotTrigger + '"]').click(); return; }
    var sv = e.target.closest('[data-slot-linksave]');
    if (sv) {
      var s1 = slotOf(sv.dataset.slotLinksave), a1 = adFor(s1), inp = this.querySelector('[data-slot-link="' + s1.id + '"]'), link = inp.value.trim();
      if (link && !/^https?:\/\//i.test(link)) return A.showToast('লিংক https:// দিয়ে শুরু হতে হবে');
      PD.db.from('ads').update({ link_url: link || null }).eq('slot_id', a1.slot_id).then(function (r) { if (ok(r)) { a1.link_url = link || null; A.showToast(link ? 'লিংক সংরক্ষণ হয়েছে' : 'লিংক সরানো হয়েছে'); } });
      return;
    }
    var rm = e.target.closest('[data-slot-remove]');
    if (rm) {
      var s = slotOf(rm.dataset.slotRemove), a = adFor(s);
      A.showConfirm('এড সরিয়ে ফেলবেন?', '"' + s.name + '" স্লটের ছবিটা সরিয়ে ফেললে সাইটে ঐ জায়গায় আর কিছু দেখাবে না।', function () {
        PD.db.from('ads').update({ image_url: null, is_active: false, link_url: null }).eq('slot_id', a.slot_id).then(function (r) { if (ok(r)) { A.showToast('এড সরিয়ে ফেলা হয়েছে'); refresh(); } });
      });
    }
  });
  /* ছবি টেনে এনে ছাড়া (drag & drop) */
  ['dragenter', 'dragover'].forEach(function (ev) { $('adSlotGrid').addEventListener(ev, function (e) { var d = e.target.closest('[data-slot-drop]'); if (d) { e.preventDefault(); d.classList.add('drag'); } }); });
  ['dragleave', 'drop'].forEach(function (ev) { $('adSlotGrid').addEventListener(ev, function (e) { var d = e.target.closest('[data-slot-drop]'); if (d) d.classList.remove('drag'); }); });
  $('adSlotGrid').addEventListener('drop', function (e) { var d = e.target.closest('[data-slot-drop]'); if (!d) return; e.preventDefault(); uploadAd(slotOf(d.dataset.slotDrop), e.dataTransfer.files[0]); });
  $('adSlotGrid').addEventListener('change', function (e) {
    var f = e.target.closest('[data-slot-file]'), tg = e.target.closest('[data-slot-active]');
    if (f && f.files[0]) uploadAd(slotOf(f.dataset.slotFile), f.files[0]);
    if (tg) {
      var s2 = slotOf(tg.dataset.slotActive), a2 = adFor(s2);
      if (!a2 || !a2.image_url) { tg.checked = false; A.showToast('আগে একটা ছবি আপলোড করুন'); return; }
      PD.db.from('ads').update({ is_active: tg.checked }).eq('slot_id', a2.slot_id).then(function (r) { if (ok(r)) { a2.is_active = tg.checked; A.showToast(tg.checked ? 'এড চালু হয়েছে' : 'এড বন্ধ হয়েছে'); renderAds(); } });
    }
  });

  /* ---------- মন্তব্য মডারেশন ---------- */
  var cmFilter = 'pending';
  function cmStatus(c) { return c.status === 'pending' ? 'pending' : 'approved'; }
  function renderComments() {
    var all = S.comments.filter(function (c) { return c.body; });
    var nPend = all.filter(function (c) { return cmStatus(c) === 'pending'; }).length, nOk = all.length - nPend;
    var chips = $('commentFilters');
    if (chips) {
      chips.innerHTML = H`<button data-filter="pending" class="${cmFilter === 'pending' ? 'active' : ''}">অনুমোদনের অপেক্ষায় <span class="chip-count${nPend ? ' hot' : ''}">${UI.bn(nPend)}</span></button><button data-filter="approved" class="${cmFilter === 'approved' ? 'active' : ''}">অনুমোদিত <span class="chip-count">${UI.bn(nOk)}</span></button><button data-filter="all" class="${cmFilter === 'all' ? 'active' : ''}">সব <span class="chip-count">${UI.bn(all.length)}</span></button>`;
    }
    var list = all.filter(function (c) { return cmFilter === 'all' || cmStatus(c) === cmFilter; });
    var warn = S.cmStatusMissing ? '<div class="mod-warn">মডারেশনের SQL এখনো চালানো হয়নি — <b>supabase/migrations/20261101_comment_moderation.sql</b> ফাইলটি Supabase → SQL Editor-এ একবার চালান। তার আগে সব মন্তব্য সরাসরি প্রকাশিত থাকবে।</div>' : '';
    var empty = cmFilter === 'pending' ? 'অনুমোদনের অপেক্ষায় কোনো মন্তব্য নেই। 🎉' : 'কোনো মন্তব্য নেই।';
    $('modList').innerHTML = warn + (list.length ? list.map(function (c) {
      var art = byId(S.articles, c.article_id), pend = cmStatus(c) === 'pending', isReply = !!c.parent_comment_id;
      var stars = c.rating ? H`<span class="mod-stars">${raw(UI.starsHTML(c.rating))}</span>` : '';
      var tag = pend ? '<span class="mod-tag pend">অনুমোদনের অপেক্ষায়</span>' : '<span class="mod-tag ok">প্রকাশিত</span>';
      var kind = isReply ? '<span class="mod-tag reply">জবাব</span>' : '';
      var approveBtn = pend ? H`<button class="btn btn-primary" data-approve-comment="${c.id}">${raw(ICON.check)} অনুমোদন করুন</button>` : '';
      return H`<div class="mod-item${pend ? ' is-pending' : ''}"><img src="${UI.avatar(c.user_avatar)}" alt=""><div class="mod-body"><div class="mod-top"><strong>${c.user_name || 'পাঠক'}</strong>${raw(tag)}${raw(kind)}${raw(stars)}<span class="mod-context">"${art ? art.title : ''}"</span><span class="mod-date">${UI.date(c.created_at)}</span></div><p class="mod-text">${c.body}</p><div class="mod-actions">${raw(approveBtn)}<button class="btn btn-danger-ghost" data-delete-comment="${c.id}">${raw(ICON.del)} মুছে ফেলুন</button></div></div></div>`;
    }).join('') : '<div class="empty-row-note">' + empty + '</div>');
  }
  function modFail(r) {
    if (r && r.error) {
      var e = r.error, m = String(e.message || '');
      if (/42883|PGRST202|could not find the function|does not exist/i.test(String(e.code || '') + ' ' + m)) A.showToast('মডারেশনের SQL এখনো চালানো হয়নি — 20261101_comment_moderation.sql ফাইলটি Supabase SQL Editor-এ চালান');
      else if (/42501|not allowed/i.test(String(e.code || '') + ' ' + m)) A.showToast('এই কাজ শুধু এডমিন করতে পারেন');
      else A.showToast(PD.msg(e));
      return true;
    }
    return false;
  }
  $('commentFilters').addEventListener('click', function (e) {
    var b = e.target.closest('[data-filter]'); if (!b) return;
    cmFilter = b.dataset.filter; renderComments();
  });
  $('modList').addEventListener('click', function (e) {
    var ap = e.target.closest('[data-approve-comment]');
    if (ap) {
      ap.disabled = true;
      PD.db.rpc('pd_moderate_comment', { p_id: String(ap.dataset.approveComment), p_action: 'approve', p_note: null }).then(function (r) {
        ap.disabled = false;
        if (modFail(r)) return;
        A.showToast('মন্তব্য অনুমোদিত হয়েছে — এখন সবাই দেখতে পাবে'); refresh();
      });
      return;
    }
    var b = e.target.closest('[data-delete-comment]'); if (!b) return;
    var c = byId(S.comments, b.dataset.deleteComment); if (!c) return;
    openReject(c);
  });

  /* কারণ-লেখার পপআপ: মুছতে হলে কারণ দিতেই হবে, সেটা ইউজারের নোটিফিকেশনে যাবে */
  var rj = { ov: $('reject-overlay'), note: $('reject-note'), cnt: $('reject-count'), who: $('reject-who'), quote: $('reject-quote'), yes: $('reject-yes'), no: $('reject-no'), err: $('reject-err') }, rjFor = null;
  function openReject(c) {
    rjFor = c; rj.note.value = ''; rj.err.textContent = ''; rj.cnt.textContent = UI.bn(0) + '/' + UI.bn(300);
    rj.who.textContent = (c.user_name || 'পাঠক') + '-এর মন্তব্য';
    rj.quote.textContent = String(c.body || '').slice(0, 160) + (String(c.body || '').length > 160 ? '…' : '');
    rj.ov.classList.add('show'); setTimeout(function () { rj.note.focus(); }, 120);
  }
  function closeReject() { rjFor = null; rj.ov.classList.remove('show'); }
  rj.note.addEventListener('input', function () { rj.cnt.textContent = UI.bn(rj.note.value.length) + '/' + UI.bn(300); if (rj.note.value.trim().length >= 3) rj.err.textContent = ''; });
  rj.no.addEventListener('click', closeReject);
  rj.ov.addEventListener('mousedown', function (e) { if (e.target === rj.ov) closeReject(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && rj.ov.classList.contains('show')) closeReject(); });
  rj.yes.addEventListener('click', function () {
    var note = rj.note.value.trim();
    if (note.length < 3) { rj.err.textContent = 'কেন মুছছেন তার কারণ লিখুন — এটা ইউজারকে জানানো হবে।'; rj.note.focus(); return; }
    if (!rjFor) return;
    var id = rjFor.id; rj.yes.disabled = true;
    /* সাথে সাথে পপআপ বন্ধ + তালিকা থেকে সরানো; ব্যর্থ হলে আবার ফিরিয়ে আনা হবে */
    var backup = S.comments.slice();
    S.comments = S.comments.filter(function (c) { return String(c.id) !== String(id) && String(c.parent_comment_id) !== String(id); });
    closeReject(); renderComments();
    PD.db.rpc('pd_moderate_comment', { p_id: String(id), p_action: 'delete', p_note: note }).then(function (r) {
      rj.yes.disabled = false;
      if (modFail(r)) { S.comments = backup; renderComments(); refresh(); return; }
      A.showToast('মন্তব্য মুছে ফেলা হয়েছে — কারণসহ ইউজারকে জানানো হয়েছে'); refresh();
    }, function (e) {
      rj.yes.disabled = false; S.comments = backup; renderComments();
      A.showToast(PD.msg(e)); refresh();
    });
  });

  /* ---------- নিউজলেটার ---------- */
  var subQ = '';
  function srcLabel(s) { return s.user_id ? 'সাইন-ইন' : 'ফুটার'; }
  function renderSubs() {
    var si = S.subs.filter(function (s) { return s.user_id; }).length;
    $('subs-total').textContent = UI.bn(S.subs.length); $('subs-signin').textContent = UI.bn(si); $('subs-footer').textContent = UI.bn(S.subs.length - si);
    var list = S.subs.filter(function (s) { return !subQ || s.email.toLowerCase().indexOf(subQ.toLowerCase()) >= 0; });
    $('subscribersTbody').innerHTML = list.length ? list.map(function (s) {
      return H`<tr><td>${s.email}</td><td><span class="status-badge ${s.user_id ? 'published' : 'draft'}">${srcLabel(s)}</span></td><td>${UI.date(s.created_at)}</td><td><button class="icon-btn-sm danger" data-remove-sub="${s.id}" title="তালিকা থেকে সরান">${raw(ICON.del)}</button></td></tr>`;
    }).join('') : '<tr><td colspan="4"><div class="empty-row-note">কোনো সাবস্ক্রাইবার পাওয়া যায়নি।</div></td></tr>';
  }
  $('subscriberSearch').addEventListener('input', function () { subQ = this.value.trim(); renderSubs(); });
  $('subscribersTbody').addEventListener('click', function (e) {
    var b = e.target.closest('[data-remove-sub]'); if (!b) return;
    var s = byId(S.subs, b.dataset.removeSub);
    A.showConfirm('সাবস্ক্রাইবার সরাবেন?', '"' + s.email + '" আর নিউজলেটার পাবে না।', function () { PD.db.from('newsletter_subscribers').delete().eq('id', s.id).then(function (r) { if (ok(r)) { A.showToast('সাবস্ক্রাইবার তালিকা থেকে সরানো হয়েছে'); refresh(); } }); });
  });
  $('exportSubsBtn').addEventListener('click', function () {
    var csv = '\ufeffemail,source,date\n' + S.subs.map(function (s) { return '"' + s.email.replace(/"/g, '""') + '",' + srcLabel(s) + ',' + String(s.created_at).slice(0, 10); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'potrodip-subscribers.csv'; document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- অ্যানালিটিক্স ---------- */
  function renderAnalytics() {
    var pub = S.articles.filter(function (a) { return a.status === 'published'; }), total = pub.reduce(function (s, a) { return s + (a.view_count || 0); }, 0);
    var rated = S.comments.filter(function (c) { return !c.parent_comment_id && c.rating; }), avg = rated.length ? rated.reduce(function (s, c) { return s + c.rating; }, 0) / rated.length : 0;
    var st = $('page-analytics').querySelectorAll('.stat-value'), lb = $('page-analytics').querySelectorAll('.stat-label');
    lb[0].textContent = 'মোট পঠন (সব সময়)'; st[0].textContent = UI.bn(total); st[1].textContent = avg ? UI.bn(avg.toFixed(1)) : '—';
    st[2].textContent = UI.bn(S.comments.filter(function (c) { return c.body; }).length); st[3].textContent = UI.bn(S.follows);
    function bars(id, data) {
      var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
      $(id).innerHTML = data.length ? data.map(function (d) { return H`<div class="bar-row"><span class="bar-label" title="${d.label}">${d.label}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.round(d.value / max * 100)}%"></span></span><span class="bar-value">${UI.bn(d.value)}</span></div>`; }).join('') : '<div class="empty-row-note">এখনো তথ্য নেই।</div>';
    }
    bars('analyticsArticleBars', pub.slice().sort(function (a, b) { return (b.view_count || 0) - (a.view_count || 0); }).slice(0, 5).map(function (a) { return { label: a.title, value: a.view_count || 0 }; }));
    var cat = {}; pub.forEach(function (a) { cat[a.category || 'অন্যান্য'] = (cat[a.category || 'অন্যান্য'] || 0) + (a.view_count || 0); });
    bars('analyticsCatBars', Object.keys(cat).map(function (k) { return { label: k, value: cat[k] }; }).sort(function (a, b) { return b.value - a.value; }));
  }

  function renderAll() { renderDashboard(); renderArticles(); renderAuthors(); renderArchive(); renderIssues(); renderOrders(); renderAds(); renderComments(); renderSubs(); renderAnalytics(); updateBadges(); if (window.AdminForms) window.AdminForms.fillSettings(); }
  /* সাইডবারের ব্যাজ: কমেন্ট মডারেশনে অপেক্ষমাণ মন্তব্য, অর্ডারে যাচাই-বাকি অর্ডার, নিউজলেটারে নতুন সাবস্ক্রাইবার (পেজটা শেষবার দেখার পর) */
  var SEEN_KEY = 'pd_admin_seen_newsletter';
  function seenSubs() { try { var v = localStorage.getItem(SEEN_KEY); if (!v) { v = new Date().toISOString(); localStorage.setItem(SEEN_KEY, v); } return v; } catch (e) { return new Date(0).toISOString(); } }
  function markSubsSeen() { try { localStorage.setItem(SEEN_KEY, new Date().toISOString()); } catch (e) {} A.setBadge('newsletter', 0); }
  function updateBadges() {
    var seen = seenSubs();
    A.setBadge('comments', S.cmStatusMissing ? 0 : S.comments.filter(function (c) { return c.status === 'pending'; }).length);
    A.setBadge('orders', S.orders.filter(function (o) { return ostatus(o) === 'pending'; }).length);
    A.setBadge('newsletter', document.getElementById('page-newsletter').classList.contains('active') ? 0 : S.subs.filter(function (x) { return x.created_at > seen; }).length);
  }
  document.addEventListener('ad:page', function (e) { if (e.detail === 'newsletter') markSubsSeen(); });
  function refresh() { return loadAll().then(renderAll); }
  /* রিয়ালটাইম: নতুন মন্তব্য/অর্ডার/সাবস্ক্রাইবার এলে বা অনুমোদন-যাচাই বদলালে রিফ্রেশ ছাড়াই তালিকা, ড্যাশবোর্ড ও ব্যাজ হালনাগাদ।
     ফর্ম/সেটিংস ইনপুটে হাত দেওয়া হয় না (শুধু ওই তালিকাগুলো আবার আঁকা হয়) */
  function softRefresh() {
    var ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.closest && ae.closest('.modal-box,.reject-box,#page-comments')) return setTimeout(softRefresh, 4000);
    return loadAll().then(function () { renderDashboard(); renderOrders(); renderComments(); renderSubs(); renderAnalytics(); updateBadges(); });
  }
  function startLive() {
    if (!PD.live) return;
    PD.live({
      tables: ['comments', 'orders', 'newsletter_subscribers'],
      poll: 20000,
      onChange: function (ev) {
        softRefresh();
        (ev || []).forEach(function (p) {
          if (p.eventType !== 'INSERT' || !p.new) return;
          if (p.table === 'comments' && p.new.user_id !== (PD.user && PD.user.id) && p.new.status !== 'approved') A.showToast('নতুন মন্তব্য এসেছে — অনুমোদনের অপেক্ষায়');
          else if (p.table === 'orders') A.showToast('নতুন অর্ডার এসেছে');
        });
      }
    });
  }
  window.AdminCore = { refresh: refresh, ok: ok, esc: esc, byId: byId };

  /* ---------- শুরু: শুধু এডমিন ঢুকতে পারবে ---------- */
  function deny(msg) {
    document.body.insertAdjacentHTML('beforeend', '<div class="wrap" style="max-width:520px;margin:120px auto;padding:24px;text-align:center"><h2 style="margin-bottom:10px">' + msg + '</h2><p><a href="auth.html" style="color:var(--primary);text-decoration:underline">লগইন পেজে যান</a></p></div>');
  }
  if (!PD || !PD.db) return deny('সংযোগ করা যায়নি');
  PD.ready.then(function () {
    if (!PD.user) return deny('এডমিন প্যানেলে ঢুকতে আগে লগইন করুন');
    if (!PD.isAdmin()) return deny('শুধু এডমিন এই পেজ দেখতে পারেন');
    app.style.display = '';
    refresh().then(startLive);
  });
})();
