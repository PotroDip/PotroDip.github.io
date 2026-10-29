/* archive.js — আর্কাইভ: পরিসংখ্যান, সর্বশেষ সংখ্যা, সব সংখ্যা, বছর অনুযায়ী ফিল্টার, স্টক-অবস্থা */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI, grid = document.getElementById('issueGrid');
  var MON = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  function msg(t) { grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:48px 0">' + t + '</p>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cut(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; t = t.slice(0, n); var k = t.lastIndexOf(' '); return (k > n * .6 ? t.slice(0, k) : t) + ' …'; }
  function when(i) { var d = new Date(i.published_at || i.created_at); return isNaN(d) ? null : d; }
  function monthYear(i) { var d = when(i); return d ? MON[d.getMonth()] + ' ' + UI.bn(d.getFullYear()) : ''; }
  var band = document.getElementById('latestIssue'), stats = document.getElementById('archiveStats');
  if (!PD || !PD.db) { if (band) band.remove(); return msg('সংযোগ করা যায়নি। ইন্টারনেট যাচাই করে আবার চেষ্টা করুন।'); }
  var db = PD.db;

  Promise.all([
    db.from('issues').select('id,issue_number,title,cover_url,published_at,created_at').order('published_at', { ascending: false }).limit(200),
    db.from('articles').select('id,issue_id,author_id,excerpt').limit(2000),
    db.from('print_issues').select('id,issue_id,teaser,in_stock,price,cover_url')
  ]).then(function (r) {
    if (r[0].error) { if (band) band.remove(); return msg('সংখ্যাগুলো লোড করা যায়নি'); }
    var issues = r[0].data || [], arts = r[1].data || [], count = {}, writers = {}, allW = {}, first = {}, print = {};
    arts.forEach(function (a) {
      if (a.author_id) allW[a.author_id] = 1;
      if (!a.issue_id) return;
      count[a.issue_id] = (count[a.issue_id] || 0) + 1;
      (writers[a.issue_id] = writers[a.issue_id] || {})[a.author_id] = 1;
      if (!first[a.issue_id] && a.excerpt) first[a.issue_id] = a.excerpt;
    });
    (r[2].data || []).forEach(function (p) { if (p.issue_id) print[p.issue_id] = p; });
    if (!issues.length) { if (band) band.remove(); stats.remove(); return msg('এখনো কোনো সংখ্যা প্রকাশিত হয়নি।'); }
    issues.sort(function (a, b) { return (when(b) || 0) - (when(a) || 0); });

    /* পরিসংখ্যান */
    stats.innerHTML = [[issues.length, 'টি সংখ্যা'], [arts.length, 'টি লেখা'], [Object.keys(allW).length, 'জন লেখক']].map(function (x) {
      return '<div><strong>' + UI.bn(x[0]) + '</strong><span>' + x[1] + '</span></div>';
    }).join('');

    /* সর্বশেষ সংখ্যা — বড় ব্যান্ড */
    var cur = issues[0], pr = print[cur.id], teaser = (pr && pr.teaser) || first[cur.id] || '';
    if (band) band.innerHTML = '<div class="ib-inner"><a class="ib-cover" href="issue.html?id=' + encodeURIComponent(cur.id) + '"><img src="' + esc(UI.cover(cur.cover_url || (pr && pr.cover_url))) + '" alt="' + esc(cur.title) + ' প্রচ্ছদ"></a><div class="ib-text"><div class="ib-kicker"><span>সর্বশেষ সংখ্যা</span>' + (cur.issue_number ? '<span class="ib-no">সংখ্যা ' + UI.bn(cur.issue_number) + '</span>' : '') + '</div><h2>' + esc(cur.title) + '</h2>' + (teaser ? '<p class="ib-teaser">' + esc(cut(teaser, 190)) + '</p>' : '') + '<div class="ib-stats"><div><strong>' + UI.bn(count[cur.id] || 0) + '</strong><span>টি লেখা</span></div><div><strong>' + UI.bn(Object.keys(writers[cur.id] || {}).length) + '</strong><span>জন লেখক</span></div>' + (when(cur) ? '<div><strong>' + MON[when(cur).getMonth()] + '</strong><span>' + UI.bn(when(cur).getFullYear()) + '</span></div>' : '') + '</div><div class="ib-actions"><a class="ib-btn primary" href="issue.html?id=' + encodeURIComponent(cur.id) + '">সংখ্যাটি পড়ুন ' + ARROW + '</a>' + (pr && pr.in_stock ? '<a class="ib-btn ghost" href="store.html">ছাপা কপি · ৳' + UI.bn(Number(pr.price)) + '</a>' : '') + '</div></div></div>';

    /* সব সংখ্যা */
    var year = function (i) { var d = when(i); return d ? String(d.getFullYear()) : ''; };
    grid.innerHTML = '';
    issues.forEach(function (i, idx) {
      var c = UI.tpl('tpl-issue'), p = print[i.id], n = count[i.id] || 0;
      c.href = 'issue.html?id=' + encodeURIComponent(i.id);
      c.dataset.year = year(i);
      UI.img(c, '.issue-cover img', UI.cover(i.cover_url || (p && p.cover_url)), i.title + ' প্রচ্ছদ');
      UI.set(c, '.issue-num-badge', 'সংখ্যা ' + UI.bn(i.issue_number || (issues.length - idx)));
      UI.set(c, '.issue-title', i.title);
      UI.set(c, '.meta-left', UI.bn(n) + 'টি লেখা');
      var md = monthYear(i); if (md) UI.set(c, '.meta-date', md); else c.querySelector('.meta-date').remove();
      var tz = c.querySelector('.meta-teaser'), tt = (p && p.teaser) || first[i.id];
      if (tt) tz.textContent = cut(tt, 110); else tz.remove();
      var st = c.querySelector('.stock-tag');
      if (!p) st.remove(); else { st.textContent = p.in_stock ? 'ছাপা কপি আছে' : 'ছাপা কপি শেষ'; st.classList.toggle('out', !p.in_stock); }
      grid.appendChild(c);
    });

    var years = [];
    issues.forEach(function (i) { var y = year(i); if (y && years.indexOf(y) < 0) years.push(y); });
    var box = document.getElementById('yearFilters'), cnt = document.getElementById('issueCount');
    box.innerHTML = '';
    ['all'].concat(years).forEach(function (y, k) {
      var b = document.createElement('button'); b.dataset.year = y; if (!k) b.className = 'active';
      b.textContent = y === 'all' ? 'সব' : UI.bn(y); box.appendChild(b);
    });
    if (years.length < 2) box.style.display = 'none';
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
