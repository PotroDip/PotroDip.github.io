/* authors.js — লেখক তালিকা (v86): বক্স-ছাড়া মিনিমাল প্রোফাইল (গোল ছবি, নামের পাশে ফলো-আইকন, স্টার-লাইন), খোঁজা, সাজানো, লেখার সংখ্যা, ফলো বাটন */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI, row = document.getElementById('authors-row');
  var $ = function (i) { return document.getElementById(i); };
  var SV = function (d, w) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var IC = {
    pin: SV('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    add: SV('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>', 2),
    done: SV('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>', 2),
    none: SV('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', 1.6)
  };
  function skeleton() { var h = ''; for (var i = 0; i < 8; i++) h += '<div class="au-skel"></div>'; row.innerHTML = h; }
  function msg(t) { row.innerHTML = '<div class="au-empty">' + IC.none + '<p>' + t + '</p></div>'; }
  if (!PD || !PD.db) return msg('সংযোগ করা যায়নি। ইন্টারনেট যাচাই করে আবার চেষ্টা করুন।');
  var db = PD.db, ALL = [], F = {}, N = {}, sort = 'name', q = '';
  skeleton();

  function btnHTML(on) { return on ? IC.done : IC.add; }
  function setBtn(b, on) { b.classList.toggle('following', on); b.innerHTML = btnHTML(on); var t = on ? 'ফলো করছেন' : 'ফলো করুন'; b.title = t; b.setAttribute('aria-label', t); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  function card(u, i) {
    var url = UI.authorUrl(u);
    var c = document.createElement('article'); c.className = 'au-card'; c.style.setProperty('--i', Math.min(i, 12));
    var a = document.createElement('a'); a.className = 'au-ring'; a.href = url; a.tabIndex = -1; a.setAttribute('aria-hidden', 'true');
    var im = document.createElement('img'); im.src = UI.avatar(u.image_url); im.alt = ''; im.loading = 'lazy'; a.appendChild(im);
    /* নাম + ফলো-আইকন (পাশাপাশি) */
    var id = document.createElement('div'); id.className = 'au-id';
    var h = document.createElement('h3'), na = document.createElement('a'); na.href = url; na.textContent = u.name || ''; h.appendChild(na);
    var b = document.createElement('button'); b.type = 'button'; b.className = 'follow-btn'; b.dataset.id = u.id; setBtn(b, !!F[u.id]);
    id.appendChild(h); id.appendChild(b);
    /* গল্পকার · ঢাকা · ২টি লেখা */
    var sub = document.createElement('p'); sub.className = 'au-line';
    var parts = []; if (u.role_title) parts.push(u.role_title); if (u.city) parts.push(u.city); parts.push(UI.bn(N[u.id] || 0) + 'টি লেখা');
    parts.forEach(function (t, k) { if (k) { var d = document.createElement('i'); d.className = 'au-dot'; sub.appendChild(d); } var sp = document.createElement('span'); sp.textContent = t; sub.appendChild(sp); });
    /* স্টার-লাইন: লাইনের মাঝে ৫ তারা, ডানে মান */
    var rating = Math.max(0, Math.min(5, Number(u.avg_rating || 0))), full = Math.round(rating);
    var rt = document.createElement('div'); rt.className = 'au-rate'; rt.setAttribute('role', 'img'); rt.setAttribute('aria-label', 'রেটিং ' + UI.bn(rating.toFixed(1)) + ' / ৫');
    var st = ''; for (var k = 0; k < 5; k++) st += '<span class="' + (k < full ? 'on' : '') + '">' + STAR + '</span>';
    rt.innerHTML = '<i class="ln"></i><span class="stars">' + st + '</span><span class="rr"><i class="ln"></i><b></b></span>';
    rt.lastChild.lastChild.textContent = UI.bn(rating.toFixed(1));
    c.appendChild(a); c.appendChild(id); c.appendChild(sub); c.appendChild(rt);
    return c;
  }
  function view() {
    var t = q.trim().toLowerCase();
    var list = ALL.filter(function (u) { return !t || [u.name, u.role_title, u.city].join(' ').toLowerCase().indexOf(t) >= 0; });
    list.sort(function (x, y) {
      if (sort === 'rating') return (Number(y.avg_rating || 0) - Number(x.avg_rating || 0)) || String(x.name).localeCompare(String(y.name), 'bn');
      if (sort === 'arts') return ((N[y.id] || 0) - (N[x.id] || 0)) || String(x.name).localeCompare(String(y.name), 'bn');
      return String(x.name).localeCompare(String(y.name), 'bn');
    });
    if (!list.length) return msg(t ? '"' + q.trim().replace(/[<>&]/g, '') + '" নামে কোনো লেখক পাওয়া যায়নি — অন্য বানানে লিখে দেখুন।' : 'লেখক তালিকা শীঘ্রই আসছে।');
    row.innerHTML = ''; list.forEach(function (u, i) { row.appendChild(card(u, i)); });
  }

  Promise.all([
    db.from('authors').select('id,slug,name,role_title,city,image_url,avg_rating').order('name', { ascending: true }).limit(300),
    db.from('articles').select('author_id').eq('status', 'published').limit(3000)
  ]).then(function (x) {
    var r = x[0];
    if (r.error) return msg('লেখকদের তালিকা লোড করা যায়নি');
    ALL = r.data || [];
    if (!ALL.length) return msg('লেখক তালিকা শীঘ্রই আসছে।');
    var total = 0;
    if (!x[1].error) (x[1].data || []).forEach(function (a) { if (a.author_id) { N[a.author_id] = (N[a.author_id] || 0) + 1; total++; } });
    var st = $('au-stats'); if (st) { $('au-st-authors').textContent = UI.bn(ALL.length); $('au-st-arts').textContent = UI.bn(total); st.hidden = false; }
    return PD.ready.then(function () {
      var f = PD.user ? db.from('follows').select('author_id').eq('follower_id', PD.user.id) : Promise.resolve({ data: [] });
      return f.then(function (fr) { (fr.data || []).forEach(function (z) { F[z.author_id] = 1; }); view(); });
    });
  }, function () { msg('লেখকদের তালিকা লোড করা যায়নি'); });

  /* খোঁজা ও সাজানো */
  var inp = $('au-q'), xb = $('au-x'), tm = 0;
  if (inp) inp.addEventListener('input', function () {
    var v = this.value; xb.classList.toggle('show', v.length > 0); clearTimeout(tm);
    tm = setTimeout(function () { q = v; if (ALL.length) view(); }, 160);
  });
  if (xb) xb.addEventListener('click', function () { inp.value = ''; q = ''; xb.classList.remove('show'); if (ALL.length) view(); inp.focus(); });
  var sb = document.querySelector('.au-sort');
  if (sb) sb.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sort]'); if (!b) return;
    sort = b.dataset.sort; [].forEach.call(sb.children, function (k) { k.classList.toggle('on', k === b); }); if (ALL.length) view();
  });

  /* ফলো / আনফলো */
  row.addEventListener('click', function (e) {
    var b = e.target.closest('.follow-btn'); if (!b) return;
    if (UI.needLogin()) return;
    var on = b.classList.contains('following'), id = b.dataset.id; b.disabled = true;
    var qy = on ? db.from('follows').delete().eq('follower_id', PD.user.id).eq('author_id', id) : db.from('follows').insert({ follower_id: PD.user.id, author_id: id });
    qy.then(function (r) {
      b.disabled = false;
      if (r.error) return UI.toast(PD.msg(r.error), 1);
      if (on) delete F[id]; else F[id] = 1;
      setBtn(b, !on);
    }, function (er) { b.disabled = false; UI.toast(PD.msg(er), 1); });
  });
})();
