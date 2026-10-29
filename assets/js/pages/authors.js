/* authors.js — লেখক তালিকা: সব লেখক, ফলো বাটনসহ */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI, row = document.getElementById('authors-row');
  function msg(t) { row.innerHTML = '<p class="pd-empty" style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0">' + t + '</p>'; }
  if (!PD || !PD.db) return msg('সংযোগ করা যায়নি। ইন্টারনেট যাচাই করে আবার চেষ্টা করুন।');
  var db = PD.db;

  db.from('authors').select('id,slug,name,role_title,city,image_url,avg_rating').order('name', { ascending: true }).limit(300).then(function (r) {
    if (r.error) return msg('লেখকদের তালিকা লোড করা যায়নি');
    var list = r.data || [];
    if (!list.length) return msg('লেখক তালিকা শীঘ্রই আসছে।');
    PD.ready.then(function () {
      var f = PD.user ? db.from('follows').select('author_id').eq('follower_id', PD.user.id) : Promise.resolve({ data: [] });
      return f.then(function (fr) {
        var F = {}; (fr.data || []).forEach(function (x) { F[x.author_id] = 1; });
        row.innerHTML = '';
        list.forEach(function (u) {
          var c = document.createElement('div'); c.className = 'author-card';
          var a = document.createElement('a'); a.href = UI.authorUrl(u);
          var im = document.createElement('img'); im.src = UI.avatar(u.image_url); im.alt = ''; var h = document.createElement('h4'); h.textContent = u.name; a.appendChild(im); a.appendChild(h);
          var role = document.createElement('div'); role.className = 'author-role'; role.appendChild(document.createTextNode(u.role_title || ''));
          if (u.city) { var d = document.createElement('span'); d.className = 'dot-sep'; role.appendChild(d); role.appendChild(document.createTextNode(u.city)); }
          var rt = document.createElement('div'); rt.className = 'author-rating'; rt.textContent = '★ ' + UI.bn(Number(u.avg_rating || 0).toFixed(1));
          var b = document.createElement('button'); b.className = 'follow-btn' + (F[u.id] ? ' following' : ''); b.dataset.id = u.id; b.textContent = F[u.id] ? 'ফলো করছেন ✓' : 'ফলো করুন';
          c.appendChild(a); c.appendChild(role); c.appendChild(rt); c.appendChild(b); row.appendChild(c);
        });
      });
    });
  });
  row.addEventListener('click', function (e) {
    var b = e.target.closest('.follow-btn'); if (!b) return;
    if (UI.needLogin()) return;
    var on = b.classList.contains('following');
    var q = on ? db.from('follows').delete().eq('follower_id', PD.user.id).eq('author_id', b.dataset.id) : db.from('follows').insert({ follower_id: PD.user.id, author_id: b.dataset.id });
    q.then(function (r) { if (r.error) return UI.toast(PD.msg(r.error), 1); b.classList.toggle('following'); b.textContent = on ? 'ফলো করুন' : 'ফলো করছেন ✓'; });
  });
})();
