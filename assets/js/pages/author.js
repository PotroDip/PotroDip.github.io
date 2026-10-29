/* author.js — লেখক প্রোফাইল: পরিচিতি, রেটিং, ফলো, লেখাগুলো ও ফিল্টার */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI, main = document.querySelector('main');
  var slug = UI.qs('slug');
  if (!slug) { location.replace('authors.html'); return; }
  function notFound(msg) {
    main.innerHTML = '<div class="wrap" style="padding:80px 0;text-align:center"><h1 style="font-size:28px;margin-bottom:12px">' + msg + '</h1><p><a href="authors.html" style="color:var(--primary);text-decoration:underline">লেখক তালিকায় ফিরে যান</a></p></div>';
  }
  if (!PD || !PD.db) return notFound('সংযোগ করা যায়নি');
  var db = PD.db, safe = function (u) { return /^https?:\/\//i.test(u || '') ? u : ''; };

  db.from('authors').select('*').eq('slug', slug).maybeSingle().then(function (r) {
    var au = r.data;
    if (r.error || !au) return notFound('লেখককে পাওয়া যায়নি');
    return db.from('articles').select('id,title,excerpt,category,cover_url,published_at,created_at').eq('author_id', au.id).order('published_at', { ascending: false }).limit(60).then(function (ar) {
      var arts = ar.data || [], ids = arts.map(function (a) { return a.id; });
      var cm = ids.length ? db.from('comments').select('article_id,rating').in('article_id', ids).not('rating', 'is', null) : Promise.resolve({ data: [] });
      return Promise.all([cm, db.rpc('author_follower_count', { p_author: au.id })]).then(function (x) { show(au, arts, x[0].data || [], x[1].data); });
    });
  });

  function show(au, arts, ratings, followers) {
    document.title = au.name + ' | পত্রদ্বীপ লেখক';
    var bc = document.querySelectorAll('.breadcrumb a');
    bc[0].href = 'index.html'; bc[1].href = 'authors.html';
    UI.set(document, '.breadcrumb .current', au.name);
    UI.img(document, '.profile-cover img', UI.cover(au.cover_url), '');
    UI.img(document, '.profile-avatar img', UI.avatar(au.image_url), au.name);
    UI.set(document, '.profile-info h1', au.name);
    UI.set(document, '.role-badge', au.role_title || 'লেখক');
    var row = document.querySelector('.profile-role-row');
    if (au.city) row.lastElementChild.textContent = au.city; else { row.querySelector('.dot-sep').remove(); row.lastElementChild.remove(); }
    var stats = document.querySelectorAll('.profile-stats span');
    stats[0].innerHTML = '<strong>' + UI.bn(arts.length) + 'টি</strong> লেখা';
    if (typeof followers === 'number') stats[1].innerHTML = '<strong>' + UI.bn(followers) + '</strong> ফলোয়ার'; else stats[1].remove();
    var socials = document.querySelectorAll('.social-btn');
    ['facebook_url', 'instagram_url', 'website_url'].forEach(function (k, i) {
      var a = socials[i], u = safe(au[k]);
      if (u) { a.href = u; a.target = '_blank'; a.rel = 'noopener'; } else a.remove();
    });
    if (!document.querySelector('.social-btn')) document.querySelector('.social-row').remove();

    var avg = Number(au.avg_rating) || 0;
    document.querySelector('.rating-ring').style.setProperty('--pct', Math.round(avg / 5 * 100));
    UI.set(document, '.rating-ring .num', avg ? UI.bn(avg.toFixed(1)) : '—');
    document.getElementById('profileStars').innerHTML = UI.starsHTML(avg);
    UI.set(document, '.rating-count', au.rating_count ? UI.bn(au.rating_count) + 'টি রেটিং' : 'এখনো কোনো রেটিং নেই');

    /* ফলো */
    var fb = document.getElementById('followBtn'), following = false;
    function paintFollow() { fb.classList.toggle('following', following); fb.textContent = following ? 'ফলো করছেন' : 'ফলো করুন'; }
    PD.ready.then(function () {
      if (!PD.user) return;
      db.from('follows').select('author_id').eq('follower_id', PD.user.id).eq('author_id', au.id).maybeSingle().then(function (r) { following = !!r.data; paintFollow(); });
    });
    fb.addEventListener('click', function () {
      if (UI.needLogin()) return;
      var q = following ? db.from('follows').delete().eq('follower_id', PD.user.id).eq('author_id', au.id) : db.from('follows').insert({ follower_id: PD.user.id, author_id: au.id });
      q.then(function (r) { if (r.error) return UI.toast(PD.msg(r.error), 1); following = !following; paintFollow(); });
    });

    /* পরিচিতি */
    var age = au.birth_date ? Math.floor((Date.now() - new Date(au.birth_date)) / 31557600000) : null;
    var facts = [['পূর্ণ নাম', au.full_name], ['পিতার নাম', au.father_name], ['জন্ম তারিখ', au.birth_date ? UI.date(au.birth_date) : ''], ['বয়স', age ? UI.bn(age) + ' বছর' : ''], ['বর্তমান ঠিকানা', au.current_address], ['শিক্ষাগত যোগ্যতা', au.education], ['পেশা', au.profession], ['লেখালেখির বয়স', au.years_writing], ['উল্লেখযোগ্য স্বীকৃতি', au.recognition]].filter(function (f) { return f[1]; });
    var dl = document.querySelector('.bio-facts dl'), secs = Array.isArray(au.bio_sections) ? au.bio_sections : [];
    facts.forEach(function (f) { var e = UI.tpl('tpl-fact'); e.querySelector('dt').textContent = f[0]; e.querySelector('dd').textContent = f[1]; dl.appendChild(e); });
    var story = document.querySelector('.bio-story');
    secs.forEach(function (s) {
      if (s.quote) { var q = UI.tpl('tpl-bioquote'); q.textContent = s.quote; story.appendChild(q); }
      else if (s.p || s.h) { var b = UI.tpl('tpl-bioblock'); b.querySelector('h4').textContent = s.h || ''; b.querySelector('p').textContent = s.p || ''; story.appendChild(b); }
    });
    if (!facts.length) document.querySelector('.bio-facts').remove();
    if (!secs.length) story.remove();
    if (!facts.length && !secs.length) { document.querySelector('.bio-panel').parentNode.querySelector('.section-head').remove(); document.querySelector('.bio-panel').remove(); }

    /* লেখাগুলো */
    var heads = document.querySelectorAll('.section-head h2');
    heads[heads.length - 1].textContent = au.name + '-এর লেখা';
    var rate = {};
    ratings.forEach(function (x) { (rate[x.article_id] = rate[x.article_id] || []).push(x.rating); });
    var grid = document.querySelector('.article-grid'), chips = document.querySelector('.filter-chips');
    function paint(cat) {
      grid.innerHTML = '';
      var list = arts.filter(function (a) { return !cat || a.category === cat; });
      if (!list.length) { grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0">এখনো কোনো লেখা প্রকাশিত হয়নি।</p>'; return; }
      list.forEach(function (a) {
        var c = UI.tpl('tpl-card'), rs = rate[a.id] || [], av = rs.length ? rs.reduce(function (s, v) { return s + v; }, 0) / rs.length : 0;
        UI.img(c, '.thumb img', UI.cover(a.cover_url), ''); UI.set(c, '.cat-badge', a.category || ''); UI.set(c, 'h3', a.title); UI.set(c, 'p', a.excerpt || '');
        c.querySelector('.stars-mini').innerHTML = av ? UI.starsHTML(av) : '';
        UI.set(c, '.card-meta > span:last-child', UI.date(a.published_at || a.created_at));
        c.addEventListener('click', function () { location.href = UI.articleUrl(a); });
        c.style.cursor = 'pointer';
        grid.appendChild(c);
      });
    }
    var cats = [];
    arts.forEach(function (a) { if (a.category && cats.indexOf(a.category) < 0) cats.push(a.category); });
    chips.innerHTML = '';
    ['সব'].concat(cats).forEach(function (t, i) { var b = document.createElement('button'); if (!i) b.className = 'active'; b.textContent = t; chips.appendChild(b); });
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      [].forEach.call(chips.children, function (c) { c.classList.remove('active'); });
      b.classList.add('active'); paint(b.textContent === 'সব' ? '' : b.textContent);
    });
    if (cats.length < 2) chips.style.display = 'none';
    paint('');
  }
})();
