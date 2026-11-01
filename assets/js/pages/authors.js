/* authors.js — লেখক তালিকা (v40): প্রিমিয়াম কার্ড, খোঁজা, সাজানো, লেখার সংখ্যা, ফলো বাটন */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI, row = document.getElementById('authors-row');
  var $ = function (i) { return document.getElementById(i); };
  var SV = function (d, w) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var IC = {
    pin: SV('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    plus: SV('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', 2.4),
    check: SV('<polyline points="20 6 9 17 4 12"/>', 2.6),
    none: SV('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', 1.6)
  };
  function skeleton() { var h = ''; for (var i = 0; i < 8; i++) h += '<div class="au-skel"></div>'; row.innerHTML = h; }
  function msg(t) { row.innerHTML = '<div class="au-empty">' + IC.none + '<p>' + t + '</p></div>'; }
  if (!PD || !PD.db) return msg('সংযোগ করা যায়নি। ইন্টারনেট যাচাই করে আবার চেষ্টা করুন।');
  var db = PD.db, ALL = [], F = {}, N = {}, sort = 'name', q = '';
  skeleton();

  function btnHTML(on) { return (on ? IC.check : IC.plus) + '<span>' + (on ? 'ফলো করছেন' : 'ফলো করুন') + '</span>'; }
  function card(u, i) {
    var c = document.createElement('article'); c.className = 'au-card'; c.style.setProperty('--i', Math.min(i, 12));
    var ban = document.createElement('div'); ban.className = 'au-banner'; ban.setAttribute('aria-hidden', 'true');
    var a = document.createElement('a'); a.className = 'au-top'; a.href = UI.authorUrl(u);
    var ring = document.createElement('span'); ring.className = 'au-ring';
    var im = document.createElement('img'); im.src = UI.avatar(u.image_url); im.alt = u.name || ''; im.loading = 'lazy'; ring.appendChild(im);
    var h = document.createElement('h3'); h.textContent = u.name || '';
    var tags = document.createElement('div'); tags.className = 'au-tags';
    if (u.role_title) { var r = document.createElement('span'); r.className = 'au-tag role'; r.textContent = u.role_title; tags.appendChild(r); }
    if (u.city) { var ct = document.createElement('span'); ct.className = 'au-tag'; ct.innerHTML = IC.pin; ct.appendChild(document.createTextNode(u.city)); tags.appendChild(ct); }
    a.appendChild(ring); a.appendChild(h); a.appendChild(tags);
    var meta = document.createElement('div'); meta.className = 'au-meta';
    var rating = Number(u.avg_rating || 0);
    meta.innerHTML = '<div><b></b><span>লেখা</span></div><div><b></b><span>রেটিং</span></div>';
    meta.children[0].firstChild.textContent = UI.bn(N[u.id] || 0);
    meta.children[1].firstChild.innerHTML = IC.star; meta.children[1].firstChild.appendChild(document.createTextNode(UI.bn(rating.toFixed(1))));
    var b = document.createElement('button'); b.type = 'button'; b.className = 'follow-btn' + (F[u.id] ? ' following' : ''); b.dataset.id = u.id; b.innerHTML = btnHTML(!!F[u.id]);
    c.appendChild(ban); c.appendChild(a); c.appendChild(meta); c.appendChild(b);
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
      b.classList.toggle('following', !on); b.innerHTML = btnHTML(!on);
    }, function (er) { b.disabled = false; UI.toast(PD.msg(er), 1); });
  });
})();
