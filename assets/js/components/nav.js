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

  /* ============ নোটিফিকেশন বেল (v38) — প্রোফাইল আইকনের বামে; শুধু লগইন করা ইউজারের জন্য ============ */
  function bell() {
    var acct = document.querySelector('.site-header .header-actions .account-btn');
    if (!acct || document.getElementById('notif-btn') || !PD || !PD.db || !PD.ready) return;
    var svg = function (d) { return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
    var IC = {
      bell: svg('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
      chat: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
      check: svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'),
      x: svg('<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'),
      star: svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
      doc: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>')
    };
    var uid = null, busy = false, lastUnread = -1, open = false;

    var btn = document.createElement('button');
    btn.id = 'notif-btn'; btn.type = 'button'; btn.className = 'icon-btn notif-btn'; btn.hidden = true;
    btn.setAttribute('aria-label', 'নোটিফিকেশন'); btn.setAttribute('title', 'নোটিফিকেশন');
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'notif-panel');
    btn.innerHTML = IC.bell + '<span class="notif-badge" hidden></span>';
    acct.parentNode.insertBefore(btn, acct);
    var badge = btn.querySelector('.notif-badge');

    var scrim = document.createElement('div'); scrim.id = 'notif-scrim';
    var panel = document.createElement('div'); panel.id = 'notif-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'নোটিফিকেশন');
    panel.innerHTML = '<div class="np-head"><div class="np-title">নোটিফিকেশন <span class="np-count" hidden></span></div><button type="button" class="np-readall" disabled>সব পড়া হয়েছে</button></div>' +
      '<div class="np-list" role="list"></div><div class="np-foot"><a href="auth.html?tab=notifications">সব নোটিফিকেশন দেখুন</a></div>';
    document.body.appendChild(scrim); document.body.appendChild(panel);
    var list = panel.querySelector('.np-list'), cnt = panel.querySelector('.np-count'), readAll = panel.querySelector('.np-readall');

    var bn = function (n) { return UI && UI.bn ? UI.bn(n) : String(n); };
    function ago(iso) {
      var m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
      if (m < 2) return 'এইমাত্র';
      if (m < 60) return bn(m) + ' মিনিট আগে';
      if (m < 1440) return bn(Math.round(m / 60)) + ' ঘণ্টা আগে';
      return bn(Math.round(m / 1440)) + ' দিন আগে';
    }
    function safeLink(u) { u = String(u || '').replace(/^\//, ''); return /^(article|author|issue|store|archive|auth)\.html(\?[\w=&%.-]*)?$/.test(u) ? u : ''; }
    function kind(t) {
      t = String(t || '');
      if (/removed|reject|delete/.test(t)) return ['x', 'bad'];
      if (/approved/.test(t)) return ['check', ''];
      if (/comment|reply/.test(t)) return ['chat', ''];
      if (/rating/.test(t)) return ['star', ''];
      return ['doc', ''];
    }
    function setBadge(n) {
      if (n > 0) { badge.hidden = false; badge.textContent = n > 9 ? bn(9) + '+' : bn(n); } else badge.hidden = true;
      cnt.hidden = n < 1; cnt.textContent = bn(n) + ' নতুন'; readAll.disabled = n < 1;
      btn.setAttribute('aria-label', n > 0 ? 'নোটিফিকেশন — ' + bn(n) + 'টি নতুন' : 'নোটিফিকেশন');
      if (lastUnread >= 0 && n > lastUnread && !open) {
        btn.classList.remove('ring'); void btn.offsetWidth; btn.classList.add('ring');
      }
      lastUnread = n;
    }
    function empty() {
      list.innerHTML = '<div class="np-empty"><div class="np-ico">' + IC.bell + '</div>এখনো কোনো নোটিফিকেশন নেই।<br>নতুন কিছু এলে এখানেই দেখতে পাবেন।</div>';
    }
    function skeleton() {
      var h = ''; for (var i = 0; i < 3; i++) h += '<div class="np-skel"><i style="width:36px;height:36px;border-radius:50%"></i><div style="flex:1"><i style="height:12px;width:70%;margin-bottom:8px"></i><i style="height:10px;width:92%"></i></div></div>';
      list.innerHTML = h;
    }
    function render(rows) {
      if (!rows.length) return empty();
      list.innerHTML = '';
      rows.forEach(function (n) {
        var k = kind(n.type), b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'listitem'); b.className = 'np-item' + (n.is_read ? '' : ' unread');
        var ico = document.createElement('div'); ico.className = 'np-ico ' + k[1]; ico.innerHTML = IC[k[0]];
        var body = document.createElement('div'); body.className = 'np-body';
        var t = document.createElement('div'); t.className = 'np-t'; t.textContent = n.title || '';
        var tx = document.createElement('div'); tx.className = 'np-b'; tx.textContent = n.body || '';
        var tm = document.createElement('div'); tm.className = 'np-time'; tm.textContent = ago(n.created_at);
        body.appendChild(t); if (n.body) body.appendChild(tx); body.appendChild(tm);
        b.appendChild(ico); b.appendChild(body);
        if (!n.is_read) { var d = document.createElement('span'); d.className = 'np-dot'; b.appendChild(d); }
        b.addEventListener('click', function () {
          var go = safeLink(n.link_url);
          var done = function () { if (go) location.href = go; else { b.classList.remove('unread'); var dd = b.querySelector('.np-dot'); if (dd) dd.remove(); fetchCount(); } };
          if (n.is_read) return done();
          PD.db.from('notifications').update({ is_read: true }).eq('id', n.id).then(done, done);
        });
        list.appendChild(b);
      });
    }
    function fetchCount() {
      if (!uid) return Promise.resolve();
      return PD.db.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('is_read', false).then(function (r) {
        if (!r.error) setBadge(r.count || 0);
      }, function () {});
    }
    function fetchList() {
      if (!uid || busy) return Promise.resolve(); busy = true;
      return PD.db.from('notifications').select('id,type,title,body,link_url,is_read,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(8).then(function (r) {
        busy = false;
        if (r.error) { list.innerHTML = '<div class="np-empty">নোটিফিকেশন আনা যায়নি — একটু পরে আবার চেষ্টা করুন।</div>'; return; }
        render(r.data || []);
      }, function () { busy = false; });
    }

    function place() {
      var r = btn.getBoundingClientRect(), hd = document.querySelector('header.site-header'), hb = hd ? hd.getBoundingClientRect().bottom : r.bottom;
      panel.style.setProperty('--np-top', Math.round(Math.max(hb, r.bottom) + 8) + 'px');
      if (window.innerWidth > 560) {
        panel.style.top = Math.round(r.bottom + 10) + 'px';
        panel.style.right = Math.max(10, Math.round(window.innerWidth - r.right - 6)) + 'px';
        panel.style.left = 'auto';
      } else { panel.style.top = ''; panel.style.right = ''; panel.style.left = ''; }
    }
    function openPanel() {
      open = true; place(); btn.setAttribute('aria-expanded', 'true');
      panel.classList.add('open'); scrim.classList.add('open'); btn.classList.remove('ring');
      skeleton(); fetchList(); fetchCount();
    }
    function closePanel() {
      open = false; btn.setAttribute('aria-expanded', 'false'); panel.classList.remove('open'); scrim.classList.remove('open');
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); open ? closePanel() : openPanel(); });
    scrim.addEventListener('click', closePanel);
    document.addEventListener('mousedown', function (e) { if (open && !panel.contains(e.target) && !btn.contains(e.target)) closePanel(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { closePanel(); btn.focus(); } });
    window.addEventListener('resize', function () { if (open) place(); });
    window.addEventListener('scroll', function () { if (open && window.innerWidth <= 560) place(); }, { passive: true });
    readAll.addEventListener('click', function () {
      readAll.disabled = true;
      PD.db.from('notifications').update({ is_read: true }).eq('user_id', uid).eq('is_read', false).then(function () { setBadge(0); fetchList(); }, function () { fetchCount(); });
    });

    PD.ready.then(function () {
      if (!PD.user) return;
      uid = PD.user.id; btn.hidden = false; fetchCount();
      /* নতুন নোটিফিকেশন এলে সাথে সাথে বেল আপডেট (রিয়েলটাইম); না চললে ট্যাবে ফিরলে ও প্রতি মিনিটে আপডেট */
      try {
        PD.db.channel('pd-notif-' + uid).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + uid }, function () {
          fetchCount(); if (open) fetchList();
        }).subscribe();
      } catch (e) {}
      document.addEventListener('visibilitychange', function () { if (!document.hidden) fetchCount(); });
      setInterval(function () { if (!document.hidden) { fetchCount(); if (open) fetchList(); } }, 60000);
    });
  }
  if (document.readyState !== 'loading') bell(); else document.addEventListener('DOMContentLoaded', bell);
})();
