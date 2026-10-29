/* archive.js — আর্কাইভ: সব সংখ্যা, বছর অনুযায়ী ফিল্টার, স্টক-অবস্থা */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI, grid = document.getElementById('issueGrid');
  function msg(t) { grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:48px 0">' + t + '</p>'; }
  if (!PD || !PD.db) return msg('সংযোগ করা যায়নি। ইন্টারনেট যাচাই করে আবার চেষ্টা করুন।');
  var db = PD.db;

  Promise.all([
    db.from('issues').select('id,issue_number,title,cover_url,published_at,created_at').order('published_at', { ascending: false }).limit(200),
    db.from('articles').select('id,issue_id').limit(2000),
    db.from('print_issues').select('id,issue_id,teaser,in_stock')
  ]).then(function (r) {
    if (r[0].error) return msg('সংখ্যাগুলো লোড করা যায়নি');
    var issues = r[0].data || [], count = {}, print = {};
    (r[1].data || []).forEach(function (a) { if (a.issue_id) count[a.issue_id] = (count[a.issue_id] || 0) + 1; });
    (r[2].data || []).forEach(function (p) { if (p.issue_id) print[p.issue_id] = p; });
    if (!issues.length) return msg('এখনো কোনো সংখ্যা প্রকাশিত হয়নি।');

    var year = function (i) { return String(new Date(i.published_at || i.created_at).getFullYear()); };
    grid.innerHTML = '';
    issues.forEach(function (i, idx) {
      var c = UI.tpl('tpl-issue'), p = print[i.id], n = count[i.id] || 0;
      c.href = 'issue.html?id=' + encodeURIComponent(i.id);
      c.dataset.year = year(i);
      UI.img(c, '.issue-cover img', UI.cover(i.cover_url), i.title + ' প্রচ্ছদ');
      var bd = c.querySelector('.issue-badge'); if (idx !== 0 && bd) bd.remove();
      UI.set(c, '.issue-num-badge', 'সংখ্যা ' + UI.bn(i.issue_number || (issues.length - idx)));
      UI.set(c, '.issue-title', i.title);
      UI.set(c, '.meta-left', UI.bn(n) + 'টি লেখা');
      var tz = c.querySelector('.meta-teaser');
      if (p && p.teaser) tz.textContent = p.teaser; else tz.remove();
      var st = c.querySelector('.stock-tag');
      if (!p) st.remove(); else { st.textContent = p.in_stock ? 'স্টকে আছে' : 'স্টক শেষ'; st.classList.toggle('out', !p.in_stock); }
      grid.appendChild(c);
    });

    var years = [];
    issues.forEach(function (i) { var y = year(i); if (years.indexOf(y) < 0) years.push(y); });
    var box = document.getElementById('yearFilters'), cnt = document.getElementById('issueCount');
    box.innerHTML = '';
    ['all'].concat(years).forEach(function (y, k) {
      var b = document.createElement('button'); b.dataset.year = y; if (!k) b.className = 'active';
      b.textContent = y === 'all' ? 'সব' : UI.bn(y); box.appendChild(b);
    });
    function apply(y) {
      var v = 0;
      [].forEach.call(grid.children, function (c) { var ok = y === 'all' || c.dataset.year === y; c.style.display = ok ? '' : 'none'; if (ok) v++; });
      cnt.textContent = UI.bn(v) + 'টি';
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      [].forEach.call(box.children, function (c) { c.classList.remove('active'); });
      b.classList.add('active'); apply(b.dataset.year);
    });
    apply('all');
  });
})();
