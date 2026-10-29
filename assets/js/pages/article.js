/* article.js — লেখা পড়ার পেজ: লেখা, লেখক, ছবি, শেয়ার, বুকমার্ক, রিলেটেড ও মন্তব্য */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI;
  var $ = function (i) { return document.getElementById(i); };
  var main = document.querySelector('main');

  function notFound(msg) {
    main.innerHTML = '<div class="wrap" style="padding:80px 0;text-align:center"><h1 style="font-size:28px;margin-bottom:12px">' + msg + '</h1><p><a href="index.html" style="color:var(--primary);text-decoration:underline">হোমপেজে ফিরে যান</a></p></div>';
  }
  if (!PD || !PD.db) return notFound('সংযোগ করা যায়নি। ইন্টারনেট যাচাই করে আবার চেষ্টা করুন।');

  var db = PD.db, id = UI.qs('id'), slug = UI.qs('slug');
  if (!id && !slug) return notFound('লেখাটি পাওয়া যায়নি');

  /* লেখার টেক্সট থেকে HTML বানানো (শুধু নিরাপদ নিয়মে):
     খালি লাইনে অনুচ্ছেদ আলাদা | "> " দিয়ে শুরু = উদ্ধৃতি | [[image:লিংক|ক্যাপশন]] = ছবি | [[ad]] = বিজ্ঞাপনের জায়গা */
  /* সম্পাদকের (rich text) লেখা: ছেঁকে নিয়ে দেখানো; উদ্ধৃতি = pull-quote; ৩টি অনুচ্ছেদের পরে বিজ্ঞাপন */
  function renderHtmlBody(html, ad) {
    var box = $('article-content'), src = UI.sanitize(html), wrap = document.createElement('div'), n = 0, usedAd = false;
    wrap.className = 'article-body'; box.appendChild(wrap);
    [].slice.call(src.childNodes).forEach(function (node) {
      if (node.nodeType === 3) { if (!node.nodeValue.trim()) return; var p = document.createElement('p'); p.appendChild(node); node = p; }
      if (node.tagName === 'BLOCKQUOTE') { var q = UI.tpl('tpl-quote'); q.textContent = node.textContent; node = q; }
      wrap.appendChild(node);
      if (node.tagName === 'P' && !node.classList.contains('pull-quote')) n++;
      if (ad && !usedAd && n === 3) { usedAd = true; box.appendChild(ad); wrap = document.createElement('div'); wrap.className = 'article-body'; box.appendChild(wrap); }
    });
  }

  function renderBody(text, ad) {
    var box = $('article-content'), wrap, count = 0, usedAd = false;
    function open() { if (!wrap) { wrap = document.createElement('div'); wrap.className = 'article-body'; box.appendChild(wrap); } return wrap; }
    function putAd() { if (ad && !usedAd) { usedAd = true; wrap = null; box.appendChild(ad); } }
    var blocks = String(text || '').split(/\n\s*\n/).map(function (b) { return b.trim(); }).filter(Boolean);
    var hasMarker = blocks.some(function (b) { return b === '[[ad]]'; });
    blocks.forEach(function (b) {
      var m;
      if (b === '[[ad]]') { putAd(); return; }
      if ((m = b.match(/^\[\[image:(https?:\/\/[^|\]]+)(?:\|([^\]]*))?\]\]$/))) {
        var f = UI.tpl('tpl-figure');
        f.querySelector('img').src = m[1]; f.querySelector('img').alt = m[2] || '';
        var cap = f.querySelector('figcaption');
        if (m[2]) cap.textContent = m[2]; else cap.remove();
        open().appendChild(f); return;
      }
      if (b.indexOf('> ') === 0) { var q = UI.tpl('tpl-quote'); q.textContent = b.slice(2); open().appendChild(q); return; }
      var p = document.createElement('p'); p.textContent = b; open().appendChild(p);
      count++;
      if (!hasMarker && count === 3 && blocks.length > 5) putAd();
    });
    if (ad && !usedAd && !hasMarker) { /* ছোট লেখায় বিজ্ঞাপন নয় */ }
  }

  function pickAd(ads, re) {
    return (ads || []).filter(function (x) { return x.image_url && re.test(x.slot_id || ''); })[0];
  }
  function makeAd(ads, kind) {
    var isMob = window.matchMedia && window.matchMedia('(max-width:760px)').matches;
    var a = kind === 'square' ? pickAd(ads, /square|side/i) : (pickAd(ads, /mid|article|body/i) || (isMob ? pickAd(ads, /mobile/i) : null));
    if (!a || !a.image_url) return null;
    var s = UI.tpl('tpl-ad');
    if (kind === 'square') { s.classList.remove('ad-mid'); s.classList.add('ad-square'); }
    else if (/mobile/i.test(a.slot_id || '')) s.classList.add('ad-mobile');
    s.querySelector('.ad-bg').src = a.image_url;
    ['.ad-content', '.ad-overlay'].forEach(function (q) { var e = s.querySelector(q); if (e) e.remove(); });
    if (a.link_url) { s.style.cursor = 'pointer'; s.addEventListener('click', function () { window.open(a.link_url, '_blank', 'noopener'); }); }
    return s;
  }

  var q = db.from('articles').select('*');
  (id ? q.eq('id', id) : q.eq('slug', slug)).maybeSingle().then(function (r) {
    var a = r.data;
    if (r.error || !a) return notFound('লেখাটি পাওয়া যায়নি');
    var jobs = [
      a.author_id ? db.from('authors').select('id,slug,name,city,image_url').eq('id', a.author_id).maybeSingle() : Promise.resolve({}),
      db.from('ads').select('slot_id,slot_name,image_url,link_url').eq('is_active', true),
      a.author_id ? db.from('articles').select('id,title,category,cover_url').eq('author_id', a.author_id).neq('id', a.id).order('published_at', { ascending: false }).limit(3) : Promise.resolve({ data: [] }),
      a.category ? db.from('articles').select('id,title,category,cover_url,author_id').eq('category', a.category).neq('id', a.id).order('published_at', { ascending: false }).limit(3) : Promise.resolve({ data: [] })
    ];
    return Promise.all(jobs).then(function (res) { show(a, res[0].data, res[1].data, res[2].data || [], res[3].data || []); });
  });

  function show(a, au, ads, more, rel) {
    au = au || { name: 'অজানা লেখক' };
    document.title = a.title + ' | পত্রদ্বীপ';
    var desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
    desc.content = a.excerpt || a.title;

    var bc = document.querySelectorAll('.breadcrumb a');
    if (bc[1]) { bc[1].textContent = a.category || 'লেখা'; bc[1].href = 'archive.html' + (a.category ? '?cat=' + encodeURIComponent(a.category) : ''); }
    UI.set(document, '.breadcrumb .current', a.title);
    var cv = document.querySelector('.cover-media img'); cv.src = UI.cover(a.cover_url); cv.alt = a.title;
    var badge = document.querySelector('.cover-media .cat-badge'); if (a.category) badge.textContent = a.category; else badge.remove();
    UI.set(document, '.article-head h1', a.title);

    var by = document.querySelector('.byline');
    by.href = au.slug ? UI.authorUrl(au) : '#';
    var bi = by.querySelector('.byline-info'), bimg = by.querySelector('img');
    bimg.src = UI.avatar(au.image_url); bimg.alt = au.name;
    bi.innerHTML = '';
    var st = document.createElement('strong'); st.textContent = au.name; bi.appendChild(st);
    if (au.city) { var d = document.createElement('span'); d.className = 'dot-sep'; var c = document.createElement('span'); c.style.fontWeight = '400'; c.textContent = au.city; st.appendChild(d); st.appendChild(c); }
    bi.appendChild(document.createTextNode(' ' + UI.date(a.published_at || a.created_at)));

    if (UI.isHtml(a.body)) renderHtmlBody(a.body, makeAd(ads)); else renderBody(a.body, makeAd(ads));
    db.from('article_images').select('image_url,caption,sort_order').eq('article_id', a.id).order('sort_order', { ascending: true }).then(function (g) {
      (g.data || []).forEach(function (im) {
        if (!/^https?:\/\//i.test(im.image_url || '')) return;
        var f = UI.tpl('tpl-figure'); f.querySelector('img').src = im.image_url; f.querySelector('img').alt = im.caption || '';
        var cap = f.querySelector('figcaption'); if (im.caption) cap.textContent = im.caption; else cap.remove();
        var last = $('article-content').lastElementChild; if (last && last.classList.contains('article-body')) last.appendChild(f); else { var w = document.createElement('div'); w.className = 'article-body'; w.appendChild(f); $('article-content').appendChild(w); }
      });
    });

    var tags = $('article-content').parentNode.querySelector('.article-tags'), list = [];
    /* সাইডবার/স্কোয়ার বিজ্ঞাপন: লেখা শেষ হওয়ার পরে */
    var sq = makeAd(ads, 'square');
    if (sq) tags.parentNode.insertBefore(sq, tags);
    if (a.category) list.push(a.category);
    (a.tags || []).forEach(function (t) { if (t && list.indexOf(t) < 0) list.push(t); });
    list.forEach(function (t) { var s = document.createElement('span'); s.className = 'tag-chip'; s.textContent = t; tags.appendChild(s); });
    if (!list.length) tags.remove();

    /* লেখকের আরও লেখা */
    var panel = document.querySelector('.author-more-panel');
    if (more.length) {
      var hi = panel.querySelector('.amore-heading img'); hi.src = UI.avatar(au.image_url); hi.alt = au.name;
      UI.set(panel, '.amore-title', au.name + '-এর আরও লেখা');
      var row = panel.querySelector('.amore-row');
      more.forEach(function (m) {
        var c = UI.tpl('tpl-amore'); c.href = UI.articleUrl(m);
        UI.img(c, '.amore-thumb img', UI.cover(m.cover_url), ''); UI.set(c, '.amore-cat', m.category || ''); UI.set(c, 'h4', m.title);
        row.appendChild(c);
      });
    } else panel.closest('section').remove();

    /* রিলেটেড */
    var rsec = document.querySelector('.related-grid').closest('section');
    if (rel.length) {
      var ids = rel.map(function (x) { return x.author_id; }).filter(Boolean);
      (ids.length ? db.from('authors').select('id,name,city,image_url').in('id', ids) : Promise.resolve({ data: [] })).then(function (r) {
        var map = {}; (r.data || []).forEach(function (u) { map[u.id] = u; });
        var grid = document.querySelector('.related-grid');
        rel.forEach(function (m) {
          var u = map[m.author_id] || { name: '' }, c = UI.tpl('tpl-related');
          c.href = UI.articleUrl(m);
          UI.img(c, '.thumb img', UI.cover(m.cover_url), ''); UI.set(c, '.cat-badge', m.category || ''); UI.set(c, 'h4', m.title);
          UI.img(c, '.related-meta img', UI.avatar(u.image_url), '');
          var sp = c.querySelector('.related-meta > span'); sp.innerHTML = ''; sp.appendChild(document.createTextNode(u.name));
          if (u.city) { var d = document.createElement('span'); d.className = 'dot-sep'; var cc = document.createElement('span'); cc.className = 'city'; cc.textContent = u.city; sp.appendChild(d); sp.appendChild(cc); }
          grid.appendChild(c);
        });
      });
    } else rsec.remove();

    /* শেয়ার ও বুকমার্ক */
    var url = location.href;
    $('fbBtn').addEventListener('click', function () { window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener'); });
    $('waBtn').addEventListener('click', function () { window.open('https://wa.me/?text=' + encodeURIComponent(a.title + ' ' + url), '_blank', 'noopener'); });
    var cp = $('copyLinkBtn');
    cp.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
      cp.classList.add('show'); setTimeout(function () { cp.classList.remove('show'); }, 1600);
    });
    var bk = $('bookmarkBtn');
    bk.addEventListener('click', function () {
      if (UI.needLogin()) return;
      var on = bk.classList.contains('active');
      var qq = on ? db.from('bookmarks').delete().eq('user_id', PD.user.id).eq('article_id', a.id) : db.from('bookmarks').insert({ user_id: PD.user.id, article_id: a.id });
      qq.then(function (r) { if (r.error) return UI.toast(PD.msg(r.error), 1); bk.classList.toggle('active'); UI.toast(on ? 'সেভ করা থেকে সরানো হয়েছে' : 'লেখাটি সেভ হয়েছে'); });
    });
    PD.ready.then(function () {
      if (PD.user) db.from('bookmarks').select('article_id').eq('user_id', PD.user.id).eq('article_id', a.id).maybeSingle().then(function (r) { if (r.data) bk.classList.add('active'); });
    });

    /* পড়ার সংখ্যা (একই সেশনে একবার) */
    var key = 'pd-viewed-' + a.id;
    if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); db.rpc('increment_article_view', { article_id: a.id }).then(function () {}); }

    window.PDComments.init(a.id);
  }
})();
