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
    { id: 'square', re: /square|side/i, name: 'সাইডবার/স্কোয়ার', size: '৩০০ × ৩০০ px', where: 'আর্টিকেল পেজের পাশে', ratio: '1/1' },
    { id: 'mobile', re: /mobile/i, name: 'মোবাইল ব্যানার', size: '৩২০ × ১০০ px', where: 'মোবাইলে স্বয়ংক্রিয়ভাবে', ratio: '3.2/1' }
  ];
  function ok(r) { if (r && r.error) { A.showToast('সমস্যা: ' + PD.msg(r.error)); return false; } return true; }
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

  function loadAll() {
    var T = function (t, c, o) { return PD.db.from(t).select(c || '*', o); };
    return Promise.all([
      T('authors').order('created_at', { ascending: false }).limit(500),
      T('articles', 'id,slug,title,body,category,author_id,issue_id,cover_url,status,view_count,published_at,created_at').order('created_at', { ascending: false }).limit(1000),
      T('issues').order('created_at', { ascending: false }).limit(300),
      T('print_issues').order('sort_order', { ascending: true }).limit(300),
      T('orders', 'id,order_number,customer_name,phone,area,subtotal,delivery_charge,transaction_id,payment_status,created_at').order('created_at', { ascending: false }).limit(500),
      T('order_items', 'order_id,title_snapshot,quantity').limit(3000),
      T('ads'),
      T('comments', 'id,article_id,user_name,user_avatar,body,rating,parent_comment_id,created_at').order('created_at', { ascending: false }).limit(500),
      T('newsletter_subscribers', 'id,email,user_id,source,created_at').order('created_at', { ascending: false }).limit(3000),
      T('site_settings', 'key,value'),
      T('profiles', 'id', { count: 'exact', head: true }),
      T('follows', 'author_id', { count: 'exact', head: true })
    ]).then(function (r) {
      var k = ['authors', 'articles', 'issues', 'prints', 'orders', 'items', 'ads', 'comments', 'subs'];
      k.forEach(function (n, i) { S[n] = r[i].data || []; });
      S.set = {}; (r[9].data || []).forEach(function (x) { S.set[x.key] = x.value || {}; });
      S.users = r[10].count || 0; S.follows = r[11].count || 0;
      var bad = r.filter(function (x) { return x.error; })[0];
      if (bad) A.showToast('কিছু ডেটা লোড হয়নি: ' + PD.msg(bad.error));
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
    S.comments.slice(0, 2).forEach(function (c) { act.push({ t: c.created_at, icon: ICON.chat, title: 'নতুন মন্তব্য', sub: (c.user_name || 'পাঠক') + ': ' + String(c.body || '').slice(0, 40) }); });
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
    $('authorsGrid').innerHTML = S.authors.map(function (a) {
      return H`<div class="item-card"><div class="item-cover round-cover"><img src="${UI.avatar(a.image_url)}" alt=""></div><div class="item-body"><div class="item-name">${a.name}</div><div class="item-sub-line">${a.role_title || ''} &middot; ${a.city || ''}</div><div style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px;">${UI.bn(cnt[a.id] || 0)}টি লেখা &middot; <span class="stars-mini">${raw(A.starSVG(true))}</span> ${UI.bn(Number(a.avg_rating || 0).toFixed(1))}</div><div class="item-foot centered"><button class="icon-btn-sm" data-edit-author="${a.id}" title="এডিট করুন">${raw(ICON.edit)}</button><button class="icon-btn-sm danger" data-delete-author="${a.id}" title="মুছে ফেলুন">${raw(ICON.del)}</button></div></div></div>`;
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
      return H`<div class="item-card"><div class="item-cover"><img src="${UI.cover(i.cover_url)}" alt=""><span class="item-badge">সংখ্যা ${i.issue_number || ''}</span></div><div class="item-body"><div class="item-name">${i.title}</div><div class="item-sub-line">${UI.bn(cnt[i.id] || 0)}টি লেখা যুক্ত আছে</div><div class="item-foot centered"><button class="icon-btn-sm" data-edit-archive="${i.id}" title="এডিট করুন">${raw(ICON.edit)}</button><button class="icon-btn-sm danger" data-delete-archive="${i.id}" title="মুছে ফেলুন">${raw(ICON.del)}</button></div></div></div>`;
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
    $('adSlotGrid').innerHTML = SLOTS.map(function (s) {
      var a = adFor(s), img = a && a.image_url;
      return H`<div class="item-card"><div class="item-cover" style="aspect-ratio:${s.ratio}; cursor:pointer;" data-slot-trigger="${s.id}">${raw(img ? H`<img src="${img}" alt="">` : '<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:var(--text-muted); font-size:12px; text-align:center; padding:10px;">' + ICON.up + '<span>ক্লিক করে আপলোড করুন</span></div>')}</div><input type="file" accept="image/*" style="display:none;" data-slot-file="${s.id}"><div class="item-body left-align"><div class="item-name">${s.name}</div><div style="font-size:12px; color:var(--secondary); font-weight:600; margin-bottom:4px;">${s.size}</div><div class="item-sub-line">${s.where}</div><div class="item-foot"><label class="switch"><input type="checkbox" data-slot-active="${s.id}"${raw(a && a.is_active ? ' checked' : '')}><span class="track"></span></label><div style="display:flex; gap:6px;">${raw(img ? H`<button class="icon-btn-sm danger" data-slot-remove="${s.id}" title="সরিয়ে ফেলুন">${raw(ICON.del)}</button>` : '')}</div></div></div></div>`;
    }).join('');
  }
  $('adSlotGrid').addEventListener('click', function (e) {
    var t = e.target.closest('[data-slot-trigger]'); if (t) { this.querySelector('[data-slot-file="' + t.dataset.slotTrigger + '"]').click(); return; }
    var rm = e.target.closest('[data-slot-remove]');
    if (rm) {
      var s = SLOTS.filter(function (x) { return x.id === rm.dataset.slotRemove; })[0], a = adFor(s);
      A.showConfirm('এড সরিয়ে ফেলবেন?', '"' + s.name + '" স্লটের ছবিটা সরিয়ে ফেললে সাইটে ঐ জায়গায় আর কিছু দেখাবে না।', function () {
        PD.db.from('ads').update({ image_url: null, is_active: false }).eq('slot_id', a.slot_id).then(function (r) { if (ok(r)) { A.showToast('এড সরিয়ে ফেলা হয়েছে'); refresh(); } });
      });
    }
  });
  $('adSlotGrid').addEventListener('change', function (e) {
    var f = e.target.closest('[data-slot-file]'), tg = e.target.closest('[data-slot-active]');
    if (f && f.files[0]) {
      var s = SLOTS.filter(function (x) { return x.id === f.dataset.slotFile; })[0], a = adFor(s), file = f.files[0];
      window.AdminForms.upload(file, 'ads').then(function (url) {
        var link = a && a.link_url ? a.link_url : (prompt('বিজ্ঞাপনে ক্লিক করলে কোথায় যাবে? লিংক দিন (https://...) বা খালি রাখুন', '') || '').trim();
        if (link && !/^https?:\/\//i.test(link)) { A.showToast('লিংক https:// দিয়ে শুরু হতে হবে, তাই লিংক ছাড়া সেভ হলো'); link = ''; }
        var row = { image_url: url, is_active: true, link_url: link || null };
        return a ? PD.db.from('ads').update(row).eq('slot_id', a.slot_id) : PD.db.from('ads').insert(Object.assign({ slot_id: s.id, slot_name: s.name }, row));
      }).then(function (r) { if (r && ok(r)) { A.showToast('ছবি আপলোড হয়েছে, স্লটের মাপে অটো-ফিট করা হয়েছে'); refresh(); } }).catch(function (er) { A.showToast(er.message || 'আপলোড হয়নি'); });
    }
    if (tg) {
      var s2 = SLOTS.filter(function (x) { return x.id === tg.dataset.slotActive; })[0], a2 = adFor(s2);
      if (!a2 || !a2.image_url) { tg.checked = false; A.showToast('আগে একটা ছবি আপলোড করুন'); return; }
      PD.db.from('ads').update({ is_active: tg.checked }).eq('slot_id', a2.slot_id).then(function (r) { if (ok(r)) { a2.is_active = tg.checked; A.showToast(tg.checked ? 'এড চালু হয়েছে' : 'এড বন্ধ হয়েছে'); } });
    }
  });

  /* ---------- মন্তব্য মডারেশন ---------- */
  function renderComments() {
    var list = S.comments.filter(function (c) { return c.body; });
    $('modList').innerHTML = list.length ? list.map(function (c) {
      var art = byId(S.articles, c.article_id);
      return H`<div class="mod-item"><img src="${UI.avatar(c.user_avatar)}" alt=""><div class="mod-body"><div class="mod-top"><strong>${c.user_name || 'পাঠক'}</strong><span class="mod-context">"${art ? art.title : ''}"</span><span class="mod-date">${UI.date(c.created_at)}</span></div><p class="mod-text">${c.body}</p><div class="mod-actions"><button class="btn btn-danger-ghost" data-delete-comment="${c.id}">${raw(ICON.del)} মুছে ফেলুন</button></div></div></div>`;
    }).join('') : '<div class="empty-row-note">কোনো মন্তব্য নেই।</div>';
  }
  $('modList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-delete-comment]'); if (!b) return;
    var id = b.dataset.deleteComment;
    A.showConfirm('মন্তব্য মুছে ফেলবেন?', 'এই মন্তব্যটা (এবং এর জবাবগুলো) মুছে ফেললে আর ফিরিয়ে আনা যাবে না।', function () {
      PD.db.from('comments').delete().eq('parent_comment_id', id).then(function () { return PD.db.from('comments').delete().eq('id', id); }).then(function (r) { if (ok(r)) { A.showToast('মন্তব্য মুছে ফেলা হয়েছে'); refresh(); } });
    });
  });
  (function () { var f = $('commentFilters'); if (f) f.style.display = 'none'; })();

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

  function renderAll() { renderDashboard(); renderArticles(); renderAuthors(); renderArchive(); renderIssues(); renderOrders(); renderAds(); renderComments(); renderSubs(); renderAnalytics(); if (window.AdminForms) window.AdminForms.fillSettings(); }
  function refresh() { return loadAll().then(renderAll); }
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
    refresh();
  });
})();
