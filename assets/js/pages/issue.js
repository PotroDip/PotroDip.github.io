/* issue.js — একটা সংখ্যার পাতা: প্রচ্ছদ-ব্যান্ড, সূচিপত্র, লেখা (বিভাগ ফিল্টার), লেখক */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI, id = UI.qs('id');
  var $ = function (i) { return document.getElementById(i); };
  var MON = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  var DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cut(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; t = t.slice(0, n); var k = t.lastIndexOf(' '); return (k > n * .6 ? t.slice(0, k) : t) + ' …'; }
  function num(i) { return UI.bn(i < 9 ? '0' + (i + 1) : i + 1); }

  function msg(t) {
    $('issue-hero').remove(); ['toc', 'contents', 'writers'].forEach(function (k) { var e = $(k); if (e) e.remove(); });
    var w = document.querySelector('main .wrap'), p = document.createElement('p');
    p.className = 'pd-empty'; p.style.cssText = 'padding:80px 0;text-align:center';
    p.innerHTML = esc(t) + ' <a href="archive.html" style="color:var(--primary);text-decoration:underline">আর্কাইভে ফিরুন</a>';
    w.appendChild(p);
  }
  if (!PD || !PD.db || !id) return msg('সংখ্যাটি পাওয়া যায়নি।');
  var db = PD.db;

  db.from('issues').select('*').eq('id', id).maybeSingle().then(function (r) {
    var is = r.data;
    if (r.error || !is) return msg('সংখ্যাটি পাওয়া যায়নি।');
    Promise.all([
      db.from('articles').select('id,title,excerpt,category,cover_url,author_id,published_at,created_at').eq('issue_id', id).order('published_at', { ascending: true }).limit(100),
      db.from('authors').select('id,slug,name,role_title,city,image_url').limit(300),
      db.from('print_issues').select('id,teaser,in_stock,price,cover_url').eq('issue_id', id).maybeSingle()
    ]).then(function (x) { show(is, x[0].data || [], x[1].data || [], x[2].data); });
  });

  function show(is, arts, authors, pr) {
    document.title = is.title + ' | পত্রদ্বীপ';
    $('crumb-title').textContent = is.title;
    var U = {}; authors.forEach(function (u) { U[u.id] = u; });
    var au = function (a) { return U[a.author_id] || { name: 'অজানা লেখক' }; };
    var wr = [], cats = [];
    arts.forEach(function (a) {
      if (a.author_id && U[a.author_id] && wr.indexOf(U[a.author_id]) < 0) wr.push(U[a.author_id]);
      if (a.category && cats.indexOf(a.category) < 0) cats.push(a.category);
    });
    var d = new Date(is.published_at || is.created_at), hasD = !isNaN(d);
    var teaser = (pr && pr.teaser) || (arts[0] && arts[0].excerpt) || '';

    /* প্রচ্ছদ-ব্যান্ড */
    var buy = pr ? (pr.in_stock ? '<a class="ib-btn ghost" href="store.html">ছাপা কপি কিনুন · ৳' + UI.bn(Number(pr.price)) + '</a>' : '<span class="ib-btn ghost is-off">ছাপা কপি শেষ</span>') : '';
    $('issue-hero').innerHTML = '<div class="ib-inner"><div class="ib-cover"><img src="' + esc(UI.cover(is.cover_url || (pr && pr.cover_url))) + '" alt="' + esc(is.title) + ' প্রচ্ছদ"></div><div class="ib-text"><div class="ib-kicker"><span>' + (is.issue_number ? 'সংখ্যা ' + UI.bn(is.issue_number) : 'পত্রদ্বীপ') + '</span>' + (hasD ? '<span class="ib-no">' + MON[d.getMonth()] + ' ' + UI.bn(d.getFullYear()) + '</span>' : '') + '</div><h1>' + esc(is.title) + '</h1>' + (teaser ? '<p class="ib-teaser">' + esc(cut(teaser, 220)) + '</p>' : '') + '<div class="ib-stats"><div><strong>' + UI.bn(arts.length) + '</strong><span>টি লেখা</span></div><div><strong>' + UI.bn(wr.length) + '</strong><span>জন লেখক</span></div><div><strong>' + UI.bn(cats.length) + '</strong><span>টি বিভাগ</span></div></div><div class="ib-actions">' + (arts.length ? '<a class="ib-btn primary" href="#toc">সূচিপত্র দেখুন ' + DOWN + '</a>' : '') + buy + '</div></div></div>';

    if (!arts.length) {
      ['toc', 'writers'].forEach(function (k) { $(k).remove(); });
      $('chips').remove();
      $('article-grid').innerHTML = '<p class="pd-empty" style="grid-column:1/-1;padding:30px 0">এই সংখ্যায় এখনো কোনো লেখা যোগ হয়নি।</p>';
      return;
    }

    /* সূচিপত্র */
    $('toc-note').textContent = UI.bn(arts.length) + 'টি লেখা';
    $('toc-list').innerHTML = arts.map(function (a, i) {
      return '<li><a href="' + UI.articleUrl(a) + '"><span class="toc-num">' + num(i) + '</span><span class="toc-main"><span class="toc-title">' + esc(a.title) + '</span><span class="toc-by">' + esc(au(a).name) + '</span></span>' + (a.category ? '<span class="toc-cat">' + esc(a.category) + '</span>' : '') + '<span class="toc-go">' + ARROW + '</span></a></li>';
    }).join('');

    /* লেখার কার্ড (হোমপেজের কার্ডের মতো) */
    function grid(cat) {
      var list = arts.filter(function (a) { return !cat || a.category === cat; });
      $('article-grid').innerHTML = list.map(function (a) {
        var u = au(a);
        return '<article class="article-card"><a class="ac-link" href="' + UI.articleUrl(a) + '"><div class="thumb"><img src="' + esc(UI.cover(a.cover_url)) + '" alt="" loading="lazy">' + (a.category ? '<span class="ac-cat">' + esc(a.category) + '</span>' : '') + '</div><div class="ac-body"><h3>' + esc(a.title) + '</h3><p>' + esc(cut(a.excerpt, 120)) + '</p><div class="card-meta"><img src="' + esc(UI.avatar(u.image_url)) + '" alt=""><span class="cm-name">' + esc(u.name) + '</span><span class="cm-date">' + UI.date(a.published_at || a.created_at) + '</span></div></div></a></article>';
      }).join('');
    }
    var chips = $('chips');
    if (cats.length > 1) {
      chips.innerHTML = ['সব'].concat(cats).map(function (c, i) { return '<button' + (i ? '' : ' class="active"') + '>' + esc(c) + '</button>'; }).join('');
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        [].forEach.call(chips.children, function (c) { c.classList.remove('active'); });
        b.classList.add('active'); grid(b.textContent === 'সব' ? '' : b.textContent);
      });
    } else chips.remove();
    grid('');

    /* এই সংখ্যার লেখক */
    if (!wr.length) return $('writers').remove();
    $('writer-row').innerHTML = wr.map(function (u) {
      var n = arts.filter(function (a) { return a.author_id === u.id; }).length;
      return '<a class="writer" href="' + UI.authorUrl(u) + '"><span class="w-ava"><img src="' + esc(UI.avatar(u.image_url)) + '" alt=""></span><span class="w-text"><strong>' + esc(u.name) + '</strong><span>' + esc(u.role_title || u.city || '') + (u.role_title || u.city ? ' · ' : '') + UI.bn(n) + 'টি লেখা</span></span></a>';
    }).join('');
  }
})();
