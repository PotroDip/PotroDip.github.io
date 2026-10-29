/* nav.js — সব পেজে: সার্চ-ওভারলে (ডেটাবেসে খোঁজে) ও মোবাইল মেনু */
(function() {
  'use strict';
  var PD = window.PD,
    UI = window.PDUI;
  var MARKUP = '<div aria-label="সার্চ" id="search-overlay" role="dialog"> <div class="search-top"> <div class="search-top-inner"> <div class="search-field"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><line x1="21" x2="16.65" y1="21" y2="16.65"></line></svg> <input autocomplete="off" id="search-input" placeholder="লেখার শিরোনাম বা লেখকের নাম লিখুন..." type="text"/> <button aria-label="মুছে ফেলুন" class="search-clear" id="search-clear"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" viewbox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg> </button> </div> <button aria-label="বন্ধ করুন" class="search-close" id="search-close-btn"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg> </button> </div> </div> <div class="search-body"> <div class="search-body-inner"> <div id="search-suggest"> <div class="search-suggest-label">জনপ্রিয় সার্চ</div> <div class="suggest-chips"></div> </div> <div id="search-results"></div> </div> </div> </div><div id="mobile-scrim"></div><aside aria-label="মোবাইল মেনু" id="mobile-menu"> <div class="mm-head"> <div class="mm-logo"> <span class="mm-logo-mark"> <svg viewbox="35 235 930 405" xmlns="http://www.w3.org/2000/svg"> <path d="M666.21,400.44c0.89-0.78,0.61-2.63-0.15-4.69c-0.91-35.03,8.36-77.78-9.86-109.59 c-19.09-33.33-71.59-33.98-104.53-28.42c-33.85,5.71-70.95,17.6-95.94,42.04c-2.5,2.45-19.61,18.68-16.62,23.81 c3.38,5.82,13.27-3.99,16.39-7.04c11.63-11.37,36.76-16.56,51.85-20.38c16.6-4.2,33.83-6.46,50.97-5.75 c35.31,1.46,67.24,14.9,73.47,52.56c0.7,4.22,1.42,11.99,2.12,21.62c-35.33-14.02-71.7-21.39-109.99-18.95 c-12.18,0.77-24.28,2.32-36.33,4.19c-2.58,0.36-3.5,0.56-4.71,0.75c-7.31,1.19-14.61,2.45-21.89,3.78 c-17.19,3.15-34.36,5.71-49.04,15.57c-11.89-8.21-24.84-13.29-37.27-12.56c-0.94-0.31-1.89-0.57-2.82-0.66 c-25.85-2.35-52.01-1.32-77.97-1.32c-12.54-0.05-25.09-0.15-37.58-0.1c-3.62,0-7.19-0.15-10.61,0.2l-1.84,4.79l-0.61,1.48 l-0.87,2.14l-1.88,4.34l-1.99,4.23l-1.53,2.96l-0.46,0.92l-4.69,20.65c-0.31-0.31-0.61-0.61-0.97-0.87 c-14.58-12.9-30.8-23.76-48.09-32.08c-7.8-3.72-16.17-6.83-24.89-9.13c-17.08-4.49-35.29-5.71-52.07-1.94 c-26.77,6.02-41.61,29.48-50.03,53.8c-0.46,0.61-0.66,1.58-0.61,2.81c-0.36,3.98,1.43,8.87,3.77,13.46 c5.25,12.34,14.58,26.42,19.99,24.17c13.67-5.81,27.54-9.08,42.48-8.26c6.78,0.41,13.57,1.48,20.09,3.52 c5.3,1.68-25.19,48.39-42.12,61.55c-8.01,6.22,17.14,45.03,22.49,40.95c34.52-26.26,71.7-49.21,104.54-77.56 c-0.92,37.38,0.97,74.3,7.24,118.72c1.33,9.18,10.15,17.85,16.63,23.81c1.27,1.17,17.29,13.41,16.42,7.04 c-8.92-62.98-9.03-110.92-4.85-166.4c0.51-6.22,1.02-12.49,1.58-18.97c0.66-7.14,1.32-14.48,2.09-22.03 c4.59-6.43,6.63-15.25,26.06-19.17c12.54,0,25.09,0,37.63,0.05c1.87,0,3.75-0.02,5.62-0.03c-5.1,10.55-8.78,21.92-11.88,31.38 c-7.43,22.65,3.15,26.44,17.56,48.07c11.67,17.5,30.37,32.86,50.66,19.5c19.95-13.14,18.2-37.59,7.66-56.06 c-3.7-6.49-34.96,25.33-41.13,19.85c2.25-5.65,8.78-23.98,11.59-29.33c6.28-11.97,15.47-26.85,30.01-29.75 c3.47-0.69,24.94,12.18,25.22,16.68c1.83,29.36-4.29,53.94-3.16,83.47c0.71,18.59,2.93,38.96,6.06,58.72 c-7.66-6.93-15.94-13.61-25.44-17.47c-13.18-5.35-25.92-1.53-38.73,2.8c-14.87,5.02-28.1,13.35-42.69,18.84l-8.45,5.6 c-1.41,0.26-7.58,5.13-8.99,5.19c-0.01-1.06,1.38-10.38,1-11.98c0.27-4.31,6.71-33.03,7.99-37.15 c2.85-11.54-38.09-15.18-39.79-8.29c-8.32,33.67,16.48,69.8,46.91,84.04c15.42,7.21,30.54,3.89,44.6-4.19 c75.36-43.33,56.41-32.54,67.22-16.84c0.94,4.87,1.91,9.68,2.93,14.32c2.12,9.65,13.43,19.81,20.9,25.58 c3.61,2.78,14.04,10.33,11.92,0.7c-6.75-30.68-10.45-61.95-10.97-93.36c-0.48-28.7,6.25-58.79,1.83-87.2 c-1.37-8.8-6.17-19.48-13.19-30.03c11.39-8.2,24.36-17.42,37.59-22.54c-0.67,25.87-1.35,51.74-2.02,77.6 c-0.36,13.12-3.85,30.31,0,43.18c3.27,10.93,14.96,23.69,24.02,30.09c41.52,4.35,76.65-44.72,77.51-45.59 c0.11,6.33-0.79,14.74-1.8,23.87c-1.22,1.19-2.34,2.41-3.49,3.81c-0.29,0.36-0.4,0.83-0.4,1.33 c-20.17,20.38-37.17,43.07-50.66,67.73c-2.59,4.78,12.04,17.29,16.79,17.51c12.08,0.57,23.62-1.22,35.63,1.22 c12.4,2.52,23.87,7.51,34.98,13.09c4.49,2.23,1.47-3.74,0.75-4.89c-2.77-4.31-7.26-8.52-11.83-11.18 c5,2.91,3.52-1.01,3.09-4.39c-0.07-0.32-0.11-0.65-0.11-0.97c-0.07-1.62-0.14-3.24-0.21-4.85c-0.11-1.94-0.18-3.88-0.29-5.82 c-0.29-4.71-0.75-9.35-1.26-14.02c-3.31-14.67-2.91-30.34-2.19-45.44c0.14-2.7,0.25-5.36,0.4-7.98 c1.29-26.71,4.38-53.14,10.46-79.2c2.23-9.63-47.56-28.37-49.07-24.92c-9.85,22.43-2.49,36.86-18.41,55.77 c-8.23,9.78-23.91,26.71-36.71,33.33c0.54-12.12,5.5-30.52,5.82-42.32c0.65-25.17,1.29-50.3,1.94-75.46 c0.06-2.2-0.61-4.5-1.71-6.79c15.16-0.73,31.31-0.27,44.91-1.14c28.39-1.8,52.35,5.01,77.23,14.65 c1.65,29.73,2.91,63.66,3,73.9c0.32,36.31-9.44,93.94-12.38,130.09c-0.53,6.54,48.59,21.34,49.93,20.11 c6.18-5.71-6.57-42.18-5.84-51.13C673.63,519.46,667.87,444.85,666.21,400.44z M156.91,473.09 c32.74-89.5-22.9-68.69-44.11-73.28c0.1-0.1,0.2-0.15,0.36-0.26c17.85-9.84,40.69-8.67,59.97-4.44 c16.01,3.52,30.8,10.25,44.47,19.02C190.46,443,177.82,455.14,156.91,473.09z M565.1,584.71c-4.03-0.93-7.98-1.4-11.94-1.65 c7.95-12.44,16.83-24.3,26.64-35.59c1.19-1.4,2.41-2.77,3.67-4.17c0.32,8.05,1.58,16.07,2.19,24.09 c0.07,1.11,0.14,2.23,0.22,3.34c0.39,7.59,0,15.24,3.31,22.18C581.45,589.53,573.47,586.65,565.1,584.71z" fill="var(--primary)"></path> </svg> </span> <span class="brand-name" style="display:block;">পত্রদ্বীপ</span> </div> <button aria-label="বন্ধ করুন" class="mm-close" id="mm-close-btn"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg> </button> </div> <div class="mm-body"> <button class="mm-search-trigger" id="mm-search-trigger"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><line x1="21" x2="16.65" y1="21" y2="16.65"></line></svg> লেখা বা লেখক খুঁজুন... </button> <a class="mm-link" href="index.html"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> হোম </a> <a class="mm-link" href="archive.html"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> আর্কাইভ </a> <a class="mm-link" href="authors.html"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> লেখক তালিকা </a> <a class="mm-link" href="store.html"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> সংখ্যা কিনুন </a> <div class="mm-divider"></div> <a class="mm-link" href="auth.html"> <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewbox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" x2="3" y1="12" y2="12"></line></svg> লগইন / প্রোফাইল </a> </div> <div class="mm-foot"> <div class="mm-theme-row"> <span>থিম</span> <button aria-label="থিম বদলান" id="mm-theme-toggle"> <svg class="icon-moon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> <svg class="icon-sun" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><line x1="12" x2="12" y1="1" y2="3"></line><line x1="12" x2="12" y1="21" y2="23"></line><line x1="4.22" x2="5.64" y1="4.22" y2="5.64"></line><line x1="18.36" x2="19.78" y1="18.36" y2="19.78"></line><line x1="1" x2="3" y1="12" y2="12"></line><line x1="21" x2="23" y1="12" y2="12"></line><line x1="4.22" x2="5.64" y1="19.78" y2="18.36"></line><line x1="18.36" x2="19.78" y1="5.64" y2="4.22"></line></svg> </button> </div> </div> </aside>';

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
    $('mm-theme-toggle').addEventListener('click', function() {
      var t = $('theme-toggle');
      if (t) t.click();
    });
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
