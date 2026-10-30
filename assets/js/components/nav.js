/* nav.js — সব পেজে: সার্চ-ওভারলে (ডেটাবেসে খোঁজে) ও মোবাইল মেনু */
(function() {
  'use strict';
  var PD = window.PD,
    UI = window.PDUI;
  var MARKUP = '<div aria-label="সার্চ" id="search-overlay" role="dialog"> <div class="search-top"> <div class="search-top-inner"> <div class="search-field"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><line x1="21" x2="16.65" y1="21" y2="16.65"></line></svg> <input autocomplete="off" id="search-input" placeholder="লেখার শিরোনাম বা লেখকের নাম লিখুন..." type="text"/> <button aria-label="মুছে ফেলুন" class="search-clear" id="search-clear"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" viewbox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg> </button> </div> <button aria-label="বন্ধ করুন" class="search-close" id="search-close-btn"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg> </button> </div> </div> <div class="search-body"> <div class="search-body-inner"> <div id="search-suggest"> <div class="search-suggest-label">জনপ্রিয় সার্চ</div> <div class="suggest-chips"></div> </div> <div id="search-results"></div> </div> </div> </div><div id="mobile-scrim"></div><aside aria-label="মোবাইল মেনু" id="mobile-menu"> <div class="mm-head"> <div class="mm-logo"><img src="assets/img/brand/logo.svg" alt="পত্রদ্বীপ" width="150" height="150"></div> <button aria-label="বন্ধ করুন" class="mm-close" id="mm-close-btn"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg> </button> </div> <div class="mm-body"> <button class="mm-search-trigger" id="mm-search-trigger"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><line x1="21" x2="16.65" y1="21" y2="16.65"></line></svg> লেখা বা লেখক খুঁজুন... </button> <a class="mm-link" href="index.html"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> হোম </a> <a class="mm-link" href="archive.html"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> আর্কাইভ </a> <a class="mm-link" href="authors.html"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> লেখক তালিকা </a> <a class="mm-link" href="store.html"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> সংখ্যা কিনুন </a> <div class="mm-divider"></div> <a class="mm-link" href="auth.html"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" x2="3" y1="12" y2="12"></line></svg> লগইন / প্রোফাইল </a> </div> </aside>';

  /* টপবারের তারিখ ও স্ক্রল করলে হেডারের ছায়া */
  function chrome() {
    var d = document.getElementById('tb-date');
    if (d) {
      var now = new Date(), DAY = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      d.textContent = DAY[now.getDay()] + ', ' + (UI ? UI.date(now) : now.toLocaleDateString('bn-BD'));
    }
    var h = document.querySelector('header.site-header');
    if (h) {
      var on = function () { h.classList.toggle('scrolled', window.scrollY > 40); };
      window.addEventListener('scroll', on, { passive: true }); on();
    }
  }
  if (document.readyState !== 'loading') chrome(); else document.addEventListener('DOMContentLoaded', chrome);

  function init() {
    if (document.getElementById('search-overlay') || !document.querySelector('header')) return;
    document.body.insertAdjacentHTML('beforeend', MARKUP);
    var $ = function(i) {
      return document.getElementById(i);
    };
    var overlay = $('search-overlay'),
      input = $('search-input'),
      clear = $('search-clear'),
      suggest = $('search-suggest'),
      results = $('search-results');
    var menu = $('mobile-menu'),
      scrim = $('mobile-scrim'),
      timer = 0,
      seq = 0,
      loadedChips = false;

    /* ---------- হেডারের বাটন ---------- */
    var searchBtns = [].slice.call(document.querySelectorAll('header button[aria-label="সার্চ"]'));
    var ham = document.querySelector('header .hamburger');
    /* হেডারের সার্চ বাটন মোবাইলেও দেখা যায়, তাই আলাদা মোবাইল-সার্চ বাটন লাগে না (আগে দুটো আইকন দেখাত) */

    function openSearch() {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(function() {
        input.focus();
      }, 60);
      loadChips();
    }

    function closeSearch() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    function openMenu() {
      scrim.classList.add('open');
      menu.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      scrim.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }
    searchBtns.forEach(function(b) {
      b.addEventListener('click', openSearch);
    });
    if (ham) ham.addEventListener('click', openMenu);
    $('mm-close-btn').addEventListener('click', closeMenu);
    scrim.addEventListener('click', closeMenu);
    $('mm-search-trigger').addEventListener('click', function() {
      closeMenu();
      openSearch();
    });
    $('search-close-btn').addEventListener('click', closeSearch);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (overlay.classList.contains('open')) closeSearch();
        if (menu.classList.contains('open')) closeMenu();
      }
    });
    menu.addEventListener('click', function(e) {
      if (e.target.closest('a')) closeMenu();
    });

    /* ---------- জনপ্রিয় সার্চ: আসল বিভাগ ও লেখক থেকে ---------- */
    function loadChips() {
      if (loadedChips || !PD || !PD.db) return;
      loadedChips = true;
      Promise.all([PD.db.from('articles').select('category').limit(60), PD.db.from('authors').select('name').order('avg_rating', {
        ascending: false
      }).limit(3)]).then(function(r) {
        var list = [];
        (r[0].data || []).forEach(function(a) {
          if (a.category && list.indexOf(a.category) < 0 && list.length < 4) list.push(a.category);
        });
        (r[1].data || []).forEach(function(a) {
          if (a.name && list.indexOf(a.name) < 0) list.push(a.name);
        });
        var box = suggest.querySelector('.suggest-chips');
        list.forEach(function(t) {
          var b = document.createElement('button');
          b.textContent = t;
          b.addEventListener('click', function() {
            input.value = t;
            run(t);
            input.focus();
          });
          box.appendChild(b);
        });
        if (!list.length) suggest.style.display = 'none';
      });
    }

    /* ---------- খোঁজা ---------- */
    var ICON = {
      art: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      au: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
      arrow: '<svg class="ri-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
    };

    function mark(el, text, q) {
      var i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
      if (i < 0) {
        el.textContent = text;
        return;
      }
      el.appendChild(document.createTextNode(text.slice(0, i)));
      var m = document.createElement('mark');
      m.textContent = text.slice(i, i + q.length);
      el.appendChild(m);
      el.appendChild(document.createTextNode(text.slice(i + q.length)));
    }

    function item(href, img, round, title, sub, q) {
      var a = document.createElement('a');
      a.className = 'result-item';
      a.href = href;
      var th = document.createElement('div');
      th.className = 'ri-thumb' + (round ? ' round' : '');
      var im = document.createElement('img');
      im.src = img;
      im.alt = '';
      th.appendChild(im);
      var info = document.createElement('div');
      info.className = 'ri-info';
      var t = document.createElement('div');
      t.className = 'ri-title';
      mark(t, title, q);
      var s = document.createElement('div');
      s.className = 'ri-sub';
      s.textContent = sub;
      info.appendChild(t);
      info.appendChild(s);
      a.appendChild(th);
      a.appendChild(info);
      a.insertAdjacentHTML('beforeend', ICON.arrow);
      return a;
    }

    function group(label, icon, n) {
      var g = document.createElement('div');
      g.className = 'result-group';
      var l = document.createElement('div');
      l.className = 'result-group-label';
      l.innerHTML = icon;
      l.appendChild(document.createTextNode(' ' + label + ' (' + UI.bn(n) + ')'));
      g.appendChild(l);
      return g;
    }

    function render(q, authors, arts, names) {
      results.innerHTML = '';
      if (!authors.length && !arts.length) {
        var e = document.createElement('div');
        e.className = 'search-empty';
        e.innerHTML = '<div class="se-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>';
        var p = document.createElement('p');
        p.textContent = '"' + q + '" এর সাথে মিলে যাচ্ছে এমন কিছু পাওয়া যায়নি।';
        e.appendChild(p);
        var s = document.createElement('div');
        s.className = 'se-sub';
        s.textContent = 'অন্য বানানে বা ছোট করে লিখে আবার চেষ্টা করুন।';
        e.appendChild(s);
        results.appendChild(e);
        return;
      }
      if (authors.length) {
        var g = group('লেখক', ICON.au, authors.length);
        authors.forEach(function(a) {
          var el = item(UI.authorUrl(a), UI.avatar(a.image_url), true, a.name, 'লেখক প্রোফাইল দেখুন', q);
          g.appendChild(el);
        });
        results.appendChild(g);
      }
      if (arts.length) {
        var g2 = group('লেখা', ICON.art, arts.length);
        arts.forEach(function(a) {
          g2.appendChild(item(UI.articleUrl(a), UI.cover(a.cover_url), false, a.title, (a.category || '') + ' · ' + (names[a.author_id] || ''), q));
        });
        results.appendChild(g2);
      }
    }

    function run(q) {
      q = q.trim();
      clear.classList.toggle('show', q.length > 0);
      if (!q) {
        suggest.style.display = suggest.querySelector('.suggest-chips').children.length ? 'block' : 'none';
        results.innerHTML = '';
        return;
      }
      suggest.style.display = 'none';
      if (!PD || !PD.db) return;
      var safe = q.replace(/[%,()*\\]/g, ' ').trim(),
        my = ++seq;
      if (!safe) return;
      PD.db.from('authors').select('id,slug,name,image_url').ilike('name', '%' + safe + '%').limit(5).then(function(ar) {
        var authors = ar.data || [],
          ids = authors.map(function(a) {
            return a.id;
          });
        var q1 = PD.db.from('articles').select('id,title,category,cover_url,author_id').or('title.ilike.%' + safe + '%,excerpt.ilike.%' + safe + '%').limit(8);
        var q2 = ids.length ? PD.db.from('articles').select('id,title,category,cover_url,author_id').in('author_id', ids).limit(8) : Promise.resolve({
          data: []
        });
        return Promise.all([q1, q2]).then(function(x) {
          if (my !== seq) return;
          var seen = {},
            arts = (x[0].data || []).concat(x[1].data || []).filter(function(a) {
              if (seen[a.id]) return false;
              seen[a.id] = 1;
              return true;
            }).slice(0, 10);
          var need = arts.map(function(a) {
            return a.author_id;
          }).filter(Boolean);
          return (need.length ? PD.db.from('authors').select('id,name').in('id', need) : Promise.resolve({
            data: []
          })).then(function(nr) {
            if (my !== seq) return;
            var names = {};
            (nr.data || []).forEach(function(u) {
              names[u.id] = u.name;
            });
            render(safe, authors, arts, names);
          });
        });
      });
    }
    input.addEventListener('input', function() {
      var v = this.value;
      clearTimeout(timer);
      timer = setTimeout(function() {
        run(v);
      }, 250);
    });
    clear.addEventListener('click', function() {
      input.value = '';
      run('');
      input.focus();
    });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
