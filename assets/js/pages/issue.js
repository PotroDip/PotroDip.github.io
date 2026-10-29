/* issue.js — একটা সংখ্যার পাতা: প্রচ্ছদ, বিবরণ, কেনার লিংক ও সেই সংখ্যার লেখা */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI, id = UI.qs('id');
  var heroBox = document.getElementById('hero-grid'), grid = document.getElementById('article-grid');
  function msg(t) { heroBox.innerHTML = '<p class="pd-empty" style="grid-column:1/-1;padding:60px 0;text-align:center">' + t + ' <a href="archive.html" style="color:var(--primary);text-decoration:underline">আর্কাইভে ফিরুন</a></p>'; document.querySelector('.section-head').remove(); grid.remove(); }
  if (!PD || !PD.db || !id) return msg('সংখ্যাটি পাওয়া যায়নি।');
  var db = PD.db;

  db.from('issues').select('*').eq('id', id).maybeSingle().then(function (r) {
    var is = r.data;
    if (r.error || !is) return msg('সংখ্যাটি পাওয়া যায়নি।');
    Promise.all([
      db.from('articles').select('id,title,excerpt,category,cover_url,author_id,published_at,created_at').eq('issue_id', id).order('published_at', { ascending: false }).limit(100),
      db.from('authors').select('id,name,city,image_url').limit(300),
      db.from('print_issues').select('id,teaser,in_stock,price').eq('issue_id', id).maybeSingle()
    ]).then(function (x) { show(is, x[0].data || [], x[1].data || [], x[2].data); });
  });

  function show(is, arts, authors, pr) {
    document.title = is.title + ' | পত্রদ্বীপ';
    var U = {}; authors.forEach(function (u) { U[u.id] = u; });
    var buy = pr ? (pr.in_stock ? '<a href="store.html" class="read-cta">এই সংখ্যা কিনুন →</a>' : '<span class="read-cta" style="opacity:.6">স্টক শেষ</span>') : '';
    heroBox.innerHTML = '<div class="hero-media"><img alt=""></div><div class="hero-text"><span class="issue-tag"></span><h1></h1><p class="hero-excerpt"></p>' + buy + '</div>';
    var im = heroBox.querySelector('img'); im.src = UI.cover(is.cover_url); im.alt = is.title + ' প্রচ্ছদ';
    UI.set(heroBox, '.issue-tag', 'সংখ্যা ' + (is.issue_number || ''));
    UI.set(heroBox, 'h1', is.title);
    UI.set(heroBox, '.hero-excerpt', (pr && pr.teaser) || (UI.bn(arts.length) + 'টি লেখা নিয়ে এই সংখ্যা।') + (is.published_at ? ' প্রকাশ: ' + UI.date(is.published_at) + '।' : ''));
    grid.innerHTML = '';
    if (!arts.length) { grid.innerHTML = '<p class="pd-empty" style="grid-column:1/-1">এই সংখ্যায় এখনো কোনো লেখা যোগ হয়নি।</p>'; return; }
    arts.forEach(function (a) {
      var u = U[a.author_id] || { name: '' }, c = UI.tpl('tpl-card');
      UI.img(c, '.thumb img', UI.cover(a.cover_url), ''); UI.set(c, '.cat-label', a.category || ''); UI.set(c, 'h3', a.title); UI.set(c, 'p', a.excerpt || '');
      UI.img(c, '.card-meta img', UI.avatar(u.image_url), '');
      var sp = c.querySelector('.card-meta span'); sp.textContent = u.name;
      c.addEventListener('click', function () { location.href = UI.articleUrl(a); });
      grid.appendChild(c);
    });
  }
})();
